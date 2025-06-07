# API Key Management in SwissKnife Unified Architecture

This document provides a comprehensive guide to API key management in the SwissKnife unified architecture, including configuration, storage, runtime handling, and troubleshooting.

## Overview

SwissKnife requires API keys for various AI model providers. The unified architecture provides a centralized approach to API key management through the Configuration domain:

1. **Environment Variables**: Setting keys directly in the environment (highest priority by default).
2. **Configuration System**: Storing keys (potentially encrypted) in a persistent configuration file.
3. **In-App Configuration**: Using the `config` or specific commands (like `apikey`) to manage stored keys.
4. **Secure Access**: Accessing keys through a dedicated `ApiKeyManager` service.

## API Key Flow in the Unified Architecture

Here's the complete lifecycle of API keys in the SwissKnife unified architecture:

1. **Key Entry**: Keys enter the system via:
   - Environment variables (e.g., `OPENAI_API_KEY`).
   - User input via CLI commands (`apikey add`, `config set`).
   - Direct editing of the configuration file (less recommended).

2. **Key Storage**: Keys are managed via:
   - **Environment Variables**: Read at runtime, highest priority by default.
   - **Configuration File**: Stored (ideally encrypted) under a specific path (e.g., `apiKeys.<provider>`). Managed by `ConfigManager` and `ApiKeyManager`.
   - **Secure Storage (Optional)**: Potentially using OS keychain via libraries like `keytar` for enhanced security (managed by `ApiKeyManager`).

3. **Key Retrieval**: Keys are retrieved by services (like `ModelProvider`) using the `ApiKeyManager`:
   - Checks environment variables first (unless `preferStored` option is used).
   - Falls back to stored keys (decrypting if necessary).
   - Handles key rotation if multiple keys are available and rotation is enabled.
   - Skips keys marked as failed (unless explicitly requested).

4. **Key Usage**: Keys are used in:
   - API requests to model providers (`src/ai/models/providers/`).
   - Authentication for other external services if needed.
   - Authentication for the IPFS Kit MCP Server if configured.

5. **Key Rotation & Failure**: Managed by `ApiKeyManager`:
   - Rotates through available keys for a provider on subsequent requests if enabled.
   - Allows marking keys as failed (e.g., after a 401/429 error) to skip them temporarily.
   - Provides commands to reset the failed status.

## API Key Management Architecture

API key management primarily resides within the Authentication/Configuration domains (`src/auth/`, `src/config/`) but is utilized by other domains, especially the AI domain (`src/ai/`).

```mermaid
graph TD
    subgraph Config/Auth Domain (`src/config/`, `src/auth/`)
        A[ConfigManager] --> B(Loads/Saves config file);
        C[ApiKeyManager] --> A;
        C --> D(Secure Storage - Keychain/Env Var/Encrypted Config);
        C --> E(Key Rotation Logic);
        C --> F(Failure Tracking);
    end

    subgraph AI Domain (`src/ai/`)
        G[Model Providers] --> C;
        H[Model Registry] --> G;
    end

    I[CLI Commands (`src/commands/`)] --> C;
    I --> A;

    style A fill:#ccf,stroke:#333
    style C fill:#ccf,stroke:#333
    style G fill:#dae8fc,stroke:#333
    style I fill:#d5e8d4,stroke:#333
```

-   **ConfigManager**: Handles loading/saving the general configuration file where non-sensitive settings and potentially *encrypted* keys are stored.
-   **ApiKeyManager**: Provides a dedicated interface for securely retrieving API keys. It checks environment variables first, then falls back to stored (potentially encrypted) keys from `ConfigManager`. It can also manage key rotation and track failed keys.
-   **Model Providers**: Use `ApiKeyManager` to get the necessary credentials before making API calls.
-   **CLI Commands**: Use `ApiKeyManager` or `ConfigManager` to allow users to view, add, or remove keys.

### Key Components

#### 1. ConfigManager

The `ConfigManager` provides a centralized configuration system with type-safe access patterns.

```typescript
// src/config/manager.ts (Conceptual - assumes singleton pattern)
export class ConfigManager {
  private static instance: ConfigManager;
  private config: Record<string, any> = {};
  private configPath: string; // Path to user config file

  private constructor() {
    // Determine configPath based on OS
    // Load config on initialization
    this.loadConfig();
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /** Gets config path */
  getConfigPath(): string {
      return this.configPath;
  }

  /** Gets entire config object */
  getAllConfig(): Record<string, any> {
      return { ...this.config }; // Return a copy
  }

  /** Gets a value using dot notation */
  get<T>(key: string, defaultValue?: T): T {
    // Dotted path access with type safety
    const parts = key.split('.');
    let current = this.config;
    for (const part of parts) {
      if (current === null || typeof current !== 'object' || !(part in current)) {
        return defaultValue as T;
      }
      current = current[part];
    }
    return current as T ?? defaultValue;
  }

  /** Sets a value using dot notation (updates in-memory config) */
  set<T>(key: string, value: T): void {
    // Set value with dotted path support using lodash.set or similar
    // _.set(this.config, key, value);
    // This example shows manual traversal:
    const parts = key.split('.');
    let current = this.config;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (current[part] === null || typeof current[part] !== 'object') {
        current[part] = {};
      }
      current = current[part];
    }
    current[parts[parts.length - 1]] = value;
  }

  /** Saves the current in-memory config to the config file */
  async save(): Promise<boolean> {
    try {
      const configDir = path.dirname(this.configPath);
      await fs.mkdir(configDir, { recursive: true });
      await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2));
      return true;
    } catch (error) {
      console.error(`Failed to save configuration to ${this.configPath}:`, error);
      return false;
    }
  }

  /** Loads config from file into memory */
  private loadConfig(): void {
    try {
      if (fsSync.existsSync(this.configPath)) { // Use sync for constructor
        const fileContent = fsSync.readFileSync(this.configPath, 'utf-8');
        this.config = JSON.parse(fileContent);
      } else {
        this.config = {}; // Initialize empty if file doesn't exist
      }
    } catch (error) {
      console.error(`Failed to load configuration from ${this.configPath}:`, error);
      this.config = {}; // Initialize empty on error
    }
  }
}
// Requires imports for path, fs, fsSync
```

#### 2. APIKeyManager

The `APIKeyManager` provides specialized handling for API keys, including security, rotation, and failure management.

```typescript
// src/auth/api-key-manager.ts (Note: Likely in auth domain)
import { ConfigManager } from '@/config/manager.js'; // Use correct path/alias
import { CryptoUtils } from '@/utils/encryption.js'; // Use correct path/alias

// Interface for how keys might be stored in config (example)
export interface APIKeyStorage {
  // Store encrypted keys under apiKeys.<provider> = [...]
  apiKeys?: Record<string, string[]>;
  // Store failed keys (unencrypted) under apiKeysFailed.<provider> = [...]
  apiKeysFailed?: Record<string, string[]>;
  // Store rotation index under apiKeysIndex.<provider> = number
  apiKeysIndex?: Record<string, number>;
}

export class ApiKeyManager { // Renamed class to avoid conflict
  private static instance: ApiKeyManager;
  private configManager: ConfigManager;
  // Optional: In-memory cache for decrypted keys to avoid repeated decryption
  private decryptedKeyCache: Map<string, string[]> = new Map();

  private constructor() {
    this.configManager = ConfigManager.getInstance();
  }

  static getInstance(): ApiKeyManager {
    if (!ApiKeyManager.instance) {
      ApiKeyManager.instance = new ApiKeyManager();
    }
    return ApiKeyManager.instance;
  }

  /**
   * Retrieves the best available API key for a given provider.
   * Checks environment variables first (unless preferStored=true), then stored keys.
   * Handles rotation and failed key tracking.
   * @param provider The provider ID (e.g., 'openai').
   * @param options Options like rotation preference.
   * @returns The API key string or null if none found/valid.
   */
  getBestApiKey(provider: string, options: { rotate?: boolean; allowFailed?: boolean; preferStored?: boolean } = {}): string | null {
    const { rotate = false, allowFailed = false, preferStored = false } = options;

    // 1. Check Environment Variable
    const envVarName = `${provider.toUpperCase()}_API_KEY`; // Convention might vary
    const envKey = process.env[envVarName];

    // Return ENV key immediately if found and not preferring stored
    if (envKey && !preferStored) {
      this._addEnvKeyToConfigIfNotPresent(provider, envKey); // Add to config if missing
      return envKey;
    }

    // 2. Get Stored Keys (Encrypted) from Config
    const configKey = `apiKeys.${provider}`; // Key in config file (e.g., apiKeys.openai)
    const storedEncryptedKeys = this.configManager.get<string[]>(configKey, []);

    // Use cached decrypted keys if available, otherwise decrypt
    let storedDecryptedKeys = this.decryptedKeyCache.get(provider);
    if (!storedDecryptedKeys) {
        storedDecryptedKeys = storedEncryptedKeys.map(k => CryptoUtils.decrypt(k)); // Decrypt all
        this.decryptedKeyCache.set(provider, storedDecryptedKeys); // Cache decrypted keys
    }


    // 3. Filter out failed keys if necessary
    const failedKeysPath = `apiKeysFailed.${provider}`; // Separate storage for failed keys?
    const failedKeys = this.configManager.get<string[]>(failedKeysPath, []);
    const availableStoredKeys = allowFailed
      ? storedDecryptedKeys
      : storedDecryptedKeys.filter(key => !failedKeys.includes(key));

    // If no stored keys available, return ENV key (if it exists and wasn't returned earlier) or null
    if (availableStoredKeys.length === 0) {
      return envKey || null;
    }

    // 4. Select Key (Rotation or First Available)
    const rotationIndexPath = `apiKeysIndex.${provider}`; // Store index separately
    let currentIndex = this.configManager.get<number>(rotationIndexPath, 0);

    // Ensure index is valid before potential rotation
    currentIndex = Math.min(currentIndex, availableStoredKeys.length - 1);
    if (currentIndex < 0) currentIndex = 0; // Handle edge case if index was invalid

    if (rotate && availableStoredKeys.length > 1) {
      currentIndex = (currentIndex + 1) % availableStoredKeys.length;
      this.configManager.set(rotationIndexPath, currentIndex);
      // Consider saving config immediately after index change if rotation is frequent
      // this.configManager.save();
    }

    // Return selected stored key
    return availableStoredKeys[currentIndex];
  }

  /** Adds a new API key (encrypted) to the configuration. */
  async addApiKey(provider: string, apiKey: string): Promise<boolean> {
    const configKey = `apiKeys.${provider}`;
    const storedEncryptedKeys = this.configManager.get<string[]>(configKey, []);
    const encryptedKey = CryptoUtils.encrypt(apiKey);

    // Check if encrypted key already exists to prevent duplicates
    if (storedEncryptedKeys.includes(encryptedKey)) {
      return false; // Key already exists
    }

    // Add the new encrypted key
    storedEncryptedKeys.push(encryptedKey);
    this.configManager.set(configKey, storedEncryptedKeys);
    this.decryptedKeyCache.delete(provider); // Invalidate cache
    await this.configManager.save(); // Persist changes
    return true;
  }

  /** Removes an API key from the configuration. */
  async removeApiKey(provider: string, apiKeyToRemove: string): Promise<boolean> {
    const configKey = `apiKeys.${provider}`;
    const storedEncryptedKeys = this.configManager.get<string[]>(configKey, []);
    let found = false;

    // Filter out the key to remove (compare decrypted values)
    const newEncryptedKeys = storedEncryptedKeys.filter(encryptedKey => {
        if (CryptoUtils.decrypt(encryptedKey) === apiKeyToRemove) {
            found = true;
            return false; // Remove this key
        }
        return true;
    });

    if (!found) {
      return false; // Key not found
    }

    // Update config and save
    this.configManager.set(configKey, newEncryptedKeys);
    this.decryptedKeyCache.delete(provider); // Invalidate cache

    // Also remove from failed keys list if present
    const failedKeysPath = `apiKeysFailed.${provider}`;
    const failedKeys = this.configManager.get<string[]>(failedKeysPath, []);
    const newFailedKeys = failedKeys.filter(key => key !== apiKeyToRemove);
    if (newFailedKeys.length !== failedKeys.length) {
        this.configManager.set(failedKeysPath, newFailedKeys);
    }

    // Adjust rotation index if necessary
    const rotationIndexPath = `apiKeysIndex.${provider}`;
    let currentIndex = this.configManager.get<number>(rotationIndexPath, 0);
    if (currentIndex >= newEncryptedKeys.length && newEncryptedKeys.length > 0) {
        this.configManager.set(rotationIndexPath, newEncryptedKeys.length - 1);
    }

    await this.configManager.save();
    return true;
  }

  /** Marks an API key as failed (e.g., due to auth error). */
  async markApiKeyAsFailed(provider: string, apiKey: string): Promise<boolean> {
    const failedKeysPath = `apiKeysFailed.${provider}`;
    const failedKeys = this.configManager.get<string[]>(failedKeysPath, []);

    // Check if key exists in the main list first (optional, depends on desired behavior)
    const configKey = `apiKeys.${provider}`;
    const storedEncryptedKeys = this.configManager.get<string[]>(configKey, []);
    const exists = storedEncryptedKeys.some(ek => CryptoUtils.decrypt(ek) === apiKey);
    if (!exists) return false; // Don't mark if it wasn't even stored

    if (!failedKeys.includes(apiKey)) {
      failedKeys.push(apiKey);
      this.configManager.set(failedKeysPath, failedKeys);
      await this.configManager.save();
      return true;
    }
    return false; // Already marked
  }

  /** Removes a key from the failed list. */
  async unmarkApiKeyAsFailed(provider: string, apiKey: string): Promise<boolean> {
    const failedKeysPath = `apiKeysFailed.${provider}`;
    const failedKeys = this.configManager.get<string[]>(failedKeysPath, []);
    const index = failedKeys.indexOf(apiKey);
    if (index !== -1) {
      failedKeys.splice(index, 1);
      this.configManager.set(failedKeysPath, failedKeys);
      await this.configManager.save();
      return true;
    }
    return false;
  }

  /** Helper to add ENV var key to config if it's not already there */
  private _addEnvKeyToConfigIfNotPresent(provider: string, apiKey: string): void {
    const configKey = `apiKeys.${provider}`;
    const storedEncryptedKeys = this.configManager.get<string[]>(configKey, []);
    const alreadyStored = storedEncryptedKeys.some(ek => CryptoUtils.decrypt(ek) === apiKey);

    if (!alreadyStored) {
        this.addApiKey(provider, apiKey).catch(error => { // Add async keyword if needed
            console.error(`Failed to automatically save environment API key for ${provider} to configuration:`, error);
        });
    }
  }

  // Removed encryptAndStoreKey and getEncryptedKey as add/get handle encryption/decryption
}
```

#### 3. Integration with Model Provider

The unified architecture seamlessly integrates API key management with model providers:

```typescript
// src/ai/models/providers/openai.ts (Conceptual)
import { ApiKeyManager } from '@/auth/api-key-manager.js'; // Use correct path
import { ConfigManager } from '@/config/manager.js'; // Use correct path
import type { ModelProvider, Model, ModelResponse, GenerateOptions } from '@/types/ai.js'; // Use correct path

export class OpenAIProvider implements ModelProvider {
  readonly id = 'openai';
  readonly name = 'OpenAI';

  private configManager: ConfigManager;
  private apiKeyManager: ApiKeyManager;

  constructor() {
    this.configManager = ConfigManager.getInstance();
    this.apiKeyManager = ApiKeyManager.getInstance();
  }

  // ... getAvailableModels, createModel, getDefaultModel ...

  // Example generate method within createModel
  // async generate(options: GenerateOptions): Promise<ModelResponse> {
  //   const apiKey = this.apiKeyManager.getBestApiKey('openai', { rotate: true });
  //   if (!apiKey) throw new Error('No OpenAI API key available');
  //
  //   try {
  //     const response = await fetch('https://api.openai.com/v1/chat/completions', {
  //       method: 'POST',
  //       headers: { 'Authorization': `Bearer ${apiKey}`, /* ... */ },
  //       body: JSON.stringify({ /* ... */ })
  //     });
  //
  //     if (!response.ok) {
  //       if (response.status === 401 || response.status === 429) {
  //         await this.apiKeyManager.markApiKeyAsFailed('openai', apiKey); // Use await
  //       }
  //       throw new Error(`OpenAI API error: ${response.status}`);
  //     }
  //     // ... process response ...
  //   } catch (error) {
  //     if (error.message.includes('network') || error.message.includes('fetch')) {
  //        await this.apiKeyManager.markApiKeyAsFailed('openai', apiKey); // Use await
  //     }
  //     throw error;
  //   }
  // }
}
```

## Command-Line API Key Management

The unified architecture provides a consistent command interface for API key management:

```typescript
// src/cli/commands/apikey.ts (Conceptual)
// Assumes Command structure and ExecutionContext type
import { ApiKeyManager } from '@/auth/api-key-manager.js'; // Use correct path
import { ConfigManager } from '@/config/manager.js'; // Use correct path

// --- Helper function to mask API keys ---
function maskApiKey(key: string): string {
  return key.length <= 8 ? '****' : `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
}

// --- Command Definitions ---
export const listApiKeysCommand: Command = {
    name: 'list',
    description: 'List configured API keys',
    options: [ { name: 'provider', type: 'string', description: 'Optional provider name' } ],
    async handler(context: CommandContext) {
        const { provider } = context.args;
        const apiKeyManager = ApiKeyManager.getInstance();
        const configManager = ConfigManager.getInstance(); // Needed to access full structure

        if (provider) {
            // List keys for specific provider (including failed status)
            const configKey = `apiKeys.${provider}`;
            const failedKeysPath = `apiKeysFailed.${provider}`;
            const rotationIndexPath = `apiKeysIndex.${provider}`;

            const encryptedKeys = configManager.get<string[]>(configKey, []);
            const failedKeys = configManager.get<string[]>(failedKeysPath, []);
            const currentIndex = configManager.get<number>(rotationIndexPath, 0);
            const decryptedKeys = encryptedKeys.map(k => CryptoUtils.decrypt(k));

            context.formatter.info(`API keys for ${provider}:`);
            if (decryptedKeys.length === 0) {
                context.formatter.info('  No stored API keys configured.');
            } else {
                decryptedKeys.forEach((key, index) => {
                    const isFailed = failedKeys.includes(key);
                    // Note: currentIndex applies to the *available* (non-failed) keys,
                    // so determining 'current' accurately here is complex without simulating getBestApiKey.
                    // Simplified display:
                    context.formatter.info(`  - ${maskApiKey(key)} ${isFailed ? '(failed)' : ''}`);
                });
            }
            // Also check ENV var
            const envVarName = `${provider.toUpperCase()}_API_KEY`;
            if (process.env[envVarName]) {
                 context.formatter.info(`  (Environment variable ${envVarName} is also set)`);
            }

        } else {
            // List all providers with key counts
            const providers = await apiKeyManager.getProviders(); // Get providers with stored keys
            context.formatter.info('Configured API keys by provider:');
            if (providers.length === 0) {
                 context.formatter.info('  No stored API keys found.');
            } else {
                for (const p of providers) {
                    const keys = await apiKeyManager.getApiKeys(p, { includeEnvVar: false, includeInvalid: true }); // Get stored only
                    const failedCount = configManager.get<string[]>(`apiKeysFailed.${p}`, []).length;
                    context.formatter.info(`  - ${p}: ${keys.length} stored key(s)${failedCount > 0 ? ` (${failedCount} failed)` : ''}`);
                }
            }
             context.formatter.info('\nEnvironment variables might also provide keys (e.g., OPENAI_API_KEY).');
        }
        return 0;
    }
};

export const addApiKeyCommand: Command = {
    name: 'add',
    description: 'Add a new API key for a provider',
    options: [
        { name: 'provider', type: 'string', description: 'Provider name (e.g., openai)', required: true },
        { name: 'key', type: 'string', description: 'The API key value', required: true },
        // Encryption is now default, maybe add --no-encrypt?
    ],
    async handler(context: CommandContext) {
        const { provider, key } = context.args;
        const apiKeyManager = ApiKeyManager.getInstance();
        const added = await apiKeyManager.addApiKey(provider, key); // Automatically encrypts and saves

        if (added) {
            context.formatter.success(`API key for ${provider} added and stored securely.`);
        } else {
            context.formatter.warn(`API key for ${provider} already exists or failed to add.`);
            return 1;
        }
        return 0;
    }
};

export const removeApiKeyCommand: Command = {
    name: 'remove',
    description: 'Remove a stored API key',
    options: [
        { name: 'provider', type: 'string', description: 'Provider name', required: true },
        { name: 'key', type: 'string', description: 'The exact API key value to remove', required: true },
    ],
    async handler(context: CommandContext) {
        const { provider, key } = context.args;
        const apiKeyManager = ApiKeyManager.getInstance();
        const removed = await apiKeyManager.removeApiKey(provider, key); // Automatically saves

        if (removed) {
            context.formatter.success(`API key for ${provider} removed.`);
        } else {
            context.formatter.error(`API key not found for ${provider}.`);
            return 1;
        }
        return 0;
    }
};

export const resetApiKeyCommand: Command = {
    name: 'reset',
    description: 'Reset failed status for API keys',
    options: [
        { name: 'provider', type: 'string', description: 'Provider name', required: true },
        { name: 'key', type: 'string', description: 'Specific API key to reset, or "all"', required: true },
    ],
    async handler(context: CommandContext) {
        const { provider, key } = context.args;
        const apiKeyManager = ApiKeyManager.getInstance();
        const configManager = ConfigManager.getInstance(); // Needed for 'all' case

        if (key.toLowerCase() === 'all') {
            // Reset all failed keys for the provider
            const failedKeysPath = `apiKeysFailed.${provider}`;
            const failedKeys = configManager.get<string[]>(failedKeysPath, []);
            if (failedKeys.length > 0) {
                configManager.set(failedKeysPath, []);
                await configManager.save();
                context.formatter.success(`Reset failed status for all ${provider} API keys.`);
            } else {
                context.formatter.info(`No keys marked as failed for ${provider}.`);
            }
        } else {
            // Reset specific key
            const reset = await apiKeyManager.unmarkApiKeyAsFailed(provider, key); // Automatically saves
            if (reset) {
                context.formatter.success(`Reset failed status for the specified ${provider} API key.`);
            } else {
                context.formatter.error(`API key not found or was not marked as failed for ${provider}.`);
                return 1;
            }
        }
        return 0;
    }
};

// Main command definition (assuming subcommands)
export const apiKeyCommand: Command = {
    id: 'apikey', // Or just 'key' ?
    name: 'apikey',
    description: 'Manage API keys for various providers',
    subcommands: [listApiKeysCommand, addApiKeyCommand, removeApiKeyCommand, resetApiKeyCommand],
    async handler(context: CommandContext) {
        // Show help if no subcommand is given
        context.formatter.info("Usage: swissknife apikey <list|add|remove|reset> ...");
        return 0;
    }
};

// Registration would happen elsewhere
// registerCommand(apiKeyCommand);
```

## Integration with IPFS Kit MCP Server

The unified architecture seamlessly handles API keys for MCP server authentication if needed by the client.

```typescript
// src/storage/ipfs/ipfs-client.ts (Conceptual)
import { ApiKeyManager } from '@/auth/api-key-manager.js'; // Use correct path
import { ConfigManager } from '@/config/manager.js'; // Use correct path

export class IPFSClient { // Renamed from MCPClient for clarity if only using IPFS features
  private apiKeyManager: ApiKeyManager;
  private configManager: ConfigManager;
  private apiUrl: string;

  constructor(options?: { apiUrl?: string }) {
    this.apiKeyManager = ApiKeyManager.getInstance();
    this.configManager = ConfigManager.getInstance();
    // Get specific IPFS API URL from config
    this.apiUrl = options?.apiUrl || this.configManager.get('storage.ipfs.apiUrl', 'http://127.0.0.1:5001');
  }

  private _getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    // Get API key specifically configured for 'ipfs' provider if needed
    const apiKey = this.apiKeyManager.getBestApiKey('ipfs'); // Use 'ipfs' as provider key

    if (apiKey) {
      // Adjust header based on actual IPFS API auth method (might not be Bearer)
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
    return headers;
  }

  async add(content: string | Buffer): Promise<{ cid: string }> {
    const headers = this._getAuthHeaders();
    // Make request using this.apiUrl and headers
    // ...
    return { cid: "example-cid" };
  }

  async cat(cid: string): Promise<Buffer> {
     const headers = this._getAuthHeaders();
     // Make request using this.apiUrl and headers
     // ...
     return Buffer.from("example");
  }

  // Other methods with authentication...
}
```

## Best Practices for API Key Management

### 1. Security First

- **Environment Variables**: Prefer loading sensitive keys from environment variables (e.g., `OPENAI_API_KEY`). The `ApiKeyManager` should detect these.
- **Secure Storage**: If storing keys in config, ensure encryption is used (`encryptAndStoreKey`). Avoid storing plaintext keys in committed files. Consider OS keychain integration (`keytar`) for maximum security.
- **Avoid Hardcoding**: Never hardcode API keys directly in the source code.

### 2. Use the Abstraction (`ApiKeyManager`)

Always retrieve keys via `ApiKeyManager.getBestApiKey()` instead of accessing `ConfigManager` or `process.env` directly. This ensures consistent handling of:
- Environment variable overrides
- Stored (and potentially encrypted) keys
- Key rotation logic
- Failed key tracking

```typescript
// Good practice
const apiKey = ApiKeyManager.getInstance().getBestApiKey('openai', { rotate: true });

// Bad practice
const envKey = process.env.OPENAI_API_KEY;
const storedKeys = ConfigManager.getInstance().get('apiKeys.openai', []);
const key = envKey || (storedKeys.length > 0 ? CryptoUtils.decrypt(storedKeys[0]) : null); // Doesn't handle rotation, failure, multiple keys etc.
```

### 3. Implement Key Rotation

If you have multiple keys for a provider (e.g., for load balancing or different quotas), use the `rotate: true` option when retrieving keys to distribute usage.

```typescript
// Distribute requests using key rotation
async function makeRequestWithRotation(provider: string, url: string, body: any) {
  const apiKey = ApiKeyManager.getInstance().getBestApiKey(provider, { rotate: true });
  if (!apiKey) throw new Error(`No valid API key for ${provider}`);

  // Make API request using the rotated key
  // ... (fetch call as in previous examples) ...
}
```

### 4. Handle Failures Gracefully

Mark keys as failed upon specific errors (401 Unauthorized, 429 Rate Limit) to enable automatic failover.

```typescript
// Within ModelProvider or API client logic
try {
    const response = await fetch(url, { headers: { 'Authorization': `Bearer ${apiKey}` } });
    if (response.status === 401 || response.status === 429) {
        await ApiKeyManager.getInstance().markApiKeyAsFailed(provider, apiKey);
        // Optionally retry immediately with the next key
        // return makeRequestWithFailureHandling(...);
    }
    // ... handle other errors or success ...
} catch (networkError) {
    await ApiKeyManager.getInstance().markApiKeyAsFailed(provider, apiKey);
    throw networkError;
}
```

### 5. User Configuration

Provide clear CLI commands (`apikey list/add/remove/reset`) for users to manage their stored keys easily. Guide users towards using environment variables for simplicity and security where possible.

## Troubleshooting Guide

### Issue: API Keys Not Persisting

**Symptoms:**
- Keys added via `apikey add` are not available after restarting.
- Configuration file (`~/.config/swissknife/config.json` or similar) is not updated.

**Solutions:**

1. **Verify `save()` Call:** Ensure `ConfigManager.save()` is called after `ApiKeyManager.addApiKey()` or `removeApiKey()`. The examples show `ApiKeyManager` methods now handle saving automatically.
2. **Check File Permissions:** Ensure the application has write permissions to the configuration directory and file. Use `swissknife config path` to find the file location.
   ```bash
   ls -ld $(dirname $(swissknife config path)) # Check directory permissions
   ls -l $(swissknife config path)           # Check file permissions
   ```
3. **Check ConfigManager Mock (Tests):** If occurring in tests, ensure the `ConfigManager` mock correctly simulates persistence or that `save()` is being called as expected.
4. **Inspect Config File:** Manually inspect the JSON configuration file to see if the `apiKeys.<provider>` array is being updated correctly (keys should appear encrypted).

### Issue: API Key Rotation Not Working

**Symptoms:**
- The same API key is used for consecutive requests despite multiple keys being stored.
- Rate limiting occurs even with multiple keys configured.

**Solutions:**

1. **Verify `rotate: true` Option:** Ensure the code calling `getBestApiKey` includes `{ rotate: true }` in the options object.
2. **Check Multiple Keys Exist:** Use `apikey list <provider>` to confirm multiple *valid* (non-failed) keys are stored for the provider. Rotation only occurs if more than one valid key is available.
3. **Check Rotation Index:** Inspect the configuration file for the `apiKeysIndex.<provider>` value to see if it's incrementing (this might require debug logging in `ApiKeyManager`).
4. **Reset Failed Keys:** Use `apikey reset <provider> all` to ensure no keys are incorrectly marked as failed, preventing them from being used in rotation.

### Issue: Failed Keys Still Being Used

**Symptoms:**
- Requests continue to fail with 401/429 errors even after a key should have been marked as failed.
- `getBestApiKey` returns a key known to be invalid.

**Solutions:**

1. **Verify `markApiKeyAsFailed` Call:** Ensure the code handling API errors (like 401/429) correctly calls `await ApiKeyManager.getInstance().markApiKeyAsFailed(provider, failedKey)`.
2. **Check `allowFailed: false`:** Ensure the code calling `getBestApiKey` is *not* passing `{ allowFailed: true }` unless intended. The default is `false`.
3. **Inspect Failed Keys List:** Use `apikey list <provider>` or inspect the configuration file for the `apiKeysFailed.<provider>` list to see which keys are marked.
4. **Check Decryption:** Ensure the key being marked as failed matches exactly the decrypted key stored in the config (check for whitespace or encoding issues).

## Complete Examples

*(Examples 1 and 2 demonstrating key validation, rotation, and failover are largely covered by the updated code snippets in previous sections and best practices. Refer to the `ApiKeyManager` and `BaseModelProvider` conceptual implementations.)*

## Conclusion

The unified architecture of SwissKnife provides a robust, type-safe, and centralized approach to API key management. By leveraging the Configuration domain and specialized key management components, the system ensures:

1. **Security**: Proper storage and optional encryption of sensitive keys, prioritizing environment variables.
2. **Reliability**: Automatic failover when keys are invalid or rate-limited, by tracking failed keys.
3. **Efficiency**: Key rotation to distribute load across multiple keys.
4. **Maintainability**: Centralized management via `ApiKeyManager` with clear interfaces.
5. **User Experience**: Consistent command interface (`apikey`) for key management.

This approach provides a single source of truth for API keys within the unified TypeScript codebase, while maintaining flexibility through environment variables, secure storage, and runtime key rotation/failover.
</final_file_content>

IMPORTANT: For any future changes to this file, use the final_file_content shown above as your reference. This content reflects the current state of the file, including any auto-formatting (e.g., if you used single quotes but the formatter converted them to double quotes). Always base your SEARCH/REPLACE operations on this final version to ensure accuracy.<environment_details>
# VSCode Visible Files
docs/API_KEY_MANAGEMENT.md

# VSCode Open Tabs
test/unit/command-registry.test.ts
test/messages.test.js
test/messages.test.ts
test/api_key_persistence.test.js
test/model_selector.test.tsx
test/staging-setup.js
test/verify-build.js
test/e2e/cli/commands.test.js
test/e2e/cli-workflows/cli-task-integration.test.ts
test/e2e/cli-workflows/cli-workflow.test.ts
test/e2e/task-execution/task-workflow.test.ts
test/integration/ai-storage/model-storage.test.ts
test/integration/ai-storage/model-storage-advanced.test.ts
test/integration/cli-models/model-commands.test.ts
test/integration/workflows/complex-query.test.ts
test/plans/phase3_tasknet_test_plan.md
test/integration/graph/got-manager.test.ts
test/integration/graph/got-node.test.ts
test/integration/mcp/mcp-integration.test.ts
test/integration/mcp/mcp-server-integration.test.ts
test/integration/mcp/mcp-system-integration.test.ts
test/integration/storage/mcp-client.test.ts
test/unit/ai/agent.test.ts
test/unit/ai/executor.test.ts
test/unit/ai/registry.test.ts
test/unit/auth/api-key-manager.test.ts
test/unit/commands/help-generator.test.ts
test/unit/commands/mcp.test.ts
README.md
CLAUDE.md
docs/GETTING_STARTED.md
docs/DEVELOPER_GUIDE.md
docs/PROJECT_STRUCTURE.md
docs/UNIFIED_ARCHITECTURE.md
docs/CLI_GUIDE.md
docs/CONTRIBUTING.md
docs/BUILD_PROCESS.md
docs/CICD.md
docs/ADVANCED_AI_FEATURES.md
docs/API_KEY_MANAGEMENT.md

# Current Time
4/13/2025, 7:54:11 PM (America/Los_Angeles, UTC-7:00)

# Context Window Usage
744,017 / 1,000K tokens used (74%)

# Current Mode
ACT MODE
</environment_details>
