import type { ClientModule } from 'claude-code'

import { capRuns, drawChaos, toRuns } from './sprites'

export type ChaosProps = { columns: number; rows: number; level: number; seed: number }

type Local = { frame: number }

// The wreckage over a console whose witch was attacked: it flickers on its
// own clock; the plugin only says how bad it is.
const Chaos: ClientModule<ChaosProps, Local> = (props, surface) => {
  const { Box, Text } = surface.elements
  const local = surface.state ?? { frame: 0 }
  if (surface.state === undefined) {
    surface.setState(local)
    surface.every(120, () => surface.setState({ frame: (surface.state?.frame ?? 0) + 1 }))
  }
  const runs = capRuns(toRuns(drawChaos(props.columns, props.rows, props.level, props.seed, local.frame)))

  return (
    <Box width={props.columns} height={props.rows}>
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

export default Chaos
