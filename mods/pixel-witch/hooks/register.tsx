import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, RenderElement, RenderInput } from 'claude-code'

import { ALIVE_MS, FIGHT, SKINS, asWorld, chaosLevel, fightPhase, leaderOf, stepWorld } from './coven'
import type { Ask, Console, World } from './coven'
import { HAND_W, REGION_H, REGION_W } from './sprites'
import type { Chaos, Mood, Skin, WitchPose } from '../types'

const isHidden = atom({ plugin: 'pixel-witch', key: 'isHidden' } as const, false)
const pose = atom({ plugin: 'pixel-witch', key: 'pose' } as const, {
  x: 4,
  up: 0,
  facing: 1,
  mood: 'wander',
  isWalking: false,
  skin: 'classic',
  isShown: false,
} as WitchPose)
// The transcript row she is drawn from, `<component>:<requestId>`.
const anchor = atom({ plugin: 'pixel-witch', key: 'anchor' } as const, null as string | null)
const chaos = atom({ plugin: 'pixel-witch', key: 'chaos' } as const, { level: 0, seed: 1 } as Chaos)

const TICK_MS = 200
const SYNC_MS = 1000
const SLEEP_AFTER_TICKS = Math.round(90_000 / TICK_MS)
// Rows the fullscreen layout keeps under the transcript (prompt, band, footer).
const BOTTOM_SLOT = 8

type OnScreen = { first: number; last: number; of: number }
type Site = { onScreen: OnScreen; seq: number }

// What she knows of the screen, from the drawings she has seen.
const sites = new Map<string, Site>()
const seqOf = new Map<string, number>()
let nextSeq = 0
let isFullscreen = false
let columns = 80
let rows = 24

// This console's place in the coven.
const coven = {
  dir: '',
  me: '',
  activeAt: 0,
  asks: [] as Ask[],
  world: undefined as World | undefined,
  isWorking: false,
}

function noteSite(key: string, onScreen: OnScreen | null | undefined) {
  if (!seqOf.has(key)) seqOf.set(key, nextSeq++)
  if (onScreen) sites.set(key, { onScreen, seq: seqOf.get(key) ?? 0 })
  else if (onScreen === null) sites.delete(key)
}

// The lowest row on screen: one cut off by the viewport's bottom edge, else
// the newest.
function pickAnchor(): string | null {
  if (!isFullscreen) return null
  let best: [string, number] | undefined
  for (const [key, row] of sites) {
    const isCut = row.onScreen.last < row.onScreen.of - 1
    const score = isCut ? Number.MAX_SAFE_INTEGER : row.seq
    if (best === undefined || score > best[1]) best = [key, score]
  }

  return best?.[0] ?? null
}

const viewRows = () => (isFullscreen ? Math.max(REGION_H, rows - BOTTOM_SLOT) : REGION_H)

// Her own region's top row from the top of the view, and the hand's height.
function handRows(at: WitchPose): number {
  const witchTop = viewRows() - at.up - REGION_H
  return Math.min(40, Math.max(5, witchTop + 3))
}

// Everything she draws over one console: the wreckage of an attack, the
// hand, and her; `floor` is the site row her feet stand on.
function overlay($: EngineInterface, e: RenderInput, at: WitchPose, wreck: Chaos, floor: number) {
  if (e.surface !== 'terminal') return []
  const { Box, Client } = $.ui.resolve(e)
  const top = floor - at.up - REGION_H
  const parts: RenderElement[] = []
  if (wreck.level > 0) {
    const height = viewRows()
    parts.push(
      <Box position="absolute" top={floor - height} left={0}>
        <Client
          key="chaos"
          module="./chaos-client.tsx"
          width={columns}
          height={height}
          props={{ columns, rows: height, level: wreck.level, seed: wreck.seed }}
        />
      </Box>,
    )
  }
  if (at.isShown && at.hand) {
    const tall = handRows(at)
    parts.push(
      <Box position="absolute" top={top - tall + 3 - at.hand.drop} left={at.x + 6}>
        <Client
          key="hand"
          module="./hand-client.tsx"
          width={HAND_W}
          height={tall}
          props={{ rows: tall, isClosed: at.hand.isClosed }}
        />
      </Box>,
    )
  }
  if (at.isShown) {
    parts.push(
      <Box position="absolute" top={top} left={at.x}>
        <Client key="witch" module="./witch-client.tsx" width={REGION_W} height={REGION_H} props={at} />
      </Box>,
    )
  }

  return parts
}

async function site($: EngineInterface, e: RenderInput, pass: () => Promise<RenderElement>) {
  const key = `${e.component}:${e.requestId}`
  const props = e.props as { onScreen?: OnScreen | null }
  noteSite(key, props.onScreen)
  if (e.viewport?.isFullscreen !== undefined) isFullscreen = e.viewport.isFullscreen
  if (e.viewport) rows = e.viewport.rows

  if ((await read($, anchor)) !== key || (await read($, isHidden))) return pass()
  const at = sites.get(key)
  const tree = await pass()
  if (at === undefined || e.surface !== 'terminal') return tree
  const parts = overlay($, e, await read($, pose), await read($, chaos), at.onScreen.last + 1)
  if (parts.length === 0) return tree
  const { Box } = $.ui.resolve(e)

  return (
    <Box flexDirection="column">
      {tree}
      {parts}
    </Box>
  )
}

function parse(text: unknown): unknown {
  try {
    return JSON.parse(String(text))
  } catch {
    return undefined
  }
}

// One heartbeat: tell the coven this console lives (and what it asked for),
// read the others, and if this console leads, move the world on a tick.
async function sync($: EngineInterface, skin: Skin | 'random'): Promise<World> {
  const now = await $.clock.now()
  if (coven.dir === '') {
    const home = (await $.env.get('USERPROFILE')) ?? (await $.env.get('HOME')) ?? '.'
    coven.dir = `${home.replace(/\\/g, '/')}/.claude/pixel-witch-coven`
    coven.me = await $.session.id()
  }
  const mine: Console = { id: coven.me, seen: now, active: coven.activeAt, asks: coven.asks }
  await $.fs.write(`${coven.dir}/consoles/${coven.me}.json`, JSON.stringify(mine))

  const consoles: Console[] = []
  for (const entry of await $.fs.list(`${coven.dir}/consoles`)) {
    if (!entry.name.endsWith('.json') || now - entry.mtimeMs > ALIVE_MS) continue
    const heard = parse(await $.fs.read(`${coven.dir}/consoles/${entry.name}`))
    if (heard && typeof (heard as Console).id === 'string') consoles.push(heard as Console)
  }

  const worldPath = `${coven.dir}/world.json`
  const stored = (await $.fs.exists(worldPath)) ? parse(await $.fs.read(worldPath)) : undefined
  let world = stored === undefined ? (coven.world ?? asWorld(undefined)) : asWorld(stored)
  if (leaderOf(consoles, now) === coven.me) {
    const next = stepWorld(world, consoles, now, Math.random, skin)
    if (JSON.stringify(next) !== JSON.stringify(world)) await $.fs.write(worldPath, JSON.stringify(next))
    world = next
  }
  coven.world = world
  coven.asks = coven.asks.filter(ask => ask.at > (world.handled[coven.me] ?? 0))

  return world
}

async function markActive($: EngineInterface) {
  coven.activeAt = await $.clock.now()
}

function isSkin(name: string): name is Skin {
  return (SKINS as string[]).includes(name)
}

export const register: Register = (on, options) => {
  const skinOption = String(options.skin ?? 'classic')
  const configSkin: Skin | 'random' = isSkin(skinOption) ? skinOption : 'random'

  let tick = 0
  let x = 4
  let up = 0
  let facing: 1 | -1 = 1
  let target = { x: 4, up: 0 }
  let pause = 0
  let isHeld = false
  let activeTools = 0
  let lastActivity = 0
  let flash: { mood: Mood; until: number } | undefined
  // Whether a witch is in this console, and which one.
  let presence: 'gone' | 'arriving' | 'here' | 'leaving' = 'gone'
  let witchId = -1
  let skin: Skin = configSkin === 'random' ? 'classic' : configSkin
  let isSolo = false
  let now = 0

  const touch = () => {
    lastActivity = tick
  }
  const startFlash = (mood: Mood, ms: number) => {
    flash = { mood, until: tick + Math.round(ms / TICK_MS) }
    touch()
  }
  const xMax = () => Math.max(0, columns - REGION_W)
  const upMax = () => (isFullscreen ? Math.max(0, rows - BOTTOM_SLOT - REGION_H) : 0)
  const clamp = (n: number, max: number) => Math.min(Math.max(0, Math.round(n)), max)

  function arrive(id: number, as: Skin) {
    witchId = id
    skin = as
    presence = 'arriving'
    target = { x: Math.floor(Math.random() * (xMax() + 1)), up: 0 }
    if (isFullscreen) {
      x = target.x
      up = upMax() + REGION_H
    } else {
      x = -REGION_W
      up = 0
    }
  }

  // What the coven's world means for this console.
  function apply(world: World) {
    const mine = world.witches.find(w => w.home === coven.me)
    const fight = world.fight
    if (mine) {
      const isHauledOff = fight?.attacker === mine.id && ['gone', 'over'].includes(fightPhase(fight, now))
      if (!isHauledOff && (presence === 'gone' || presence === 'leaving' || mine.id !== witchId)) {
        arrive(mine.id, mine.skin)
      }
      skin = mine.skin
    } else if (presence === 'here' || presence === 'arriving') {
      presence = 'leaving'
    }
  }

  function fightRole(): { phase: ReturnType<typeof fightPhase>; role: 'attacker' | 'victim'; t: number } | undefined {
    const fight = coven.world?.fight
    if (!fight || isSolo) return undefined
    const role = fight.attacker === witchId ? 'attacker' : fight.victim === witchId ? 'victim' : undefined
    if (role === undefined) return undefined

    return { phase: fightPhase(fight, now), role, t: now - fight.start }
  }

  function mood(): Mood {
    if (isHeld) return 'grabbed'
    const fight = fightRole()
    if (fight?.role === 'attacker') {
      if (fight.phase === 'cast') return 'attack'
      if (fight.phase === 'chaos') return 'cheer'
      if (fight.phase === 'hand') return 'oops'
      return 'grabbed'
    }
    if (fight?.role === 'victim' && ['cast', 'chaos', 'hand'].includes(fight.phase)) return 'scared'
    if (flash && tick < flash.until) return flash.mood
    if (activeTools > 0) return 'cast'
    if (coven.isWorking) return 'think'
    if (tick - lastActivity > SLEEP_AFTER_TICKS) return 'sleep'
    return 'wander'
  }

  function hidden(): WitchPose {
    return { x, up, facing, mood: 'wander', isWalking: false, skin, isShown: false }
  }

  function step(): WitchPose {
    tick += 1
    if (presence === 'gone') return hidden()

    if (presence === 'arriving') {
      if (isFullscreen && up > target.up) {
        up = Math.max(target.up, up - 2)
      } else if (!isFullscreen && x < target.x) {
        facing = 1
        x = Math.min(target.x, x + 3)
      } else {
        presence = 'here'
        startFlash('cheer', 1200)
      }
      return { x, up, facing, mood: 'fall', isWalking: !isFullscreen, skin, isShown: true }
    }

    if (presence === 'leaving') {
      if (isFullscreen) up += 2
      else x += 3
      if ((isFullscreen && up > upMax() + REGION_H + 2) || (!isFullscreen && x > columns)) presence = 'gone'
      return { x, up, facing: 1, mood: 'jump', isWalking: false, skin, isShown: presence !== 'gone' }
    }

    const fight = fightRole()
    if (fight?.role === 'attacker' && (fight.phase === 'hand' || fight.phase === 'yank')) {
      const reach = (fight.t - FIGHT.handStart) / (FIGHT.grabAt - FIGHT.handStart)
      const at: WitchPose = { x, up, facing, mood: mood(), isWalking: false, skin, isShown: true }
      if (fight.phase === 'hand') {
        return { ...at, hand: { drop: Math.round((1 - Math.min(1, reach)) * handRows(at)), isClosed: false } }
      }
      up += 1
      return { ...at, up, hand: { drop: 0, isClosed: true } }
    }
    if (fight?.role === 'attacker' && fight.phase !== 'cast' && fight.phase !== 'chaos') {
      presence = 'gone'
      return hidden()
    }

    x = clamp(x, xMax())
    up = clamp(up, upMax())
    const now = mood()
    const isAtTarget = x === target.x && up === target.up
    if (now !== 'wander' || isHeld) {
      return { x, up, facing, mood: now, isWalking: false, skin, isShown: true }
    }
    if (pause > 0) {
      pause -= 1
    } else if (isAtTarget) {
      pause = 10 + Math.floor(Math.random() * 30)
      // Back to the floor half the time, up the screen the rest.
      const goUp = Math.random() < 0.5 ? 0 : Math.floor(Math.random() * (upMax() + 1))
      target = { x: Math.floor(Math.random() * (xMax() + 1)), up: goUp }
    } else {
      if (target.x !== x) {
        facing = target.x > x ? 1 : -1
        x += facing
      }
      if (target.up !== up && tick % 2 === 0) up += target.up > up ? 1 : -1
    }

    return { x, up, facing, mood: now, isWalking: pause === 0 && !isAtTarget, skin, isShown: true }
  }

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'witch',
      description: 'The pixel witch: hide, show, skin <name>, summon, fight',
    })
    now = await $.clock.now()
    coven.activeAt = now

    $.clock.every(TICK_MS, () => {
      const stepped = step()
      void update($, pose, old => (JSON.stringify(old) === JSON.stringify(stepped) ? old : stepped))
      const pick = pickAnchor()
      void update($, anchor, old => (old === pick ? old : pick))
    })

    $.clock.every(SYNC_MS, () => {
      void (async () => {
        now = await $.clock.now()
        try {
          apply(await sync($, configSkin))
          isSolo = false
        } catch {
          // No shared folder: she lives in this console alone.
          isSolo = true
          if (presence === 'gone') arrive(0, skin)
        }
        const fight = coven.world?.fight
        const victim = fight && coven.world?.witches.find(w => w.id === fight.victim)
        const level = fight && victim?.home === coven.me && !isSolo ? chaosLevel(fight, now) : 0
        const rounded = Math.round(level * 20) / 20
        const seed = fight?.start ?? 1
        await update($, chaos, old => (old.level === rounded && old.seed === seed ? old : { level: rounded, seed }))
      })()
    })
    $.ui.invalidate('ui.render')

    return next(e)
  })

  on('command.run', { command: 'witch' }, async ($, e) => {
    const [verb = '', arg = ''] = e.args.trim().toLowerCase().split(/\s+/)
    const at = await $.clock.now()
    await markActive($)
    if (verb === 'skin') {
      if (!isSkin(arg)) return { text: `Skins: ${SKINS.join(', ')}.` }
      coven.asks.push({ kind: 'skin', skin: arg, at })
      skin = arg
      return { text: `The witch changes into ${arg}.` }
    }
    if (verb === 'summon' || verb === 'fight') {
      coven.asks.push({ kind: verb, at })
      return {
        text:
          verb === 'summon'
            ? 'A second witch is called to another console (needs two consoles open).'
            : 'The witches are spoiling for a fight (needs two consoles open).',
      }
    }
    const wasHidden = await read($, isHidden)
    const hide = verb === 'hide' ? true : verb === 'show' ? false : !wasHidden
    await update($, isHidden, () => hide)

    return { text: hide ? 'The witch is hidden in this console.' : 'The witch is back.' }
  })

  on('ui.message', async ($, e, next) => {
    if (e.element !== 'witch') return next(e)
    await markActive($)
    const data = e.data as { type?: string; x?: number; up?: number }
    if (data.type === 'hide') {
      isHeld = false
      await update($, isHidden, () => true)
      $.ui.toast('The witch hides in this console. /witch show brings her back.')
      return {}
    }
    if (typeof data.x === 'number') x = clamp(data.x, xMax())
    if (typeof data.up === 'number') up = clamp(data.up, upMax())
    if (data.type === 'grab' || data.type === 'drag') {
      isHeld = true
      touch()
    } else if (data.type === 'drop') {
      isHeld = false
      target = { x, up }
      pause = 15
      startFlash('huff', 2500)
    }
    const mood: Mood = isHeld ? 'grabbed' : 'huff'
    await update($, pose, old => ({ ...old, x, up, mood, isWalking: false }))

    return {}
  })

  // Typing in a console makes it the active one: the witch follows.
  on('prompt.edit', async ($, e, next) => {
    await markActive($)

    return next(e)
  })

  on('prompt.submit', async ($, e, next) => {
    await markActive($)
    coven.isWorking = true
    touch()

    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    activeTools += 1
    touch()
    try {
      const ran = await next(e)
      if (ran.deny !== undefined || ran.isError) startFlash('oops', 1500)
      return ran
    } finally {
      activeTools = Math.max(0, activeTools - 1)
    }
  })

  on('turn.complete', ($, e, next) => {
    coven.isWorking = false
    startFlash('cheer', 1800)

    return next(e)
  })

  // Fullscreen: she rides on the lowest transcript row on screen and paints
  // over the whole viewport from there.
  on('ui.render', { component: 'UserMessage' }, ($, e, next) => site($, e, () => next(e)))
  on('ui.render', { component: 'AssistantMessage' }, ($, e, next) => site($, e, () => next(e)))
  on('ui.render', { component: 'ToolUse' }, ($, e, next) => site($, e, () => next(e)))
  on('ui.render', { component: 'ToolResult' }, ($, e, next) => site($, e, () => next(e)))
  on('ui.render', { component: 'ToolGroup' }, ($, e, next) => site($, e, () => next(e)))
  on('ui.render', { component: 'CommandOutput' }, ($, e, next) => site($, e, () => next(e)))
  on('ui.render', { component: 'TurnDuration' }, ($, e, next) => site($, e, () => next(e)))
  on('ui.render', { component: 'InfoNotice' }, ($, e, next) => site($, e, () => next(e)))

  // Main screen: nothing paints outside its own row, so she gets a strip
  // above the prompt instead.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.viewport?.isFullscreen !== undefined) isFullscreen = e.viewport.isFullscreen
    columns = e.props.bodyColumns
    const isQuiet =
      isFullscreen || e.props.hasSurvey || e.props.maxRows < REGION_H || (await read($, isHidden))
    if (isQuiet || e.surface !== 'terminal') return next(e)

    const parts = overlay($, e, await read($, pose), await read($, chaos), REGION_H)
    const { Box } = $.ui.resolve(e)

    return <Box height={REGION_H}>{parts}</Box>
  })
}
