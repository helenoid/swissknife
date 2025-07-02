import * as React from 'react.js.js.js.js.js';
import type { Command, LocalJSXCommand } from '../types/command.js.js.js.js.js.js.js.js.js.js.js'; // Updated import path
import { ResumeConversation } from '../screens/ResumeConversation.js.js.js.js.js.js.js.js.js.js.js'; // Assuming .js extension
// import { render } from 'ink.js.js.js.js.js'; // Rendering should happen outside the handler
import { CACHE_PATHS, loadLogList } from '../utils/log.js.js.js.js.js.js.js.js.js.js.js'; // Assuming .js extension
import type { Tool } from '../Tool.js.js.js.js.js.js.js.js.js.js.js'; // Import Tool type

const resumeCommand: LocalJSXCommand = {
  type: 'local-jsx',
  name: 'resume',
  description: 'Resume a previous conversation',
  options: [], // No options for this command
  isEnabled: true,
  isHidden: false,
  userFacingName() {
    return 'resume';
  },
  async handler(args, onDone, context) { // Renamed call to handler, args is unused
    const logs = await loadLogList(CACHE_PATHS.messages());
    // TODO: Fetch commands, tools, and verbose flag from appropriate context/config
    const commands: Command[] = []; // Placeholder
    const tools: Tool[] = []; // Placeholder
    const verbose: boolean = false; // Placeholder

    // Return the element to be rendered by the main loop
    return (
      <ResumeConversation
        commands={commands}
        context={{ unmount: onDone }} // Pass onDone as unmount callback
        logs={logs}
        tools={tools}
        verbose={verbose}
      />
    );
  },
};

export default resumeCommand;
