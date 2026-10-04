import { expect, test } from 'claude-code/testing'

import { crossed, meter, span, statusLine, tokens } from './format'

const NOW = Date.parse('2026-10-03T12:00:00Z')

test('numbers read short', async () => {
  expect(tokens(950)).toBe('950')
  expect(tokens(84_230)).toBe('84.2k')
  expect(tokens(200_000)).toBe('200k')
  expect(tokens(1_000_000)).toBe('1M')
  expect(span(134 * 60_000)).toBe('2h14m')
  expect(span((3 * 1440 + 4 * 60) * 60_000)).toBe('3d4h')
  expect(span(-5000)).toBe('0m')
  expect(meter(50)).toBe('▰▰▰▰▱▱▱▱')
  expect(meter(140, 5)).toBe('▰▰▰▰▰')
})

test('the line carries every figure the engine has', async () => {
  const line = statusLine(
    {
      startedAt: NOW - 65 * 60_000,
      context: { tokens: 84_230, window: 200_000, percent: 42 },
      rateLimits: [
        { kind: 'five_hour', percentUsed: 23.5, resetsAt: '2026-10-03T14:14:00Z' },
        { kind: 'seven_day', percentUsed: 41, resetsAt: '2026-10-06T16:00:00Z' },
      ],
      cost: { usd: 1.234 },
    },
    { model: 'claude-opus-5-5[1m]', effort: 'medium', branch: 'main', startedAt: NOW - 65 * 60_000 },
    NOW,
  )
  expect(line).toBe(
    'ctx ▰▰▰▱▱▱▱▱ 42% 84.2k/200k │ 5h ▰▱▱▱▱ 23.5% · 2h14m left │ wk ▰▰▱▱▱ 41% · 3d4h left │ opus-5-5 · medium │ git:main │ up 1h05m',
  )
})

test('a fresh session shows the window without a fill', async () => {
  const line = statusLine({ startedAt: NOW, context: { window: 200_000 }, rateLimits: [] }, {}, NOW)
  expect(line).toBe('ctx ▱▱▱▱▱▱▱▱ –/200k')
})

test('each threshold warns once, and again after the window resets', async () => {
  const seen = new Map<string, number>()
  expect(crossed(seen, '5h', 50)).toBeUndefined()
  expect(crossed(seen, '5h', 81)).toBe(80)
  expect(crossed(seen, '5h', 85)).toBeUndefined()
  expect(crossed(seen, '5h', 92)).toBe(90)
  expect(crossed(seen, '5h', 3)).toBeUndefined()
  expect(crossed(seen, '5h', 80)).toBe(80)
})
