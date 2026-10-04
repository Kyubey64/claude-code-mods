import { expect, mock, test } from 'claude-code/testing'
import type { TestBody } from 'claude-code/testing'
import type { On } from 'claude-code'

import { HAND_W, REGION_H, REGION_W, capRuns, drawChaos, drawHand, drawScene, spriteRows, toRuns } from './sprites'
import type { Eyes, Legs, Wand } from './sprites'
import { sceneFor } from './witch-client'
import { SKINS } from './coven'
import { STYLES } from './styles'
import type { WitchPose } from '../types'

const BAND = {
  component: 'AbovePrompt',
  props: {
    hasSurvey: false,
    isWorking: false,
    maxRows: 20,
    bodyColumns: 80,
    scroll: { offset: 0, bodyRows: 19 },
    view: {},
  },
} as const

const POSE: WitchPose = {
  x: 10,
  up: 0,
  facing: 1,
  mood: 'wander',
  isWalking: true,
  skin: 'classic',
  isShown: true,
}

// Starts the session on a mock clock with no shared folder beneath it, so
// she lives alone in this console, and lets her walk in.
async function begin($: Parameters<TestBody>[0], on: On) {
  const clock = mock.clock(on, { now: 1_000_000 })
  on('command.register', ($, e) => ({ value: { command: e.name } }))
  on('session.start', ($, e) => ({ cwd: e.cwd }))
  on('ui.toast', () => ({ value: undefined }))
  await $.session.start({ cwd: '.', surface: 'terminal', isInteractive: true })
  return clock
}

test('every pose of every style keeps its width and fits her region', async () => {
  const legs: Legs[] = ['stand', 'walk1', 'walk2', 'kick1', 'kick2', 'sit']
  const eyes: Eyes[] = ['open', 'blink', 'happy', 'angry']
  const wands: Wand[] = ['hold', 'raise', 'none']
  for (const l of legs) {
    for (const e of eyes) {
      for (const w of wands) {
        for (const skin of SKINS) {
          const rows = spriteRows({ legs: l, eyes: e, wand: w, skin })
          expect(rows.length <= REGION_H * 2).toBe(true)
          for (const row of rows) expect(row.length).toBe(STYLES[skin].width)
          for (const ch of rows.join('').replaceAll('.', '')) expect(STYLES[skin].colors[ch]).toBeDefined()
        }
      }
    }
  }
})

test('a scene fills exactly her region and mirrors text whole', async () => {
  const scene = { ...sceneFor(POSE, 0, true), facing: -1 as const }
  const cells = drawScene(scene)
  expect(cells.length).toBe(REGION_H)
  for (const line of cells) expect(line.length).toBe(REGION_W)
  const grumble = toRuns(cells).find(run => run.text.includes('hmph'))
  expect(grumble?.text).toBe('hmph!')
})

test('held, she is grumpy and kicks', async () => {
  const held = sceneFor(POSE, 0, true)
  expect(held.eyes).toBe('angry')
  expect(held.legs).toBe('kick1')
  expect(sceneFor(POSE, 1, true).legs).toBe('kick2')
  expect(sceneFor({ ...POSE, mood: 'sleep' }, 0, false).legs).toBe('sit')
})

test('the hand and the wreckage fill exactly their regions', async () => {
  const hand = drawHand(9, false)
  expect(hand.length).toBe(9)
  for (const line of hand) expect(line.length).toBe(HAND_W)
  expect(drawHand(3, true).length).toBe(3)
  const calm = drawChaos(30, 5, 0, 7, 0)
  expect(calm.every(line => line.every(cell => cell === undefined))).toBe(true)
  const wrecked = drawChaos(30, 5, 1, 7, 0).flat().filter(cell => cell !== undefined)
  expect(wrecked.length > 30 * 5 * 0.3).toBe(true)
})

test('the wreckage of a huge screen stays well under the surface module size limit', async () => {
  for (let frame = 0; frame < 12; frame++) {
    for (const level of [0.3, 0.7, 1]) {
      const runs = capRuns(toRuns(drawChaos(320, 90, level, 1234 + frame, frame)))
      const size = runs.reduce((sum, run) => sum + JSON.stringify(run).length + 220, 0)
      expect(size <= 60_000).toBe(true)
      expect(runs.length > 20).toBe(true)
    }
  }
})

test('on the main screen she walks a strip above the prompt', async ($, on) => {
  const clock = await begin($, on)
  const ui = await $.ui.mount({
    plugin: 'pixel-witch',
    surface: 'terminal',
    ...BAND,
    viewport: { columns: 80, rows: 40, isFullscreen: false },
  })
  await clock.advance(15_000)
  const witch = await ui.find({ key: 'witch' })
  expect(witch?.type).toBe('Client')
  await ui.unmount()
})

test('in fullscreen the band is left to the engine', async ($, on) => {
  on('ui.render', { component: 'AbovePrompt' }, ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine band</Text>
  })
  const ui = await $.ui.mount({
    plugin: 'pixel-witch',
    surface: 'terminal',
    ...BAND,
    viewport: { columns: 80, rows: 40, isFullscreen: true },
  })
  expect(await ui.find({ key: 'witch' })).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: /engine band/ })).toBeDefined()
  await ui.unmount()
})

test('dragging her moves her, and she grumbles until dropped', async ($, on) => {
  const clock = await begin($, on)
  const ui = await $.ui.mount({
    plugin: 'pixel-witch',
    surface: 'terminal',
    ...BAND,
    viewport: { columns: 80, rows: 40, isFullscreen: false },
  })
  await clock.advance(15_000)
  const startX = ((await ui.find({ key: 'witch' }))?.props.props as WitchPose).x
  await ui.pointer({ type: 'down', x: 8, y: 6, button: 'left' })
  expect(await ui.find({ in: 'witch', type: 'Text', text: /hmph!/ })).toBeDefined()
  await ui.pointer({ type: 'move', x: 20, y: 6, button: 'left' })
  // She now sits 12 columns right, so the same screen spot is 12 cells left in her region.
  await ui.pointer({ type: 'up', x: 8, y: 6, button: 'left' })
  const dropped = (await ui.find({ key: 'witch' }))?.props.props as WitchPose
  expect(dropped.x).toBe(Math.min(startX + 12, 80 - REGION_W))
  expect(dropped.mood).toBe('huff')
  await ui.unmount()
})

test('a right click hides her in this console', async ($, on) => {
  on('ui.render', { component: 'AbovePrompt' }, ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine band</Text>
  })
  const clock = await begin($, on)
  const ui = await $.ui.mount({
    plugin: 'pixel-witch',
    surface: 'terminal',
    ...BAND,
    viewport: { columns: 80, rows: 40, isFullscreen: false },
  })
  await clock.advance(15_000)
  expect(await ui.find({ key: 'witch' })).toBeDefined()
  await ui.pointer({ type: 'down', x: 8, y: 6, button: 'right' })
  expect(await ui.find({ key: 'witch' })).toBeUndefined()
  await ui.unmount()
})
