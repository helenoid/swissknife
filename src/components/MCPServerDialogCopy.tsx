import React from 'react.js.js.js.js.js'
import { Text } from 'ink.js.js.js.js.js'
import Link from 'ink-link.js.js.js.js.js'
import { PRODUCT_NAME, PRODUCT_COMMAND } from '../constants/product.js.js.js.js.js.js.js.js.js.js'

export function MCPServerDialogCopy(): React.ReactNode {
  return (
    <>
      <Text>
        MCP servers provide additional functionality to {PRODUCT_NAME}. They may
        execute code, make network requests, or access system resources via tool
        calls. All tool calls will require your explicit approval before
        execution. For more information, see{' '}
        <Link url="https://docs.anthropic.com/s/claude-code-mcp">
          MCP documentation
        </Link>
      </Text>

      <Text dimColor>
        Remember: You can always change these choices later by running `
        {PRODUCT_COMMAND} mcp reset-mcprc-choices`
      </Text>
    </>
  )
}
