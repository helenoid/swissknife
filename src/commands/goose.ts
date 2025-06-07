/**
 * Goose Integration CLI Command
 * 
 * Provides CLI commands to interact with the Goose Integration Bridge
 * for accessing Goose AI capabilities.
 */

import { Command } from 'commander.js';
import { IntegrationRegistry } from '../integration/registry.js';
import { GooseBridge } from '../integration/bridges/goose-bridge.js';
import { LogManager } from '../utils/logging/manager.js';
import chalk from 'chalk.js';
import fs from 'fs.js';
import path from 'path.js';

const logger = LogManager.getInstance();

export const goose = new Command('goose')
  .description('Interact with the Goose AI Integration Bridge')
  .addHelpText('after', `
Examples:
  $ swissknife goose status                  # Check the status of the Goose bridge
  $ swissknife goose models                  # List available AI models
  $ swissknife goose tools                   # List available tools
  $ swissknife goose process "Hello, world!" # Process a message
  $ swissknife goose process -f message.txt  # Process a message from a file
  `);

// Helper function to get or initialize the Goose bridge
async function getGooseBridge() {
  const registry = IntegrationRegistry.getInstance();
  let bridge = registry.getBridge('goose-main');
  
  if (!bridge) {
    // Initialize a new bridge
    bridge = new GooseBridge();
    registry.registerBridge(bridge);
  }
  
  // Ensure bridge is initialized
  if (!bridge.isInitialized()) {
    console.log(chalk.blue('Initializing Goose bridge...'));
    await registry.initializeBridge(bridge.id);
  }
  
  return bridge;
}

goose
  .command('status')
  .description('Check the status of the Goose integration bridge')
  .action(async () => {
    try {
      const registry = IntegrationRegistry.getInstance();
      const bridge = registry.getBridge('goose-main');
      
      if (!bridge) {
        console.log(chalk.yellow('Goose bridge not registered'));
        console.log('Run any goose command to automatically register the bridge');
        return;
      }
      
      const isInitialized = bridge.isInitialized();
      
      if (isInitialized) {
        console.log(chalk.green('✓ Goose bridge is initialized and ready'));
        
        // Get version information
        const versionInfo = await bridge.call('getVersion', {});
        console.log(`Version: ${versionInfo.version}`);
      } else {
        console.log(chalk.yellow('Goose bridge is registered but not initialized'));
        console.log('Run any goose command to automatically initialize the bridge');
      }
    } catch (error) {
      console.error(chalk.red(`Error checking Goose bridge status: ${error.message}`));
    }
  });

goose
  .command('models')
  .description('List available AI models')
  .action(async () => {
    try {
      const bridge = await getGooseBridge();
      const models = await bridge.call('listModels', {});
      
      console.log(chalk.green('Available AI Models:'));
      console.log('───────────────────────────────────');
      
      models.forEach(model => {
        console.log(`${chalk.bold(model.id)} - ${model.name}`);
        console.log(`Provider: ${model.provider}`);
        console.log('───────────────────────────────────');
      });
    } catch (error) {
      console.error(chalk.red(`Error listing models: ${error.message}`));
    }
  });

goose
  .command('tools')
  .description('List available tools')
  .action(async () => {
    try {
      const bridge = await getGooseBridge();
      const tools = await bridge.call('listTools', {});
      
      console.log(chalk.green('Available Tools:'));
      console.log('───────────────────────────────────');
      
      tools.forEach(tool => {
        console.log(`${chalk.bold(tool.name)}`);
        console.log(`Description: ${tool.description}`);
        console.log('───────────────────────────────────');
      });
    } catch (error) {
      console.error(chalk.red(`Error listing tools: ${error.message}`));
    }
  });

goose
  .command('process [message]')
  .description('Process a message using the Goose AI system')
  .option('-f, --file <path>', 'Read message from file')
  .option('-m, --model <model>', 'Specify the AI model to use')
  .option('-t, --tools <tools>', 'Comma-separated list of allowed tools')
  .option('-o, --output <path>', 'Save response to file')
  .action(async (message, options) => {
    try {
      let messageContent = message;
      
      // Read from file if specified
      if (options.file) {
        const filePath = path.resolve(options.file);
        if (!fs.existsSync(filePath)) {
          throw new Error(`File not found: ${filePath}`);
        }
        
        messageContent = fs.readFileSync(filePath, 'utf-8');
        console.log(chalk.blue(`Read message from file: ${options.file}`));
      }
      
      // Ensure we have a message to process
      if (!messageContent) {
        throw new Error('No message provided. Use [message] argument or --file option');
      }
      
      const bridge = await getGooseBridge();
      
      // Prepare request parameters
      const params: any = { message: messageContent };
      
      if (options.model) {
        params.model = options.model;
      }
      
      if (options.tools) {
        params.allowedTools = options.tools.split(',');
      }
      
      console.log(chalk.blue('Processing message...'));
      
      // Process the message
      const response = await bridge.call('processMessage', params);
      
      // Display the response
      console.log('───────────────────────────────────');
      console.log(chalk.green('Response:'));
      console.log(response.content);
      console.log('───────────────────────────────────');
      
      // Check for tool calls
      if (response.toolCalls && response.toolCalls.length > 0) {
        console.log(chalk.yellow(`\nTool Calls: ${response.toolCalls.length}`));
        
        response.toolCalls.forEach((toolCall, index) => {
          console.log(`${index + 1}. Tool: ${toolCall.name}`);
          console.log(`   ${JSON.stringify(toolCall.arguments)}`);
        });
      }
      
      // Save to file if specified
      if (options.output) {
        fs.writeFileSync(options.output, response.content);
        console.log(chalk.green(`\n✓ Response saved to ${options.output}`));
      }
      
    } catch (error) {
      console.error(chalk.red(`Error processing message: ${error.message}`));
    }
  });

export default goose;