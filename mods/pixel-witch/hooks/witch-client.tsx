import type { ClientModule } from 'claude-code'

import { REGION_H, REGION_W, drawScene, toRuns } from './sprites'
import type { Glyph, Scene } from './sprites'
import type { WitchPose as WitchProps } from '../types'

type Local = { frame: number; grab?: { x: number; y: number } }

const STAR = '#fff27a'
const PINK = '#ff8fa3'
const MINT = '#8ff0c8'
const SKY = '#9fd0ff'
const LILAC = '#c9b3ff'
const RED = '#ff4d6d'
const RAINBOW = [STAR, PINK, MINT, SKY, LILAC]
const GRUMBLES = ['hmph!', 'hey!!', 'put me down!', 'rude...']

export function sceneFor(props: WitchProps, frame: number, isHeld: boolean): Scene {
  const facing = props.facing
  const blink = frame % 32 < 2 ? 'blink' : 'open'
  const beat = Math.floor(frame / 3)
  const base: Scene = { skin: props.skin ?? 'classic', facing, legs: 'stand', eyes: blink, wand: 'hold', lift: 0, glyphs: [] }
  const mood = isHeld ? 'grabbed' : props.mood

  switch (mood) {
    case 'wander': {
      const legs = props.isWalking ? (beat % 2 === 0 ? 'walk1' : 'walk2') : 'stand'
      const twinkle: Glyph[] = frame % 24 < 3 ? [{ col: 18, row: 5, text: '·', color: STAR }] : []
      return { ...base, legs, lift: props.isWalking && beat % 2 === 1 ? 1 : 0, glyphs: twinkle }
    }
    case 'think': {
      const bubble: Glyph[] = [
        { col: 15, row: 3, text: '.', color: LILAC },
        { col: 16, row: 2, text: 'o', color: LILAC },
        { col: 17, row: 1, text: 'O', color: LILAC },
        { col: 18, row: 0, text: '?', color: SKY },
      ]
      return { ...base, glyphs: bubble.slice(0, (beat % 5) + 1) }
    }
    case 'cast': {
      const spots: [number, number][] = [[18, 3], [16, 2], [19, 5], [17, 1], [19, 2]]
      const glyphs = spots.map(([col, row], i) => ({
        col,
        row,
        text: (i + beat) % 2 === 0 ? '*' : '+',
        color: RAINBOW[(i + beat) % RAINBOW.length] ?? STAR,
      }))
      return { ...base, wand: 'raise', glyphs: glyphs.slice(0, 2 + (beat % 4)) }
    }
    case 'cheer': {
      const spots: [number, number][] = [[0, 2], [1, 5], [18, 1], [19, 4], [17, 0], [0, 7]]
      const glyphs = spots.map(([col, row], i) => ({
        col,
        row: (row + beat) % 8,
        text: i % 2 === 0 ? '*' : '+',
        color: RAINBOW[(i + beat) % RAINBOW.length] ?? STAR,
      }))
      return { ...base, eyes: 'happy', wand: 'raise', lift: [0, 1, 2, 1][frame % 4] ?? 0, glyphs }
    }
    case 'oops': {
      const glyphs: Glyph[] = [{ col: 3, row: 4, text: '•', color: SKY }]
      if (beat % 2 === 0) glyphs.push({ col: 15, row: 0, text: '!', color: RED })
      return { ...base, eyes: 'blink', glyphs }
    }
    case 'sleep': {
      const zs: Glyph[] = [
        { col: 14, row: 4, text: 'z', color: SKY },
        { col: 15, row: 3, text: 'z', color: SKY },
        { col: 16, row: 2, text: 'Z', color: LILAC },
      ]
      return { ...base, legs: 'sit', eyes: 'blink', wand: 'none', glyphs: zs.slice(0, (Math.floor(frame / 5) % 4)) }
    }
    case 'grabbed': {
      const grumble = GRUMBLES[Math.floor(frame / 14) % GRUMBLES.length] ?? 'hmph!'
      const glyphs: Glyph[] = [{ col: Math.min(14, REGION_W - grumble.length), row: 0, text: grumble, color: PINK }]
      if (frame % 4 < 2) glyphs.push({ col: 15, row: 2, text: '╬', color: RED })
      return {
        ...base,
        legs: frame % 2 === 0 ? 'kick1' : 'kick2',
        eyes: 'angry',
        wand: 'none',
        lift: frame % 2,
        glyphs,
      }
    }
    case 'huff': {
      const glyphs: Glyph[] = [{ col: 14, row: 0, text: 'hmph.', color: PINK }]
      if (beat % 3 === 0) glyphs.push({ col: 15, row: 2, text: '╬', color: RED })
      return { ...base, eyes: 'angry', glyphs }
    }
    // Leaping off to another console.
    case 'jump': {
      const trail: Glyph[] = [{ col: 3, row: 10, text: '˚', color: STAR }, { col: 15, row: 11, text: '·', color: SKY }]
      return { ...base, legs: 'kick2', eyes: 'happy', wand: 'raise', lift: 2, glyphs: trail }
    }
    // Dropping in from above.
    case 'fall': {
      const whoosh: Glyph[] = [{ col: 5, row: 0, text: '!', color: STAR }]
      return { ...base, legs: frame % 2 === 0 ? 'kick1' : 'kick2', eyes: 'open', wand: 'raise', glyphs: whoosh }
    }
    // Winding up a spell at the other witch's console.
    case 'attack': {
      const bolt = ['>', '>>', '>>>', '>>>>'][beat % 4] ?? '>'
      const glyphs: Glyph[] = [
        { col: 16, row: 4, text: bolt, color: RED },
        { col: 15, row: 2, text: '╬', color: RED },
        { col: 18, row: 6, text: '*', color: RAINBOW[beat % RAINBOW.length] ?? STAR },
      ]
      return { ...base, eyes: 'angry', wand: 'raise', lift: frame % 2, glyphs }
    }
    // Her console is being wrecked.
    case 'scared': {
      const glyphs: Glyph[] = [
        { col: 3, row: 4, text: '•', color: SKY },
        { col: 14, row: 0, text: frame % 6 < 3 ? 'eek!' : 'EEK!', color: PINK },
      ]
      return { ...base, eyes: 'blink', wand: 'none', lift: frame % 3 === 0 ? 1 : 0, glyphs }
    }
  }
}

const Witch: ClientModule<WitchProps, Local> = (props, surface) => {
  const { Box, Text } = surface.elements
  const local = surface.state ?? { frame: 0 }
  if (surface.state === undefined) {
    surface.setState(local)
    surface.every(150, () => {
      const now = surface.state ?? { frame: 0 }
      surface.setState({ ...now, frame: now.frame + 1 })
    })
  }

  surface.onPointer(event => {
    const now = surface.state ?? { frame: 0 }
    // A right click sends her away from this console.
    if (event.type === 'down' && event.button === 'right') {
      surface.post({ type: 'hide' })
      return
    }
    if (event.type === 'down' && event.button === 'left') {
      surface.setState({ ...now, grab: { x: event.x, y: event.y } })
      surface.post({ type: 'grab' })
      return
    }
    if (now.grab === undefined) return
    const x = props.x + event.x - now.grab.x
    const up = props.up - (event.y - now.grab.y)
    if (event.type === 'move') {
      surface.post({ type: 'drag', x, up })
    } else if (event.type === 'up') {
      surface.setState({ frame: now.frame })
      surface.post({ type: 'drop', x, up })
    }
  })

  const scene = sceneFor(props, local.frame, local.grab !== undefined)
  const runs = toRuns(drawScene(scene))

  return (
    <Box width={REGION_W} height={REGION_H}>
      {runs.map(run => (
        <Box position="absolute" top={run.row} left={run.col}>
          {run.bg === undefined ? (
            <Text color={run.fg}>{run.text}</Text>
          ) : (
            <Text color={run.fg} backgroundColor={run.bg}>
              {run.text}
            </Text>
          )}
        </Box>
      ))}
    </Box>
  )
}

export default Witch
