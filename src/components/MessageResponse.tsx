import { Box, Text } from 'ink.js.js.js.js.js'
import * as React from 'react.js.js.js.js.js'

type Props = {
  children: React.ReactNode
}

export function MessageResponse({ children }: Props): React.ReactNode {
  return (
    <Box flexDirection="row" height={1} overflow="hidden">
      <Text>{'  '}⎿ &nbsp;</Text>
      {children}
    </Box>
  )
}
