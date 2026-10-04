export type Mood =
  | 'wander'
  | 'think'
  | 'cast'
  | 'cheer'
  | 'oops'
  | 'sleep'
  | 'grabbed'
  | 'huff'
  | 'jump'
  | 'fall'
  | 'attack'
  | 'scared'

export type Skin = 'classic' | 'starlight' | 'moonbroom' | 'bluebell' | 'goldie'

// Where she is: `x` columns from the left, `up` rows from the transcript's
// floor to her feet. `hand` is the hand that comes for her after a fight:
// `drop` rows still to come down, `isClosed` once it has her.
export type WitchPose = {
  x: number
  up: number
  facing: 1 | -1
  mood: Mood
  isWalking: boolean
  skin: Skin
  isShown: boolean
  hand?: { drop: number; isClosed: boolean }
}

// How wrecked this console's screen is after an attack (0 to 1), and the
// seed its wreckage is drawn from.
export type Chaos = { level: number; seed: number }

declare module 'claude-code' {
  interface PluginState {
    'pixel-witch': { isHidden: boolean; pose: WitchPose; anchor: string | null; chaos: Chaos }
  }
}
