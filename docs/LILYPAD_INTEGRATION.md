# Lilypad Integration in SwissKnife Unified Architecture

This document outlines how Lilypad is integrated as a model provider within the domain-driven SwissKnife unified architecture.

## 1. Integration Overview

In the unified SwissKnife architecture, Lilypad's Anura API is integrated as a model provider within the AI domain, following our domain-driven organization pattern. This integration leverages Lilypad's OpenAI-compatible interface to seamlessly provide access to a variety of open-source models.

### 1.1 Lilypad in the Domain Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                      SwissKnife Unified Codebase                │
│                                                                 │
│  ┌──────────────────────┐                                       │
│  │    AI Domain         │                                       │
│  │                      │                                       │
│  │   ┌───────────────┐  │   ┌─────────────────┐                 │
│  │   │ ModelRegistry │──┼──▶│ ModelProvider   │◀── Interface    │
│  │   └───────────────┘  │   └────────┬────────┘                 │
│  │                      │            │                          │
│  │   ┌───────────────┐  │            │                          │
│  │   │ Agent         │  │            ▼                          │
│  │   └───────────────┘  │   ┌─────────────────┐                 │
│  │                      │   │ OpenAIProvider  │                 │
│  └──────────────────────┘   │ AnthropicProv.  │                 │
│                             │ LilypadProvider │◀── Implementation│
│  ┌──────────────────────┐   │ MistralProvider │                 │
│  │    CLI Domain        │   │ CustomProvider  │                 │
│  │                      │   └─────────────────┘                 │
│  └──────────────────────┘                                       │
│                                                                 │
│  ┌──────────────────────┐                                       │
│  │    Tasks Domain      │                                       │
│  │                      │                                       │
│  └──────────────────────┘                                       │
│                                                                 │
│  ┌──────────────────────┐                                       │
│  │    Storage Domain    │                                       │
│  │                      │                                       │
│  └──────────────────────┘                                       │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### 1.2 Key Integration Points

1. **AI Domain Integration**:
   - LilypadProvider class implements the ModelProvider interface
   - Registered with the ModelRegistry for discovery and use
   - Used by the Agent class for model inference

2. **Configuration Domain Integration**:
   - API key management through the centralized ConfigManager
   - Provider-specific settings in typed configuration schema

3. **CLI Domain Integration**:
   - Model selection commands for Lilypad models
   - Command handling for provider configuration
   - UI components for model information and selection

## 2. Implementation Details

### 2.1 Model Provider Implementation

The LilypadProvider is implemented directly in TypeScript within the AI domain:

```typescript
// src/ai/models/providers/lilypad-provider.ts
import { ModelProvider, Model, ModelResponse, GenerateOptions } from '../../types/model';
import { ConfigManager } from '../../../config/manager';
import { APIKeyManager } from '../../../config/api-key-manager';

export class LilypadProvider implements ModelProvider {
  id = 'lilypad';
  name = 'Lilypad';
  baseUrl = 'https://anura-testnet.lilypad.tech/api/v1';
  
  private configManager: ConfigManager;
  private apiKeyManager: APIKeyManager;
  
  constructor() {
    this.configManager = ConfigManager.getInstance();
    this.apiKeyManager = APIKeyManager.getInstance();
  }
  
  getAvailableModels(): string[] {
    return [
      'llama3.1:8b',
      'qwen2.5:7b',
      'qwen2.5-coder:7b',
      'phi4-mini:3.8b',
      'mistral:7b',
      'llama2:7b',
      'deepseek-r1:7b',
      'sdxl-turbo'
    ];
  }
  
  createModel(modelId: string): Model {
    // Validate model ID
    if (!this.getAvailableModels().includes(modelId)) {
      throw new Error(`Model '${modelId}' not available in Lilypad provider`);
    }
    
    // Return model implementation
    return {
      id: modelId,
      provider: this.id,
      name: `Lilypad ${modelId}`,
      
      async generate(options: GenerateOptions): Promise<ModelResponse> {
        // Get API key
        const apiKey = this.apiKeyManager.getAPIKey('lilypad', { rotate: true });
        
        if (!apiKey) {
          throw new Error('No Lilypad API key available');
        }
        
        try {
          // Handle image generation models
          if (modelId === 'sdxl-turbo') {
            return this.generateImage(options, apiKey);
          }
          
          // Handle text generation models
          return this.generateText(options, apiKey);
        } catch (error) {
          // Handle API errors
          if (error.response?.status === 401) {
            this.apiKeyManager.markAPIKeyAsFailed('lilypad', apiKey);
            throw new Error('Invalid Lilypad API key');
          }
          
          throw error;
        }
      }
    };
  }
  
  getDefaultModel(): Model {
    const defaultModelId = this.configManager.get<string>('ai.lilypad.defaultModel', 'llama3.1:8b');
    return this.createModel(defaultModelId);
  }
  
  private async generateText(options: GenerateOptions, apiKey: string): Promise<ModelResponse> {
    // Implementation details...
    return {
      content: "Generated text response"
    };
  }
  
  private async generateImage(options: GenerateOptions, apiKey: string): Promise<ModelResponse> {
    // Implementation details...
    return {
      content: "",
      images: ["image-url"]
    };
  }
}
```

### 2.2 Model Registry Integration

The LilypadProvider is registered with the ModelRegistry during application initialization:

```typescript
// src/ai/models/registry.ts
import { ModelProvider } from '../types/model';
import { OpenAIProvider } from './providers/openai-provider';
import { AnthropicProvider } from './providers/anthropic-provider';
import { LilypadProvider } from './providers/lilypad-provider';
import { ConfigManager } from '../../config/manager';

export class ModelRegistry {
  private static instance: ModelRegistry;
  private providers: Map<string, ModelProvider> = new Map();
  private configManager: ConfigManager;
  
  private constructor() {
    this.configManager = ConfigManager.getInstance();
    this.registerDefaultProviders();
  }
  
  static getInstance(): ModelRegistry {
    if (!ModelRegistry.instance) {
      ModelRegistry.instance = new ModelRegistry();
    }
    return ModelRegistry.instance;
  }
  
  private registerDefaultProviders(): void {
    // Register standard providers
    this.registerProvider(new OpenAIProvider());
    this.registerProvider(new AnthropicProvider());
    this.registerProvider(new LilypadProvider());
    // Other providers...
  }
  
  registerProvider(provider: ModelProvider): void {
    this.providers.set(provider.id, provider);
  }
  
  getProvider(id: string): ModelProvider | undefined {
    return this.providers.get(id);
  }
  
  getAllProviders(): ModelProvider[] {
    return Array.from(this.providers.values());
  }
  
  getDefaultProvider(): ModelProvider {
    const defaultProviderId = this.configManager.get<string>('ai.defaultProvider', 'openai');
    return this.providers.get(defaultProviderId) || this.providers.get('openai')!;
  }
  
  // Additional methods...
}
```

### 2.3 API Key Management

API keys are managed through the centralized APIKeyManager in the Configuration domain:

```typescript
// src/config/api-key-manager.ts
import { ConfigManager } from './manager';

export class APIKeyManager {
  private static instance: APIKeyManager;
  private configManager: ConfigManager;
  
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
    // First check environment variable (special handling for Lilypad/Anura)
    if (provider === 'lilypad') {
      const lilypadKey = process.env.LILYPAD_API_KEY;
      if (lilypadKey) {
        this.addAPIKey(provider, lilypadKey);
        return lilypadKey;
      }
      
      // Also check ANURA_API_KEY which is Lilypad's official env var name
      const anuraKey = process.env.ANURA_API_KEY;
      if (anuraKey) {
        this.addAPIKey(provider, anuraKey);
        return anuraKey;
      }
    }
    
    // Check configuration for stored keys
    // Implementation details...
    
    return null;
  }
  
  // Additional methods...
}
```

### 2.4 Command Implementation

Commands for Lilypad model selection and configuration are implemented in the CLI domain:

```typescript
// src/cli/commands/model-commands.ts
import { CommandRegistry } from './registry';
import { ModelRegistry } from '../../ai/models/registry';
import { ConfigManager } from '../../config/manager';
import { APIKeyManager } from '../../config/api-key-manager';

export function registerModelCommands() {
  const commandRegistry = CommandRegistry.getInstance();
  
  commandRegistry.registerCommand({
    id: 'model.lilypad',
    name: 'model lilypad',
    description: 'Configure Lilypad models',
    
    async handler(args, context) {
      const modelRegistry = ModelRegistry.getInstance();
      const lilypadProvider = modelRegistry.getProvider('lilypad');
      
      if (!lilypadProvider) {
        context.ui.error('Lilypad provider not available');
        return 1;
      }
      
      const models = lilypadProvider.getAvailableModels();
      
      // Display available models
      context.ui.info('Available Lilypad models:');
      context.ui.table({
        headers: ['ID', 'Name', 'Type'],
        rows: models.map(id => {
          const type = id === 'sdxl-turbo' ? 'Image' : 'Text';
          return [id, `Lilypad ${id}`, type];
        })
      });
      
      // Prompt for API key if not set
      const apiKeyManager = APIKeyManager.getInstance();
      const apiKey = apiKeyManager.getAPIKey('lilypad');
      
      if (!apiKey) {
        context.ui.info('No Lilypad API key configured. You can get one from https://anura.lilypad.tech/');
        
        const newKey = await context.ui.prompt({
          type: 'password',
          message: 'Enter Lilypad API key:',
          validate: value => !!value || 'API key is required'
        });
        
        if (newKey) {
          apiKeyManager.addAPIKey('lilypad', newKey);
          context.ui.success('API key added successfully');
        }
      }
      
      return 0;
    }
  });
  
  // Additional commands...
}
```

## 3. Lilypad Models and Capabilities

### 3.1 Supported Models

| Model | Type | Max Tokens | Function Calling | Tool Choice | Description |
|-------|------|------------|-----------------|-------------|-------------|
| llama3.1:8b | Text | 8192 | Yes | Yes | Meta's latest LLaMA model |
| qwen2.5:7b | Text | 8192 | Yes | Yes | Alibaba's Qwen 2.5 model |
| qwen2.5-coder:7b | Text | 8192 | Yes | Yes | Code-specialized version of Qwen 2.5 |
| phi4-mini:3.8b | Text | 8192 | Yes | Yes | Microsoft's Phi-4 smaller model |
| mistral:7b | Text | 8192 | Yes | Yes | Mistral AI's base model |
| llama2:7b | Text | 8192 | No | No | Meta's LLaMA 2 model |
| deepseek-r1:7b | Text | 8192 | No | No | DeepSeek AI's R1 model |
| sdxl-turbo | Image | - | No | No | Fast image generation model |

### 3.2 API Capabilities

The Lilypad provider supports the following capabilities through its OpenAI-compatible API:

- **Chat Completions**: Text generation with all text models
- **Function Calling**: Support for function definitions with compatible models
- **Tool Choice**: Support for tool_choice parameter with compatible models
- **Image Generation**: Creation of images with the sdxl-turbo model

## 4. Testing Approach

Testing the Lilypad integration follows our domain-based testing strategy:

### 4.1 Unit Testing

```typescript
// test/unit/ai/models/providers/lilypad-provider.test.ts
import { LilypadProvider } from '../../../../../src/ai/models/providers/lilypad-provider';
import { APIKeyManager } from '../../../../../src/config/api-key-manager';

describe('LilypadProvider', () => {
  let provider: LilypadProvider;
  let apiKeyManager: jest.Mocked<APIKeyManager>;
  
  beforeEach(() => {
    apiKeyManager = {
      getAPIKey: jest.fn(),
      addAPIKey: jest.fn(),
      markAPIKeyAsFailed: jest.fn()
    } as any;
    
    // Replace the singleton instance with our mock
    jest.spyOn(APIKeyManager, 'getInstance').mockReturnValue(apiKeyManager);
    
    provider = new LilypadProvider();
  });
  
  test('returns correct available models', () => {
    const models = provider.getAvailableModels();
    
    expect(models).toContain('llama3.1:8b');
    expect(models).toContain('sdxl-turbo');
    expect(models.length).toBe(8); // Total number of supported models
  });
  
  test('creates text model correctly', () => {
    const model = provider.createModel('llama3.1:8b');
    
    expect(model.id).toBe('llama3.1:8b');
    expect(model.provider).toBe('lilypad');
    expect(model.name).toBe('Lilypad llama3.1:8b');
  });
  
  test('creates image model correctly', () => {
    const model = provider.createModel('sdxl-turbo');
    
    expect(model.id).toBe('sdxl-turbo');
    expect(model.provider).toBe('lilypad');
    expect(model.name).toBe('Lilypad sdxl-turbo');
  });
  
  test('throws error for invalid model', () => {
    expect(() => provider.createModel('invalid-model')).toThrow();
  });
  
  // Additional tests...
});
```

### 4.2 Integration Testing

```typescript
// test/integration/ai/lilypad-integration.test.ts
import { ModelRegistry } from '../../../src/ai/models/registry';
import { Agent } from '../../../src/ai/agent/agent';
import { APIKeyManager } from '../../../src/config/api-key-manager';

describe('Lilypad Integration', () => {
  beforeAll(() => {
    // Set up environment variable for testing
    process.env.LILYPAD_API_KEY = 'test-api-key';
  });
  
  afterAll(() => {
    // Clean up
    delete process.env.LILYPAD_API_KEY;
  });
  
  test('agent uses Lilypad model correctly', async () => {
    // Get Lilypad model from registry
    const modelRegistry = ModelRegistry.getInstance();
    const lilypadProvider = modelRegistry.getProvider('lilypad');
    const model = lilypadProvider!.createModel('llama3.1:8b');
    
    // Create agent with Lilypad model
    const agent = new Agent({
      model,
      tools: []
    });
    
    // Mock model.generate to avoid actual API calls
    jest.spyOn(model, 'generate').mockResolvedValue({
      content: 'Test response from Lilypad model'
    });
    
    // Process a message
    const response = await agent.processMessage('Hello');
    
    // Verify
    expect(response).toBe('Test response from Lilypad model');
    expect(model.generate).toHaveBeenCalledWith(expect.objectContaining({
      messages: expect.arrayContaining([
        expect.objectContaining({
          role: 'user',
          content: 'Hello'
        })
      ])
    }));
  });
  
  // Additional tests...
});
```

## 5. User Guide

### 5.1 Setting Up Lilypad

1. **Obtain an API Key**
   - Visit [Anura API Dashboard](https://anura.lilypad.tech/)
   - Sign up for an account or log in
   - Navigate to the API Keys section
   - Generate a new API key

2. **Configure SwissKnife**
   - Use the `/model` command to select a provider
   - Choose "Lilypad" from the provider list
   - Enter your API key when prompted
   - Select a model from the available models

3. **Alternative Configuration Methods**
   - Set the `LILYPAD_API_KEY` or `ANURA_API_KEY` environment variable
   - Use the configuration command:
     ```
     /config set ai.lilypad.apiKey your-api-key-here
     ```

### 5.2 Using Lilypad Models

#### Text Generation

```
/agent chat --model=lilypad/llama3.1:8b
```

#### Function Calling

```
/agent function --model=lilypad/llama3.1:8b --function=weather --args='{"location": "New York"}'
```

#### Image Generation

```
/image create --model=lilypad/sdxl-turbo --prompt="A beautiful sunset over mountains"
```

### 5.3 Troubleshooting

#### API Key Issues
- Verify your API key is correct
- Check that your API key has not expired
- Ensure you have sufficient credit on your Lilypad account

#### Model Availability
- If a model appears unavailable, check the Anura dashboard for status updates
- Some models may be temporarily offline for maintenance

#### Rate Limiting
- If you receive rate limit errors, reduce request frequency
- Consider using multiple API keys with rotation

## 6. Future Enhancements

### 6.1 Planned Improvements

- **Web Search API Integration**: Enhance Lilypad models with web search capabilities
- **Direct Text Inference API**: Support for the direct text inference API in addition to chat
- **Job Monitoring Interface**: Ability to monitor long-running jobs
- **Advanced Configuration Options**: More granular control over model parameters

### 6.2 Technical Roadmap

- Enhance caching for Lilypad responses to improve performance
- Add support for streaming responses
- Implement batched requests for improved throughput
- Create specialized tools optimized for different Lilypad models

## 7. References

- [Lilypad API Documentation](https://docs.lilypad.tech/lilypad/developer-resources/inference-api)
- [Anura API Dashboard](https://anura.lilypad.tech/)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference) (for compatibility reference)
- [SwissKnife Unified Architecture](./UNIFIED_ARCHITECTURE.md)
- [SwissKnife Integration Plan](./unified_integration_plan.md)