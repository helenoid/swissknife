import type { Command, LocalCommand } from '../types/command.js'; // Updated import path
import { getMessagesSetter } from '../messages.js';
import { getContext } from '../context.js';
import { getCodeStyle } from '../utils/style.js';
import { clearTerminal } from '../utils/terminal.js';
import { getOriginalCwd, setCwd } from '../utils/state.js';
import type { Message } from '../query.js';

export async function clearConversation(context: {
  setForkConvoWithMessagesOnTheNextRender: (
    forkConvoWithMessages: Message[],
  ) => void
}) {
  await clearTerminal()
  getMessagesSetter()([])
  context.setForkConvoWithMessagesOnTheNextRender([])
  getContext.cache.clear?.()
  getCodeStyle.cache.clear?.()
  await setCwd(getOriginalCwd());
}

const clearCommand: LocalCommand = {
  type: 'local',
  name: 'clear',
  description: 'Clear conversation history and free up context',
  options: [], // No options for this command
  isEnabled: true,
  isHidden: false,
  async handler(args, context) { // Renamed call to handler, args is unused but kept for signature
    await clearConversation(context);
    return 0; // Return 0 for success exit code
  },
  userFacingName() {
    return 'clear'
  },
};

export default clearCommand;
