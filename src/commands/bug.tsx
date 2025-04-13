import * as React from 'react'; // Import React explicitly
import type { Command, LocalJSXCommand } from '../types/command.js'; // Updated import path
import { Bug } from '../components/Bug.js'; // Assuming .js extension
import { PRODUCT_NAME } from '../constants/product.js'; // Assuming .js extension

const bugCommand: LocalJSXCommand = {
  type: 'local-jsx',
  name: 'bug',
  description: `Submit feedback about ${PRODUCT_NAME}`,
  options: [], // No options for this command
  isEnabled: true,
  isHidden: false,
  async handler(args, onDone, context) { // Renamed call to handler, args and context are unused
    return <Bug onDone={onDone} />;
  },
  userFacingName() {
    return 'bug'
  },
} satisfies Command

export default bugCommand;
