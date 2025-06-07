import * as React from 'react.js.js.js.js.js';
import type { Command, LocalJSXCommand } from '../types/command.js.js.js.js.js.js.js.js.js.js.js'; // Updated import path
import { Onboarding } from '../components/Onboarding.js.js.js.js.js.js.js.js.js.js.js'; // Assuming .js extension
import { clearTerminal } from '../utils/terminal.js.js.js.js.js.js.js.js.js.js.js'; // Assuming .js extension
import { getGlobalConfig, saveGlobalConfig } from '../utils/config.js.js.js.js.js.js.js.js.js.js.js'; // Assuming .js extension
import { clearConversation } from './clear.js.js.js.js.js.js.js.js.js.js.js'; // Assuming .js extension

const onboardingCommand: LocalJSXCommand = {
  type: 'local-jsx',
  name: 'onboarding',
  description: 'Run through the onboarding flow',
  options: [], // No options for this command
  isEnabled: true,
  isHidden: false,
  async handler(args, onDone, context) { // Renamed call to handler, args is unused
    await clearTerminal();
    const config = getGlobalConfig();
    saveGlobalConfig({
      ...config,
      theme: 'dark', // Force dark theme for onboarding?
    });

    return (
      <Onboarding
        onDone={async () => {
          // Pass the correct context structure if clearConversation expects it
          await clearConversation(context);
          onDone();
        }}
      />
    );
  },
  userFacingName() {
    return 'onboarding';
  },
};

export default onboardingCommand;
