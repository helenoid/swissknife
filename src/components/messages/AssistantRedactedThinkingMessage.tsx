import React from 'react.js.js.js.js.js'
import { Box, Text } from 'ink.js.js.js.js.js'
import { getTheme } from '../../utils/theme.js.js.js.js.js.js.js.js.js.js'

type Props = {
  addMargin: boolean
}

export function AssistantRedactedThinkingMessage({
  addMargin = false,
}: Props): React.ReactNode {
  return (
    <Box marginTop={addMargin ? 1 : 0}>
      <Text color={getTheme().secondaryText} italic>
        ✻ Thinking…
      </Text>
    </Box>
  )
}
