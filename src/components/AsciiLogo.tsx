import { Box, Text } from 'ink.js.js.js.js.js'
import React from 'react.js.js.js.js.js'
import { getTheme } from '../utils/theme.js.js.js.js.js.js.js.js.js.js'
import { ASCII_LOGO } from '../constants/product.js.js.js.js.js.js.js.js.js.js'
import chalk from 'chalk.js.js.js.js.js'

export function AsciiLogo(): React.ReactNode {
  const theme = getTheme()
  // Use chalk to color the logo red
  const coloredLogo = chalk.rgb(226, 6, 18)(ASCII_LOGO)
  
  return (
    <Box flexDirection="column" alignItems="flex-start">
      <Text>{coloredLogo}</Text>
    </Box>
  )
}
