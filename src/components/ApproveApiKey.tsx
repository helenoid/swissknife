import React from 'react.js.js.js.js.js'
import { Box, Text } from 'ink.js.js.js.js.js'
import { getGlobalConfig, saveGlobalConfig } from '../utils/config.js.js.js.js.js.js.js.js.js.js'
import { getTheme } from '../utils/theme.js.js.js.js.js.js.js.js.js.js'
import { Select } from '@inkjs/ui'
import { useExitOnCtrlCD } from '../hooks/useExitOnCtrlCD.js.js.js.js.js.js.js.js.js.js'
import chalk from 'chalk.js.js.js.js.js'

type Props = {
  customApiKeyTruncated: string
  onDone(): void
}

export function ApproveApiKey({
  customApiKeyTruncated,
  onDone,
}: Props): React.ReactNode {
  const theme = getTheme()

  function onChange(value: 'yes' | 'no') {
    const config = getGlobalConfig()
    switch (value) {
      case 'yes': {
        saveGlobalConfig({
          ...config,
          customApiKeyResponses: {
            ...config.customApiKeyResponses,
            approved: [
              ...(config.customApiKeyResponses?.approved ?? []),
              customApiKeyTruncated,
            ],
          },
        })
        onDone()
        break
      }
      case 'no': {
        saveGlobalConfig({
          ...config,
          customApiKeyResponses: {
            ...config.customApiKeyResponses,
            rejected: [
              ...(config.customApiKeyResponses?.rejected ?? []),
              customApiKeyTruncated,
            ],
          },
        })
        onDone()
        break
      }
    }
  }

  const exitState = useExitOnCtrlCD(() => process.exit(0))

  return (
    <>
      <Box
        flexDirection="column"
        gap={1}
        padding={1}
        borderStyle="round"
        borderColor={theme.warning}
      >
        <Text bold color={theme.warning}>
          Detected a custom API key in your environment
        </Text>
        <Text>
          Your environment sets{' '}
          <Text color={theme.warning}>ANTHROPIC_API_KEY</Text>:{' '}
          <Text bold>sk-ant-...{customApiKeyTruncated}</Text>
        </Text>
        <Text>Do you want to use this API key?</Text>
        <Select
          options={[
            { label: `No (${chalk.bold('recommended')})`, value: 'no' },
            { label: 'Yes', value: 'yes' },
          ]}
          onChange={value => onChange(value as 'yes' | 'no')}
        />
      </Box>
      <Box marginLeft={3}>
        <Text dimColor>
          {exitState.pending ? (
            <>Press {exitState.keyName} again to exit</>
          ) : (
            <>Enter to confirm</>
          )}
        </Text>
      </Box>
    </>
  )
}
