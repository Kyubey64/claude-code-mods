import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, SessionRateLimit } from 'claude-code'

import { crossed, limitName, meter, shortModel, span, statusLine, tokens } from './format'
import type { Extras } from './format'
import { PINGS_OFF_KEY, SHARED_KEY, asShared, freshest, isPaused, isPingDue, nextIdle, pickLimits, sameLimits } from './fresh'
import type { Shared } from './fresh'
import { addNote, agentRows, clock, levelColor, modeFrom, restOfHint, statusMark } from './panel'
import type { Hud } from '../types'

const PANE = 'session-hud'
const REFRESH_MS = 30_000
const PANEL_MS = 1000
const PUSH_GAP_MS = 15_000

const hud = atom({ plugin: 'usage-bar', key: 'hud' } as const, {
  limits: [],
  mode: 'default',
  modes: [],
  isWorking: false,
  agents: [],
  notes: [],
} as Hud)

const extras: Extras = {}
const warned = new Map<string, number>()
const ping = { isOn: true, everyMs: 10 * 60_000, isRunning: false }
// When this session last got usage figures of its own, what brought them (a
// model response is `use`), and the idle-ping streak they carry.
let ownAt = 0
let ownSource: 'use' | 'ping' = 'use'
let ownIdle = 0
let pushedAt = 0
let pushed: SessionRateLimit[] = []

// The panel: whether it is docked beside the transcript (then the prompt's
// footer lines and toasts move into it), and what it shows.
const panel = { isDocked: false, view: undefined as Hud | undefined }
// Whether the pings are off in every console, as the store last said.
let arePingsOff = false
let pending: Partial<Hud> = {}
let notes: Hud['notes'] = []
let agentStatus = new Map<string, string>()

async function notify($: EngineInterface, text: string, from?: string) {
  if (panel.isDocked) {
    notes = addNote(notes, { at: clock(await $.clock.now()), text, ...(from ? { from } : {}) })
  } else {
    $.ui.toast(text, { timeoutMs: 8000 })
  }
}

// Reads the figures, shares this session's, and updates the line or the
// panel; resolves the reading the store held and when the freshest reading
// from any source came in.
async function refresh($: EngineInterface): Promise<{ shared: Shared | undefined; lastFresh: number }> {
  const [usage, now, model, stored, off] = await Promise.all([
    $.session.usage(),
    $.clock.now(),
    $.session.model(),
    $.store.get(SHARED_KEY),
    $.store.get(PINGS_OFF_KEY),
  ])
  arePingsOff = off === true
  const shared = asShared(stored)
  extras.model = model
  extras.startedAt = usage.startedAt

  const own = usage.rateLimits
  const isNewer = ownAt > (shared?.at ?? 0)
  const isWorthWriting = ownAt - pushedAt >= PUSH_GAP_MS || !sameLimits(own, pushed)
  if (own.length > 0 && isNewer && ownAt > pushedAt && isWorthWriting) {
    await $.store.set(SHARED_KEY, { at: ownAt, rateLimits: own, source: ownSource, idlePings: ownIdle })
    pushedAt = ownAt
    pushed = own
  }

  const rateLimits = pickLimits(own, ownAt, shared)
  const latest: Shared | undefined = isNewer
    ? { at: ownAt, rateLimits: own, source: ownSource, idlePings: ownIdle }
    : shared
  const isIdle = ping.isOn && !arePingsOff && isPaused(latest)
  extras.note = arePingsOff ? 'pings off' : isIdle ? 'ping paused (idle)' : undefined
  $.ui.status(panel.isDocked ? undefined : statusLine({ ...usage, rateLimits }, extras, now))

  const fromElsewhere = !isNewer && shared !== undefined && shared.at > ownAt
  pending = {
    ...pending,
    context: usage.context,
    limits: rateLimits.map(limit => ({
      name: limitName(limit.kind),
      percent: limit.percentUsed,
      ...(limit.resetsAt ? { resetsIn: span(Date.parse(limit.resetsAt) - now) } : {}),
    })),
    limitsNote: arePingsOff
      ? 'pings off in every console'
      : isIdle
      ? 'pings paused: everything idle'
      : fromElsewhere
        ? `from another console ${span(now - (shared?.at ?? now))} ago`
        : undefined,
    model: shortModel(model),
    effort: extras.effort === undefined ? undefined : String(extras.effort),
    branch: extras.branch,
    uptime: span(now - usage.startedAt),
  }

  const ctx = usage.context.percent
  const ctxStep = ctx === undefined ? undefined : crossed(warned, 'context', ctx)
  if (ctxStep !== undefined) await notify($, `Context is ${ctx}% full`)
  for (const limit of rateLimits) {
    const step = crossed(warned, limit.kind, limit.percentUsed)
    if (step !== undefined) await notify($, `${limitName(limit.kind)} usage limit at ${limit.percentUsed}%`)
  }

  return { shared: latest, lastFresh: freshest(ownAt, shared) }
}

// One tiny request to the cheapest model, for the usage figures its response
// carries; the before and after readings, or undefined when it went
// unanswered. A ping someone asked for starts the idle streak over.
async function sendPing($: EngineInterface, isAsked: boolean) {
  if (ping.isRunning) return undefined
  ping.isRunning = true
  try {
    const last = asShared(await $.store.get(SHARED_KEY))
    const before = pickLimits((await $.session.usage()).rateLimits, ownAt, last)
    const reply = await $.model.complete({
      model: 'haiku',
      prompt: 'Reply with the single word: ok',
      maxTokens: 5,
      timeoutMs: 30_000,
    })
    if (!reply.isAnswered) return undefined
    const after = (await $.session.usage()).rateLimits
    ownAt = await $.clock.now()
    ownSource = 'ping'
    ownIdle = isAsked ? 0 : nextIdle(last, before, after)
    await refresh($)

    return { before, after }
  } finally {
    ping.isRunning = false
  }
}

async function tick($: EngineInterface) {
  const { shared, lastFresh } = await refresh($)
  if (!ping.isOn || arePingsOff || isPaused(shared)) return
  if (isPingDue(await $.clock.now(), lastFresh, ping.everyMs)) await sendPing($, false)
}

async function readBranch($: EngineInterface) {
  const cwd = await $.session.cwd()
  const ran = await $.process.run(['git', 'rev-parse', '--abbrev-ref', 'HEAD'], { cwd, timeoutMs: 3000 })
  extras.branch = ran.exitCode === 0 ? ran.stdout.trim() || undefined : undefined
}

// The agents of this session, with a note when one finishes.
async function readAgents($: EngineInterface) {
  const list = await $.agent.list()
  for (const agent of list) {
    const was = agentStatus.get(agent.id)
    if (was === 'running' && agent.status !== 'running') {
      await notify($, `Agent ${agent.status}: ${agent.description}`, agent.type)
    }
  }
  agentStatus = new Map(list.map(agent => [agent.id, agent.status]))
  pending = {
    ...pending,
    agents: list.map(agent => ({ id: agent.id, label: agent.description, type: agent.type, status: agent.status })),
  }
}

// Writes what changed to the panel's state, which redraws it.
async function publish($: EngineInterface) {
  await update($, hud, old => {
    const next: Hud = { ...old, ...pending, notes }
    return JSON.stringify(next) === JSON.stringify(old) ? old : next
  })
}

// Turns the automatic pings off or on in every console.
async function setPingsOff($: EngineInterface, isOff: boolean) {
  await $.store.set(PINGS_OFF_KEY, isOff)
  arePingsOff = isOff
  await refresh($).catch(() => undefined)
  await publish($).catch(() => undefined)
}

function describe(limits: SessionRateLimit[]): string {
  return limits.map(limit => `${limitName(limit.kind)} ${limit.percentUsed}%`).join(', ') || 'none'
}

export const register: Register = (on, options) => {
  ping.isOn = options.ping !== false
  const minutes = Number(options.pingMinutes ?? 10)
  ping.everyMs = Math.max(1, Number.isFinite(minutes) ? minutes : 10) * 60_000

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'usage-ping',
      description: 'Ping for fresh usage now; `off` / `on` stops or resumes automatic pings in every console',
    })
    await $.command.register({ name: 'hud', description: 'Open the session panel' })
    await readBranch($).catch(() => undefined)
    await refresh($)
    $.clock.every(REFRESH_MS, () => void tick($))
    $.clock.every(PANEL_MS, () => {
      void (async () => {
        await readAgents($).catch(() => undefined)
        await publish($)
      })()
    })
    void $.ui.open({ id: PANE, title: 'Session' })

    return next(e)
  })

  on('command.run', { command: 'hud' }, async $ => {
    const opened = await $.ui.open({ id: PANE, title: 'Session' })

    return { text: opened.isPlaced ? 'Session panel open.' : `Session panel waits: ${opened.reason}` }
  })

  on('command.run', { command: 'usage-ping' }, async ($, e) => {
    const verb = e.args.trim().toLowerCase()
    if (verb === 'off' || verb === 'on') {
      await setPingsOff($, verb === 'off')
      return {
        text:
          verb === 'off'
            ? 'Automatic usage pings are off in every console. `/usage-ping on` turns them back on.'
            : 'Automatic usage pings are on again in every console.',
      }
    }
    const pinged = await sendPing($, true)
    if (pinged === undefined) return { text: 'Usage ping got no answer (or one is already running).' }
    const moved = sameLimits(pinged.before, pinged.after) ? 'unchanged' : 'updated'

    return { text: `Usage ping ${moved}: before ${describe(pinged.before)}; after ${describe(pinged.after)}.` }
  })

  // Every model response carries fresh usage figures; the main thread's
  // request also says the session's effort.
  on('turn.step', async function* ($, e, next) {
    if (e.agentId === undefined) extras.effort = e.effort
    const response = yield* next(e)
    ownAt = await $.clock.now()
    ownSource = 'use'
    ownIdle = 0

    return response
  })

  on('session.measure', async ($, e, next) => {
    await refresh($)

    return next(e)
  })

  on('prompt.submit', ($, e, next) => {
    pending = { ...pending, isWorking: true }

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    pending = { ...pending, isWorking: false }
    await readBranch($).catch(() => undefined)
    await refresh($)

    return next(e)
  })

  // Every plugin's toast lands in the panel while it is docked.
  on('ui.toast', async ($, e, next) => {
    if (!panel.isDocked) return next(e)
    notes = addNote(notes, { at: clock(await $.clock.now()), text: e.text, from: next.origin.plugin })

    return { value: undefined }
  })

  on('ui.close', ($, e, next) => {
    if (e.id === PANE) {
      panel.isDocked = false
      void refresh($)
    }

    return next(e)
  })

  // The prompt's footer: its hint line (the mode pill, shortcuts) and mode
  // labels move into the panel while it is docked, so the prompt sits last.
  on('ui.render', { component: 'PromptHint' }, ($, e, next) => {
    pending = { ...pending, mode: modeFrom(e.props.hint) ?? 'default', hint: restOfHint(e.props.hint) }
    if (!panel.isDocked) return next(e)

    return next({ ...e, props: { ...e.props, hint: '' } })
  })

  on('ui.render', { component: 'SessionMode' }, ($, e, next) => {
    pending = { ...pending, modes: [...e.props.modes] }
    if (!panel.isDocked) return next(e)

    return next({ ...e, props: { ...e.props, modes: [] } })
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const wasDocked = panel.isDocked
    panel.isDocked = e.props.placement === 'dock'
    if (panel.isDocked) $.ui.status(undefined)
    if (wasDocked !== panel.isDocked) $.ui.invalidate('ui.render')
    const { Box, Text, Button } = $.ui.resolve(e)
    const view = await read($, hud)
    const width = Math.max(10, e.props.bodyColumns - 22)
    const bar = Math.max(6, Math.min(20, width))
    const head = (title: string) => (
      <Text bold color="#c9b3ff">
        {title}
      </Text>
    )
    const row = (label: string, value: string, color?: string) => (
      <Box flexDirection="row">
        <Box width={9}>
          <Text dimColor>{label}</Text>
        </Box>
        {color === undefined ? <Text wrap="truncate">{value}</Text> : <Text color={color} wrap="truncate">{value}</Text>}
      </Box>
    )
    const gauge = (label: string, percent: number, detail?: string) => (
      <Box flexDirection="column">
        {row(label, `${meter(percent, bar)} ${percent}%`, levelColor(percent))}
        {detail === undefined ? null : row('', detail)}
      </Box>
    )
    const ctx = view.context
    const agents = agentRows(view.agents)
    const running = view.agents.filter(a => a.status === 'running').length

    return (
      <Box flexDirection="column">
        {head('USAGE')}
        {ctx?.percent !== undefined && ctx.tokens !== undefined
          ? gauge('Context', ctx.percent, `${tokens(ctx.tokens)} / ${tokens(ctx.window)}`)
          : row('Context', ctx ? `– / ${tokens(ctx.window)}` : '–')}
        {view.limits.map(limit =>
          gauge(limit.name === 'wk' ? 'Weekly' : limit.name === '5h' ? '5-hour' : limit.name, limit.percent,
            limit.resetsIn ? `resets in ${limit.resetsIn}` : undefined),
        )}
        {view.limits.length === 0 ? row('Limits', 'after the first reply') : null}
        {view.limitsNote ? <Text dimColor>{view.limitsNote}</Text> : null}
        <Text> </Text>
        {head('SESSION')}
        {row('Model', view.model ? `${view.model}${view.effort ? ` · ${view.effort}` : ''}` : '–')}
        {row('Mode', view.mode, view.mode === 'default' ? undefined : '#ffb347')}
        {view.modes.length > 0 ? row('', view.modes.join(' & ')) : null}
        {view.branch ? row('Branch', view.branch) : null}
        {row('Uptime', view.uptime ?? '–')}
        {row('Status', view.isWorking ? 'working…' : 'idle', view.isWorking ? '#7af6ff' : undefined)}
        <Text> </Text>
        {head(`AGENTS${running > 0 ? ` (${running} running)` : ''}`)}
        {agents.length === 0 ? <Text dimColor>none</Text> : null}
        {agents.map(agent => (
          <Box flexDirection="row">
            <Text color={agent.status === 'running' ? '#7af6ff' : agent.status === 'completed' ? '#7ee08a' : '#ff5f6d'}>
              {statusMark(agent.status)}{' '}
            </Text>
            <Text wrap="truncate">
              {agent.type} · {agent.label}
            </Text>
          </Box>
        ))}
        <Text> </Text>
        <Box flexDirection="row">
          {head('NOTIFICATIONS ')}
          {view.notes.length > 0 ? (
            <Button
              key="clear"
              label="clear"
              plain
              onPress={() => {
                notes = []
                void publish($)
              }}
            />
          ) : null}
        </Box>
        {view.notes.length === 0 ? <Text dimColor>none</Text> : null}
        {[...view.notes].reverse().slice(0, 12).map(note => (
          <Box flexDirection="row">
            <Text dimColor>{note.at} </Text>
            <Text wrap="wrap">
              {note.from ? `${note.from}: ` : ''}
              {note.text}
            </Text>
          </Box>
        ))}
        {view.hint ? <Text> </Text> : null}
        {view.hint ? <Text dimColor wrap="wrap">{view.hint}</Text> : null}
        <Text> </Text>
        <Box flexDirection="row">
          <Button key="ping" label="ping usage now" onPress={() => void sendPing($, true)} />
          <Text> </Text>
          <Button
            key="pings"
            label={arePingsOff ? 'turn pings on' : 'turn pings off'}
            onPress={() => void setPingsOff($, !arePingsOff)}
          />
        </Box>
      </Box>
    )
  })
}
