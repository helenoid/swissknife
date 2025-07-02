/**
 * Browser AI Adapter
 * 
 * Adapts SwissKnife AI services for browser environments
 * with fallbacks for server-side functionality
 */

export interface BrowserAIOptions {
  useWebWorkers?: boolean;
  apiEndpoint?: string;
  openaiApiKey?: string;
  claudeApiKey?: string;
  enableLocalModels?: boolean;
  maxConcurrentRequests?: number;
}

export interface AIResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata?: Record<string, any>;
}

export interface AIModelConfig {
  name: string;
  provider: 'openai' | 'anthropic' | 'local' | 'webworker';
  endpoint?: string;
  apiKey?: string;
  maxTokens?: number;
  temperature?: number;
}

export class BrowserAIAdapter {
  private options: BrowserAIOptions;
  private models: Map<string, AIModelConfig> = new Map();
  private webWorkers: Map<string, Worker> = new Map();
  private requestQueue: Array<{ 
    resolve: (value: AIResponse) => void; 
    reject: (reason: any) => void; 
    request: any 
  }> = [];
  private activeRequests = 0;

  constructor(options: BrowserAIOptions = {}) {
    this.options = {
      useWebWorkers: true,
      maxConcurrentRequests: 3,
      enableLocalModels: false,
      ...options
    };
    this.initializeModels();
  }

  private initializeModels(): void {
    // OpenAI models
    if (this.options.openaiApiKey) {
      this.models.set('gpt-4', {
        name: 'gpt-4',
        provider: 'openai',
        endpoint: 'https://api.openai.com/v1/chat/completions',
        apiKey: this.options.openaiApiKey,
        maxTokens: 4096,
        temperature: 0.7
      });

      this.models.set('gpt-3.5-turbo', {
        name: 'gpt-3.5-turbo',
        provider: 'openai',
        endpoint: 'https://api.openai.com/v1/chat/completions',
        apiKey: this.options.openaiApiKey,
        maxTokens: 4096,
        temperature: 0.7
      });
    }

    // Anthropic models
    if (this.options.claudeApiKey) {
      this.models.set('claude-3-opus', {
        name: 'claude-3-opus-20240229',
        provider: 'anthropic',
        endpoint: 'https://api.anthropic.com/v1/messages',
        apiKey: this.options.claudeApiKey,
        maxTokens: 4096,
        temperature: 0.7
      });

      this.models.set('claude-3-sonnet', {
        name: 'claude-3-sonnet-20240229',
        provider: 'anthropic',
        endpoint: 'https://api.anthropic.com/v1/messages',
        apiKey: this.options.claudeApiKey,
        maxTokens: 4096,
        temperature: 0.7
      });
    }

    // Local/WebWorker models (if enabled)
    if (this.options.enableLocalModels) {
      this.models.set('local-llama', {
        name: 'local-llama',
        provider: 'webworker',
        maxTokens: 2048,
        temperature: 0.7
      });
    }
  }

  async generateResponse(
    prompt: string,
    modelName: string = 'gpt-3.5-turbo',
    options: Partial<AIModelConfig> = {}
  ): Promise<AIResponse> {
    const model = this.models.get(modelName);
    if (!model) {
      throw new Error(`Model ${modelName} not available`);
    }

    const config = { ...model, ...options };

    // Queue request if we're at the limit
    if (this.activeRequests >= this.options.maxConcurrentRequests!) {
      return new Promise((resolve, reject) => {
        this.requestQueue.push({
          resolve,
          reject,
          request: { prompt, modelName, options }
        });
      });
    }

    return this.executeRequest(prompt, config);
  }

  private async executeRequest(prompt: string, config: AIModelConfig): Promise<AIResponse> {
    this.activeRequests++;

    try {
      let response: AIResponse;

      switch (config.provider) {
        case 'openai':
          response = await this.callOpenAI(prompt, config);
          break;
        case 'anthropic':
          response = await this.callAnthropic(prompt, config);
          break;
        case 'webworker':
          response = await this.callWebWorker(prompt, config);
          break;
        case 'local':
          response = await this.callLocalModel(prompt, config);
          break;
        default:
          throw new Error(`Provider ${config.provider} not supported`);
      }

      return response;
    } finally {
      this.activeRequests--;
      this.processQueue();
    }
  }

  private async callOpenAI(prompt: string, config: AIModelConfig): Promise<AIResponse> {
    const response = await fetch(config.endpoint!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.name,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: config.maxTokens,
        temperature: config.temperature
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      model: config.name,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens
      }
    };
  }

  private async callAnthropic(prompt: string, config: AIModelConfig): Promise<AIResponse> {
    const response = await fetch(config.endpoint!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: config.name,
        max_tokens: config.maxTokens,
        messages: [{ role: 'user', content: prompt }],
        temperature: config.temperature
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.content[0].text,
      model: config.name,
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens
      }
    };
  }

  private async callWebWorker(prompt: string, config: AIModelConfig): Promise<AIResponse> {
    // Create or get web worker for this model
    let worker = this.webWorkers.get(config.name);
    
    if (!worker) {
      // Create web worker for local model inference
      const workerBlob = new Blob([`
        // Web Worker for local AI model inference
        self.onmessage = function(e) {
          const { prompt, config } = e.data;
          
          // Simulate local model processing
          // In a real implementation, this would load and run a WebAssembly model
          setTimeout(() => {
            self.postMessage({
              content: "This is a simulated response from a local model: " + prompt.substring(0, 100) + "...",
              model: config.name,
              usage: {
                promptTokens: Math.floor(prompt.length / 4),
                completionTokens: 50,
                totalTokens: Math.floor(prompt.length / 4) + 50
              }
            });
          }, 1000 + Math.random() * 2000);
        };
      `], { type: 'application/javascript' });
      
      worker = new Worker(URL.createObjectURL(workerBlob));
      this.webWorkers.set(config.name, worker);
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('WebWorker timeout'));
      }, 30000);

      worker!.onmessage = (e) => {
        clearTimeout(timeout);
        resolve(e.data);
      };

      worker!.onerror = (error) => {
        clearTimeout(timeout);
        reject(error);
      };

      worker!.postMessage({ prompt, config });
    });
  }

  private async callLocalModel(prompt: string, config: AIModelConfig): Promise<AIResponse> {
    // Fallback for local models without web workers
    // This would typically use WebAssembly or WebGL for model inference
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing

    return {
      content: `Local model response to: ${prompt.substring(0, 50)}...`,
      model: config.name,
      usage: {
        promptTokens: Math.floor(prompt.length / 4),
        completionTokens: 25,
        totalTokens: Math.floor(prompt.length / 4) + 25
      }
    };
  }

  private processQueue(): void {
    if (this.requestQueue.length > 0 && this.activeRequests < this.options.maxConcurrentRequests!) {
      const { resolve, reject, request } = this.requestQueue.shift()!;
      
      this.generateResponse(request.prompt, request.modelName, request.options)
        .then(resolve)
        .catch(reject);
    }
  }

  async streamResponse(
    prompt: string,
    modelName: string = 'gpt-3.5-turbo',
    onChunk: (chunk: string) => void
  ): Promise<void> {
    const model = this.models.get(modelName);
    if (!model) {
      throw new Error(`Model ${modelName} not available`);
    }

    if (model.provider === 'openai') {
      await this.streamOpenAI(prompt, model, onChunk);
    } else if (model.provider === 'anthropic') {
      await this.streamAnthropic(prompt, model, onChunk);
    } else {
      // Fallback to non-streaming for other providers
      const response = await this.generateResponse(prompt, modelName);
      onChunk(response.content);
    }
  }

  private async streamOpenAI(prompt: string, config: AIModelConfig, onChunk: (chunk: string) => void): Promise<void> {
    const response = await fetch(config.endpoint!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.name,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body reader available');
    }

    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content;
            if (content) {
              onChunk(content);
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  private async streamAnthropic(prompt: string, config: AIModelConfig, onChunk: (chunk: string) => void): Promise<void> {
    // Anthropic streaming implementation would go here
    // For now, fall back to regular response
    const response = await this.callAnthropic(prompt, config);
    onChunk(response.content);
  }

  getAvailableModels(): string[] {
    return Array.from(this.models.keys());
  }

  addModel(name: string, config: AIModelConfig): void {
    this.models.set(name, config);
  }

  removeModel(name: string): void {
    this.models.delete(name);
    
    // Clean up web worker if it exists
    const worker = this.webWorkers.get(name);
    if (worker) {
      worker.terminate();
      this.webWorkers.delete(name);
    }
  }

  async dispose(): Promise<void> {
    // Terminate all web workers
    for (const [name, worker] of this.webWorkers) {
      worker.terminate();
    }
    this.webWorkers.clear();
    
    // Clear request queue
    this.requestQueue.forEach(({ reject }) => {
      reject(new Error('AI adapter disposed'));
    });
    this.requestQueue = [];
  }

  // Graph-of-Thought compatibility methods
  async generateThought(
    context: string,
    goalType: 'analysis' | 'synthesis' | 'evaluation' | 'creative',
    modelName?: string
  ): Promise<AIResponse> {
    const thoughtPrompts = {
      analysis: `Analyze the following context and break it down into key components:\n\n${context}`,
      synthesis: `Synthesize insights from the following context:\n\n${context}`,
      evaluation: `Evaluate and assess the following context:\n\n${context}`,
      creative: `Generate creative ideas based on the following context:\n\n${context}`
    };

    return this.generateResponse(thoughtPrompts[goalType], modelName);
  }

  async chainThoughts(
    thoughts: string[],
    finalGoal: string,
    modelName?: string
  ): Promise<AIResponse> {
    const chainedPrompt = `
Previous thoughts:
${thoughts.map((thought, i) => `${i + 1}. ${thought}`).join('\n')}

Final goal: ${finalGoal}

Based on the previous thoughts, provide a comprehensive conclusion:`;

    return this.generateResponse(chainedPrompt, modelName);
  }
}
