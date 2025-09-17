#!/usr/bin/env tsx
/**
 * Simple CLI Entry Point
 * 
 * A clean, working CLI that demonstrates the flexible command system
 */

// Import our unified command system - use relative imports to avoid issues
const { unifiedCLIAdapter } = await import('./shared/cli/unified-adapter.js');
await import('./shared/commands/builtin.js'); // Import to register built-in commands

async function main() {
  const args = process.argv.slice(2);
  
  // Create a CLI session
  const session = unifiedCLIAdapter.createSession('cli', {
    workingDirectory: process.cwd(),
    user: process.env.USER || 'user'
  });

  try {
    if (args.length === 0) {
      // Show help when no arguments provided
      const result = await unifiedCLIAdapter.executeCommand('help', session.id);
      console.log(unifiedCLIAdapter.formatResult(result));
      process.exit(0);
    }

    // Handle special cases first
    if (args[0] === 'version' || args[0] === '--version') {
      console.log('SwissKnife CLI v0.0.53 - Flexible AI-Powered Assistant');
      process.exit(0);
    }

    // Join arguments to form the command
    const commandLine = args.join(' ');
    
    // Execute the command using the flexible interpreter
    const result = await unifiedCLIAdapter.executeCommand(commandLine, session.id);
    
    // Output the result
    console.log(unifiedCLIAdapter.formatResult(result));
    
    // Exit with appropriate code
    process.exit(result.exitCode || 0);
    
  } catch (error) {
    console.error('CLI Error:', (error as Error).message);
    console.error('Try using natural language: "show me help" or "what can you do?"');
    process.exit(1);
  } finally {
    // Clean up session
    unifiedCLIAdapter.closeSession(session.id);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  console.log('\nGoodbye!');
  process.exit(0);
});

process.on('SIGTERM', () => {
  process.exit(0);
});

// Run the CLI
main().catch((error) => {
  console.error('Failed to start SwissKnife CLI:', error.message);
  
  // Fall back to simple CLI
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === 'help') {
    console.log(`
SwissKnife CLI - AI-powered development assistant

Usage:
  swissknife <command> [options]
  swissknife "natural language command"

Examples:
  swissknife help
  swissknife status
  swissknife "show me the system status"
  swissknife "create a new task"

The CLI supports both specific commands and natural language input.
    `);
  } else if (args[0] === 'version') {
    console.log('SwissKnife CLI v0.0.53');
  } else {
    console.log('SwissKnife CLI is starting up...');
    console.log('Command system not fully loaded yet. Try again in a moment.');
  }
  
  process.exit(0);
});