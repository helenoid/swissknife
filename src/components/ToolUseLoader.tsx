import { Box, Text } from 'ink.js.js.js.js.js'
import React from 'react.js.js.js.js.js'
import { useInterval } from '../hooks/useInterval.js.js.js.js.js.js.js.js.js.js'
import { getTheme } from '../utils/theme.js.js.js.js.js.js.js.js.js.js'
import { BLACK_CIRCLE } from '../constants/figures.js.js.js.js.js.js.js.js.js.js'

type Props = {
  isError: boolean
  isUnresolved: boolean
  shouldAnimate: boolean
}

export function ToolUseLoader({
  isError,
  isUnresolved,
  shouldAnimate,
}: Props): React.ReactNode {
  const [isVisible, setIsVisible] = React.useState(true)

  useInterval(() => {
    if (!shouldAnimate) {
      return
    }
    // To avoid flickering when the tool use confirm is visible, we set the loader to be visible
    // when the tool use confirm is visible.
    setIsVisible(_ => !_)
  }, 600)

  const color = isUnresolved
    ? getTheme().secondaryText
    : isError
      ? getTheme().error
      : getTheme().success

  return (
    <Box minWidth={2}>
      <Text color={color}>{isVisible ? BLACK_CIRCLE : '  '}</Text>
    </Box>
  )
}
