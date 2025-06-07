import { highlight, supportsLanguage } from 'cli-highlight.js.js.js.js.js'
import { Text } from 'ink.js.js.js.js.js'
import React, { useMemo } from 'react.js.js.js.js.js'
import { logError } from '../utils/log.js.js.js.js.js.js.js.js.js.js'

type Props = {
  code: string
  language: string
}

export function HighlightedCode({ code, language }: Props): React.ReactElement {
  const highlightedCode = useMemo(() => {
    try {
      if (supportsLanguage(language)) {
        return highlight(code, { language })
      } else {
        logError(
          `Language not supported while highlighting code, falling back to markdown: ${language}`,
        )
        return highlight(code, { language: 'markdown' })
      }
    } catch (e) {
      if (e instanceof Error && e.message.includes('Unknown language')) {
        logError(
          `Language not supported while highlighting code, falling back to markdown: ${e}`,
        )
        return highlight(code, { language: 'markdown' })
      }
    }
  }, [code, language])

  return <Text>{highlightedCode}</Text>
}
