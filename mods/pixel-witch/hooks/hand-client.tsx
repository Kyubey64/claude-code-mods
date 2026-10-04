import type { ClientModule } from 'claude-code'

import { HAND_W, drawHand, toRuns } from './sprites'

export type HandProps = { rows: number; isClosed: boolean }

const Hand: ClientModule<HandProps> = (props, surface) => {
  const { Box, Text } = surface.elements
  const runs = toRuns(drawHand(props.rows, props.isClosed))

  return (
    <Box width={HAND_W} height={props.rows}>
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

export default Hand
