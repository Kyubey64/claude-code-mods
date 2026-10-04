import { expect, test } from 'claude-code/testing'

import { FIGHT, chaosLevel, emptyWorld, fightPhase, leaderOf, stepWorld } from './coven'
import type { Console, World } from './coven'

const T = 1_000_000
const never = () => 0.99 // dice that never roll a visit or a fight
const con = (id: string, active: number, extra: Partial<Console> = {}): Console => ({
  id,
  seen: T,
  active,
  ...extra,
})

test('the first tick puts the witch in the console used last', async () => {
  const world = stepWorld(emptyWorld(), [con('a', 10), con('b', 20)], T, never, 'starlight')
  expect(world.witches).toEqual([{ id: 1, skin: 'starlight', home: 'b', since: T }])
})

test('she follows the person to whichever console they typed in', async () => {
  let world = stepWorld(emptyWorld(), [con('a', 10), con('b', 20)], T, never, 'classic')
  world = stepWorld(world, [con('a', 30), con('b', 20)], T + 1000, never, 'classic')
  expect(world.witches[0]?.home).toBe('a')
  expect(world.witches[0]?.since).toBe(T + 1000)
})

test('a console that stopped beating no longer counts or leads', async () => {
  const stale = { ...con('a', 99), seen: T - 10_000 }
  expect(leaderOf([stale, con('b', 1), con('c', 2)], T)).toBe('b')
  const world = stepWorld(emptyWorld(), [stale, con('b', 1)], T, never, 'classic')
  expect(world.witches[0]?.home).toBe('b')
})

test('a summoned visitor keeps to another console, and trades places with the follower', async () => {
  let world = stepWorld(emptyWorld(), [con('a', 20), con('b', 10)], T, never, 'classic')
  const asks = [{ kind: 'summon' as const, at: T }]
  world = stepWorld(world, [con('a', 20, { asks }), con('b', 10)], T + 1000, never, 'classic')
  expect(world.witches.map(w => w.home)).toEqual(['a', 'b'])
  expect(world.witches[1]?.skin).not.toBe('classic')

  // The person moves to b: the witches swap consoles.
  world = stepWorld(world, [con('a', 20, { asks }), con('b', 40)], T + 2000, never, 'classic')
  expect(world.witches.map(w => w.home)).toEqual(['b', 'a'])

  // The same ask is not answered twice.
  expect(world.witches.length).toBe(2)
})

test('the visitor leaves when only one console is left', async () => {
  let world: World = {
    witches: [
      { id: 1, skin: 'classic', home: 'a', since: T },
      { id: 2, skin: 'goldie', home: 'b', since: T, leaveAt: T + 60_000 },
    ],
    nextId: 3,
    handled: {},
  }
  world = stepWorld(world, [con('a', 5)], T + 1000, never, 'classic')
  expect(world.witches.length).toBe(1)
})

test('a fight wrecks the victim’s console, the hand takes the attacker, a new witch replaces her', async () => {
  const consoles = [con('a', 20), con('b', 10)]
  let world: World = {
    witches: [
      { id: 1, skin: 'classic', home: 'a', since: T },
      { id: 2, skin: 'goldie', home: 'b', since: T, leaveAt: T + 600_000 },
    ],
    nextId: 3,
    handled: {},
  }
  const asks = [{ kind: 'fight' as const, at: T }]
  world = stepWorld(world, [con('a', 20, { asks }), con('b', 10)], T, () => 0.3, 'classic')
  const fight = world.fight
  expect(fight).toEqual({ attacker: 1, victim: 2, start: T })
  if (!fight) return

  expect(fightPhase(fight, T + 1000)).toBe('cast')
  expect(chaosLevel(fight, T + 1000)).toBe(0)
  expect(chaosLevel(fight, T + FIGHT.chaosFull)).toBe(1)
  expect(fightPhase(fight, T + FIGHT.handStart + 100)).toBe('hand')
  expect(chaosLevel(fight, T + FIGHT.grabAt + 2000)).toBe(0)
  expect(fightPhase(fight, T + FIGHT.removeAt + 100)).toBe('gone')

  // Nobody moves while it plays out, even if the person switches consoles.
  const during = stepWorld(world, [con('a', 20), con('b', 99)], T + 5000, never, 'classic')
  expect(during.witches.map(w => w.home)).toEqual(['a', 'b'])

  const later = consoles.map(c => ({ ...c, seen: T + FIGHT.newAt }))
  const after = stepWorld(world, later, T + FIGHT.newAt, () => 0.1, 'classic')
  expect(after.fight).toBeUndefined()
  expect(after.witches[0]?.id).toBe(3)
  expect(after.witches[0]?.home).toBe('a')
  expect(after.witches[0]?.skin).not.toBe('classic')
  expect(after.witches[1]?.id).toBe(2)
})
