// The witch's pixels. Two pixels stack in each terminal cell (upper and lower
// half blocks); the sprite sits centered in a REGION_W x REGION_H cell region
// with room around her for sparkles, bubbles and grumbles. Each skin is its
// own drawing (styles.ts), not a recolor.

import { STYLES } from './styles'
import type { Eyes, LegFrame } from './styles'
import type { Skin } from '../types'

export type { Eyes } from './styles'

export const REGION_W = 24
export const REGION_H = 13
const HEIGHT_PX = REGION_H * 2
// Glyph places are written for a 16-wide sprite at column 2 of a 20 x 12
// region; they move with the sprite's place in the bigger region.
const GLYPH_ROW_SHIFT = REGION_H - 12

export type Wand = 'hold' | 'raise' | 'none'
export type Legs = LegFrame | 'sit'

export type Glyph = { col: number; row: number; text: string; color: string }

export type Scene = {
  skin: Skin
  facing: 1 | -1
  legs: Legs
  eyes: Eyes
  wand: Wand
  lift: number
  glyphs: Glyph[]
}

export type Cell = { ch: string; fg: string; bg?: string }

export function spriteRows(scene: Pick<Scene, 'legs' | 'eyes' | 'wand'> & { skin?: Skin }): string[] {
  const art = STYLES[scene.skin ?? 'classic']
  const legs = scene.legs === 'sit' ? [] : art.legs[scene.legs]
  const rows = [...art.body, ...legs].map(row => row.split(''))
  const wand = scene.wand === 'raise' ? art.raise : scene.wand === 'none' ? art.none : []
  for (const [x, y, ch] of [...art.eyes[scene.eyes], ...wand]) {
    const row = rows[y]
    if (row !== undefined && x >= 0 && x < row.length) row[x] = ch
  }

  return rows.map(row => row.join(''))
}

export function spriteLeft(skin: Skin): number {
  return Math.floor((REGION_W - STYLES[skin].width) / 2)
}

// The region's cells, row by row; undefined where nothing is drawn.
export function drawScene(scene: Scene): (Cell | undefined)[][] {
  const art = STYLES[scene.skin]
  const width = art.width
  const left = spriteLeft(scene.skin)
  const pixels: (string | undefined)[] = new Array(REGION_W * HEIGHT_PX)
  const rows = spriteRows(scene)
  const top = HEIGHT_PX - rows.length - scene.lift
  rows.forEach((line, y) => {
    for (let c = 0; c < width; c++) {
      const color = art.colors[line[c] ?? '.']
      if (color === undefined) continue
      const px = left + (scene.facing === 1 ? c : width - 1 - c)
      const py = top + y
      if (py < 0 || py >= HEIGHT_PX) continue
      pixels[py * REGION_W + px] = color
    }
  })

  const cells = toCells(pixels, REGION_W, REGION_H)
  const colShift = left - 2 + Math.max(0, width - 16)
  for (const glyph of scene.glyphs) {
    const col = glyph.col + (glyph.col >= 10 ? colShift : left - 2)
    const start = scene.facing === 1 ? col : REGION_W - col - glyph.text.length
    const line = cells[glyph.row + GLYPH_ROW_SHIFT]
    if (line === undefined) continue
    ;[...glyph.text].forEach((ch, i) => {
      const at = start + i
      if (at >= 0 && at < REGION_W) line[at] = { ch, fg: glyph.color }
    })
  }

  return cells
}

// Pixels (width x rows*2, row-major) to half-block cells.
function toCells(pixels: (string | undefined)[], width: number, rows: number): (Cell | undefined)[][] {
  const cells: (Cell | undefined)[][] = []
  for (let row = 0; row < rows; row++) {
    const line: (Cell | undefined)[] = []
    for (let col = 0; col < width; col++) {
      const upper = pixels[row * 2 * width + col]
      const lower = pixels[(row * 2 + 1) * width + col]
      if (upper === undefined && lower === undefined) line.push(undefined)
      else if (lower === undefined) line.push({ ch: '▀', fg: upper ?? '' })
      else if (upper === undefined) line.push({ ch: '▄', fg: lower })
      else if (upper === lower) line.push({ ch: '█', fg: upper })
      else line.push({ ch: '▀', fg: upper, bg: lower })
    }
    cells.push(line)
  }

  return cells
}

// The hand that comes for a witch who started a fight: a long sleeve from
// the top of its region down to a glove, open while it reaches, a fist once
// it has her.
export const HAND_W = 12
const HAND_COLORS: Record<string, string> = {
  K: '#2b1b3d', W: '#fbf7ff', g: '#c9c0dd', C: '#ffc94d', s: '#6b3fa0', l: '#8a5cd6',
}
const SLEEVE = '..KsslssK...'
const GLOVE_OPEN = [
  '.KCCCCCCCK..',
  '.KWWWWWWWK..',
  'KWWWWWWWWWK.',
  'KWgWWgWWgWK.',
  'KWWKWWKWWKWK',
  'KWWKWWKWWKWK',
  '.KK.KK.KK.K.',
]
const GLOVE_FIST = [
  '.KCCCCCCCK..',
  '.KWWWWWWWK..',
  'KWWWWWWWWWK.',
  'KWgWWgWWgWK.',
  'KWWWWWWWWWWK',
  '.KWgWgWgWWK.',
  '..KKKKKKKK..',
]

export function drawHand(rows: number, isClosed: boolean): (Cell | undefined)[][] {
  const glove = isClosed ? GLOVE_FIST : GLOVE_OPEN
  const height = rows * 2
  const sleeve = Array.from({ length: Math.max(0, height - glove.length) }, () => SLEEVE)
  const lines = [...sleeve, ...glove].slice(-height)
  const pixels: (string | undefined)[] = new Array(HAND_W * height)
  lines.forEach((line, y) => {
    for (let x = 0; x < HAND_W; x++) {
      const color = HAND_COLORS[line[x] ?? '.']
      if (color !== undefined) pixels[y * HAND_W + x] = color
    }
  })

  return toCells(pixels, HAND_W, rows)
}

// The wreckage an attack leaves on a console: torn rows of glitch glyphs
// that thicken with `level` and shift every frame.
const GLITCH = [...'█▓▒░#%&@$*!?<>/\\|=+~^']
const GLITCH_FG = ['#ff3b6b', '#ff7ad9', '#7af6ff', '#b388ff', '#ffe14d', '#ffffff']
const GLITCH_BG = ['#1a0010', '#12001f', '#000000', '#2b0030', '#001a1f']

function hash(a: number, b: number, c: number, d: number): number {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647 + d * 1274126177) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h ^= h >>> 16

  return (h >>> 0) / 4294967296
}

// At most this many streaks are drawn: each is one run of Text, and a
// surface module's tree must stay under 100,000 characters serialized.
export const CHAOS_MAX_STREAKS = 360

export function drawChaos(
  width: number,
  rows: number,
  level: number,
  seed: number,
  frame: number,
): (Cell | undefined)[][] {
  const cells: (Cell | undefined)[][] = Array.from({ length: rows }, () => new Array(width).fill(undefined))
  if (level <= 0) return cells
  const beat = Math.floor(frame / 2)
  const pickFrom = (list: string[], roll: number) => list[Math.floor(roll * list.length)] ?? '#000000'
  // Streaks per row grow with the level; the budget is shared across rows.
  const perRow = Math.max(1, Math.min(Math.floor(CHAOS_MAX_STREAKS / Math.max(1, rows)), Math.ceil(level * 6)))
  for (let row = 0; row < rows; row++) {
    const line = cells[row] ?? []
    // Some rows tear whole once the attack is in full swing: one streak.
    const isTorn = hash(seed, row, beat, 7) < level * level * 0.3
    const streaks = isTorn ? 1 : perRow
    for (let i = 0; i < streaks; i++) {
      if (!isTorn && hash(seed, row, i, beat + 1) > level * 0.9) continue
      const length = isTorn ? width : 2 + Math.floor(hash(seed, row, i, beat + 2) * (4 + level * 18))
      const start = isTorn ? 0 : Math.floor(hash(seed, row, i, beat + 3) * Math.max(1, width - length))
      const fg = pickFrom(GLITCH_FG, hash(seed, row, i, beat + 5))
      const bg = pickFrom(GLITCH_BG, hash(seed, row, i, beat + 9))
      for (let col = start; col < Math.min(width, start + length); col++) {
        line[col] = { ch: pickFrom(GLITCH, hash(seed, col, row, beat + 11)), fg, bg }
      }
    }
  }

  return cells
}

// One run per stretch of same-colored cells, for drawing as Text.
export type Run = { row: number; col: number; text: string; fg: string; bg?: string }

export function toRuns(cells: (Cell | undefined)[][]): Run[] {
  const runs: Run[] = []
  cells.forEach((line, row) => {
    let run: Run | undefined
    line.forEach((cell, col) => {
      if (cell === undefined) {
        run = undefined
        return
      }
      if (run && run.fg === cell.fg && run.bg === cell.bg) {
        run.text += cell.ch
        return
      }
      run = { row, col, text: cell.ch, fg: cell.fg, bg: cell.bg }
      runs.push(run)
    })
  })

  return runs
}

// Runs up to a serialized-size budget: each drawn as a positioned Box around
// a Text, so it costs its own JSON plus the wrapping elements.
export const RUN_OVERHEAD = 220

export function capRuns(runs: Run[], budget = 60_000): Run[] {
  const kept: Run[] = []
  let size = 0
  for (const run of runs) {
    size += JSON.stringify(run).length + RUN_OVERHEAD
    if (size > budget) break
    kept.push(run)
  }

  return kept
}
