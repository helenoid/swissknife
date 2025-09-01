/**
 * IPFS Accelerate Bridge for SwissKnife Virtual Desktop
 * Integrates the ipfs_accelerate_js transformers model server with the virtual desktop
 */

class IPFSAccelerateBridge {
  constructor() {
    this.modelServer = null;
    this.loadedModels = new Map();
    this.modelCapabilities = new Map();
    this.inferenceQueue = [];
    this.isInitialized = false;
    this.eventListeners = new Map();
    
    // Model registry with comprehensive transformers support
    this.supportedModels = {
      // Text Models
      'bert-base-uncased': {
        name: 'BERT Base Uncased',
        type: 'text-encoding',
        size: 110,
        capabilities: ['text-classification', 'question-answering', 'text-embedding'],
        provider: 'huggingface',
        memoryRequirement: 512,
        hardwareOptimization: ['webgpu', 'webnn', 'cpu']
      },
      't5-small': {
        name: 'T5 Small',
        type: 'text-generation',
        size: 242,
        capabilities: ['text-generation', 'summarization', 'translation'],
        provider: 'huggingface',
        memoryRequirement: 1024,
        hardwareOptimization: ['webgpu', 'webnn', 'cpu']
      },
      'gpt2': {
        name: 'GPT-2',
        type: 'text-generation',
        size: 548,
        capabilities: ['text-generation', 'completion'],
        provider: 'huggingface',
        memoryRequirement: 2048,
        hardwareOptimization: ['webgpu', 'cpu']
      },
      'distilbert-base-uncased': {
        name: 'DistilBERT Base Uncased',
        type: 'text-encoding',
        size: 66,
        capabilities: ['text-classification', 'question-answering', 'text-embedding'],
        provider: 'huggingface',
        memoryRequirement: 256,
        hardwareOptimization: ['webgpu', 'webnn', 'cpu']
      }
    };
    
    // Hardware capabilities detection
    this.hardwareCapabilities = {
      webgpu: false,
      webnn: false,
      webassembly: false,
      dedicatedWorker: false,
      sharedArrayBuffer: false
    };
    
    this.init();
  }

  async init() {
    console.log('Initializing IPFS Accelerate Bridge...');
    
    try {
      // Detect hardware capabilities
      await this.detectHardwareCapabilities();
      
      // Initialize the model server interface
      await this.initializeModelServer();
      
      // Setup event handling
      this.setupEventHandlers();
      
      this.isInitialized = true;
      this.emit('bridge:initialized', { capabilities: this.hardwareCapabilities });
      
      console.log('IPFS Accelerate Bridge initialized successfully');
      console.log('Hardware capabilities:', this.hardwareCapabilities);
      
    } catch (error) {
      console.error('Failed to initialize IPFS Accelerate Bridge:', error);
      this.emit('bridge:error', { error: error.message });
    }
  }

  async detectHardwareCapabilities() {
    // Detect WebGPU support
    if ('gpu' in navigator) {
      try {
        const adapter = await navigator.gpu.requestAdapter();
        this.hardwareCapabilities.webgpu = !!adapter;
      } catch (error) {
        console.log('WebGPU not available:', error.message);
      }
    }
    
    // Detect WebNN support (experimental)
    if ('ml' in navigator) {
      this.hardwareCapabilities.webnn = true;
    }
    
    // Detect WebAssembly support
    this.hardwareCapabilities.webassembly = typeof WebAssembly !== 'undefined';
    
    // Detect Worker support
    this.hardwareCapabilities.dedicatedWorker = typeof Worker !== 'undefined';
    
    // Detect SharedArrayBuffer support
    this.hardwareCapabilities.sharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
  }

  async initializeModelServer() {
    // Create a model server interface that connects to ipfs_accelerate_js
    this.modelServer = {
      loadModel: async (modelId, options = {}) => {
        return await this.loadModel(modelId, options);
      },
      
      unloadModel: async (modelId) => {
        return await this.unloadModel(modelId);
      },
      
      inference: async (modelId, input, options = {}) => {
        return await this.runInference(modelId, input, options);
      },
      
      getLoadedModels: () => {
        return Array.from(this.loadedModels.keys());
      },
      
      getModelCapabilities: (modelId) => {
        return this.modelCapabilities.get(modelId);
      },
      
      getSystemStatus: () => {
        return {
          isInitialized: this.isInitialized,
          loadedModels: this.loadedModels.size,
          queueSize: this.inferenceQueue.length,
          hardwareCapabilities: this.hardwareCapabilities
        };
      }
    };
  }

  async loadModel(modelId, options = {}) {
    console.log(`Loading model: ${modelId}`);
    
    if (this.loadedModels.has(modelId)) {
      console.log(`Model ${modelId} is already loaded`);
      return { success: true, cached: true };
    }
    
    const modelInfo = this.supportedModels[modelId];
    if (!modelInfo) {
      throw new Error(`Unsupported model: ${modelId}`);
    }
    
    try {
      // Emit loading event
      this.emit('model:loading', { modelId, modelInfo });
      
      // Simulate model loading with progress (in real implementation, this would use ipfs_accelerate_js)
      const loadingSteps = [
        'Downloading model weights...',
        'Initializing hardware acceleration...',
        'Loading tokenizer...',
        'Optimizing for hardware...',
        'Model ready'
      ];
      
      for (let i = 0; i < loadingSteps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
        this.emit('model:loading:progress', { 
          modelId, 
          step: i + 1, 
          total: loadingSteps.length, 
          message: loadingSteps[i],
          progress: ((i + 1) / loadingSteps.length) * 100
        });
      }
      
      // Store loaded model info
      this.loadedModels.set(modelId, {
        ...modelInfo,
        loadedAt: Date.now(),
        inferenceCount: 0,
        lastInference: null,
        options
      });
      
      // Set model capabilities
      this.modelCapabilities.set(modelId, modelInfo.capabilities);
      
      this.emit('model:loaded', { modelId, modelInfo });
      
      console.log(`Model ${modelId} loaded successfully`);
      return { success: true, modelId, capabilities: modelInfo.capabilities };
      
    } catch (error) {
      this.emit('model:error', { modelId, error: error.message });
      throw error;
    }
  }

  async unloadModel(modelId) {
    console.log(`Unloading model: ${modelId}`);
    
    if (!this.loadedModels.has(modelId)) {
      console.log(`Model ${modelId} is not loaded`);
      return { success: true };
    }
    
    try {
      // Remove from loaded models
      this.loadedModels.delete(modelId);
      this.modelCapabilities.delete(modelId);
      
      this.emit('model:unloaded', { modelId });
      
      console.log(`Model ${modelId} unloaded successfully`);
      return { success: true, modelId };
      
    } catch (error) {
      this.emit('model:error', { modelId, error: error.message });
      throw error;
    }
  }

  async runInference(modelId, input, options = {}) {
    if (!this.loadedModels.has(modelId)) {
      throw new Error(`Model ${modelId} is not loaded`);
    }
    
    const modelInfo = this.loadedModels.get(modelId);
    const inferenceId = `inf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      this.emit('inference:started', { inferenceId, modelId, input });
      
      // Simulate inference processing time based on model size and input complexity
      const processingTime = Math.max(100, modelInfo.size * 2 + input.length * 0.5);
      await new Promise(resolve => setTimeout(resolve, processingTime));
      
      // Generate mock response based on model type
      let result;
      switch (modelInfo.type) {
        case 'text-generation':
          result = {
            generated_text: `Generated response for: "${input.substring(0, 50)}${input.length > 50 ? '...' : ''}"`
          };
          break;
          
        case 'text-encoding':
          result = {
            embeddings: Array.from({ length: 768 }, () => Math.random() * 2 - 1),
            pooled_output: Array.from({ length: 768 }, () => Math.random() * 2 - 1)
          };
          break;
          
        default:
          result = { output: `Processed: ${input}` };
      }
      
      // Update model statistics
      modelInfo.inferenceCount++;
      modelInfo.lastInference = Date.now();
      
      this.emit('inference:completed', { inferenceId, modelId, result });
      
      return {
        success: true,
        inferenceId,
        modelId,
        result,
        metadata: {
          processingTime,
          timestamp: Date.now(),
          hardwareUsed: this.getOptimalHardware(modelInfo)
        }
      };
      
    } catch (error) {
      this.emit('inference:error', { inferenceId, modelId, error: error.message });
      throw error;
    }
  }

  getOptimalHardware(modelInfo) {
    const available = this.hardwareCapabilities;
    
    if (available.webgpu && modelInfo.hardwareOptimization.includes('webgpu')) {
      return 'webgpu';
    } else if (available.webnn && modelInfo.hardwareOptimization.includes('webnn')) {
      return 'webnn';
    } else if (available.webassembly) {
      return 'webassembly';
    } else {
      return 'cpu';
    }
  }

  getSupportedModels() {
    return Object.entries(this.supportedModels).map(([id, info]) => ({
      id,
      ...info,
      isLoaded: this.loadedModels.has(id),
      isSupported: this.isModelSupported(info)
    }));
  }

  isModelSupported(modelInfo) {
    // Check if current hardware can support this model
    const requiredMemory = modelInfo.memoryRequirement || 512;
    const availableMemory = performance.memory ? performance.memory.usedJSHeapSize / (1024 * 1024) : 2048;
    
    return availableMemory > requiredMemory;
  }

  getSystemMetrics() {
    return {
      loadedModels: this.loadedModels.size,
      totalInferences: Array.from(this.loadedModels.values())
        .reduce((sum, model) => sum + model.inferenceCount, 0),
      hardwareCapabilities: this.hardwareCapabilities,
      memory: performance.memory ? {
        used: Math.round(performance.memory.usedJSHeapSize / (1024 * 1024)),
        total: Math.round(performance.memory.totalJSHeapSize / (1024 * 1024)),
        limit: Math.round(performance.memory.jsHeapSizeLimit / (1024 * 1024))
      } : null,
      uptime: Date.now() - (this.initTime || Date.now())
    };
  }

  // Event system
  on(event, listener) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(listener);
  }

  off(event, listener) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Cleanup
  destroy() {
    console.log('Destroying IPFS Accelerate Bridge...');
    
    // Unload all models
    for (const modelId of this.loadedModels.keys()) {
      this.unloadModel(modelId).catch(console.error);
    }
    
    // Clear event listeners
    this.eventListeners.clear();
    
    this.isInitialized = false;
    console.log('IPFS Accelerate Bridge destroyed');
  }
}

// Initialize and expose globally
window.IPFSAccelerateBridge = IPFSAccelerateBridge;

// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
  window.ipfsAccelerateBridge = new IPFSAccelerateBridge();
  
  // Make the model server available globally for other apps
  window.addEventListener('load', () => {
    if (window.ipfsAccelerateBridge && window.ipfsAccelerateBridge.isInitialized) {
      window.transformersModelServer = window.ipfsAccelerateBridge.modelServer;
      console.log('Transformers Model Server available globally');
    }
  });
}

export { IPFSAccelerateBridge };