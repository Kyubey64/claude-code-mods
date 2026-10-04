import type { SessionUsage } from 'claude-code'

export type Extras = { model?: string; effort?: string | number; branch?: string; startedAt?: number; note?: string }

const LIMIT_NAMES: Record<string, string> = { five_hour: '5h', seven_day: 'wk', spend_limit: 'spend' }

export function tokens(n: number): string {
  if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(2)}M`
  if (n >= 100_000) return `${Math.round(n / 1000)}k`
  if (n >= 1000) return `${+(n / 1000).toFixed(1)}k`
  return String(n)
}

export function meter(percent: number, width = 8): string {
  const filled = Math.min(width, Math.max(0, Math.round((percent / 100) * width)))
  return '▰'.repeat(filled) + '▱'.repeat(width - filled)
}

export function span(ms: number): string {
  const minutes = Math.max(0, Math.round(ms / 60_000))
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  const mins = minutes % 60
  if (days > 0) return `${days}d${hours}h`
  if (hours > 0) return `${hours}h${String(mins).padStart(2, '0')}m`
  return `${mins}m`
}

export function limitName(kind: string): string {
  return LIMIT_NAMES[kind] ?? kind
}

export function shortModel(model: string): string {
  return model.replace(/^claude-/, '').replace(/\[.*\]$/, '')
}

export function statusLine(usage: SessionUsage, extras: Extras, now: number): string {
  const parts: string[] = []
  const { context } = usage

  if (context.tokens !== undefined && context.percent !== undefined) {
    parts.push(`ctx ${meter(context.percent)} ${context.percent}% ${tokens(context.tokens)}/${tokens(context.window)}`)
  } else {
    parts.push(`ctx ${meter(0)} –/${tokens(context.window)}`)
  }

  for (const limit of usage.rateLimits) {
    const reset = limit.resetsAt ? ` · ${span(Date.parse(limit.resetsAt) - now)} left` : ''
    parts.push(`${limitName(limit.kind)} ${meter(limit.percentUsed, 5)} ${limit.percentUsed}%${reset}`)
  }

  if (extras.model) {
    const effort = extras.effort === undefined ? '' : ` · ${extras.effort}`
    parts.push(`${shortModel(extras.model)}${effort}`)
  }
  if (extras.branch) parts.push(`git:${extras.branch}`)
  if (extras.startedAt !== undefined) parts.push(`up ${span(now - extras.startedAt)}`)
  if (extras.note) parts.push(extras.note)

  return parts.join(' │ ')
}

// The thresholds a figure has newly crossed since the last reading, highest
// first; `seen` remembers the highest crossed per figure.
export function crossed(seen: Map<string, number>, name: string, percent: number): number | undefined {
  const top = [100, 90, 80].find(step => percent >= step) ?? 0
  const was = seen.get(name) ?? 0
  seen.set(name, top)

  return top > was ? top : undefined
}
