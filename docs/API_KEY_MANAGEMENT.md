# API Key Management in SwissKnife

This document provides a comprehensive guide to API key management in the SwissKnife application, including configuration, storage, runtime handling, and troubleshooting for junior developers.

## Overview

SwissKnife requires API keys for various AI model providers (Lilypad, OpenAI, etc.). The application provides several ways to configure and use these keys:

1. **Environment Variables**: Setting keys directly in the environment
2. **Configuration File**: Storing keys in a local configuration file
3. **In-App Configuration**: Using the `/model` command to configure keys

## How API Keys Flow Through the System

Here's a complete lifecycle of API keys in SwissKnife:

1. **Key Entry**: Keys enter the system via:
   - Environment variables (e.g., `ANURA_API_KEY`)
   - User input via the `/model` command
   - Direct configuration file editing (rare)

2. **Key Storage**: Keys are stored in:
   - Configuration file as arrays (`smallModelApiKeys` and `largeModelApiKeys`)
   - Environment variables as fallback
   - Session state for tracking current index and failed keys

3. **Key Retrieval**: Keys are retrieved using:
   - `getActiveApiKey()` function in `config.ts`
   - Round-robin selection when multiple keys are available
   - Filtering out failed keys during selection

4. **Key Usage**: Keys are used in:
   - API requests to model providers
   - Authentication for services
   - Verification during model selection

5. **Key Rotation**: Keys are rotated via:
   - Round-robin selection to prevent rate limiting
   - Manual updating through the `/model` command
   - Automatic failover when keys are marked as failed

## API Key Storage Details

### Configuration File Structure

API keys are stored in a JSON configuration file with this structure:

```json
{
  "primaryProvider": "lilypad",
  "largeModelName": "llama3.1:8b",
  "smallModelName": "llama3.1:8b",
  "largeModelApiKeys": ["key1", "key2"],
  "smallModelApiKeys": ["key3", "key4"],
  "reasoningEffort": 0.5,
  "maxTokens": 4000
}
```

This file is located at the path defined by `GLOBAL_CLAUDE_FILE` from `env.ts` (typically in the user's home directory).

### Environment Variables

The application checks for these environment variables:

- `ANURA_API_KEY`: API key for Lilypad
- `OPENAI_API_KEY`: API key for OpenAI
- `MISTRAL_API_KEY`: API key for Mistral
- `ANTHROPIC_API_KEY`: General API key for Anthropic
- `SMALL_MODEL_API_KEY`: Specific Anthropic API key for small model
- `LARGE_MODEL_API_KEY`: Specific Anthropic API key for large model

Environment variables are checked in this order:
1. Provider-specific keys (e.g., `ANURA_API_KEY` for Lilypad)
2. Size-specific keys (e.g., `SMALL_MODEL_API_KEY`)
3. General provider keys (e.g., `ANTHROPIC_API_KEY`)

### Session State

Session state is an in-memory storage that tracks:

- `currentApiKeyIndex`: Object with indices for small/large model keys
  ```javascript
  { small: 0, large: 1 }
  ```
- `failedApiKeys`: Object with arrays of failed keys for small/large models
  ```javascript
  { small: ['failed-key-1'], large: [] }
  ```
- `modelErrors`: Object with error messages for different models
  ```javascript
  { 'lilypad/llama3.1:8b': 'Rate limit exceeded' }
  ```

Session state is intentionally not persisted between runs and resets when:
- The application restarts
- The user changes providers
- The user selects a new model
- A configuration is saved

## Key Functions For API Key Management (Reference)

### In `config.ts`

#### `getGlobalConfig()`
```typescript
function getGlobalConfig(): GlobalConfig
```
Retrieves the current configuration from the file system. Creates a default configuration if none exists.

#### `saveGlobalConfig(config: GlobalConfig)`
```typescript
function saveGlobalConfig(config: GlobalConfig): boolean
```
Saves the configuration to the file system. Returns `true` if successful.

#### `getActiveApiKey(config: GlobalConfig, modelSize: 'small' | 'large', roundRobin: boolean = false)`
```typescript
function getActiveApiKey(
  config: GlobalConfig, 
  modelSize: 'small' | 'large', 
  roundRobin: boolean = false
): string | undefined
```
Gets the active API key for the specified model size. If `roundRobin` is `true`, rotates through available keys.

**Algorithm details:**
1. Get keys array based on model size (`smallModelApiKeys` or `largeModelApiKeys`)
2. Filter out failed keys from session state
3. Get current index from session state
4. If using round-robin, increment index (with bounds checking)
5. Return key at current index
6. Fall back to environment variable if no keys in array
7. Add environment variable to config if found

#### `addApiKey(config: GlobalConfig, apiKey: string, modelSize: 'small' | 'large')`
```typescript
function addApiKey(
  config: GlobalConfig, 
  apiKey: string, 
  modelSize: 'small' | 'large'
): void
```
Adds an API key to the configuration if it doesn't already exist.

#### `removeApiKey(config: GlobalConfig, apiKey: string, modelSize: 'small' | 'large')`
```typescript
function removeApiKey(
  config: GlobalConfig, 
  apiKey: string, 
  modelSize: 'small' | 'large'
): void
```
Removes an API key from the configuration.

#### `markApiKeyAsFailed(apiKey: string, modelSize: 'small' | 'large')`
```typescript
function markApiKeyAsFailed(
  apiKey: string, 
  modelSize: 'small' | 'large'
): void
```
Marks an API key as failed in session state, preventing it from being used in future requests.

### In `ModelSelector.tsx`

#### `saveConfiguration(provider: string, model: string)`
```typescript
function saveConfiguration(provider: string, model: string): boolean
```
Saves the model configuration including API keys. Updates the configuration file and resets session state indices.

#### `handleApiKeySubmit(apiKey: string)`
```typescript
function handleApiKeySubmit(apiKey: string): void
```
Handles API key submission from the user. Verifies the key by attempting to fetch models.

#### `fetchModels()`
```typescript
async function fetchModels(): Promise<void>
```
Fetches available models using the current API key. Marks keys as failed if they don't work.

## In-Depth: Round-Robin API Key Selection

SwissKnife uses a round-robin approach to rotate through available API keys, which helps prevent rate limiting by distributing requests across multiple keys.

### Implementation Details

Here's how the round-robin selection works in `getActiveApiKey()`:

```typescript
// Get the current index from session state
let index = getSessionState('currentApiKeyIndex')?.[modelSize] || 0;

// If using round-robin, increment the index
if (roundRobin) {
  index = (index + 1) % availableKeys.length;
  
  // Update session state
  const currentIndices = getSessionState('currentApiKeyIndex') || { small: 0, large: 0 };
  currentIndices[modelSize] = index;
  setSessionState('currentApiKeyIndex', currentIndices);
}

// Return the key at the current index
return availableKeys[index];
```

This ensures that:
1. Each call with `roundRobin=true` uses the next key in sequence
2. The selection wraps around to the beginning when it reaches the end
3. Failed keys are filtered out before selection
4. Session state tracks the current index for each model size

## Complete Examples with Context

### Example 1: Adding and Using a New API Key

```typescript
import { getGlobalConfig, saveGlobalConfig, addApiKey, getActiveApiKey } from '../utils/config';

// Add a new API key for a specific provider
function addNewLilypadKey(apiKey: string) {
  // Get current configuration
  const config = getGlobalConfig();
  
  // Lilypad uses the same key for both small and large models
  addApiKey(config, apiKey, 'small');
  addApiKey(config, apiKey, 'large');
  
  // Update the provider and model selection
  config.primaryProvider = 'lilypad';
  config.smallModelName = 'llama3.1:8b';
  config.largeModelName = 'llama3.1:8b';
  
  // Save the updated configuration
  saveGlobalConfig(config);
  
  // Reset session state indices
  const sessionState = { small: 0, large: 0 };
  setSessionState('currentApiKeyIndex', sessionState);
  
  console.log('Added new Lilypad API key and updated configuration');
  
  // Test the new API key
  const activeKey = getActiveApiKey(config, 'large');
  return activeKey === apiKey;
}
```

### Example 2: Implementing API Key Rotation with Error Handling

```typescript
import { getGlobalConfig, getActiveApiKey, markApiKeyAsFailed } from '../utils/config';

// Make an API request with automatic key rotation on failure
async function makeApiRequestWithRetry(endpoint: string, data: any, maxRetries = 3) {
  const config = getGlobalConfig();
  let retries = 0;
  
  while (retries < maxRetries) {
    // Get the next API key using round-robin
    const apiKey = getActiveApiKey(config, 'large', true);
    
    if (!apiKey) {
      throw new Error('No valid API keys available');
    }
    
    try {
      // Make the API request
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        // If it's an auth error or rate limit, mark the key as failed
        if (response.status === 401 || response.status === 429) {
          markApiKeyAsFailed(apiKey, 'large');
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        // For other errors, return the error response
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      // Success! Return the response
      return await response.json();
    } catch (error) {
      retries++;
      
      // If we've reached max retries, throw the error
      if (retries >= maxRetries) {
        throw error;
      }
      
      // Otherwise, continue to the next iteration with a new key
      console.log(`Retry ${retries}/${maxRetries} with a different API key`);
    }
  }
}
```

### Example 3: Adding a New Provider with API Key Support

```typescript
// In src/constants/models.ts
export const providers = {
  // Existing providers
  lilypad: {
    name: 'Lilypad',
    baseURL: 'https://anura-testnet.lilypad.tech/'
    // ...
  },
  
  // New provider
  newProvider: {
    name: 'New Provider',
    baseURL: 'https://api.newprovider.com',
    envVar: 'NEW_PROVIDER_API_KEY',
    models: [
      {
        id: 'new-model-1',
        name: 'New Model 1',
        maxTokens: 8000,
        pricePerToken: 0.00001,
        capabilities: {
          streaming: true,
          images: false
        }
      }
    ]
  }
};

// In src/utils/config.ts
// Update getActiveApiKey to check for the new environment variable
function getActiveApiKey(config, modelSize, roundRobin = false) {
  // Existing code...
  
  // Check provider-specific environment variables
  if (config.primaryProvider === 'newProvider' && process.env.NEW_PROVIDER_API_KEY) {
    const newProviderKey = process.env.NEW_PROVIDER_API_KEY;
    
    // Add the key to the config if not already present
    if (!keysArray.includes(newProviderKey)) {
      addApiKey(config, newProviderKey, modelSize);
      saveGlobalConfig(config);
    }
    
    return newProviderKey;
  }
  
  // Existing fallback code...
}
```

## Troubleshooting Guide

### Issue: API Keys Not Persisting Between Sessions

**Symptoms:**
- Keys entered via the `/model` command disappear after restart
- Application keeps asking for API keys
- Config file doesn't contain the expected keys

**Possible Causes:**
1. `saveGlobalConfig()` not being called after key addition
2. Session state being used instead of persistent config
3. Wrong model size ('small' vs 'large') being used
4. Permission issues with the config file

**Solutions:**

1. **Check if the configuration is being saved:**
   ```typescript
   // After adding a key
   addApiKey(config, apiKey, modelSize);
   
   // Make sure to save the config
   const saved = saveGlobalConfig(config);
   console.log('Config saved:', saved);
   ```

2. **Verify the config file contents:**
   ```typescript
   // Log the config path and contents
   import { GLOBAL_CLAUDE_FILE } from '../utils/env';
   console.log('Config file path:', GLOBAL_CLAUDE_FILE);
   
   const config = getGlobalConfig();
   console.log('Config contents:', JSON.stringify(config, null, 2));
   ```

3. **Check for permission issues:**
   ```bash
   # In the terminal
   ls -la $HOME/.config/claude-cli/
   # Make sure the file is writeable
   ```

### Issue: Environment Variables Not Being Recognized

**Symptoms:**
- Keys set via environment variables aren't used
- Application ignores environment variables and asks for keys
- Environment variable keys not being added to config

**Solutions:**

1. **Verify environment variables are set:**
   ```typescript
   // Log all relevant environment variables
   console.log('Environment variables:');
   console.log('ANURA_API_KEY:', process.env.ANURA_API_KEY ? 'Set' : 'Not set');
   console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Set' : 'Not set');
   // ... other variables
   ```

2. **Check variable names for typos:**
   ```bash
   # Set variables correctly in your shell
   export ANURA_API_KEY="your-key-here"  # Not ANURA_KEY or LILY_PAD_KEY
   ```

3. **Add explicit environment variable checks:**
   ```typescript
   // In getActiveApiKey or similar function
   const envKey = process.env.ANURA_API_KEY;
   if (envKey) {
     console.log('Found environment variable key');
     // Use the key
   }
   ```

### Issue: Round-Robin Key Selection Not Working

**Symptoms:**
- Same API key always being used
- No rotation between available keys
- Rate limiting due to overuse of a single key

**Solutions:**

1. **Check session state is being updated:**
   ```typescript
   // Before and after round-robin selection
   console.log('Before:', getSessionState('currentApiKeyIndex'));
   const key = getActiveApiKey(config, modelSize, true); // true for round-robin
   console.log('After:', getSessionState('currentApiKeyIndex'));
   ```

2. **Verify multiple keys are available:**
   ```typescript
   const config = getGlobalConfig();
   console.log('Available keys:', config.largeModelApiKeys.length);
   ```

3. **Reset session state indices manually:**
   ```typescript
   setSessionState('currentApiKeyIndex', { small: 0, large: 0 });
   ```

## Best Practices for API Key Management

1. **Never hardcode API keys** in the source code
2. **Always use the helper functions** instead of direct access:
   - `getActiveApiKey()` instead of `config.largeModelApiKeys[0]`
   - `addApiKey()` instead of `config.largeModelApiKeys.push()`
3. **Check both config and environment variables**
4. **Reset session state indices** when changing providers
5. **Handle API key failure gracefully**:
   - Mark keys as failed when API calls fail with auth errors
   - Automatically retry with different keys
   - Provide clear error messages to users
6. **Rotate keys with round-robin** to prevent rate limiting
7. **Validate API keys** before saving them to configuration
8. **Provide meaningful error messages** for invalid keys

## Additional Reading

For more information, refer to:
1. **Code Architecture Document**: `docs/CODE_ARCHITECTURE.md`
2. **API Key Tests**: `test/api_key_persistence.test.js`
3. **Model Configuration**: `src/constants/models.ts`