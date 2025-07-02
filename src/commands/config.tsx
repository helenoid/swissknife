import * as React from 'react.js.js.js.js.js'; // Import React explicitly
import type { Command, LocalJSXCommand } from '../types/command.js.js.js.js.js.js.js.js.js.js.js'; // Updated import path
import { Config } from '../components/Config.js.js.js.js.js.js.js.js.js.js.js'; // Assuming .js extension is needed

const configCommand: LocalJSXCommand = {
  type: 'local-jsx',
  name: 'config',
  description: 'Open config panel',
  options: [], // No options for this command
  isEnabled: true,
  isHidden: false,
  async handler(args, onDone, context) { // Renamed call to handler, args and context are unused
    return <Config onClose={onDone} />;
  },
  userFacingName() {
    return 'config'
  },
} satisfies Command

export default configCommand;
