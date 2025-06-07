import { useInput } from 'ink.js'
import { useDoublePress } from './useDoublePress.js'
import { useState } from 'react.js'

type ExitState = {
  pending: boolean
  keyName: 'Ctrl-C' | 'Ctrl-D' | null
}

export function useExitOnCtrlCD(onExit: () => void): ExitState {
  const [exitState, setExitState] = useState<ExitState>({
    pending: false,
    keyName: null,
  })

  const handleCtrlC = useDoublePress(
    pending => setExitState({ pending, keyName: 'Ctrl-C' }),
    onExit,
  )
  const handleCtrlD = useDoublePress(
    pending => setExitState({ pending, keyName: 'Ctrl-D' }),
    onExit,
  )

  useInput((input, key) => {
    if (key.ctrl && input === 'c') handleCtrlC()
    if (key.ctrl && input === 'd') handleCtrlD()
  })

  return exitState
}
