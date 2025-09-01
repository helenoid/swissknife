// Hugging Face CloudFlare Workers Integration
// Advanced AI Inference and Model Management on CloudFlare Edge

import { CloudFlareIntegration, CloudFlareTask } from '../cloudflare/cloudflare-integration.js';
import { HuggingFaceIntegration, HFInferenceTask } from './huggingface-integration.js';

/**
 * Hugging Face CloudFlare Worker Configuration
 */
export interface HFCloudFlareWorkerConfig {
  huggingfaceApiKey: string;
  cloudflareConfig: any;
  enabledWorkers: {
    textGeneration?: boolean;
    textClassification?: boolean;
    imageClassification?: boolean;
    speechRecognition?: boolean;
    translation?: boolean;
    summarization?: boolean;
  };
  workerSettings: {
    timeout?: number;
    memory?: number;
    cpu?: number;
  };
}

/**
 * Hugging Face Task for CloudFlare Workers
 */
export interface HFCloudFlareTask extends CloudFlareTask {
  hfModel: string;
  hfTask: string;
  hfInputs: any;
  hfParameters?: any;
  targetWorker: 'text-generation' | 'classification' | 'image-processing' | 'audio-processing';
}

/**
 * Worker Template for Hugging Face Integration
 */
export class HuggingFaceCloudFlareWorkers {
  private cloudflareIntegration: CloudFlareIntegration;
  private huggingfaceIntegration: HuggingFaceIntegration;
  private config: HFCloudFlareWorkerConfig;
  private deployedWorkers: Map<string, string> = new Map();

  constructor(
    cloudflareIntegration: CloudFlareIntegration,
    huggingfaceIntegration: HuggingFaceIntegration,
    config: HFCloudFlareWorkerConfig
  ) {
    this.cloudflareIntegration = cloudflareIntegration;
    this.huggingfaceIntegration = huggingfaceIntegration;
    this.config = config;
  }

  /**
   * Deploy all enabled Hugging Face workers to CloudFlare
   */
  async deployAllWorkers(): Promise<void> {
    console.log('🚀 Deploying Hugging Face workers to CloudFlare...');

    const workers = [
      { name: 'hf-text-generation', enabled: this.config.enabledWorkers.textGeneration },
      { name: 'hf-text-classification', enabled: this.config.enabledWorkers.textClassification },
      { name: 'hf-image-classification', enabled: this.config.enabledWorkers.imageClassification },
      { name: 'hf-speech-recognition', enabled: this.config.enabledWorkers.speechRecognition },
      { name: 'hf-translation', enabled: this.config.enabledWorkers.translation },
      { name: 'hf-summarization', enabled: this.config.enabledWorkers.summarization }
    ];

    for (const worker of workers) {
      if (worker.enabled) {
        try {
          const workerCode = this.generateWorkerCode(worker.name);
          const workerConfig = {
            name: worker.name,
            script: workerCode,
            environment: 'production' as const,
            bindings: {
              HUGGINGFACE_API_KEY: this.config.huggingfaceApiKey
            }
          };

          const workerUrl = await this.cloudflareIntegration.deployWorker(workerCode, workerConfig);
          this.deployedWorkers.set(worker.name, workerUrl);
          
          console.log(`✅ Deployed ${worker.name} to ${workerUrl}`);
        } catch (error) {
          console.error(`❌ Failed to deploy ${worker.name}:`, error);
        }
      }
    }
  }

  /**
   * Execute Hugging Face task on CloudFlare Workers
   */
  async executeHFTask(task: HFCloudFlareTask): Promise<any> {
    const workerName = `hf-${task.targetWorker.replace('_', '-')}`;
    const workerUrl = this.deployedWorkers.get(workerName);

    if (!workerUrl) {
      throw new Error(`Worker ${workerName} not deployed`);
    }

    // Transform HF task to CloudFlare task
    const cfTask: CloudFlareTask = {
      id: task.id,
      type: 'ai-inference',
      payload: {
        model: task.hfModel,
        task: task.hfTask,
        inputs: task.hfInputs,
        parameters: task.hfParameters
      },
      priority: task.priority,
      timeout: task.timeout,
      retries: task.retries,
      fallbackToPeer: task.fallbackToPeer
    };

    return await this.cloudflareIntegration.executeServerTask(cfTask);
  }

  /**
   * Generate CloudFlare Worker code for specific Hugging Face tasks
   */
  private generateWorkerCode(workerType: string): string {
    const baseTemplate = this.getBaseWorkerTemplate();
    
    switch (workerType) {
      case 'hf-text-generation':
        return baseTemplate + this.getTextGenerationHandler();
      case 'hf-text-classification':
        return baseTemplate + this.getTextClassificationHandler();
      case 'hf-image-classification':
        return baseTemplate + this.getImageClassificationHandler();
      case 'hf-speech-recognition':
        return baseTemplate + this.getSpeechRecognitionHandler();
      case 'hf-translation':
        return baseTemplate + this.getTranslationHandler();
      case 'hf-summarization':
        return baseTemplate + this.getSummarizationHandler();
      default:
        throw new Error(`Unknown worker type: ${workerType}`);
    }
  }

  /**
   * Base CloudFlare Worker template for Hugging Face integration
   */
  private getBaseWorkerTemplate(): string {
    return `
// Hugging Face CloudFlare Worker
// Auto-generated worker for AI inference on edge

export default {
  async fetch(request, env, ctx) {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const url = new URL(request.url);
      
      if (url.pathname === '/health') {
        return new Response(JSON.stringify({ 
          status: 'healthy', 
          timestamp: new Date().toISOString(),
          worker: '${workerType}' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (url.pathname === '/inference' && request.method === 'POST') {
        const startTime = Date.now();
        const requestData = await request.json();
        
        const result = await handleInference(requestData, env);
        const executionTime = Date.now() - startTime;
        
        return new Response(JSON.stringify({
          success: true,
          result,
          execution_time: executionTime,
          worker: '${workerType}',
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response('Not Found', { 
        status: 404, 
        headers: corsHeaders 
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message,
        worker: '${workerType}',
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

async function callHuggingFaceAPI(modelId, inputs, parameters = {}, env) {
  const response = await fetch(\`https://api-inference.huggingface.co/models/\${modelId}\`, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${env.HUGGINGFACE_API_KEY}\`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs,
      parameters,
      options: {
        wait_for_model: true,
        use_cache: true
      }
    }),
  });

  if (!response.ok) {
    throw new Error(\`Hugging Face API error: \${response.status} \${response.statusText}\`);
  }

  return await response.json();
}
`;
  }

  /**
   * Text generation handler for CloudFlare Worker
   */
  private getTextGenerationHandler(): string {
    return `
async function handleInference(requestData, env) {
  const { model, inputs, parameters = {} } = requestData;
  
  // Default parameters for text generation
  const defaultParams = {
    max_length: 100,
    temperature: 0.7,
    top_p: 0.9,
    do_sample: true,
    ...parameters
  };

  const result = await callHuggingFaceAPI(
    model || 'microsoft/DialoGPT-medium',
    inputs,
    defaultParams,
    env
  );

  return {
    generated_text: result[0]?.generated_text || result.generated_text,
    model: model || 'microsoft/DialoGPT-medium',
    parameters: defaultParams
  };
}`;
  }

  /**
   * Text classification handler for CloudFlare Worker
   */
  private getTextClassificationHandler(): string {
    return `
async function handleInference(requestData, env) {
  const { model, inputs, parameters = {} } = requestData;
  
  const result = await callHuggingFaceAPI(
    model || 'distilbert-base-uncased-finetuned-sst-2-english',
    inputs,
    parameters,
    env
  );

  return {
    classifications: Array.isArray(result) ? result : [result],
    model: model || 'distilbert-base-uncased-finetuned-sst-2-english'
  };
}`;
  }

  /**
   * Image classification handler for CloudFlare Worker
   */
  private getImageClassificationHandler(): string {
    return `
async function handleInference(requestData, env) {
  const { model, inputs, parameters = {} } = requestData;
  
  // Handle base64 image input
  let imageData = inputs;
  if (typeof inputs === 'string' && inputs.startsWith('data:image')) {
    imageData = inputs.split(',')[1];
  }

  const result = await callHuggingFaceAPI(
    model || 'google/vit-base-patch16-224',
    imageData,
    parameters,
    env
  );

  return {
    classifications: Array.isArray(result) ? result : [result],
    model: model || 'google/vit-base-patch16-224'
  };
}`;
  }

  /**
   * Speech recognition handler for CloudFlare Worker
   */
  private getSpeechRecognitionHandler(): string {
    return `
async function handleInference(requestData, env) {
  const { model, inputs, parameters = {} } = requestData;
  
  const result = await callHuggingFaceAPI(
    model || 'facebook/wav2vec2-base-960h',
    inputs,
    parameters,
    env
  );

  return {
    transcription: result.text || result[0]?.text,
    model: model || 'facebook/wav2vec2-base-960h'
  };
}`;
  }

  /**
   * Translation handler for CloudFlare Worker
   */
  private getTranslationHandler(): string {
    return `
async function handleInference(requestData, env) {
  const { model, inputs, parameters = {} } = requestData;
  
  const result = await callHuggingFaceAPI(
    model || 'Helsinki-NLP/opus-mt-en-fr',
    inputs,
    parameters,
    env
  );

  return {
    translation: result[0]?.translation_text || result.translation_text,
    model: model || 'Helsinki-NLP/opus-mt-en-fr'
  };
}`;
  }

  /**
   * Summarization handler for CloudFlare Worker
   */
  private getSummarizationHandler(): string {
    return `
async function handleInference(requestData, env) {
  const { model, inputs, parameters = {} } = requestData;
  
  // Default parameters for summarization
  const defaultParams = {
    max_length: 150,
    min_length: 30,
    do_sample: false,
    ...parameters
  };

  const result = await callHuggingFaceAPI(
    model || 'facebook/bart-large-cnn',
    inputs,
    defaultParams,
    env
  );

  return {
    summary: result[0]?.summary_text || result.summary_text,
    model: model || 'facebook/bart-large-cnn',
    parameters: defaultParams
  };
}`;
  }

  /**
   * Get deployed worker URLs
   */
  getDeployedWorkers(): Map<string, string> {
    return new Map(this.deployedWorkers);
  }

  /**
   * Test a specific worker
   */
  async testWorker(workerName: string, testData: any): Promise<any> {
    const workerUrl = this.deployedWorkers.get(workerName);
    if (!workerUrl) {
      throw new Error(`Worker ${workerName} not deployed`);
    }

    try {
      const response = await fetch(`${workerUrl}/inference`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      if (!response.ok) {
        throw new Error(`Worker test failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`❌ Worker test failed for ${workerName}:`, error);
      throw error;
    }
  }

  /**
   * Get worker health status
   */
  async getWorkerHealth(workerName: string): Promise<any> {
    const workerUrl = this.deployedWorkers.get(workerName);
    if (!workerUrl) {
      throw new Error(`Worker ${workerName} not deployed`);
    }

    try {
      const response = await fetch(`${workerUrl}/health`);
      
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`❌ Health check failed for ${workerName}:`, error);
      throw error;
    }
  }

  /**
   * Undeploy a worker
   */
  async undeployWorker(workerName: string): Promise<void> {
    // In a real implementation, this would call CloudFlare API to delete the worker
    this.deployedWorkers.delete(workerName);
    console.log(`🗑️ Worker ${workerName} undeployed`);
  }

  /**
   * Undeploy all workers
   */
  async undeployAllWorkers(): Promise<void> {
    const workerNames = Array.from(this.deployedWorkers.keys());
    
    for (const workerName of workerNames) {
      await this.undeployWorker(workerName);
    }
    
    console.log('🗑️ All Hugging Face workers undeployed');
  }
}

/**
 * Pre-defined worker configurations for common Hugging Face tasks
 */
export const HF_WORKER_PRESETS = {
  textGeneration: {
    models: [
      'microsoft/DialoGPT-medium',
      'microsoft/DialoGPT-large',
      'facebook/blenderbot-400M-distill',
      'microsoft/ProphetNet-large-uncased'
    ],
    defaultParams: {
      max_length: 100,
      temperature: 0.7,
      top_p: 0.9,
      do_sample: true
    }
  },
  
  textClassification: {
    models: [
      'distilbert-base-uncased-finetuned-sst-2-english',
      'cardiffnlp/twitter-roberta-base-sentiment-latest',
      'j-hartmann/emotion-english-distilroberta-base'
    ],
    tasks: ['sentiment-analysis', 'emotion-detection', 'intent-classification']
  },
  
  imageClassification: {
    models: [
      'google/vit-base-patch16-224',
      'microsoft/resnet-50',
      'facebook/deit-base-distilled-patch16-224'
    ],
    tasks: ['image-classification', 'object-detection']
  },
  
  speechRecognition: {
    models: [
      'facebook/wav2vec2-base-960h',
      'facebook/wav2vec2-large-960h-lv60-self',
      'microsoft/speecht5_asr'
    ],
    tasks: ['automatic-speech-recognition']
  },
  
  translation: {
    models: [
      'Helsinki-NLP/opus-mt-en-fr',
      'Helsinki-NLP/opus-mt-en-es',
      'Helsinki-NLP/opus-mt-en-de',
      'facebook/mbart-large-50-many-to-many-mmt'
    ],
    tasks: ['translation']
  },
  
  summarization: {
    models: [
      'facebook/bart-large-cnn',
      'microsoft/prophetnet-large-uncased-cnndm',
      'sshleifer/distilbart-cnn-12-6'
    ],
    defaultParams: {
      max_length: 150,
      min_length: 30,
      do_sample: false
    }
  }
};