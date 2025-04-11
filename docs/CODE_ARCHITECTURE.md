# SwissKnife Code Architecture

This document provides a comprehensive overview of the SwissKnife application architecture to help junior developers understand the codebase and make effective contributions.

## Application Overview

SwissKnife is a command-line interface (CLI) application built with TypeScript and Ink (a React-based terminal UI library). It provides access to various AI models through a unified interface for tasks such as code assistance, content generation, and more.

## Key Technologies

- **TypeScript**: Strongly-typed JavaScript used throughout the codebase
- **React**: Component-based UI library
- **Ink**: React for command-line interfaces
- **Node.js**: JavaScript runtime environment
- **External AI APIs**: 
  - Lilypad (Anura API)
  - OpenAI (GPT models)
  - Anthropic (Claude models)
  - Mistral
  - Groq

## Project Structure

```
swissknife/
├── docs/             # Documentation
│   ├── API_KEY_MANAGEMENT.md     # Guide for API key handling
│   ├── CODE_ARCHITECTURE.md      # This document
│   ├── CONTRIBUTING.md           # Contribution guidelines 
│   └── GETTING_STARTED.md        # Setup and initial guidance
├── test/             # Test files
│   ├── api_key_persistence.test.js  # Tests for API key handling
│   ├── model_selector.test.js       # Tests for model selection
│   └── README.md                    # Testing guide
├── src/              # Source code
│   ├── components/   # React components
│   │   ├── CustomSelect/           # Custom select component
│   │   ├── ModelSelector.tsx       # Model selection UI
│   │   └── messages/               # Message display components
│   ├── constants/    # Configuration constants
│   │   ├── models.ts               # Model definitions
│   │   └── product.ts              # App configuration
│   ├── services/     # API service integrations
│   │   ├── claude.ts               # Anthropic API
│   │   ├── openai.ts               # OpenAI API
│   │   └── mcpClient.ts            # MCP client
│   ├── tools/        # Tool implementations
│   ├── utils/        # Utility functions
│   │   ├── config.ts               # Configuration management
│   │   └── sessionState.ts         # In-memory state management
│   ├── hooks/        # Custom React hooks
│   ├── screens/      # Full-screen UI components
│   ├── commands/     # Command implementations
│   │   ├── model.tsx               # Model selection command
│   │   └── config.tsx              # Config management
│   └── entrypoints/  # Application entry points
│       └── cli.tsx                 # Main CLI entry point
└── CLAUDE.md         # Project overview and guidelines
```

## Core Architecture Components

### 1. Entry Points and Command System

The application is structured around a command-based architecture:

- `src/entrypoints/cli.tsx`: Main entry point that initializes the app and processes commands
- `src/commands/*.ts`: Individual command implementations that register with the command system
- Command registration happens during initialization and follows this pattern:

```typescript
// In src/commands.ts
export const commands: Record<string, CommandDefinition> = {
  model: {
    description: 'Configure model settings',
    usage: '/model',
    component: ModelCommand,
  },
  // Other commands...
};

// In src/entrypoints/cli.tsx
export const App = () => {
  // Initialize commands
  const commandHandlers = Object.entries(commands).reduce(
    (acc, [name, def]) => ({
      ...acc,
      [name]: def.component,
    }),
    {}
  );
  
  // Render command UI or main interface
  return (
    <Box flexDirection="column">
      {/* Command rendering logic */}
      {currentCommand ? (
        <CurrentCommand {...commandProps} />
      ) : (
        <MainInterface />
      )}
    </Box>
  );
};
```

### 2. Model Configuration System

#### A. Model Definition Architecture

Models are defined in `src/constants/models.ts` with a carefully designed type system:

```typescript
// Type definitions
export interface ModelCapabilities {
  streaming?: boolean;
  images?: boolean;
  functions?: boolean;
  // Other capabilities...
}

export interface ModelDefinition {
  id: string;
  name: string;
  maxTokens: number;
  pricePerToken: number;
  capabilities: ModelCapabilities;
}

export interface ProviderDefinition {
  name: string;
  baseURL: string;
  envVar?: string;
  models: ModelDefinition[];
}

// Provider and model implementation
export const providers: Record<string, ProviderDefinition> = {
  lilypad: {
    name: 'Lilypad',
    baseURL: 'https://anura-testnet.lilypad.tech/',
    envVar: 'ANURA_API_KEY',
    models: [
      {
        id: 'llama3.1:8b',
        name: 'Llama 3.1 (8B)',
        maxTokens: 8000,
        pricePerToken: 0.0000002,
        capabilities: {
          streaming: true,
        },
      },
      // Other models...
    ],
  },
  // Other providers...
};
```

#### B. Model Selection Flow

The model selection process involves several components working together:

1. **Command Entry**: User types `/model` to enter model selection mode
2. **Selection Screens**: `ModelSelector.tsx` provides a multi-step UI:
   - Provider selection
   - API key input 
   - Model selection
   - Parameters
   - Confirmation

3. **Navigation Stack**: Screen transitions are managed through a navigation stack:

```typescript
// In ModelSelector.tsx
interface State {
  screenStack: string[];
  currentScreen: string;
  // Other state properties...
}

// Navigation methods
navigateTo = (screen: string) => {
  this.setState((prevState) => ({
    screenStack: [...prevState.screenStack, prevState.currentScreen],
    currentScreen: screen,
  }));
};

navigateBack = () => {
  if (this.state.screenStack.length === 0) return;
  
  this.setState((prevState) => ({
    currentScreen: prevState.screenStack[prevState.screenStack.length - 1],
    screenStack: prevState.screenStack.slice(0, -1),
  }));
};
```

4. **Configuration Saving**: On confirmation, settings are saved to persistent storage:

```typescript
saveConfiguration = (provider: string, model: string) => {
  const newConfig = { ...getGlobalConfig() };
  
  // Update configuration
  newConfig.primaryProvider = provider;
  
  // Reset session state
  setSessionState('currentApiKeyIndex', { small: 0, large: 0 });
  
  // Save the configuration
  return saveGlobalConfig(newConfig);
};
```

### 3. API Key Management Architecture

SwissKnife implements a sophisticated API key management system:

#### A. Storage Layers

1. **Persistent Configuration**: The primary long-term storage
   ```typescript
   interface GlobalConfig {
     primaryProvider: string;
     largeModelName: string;
     smallModelName: string;
     largeModelApiKeys: string[];
     smallModelApiKeys: string[];
     // Other configuration...
   }
   ```

2. **Session State**: In-memory state for temporary values
   ```typescript
   interface SessionState {
     modelErrors: Record<string, unknown>;
     currentError: string | null;
     currentApiKeyIndex: Record<'small' | 'large', number>;
     failedApiKeys: Record<'small' | 'large', string[]>;
   }
   ```

3. **Environment Variables**: External configuration source
   ```typescript
   // Environment variable examples
   process.env.ANURA_API_KEY        // Lilypad
   process.env.OPENAI_API_KEY       // OpenAI
   process.env.MISTRAL_API_KEY      // Mistral
   process.env.SMALL_MODEL_API_KEY  // Small model fallback
   process.env.LARGE_MODEL_API_KEY  // Large model fallback
   ```

#### B. Key Core Functions with Implementation Details

The `getActiveApiKey` function is central to API key management:

```typescript
export function getActiveApiKey(
  config: GlobalConfig,
  modelSize: 'small' | 'large',
  roundRobin: boolean = false
): string | undefined {
  // 1. Get the keys array based on model size
  const keysArray =
    modelSize === 'small' ? config.smallModelApiKeys : config.largeModelApiKeys;

  // 2. Filter out failed keys
  const failedKeys = getSessionState('failedApiKeys')?.[modelSize] || [];
  const availableKeys = keysArray.filter(key => !failedKeys.includes(key));

  // 3. If we have available keys, get one based on the current index
  if (availableKeys.length > 0) {
    // Get the current index
    let index = getSessionState('currentApiKeyIndex')?.[modelSize] || 0;
    
    // If index is out of bounds, reset it
    if (index >= availableKeys.length) index = 0;
    
    // If roundRobin is true, increment the index for the next call
    if (roundRobin) {
      index = (index + 1) % availableKeys.length;
      
      // Update session state
      const currentIndices = getSessionState('currentApiKeyIndex') || { small: 0, large: 0 };
      currentIndices[modelSize] = index;
      setSessionState('currentApiKeyIndex', currentIndices);
    }
    
    return availableKeys[index];
  }

  // 4. If no keys in the array, check provider-specific environment variables
  if (config.primaryProvider === 'lilypad' && process.env.ANURA_API_KEY) {
    const anuraKey = process.env.ANURA_API_KEY;
    
    // Add to config if not already present
    if (!keysArray.includes(anuraKey)) {
      addApiKey(config, anuraKey, modelSize);
      saveGlobalConfig(config);
    }
    
    return anuraKey;
  }
  
  // Similar checks for other providers...
  
  // 5. Final fallback to size-specific environment variables
  const envVar = modelSize === 'small' ? 'SMALL_MODEL_API_KEY' : 'LARGE_MODEL_API_KEY';
  if (process.env[envVar]) {
    return process.env[envVar];
  }
  
  // 6. No valid key found
  return undefined;
}
```

### 4. Service Integration Architecture

Services are abstracted into provider-specific implementations:

```typescript
// In src/services/claude.ts
export async function callClaude({
  prompt,
  apiKey,
  modelName,
  maxTokens,
  reasoningEffort,
  callbacks,
}: ClaudeParams): Promise<string> {
  // API request implementation
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: modelName,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  
  // Error handling and response processing
  // ...
  
  return result;
}

// Similar structure for other providers
```

## Data Flow and Interaction

### Complete Data Flow Example: Model Selection and Use

1. **Command Invocation**: User types `/model` in the CLI
   ```typescript
   // Processed in cli.tsx
   if (input.startsWith('/')) {
     const [commandName, ...args] = input.slice(1).split(' ');
     if (commands[commandName]) {
       setCurrentCommand(commandName);
       setCommandArgs(args);
     }
   }
   ```

2. **Model Selection Process**:
   - `ModelSelector` is rendered with stepwise UI
   - User selects "Lilypad" provider
   - User provides API key or uses environment variable
   - User selects "Llama 3.1 (8B)" model
   - User adjusts parameters (max tokens, etc.)
   - User confirms selection

3. **Configuration Saving**:
   ```typescript
   // In ModelSelector.tsx
   handleConfirmation = () => {
     const { selectedProvider, selectedModel } = this.state;
     
     // Save configuration
     this.saveConfiguration(selectedProvider, selectedModel);
     
     // Complete the command
     this.props.onDone();
   };
   ```

4. **Using the Model**:
   - User types a prompt in the main interface
   - Application retrieves model config with `getGlobalConfig()`
   - Application gets API key with `getActiveApiKey()`
   - Application calls appropriate service (e.g., `callLilypad`)
   - Response is displayed to the user

### Component Relationships

```
cli.tsx
  ├── commands.ts
  │     └── model.tsx
  │           └── ModelSelector.tsx
  │                 ├── CustomSelect/select.tsx
  │                 └── TextInput.tsx
  ├── services/
  │     ├── claude.ts
  │     ├── openai.ts
  │     └── lilypad.ts (via anura-testnet)
  └── utils/
        ├── config.ts
        └── sessionState.ts
```

## Configuration Management Deep Dive

### GlobalConfig Structure

```typescript
export interface GlobalConfig {
  // Provider and model selection
  primaryProvider: string;
  largeModelName: string;
  smallModelName: string;
  
  // API key storage
  largeModelApiKeys: string[];
  smallModelApiKeys: string[];
  
  // Model parameters
  reasoningEffort: number;
  maxTokens: number;
  temperature?: number;
  
  // User preferences
  darkMode?: boolean;
  terseMode?: boolean;
}
```

### Configuration Storage

The configuration is stored in a JSON file at a location determined by platform:
- On macOS: `~/Library/Application Support/claude-cli/config.json`
- On Linux: `~/.config/claude-cli/config.json`
- On Windows: `%APPDATA%\claude-cli\config.json`

```typescript
// In src/utils/config.ts
export function getGlobalConfig(): GlobalConfig {
  try {
    // Get the config file path from environment
    const configPath = process.env.GLOBAL_CLAUDE_FILE || defaultConfigPath;
    
    // Read and parse the config file
    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);
    
    // Return with defaults for missing properties
    return {
      primaryProvider: 'lilypad',
      largeModelName: 'llama3.1:8b',
      smallModelName: 'llama3.1:8b',
      largeModelApiKeys: [],
      smallModelApiKeys: [],
      reasoningEffort: 0.5,
      maxTokens: 4000,
      ...config
    };
  } catch (error) {
    // If file doesn't exist or has invalid JSON, return default config
    return {
      primaryProvider: 'lilypad',
      largeModelName: 'llama3.1:8b',
      smallModelName: 'llama3.1:8b',
      largeModelApiKeys: [],
      smallModelApiKeys: [],
      reasoningEffort: 0.5,
      maxTokens: 4000
    };
  }
}
```

## Testing Architecture

The application uses Jest for testing with a focus on mocking dependencies:

```javascript
// Example from api_key_persistence.test.js
describe('API Key Persistence', () => {
  // Mock config and session state
  const mockConfig = {
    primaryProvider: 'lilypad',
    largeModelApiKeys: ['test-api-key-1', 'test-api-key-2'],
    smallModelApiKeys: ['test-api-key-3', 'test-api-key-4'],
  };
  
  let mockSessionState = {
    currentApiKeyIndex: { small: 0, large: 0 },
    failedApiKeys: { small: [], large: [] },
  };
  
  // Mock functions
  const getGlobalConfig = () => mockConfig;
  const saveGlobalConfig = (config) => {
    Object.assign(mockConfig, config);
    return true;
  };
  
  // Reset mocks before each test
  beforeEach(() => {
    // Reset state...
  });
  
  // Tests...
});
```

## Adding New Features: Step-by-Step Guide

### Adding a New Model Provider

1. **Update Model Definitions**:
```typescript
// In src/constants/models.ts
export const providers = {
  // Existing providers...
  
  // Add new provider
  newProvider: {
    name: 'New Provider',
    baseURL: 'https://api.newprovider.com',
    envVar: 'NEW_PROVIDER_API_KEY',
    models: [
      {
        id: 'new-model-1',
        name: 'New Model 1',
        maxTokens: 16000,
        pricePerToken: 0.0000001,
        capabilities: {
          streaming: true,
          images: false,
        },
      },
    ],
  },
};
```

2. **Create Service Integration**:
```typescript
// Create src/services/newProvider.ts
export async function callNewProvider({
  prompt,
  apiKey,
  modelName,
  maxTokens,
  callbacks,
}: NewProviderParams): Promise<string> {
  try {
    const response = await fetch('https://api.newprovider.com/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        prompt: prompt,
        max_tokens: maxTokens,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error('Error calling New Provider API:', error);
    throw error;
  }
}
```

3. **Update API Key Handling**:
```typescript
// In src/utils/config.ts, update getActiveApiKey
if (config.primaryProvider === 'newProvider' && process.env.NEW_PROVIDER_API_KEY) {
  const newProviderKey = process.env.NEW_PROVIDER_API_KEY;
  
  // Add to config if not already present
  if (!keysArray.includes(newProviderKey)) {
    addApiKey(config, newProviderKey, modelSize);
    saveGlobalConfig(config);
  }
  
  return newProviderKey;
}
```

4. **Add Provider-Specific UI Handling**:
```typescript
// In ModelSelector.tsx
renderProviderScreen() {
  const providers = [
    { value: 'lilypad', label: 'Lilypad' },
    { value: 'openai', label: 'OpenAI' },
    // Add the new provider
    { value: 'newProvider', label: 'New Provider' },
  ];
  
  // Render provider selection
}

// Add any provider-specific API key handling
fetchModels = async () => {
  const { selectedProvider, apiKey } = this.state;
  
  // Provider-specific handling
  if (selectedProvider === 'newProvider') {
    // Custom handling for New Provider
    try {
      // Verify the API key works
      // ...
      
      // Set available models
      this.setAvailableModels(getModelsForProvider('newProvider'));
      this.navigateTo('model');
    } catch (error) {
      this.setModelLoadError(
        'Invalid API key for New Provider. Get an API key from https://newprovider.com/'
      );
    }
  }
  
  // Existing provider handling...
};
```

5. **Add Tests**:
```javascript
// In a new or existing test file
test('getActiveApiKey handles New Provider API keys', () => {
  // Set up test
  mockConfig.primaryProvider = 'newProvider';
  mockConfig.largeModelApiKeys = [];
  process.env.NEW_PROVIDER_API_KEY = 'new-provider-test-key';
  
  // Call function
  const key = getActiveApiKey(mockConfig, 'large');
  
  // Verify results
  expect(key).toBe('new-provider-test-key');
  expect(mockConfig.largeModelApiKeys).toContain('new-provider-test-key');
});
```

## Troubleshooting Common Issues: Detailed Guide

### API Key Issues

#### Problem: API Keys Not Persisting

1. **Check Config File Location**:
```typescript
import { GLOBAL_CLAUDE_FILE } from '../utils/env';
console.log('Config file path:', GLOBAL_CLAUDE_FILE);
```

2. **Verify Config Content**:
```typescript
const config = getGlobalConfig();
console.log('Config:', JSON.stringify(config, null, 2));
```

3. **Check API Key Arrays**:
```typescript
console.log('Large model keys:', config.largeModelApiKeys);
console.log('Small model keys:', config.smallModelApiKeys);
```

4. **Debug Session State**:
```typescript
const sessionState = getSessionState();
console.log('Session state:', sessionState);
```

5. **Verify Save Operation**:
```typescript
// After adding a key
const saved = saveGlobalConfig(config);
console.log('Config saved successfully:', saved);
```

### Component Rendering Issues

1. **Check Component State**:
```typescript
console.log('Component state:', this.state);
```

2. **Verify Props**:
```typescript
console.log('Component props:', this.props);
```

3. **Debug Screen Navigation**:
```typescript
console.log('Current screen:', this.state.currentScreen);
console.log('Screen stack:', this.state.screenStack);
```

### Comprehensive Architecture Visualization

```
┌───────────────────────────────────────────────────────────────┐
│                       User Interface                           │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│ │  commands/  │ │ components/ │ │  screens/   │ │   hooks/  │ │
│ │ model.tsx   │ │ModelSelector│ │   REPL.tsx  │ │useInput() │ │
│ └─────┬───────┘ └──────┬──────┘ └──────┬──────┘ └─────┬─────┘ │
└───────┼───────────────┼───────────────┼───────────────┼───────┘
         │               │               │               │
┌────────┼───────────────┼───────────────┼───────────────┼──────┐
│        │               │               │               │      │
│    ┌───▼───┐      ┌────▼────┐     ┌────▼─────┐    ┌────▼────┐ │
│    │utils/  │      │constants/│     │ services/ │    │  utils/ │ │
│    │config  │      │ models   │     │ claude    │    │sessionSt│ │
│    └───┬───┘      └────┬────┘     └────┬─────┘    └─────────┘ │
│        │               │               │                       │
│  ┌─────▼─────┐   ┌─────▼────┐    ┌─────▼────┐                 │
│  │Config File │   │Model Defs │    │ API Calls │                 │
│  └───────────┘   └──────────┘    └──────────┘                 │
│                                                               │
│                    Application Logic                           │
└───────────────────────────────────────────────────────────────┘
```

## Advanced Topics for Experienced Developers

### Custom Provider API Response Handling

For complex API responses, implement custom response parsing:

```typescript
// Advanced response handling for streaming APIs
export async function callStreamingAPI({
  prompt,
  apiKey,
  callbacks,
}: StreamingParams): Promise<string> {
  const response = await fetch('https://api.provider.com/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ prompt }),
  });
  
  // Handle streaming response
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let result = '';
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      result += chunk;
      
      // Use callback for incremental updates
      callbacks?.onChunk?.(chunk);
    }
  } finally {
    reader.releaseLock();
  }
  
  return result;
}
```

### Dynamic Provider Registration

For plugins or extensions, implement dynamic provider registration:

```typescript
// Provider registry system
const providerRegistry = new Map();

export function registerProvider(id: string, provider: ProviderDefinition) {
  providerRegistry.set(id, provider);
}

export function getProvider(id: string) {
  return providerRegistry.get(id);
}

export function getAllProviders() {
  return Array.from(providerRegistry.values());
}

// Usage example
registerProvider('custom-provider', {
  name: 'Custom Provider',
  baseURL: 'https://api.custom.com',
  models: [...],
});
```

## Conclusion and Further Reading

This document provides a detailed overview of the SwissKnife architecture with a focus on helping junior developers understand the core components and patterns. For more specific information, refer to these resources:

- **API Key Management**: See `docs/API_KEY_MANAGEMENT.md`
- **Testing Guide**: See `test/README.md`
- **Contribution Guidelines**: See `docs/CONTRIBUTING.md`
- **Implementation Examples**: Review the test files for concrete examples

When adding new features, always follow the established patterns and architecture to maintain consistency throughout the codebase.