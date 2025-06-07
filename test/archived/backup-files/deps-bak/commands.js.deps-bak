/**
 * Command fixtures for tests
 * 
 * Sample data for testing command-related functionality
 */

// Sample commands for testing
export const sampleCommands = {
  // Basic commands
  basic: [
    {
      name: 'help',
      description: 'Show help information',
      handler: jest.fn().mockResolvedValue(0)
    },
    {
      name: 'version',
      description: 'Show version information',
      handler: jest.fn().mockResolvedValue(0)
    },
    {
      name: 'config',
      description: 'Manage configuration',
      subcommands: {
        get: {
          description: 'Get configuration value',
          handler: jest.fn().mockResolvedValue(0)
        },
        set: {
          description: 'Set configuration value',
          handler: jest.fn().mockResolvedValue(0)
        },
        list: {
          description: 'List all configuration values',
          handler: jest.fn().mockResolvedValue(0)
        }
      },
      handler: jest.fn().mockResolvedValue(0)
    }
  ],
  
  // Model commands
  models: [
    {
      name: 'model',
      description: 'Manage and interact with models',
      subcommands: {
        list: {
          description: 'List available models',
          handler: jest.fn().mockResolvedValue(0)
        },
        execute: {
          description: 'Execute a model with input',
          handler: jest.fn().mockResolvedValue(0)
        },
        info: {
          description: 'Get information about a model',
          handler: jest.fn().mockResolvedValue(0)
        }
      },
      handler: jest.fn().mockResolvedValue(0)
    }
  ],
  
  // Task commands
  tasks: [
    {
      name: 'task',
      description: 'Manage tasks',
      subcommands: {
        create: {
          description: 'Create a new task',
          handler: jest.fn().mockResolvedValue(0)
        },
        list: {
          description: 'List tasks',
          handler: jest.fn().mockResolvedValue(0)
        },
        execute: {
          description: 'Execute a task',
          handler: jest.fn().mockResolvedValue(0)
        },
        cancel: {
          description: 'Cancel a task',
          handler: jest.fn().mockResolvedValue(0)
        }
      },
      handler: jest.fn().mockResolvedValue(0)
    }
  ],
  
  // Commands that may fail
  withErrors: [
    {
      name: 'error-command',
      description: 'Command that always fails',
      handler: jest.fn().mockRejectedValue(new Error('Test error'))
    },
    {
      name: 'sometimes-error',
      description: 'Command that sometimes fails',
      handler: jest.fn().mockImplementation(async (args) => {
        if (args.error) {
          throw new Error('Requested error');
        }
        return 0;
      })
    }
  ]
};

// Get all sample commands as a flat array
export function getAllSampleCommands() {
  return [
    ...sampleCommands.basic,
    ...sampleCommands.models,
    ...sampleCommands.tasks,
    ...sampleCommands.withErrors
  ];
}