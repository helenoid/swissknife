import { Box, Text } from 'ink.js.js.js.js.js'
import React from 'react.js.js.js.js.js'
import { z } from 'zod.js.js.js.js.js'
import { Cost } from '../../components/Cost.js.js.js.js.js.js.js.js.js.js.js';
import { FallbackToolUseRejectedMessage } from '../../components/FallbackToolUseRejectedMessage.js.js.js.js.js.js.js.js.js.js.js';
import { Tool } from '../../Tool.js.js.js.js.js.js.js.js.js.js.js';
import { getCwd } from '../../utils/state.js.js.js.js.js.js.js.js.js.js.js';
import { glob } from '../../utils/file.js.js.js.js.js.js.js.js.js.js.js';
import { DESCRIPTION, TOOL_NAME_FOR_PROMPT } from './prompt.js.js.js.js.js.js.js.js.js.js.js';
import { isAbsolute, relative, resolve } from 'path.js.js.js.js.js';
import { hasReadPermission } from '../../utils/permissions/filesystem.js.js.js.js.js.js.js.js.js.js.js';

const inputSchema = z.strictObject({
  pattern: z.string().describe('The glob pattern to match files against'),
  path: z
    .string()
    .optional()
    .describe(
      'The directory to search in. Defaults to the current working directory.',
    ),
})

type Output = {
  durationMs: number
  numFiles: number
  filenames: string[]
  truncated: boolean
}

export const GlobTool = {
  name: TOOL_NAME_FOR_PROMPT,
  async description() {
    return DESCRIPTION
  },
  userFacingName() {
    return 'Search'
  },
  inputSchema,
  async isEnabled() {
    return true
  },
  isReadOnly() {
    return true
  },
  needsPermissions({ path }) {
    return !hasReadPermission(path || getCwd())
  },
  async prompt() {
    return DESCRIPTION
  },
  renderToolUseMessage({ pattern, path }, { verbose }) {
    const absolutePath = path
      ? isAbsolute(path)
        ? path
        : resolve(getCwd(), path)
      : undefined
    const relativePath = absolutePath
      ? relative(getCwd(), absolutePath)
      : undefined
    return `pattern: "${pattern}"${relativePath || verbose ? `, path: "${verbose ? absolutePath : relativePath}"` : ''}`
  },
  renderToolUseRejectedMessage() {
    return <FallbackToolUseRejectedMessage />
  },
  renderToolResultMessage(output) {
    // Handle string content for backward compatibility
    if (typeof output === 'string') {
      output = JSON.parse(output) as Output
    }

    return (
      <Box justifyContent="space-between" width="100%">
        <Box flexDirection="row">
          <Text>&nbsp;&nbsp;⎿ &nbsp;Found </Text>
          <Text bold>{output.numFiles} </Text>
          <Text>
            {output.numFiles === 0 || output.numFiles > 1 ? 'files' : 'file'}
          </Text>
        </Box>
        <Cost costUSD={0} durationMs={output.durationMs} debug={false} />
      </Box>
    )
  },
  async *call({ pattern, path }, { abortController }) {
    const start = Date.now()
    const { files, truncated } = await glob(
      pattern,
      path ?? getCwd(),
      { limit: 100, offset: 0 },
      abortController.signal,
    )
    const output: Output = {
      filenames: files,
      durationMs: Date.now() - start,
      numFiles: files.length,
      truncated,
    }
    yield {
      type: 'result',
      resultForAssistant: this.renderResultForAssistant(output),
      data: output,
    }
  },
  renderResultForAssistant(output) {
    let result = output.filenames.join('\n')
    if (output.filenames.length === 0) {
      result = 'No files found'
    }
    // Only add truncation message if results were actually truncated
    else if (output.truncated) {
      result +=
        '\n(Results are truncated. Consider using a more specific path or pattern.)'
    }
    return result
  },
} as any
