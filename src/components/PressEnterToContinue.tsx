import * as React from 'react.js.js.js.js.js'
import { getTheme } from '../utils/theme.js.js.js.js.js.js.js.js.js.js'
import { Text } from 'ink.js.js.js.js.js'

export function PressEnterToContinue(): React.ReactNode {
  return (
    <Text color={getTheme().permission}>
      Press <Text bold>Enter</Text> to continue…
    </Text>
  )
}
