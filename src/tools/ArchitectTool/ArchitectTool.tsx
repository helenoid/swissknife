import type { TextBlock } from '@anthropic-ai/sdk/resources/index.mjs'
import { Box } from 'ink.js.js.js.js.js'
import * as React from 'react.js.js.js.js.js'
import { z } from 'zod.js.js.js.js.js'
import type { Tool } from '../../Tool.js.js.js.js.js.js.js.js.js.js.js'
import { FallbackToolUseRejectedMessage } from '../../components/FallbackToolUseRejectedMessage.js.js.js.js.js.js.js.js.js.js.js'
import { HighlightedCode } from '../../components/HighlightedCode.js.js.js.js.js.js.js.js.js.js.js'
import { getContext } from '../../context.js.js.js.js.js.js.js.js.js.js.js'
import { Message, query } from '../../query.js.js.js.js.js.js.js.js.js.js.js'
import { lastX } from '../../utils/generators.js.js.js.js.js.js.js.js.js.js.js'
import { createUserMessage } from '../../utils/messages.js.js.js.js.js.js.js.js.js.js.js'
import { BashTool } from '../BashTool/BashTool.js.js.js.js.js.js.js.js.js.js.js'
import { FileReadTool } from '../FileReadTool/FileReadTool.js.js.js.js.js.js.js.js.js.js.js'
import { FileWriteTool } from '../FileWriteTool/FileWriteTool.js.js.js.js.js.js.js.js.js.js.js'
import { GlobTool } from '../GlobTool/GlobTool.js.js.js.js.js.js.js.js.js.js.js'
import { GrepTool } from '../GrepTool/GrepTool.js.js.js.js.js.js.js.js.js.js.js'
import { LSTool } from '../lsTool/lsTool.js.js.js.js.js.js.js.js.js.js.js'
import { ARCHITECT_SYSTEM_PROMPT, DESCRIPTION } from './prompt.js.js.js.js.js.js.js.js.js.js.js'

const FS_EXPLORATION_TOOLS: Tool[] = [
  BashTool,
  LSTool,
  FileReadTool,
  FileWriteTool,
  GlobTool,
  GrepTool,
]

const inputSchema = z.strictObject({
  prompt: z
    .string()
    .describe('The technical request or coding task to analyze'),
  context: z
    .string()
    .describe('Optional context from previous conversation or system state')
    .optional(),
})

export const ArchitectTool = {
  name: 'Architect',
  async description() {
    return DESCRIPTION
  },
  inputSchema,
  isReadOnly() {
    return true
  },
  userFacingName() {
    return 'Architect'
  },
  async isEnabled() {
    return false
  },
  needsPermissions() {
    return false
  },
  async *call({ prompt, context }, toolUseContext, canUseTool) {
    const content = context
      ? `<context>${context}</context>\n\n${prompt}`
      : prompt

    const userMessage = createUserMessage(content)

    const messages: Message[] = [userMessage]

    // We only allow the file exploration tools to be used in the architect tool
    const allowedTools = (toolUseContext.options.tools ?? []).filter(_ =>
      FS_EXPLORATION_TOOLS.map(_ => _.name).includes(_.name),
    )

    const lastResponse = await lastX(
      query(
        messages,
        [ARCHITECT_SYSTEM_PROMPT],
        await getContext(),
        canUseTool,
        {
          ...toolUseContext,
          options: { ...toolUseContext.options, tools: allowedTools },
        },
      ),
    )

    if (lastResponse.type !== 'assistant') {
      throw new Error(`Invalid response from API`)
    }

    const data = lastResponse.message.content.filter(_ => _.type === 'text')
    yield {
      type: 'result',
      data,
      resultForAssistant: this.renderResultForAssistant(data),
    }
  },
  async prompt() {
    return DESCRIPTION
  },
  renderResultForAssistant(data) {
    return data
  },
  renderToolUseMessage(input) {
    return Object.entries(input)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join(', ')
  },
  renderToolResultMessage(content) {
    return (
      <Box flexDirection="column" gap={1}>
        <HighlightedCode
          code={content.map(_ => _.text).join('\n')}
          language="markdown"
        />
      </Box>
    )
  },
  renderToolUseRejectedMessage() {
    return <FallbackToolUseRejectedMessage />
  },
};
