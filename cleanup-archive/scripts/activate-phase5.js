#!/usr/bin/env node
// Activate Phase 5 features in the SwissKnife CLI

import { initializePhase5 } from './src/cli/integration/phase5-integration.js';
import { CommandRegistry } from './src/command-registry.js';
import { CLIUXEnhancer } from './src/ux/cli-ux-enhancer.js';

// Command line argument processing
const args = process.argv.slice(2);
const commands = ['--activate', '--help', '--version'];

async function main() {
  try {
    if (args.length === 0 || args.includes('--help')) {
      showHelp();
      return 0;
    }

    if (args.includes('--version')) {
      const pkg = require('./package.json');
      CLIUXEnhancer.formatInfo(`SwissKnife CLI Phase 5 Activator v${pkg.version}`);
      return 0;
    }

    if (args.includes('--activate')) {
      CLIUXEnhancer.formatHeader('SwissKnife Phase 5 Activator');
      CLIUXEnhancer.formatInfo('Initializing Phase 5 components...');
      
      const registry = new CommandRegistry();
      initializePhase5(registry);
      
      CLIUXEnhancer.formatSuccess('Phase 5 components activated successfully');
      CLIUXEnhancer.formatInfo('\nPhase 5 commands are now available in the SwissKnife CLI:');
      CLIUXEnhancer.formatInfo('  - performance: Run performance optimization tasks');
      CLIUXEnhancer.formatInfo('  - benchmark: Run performance benchmarks');
      CLIUXEnhancer.formatInfo('  - test: Run tests for the SwissKnife CLI');
      CLIUXEnhancer.formatInfo('  - docs: Generate documentation for the SwissKnife CLI');
      CLIUXEnhancer.formatInfo('  - release: Create distributable packages for release');
      
      return 0;
    }

    CLIUXEnhancer.formatError('Unknown command. Use --help for usage information.');
    return 1;
  } catch (error) {
    CLIUXEnhancer.formatError(`Error: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

function showHelp() {
  CLIUXEnhancer.formatHeader('SwissKnife Phase 5 Activator');
  console.log('This tool activates Phase 5 features in the SwissKnife CLI.\n');
  console.log('Usage: node activate-phase5.js [options]\n');
  console.log('Options:');
  console.log('  --activate    Activate Phase 5 features');
  console.log('  --version     Display version information');
  console.log('  --help        Display this help message');
}

main().then(
  code => process.exit(code),
  err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  }
);
