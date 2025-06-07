/**
 * Configuration fixtures for tests
 * 
 * Sample data for testing configuration-related functionality
 */

// Sample configurations for testing
export const sampleConfigurations = {
  // Basic configuration
  basic: {
    models: {
      default: 'test-model-1',
      providers: {
        'test-provider': {
          apiKey: 'sk-test-key',
          baseUrl: 'https://api.example.com'
        }
      }
    },
    storage: {
      type: 'local',
      path: '/tmp/test-storage'
    },
    logging: {
      level: 'info',
      path: '/tmp/test-logs'
    },
    ui: {
      theme: 'dark',
      colors: {
        primary: 'blue',
        secondary: 'green'
      }
    }
  },
  
  // Configuration with multiple models
  multipleModels: {
    models: {
      default: 'test-model-1',
      providers: {
        'test-provider': {
          apiKey: 'sk-test-key-1',
          baseUrl: 'https://api.example.com',
          models: ['test-model-1', 'test-model-2']
        },
        'other-provider': {
          apiKey: 'sk-test-key-2',
          baseUrl: 'https://api.other-example.com',
          models: ['other-model-1']
        }
      }
    },
    storage: {
      type: 'ipfs',
      gateway: 'https://ipfs.example.com'
    }
  },
  
  // Configuration with schema migrations
  withMigrations: {
    // Current config
    current: {
      version: '2.0',
      models: {
        default: 'test-model-1',
        providers: {
          'test-provider': {
            apiKey: 'sk-test-key',
            baseUrl: 'https://api.example.com'
          }
        }
      }
    },
    // Previous version config
    v1: {
      version: '1.0',
      models: {
        defaultModel: 'test-model-1', // Old schema used different key
        providers: {
          'test-provider': {
            key: 'sk-test-key', // Old schema used different key
            url: 'https://api.example.com' // Old schema used different key
          }
        }
      }
    }
  }
};

// Sample schema definitions for testing
export const sampleSchemas = {
  basic: {
    type: 'object',
    properties: {
      models: {
        type: 'object',
        properties: {
          default: { type: 'string' },
          providers: { type: 'object' }
        }
      },
      storage: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['local', 'ipfs'] },
          path: { type: 'string' }
        }
      },
      logging: {
        type: 'object',
        properties: {
          level: { type: 'string', enum: ['debug', 'info', 'warn', 'error'] }
        }
      }
    }
  }
};

// Sample migrations for testing
export const sampleMigrations = [
  {
    version: '1.0',
    up: (config) => {
      // No up migration for first version
      return config;
    },
    down: () => {
      // Cannot downgrade from first version
      throw new Error('Cannot downgrade from first version');
    }
  },
  {
    version: '2.0',
    up: (config) => {
      // Migrate from v1 to v2
      const newConfig = { ...config, version: '2.0' };
      
      // Update model schema
      if (newConfig.models && newConfig.models.defaultModel) {
        newConfig.models.default = newConfig.models.defaultModel;
        delete newConfig.models.defaultModel;
      }
      
      // Update provider schema
      if (newConfig.models && newConfig.models.providers) {
        Object.entries(newConfig.models.providers).forEach(([provider, settings]) => {
          if (settings.key) {
            newConfig.models.providers[provider].apiKey = settings.key;
            delete newConfig.models.providers[provider].key;
          }
          if (settings.url) {
            newConfig.models.providers[provider].baseUrl = settings.url;
            delete newConfig.models.providers[provider].url;
          }
        });
      }
      
      return newConfig;
    },
    down: (config) => {
      // Migrate from v2 to v1
      const newConfig = { ...config, version: '1.0' };
      
      // Revert model schema
      if (newConfig.models && newConfig.models.default) {
        newConfig.models.defaultModel = newConfig.models.default;
        delete newConfig.models.default;
      }
      
      // Revert provider schema
      if (newConfig.models && newConfig.models.providers) {
        Object.entries(newConfig.models.providers).forEach(([provider, settings]) => {
          if (settings.apiKey) {
            newConfig.models.providers[provider].key = settings.apiKey;
            delete newConfig.models.providers[provider].apiKey;
          }
          if (settings.baseUrl) {
            newConfig.models.providers[provider].url = settings.baseUrl;
            delete newConfig.models.providers[provider].baseUrl;
          }
        });
      }
      
      return newConfig;
    }
  }
];