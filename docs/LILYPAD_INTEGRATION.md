# Lilypad Integration in SwissKnife Unified Architecture

This document outlines how Lilypad is integrated as a model provider within the domain-driven SwissKnife unified architecture.

## 1. Integration Overview

In the unified SwissKnife architecture, Lilypad's Anura API is integrated as a model provider within the AI domain, following our domain-driven organization pattern. This integration leverages Lilypad's OpenAI-compatible interface to seamlessly provide access to a variety of open-source models.

### 1.1 Lilypad in the Domain Architecture

```mermaid
graph TD
    subgraph SwissKnife Unified Codebase
        AI_Domain[AI Domain (`src/ai/`)]
        CLI_Domain[CLI Domain (`src/cli/`)]
        Config_Domain[Config/Auth Domain (`src/config/`, `src/auth/`)]
        Other_Domains[...]

        subgraph AI_Domain
            ModelRegistry --> ModelProviderInterface(ModelProvider Interface);
            Agent --> ModelRegistry;
            ModelProviderInterface -- Implemented By --> LilypadProvider(`providers/lilypad.ts`);
            LilypadProvider --> Config_Domain; # For API Key
        end

        CLI_Domain --> ModelRegistry; # e.g., for `model list`
        CLI_Domain --> Agent; # e.g., for `agent chat`
        CLI_Domain --> Config_Domain; # e.g., for `config set`
    end

    style LilypadProvider fill:#ccf,stroke:#333
```
*   The `LilypadProvider` resides within the AI domain.
*   It implements the standard `ModelProvider` interface.
*   It's registered with the `ModelRegistry`.
*   It retrieves API keys via the `ApiKeyManager` (in the Auth/Config domain).
*   The CLI interacts with it indirectly via the `ModelRegistry` or `Agent`.

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
// src/ai/models/providers/lilypad.ts (Example Path)
import type { ModelProvider, Model, ModelResponse, GenerateOptions, AgentMessage } from '@/types/ai.js'; // Use correct path/alias
import { ConfigManager } from '@/config/manager.js'; // Use correct path/alias
import { ApiKeyManager } from '@/auth/api-key-manager.js'; // Use correct path/alias
import axios from 'axios'; // Or use native fetch

export class LilypadProvider implements ModelProvider {
  readonly id = 'lilypad'; // Use readonly for constants
  readonly name = 'Lilypad';
  // Base URL for the Anura API (OpenAI compatible endpoint)
  private baseUrl: string;

  private configManager: ConfigManager;
  private apiKeyManager: ApiKeyManager; // Use updated class name

  constructor() {
    this.configManager = ConfigManager.getInstance();
    this.apiKeyManager = ApiKeyManager.getInstance();
    // Allow overriding base URL via config
    this.baseUrl = this.configManager.get<string>('ai.providers.lilypad.baseUrl', 'https://api.lilypad.tech/openai/v1'); // Use official endpoint? Check Lilypad docs.
  }

  // Define models supported by this provider implementation
  // Could potentially fetch this dynamically if Lilypad API supports it
  async getModels(): Promise<ModelInfo[]> { // Implement getModels instead of getAvailableModels
    const models = [
      'llama-3.1-8b-instruct', // Use official IDs from Lilypad docs
      'qwen-2.5-7b-instruct',
      // 'qwen2.5-coder:7b', // Check official ID
      'phi-3-medium-128k-instruct', // Example, check official ID
      'mistral-7b-instruct-v0.3', // Example, check official ID
      'llama-2-7b-chat-hf', // Example, check official ID
      // 'deepseek-r1:7b', // Check official ID
      'stable-diffusion-xl-1024-v1-0' // Example, check official ID for SDXL
    ];
    // Add metadata like context window, cost (if known)
    return models.map(id => ({
        id: `lilypad/${id}`, // Prefix with provider ID
        name: `Lilypad ${id}`,
        provider: this.id,
        capabilities: { /* Define capabilities based on model type */
            chat: !id.includes('stable-diffusion'),
            completion: !id.includes('stable-diffusion'),
            vision: id.includes('stable-diffusion'), // Example capability
            embedding: false, functionCalling: true, streaming: false // Update based on actual support
        },
        contextWindow: 8192, // Example, adjust per model
        inputCostPer1000Tokens: 0, // Add cost info if available
        outputCostPer1000Tokens: 0,
        available: true // Assume available if provider is configured
    }));
  }

  async getModel(modelId: string): Promise<ModelInfo | undefined> {
      const models = await this.getModels();
      return models.find(m => m.id === modelId);
  }


  createModel(modelIdWithPrefix: string): Model {
    // Remove provider prefix if present
    const modelId = modelIdWithPrefix.startsWith(`${this.id}/`)
        ? modelIdWithPrefix.substring(this.id.length + 1)
        : modelIdWithPrefix;

    // Validate model ID against dynamically fetched or static list
    // (Using static list here for simplicity)
    const staticAvailableModels = [
      'llama-3.1-8b-instruct', 'qwen-2.5-7b-instruct', /* ... other IDs ... */ 'stable-diffusion-xl-1024-v1-0'
    ];
    if (!staticAvailableModels.includes(modelId)) {
      throw new Error(`Model '${modelId}' not available in Lilypad provider`);
    }
    // Return model implementation conforming to the Model interface
    return {
      id: modelIdWithPrefix, // Use prefixed ID externally
      provider: this.id,
      name: `Lilypad ${modelId}`,

      generate: async (options: GenerateOptions): Promise<ModelResponse> => {
        // Get API key using the correct manager method
        const apiKey = this.apiKeyManager.getBestApiKey('lilypad', { rotate: true });
        if (!apiKey) throw new Error('No Lilypad API key available');

        try {
          // Determine endpoint based on model type
          const isImageModel = modelId.includes('stable-diffusion'); // Example check
          const endpoint = isImageModel ? '/images/generations' : '/chat/completions';
          const url = `${this.baseUrl}${endpoint}`;

          // Prepare payload (adjust based on actual Lilypad API requirements)
          const payload = isImageModel
            ? this._prepareImagePayload(modelId, options)
            : this._prepareChatPayload(modelId, options);

          // Make API request using fetch or axios
          const response = await axios.post(url, payload, {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: this.configManager.get<number>('ai.requestTimeout', 60000) // Example timeout
          });

          // Process response
          return isImageModel
            ? this._processImageResponse(response.data)
            : this._processChatResponse(response.data);

        } catch (error) {
          // Handle API errors, including marking key as failed
          if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 429)) {
            await this.apiKeyManager.markApiKeyAsFailed('lilypad', apiKey); // Use await
          } else if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
            // Handle timeouts
            await this.apiKeyManager.markApiKeyAsFailed('lilypad', apiKey);
          }
          // Re-throw a standardized error
          throw new Error(`Lilypad API request failed: ${error.message}`);
        }
      }
      // Add generateStream and countTokens implementations if supported
    };
  }

  // Helper to prepare OpenAI-compatible chat payload
  private _prepareChatPayload(modelId: string, options: GenerateOptions): any {
      return {
          model: modelId, // Use the Lilypad-specific model ID
          messages: options.messages,
          max_tokens: options.maxTokens,
          temperature: options.temperature,
          // Map tools if function calling is supported/used
          tools: options.tools?.map(tool => ({
              type: 'function',
              function: {
                  name: tool.name,
                  description: tool.description,
                  parameters: tool.parameters // Assuming parameters are JSON schema
              }
          })),
          tool_choice: options.toolChoice // Pass through tool_choice
      };
  }

  // Helper to prepare image generation payload
  private _prepareImagePayload(modelId: string, options: GenerateOptions): any {
      // Extract prompt from messages or options
      const prompt = options.messages?.[options.messages.length - 1]?.content || 'Default prompt';
      return {
          model: modelId,
          prompt: prompt,
          n: options.n || 1, // Number of images
          size: options.size || '1024x1024' // Image size
      };
  }

  // Helper to process chat response
  private _processChatResponse(data: any): ModelResponse {
      const message = data.choices[0].message;
      return {
          id: data.id,
          content: message.content || '',
          toolCalls: message.tool_calls?.map((tc: any) => ({
              id: tc.id,
              type: tc.type, // Should be 'function'
              function: {
                  name: tc.function.name,
                  arguments: tc.function.arguments // Arguments are likely JSON strings
              }
          })),
          usage: { // Map usage data if provided by Lilypad
              promptTokens: data.usage?.prompt_tokens || 0,
              completionTokens: data.usage?.completion_tokens || 0,
              totalTokens: data.usage?.total_tokens || 0,
          },
          cost: 0 // Calculate cost if pricing info is available
      };
  }

   // Helper to process image response
   private _processImageResponse(data: any): ModelResponse {
       return {
           id: data.id || `img-${Date.now()}`, // Generate ID if missing
           content: null, // No text content for image models
           images: data.data?.map((img: any) => img.url), // Extract image URLs
           usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 }, // Usage might not apply
           cost: 0 // Calculate cost if applicable
       };
   }

  // Implement countTokens if Lilypad provides an endpoint or use a local tokenizer
  async countTokens(modelId: string, messages: AgentMessage[]): Promise<number> {
      // Use tiktoken or similar, matching the model's tokenizer if possible
      console.warn("LilypadProvider.countTokens not fully implemented, returning estimate.");
      const text = messages.map(m => m.content).join('\n');
      return text.length / 4; // Rough estimate
  }

}
```

### 2.2 Model Registry Integration

The LilypadProvider is registered with the ModelRegistry during application initialization:

```typescript
// src/ai/models/registry.ts (Conceptual - showing registration)
import type { ModelProvider, ModelInfo } from '@/types/ai.js'; // Use correct path/alias
import { OpenAIProvider } from './providers/openai.js'; // Use correct path/alias
import { AnthropicProvider } from './providers/anthropic.js'; // Use correct path/alias
import { LilypadProvider } from './providers/lilypad.js'; // Use correct path/alias
import { ConfigManager } from '@/config/manager.js'; // Use correct path/alias

export class ModelRegistry {
  private static instance: ModelRegistry;
  private providers: Map<string, ModelProvider> = new Map();
  private models: Map<string, ModelInfo> = new Map(); // Cache for model info
  private configManager: ConfigManager;
  
  private constructor() {
    this.configManager = ConfigManager.getInstance();
    // Initialization logic might fetch models from providers
    this._initializeRegistry();
  }

  // ... (getInstance method) ...

  private async _initializeRegistry(): Promise<void> {
      // Instantiate and register providers based on configuration
      const providersToRegister = [
          new OpenAIProvider(),
          new AnthropicProvider(),
          new LilypadProvider(),
          // Add other providers...
      ];

      for (const provider of providersToRegister) {
          // Check config if provider is enabled / has keys before registering
          // Example: if (this.configManager.get(`ai.providers.${provider.id}.enabled`, true)) {
          this.registerProvider(provider);
          // }
      }
      // Optionally pre-fetch model info
      await this.fetchAllModels();
  }
  
  static getInstance(): ModelRegistry {
    if (!ModelRegistry.instance) {
      ModelRegistry.instance = new ModelRegistry();
    }
    return ModelRegistry.instance;
  }
  
  registerProvider(provider: ModelProvider): void {
    console.log(`Registering provider: ${provider.name} (${provider.id})`);
    this.providers.set(provider.id, provider);
    // Optionally fetch models immediately upon registration
    // provider.getModels().then(models => models.forEach(m => this.registerModel(m)));
  }

  // Fetches and registers models from all providers
  async fetchAllModels(): Promise<void> {
      this.models.clear(); // Clear existing cache
      const allModelsPromises = Array.from(this.providers.values()).map(p => p.getModels());
      const results = await Promise.allSettled(allModelsPromises);
      results.forEach((result, index) => {
          const providerId = Array.from(this.providers.keys())[index];
          if (result.status === 'fulfilled') {
              result.value.forEach(modelInfo => {
                  // Ensure model ID is prefixed with provider ID in the registry
                  const registryId = modelInfo.id.startsWith(`${providerId}/`) ? modelInfo.id : `${providerId}/${modelInfo.id}`;
                  this.models.set(registryId, { ...modelInfo, id: registryId, provider: providerId });
              });
          } else {
              console.error(`Failed to fetch models for provider ${providerId}:`, result.reason);
          }
      });
      console.log(`Model registry initialized with ${this.models.size} models.`);
  }

  // Gets model info from cache/registry
  getModel(registryId: string): ModelInfo | undefined {
      return this.models.get(registryId);
  }

  // Gets all models, optionally filtering
  getAvailableModels(filter?: { provider?: string; capability?: keyof ModelCapabilities }): ModelInfo[] {
      let available = Array.from(this.models.values());
      if (filter?.provider) {
          available = available.filter(m => m.provider === filter.provider);
      }
      if (filter?.capability) {
          available = available.filter(m => m.capabilities?.[filter.capability!]);
      }
      return available;
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
// src/auth/api-key-manager.ts (Conceptual)
import { ConfigManager } from '@/config/manager.js'; // Use correct path/alias

export class ApiKeyManager { // Use updated class name
  private static instance: ApiKeyManager;
  private configManager: ConfigManager;
  // ... (rest of implementation from API_KEY_MANAGEMENT.md) ...
  
  private constructor() {
    this.configManager = ConfigManager.getInstance();
  }
  
  static getInstance(): APIKeyManager {
    if (!APIKeyManager.instance) {
      APIKeyManager.instance = new APIKeyManager();
    }
    return APIKeyManager.instance;
  }
  
  getBestApiKey(provider: string, options: { rotate?: boolean; allowFailed?: boolean; preferStored?: boolean } = {}): string | null {
    // Special handling for Lilypad environment variables
    if (provider === 'lilypad' && !options.preferStored) {
      const lilypadKey = process.env.LILYPAD_API_KEY;
      if (lilypadKey) {
        this._addEnvKeyToConfigIfNotPresent(provider, lilypadKey);
        return lilypadKey;
      }
      const anuraKey = process.env.ANURA_API_KEY; // Official name
      if (anuraKey) {
        this._addEnvKeyToConfigIfNotPresent(provider, anuraKey);
        return anuraKey;
      }
    }

    // Fallback to generic environment variable check
    const envVarName = `${provider.toUpperCase()}_API_KEY`;
    const envKey = process.env[envVarName];
    if (envKey && !options.preferStored) {
       this._addEnvKeyToConfigIfNotPresent(provider, envKey);
       return envKey;
    }

    // Continue with stored key logic...
    // ... (implementation as shown in API_KEY_MANAGEMENT.md) ...
    return null; // Placeholder
  }

  // ... (rest of ApiKeyManager implementation) ...
}
```

### 2.4 Command Implementation

Commands for Lilypad model selection and configuration are implemented in the CLI domain:

```typescript
// src/commands/model.ts (Conceptual - showing Lilypad interaction)
import type { Command, CommandContext } from '@/types/cli.js'; // Use correct path/alias
import { ModelRegistry } from '@/ai/models/registry.js'; // Use correct path/alias
import { ApiKeyManager } from '@/auth/api-key-manager.js'; // Use correct path/alias

export const listModelsCommand: Command = {
    name: 'list',
    description: 'List available AI models',
    options: [
        { name: 'provider', type: 'string', description: 'Filter by provider ID' },
        // ... other options
    ],
    async handler(context: CommandContext) {
        const modelRegistry = context.getService(ModelRegistry); // Get service
        const models = modelRegistry.getAvailableModels({ provider: context.args.provider });

        if (context.args.provider === 'lilypad' && models.length === 0) {
             context.formatter.warn("No Lilypad models found. Ensure the provider is enabled and API key might be needed.");
             // Optionally prompt to add key here
             const apiKeyManager = context.getService(ApiKeyManager);
             const key = apiKeyManager.getBestApiKey('lilypad');
             if (!key) {
                 context.formatter.info("No Lilypad API key found in config or environment (LILYPAD_API_KEY/ANURA_API_KEY).");
                 // Add prompt logic if desired
             }
        } else if (models.length === 0) {
             context.formatter.info("No models found matching the criteria.");
        } else {
             context.formatter.table(models, [
                 { key: 'id', label: 'ID' },
                 { key: 'name', label: 'Name' },
                 { key: 'provider', label: 'Provider' }
             ]);
        }
        return 0;
    }
};

// ... other model commands (set-default, download, etc.) ...
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
// test/unit/ai/models/providers/lilypad.test.ts (Conceptual)
import { LilypadProvider } from '@/ai/models/providers/lilypad.js'; // Use correct path/alias
import { ApiKeyManager } from '@/auth/api-key-manager.js'; // Use correct path/alias
import axios from 'axios';

// Mock dependencies
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
jest.mock('@/auth/api-key-manager.js'); // Mock ApiKeyManager

describe('LilypadProvider', () => {
  let provider: LilypadProvider;
  let mockApiKeyManager: jest.Mocked<ApiKeyManager>;

  beforeEach(() => {
    // Setup mock ApiKeyManager before each test
    mockApiKeyManager = {
      getBestApiKey: jest.fn(),
      markApiKeyAsFailed: jest.fn(),
      // ... other methods if needed ...
    } as any;
    ApiKeyManager.getInstance = jest.fn().mockReturnValue(mockApiKeyManager); // Mock singleton getter

    provider = new LilypadProvider();
    mockedAxios.post.mockClear(); // Clear axios mocks
  });

  it('should fetch and return models', async () => {
      // Assuming getModels is implemented to fetch or uses a static list
      const models = await provider.getModels();
      expect(models.length).toBeGreaterThan(0);
      expect(models[0].id).toMatch(/^lilypad\//);
      expect(models[0].provider).toBe('lilypad');
  });

  it('should prepare chat payload correctly', async () => {
      mockApiKeyManager.getBestApiKey.mockReturnValue('test-key');
      mockedAxios.post.mockResolvedValue({ data: { id: '1', choices: [{ message: { content: 'response' } }], usage: {} } }); // Mock successful response

      const model = provider.createModel('llama-3.1-8b-instruct'); // Use valid ID
      await model.generate({ messages: [{ role: 'user', content: 'Hello' }] });

      expect(mockedAxios.post).toHaveBeenCalledWith(
          expect.stringContaining('/chat/completions'), // Check endpoint
          expect.objectContaining({ // Check payload
              model: 'llama-3.1-8b-instruct',
              messages: expect.arrayContaining([expect.objectContaining({ role: 'user', content: 'Hello' })]),
          }),
          expect.objectContaining({ // Check headers
              headers: expect.objectContaining({ 'Authorization': 'Bearer test-key' })
          })
      );
  });

   it('should prepare image payload correctly', async () => {
      mockApiKeyManager.getBestApiKey.mockReturnValue('test-key');
      mockedAxios.post.mockResolvedValue({ data: { id: '1', data: [{ url: 'image-url' }] } });

      const model = provider.createModel('stable-diffusion-xl-1024-v1-0'); // Use valid ID
      await model.generate({ messages: [{ role: 'user', content: 'A cat' }] });

      expect(mockedAxios.post).toHaveBeenCalledWith(
          expect.stringContaining('/images/generations'), // Check endpoint
          expect.objectContaining({ model: 'stable-diffusion-xl-1024-v1-0', prompt: 'A cat' }),
          expect.anything() // Headers
      );
  });

  it('should mark key as failed on 401 error', async () => {
      mockApiKeyManager.getBestApiKey.mockReturnValue('failed-key');
      mockedAxios.post.mockRejectedValue({ response: { status: 401 } }); // Simulate 401

      const model = provider.createModel('llama-3.1-8b-instruct');
      await expect(model.generate({ messages: [{ role: 'user', content: 'Hello' }] }))
          .rejects.toThrow(/Lilypad API request failed/);

      expect(mockApiKeyManager.markApiKeyAsFailed).toHaveBeenCalledWith('lilypad', 'failed-key');
  });

  // Add more tests for different scenarios, options, error handling etc.
});
```

### 4.2 Integration Testing

```typescript
// test/integration/ai/lilypad.test.ts (Conceptual)
import { ModelRegistry } from '@/ai/models/registry.js'; // Use correct path/alias
import { AgentService } from '@/ai/agent/service.js'; // Use correct path/alias
import { ApiKeyManager } from '@/auth/api-key-manager.js'; // Use correct path/alias
// Assume a mock HTTP server (like msw or nock) is set up for integration tests

describe('Lilypad Integration', () => {
  let agentService: AgentService;
  let modelRegistry: ModelRegistry;

  beforeAll(() => {
    // Ensure ApiKeyManager provides a test key for 'lilypad'
    // Setup mock HTTP server to intercept calls to Lilypad API
    // server.use(http.post('https://api.lilypad.tech/openai/v1/chat/completions', () => { ... return mock response ... }));
  });

  beforeEach(() => {
      // Initialize services for each test
      modelRegistry = ModelRegistry.getInstance(); // Ensure registry is fresh or reset
      // Ensure LilypadProvider is registered
      agentService = new AgentService({ /* ... options ... */ });
  });


  it('should list Lilypad models via ModelRegistry', async () => {
      const models = modelRegistry.getAvailableModels({ provider: 'lilypad' });
      expect(models.length).toBeGreaterThan(0);
      expect(models.some(m => m.id === 'lilypad/llama-3.1-8b-instruct')).toBe(true);
  });

  it('should execute a prompt using a Lilypad model via AgentService', async () => {
      // Configure agentService to use a Lilypad model or pass via options
      const response = await agentService.processMessage("Hello from integration test", { modelId: 'lilypad/llama-3.1-8b-instruct' });

      expect(response.content).toContain("Mock Lilypad Response"); // Check against mock server response
  });

  // Add tests for image generation, function calling, error handling etc.
});
```

## 5. User Guide

### 5.1 Setting Up Lilypad

1.  **Obtain an API Key**:
    *   Go to the [Anura API Dashboard](https://anura.lilypad.tech/).
    *   Sign up or log in.
    *   Generate an API key from the dashboard.

2.  **Configure SwissKnife**: Choose **one** method:
    *   **Environment Variable (Recommended)**: Set either `LILYPAD_API_KEY` or `ANURA_API_KEY` in your environment:
        ```bash
        export LILYPAD_API_KEY="your-key-here"
        # OR
        export ANURA_API_KEY="your-key-here"
        ```
    *   **Configuration Command**: Store the key securely (encrypted) in the SwissKnife config:
        ```bash
        swissknife apikey add lilypad "your-key-here"
        # Or using the general config command (less secure if not encrypted by default):
        # swissknife config set apiKeys.lilypad "your-key-here" # Check actual config path
        ```

### 5.2 Using Lilypad Models

#### Text Generation

Use `agent chat` or `agent execute` with a Lilypad text model ID:
```bash
swissknife agent chat --model lilypad/llama-3.1-8b-instruct
swissknife agent execute "Explain IPFS" --model lilypad/mistral-7b-instruct-v0.3
```

#### Function Calling / Tool Use

If the chosen Lilypad model supports OpenAI-compatible tool/function calling, it can be used with the agent like any other compatible model. Define your tools and let the agent decide when to call them.

#### Image Generation

Use the appropriate command (if available, e.g., `image generate`) with the Lilypad image model ID:
```bash
# Conceptual command
swissknife image generate "Cyberpunk city rain" --model lilypad/stable-diffusion-xl-1024-v1-0
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
- [SwissKnife Developer Guide](./DEVELOPER_GUIDE.md)
