/**
 * Configuration Commands - Commands for managing configuration
 */

import { CommandRegistry, Command } from '../command-registry';
import { ConfigurationManager } from '../config/manager';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Load configuration commands
 */
export async function loadConfigCommands(): Promise<void> {
  const registry = CommandRegistry.getInstance();
  
  // Register config commands
  registry.registerCommand(configGetCommand);
  registry.registerCommand(configSetCommand);
  registry.registerCommand(configListCommand);
  registry.registerCommand(configResetCommand);
  registry.registerCommand(configImportCommand);
  registry.registerCommand(configExportCommand);
}

/**
 * Config get command
 */
export const configGetCommand: Command = {
  id: 'config:get',
  name: 'config:get',
  description: 'Get a configuration value',
  options: [
    {
      name: 'default',
      alias: 'd',
      type: 'string',
      description: 'Default value if the configuration key is not found'
    }
  ],
  examples: [
    'swissknife config:get core.ui.theme',
    'swissknife config:get models.providers.openai.defaultModel --default gpt-4'
  ],
  category: 'config',
  handler: async (args, context) => {
    const { default: defaultValue, _ } = args;
    const configManager = context.config as ConfigurationManager;
    
    // Get key from positional argument
    const key = _[0];
    
    if (!key) {
      console.error('Error: Configuration key is required');
      console.log('Usage: swissknife config:get <key>');
      return 1;
    }
    
    // Get the value
    const value = configManager.get(key, defaultValue);
    
    if (value === undefined) {
      console.log(`Configuration key not found: ${key}`);
      return 1;
    }
    
    // Output the value
    if (typeof value === 'object') {
      console.log(JSON.stringify(value, null, 2));
    } else {
      console.log(value);
    }
    
    return 0;
  }
};

/**
 * Config set command
 */
export const configSetCommand: Command = {
  id: 'config:set',
  name: 'config:set',
  description: 'Set a configuration value',
  options: [
    {
      name: 'type',
      alias: 't',
      type: 'string',
      description: 'Type of the value (string, number, boolean, json)',
      default: 'string'
    }
  ],
  examples: [
    'swissknife config:set core.ui.theme dark',
    'swissknife config:set core.ui.verbose true --type boolean',
    'swissknife config:set models.defaultProvider openai'
  ],
  category: 'config',
  handler: async (args, context) => {
    const { type, _ } = args;
    const configManager = context.config as ConfigurationManager;
    
    // Get key and value from positional arguments
    const key = _[0];
    const rawValue = _[1];
    
    if (!key || rawValue === undefined) {
      console.error('Error: Both key and value are required');
      console.log('Usage: swissknife config:set <key> <value>');
      return 1;
    }
    
    // Parse value based on specified type
    let value: any;
    try {
      switch (type) {
        case 'number':
          value = Number(rawValue);
          if (isNaN(value)) {
            throw new Error('Invalid number');
          }
          break;
        case 'boolean':
          if (rawValue.toLowerCase() === 'true') {
            value = true;
          } else if (rawValue.toLowerCase() === 'false') {
            value = false;
          } else {
            throw new Error('Boolean value must be either "true" or "false"');
          }
          break;
        case 'json':
          value = JSON.parse(rawValue);
          break;
        case 'string':
        default:
          value = rawValue;
          break;
      }
    } catch (error) {
      console.error(`Error parsing value: ${error.message}`);
      return 1;
    }
    
    // Set the value
    configManager.set(key, value);
    
    // Save configuration
    try {
      await configManager.save();
      console.log(`Configuration key "${key}" set to:`, value);
      return 0;
    } catch (error) {
      console.error(`Error saving configuration: ${error.message}`);
      return 1;
    }
  }
};

/**
 * Config list command
 */
export const configListCommand: Command = {
  id: 'config:list',
  name: 'config:list',
  description: 'List configuration sections or values',
  options: [
    {
      name: 'section',
      alias: 's',
      type: 'string',
      description: 'Configuration section to list (e.g., core, models)'
    },
    {
      name: 'format',
      alias: 'f',
      type: 'string',
      description: 'Output format (json, yaml, table)',
      default: 'json'
    }
  ],
  examples: [
    'swissknife config:list',
    'swissknife config:list --section core',
    'swissknife config:list --format table'
  ],
  category: 'config',
  handler: async (args, context) => {
    const { section, format } = args;
    const configManager = context.config as ConfigurationManager;
    
    let config: any;
    
    if (section) {
      // Get specific section
      config = configManager.get(section, {});
    } else {
      // Get entire configuration
      config = {};
      const sections = [
        'core',
        'models',
        'integration',
        'project',
        'tasks',
        'worker'
      ];
      
      for (const sec of sections) {
        const sectionConfig = configManager.get(sec, null);
        if (sectionConfig !== null) {
          config[sec] = sectionConfig;
        }
      }
    }
    
    // Output based on format
    switch (format.toLowerCase()) {
      case 'json':
        console.log(JSON.stringify(config, null, 2));
        break;
      case 'yaml':
        // Simple YAML-like output
        outputYaml(config);
        break;
      case 'table':
        // Simple table-like output for flat objects
        outputTable(config);
        break;
      default:
        console.log(JSON.stringify(config, null, 2));
        break;
    }
    
    return 0;
  }
};

/**
 * Config reset command
 */
export const configResetCommand: Command = {
  id: 'config:reset',
  name: 'config:reset',
  description: 'Reset configuration to defaults',
  options: [
    {
      name: 'section',
      alias: 's',
      type: 'string',
      description: 'Configuration section to reset (e.g., core, models)'
    },
    {
      name: 'confirm',
      alias: 'y',
      type: 'boolean',
      description: 'Confirm reset without prompting',
      default: false
    }
  ],
  examples: [
    'swissknife config:reset --section core',
    'swissknife config:reset --confirm'
  ],
  category: 'config',
  handler: async (args, context) => {
    const { section, confirm } = args;
    const configManager = context.config as ConfigurationManager;
    
    if (!confirm) {
      console.log('WARNING: This will reset your configuration to defaults.');
      console.log('Use --confirm to proceed.');
      return 0;
    }
    
    try {
      if (section) {
        // Reset specific section
        configManager.resetSection(section);
        console.log(`Configuration section "${section}" reset to defaults`);
      } else {
        // Reset entire configuration
        configManager.clear();
        console.log('Configuration reset to defaults');
      }
      
      // Save configuration
      await configManager.save();
      
      return 0;
    } catch (error) {
      console.error(`Error resetting configuration: ${error.message}`);
      return 1;
    }
  }
};

/**
 * Config import command
 */
export const configImportCommand: Command = {
  id: 'config:import',
  name: 'config:import',
  description: 'Import configuration from a JSON file',
  options: [
    {
      name: 'file',
      alias: 'f',
      type: 'string',
      description: 'JSON file to import',
      required: true
    },
    {
      name: 'section',
      alias: 's',
      type: 'string',
      description: 'Configuration section to import into (e.g., core, models)'
    },
    {
      name: 'merge',
      alias: 'm',
      type: 'boolean',
      description: 'Merge with existing configuration instead of replacing',
      default: true
    }
  ],
  examples: [
    'swissknife config:import --file config.json',
    'swissknife config:import --file models.json --section models',
    'swissknife config:import --file config.json --merge false'
  ],
  category: 'config',
  handler: async (args, context) => {
    const { file, section, merge } = args;
    const configManager = context.config as ConfigurationManager;
    
    try {
      // Import configuration
      const success = await configManager.importFromJson(file, section);
      
      if (!success) {
        console.error(`Error importing configuration from ${file}`);
        return 1;
      }
      
      // Save configuration
      await configManager.save();
      
      console.log(`Configuration imported from ${file}`);
      if (section) {
        console.log(`Imported into section: ${section}`);
      }
      
      return 0;
    } catch (error) {
      console.error(`Error importing configuration: ${error.message}`);
      return 1;
    }
  }
};

/**
 * Config export command
 */
export const configExportCommand: Command = {
  id: 'config:export',
  name: 'config:export',
  description: 'Export configuration to a JSON file',
  options: [
    {
      name: 'file',
      alias: 'f',
      type: 'string',
      description: 'JSON file to export to',
      required: true
    },
    {
      name: 'section',
      alias: 's',
      type: 'string',
      description: 'Configuration section to export (e.g., core, models)'
    },
    {
      name: 'pretty',
      alias: 'p',
      type: 'boolean',
      description: 'Pretty-print JSON output',
      default: true
    }
  ],
  examples: [
    'swissknife config:export --file config.json',
    'swissknife config:export --file models.json --section models',
    'swissknife config:export --file config.json --pretty false'
  ],
  category: 'config',
  handler: async (args, context) => {
    const { file, section, pretty } = args;
    const configManager = context.config as ConfigurationManager;
    
    try {
      // Get configuration to export
      let config: any;
      
      if (section) {
        config = configManager.get(section, {});
      } else {
        // Get entire configuration
        config = {};
        const sections = [
          'core',
          'models',
          'integration',
          'project',
          'tasks',
          'worker'
        ];
        
        for (const sec of sections) {
          const sectionConfig = configManager.get(sec, null);
          if (sectionConfig !== null) {
            config[sec] = sectionConfig;
          }
        }
      }
      
      // Export to file
      const json = JSON.stringify(config, null, pretty ? 2 : undefined);
      await fs.writeFile(file, json, 'utf-8');
      
      console.log(`Configuration exported to ${file}`);
      if (section) {
        console.log(`Exported section: ${section}`);
      }
      
      return 0;
    } catch (error) {
      console.error(`Error exporting configuration: ${error.message}`);
      return 1;
    }
  }
};

/**
 * Helper function to output an object as YAML-like format
 */
function outputYaml(obj: any, indent: number = 0): void {
  for (const [key, value] of Object.entries(obj)) {
    const indentation = ' '.repeat(indent);
    
    if (value === null || value === undefined) {
      console.log(`${indentation}${key}: null`);
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      console.log(`${indentation}${key}:`);
      outputYaml(value, indent + 2);
    } else if (Array.isArray(value)) {
      console.log(`${indentation}${key}:`);
      for (const item of value) {
        if (typeof item === 'object') {
          console.log(`${indentation}- `);
          outputYaml(item, indent + 4);
        } else {
          console.log(`${indentation}- ${item}`);
        }
      }
    } else {
      console.log(`${indentation}${key}: ${value}`);
    }
  }
}

/**
 * Helper function to output an object as a table
 */
function outputTable(obj: any): void {
  // Get the maximum key length for padding
  const keys = Object.keys(obj);
  const maxKeyLength = Math.max(...keys.map(k => k.length));
  
  // Print header
  console.log('Key'.padEnd(maxKeyLength + 2) + 'Value');
  console.log('-'.repeat(maxKeyLength + 2) + '-'.repeat(30));
  
  // Print rows
  for (const [key, value] of Object.entries(obj)) {
    let valueStr: string;
    
    if (value === null || value === undefined) {
      valueStr = 'null';
    } else if (typeof value === 'object') {
      valueStr = '[Object]';
    } else {
      valueStr = String(value);
    }
    
    console.log(key.padEnd(maxKeyLength + 2) + valueStr);
  }
}