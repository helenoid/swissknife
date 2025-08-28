// Shared AI provider abstraction layer
import { AIProviderConfig, AIModel } from '../types/index.js'
import { AI_PROVIDERS, MODEL_CATEGORIES } from '../constants/index.js'

export interface AIInferenceRequest {
  model: string
  prompt: string
  temperature?: number
  maxTokens?: number
  stream?: boolean
  systemPrompt?: string
}

export interface AIInferenceResponse {
  response: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  model: string
  finishReason?: 'stop' | 'length' | 'content_filter'
}

export abstract class BaseAIProvider {
  protected config: AIProviderConfig
  
  constructor(config: AIProviderConfig) {
    this.config = config
  }

  abstract getName(): string
  abstract getModels(): Promise<AIModel[]>
  abstract inference(request: AIInferenceRequest): Promise<AIInferenceResponse>
  abstract streamInference(request: AIInferenceRequest): AsyncGenerator<string, void, unknown>
  abstract isAvailable(): Promise<boolean>

  protected validateRequest(request: AIInferenceRequest): void {
    if (!request.prompt) {
      throw new Error('Prompt is required')
    }
    if (!request.model) {
      throw new Error('Model is required')
    }
    if (request.temperature !== undefined && (request.temperature < 0 || request.temperature > 2)) {
      throw new Error('Temperature must be between 0 and 2')
    }
    if (request.maxTokens !== undefined && request.maxTokens <= 0) {
      throw new Error('maxTokens must be positive')
    }
  }
}

// OpenAI Provider
export class OpenAIProvider extends BaseAIProvider {
  getName(): string {
    return AI_PROVIDERS.OPENAI
  }

  async getModels(): Promise<AIModel[]> {
    // Mock OpenAI models - in real implementation, fetch from API
    return [
      {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: AI_PROVIDERS.OPENAI,
        type: MODEL_CATEGORIES.TEXT,
        size: '1.76T',
        parameters: 1760000000000,
        contextLength: 8192,
        available: true,
        local: false
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        provider: AI_PROVIDERS.OPENAI,
        type: MODEL_CATEGORIES.TEXT,
        size: '175B',
        parameters: 175000000000,
        contextLength: 4096,
        available: true,
        local: false
      }
    ]
  }

  async inference(request: AIInferenceRequest): Promise<AIInferenceResponse> {
    this.validateRequest(request)
    
    // Mock implementation - replace with actual OpenAI API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return {
      response: `Mock response from ${request.model} for prompt: "${request.prompt.slice(0, 50)}..."`,
      usage: {
        promptTokens: Math.floor(request.prompt.length / 4),
        completionTokens: 100,
        totalTokens: Math.floor(request.prompt.length / 4) + 100
      },
      model: request.model,
      finishReason: 'stop'
    }
  }

  async *streamInference(request: AIInferenceRequest): AsyncGenerator<string, void, unknown> {
    this.validateRequest(request)
    
    const words = ['Mock', 'streaming', 'response', 'from', request.model]
    for (const word of words) {
      await new Promise(resolve => setTimeout(resolve, 200))
      yield word + ' '
    }
  }

  async isAvailable(): Promise<boolean> {
    return !!this.config.apiKey
  }
}

// Ollama Provider (local)
export class OllamaProvider extends BaseAIProvider {
  getName(): string {
    return AI_PROVIDERS.OLLAMA
  }

  async getModels(): Promise<AIModel[]> {
    // Mock Ollama models
    return [
      {
        id: 'llama2',
        name: 'Llama 2 7B',
        provider: AI_PROVIDERS.OLLAMA,
        type: MODEL_CATEGORIES.TEXT,
        size: '7B',
        parameters: 7000000000,
        contextLength: 4096,
        available: true,
        local: true
      },
      {
        id: 'codellama',
        name: 'CodeLlama 7B',
        provider: AI_PROVIDERS.OLLAMA,
        type: MODEL_CATEGORIES.CODE,
        size: '7B',
        parameters: 7000000000,
        contextLength: 4096,
        available: true,
        local: true
      }
    ]
  }

  async inference(request: AIInferenceRequest): Promise<AIInferenceResponse> {
    this.validateRequest(request)
    
    // Mock Ollama API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    return {
      response: `Local Ollama response from ${request.model}`,
      model: request.model,
      finishReason: 'stop'
    }
  }

  async *streamInference(request: AIInferenceRequest): AsyncGenerator<string, void, unknown> {
    this.validateRequest(request)
    
    const response = `Local streaming response from ${request.model}`
    for (const char of response) {
      await new Promise(resolve => setTimeout(resolve, 50))
      yield char
    }
  }

  async isAvailable(): Promise<boolean> {
    // Check if Ollama is running locally
    try {
      // Mock availability check
      return true
    } catch {
      return false
    }
  }
}

// AI Provider Manager
export class AIProviderManager {
  private providers: Map<string, BaseAIProvider> = new Map()
  private defaultProvider?: string

  addProvider(provider: BaseAIProvider): void {
    this.providers.set(provider.getName(), provider)
  }

  removeProvider(name: string): void {
    this.providers.delete(name)
  }

  getProvider(name: string): BaseAIProvider | undefined {
    return this.providers.get(name)
  }

  getProviders(): BaseAIProvider[] {
    return Array.from(this.providers.values())
  }

  setDefaultProvider(name: string): void {
    if (this.providers.has(name)) {
      this.defaultProvider = name
    } else {
      throw new Error(`Provider ${name} not found`)
    }
  }

  getDefaultProvider(): BaseAIProvider | undefined {
    if (this.defaultProvider) {
      return this.providers.get(this.defaultProvider)
    }
    // Return first available provider
    return this.providers.values().next().value
  }

  async getAllModels(): Promise<AIModel[]> {
    const allModels: AIModel[] = []
    
    for (const provider of this.providers.values()) {
      try {
        const models = await provider.getModels()
        allModels.push(...models)
      } catch (error) {
        console.warn(`Failed to get models from ${provider.getName()}:`, error)
      }
    }
    
    return allModels
  }

  async getAvailableProviders(): Promise<BaseAIProvider[]> {
    const available: BaseAIProvider[] = []
    
    for (const provider of this.providers.values()) {
      try {
        if (await provider.isAvailable()) {
          available.push(provider)
        }
      } catch (error) {
        console.warn(`Failed to check availability of ${provider.getName()}:`, error)
      }
    }
    
    return available
  }

  async inference(request: AIInferenceRequest, providerName?: string): Promise<AIInferenceResponse> {
    const provider = providerName 
      ? this.getProvider(providerName)
      : this.getDefaultProvider()
    
    if (!provider) {
      throw new Error(`No provider available for inference`)
    }

    return await provider.inference(request)
  }

  async *streamInference(request: AIInferenceRequest, providerName?: string): AsyncGenerator<string, void, unknown> {
    const provider = providerName 
      ? this.getProvider(providerName)
      : this.getDefaultProvider()
    
    if (!provider) {
      throw new Error(`No provider available for streaming inference`)
    }

    for await (const chunk of provider.streamInference(request)) {
      yield chunk
    }
  }
}

// Global AI provider manager instance
export const aiManager = new AIProviderManager()

// Initialize default providers
export function initializeDefaultProviders(configs: Record<string, AIProviderConfig>): void {
  // Add OpenAI provider if configured
  if (configs.openai) {
    aiManager.addProvider(new OpenAIProvider(configs.openai))
  }
  
  // Add Ollama provider if configured
  if (configs.ollama) {
    aiManager.addProvider(new OllamaProvider(configs.ollama))
  }
  
  // Set default provider
  const availableProviders = Object.keys(configs)
  if (availableProviders.length > 0) {
    aiManager.setDefaultProvider(availableProviders[0])
  }
}