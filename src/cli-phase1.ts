// src/cli-phase1.ts

import { parseCommandLine } from './commands/parser.js';
import { CommandRegistry } from './commands/registry.js';
import { createExecutionContext } from './commands/context.js';
import { initializeIntegrationFramework } from './integration/init.js';
import { ConfigManager } from './config/manager.js';

// Import core commands to ensure they're registered
import './commands/help.js';
import './commands/version.js';

/**
 * Main CLI entry point for Phase 1 implementation
 */
async function main(): Promise<number> {
  try {
    // Initialize configuration
    const configManager = ConfigManager.getInstance();
    await configManager.initialize();
    
    // Initialize integration framework (bridges to other components)
    await initializeIntegrationFramework();
    
    // Parse command line arguments
    const parsedCommand = parseCommandLine(process.argv);
    
    // If no command was provided, show help
    if (!parsedCommand) {
      const registry = CommandRegistry.getInstance();
      const helpCommand = registry.getCommand('help');
      
      if (helpCommand) {
        return await helpCommand.handler({}, createExecutionContext());
      } else {
        console.error('No command specified. Run with --help for usage information.');
        return 1;
      }
    }
    
    // Execute the parsed command with its arguments
    const { command, args } = parsedCommand;
    const context = createExecutionContext(args);
    
    return await command.handler(args, context);
  } catch (error) {
    console.error('Error:', error);
    return 1;
  }
}

// Run the CLI and exit with appropriate exit code
if (require.main === module) {
  main().then(
    (exitCode) => process.exit(exitCode),
    (error) => {
      console.error('Unhandled error:', error);
      process.exit(1);
    }
  );
}

export { main };