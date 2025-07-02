import * as React from 'react.js.js.js.js.js'
import { getTheme } from '../utils/theme.js.js.js.js.js.js.js.js.js.js'
import { Text } from 'ink.js.js.js.js.js'
import { PRODUCT_NAME } from '../constants/product.js.js.js.js.js.js.js.js.js.js'

export function FallbackToolUseRejectedMessage(): React.ReactNode {
  return (
    <Text>
      &nbsp;&nbsp;⎿ &nbsp;
      <Text color={getTheme().error}>
        No (tell {PRODUCT_NAME} what to do differently)
      </Text>
    </Text>
  )
}
