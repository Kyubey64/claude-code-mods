import { expect, test } from 'claude-code/testing'

import { IDLE_PINGS, asShared, freshest, isPaused, isPingDue, nextIdle, pickLimits, rose } from './fresh'
import type { Shared } from './fresh'

const MIN = 60_000
const OWN = [{ kind: 'five_hour', percentUsed: 20 }]
const OTHER = [{ kind: 'five_hour', percentUsed: 35 }]

test('another session’s newer reading wins, an older one does not', async () => {
  expect(pickLimits(OWN, 100, { at: 200, rateLimits: OTHER })).toEqual(OTHER)
  expect(pickLimits(OWN, 300, { at: 200, rateLimits: OTHER })).toEqual(OWN)
  expect(pickLimits(OWN, 100, { at: 200, rateLimits: [] })).toEqual(OWN)
  expect(pickLimits([], 0, undefined)).toEqual([])
})

test('the ping timer restarts from the freshest reading of any source', async () => {
  const start = 1_000_000_000
  // Nothing anywhere yet: ping at once.
  expect(isPingDue(start, freshest(0, undefined), 10 * MIN)).toBe(true)
  // Our own response 4 minutes ago: not yet.
  expect(isPingDue(start, freshest(start - 4 * MIN, undefined), 10 * MIN)).toBe(false)
  // Ours is 12 minutes old, but another terminal read 3 minutes ago: not yet.
  const shared = { at: start - 3 * MIN, rateLimits: OTHER }
  expect(isPingDue(start, freshest(start - 12 * MIN, shared), 10 * MIN)).toBe(false)
  // Both stale: ping.
  expect(isPingDue(start, freshest(start - 12 * MIN, { ...shared, at: start - 11 * MIN }), 10 * MIN)).toBe(true)
})

test('a stored value that is not a reading is ignored', async () => {
  expect(asShared(undefined)).toBeUndefined()
  expect(asShared({ at: 'yesterday', rateLimits: [] })).toBeUndefined()
  expect(asShared({ at: 5, rateLimits: OTHER })).toEqual({ at: 5, rateLimits: OTHER })
})

test('an hour of idle pings pauses, and rising usage keeps them going', async () => {
  const at = (n: number) => ({ kind: 'five_hour', percentUsed: n })
  let last: Shared | undefined = { at: 1, rateLimits: [at(41)], source: 'use', idlePings: 0 }
  // Six pings that find nothing moving (0.4 points of drift is not use).
  for (let i = 1; i <= IDLE_PINGS; i++) {
    expect(isPaused(last)).toBe(false)
    const idle: number = nextIdle(last, [at(41)], [at(41.4)])
    expect(idle).toBe(i)
    last = { at: i + 1, rateLimits: [at(41.4)], source: 'ping', idlePings: idle }
  }
  expect(isPaused(last)).toBe(true)

  // A rise of a point or more between pings means use elsewhere.
  expect(rose([at(41)], [at(42)])).toBe(true)
  expect(nextIdle({ at: 1, rateLimits: [], source: 'ping', idlePings: 5 }, [at(41)], [at(43)])).toBe(0)
  // A window that reset (went down) is not use.
  expect(rose([at(41)], [at(2)])).toBe(false)
  // Real use anywhere ends the pause.
  expect(isPaused({ at: 9, rateLimits: [at(45)], source: 'use', idlePings: 0 })).toBe(false)
})
