import { expect, test } from 'claude-code/testing'

import { agentRows, modeFrom, restOfHint } from './panel'

const PANE = {
  component: 'Pane',
  requestId: 'session-hud',
  props: {
    title: 'Session',
    isFocused: false,
    bodyColumns: 40,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 40 },
    view: {},
  },
} as const

const HINT = {
  component: 'PromptHint',
  props: {
    isDraft: false,
    isWorking: false,
    hint: '⏵⏵ auto mode on (shift+tab to cycle) · ? for shortcuts',
  },
} as const

test('the mode pill is read out of the hint line, the rest kept', async () => {
  expect(modeFrom(HINT.props.hint)).toBe('auto mode on')
  expect(restOfHint(HINT.props.hint)).toBe('? for shortcuts')
  expect(modeFrom('? for shortcuts')).toBe('default')
  expect(modeFrom('⏸ plan mode on (shift+tab to cycle)')).toBe('plan mode on')
  expect(restOfHint('⏵⏵ accept edits on (shift+tab to cycle)')).toBeUndefined()
})

test('running agents come first, then the last ones done', async () => {
  const a = (id: string, status: string) => ({ id, label: id, type: 'Explore', status })
  const rows = agentRows([a('1', 'completed'), a('2', 'running'), a('3', 'failed'), a('4', 'running')])
  expect(rows.map(r => r.id)).toEqual(['2', '4', '1', '3'])
})

test('docked, the panel draws its sections and takes over the hint line and toasts', async ($, on) => {
  on('ui.render', { component: 'PromptHint' }, ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>hint:{e.props.hint}</Text>
  })
  on('ui.toast', () => ({ value: undefined }))

  const pane = await $.ui.mount({ plugin: 'usage-bar', surface: 'terminal', ...PANE })
  for (const title of [/USAGE/, /SESSION/, /AGENTS/, /NOTIFICATIONS/]) {
    expect(await pane.find({ type: 'Text', text: title })).toBeDefined()
  }

  const hint = await $.ui.mount({ plugin: 'usage-bar', surface: 'terminal', ...HINT })
  expect(await hint.find({ type: 'Text', text: /hint:$/ })).toBeDefined()
  await hint.unmount()
  await pane.unmount()
})
