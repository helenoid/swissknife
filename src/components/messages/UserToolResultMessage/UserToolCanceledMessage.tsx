import { Text } from 'ink.js.js.js.js.js'
import * as React from 'react.js.js.js.js.js'
import { getTheme } from '../../../utils/theme.js.js.js.js.js.js.js.js.js.js'

export function UserToolCanceledMessage(): React.ReactNode {
  return (
    <Text>
      &nbsp;&nbsp;⎿ &nbsp;
      <Text color={getTheme().error}>Interrupted by user</Text>
    </Text>
  )
}
