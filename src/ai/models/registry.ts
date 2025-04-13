import { Model } from '../../types/ai.js';
import { logger } from '../../utils/logger.js';
import { ConfigManager } from '../../config/manager.js';

// Placeholder for actual model implementations
// import { OpenAIModel } from './providers/openai.js'; 
// import { AnthropicModel } from './providers/anthropic.js';

export class ModelRegistry {
  private static instance: ModelRegistry;
  private models = new Map<string, Model>();
  private config: ConfigManager;

  private constructor() {
    this.config = ConfigManager.getInstance();
    logger.debug('Initializing ModelRegistry...');
    this.loadModelsFromConfig();
  }

  static getInstance(): ModelRegistry {
    if (!ModelRegistry.instance) {
      ModelRegistry.instance = new ModelRegistry();
    }
    return ModelRegistry.instance;
  }

  private loadModelsFromConfig(): void {
    const providersConfig = this.config.get('ai.models.providers');
    if (!providersConfig) {
      logger.warn('No AI model providers configured.');
      return;
    }

    logger.info('Loading models from configuration...');
    for (const providerName in providersConfig) {
      const providerConf = providersConfig[providerName];
      // TODO: Instantiate actual model classes based on providerName
      // Example:
      // if (providerName === 'openai' && providerConf.apiKey) {
      //   // Assuming OpenAIModel takes apiKey and potentially other options
      //   const model = new OpenAIModel({ apiKey: providerConf.apiKey }); 
      //   this.registerModel(model);
      // } else if (providerName === 'anthropic' && providerConf.apiKey) {
      //   // const model = new AnthropicModel({ apiKey: providerConf.apiKey });
      //   // this.registerModel(model);
      // } else {
      //    logger.warn(`Unsupported or misconfigured provider: ${providerName}`);
      // }
       logger.warn(`Model provider "${providerName}" configured but actual implementation/loading is not yet handled.`);
    }
     logger.info('Finished loading models from configuration.');
  }

  registerModel(model: Model): void {
    if (this.models.has(model.id)) {
      logger.warn(`Model with ID "${model.id}" is already registered. Overwriting.`);
    }
    logger.debug(`Registering model: ${model.id}`);
    this.models.set(model.id, model);
  }

  getModel(id: string): Model | undefined {
    const model = this.models.get(id);
    if (!model) {
        logger.warn(`Model with ID "${id}" not found in registry.`);
    }
    return model;
  }

  getDefaultModel(): Model | undefined {
    const defaultModelId = this.config.get('ai.defaultModel');
    if (defaultModelId) {
      const model = this.getModel(defaultModelId);
      if (model) {
        return model;
      } else {
         logger.error(`Default model ID "${defaultModelId}" configured but not found in registry.`);
      }
    }
    
    // Fallback: return the first registered model if no default is set or found
    if (this.models.size > 0) {
       const firstModelId = this.models.keys().next().value;
       // Add explicit check to satisfy TypeScript, although size check should guarantee it's a string
       if (typeof firstModelId === 'string') { 
           logger.warn(`No default model configured or found. Falling back to first registered model: ${firstModelId}`);
           return this.models.get(firstModelId);
       }
    }

    logger.error('No models registered and no default model configured.');
    return undefined;
  }

  listModelIds(): string[] {
    return Array.from(this.models.keys());
  }
}
