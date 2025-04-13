# API Key Management in SwissKnife Unified Architecture

This document provides a comprehensive guide to API key management in the SwissKnife unified architecture, including configuration, storage, runtime handling, and troubleshooting.

## Overview

SwissKnife requires API keys for various AI model providers. The unified architecture provides a centralized approach to API key management through the Configuration domain:

1. **Environment Variables**: Setting keys directly in the environment
2. **Configuration System**: Storing keys in a secure, persistent configuration
3. **In-App Configuration**: Using the `/model` or `/config` commands to manage keys
4. **Type-Safe Access**: Accessing keys through well-defined TypeScript interfaces

## API Key Flow in the Unified Architecture

Here's the complete lifecycle of API keys in the SwissKnife unified architecture:

1. **Key Entry**: Keys enter the system via:
   - Environment variables (e.g., `SWISSKNIFE_OPENAI_API_KEY`)
   - User input via the configuration commands
   - Configuration file during initial setup

2. **Key Storage**: Keys are stored in:
   - Secure configuration system with optional encryption
   - Environment variables as fallback
   - In-memory cache for active sessions

3. **Key Retrieval**: Keys are retrieved using:
   - Configuration domain's type-safe interfaces
   - Provider-specific key management
   - Automatic failover and rotation mechanisms

4. **Key Usage**: Keys are used in:
   - API requests to model providers through the AI domain
   - Authentication for external services
   - MCP server authentication when necessary

5. **Key Rotation**: Keys are managed through:
   - Automatic rotation to prevent rate limiting
   - Manual configuration via CLI commands
   - Intelligent failover when keys are marked as invalid or expired

## API Key Management Architecture

The unified architecture uses a domain-driven approach to API key management:

```
┌───────────────────────────────────────────────────────────────────────┐
│                    Configuration Domain                              │
│                                                                       │
│  ┌────────────────────────┐    ┌──────────────────────────────────┐  │
│  │  ConfigManager         │    │  APIKeyManager                   │  │
│  │                        │    │                                  │  │
│  │  - Central config store│    │  - Secure key storage           │  │
│  │  - Type-safe access    │    │  - Key rotation                 │  │
│  │  - Persistence         │    │  - Failure tracking             │  │
│  └───────────┬────────────┘    └────────────────┬─────────────────┘  │
│              │                                   │                    │
│              └───────────────┬──────────────────┘                    │
│                              │                                        │
└──────────────────────────────┼────────────────────────────────────────┘
                               │
                               ▼
┌───────────────────────────────────────────────────────────────────────┐
│                          AI Domain                                   │
│                                                                       │
│  ┌────────────────────────┐    ┌──────────────────────────────────┐  │
│  │  ModelRegistry         │    │  ModelProviders                  │  │
│  │                        │    │                                  │  │
│  │  - Model registration  │    │  - OpenAI, Claude, etc.         │  │
│  │  - Provider management │    │  - Authentication               │  │
│  │  - Default selection   │    │  - API integration              │  │
│  └────────────────────────┘    └──────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────┘
```

### Key Components

#### 1. ConfigManager

The `ConfigManager` provides a centralized configuration system with type-safe access patterns:

```typescript
// src/config/manager.ts
export class ConfigManager {
  private static instance: ConfigManager;
  private config: Record<string, any> = {};
  
  private constructor() {
    // Private constructor for singleton pattern
    this.loadConfig();
  }
  
  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }
  
  get<T>(key: string, defaultValue?: T): T {
    // Dotted path access with type safety
    const parts = key.split('.');
    let current = this.config;
    
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        return defaultValue as T;
      }
      current = current[parts[i]];
    }
    
    return (current[parts[parts.length - 1]] ?? defaultValue) as T;
  }
  
  set<T>(key: string, value: T): void {
    // Set value with dotted path support
    const parts = key.split('.');
    let current = this.config;
    
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    
    current[parts[parts.length - 1]] = value;
  }
  
  async save(): Promise<boolean> {
    // Save configuration to disk
    try {
      // Implementation details
      return true;
    } catch (error) {
      console.error('Failed to save configuration:', error);
      return false;
    }
  }
  
  private loadConfig(): void {
    // Load configuration from disk
    try {
      // Implementation details
    } catch (error) {
      console.error('Failed to load configuration:', error);
      this.config = {}; // Initialize with empty config
    }
  }
}
```

#### 2. APIKeyManager

The `APIKeyManager` provides specialized handling for API keys, including security, rotation, and failure management:

```typescript
// src/config/api-key-manager.ts
import { ConfigManager } from './manager';
import { CryptoUtils } from '../utils/crypto';

export interface APIKeySet {
  keys: string[];
  currentIndex: number;
  failedKeys: string[];
}

export class APIKeyManager {
  private static instance: APIKeyManager;
  private configManager: ConfigManager;
  private keyCache: Map<string, string> = new Map();
  
  private constructor() {
    this.configManager = ConfigManager.getInstance();
  }
  
  static getInstance(): APIKeyManager {
    if (!APIKeyManager.instance) {
      APIKeyManager.instance = new APIKeyManager();
    }
    return APIKeyManager.instance;
  }
  
  getAPIKey(provider: string, options: { rotate?: boolean, allowFailed?: boolean } = {}): string | null {
    const { rotate = false, allowFailed = false } = options;
    
    // First check environment variable
    const envVarName = `SWISSKNIFE_${provider.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_API_KEY`;
    const envKey = process.env[envVarName];
    
    if (envKey) {
      // Add to configuration if not already present
      this.addEnvKeyToConfig(provider, envKey);
      return envKey;
    }
    
    // Get key set from configuration
    const keySetPath = `api.${provider}.keys`;
    const keySet = this.configManager.get<APIKeySet>(keySetPath, { keys: [], currentIndex: 0, failedKeys: [] });
    
    // Filter out failed keys if not allowing failed keys
    const availableKeys = allowFailed 
      ? keySet.keys 
      : keySet.keys.filter(key => !keySet.failedKeys.includes(key));
    
    if (availableKeys.length === 0) {
      return null;
    }
    
    // Get current index and potentially rotate
    let index = keySet.currentIndex;
    
    if (rotate) {
      index = (index + 1) % availableKeys.length;
      keySet.currentIndex = index;
      this.configManager.set(keySetPath, keySet);
    }
    
    return availableKeys[index];
  }
  
  addAPIKey(provider: string, apiKey: string): boolean {
    const keySetPath = `api.${provider}.keys`;
    const keySet = this.configManager.get<APIKeySet>(keySetPath, { keys: [], currentIndex: 0, failedKeys: [] });
    
    // Check if key already exists
    if (keySet.keys.includes(apiKey)) {
      return false;
    }
    
    // Add the new key
    keySet.keys.push(apiKey);
    
    // Save to configuration
    this.configManager.set(keySetPath, keySet);
    return true;
  }
  
  removeAPIKey(provider: string, apiKey: string): boolean {
    const keySetPath = `api.${provider}.keys`;
    const keySet = this.configManager.get<APIKeySet>(keySetPath, { keys: [], currentIndex: 0, failedKeys: [] });
    
    // Check if key exists
    const index = keySet.keys.indexOf(apiKey);
    if (index === -1) {
      return false;
    }
    
    // Remove the key
    keySet.keys.splice(index, 1);
    
    // Remove from failed keys if present
    const failedIndex = keySet.failedKeys.indexOf(apiKey);
    if (failedIndex !== -1) {
      keySet.failedKeys.splice(failedIndex, 1);
    }
    
    // Adjust current index if needed
    if (keySet.currentIndex >= keySet.keys.length && keySet.keys.length > 0) {
      keySet.currentIndex = keySet.keys.length - 1;
    }
    
    // Save to configuration
    this.configManager.set(keySetPath, keySet);
    return true;
  }
  
  markAPIKeyAsFailed(provider: string, apiKey: string): boolean {
    const keySetPath = `api.${provider}.keys`;
    const keySet = this.configManager.get<APIKeySet>(keySetPath, { keys: [], currentIndex: 0, failedKeys: [] });
    
    // Check if key exists
    if (!keySet.keys.includes(apiKey)) {
      return false;
    }
    
    // Add to failed keys if not already present
    if (!keySet.failedKeys.includes(apiKey)) {
      keySet.failedKeys.push(apiKey);
      this.configManager.set(keySetPath, keySet);
    }
    
    return true;
  }
  
  unmarkAPIKeyAsFailed(provider: string, apiKey: string): boolean {
    const keySetPath = `api.${provider}.keys`;
    const keySet = this.configManager.get<APIKeySet>(keySetPath, { keys: [], currentIndex: 0, failedKeys: [] });
    
    // Check if key exists
    if (!keySet.keys.includes(apiKey)) {
      return false;
    }
    
    // Remove from failed keys if present
    const failedIndex = keySet.failedKeys.indexOf(apiKey);
    if (failedIndex !== -1) {
      keySet.failedKeys.splice(failedIndex, 1);
      this.configManager.set(keySetPath, keySet);
      return true;
    }
    
    return false;
  }
  
  private addEnvKeyToConfig(provider: string, apiKey: string): void {
    const added = this.addAPIKey(provider, apiKey);
    if (added) {
      this.configManager.save().catch(error => {
        console.error(`Failed to save environment API key to configuration:`, error);
      });
    }
  }
  
  async encryptAndStoreKey(provider: string, apiKey: string): Promise<boolean> {
    try {
      const encryptedKey = await CryptoUtils.encrypt(apiKey);
      this.configManager.set(`api.${provider}.encryptedKeys`, encryptedKey);
      return await this.configManager.save();
    } catch (error) {
      console.error(`Failed to encrypt and store API key:`, error);
      return false;
    }
  }
  
  async getEncryptedKey(provider: string): Promise<string | null> {
    try {
      const encryptedKey = this.configManager.get<string>(`api.${provider}.encryptedKeys`, null);
      if (!encryptedKey) {
        return null;
      }
      
      return await CryptoUtils.decrypt(encryptedKey);
    } catch (error) {
      console.error(`Failed to decrypt API key:`, error);
      return null;
    }
  }
}
```

#### 3. Integration with Model Provider

The unified architecture seamlessly integrates API key management with model providers:

```typescript
// src/ai/models/providers/openai.ts
import { APIKeyManager } from '../../../config/api-key-manager';
import { ConfigManager } from '../../../config/manager';
import { ModelProvider, Model, ModelResponse, GenerateOptions } from '../../types/model';

export class OpenAIProvider implements ModelProvider {
  id = 'openai';
  name = 'OpenAI';
  
  private configManager: ConfigManager;
  private apiKeyManager: APIKeyManager;
  
  constructor() {
    this.configManager = ConfigManager.getInstance();
    this.apiKeyManager = APIKeyManager.getInstance();
  }
  
  getAvailableModels(): string[] {
    return ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'];
  }
  
  createModel(modelId: string): Model {
    return {
      id: modelId,
      provider: this.id,
      name: `OpenAI ${modelId}`,
      
      async generate(options: GenerateOptions): Promise<ModelResponse> {
        // Get API key with rotation
        const apiKey = this.apiKeyManager.getAPIKey('openai', { rotate: true });
        
        if (!apiKey) {
          throw new Error('No OpenAI API key available');
        }
        
        try {
          // Make API request with the key
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: modelId,
              messages: options.messages,
              max_tokens: options.maxTokens,
              temperature: options.temperature,
              tools: options.tools?.map(tool => ({
                type: 'function',
                function: {
                  name: tool.name,
                  description: tool.description,
                  parameters: tool.parameters
                }
              }))
            })
          });
          
          if (!response.ok) {
            // Handle authentication and rate limit errors
            if (response.status === 401 || response.status === 429) {
              this.apiKeyManager.markAPIKeyAsFailed('openai', apiKey);
            }
            
            throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
          }
          
          const data = await response.json();
          
          return {
            content: data.choices[0].message.content || '',
            toolCalls: data.choices[0].message.tool_calls?.map(tc => ({
              id: tc.id,
              name: tc.function.name,
              arguments: JSON.parse(tc.function.arguments)
            })) || []
          };
        } catch (error) {
          console.error('Error generating content with OpenAI:', error);
          throw error;
        }
      }
    };
  }
  
  getDefaultModel(): Model {
    const defaultModelId = this.configManager.get<string>('ai.openai.defaultModel', 'gpt-4o');
    return this.createModel(defaultModelId);
  }
}
```

## Command-Line API Key Management

The unified architecture provides a consistent command interface for API key management:

```typescript
// src/cli/commands/definitions/api-key-command.ts
import { CommandRegistry } from '../../registry';
import { APIKeyManager } from '../../../config/api-key-manager';
import { ConfigManager } from '../../../config/manager';

export function registerAPIKeyCommands() {
  const commandRegistry = CommandRegistry.getInstance();
  const apiKeyManager = APIKeyManager.getInstance();
  const configManager = ConfigManager.getInstance();
  
  commandRegistry.registerCommand({
    id: 'apikey',
    name: 'apikey',
    description: 'Manage API keys for various providers',
    subcommands: [
      {
        id: 'list',
        name: 'list',
        description: 'List configured API keys',
        args: [
          {
            name: 'provider',
            description: 'Optional provider name to filter keys',
            required: false
          }
        ],
        handler: async (args, context) => {
          const provider = args.provider;
          
          if (provider) {
            // List keys for specific provider
            const keySet = configManager.get(`api.${provider}.keys`, { keys: [], failedKeys: [] });
            
            context.ui.info(`API keys for ${provider}:`);
            
            if (keySet.keys.length === 0) {
              context.ui.info('No API keys configured');
              return 0;
            }
            
            keySet.keys.forEach((key, index) => {
              const isFailed = keySet.failedKeys.includes(key);
              const isCurrent = index === keySet.currentIndex;
              
              context.ui.info(`${index + 1}. ${maskApiKey(key)} ${isCurrent ? '(current)' : ''} ${isFailed ? '(failed)' : ''}`);
            });
          } else {
            // List all providers with key counts
            const providers = configManager.get('api', {});
            
            context.ui.info('Configured API keys by provider:');
            
            if (Object.keys(providers).length === 0) {
              context.ui.info('No API keys configured');
              return 0;
            }
            
            Object.entries(providers).forEach(([providerName, config]) => {
              const keyCount = config.keys?.length || 0;
              const failedCount = config.keys?.failedKeys?.length || 0;
              
              context.ui.info(`${providerName}: ${keyCount} keys${failedCount > 0 ? ` (${failedCount} failed)` : ''}`);
            });
          }
          
          return 0;
        }
      },
      {
        id: 'add',
        name: 'add',
        description: 'Add a new API key',
        args: [
          {
            name: 'provider',
            description: 'Provider name (e.g., openai, anthropic)',
            required: true
          },
          {
            name: 'key',
            description: 'API key to add',
            required: true
          },
          {
            name: 'encrypt',
            description: 'Whether to encrypt the key (true/false)',
            required: false
          }
        ],
        handler: async (args, context) => {
          const { provider, key, encrypt } = args;
          
          // Add the key
          const added = apiKeyManager.addAPIKey(provider, key);
          
          if (!added) {
            context.ui.warn(`API key already exists for ${provider}`);
            return 1;
          }
          
          // Optionally encrypt the key
          if (encrypt === 'true') {
            const encrypted = await apiKeyManager.encryptAndStoreKey(provider, key);
            
            if (!encrypted) {
              context.ui.error('Failed to encrypt API key');
              return 1;
            }
            
            context.ui.success(`API key for ${provider} added and encrypted`);
          } else {
            // Save the configuration
            const saved = await configManager.save();
            
            if (!saved) {
              context.ui.error('Failed to save configuration');
              return 1;
            }
            
            context.ui.success(`API key for ${provider} added`);
          }
          
          return 0;
        }
      },
      {
        id: 'remove',
        name: 'remove',
        description: 'Remove an API key',
        args: [
          {
            name: 'provider',
            description: 'Provider name',
            required: true
          },
          {
            name: 'key',
            description: 'API key to remove',
            required: true
          }
        ],
        handler: async (args, context) => {
          const { provider, key } = args;
          
          // Remove the key
          const removed = apiKeyManager.removeAPIKey(provider, key);
          
          if (!removed) {
            context.ui.error(`API key not found for ${provider}`);
            return 1;
          }
          
          // Save the configuration
          const saved = await configManager.save();
          
          if (!saved) {
            context.ui.error('Failed to save configuration');
            return 1;
          }
          
          context.ui.success(`API key for ${provider} removed`);
          return 0;
        }
      },
      {
        id: 'reset',
        name: 'reset',
        description: 'Reset failed status for API keys',
        args: [
          {
            name: 'provider',
            description: 'Provider name',
            required: true
          },
          {
            name: 'key',
            description: 'Specific API key to reset, or "all" for all keys',
            required: true
          }
        ],
        handler: async (args, context) => {
          const { provider, key } = args;
          
          if (key === 'all') {
            // Reset all failed keys for the provider
            const keySet = configManager.get(`api.${provider}.keys`, { keys: [], failedKeys: [] });
            
            keySet.failedKeys = [];
            configManager.set(`api.${provider}.keys`, keySet);
            
            // Save the configuration
            const saved = await configManager.save();
            
            if (!saved) {
              context.ui.error('Failed to save configuration');
              return 1;
            }
            
            context.ui.success(`Reset all failed API keys for ${provider}`);
          } else {
            // Reset specific key
            const reset = apiKeyManager.unmarkAPIKeyAsFailed(provider, key);
            
            if (!reset) {
              context.ui.error(`API key not found or not marked as failed for ${provider}`);
              return 1;
            }
            
            // Save the configuration
            const saved = await configManager.save();
            
            if (!saved) {
              context.ui.error('Failed to save configuration');
              return 1;
            }
            
            context.ui.success(`Reset failed status for ${provider} API key`);
          }
          
          return 0;
        }
      }
    ],
    handler: async (args, context) => {
      // Show help for main command if no subcommand provided
      context.ui.renderHelp(this);
      return 0;
    }
  });
}

// Helper function to mask API keys
function maskApiKey(key: string): string {
  if (key.length <= 8) {
    return '****';
  }
  
  return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
}
```

## Integration with IPFS Kit MCP Server

The unified architecture seamlessly handles API keys for MCP server authentication:

```typescript
// src/storage/ipfs/mcp-client.ts
import { APIKeyManager } from '../../config/api-key-manager';
import { ConfigManager } from '../../config/manager';

export class MCPClient {
  private apiKeyManager: APIKeyManager;
  private configManager: ConfigManager;
  private baseUrl: string;
  
  constructor(options?: { baseUrl?: string }) {
    this.apiKeyManager = APIKeyManager.getInstance();
    this.configManager = ConfigManager.getInstance();
    this.baseUrl = options?.baseUrl || this.configManager.get('storage.mcp.baseUrl', 'http://localhost:5001');
  }
  
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    
    // Get API key for MCP server
    const apiKey = this.apiKeyManager.getAPIKey('mcp');
    
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
    
    return headers;
  }
  
  async addContent(content: string | Buffer): Promise<{ cid: string }> {
    // Implementation with authentication headers
    const headers = this.getAuthHeaders();
    
    // Make request with headers
    // ...
    
    return { cid: "example-cid" };
  }
  
  // Other methods with authentication...
}
```

## Best Practices for API Key Management

### 1. Type Safety

Always use the type-safe interfaces provided by the Configuration domain:

```typescript
// Good practice - using type-safe interfaces
import { APIKeyManager } from '../../config/api-key-manager';

// Get instance
const apiKeyManager = APIKeyManager.getInstance();

// Get API key with typed options
const apiKey = apiKeyManager.getAPIKey('openai', { rotate: true });

// Bad practice - direct access to configuration
import { ConfigManager } from '../../config/manager';
const config = ConfigManager.getInstance();
const keys = config.get('api.openai.keys', []);
const key = keys[0]; // No rotation, no failure checking
```

### 2. Key Rotation

Use the built-in rotation capabilities to distribute requests across multiple keys:

```typescript
// Distribute requests using key rotation
function makeRequestWithRotation(data: any) {
  const apiKey = apiKeyManager.getAPIKey('openai', { rotate: true });
  
  if (!apiKey) {
    throw new Error('No valid API key available');
  }
  
  // Make API request with rotated key
  return fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
}
```

### 3. Failure Handling

Properly track and handle failed keys to ensure resilient operation:

```typescript
async function makeRequestWithFailureHandling(data: any) {
  // Get API key, ignoring previously failed keys
  const apiKey = apiKeyManager.getAPIKey('openai', { rotate: true });
  
  if (!apiKey) {
    throw new Error('No valid API key available');
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      // Mark key as failed for authentication or rate limit errors
      if (response.status === 401 || response.status === 429) {
        apiKeyManager.markAPIKeyAsFailed('openai', apiKey);
        
        // Try again with another key if authentication failed
        return makeRequestWithFailureHandling(data);
      }
      
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    // Mark key as failed for network errors
    if (error.message.includes('network') || error.message.includes('fetch')) {
      apiKeyManager.markAPIKeyAsFailed('openai', apiKey);
    }
    
    throw error;
  }
}
```

### 4. Environment Variables

Always check for environment variables first, and add them to the configuration:

```typescript
// In your initialization code
import { APIKeyManager } from '../../config/api-key-manager';
import { ConfigManager } from '../../config/manager';

function initializeAPIKeys() {
  const apiKeyManager = APIKeyManager.getInstance();
  const configManager = ConfigManager.getInstance();
  
  // Look for environment variables for all supported providers
  const providers = ['openai', 'anthropic', 'mistral', 'cohere'];
  
  for (const provider of providers) {
    const envVarName = `SWISSKNIFE_${provider.toUpperCase()}_API_KEY`;
    const apiKey = process.env[envVarName];
    
    if (apiKey) {
      console.log(`Found API key for ${provider} in environment variables`);
      apiKeyManager.addAPIKey(provider, apiKey);
    }
  }
  
  // Save any keys found in environment variables
  configManager.save().catch(error => {
    console.error('Failed to save API keys from environment variables:', error);
  });
}
```

### 5. Security

Use encryption for sensitive API keys when possible:

```typescript
// When adding a key from user input
async function addSecureAPIKey(provider: string, apiKey: string) {
  const apiKeyManager = APIKeyManager.getInstance();
  
  // Add the key to the regular key set
  apiKeyManager.addAPIKey(provider, apiKey);
  
  // Also store an encrypted version
  await apiKeyManager.encryptAndStoreKey(provider, apiKey);
  
  console.log(`API key for ${provider} added and encrypted`);
}
```

## Troubleshooting Guide

### Issue: API Keys Not Persisting

**Symptoms:**
- Keys are not saved between sessions
- Configuration file not updated
- Keys disappear after restart

**Solutions:**

1. **Ensure configuration is saved:**
   ```typescript
   // After adding a key
   apiKeyManager.addAPIKey('openai', 'sk-12345');
   
   // Save the configuration
   await ConfigManager.getInstance().save();
   ```

2. **Check file permissions:**
   ```typescript
   import * as fs from 'fs';
   
   // Get configuration file path
   const configPath = ConfigManager.getInstance().getConfigPath();
   
   // Check file permissions
   try {
     await fs.promises.access(configPath, fs.constants.W_OK);
     console.log('Configuration file is writable');
   } catch (error) {
     console.error('Configuration file is not writable:', error);
   }
   ```

3. **Debug configuration content:**
   ```typescript
   // Log configuration content
   const config = ConfigManager.getInstance().getAllConfig();
   console.log('Current configuration:', JSON.stringify(config, null, 2));
   ```

### Issue: API Key Rotation Not Working

**Symptoms:**
- Same API key used repeatedly
- Rate limiting due to single key usage
- No distribution of requests across keys

**Solutions:**

1. **Verify rotation parameter:**
   ```typescript
   // Make sure to specify rotate: true
   const apiKey = apiKeyManager.getAPIKey('openai', { rotate: true });
   ```

2. **Check multiple keys exist:**
   ```typescript
   // Get all keys for a provider
   const keys = apiKeyManager.getAllKeys('openai');
   console.log(`Available keys: ${keys.length}`);
   
   if (keys.length <= 1) {
     console.warn('Rotation requires multiple keys');
   }
   ```

3. **Reset rotation state:**
   ```typescript
   // Reset the current index
   apiKeyManager.resetKeyRotation('openai');
   ```

### Issue: Failed Keys Not Being Tracked

**Symptoms:**
- Failed API keys continue to be used
- Repeated authentication errors
- No automatic failover

**Solutions:**

1. **Verify key marking:**
   ```typescript
   // Make sure failed keys are marked correctly
   apiKeyManager.markAPIKeyAsFailed('openai', failedKey);
   
   // Save configuration after marking
   await ConfigManager.getInstance().save();
   ```

2. **Inspect failed keys list:**
   ```typescript
   // Get the current failed keys
   const keySet = ConfigManager.getInstance().get('api.openai.keys', { keys: [], failedKeys: [] });
   console.log('Failed keys:', keySet.failedKeys);
   ```

3. **Reset all failed keys:**
   ```typescript
   // Reset all failed keys for debugging
   const keySet = ConfigManager.getInstance().get('api.openai.keys', { keys: [], failedKeys: [] });
   keySet.failedKeys = [];
   ConfigManager.getInstance().set('api.openai.keys', keySet);
   await ConfigManager.getInstance().save();
   ```

## Complete Examples

### Example 1: Adding Multiple API Keys with Validation

```typescript
// src/cli/commands/definitions/model-setup-command.ts
import { CommandRegistry } from '../../registry';
import { APIKeyManager } from '../../../config/api-key-manager';
import { ConfigManager } from '../../../config/manager';
import { ModelRegistry } from '../../../ai/models/registry';

async function validateAPIKey(provider: string, apiKey: string): Promise<boolean> {
  try {
    // Get model provider
    const modelRegistry = ModelRegistry.getInstance();
    const modelProvider = modelRegistry.getProvider(provider);
    
    if (!modelProvider) {
      return false;
    }
    
    // Temporarily add the key for validation
    const apiKeyManager = APIKeyManager.getInstance();
    apiKeyManager.addAPIKey(provider, apiKey);
    
    // Try to list models with the key
    const model = modelProvider.createModel(modelProvider.getAvailableModels()[0]);
    
    // Make a minimal request to validate the key
    await model.generate({
      messages: [{ role: 'user', content: 'test' }],
      maxTokens: 5
    });
    
    return true;
  } catch (error) {
    console.error(`Error validating API key for ${provider}:`, error);
    return false;
  }
}

export function registerModelSetupCommand() {
  const commandRegistry = CommandRegistry.getInstance();
  const apiKeyManager = APIKeyManager.getInstance();
  const configManager = ConfigManager.getInstance();
  
  commandRegistry.registerCommand({
    id: 'model.setup',
    name: 'model setup',
    description: 'Interactive setup for model providers',
    handler: async (args, context) => {
      context.ui.info('Model Provider Setup');
      context.ui.info('-------------------');
      
      // Select provider
      const provider = await context.ui.prompt({
        type: 'select',
        message: 'Select AI model provider:',
        choices: [
          { title: 'OpenAI', value: 'openai' },
          { title: 'Anthropic', value: 'anthropic' },
          { title: 'Mistral', value: 'mistral' }
        ]
      });
      
      // Multiple API key entry
      context.ui.info(`\nEnter API keys for ${provider} (leave empty to finish):`);
      
      const keys: string[] = [];
      let keyNum = 1;
      let key;
      
      do {
        key = await context.ui.prompt({
          type: 'password',
          message: `API Key #${keyNum}:`,
          placeholder: 'Leave empty to finish'
        });
        
        if (key) {
          // Validate the key
          context.ui.info(`Validating API key #${keyNum}...`);
          const isValid = await validateAPIKey(provider, key);
          
          if (isValid) {
            context.ui.success(`API key #${keyNum} is valid`);
            keys.push(key);
            keyNum++;
          } else {
            context.ui.error(`API key #${keyNum} is invalid, please try again`);
          }
        }
      } while (key);
      
      if (keys.length === 0) {
        context.ui.warn('No API keys provided, setup canceled');
        return 1;
      }
      
      // Add all valid keys
      for (const key of keys) {
        apiKeyManager.addAPIKey(provider, key);
      }
      
      // Save configuration
      await configManager.save();
      
      context.ui.success(`Added ${keys.length} API keys for ${provider}`);
      
      // Set as default provider if it's the first one
      const currentProvider = configManager.get('ai.defaultProvider', '');
      
      if (!currentProvider) {
        configManager.set('ai.defaultProvider', provider);
        await configManager.save();
        context.ui.info(`Set ${provider} as the default provider`);
      }
      
      return 0;
    }
  });
}
```

### Example 2: Automatic Key Rotation and Failover

```typescript
// src/ai/models/providers/provider-base.ts
import { APIKeyManager } from '../../../config/api-key-manager';

export abstract class BaseModelProvider implements ModelProvider {
  abstract id: string;
  abstract name: string;
  
  protected apiKeyManager: APIKeyManager;
  
  constructor() {
    this.apiKeyManager = APIKeyManager.getInstance();
  }
  
  abstract getAvailableModels(): string[];
  abstract createModel(modelId: string): Model;
  abstract getDefaultModel(): Model;
  
  // Shared method for making API requests with key rotation and failover
  protected async makeAuthenticatedRequest<T>(
    url: string, 
    body: any, 
    maxRetries: number = 3
  ): Promise<T> {
    let retries = 0;
    
    while (retries < maxRetries) {
      // Get API key with rotation
      const apiKey = this.apiKeyManager.getAPIKey(this.id, { rotate: true });
      
      if (!apiKey) {
        throw new Error(`No valid API key available for ${this.name}`);
      }
      
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify(body)
        });
        
        if (!response.ok) {
          // Handle authentication and rate limit errors
          if (response.status === 401 || response.status === 429) {
            this.apiKeyManager.markAPIKeyAsFailed(this.id, apiKey);
            retries++;
            continue; // Try with a different key
          }
          
          throw new Error(`${this.name} API error: ${response.status} ${response.statusText}`);
        }
        
        // Successful response
        return await response.json();
      } catch (error) {
        // Network errors may also indicate a bad key
        if (error.message.includes('network') || error.message.includes('fetch')) {
          this.apiKeyManager.markAPIKeyAsFailed(this.id, apiKey);
        }
        
        retries++;
        
        if (retries >= maxRetries) {
          throw error;
        }
      }
    }
    
    throw new Error(`Failed to make request to ${this.name} API after ${maxRetries} attempts`);
  }
}
```

## Conclusion

The unified architecture of SwissKnife provides a robust, type-safe, and centralized approach to API key management. By leveraging the Configuration domain and specialized key management components, the system ensures:

1. **Security**: Proper storage and optional encryption of sensitive keys
2. **Reliability**: Automatic failover when keys are invalid or rate-limited
3. **Efficiency**: Key rotation to distribute load across multiple keys
4. **Maintainability**: Centralized management with clear interfaces
5. **User Experience**: Consistent command interface for key management

This approach eliminates the complexity of the previous implementation by providing a single source of truth for API keys within the unified TypeScript codebase, while maintaining the flexibility to incorporate environment variables, encrypted storage, and runtime key rotation.