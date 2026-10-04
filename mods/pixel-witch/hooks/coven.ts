// The coven: every console running the witch shares one world through files
// in a folder all of them read. Each console writes its own heartbeat; the
// living console with the smallest id leads and alone writes the world:
// which witch lives in which console, and any fight under way.

import type { Skin } from '../types'

export const SKINS: Skin[] = ['classic', 'starlight', 'moonbroom', 'bluebell', 'goldie']

export type Ask = { kind: 'summon' | 'fight' | 'skin'; skin?: Skin; at: number }

export type Console = { id: string; seen: number; active: number; asks?: Ask[] }

export type Witch = { id: number; skin: Skin; home: string; since: number; leaveAt?: number }

export type Fight = { attacker: number; victim: number; start: number }

// witches[0] follows the person from console to console; a second one, when
// there is one, keeps to another console.
export type World = {
  witches: Witch[]
  fight?: Fight
  nextId: number
  handled: Record<string, number>
}

export const ALIVE_MS = 6000
// Per leader tick (one a second): a second witch drops by about every seven
// minutes while two consoles are open, and two witches fall out about once in
// ten minutes together.
export const SUMMON_CHANCE = 1 / 420
export const FIGHT_CHANCE = 1 / 600
export const VISIT_MS: [number, number] = [5 * 60_000, 15 * 60_000]

// A fight, in milliseconds from its start.
export const FIGHT = {
  castEnd: 3000, // the attacker winds up a spell in her console
  chaosFull: 8000, // the victim's console is wrecked by here
  handStart: 12_000, // a hand reaches down for the attacker
  grabAt: 14_500, // and grabs her: the wreckage clears
  removeAt: 18_000, // she is hauled off-screen
  newAt: 20_000, // a new witch drops into her console
}

export type FightPhase = 'cast' | 'chaos' | 'hand' | 'yank' | 'gone' | 'over'

export function fightPhase(fight: Fight, now: number): FightPhase {
  const t = now - fight.start
  if (t < FIGHT.castEnd) return 'cast'
  if (t < FIGHT.handStart) return 'chaos'
  if (t < FIGHT.grabAt) return 'hand'
  if (t < FIGHT.removeAt) return 'yank'
  if (t < FIGHT.newAt) return 'gone'
  return 'over'
}

// How wrecked the victim's console is, 0 to 1.
export function chaosLevel(fight: Fight, now: number): number {
  const t = now - fight.start
  if (t < FIGHT.castEnd) return 0
  if (t < FIGHT.chaosFull) return (t - FIGHT.castEnd) / (FIGHT.chaosFull - FIGHT.castEnd)
  if (t < FIGHT.grabAt) return 1
  if (t < FIGHT.grabAt + 1000) return 1 - (t - FIGHT.grabAt) / 1000

  return 0
}

export function emptyWorld(): World {
  return { witches: [], nextId: 1, handled: {} }
}

export function asWorld(value: unknown): World {
  const v = value as Partial<World> | undefined
  if (!v || !Array.isArray(v.witches) || typeof v.nextId !== 'number') return emptyWorld()
  return { witches: v.witches, fight: v.fight, nextId: v.nextId, handled: v.handled ?? {} }
}

export function alive(consoles: Console[], now: number): Console[] {
  return consoles.filter(c => now - c.seen < ALIVE_MS)
}

export function leaderOf(consoles: Console[], now: number): string | undefined {
  return alive(consoles, now)
    .map(c => c.id)
    .sort()[0]
}

function pick<T>(list: T[], rand: () => number): T | undefined {
  return list[Math.floor(rand() * list.length)]
}

function otherSkin(not: Skin | undefined, rand: () => number): Skin {
  return pick(
    SKINS.filter(s => s !== not),
    rand,
  ) ?? 'classic'
}

// One leader tick: the world as it stands after the consoles' heartbeats,
// their asks, the clock and the dice.
export function stepWorld(
  before: World,
  consoles: Console[],
  now: number,
  rand: () => number,
  skin: Skin | 'random',
): World {
  const living = alive(consoles, now)
  if (living.length === 0) return before
  const world: World = {
    ...before,
    witches: before.witches.map(w => ({ ...w })),
    handled: { ...before.handled },
  }
  const isAlive = (id: string) => living.some(c => c.id === id)
  const active = [...living].sort((a, b) => b.active - a.active)[0]
  if (active === undefined) return before
  const spawn = (home: string, skinOf: Skin, leaveAt?: number): Witch => ({
    id: world.nextId++,
    skin: skinOf,
    home,
    since: now,
    ...(leaveAt === undefined ? {} : { leaveAt }),
  })
  const firstSkin = skin === 'random' ? otherSkin(undefined, rand) : skin
  const visitEnd = () => now + VISIT_MS[0] + rand() * (VISIT_MS[1] - VISIT_MS[0])
  const startFight = () => {
    const [a, b] = world.witches
    if (!a || !b || world.fight) return
    const attackerFirst = rand() < 0.5
    world.fight = { attacker: (attackerFirst ? a : b).id, victim: (attackerFirst ? b : a).id, start: now }
  }
  const summon = () => {
    const follower = world.witches[0]
    if (!follower || world.witches.length > 1) return
    const home = pick(
      living.filter(c => c.id !== follower.home),
      rand,
    )
    if (home) world.witches.push(spawn(home.id, otherSkin(follower.skin, rand), visitEnd()))
  }

  // What the consoles asked for since the last tick.
  for (const c of living) {
    for (const ask of c.asks ?? []) {
      if (ask.at <= (world.handled[c.id] ?? 0)) continue
      world.handled[c.id] = ask.at
      if (ask.kind === 'skin' && ask.skin && world.witches[0]) world.witches[0].skin = ask.skin
      if (ask.kind === 'summon') summon()
      if (ask.kind === 'fight') {
        if (world.witches.length < 2) summon()
        startFight()
      }
    }
  }

  if (world.witches.length === 0) world.witches.push(spawn(active.id, firstSkin))

  if (world.fight) {
    const fight = world.fight
    if (fightPhase(fight, now) === 'over') {
      // The attacker is gone; a new witch takes her place in her console.
      const at = world.witches.findIndex(w => w.id === fight.attacker)
      const old = world.witches[at]
      if (old) {
        const home = isAlive(old.home) ? old.home : active.id
        const fresh = spawn(home, otherSkin(old.skin, rand), at === 0 ? undefined : visitEnd())
        world.witches[at] = fresh
      }
      world.fight = undefined
    }

    return world
  }

  // A witch whose console closed: the follower goes to the active one, a
  // visitor to some other console or away.
  const follower = world.witches[0]
  if (follower && !isAlive(follower.home)) {
    follower.home = active.id
    follower.since = now
  }
  const visitor = world.witches[1]
  if (visitor) {
    const elsewhere = living.filter(c => c.id !== world.witches[0]?.home)
    const isOver = visitor.leaveAt !== undefined && now >= visitor.leaveAt
    if (isOver || elsewhere.length === 0) {
      world.witches.splice(1, 1)
    } else if (!isAlive(visitor.home) || visitor.home === world.witches[0]?.home) {
      visitor.home = (pick(elsewhere, rand) ?? elsewhere[0])?.id ?? visitor.home
      visitor.since = now
    }
  }

  // The follower goes where the person is; if the visitor lives there, they
  // trade consoles.
  const lead = world.witches[0]
  if (lead && lead.home !== active.id) {
    const guest = world.witches[1]
    if (guest && guest.home === active.id) {
      guest.home = lead.home
      guest.since = now
    }
    lead.home = active.id
    lead.since = now
  }

  if (world.witches.length === 1 && living.length >= 2 && rand() < SUMMON_CHANCE) summon()
  else if (world.witches.length === 2 && rand() < FIGHT_CHANCE) startFight()

  return world
}
