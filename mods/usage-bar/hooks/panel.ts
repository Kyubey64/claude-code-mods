import type { HudAgent, HudNote } from '../types'

// The permission mode the prompt's hint line names (`⏵⏵ auto mode on`, `⏸
// plan mode on`, ...), or `default` when it names none.
export function modeFrom(hint: string | undefined): string | undefined {
  if (hint === undefined) return undefined
  const named = /(auto mode|accept edits|plan mode|bypass permissions|don't ask)[^·(]*\bon\b/i.exec(hint)
  return named ? named[0].replace(/\s+/g, ' ').trim() : 'default'
}

// What is left of the hint line once the mode pill is taken out of it.
export function restOfHint(hint: string | undefined): string | undefined {
  if (hint === undefined) return undefined
  const rest = hint
    .replace(/[⏵⏸»]*\s*(auto mode|accept edits|plan mode|bypass permissions|don't ask)[^·(]*\bon\b(\s*\([^)]*\))?/i, '')
    .replace(/^\s*·\s*|\s*·\s*$/g, '')
    .trim()

  return rest === '' ? undefined : rest
}

export function levelColor(percent: number): string {
  if (percent >= 90) return '#ff5f6d'
  if (percent >= 75) return '#ffb347'
  return '#7ee08a'
}

export function clock(ms: number): string {
  const at = new Date(ms)
  return `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`
}

// Running agents first, then the last few that finished.
export function agentRows(agents: HudAgent[], finished = 4): HudAgent[] {
  const running = agents.filter(a => a.status === 'running')
  const done = agents.filter(a => a.status !== 'running').slice(-finished)

  return [...running, ...done]
}

export function statusMark(status: string): string {
  if (status === 'running') return '●'
  if (status === 'completed') return '✓'
  if (status === 'failed' || status === 'killed') return '✗'
  return '·'
}

export function addNote(notes: HudNote[], note: HudNote, keep = 30): HudNote[] {
  return [...notes, note].slice(-keep)
}
