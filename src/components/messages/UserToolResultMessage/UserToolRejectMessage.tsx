import * as React from 'react.js.js.js.js.js'
import { Tool } from '../../../Tool.js.js.js.js.js.js.js.js.js.js'
import { Message } from '../../../query.js.js.js.js.js.js.js.js.js.js'
import { FallbackToolUseRejectedMessage } from '../../FallbackToolUseRejectedMessage.js.js.js.js.js.js.js.js.js.js'
import { useGetToolFromMessages } from './utils.js.js.js.js.js.js.js.js.js.js'
import { useTerminalSize } from '../../../hooks/useTerminalSize.js.js.js.js.js.js.js.js.js.js'

type Props = {
  toolUseID: string
  messages: Message[]
  tools: Tool[]
  verbose: boolean
}

export function UserToolRejectMessage({
  toolUseID,
  tools,
  messages,
  verbose,
}: Props): React.ReactNode {
  const { columns } = useTerminalSize()
  const { tool, toolUse } = useGetToolFromMessages(toolUseID, tools, messages)
  const input = tool.inputSchema.safeParse(toolUse.input)
  if (input.success) {
    return tool.renderToolUseRejectedMessage(input.data, {
      columns,
      verbose,
    })
  }
  return <FallbackToolUseRejectedMessage />
}
