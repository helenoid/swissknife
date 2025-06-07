import { Box } from 'ink.js.js.js.js.js'
import * as React from 'react.js.js.js.js.js'
import type { AssistantMessage, Message, UserMessage } from '../query.js.js.js.js.js.js.js.js.js.js'
import type {
  ContentBlock,
  DocumentBlockParam,
  ImageBlockParam,
  TextBlockParam,
  ThinkingBlockParam,
  ToolResultBlockParam,
  ToolUseBlockParam,
} from '@anthropic-ai/sdk/resources/index.mjs'
import { Tool } from '../Tool.js.js.js.js.js.js.js.js.js.js'
import { logError } from '../utils/log.js.js.js.js.js.js.js.js.js.js'
import { UserToolResultMessage } from './messages/UserToolResultMessage/UserToolResultMessage.js.js.js.js.js.js.js.js.js.js'
import { AssistantToolUseMessage } from './messages/AssistantToolUseMessage.js.js.js.js.js.js.js.js.js.js'
import { AssistantTextMessage } from './messages/AssistantTextMessage.js.js.js.js.js.js.js.js.js.js'
import { UserTextMessage } from './messages/UserTextMessage.js.js.js.js.js.js.js.js.js.js'
import { NormalizedMessage } from '../utils/messages.js.js.js.js.js.js.js.js.js.js'
import { AssistantThinkingMessage } from './messages/AssistantThinkingMessage.js.js.js.js.js.js.js.js.js.js'
import { AssistantRedactedThinkingMessage } from './messages/AssistantRedactedThinkingMessage.js.js.js.js.js.js.js.js.js.js'
import { useTerminalSize } from '../hooks/useTerminalSize.js.js.js.js.js.js.js.js.js.js'

type Props = {
  message: UserMessage | AssistantMessage
  messages: NormalizedMessage[]
  // TODO: Find a way to remove this, and leave spacing to the consumer
  addMargin: boolean
  tools: Tool[]
  verbose: boolean
  debug: boolean
  erroredToolUseIDs: Set<string>
  inProgressToolUseIDs: Set<string>
  unresolvedToolUseIDs: Set<string>
  shouldAnimate: boolean
  shouldShowDot: boolean
  width?: number | string
}

export function Message({
  message,
  messages,
  addMargin,
  tools,
  verbose,
  debug,
  erroredToolUseIDs,
  inProgressToolUseIDs,
  unresolvedToolUseIDs,
  shouldAnimate,
  shouldShowDot,
  width,
}: Props): React.ReactNode {
  // Assistant message
  if (message.type === 'assistant') {
    return (
      <Box flexDirection="column" width="100%">
        {message.message.content.map((_, index) => (
          <AssistantMessage
            key={index}
            param={_}
            costUSD={message.costUSD}
            durationMs={message.durationMs}
            addMargin={addMargin}
            tools={tools}
            debug={debug}
            options={{ verbose }}
            erroredToolUseIDs={erroredToolUseIDs}
            inProgressToolUseIDs={inProgressToolUseIDs}
            unresolvedToolUseIDs={unresolvedToolUseIDs}
            shouldAnimate={shouldAnimate}
            shouldShowDot={shouldShowDot}
            width={width}
          />
        ))}
      </Box>
    )
  }

  // User message
  // TODO: normalize upstream
  const content =
    typeof message.message.content === 'string'
      ? [{ type: 'text', text: message.message.content } as TextBlockParam]
      : message.message.content
  return (
    <Box flexDirection="column" width="100%">
      {content.map((_, index) => (
        <UserMessage
          key={index}
          message={message}
          messages={messages}
          addMargin={addMargin}
          tools={tools}
          param={_ as TextBlockParam}
          options={{ verbose }}
        />
      ))}
    </Box>
  )
}

function UserMessage({
  message,
  messages,
  addMargin,
  tools,
  param,
  options: { verbose },
}: {
  message: UserMessage
  messages: Message[]
  addMargin: boolean
  tools: Tool[]
  param:
    | TextBlockParam
    | DocumentBlockParam
    | ImageBlockParam
    | ToolUseBlockParam
    | ToolResultBlockParam
  options: {
    verbose: boolean
  }
}): React.ReactNode {
  const { columns } = useTerminalSize()
  switch (param.type) {
    case 'text':
      return <UserTextMessage addMargin={addMargin} param={param} />
    case 'tool_result':
      return (
        <UserToolResultMessage
          param={param}
          message={message}
          messages={messages}
          tools={tools}
          verbose={verbose}
          width={columns - 5}
        />
      )
  }
}

function AssistantMessage({
  param,
  costUSD,
  durationMs,
  addMargin,
  tools,
  debug,
  options: { verbose },
  erroredToolUseIDs,
  inProgressToolUseIDs,
  unresolvedToolUseIDs,
  shouldAnimate,
  shouldShowDot,
  width,
}: {
  param:
    | ContentBlock
    | TextBlockParam
    | ImageBlockParam
    | ThinkingBlockParam
    | ToolUseBlockParam
    | ToolResultBlockParam
  costUSD: number
  durationMs: number
  addMargin: boolean
  tools: Tool[]
  debug: boolean
  options: {
    verbose: boolean
  }
  erroredToolUseIDs: Set<string>
  inProgressToolUseIDs: Set<string>
  unresolvedToolUseIDs: Set<string>
  shouldAnimate: boolean
  shouldShowDot: boolean
  width?: number | string
}): React.ReactNode {
  switch (param.type) {
    case 'tool_use':
      return (
        <AssistantToolUseMessage
          param={param}
          costUSD={costUSD}
          durationMs={durationMs}
          addMargin={addMargin}
          tools={tools}
          debug={debug}
          verbose={verbose}
          erroredToolUseIDs={erroredToolUseIDs}
          inProgressToolUseIDs={inProgressToolUseIDs}
          unresolvedToolUseIDs={unresolvedToolUseIDs}
          shouldAnimate={shouldAnimate}
          shouldShowDot={shouldShowDot}
        />
      )
    case 'text':
      return (
        <AssistantTextMessage
          param={param}
          costUSD={costUSD}
          durationMs={durationMs}
          debug={debug}
          addMargin={addMargin}
          shouldShowDot={shouldShowDot}
          verbose={verbose}
          width={width}
        />
      )
    case 'redacted_thinking':
      return <AssistantRedactedThinkingMessage addMargin={addMargin} />
    case 'thinking':
      return <AssistantThinkingMessage addMargin={addMargin} param={param} />
    default:
      logError(`Unable to render message type: ${param.type}`)
      return null
  }
}
