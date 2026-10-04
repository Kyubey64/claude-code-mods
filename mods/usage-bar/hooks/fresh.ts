import type { SessionRateLimit } from 'claude-code'

// The newest usage reading any session of this machine has seen, kept in
// $.store so idle terminals pick up what busy ones learned. `source` says
// whether real use or a ping brought it; `idlePings` counts pings in a row
// that found nothing moving.
export type Shared = {
  at: number
  rateLimits: SessionRateLimit[]
  source?: 'use' | 'ping'
  idlePings?: number
}

// An hour of 10-minute pings with nothing moving: everything is idle.
export const IDLE_PINGS = 6
// Points a window must rise by between pings to count as use elsewhere.
export const RISE_POINTS = 1

export const SHARED_KEY = 'latest'

export function asShared(value: unknown): Shared | undefined {
  const v = value as Partial<Shared> | undefined
  return typeof v?.at === 'number' && Array.isArray(v.rateLimits) ? (v as Shared) : undefined
}

// This session's own reading unless another session has a newer one.
export function pickLimits(own: SessionRateLimit[], ownAt: number, shared: Shared | undefined): SessionRateLimit[] {
  if (shared && shared.at > ownAt && shared.rateLimits.length > 0) return shared.rateLimits
  return own
}

// When the last fresh reading came in, from whichever source; 0 for never,
// so a new session with nothing recent pings at once.
export function freshest(ownAt: number, shared: Shared | undefined): number {
  return Math.max(ownAt, shared?.at ?? 0)
}

export function isPingDue(now: number, lastFresh: number, everyMs: number): boolean {
  return now - lastFresh >= everyMs
}

export function sameLimits(a: SessionRateLimit[], b: SessionRateLimit[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

// Whether any window rose by `points` or more from `before` to `after`.
export function rose(before: SessionRateLimit[], after: SessionRateLimit[], points = RISE_POINTS): boolean {
  return after.some(limit => {
    const was = before.find(old => old.kind === limit.kind)
    return was !== undefined && limit.percentUsed - was.percentUsed >= points
  })
}

// The idle-ping count after a ping: back to 0 when usage rose (someone is
// busy elsewhere), else one more than the streak the last reading carried.
export function nextIdle(last: Shared | undefined, before: SessionRateLimit[], after: SessionRateLimit[]): number {
  if (rose(before, after)) return 0
  const streak = last?.source === 'ping' ? (last.idlePings ?? 0) : 0

  return streak + 1
}

// Pings pause once a streak of them found everything idle; any real use
// (here or in another terminal) writes a `use` reading and ends the pause.
export function isPaused(shared: Shared | undefined): boolean {
  return shared?.source === 'ping' && (shared.idlePings ?? 0) >= IDLE_PINGS
}
