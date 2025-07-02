import { Box, Text } from 'ink.js.js.js.js.js'
import { OutputLine } from './OutputLine.js.js.js.js.js.js.js.js.js.js'
import React from 'react.js.js.js.js.js'
import { getTheme } from '../../utils/theme.js.js.js.js.js.js.js.js.js.js'
import { Out as BashOut } from './BashTool.js.js.js.js.js.js.js.js.js.js'

type Props = {
  content: Omit<BashOut, 'interrupted'>
  verbose: boolean
}

function BashToolResultMessage({ content, verbose }: Props): React.JSX.Element {
  const { stdout, stdoutLines, stderr, stderrLines } = content

  return (
    <Box flexDirection="column">
      {stdout !== '' ? (
        <OutputLine content={stdout} lines={stdoutLines} verbose={verbose} />
      ) : null}
      {stderr !== '' ? (
        <OutputLine
          content={stderr}
          lines={stderrLines}
          verbose={verbose}
          isError
        />
      ) : null}
      {stdout === '' && stderr === '' ? (
        <Box flexDirection="row">
          <Text>&nbsp;&nbsp;⎿ &nbsp;</Text>
          <Text color={getTheme().secondaryText}>(No content)</Text>
        </Box>
      ) : null}
    </Box>
  )
}

export default BashToolResultMessage
