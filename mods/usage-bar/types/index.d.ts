export type HudLimit = { name: string; percent: number; resetsIn?: string }

export type HudAgent = { id: string; label: string; type: string; status: string }

export type HudNote = { at: string; text: string; from?: string }

// Everything the session panel shows.
export type Hud = {
  context?: { percent?: number; tokens?: number; window: number }
  limits: HudLimit[]
  limitsNote?: string
  model?: string
  effort?: string
  branch?: string
  uptime?: string
  mode: string
  hint?: string
  modes: string[]
  isWorking: boolean
  agents: HudAgent[]
  notes: HudNote[]
}

declare module 'claude-code' {
  interface PluginState {
    'usage-bar': { hud: Hud }
  }
}
