#!/usr/bin/env node
/**
 * SwissKnife CLI Entry Point
 * 
 * This is the main entry point for the SwissKnife CLI tool.
 * It provides flexible, AI-powered command interpretation similar to GitHub Codex/Claude Code.
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

// Dynamic import to handle both development and built versions
async function main() {
  try {
    // Try to import the built CLI first
    const distCliPath = join(__dirname, 'dist', 'cli.js');
    if (existsSync(distCliPath)) {
      try {
        const { CLI } = await import(distCliPath);
        await runCLI(CLI);
        return;
      } catch (buildError) {
        console.warn('Built CLI failed, trying development mode...');
      }
    }
    
    // Try development mode with tsx
    const tsxPath = join(__dirname, 'node_modules', '.bin', 'tsx');
    const cliMinimalPath = join(__dirname, 'src', 'cli-minimal.ts');
    
    if (existsSync(tsxPath) && existsSync(cliMinimalPath)) {
      try {
        const { spawn } = await import('child_process');
        
        const child = spawn('node', [tsxPath, cliMinimalPath, ...process.argv.slice(2)], {
          stdio: 'inherit',
          cwd: __dirname
        });
        
        child.on('exit', (code) => {
          process.exit(code || 0);
        });
        
        child.on('error', (error) => {
          console.error('Failed to start CLI with tsx:', error.message);
          fallbackToSimple();
        });
        
        return;
      } catch (devError) {
        console.warn('Development mode failed, using fallback...');
      }
    }
    
    // Fall back to simple mode
    fallbackToSimple();
    
  } catch (error) {
    console.error('Failed to start SwissKnife CLI:', error.message);
    fallbackToSimple();
  }
}

async function runCLI(CLI) {
  const cli = await CLI.create();
  const args = process.argv.slice(2);
  await cli.run(args);
}

function fallbackToSimple() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === 'help' || args[0] === '--help') {
    console.log(`
SwissKnife CLI - AI-powered development assistant

🚀 USAGE:
  You can use either specific commands OR natural language!

📝 EXAMPLES:
  swissknife help                    → Show this help
  swissknife status                  → Show system status  
  swissknife "show me the status"    → Natural language version
  swissknife version                 → Show version
  
💡 TIP: SwissKnife understands natural language!
Try: "what can you do?" or "show me help"

⚠️  Note: CLI is starting in fallback mode. 
   Run 'npm install' to enable full features.
    `);
  } else if (args[0] === 'version' || args[0] === '--version') {
    console.log('SwissKnife CLI v0.0.53 (Fallback Mode)');
  } else if (args[0] === 'status') {
    console.log(`
SwissKnife System Status (Fallback Mode)
========================================

🖥️  Environment: CLI (Fallback)
📁 Working Directory: ${process.cwd()}
👤 User: ${process.env.USER || 'unknown'}
📦 Version: 0.0.53

⚠️  Running in fallback mode. 
   Install dependencies for full functionality.
    `);
  } else {
    console.log(`
🤖 SwissKnife CLI received: "${args.join(' ')}"

The CLI is designed to understand natural language commands like:
- "show me help"
- "what's the system status?"  
- "what version am I running?"

⚠️  Currently in fallback mode.
   Run 'npm install' then try your command again.
    `);
  }
  
  process.exit(0);
}

main().catch((error) => {
  console.error('Unhandled error:', error);
  fallbackToSimple();
});