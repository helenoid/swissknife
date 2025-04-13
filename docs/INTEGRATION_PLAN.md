# SwissKnife Integration Plan: Old to New Codebase

This document outlines a comprehensive plan for integrating features from the `swissknife_old` codebase into the current `swissknife` implementation. The goal is to ensure a smooth transition of functionality while maintaining the architecture and coding standards of the current project.

## Overview

The `swissknife_old` directory contains a previous implementation with components like:
- `master/` - Master control components
- `models/` - Model definitions and implementations
- `registry/` - Registration mechanisms
- `worker/` - Worker implementation
- Various configuration files (`.toml` and `.js` files)

Additionally, the `ipfs_accelerate_js` directory contains a JavaScript SDK for hardware-accelerated ML in web browsers using WebGPU, WebNN, and IPFS optimization.

The current `swissknife` implementation is a TypeScript/React-based CLI application with a well-defined architecture for interacting with AI models.

## Integration Strategy

We'll follow these principles during integration:
1. **Incremental approach**: Integrate one component at a time
2. **Maintain architecture**: Follow the current project's patterns
3. **Comprehensive testing**: Test each integrated component
4. **Documentation**: Update documentation for new features

## Feature Analysis

Here's an analysis of the key features in `swissknife_old` that need integration:

### 1. Model Implementations

**Current State**: 
The current `swissknife` has a model system defined in `src/constants/models.ts` with provider-specific implementations in the `services` directory.

**Integration Plan**:
- Analyze models in `swissknife_old/models/`
- Identify and filter out tasknet-specific model implementations
- Map remaining models to the current architecture
- Implement missing models in the current format
- Update model selection UI in `ModelSelector.tsx` if needed

### 2. Task Distribution System (from TaskNet)

**Current State**:
The current system lacks a robust task distribution capability, while `swissknife_old` contains remnants of the TaskNet codebase with distributed task processing functionality.

**Integration Plan**:
- Analyze the TaskNet-based code in `swissknife_old/registry/` and `swissknife_old/worker/`
- Design a modern task distribution system compatible with SwissKnife's architecture
- Implement task queuing, prioritization, and load balancing
- Develop failure recovery and retry mechanisms
- Create a task monitoring dashboard
- Implement task result caching for improved performance

### 3. Registry and Worker Implementation

**Current State**:
The registry and worker components from `swissknife_old` originate from TaskNet but need significant adaptation.

**Integration Plan**:
- Extract core TaskNet functionality from `swissknife_old/registry/` and `swissknife_old/worker/` 
- Design a compatible registry approach focused on task distribution
- Develop worker pools to process tasks based on priority and resource availability
- Implement an event system for task lifecycle notifications
- Add comprehensive metrics and monitoring
- Create integration tests for the task distribution system

### 4. Master Control Components

**Current State**:
The current system uses a command-based architecture with React/Ink components.

**Integration Plan**:
- Study `swissknife_old/master/` implementation
- Map functionality to current command architecture
- Add new commands or extend existing ones
- Update UI components as needed

### 5. Configuration System

**Current State**:
The current system uses JSON configuration with `getGlobalConfig()` and `saveGlobalConfig()`.

**Integration Plan**:
- Analyze TOML configuration in `swissknife_old`
- Design a migration strategy for configuration
- Implement configuration converters if needed
- Extend the current configuration interface

### 6. IPFS Accelerate JS Integration

The `ipfs_accelerate_js` directory contains a sophisticated JavaScript SDK for hardware-accelerated machine learning in web browsers using WebGPU, WebNN, and IPFS optimization. This represents a significant opportunity to enhance SwissKnife with browser-based acceleration.

#### 1. Browser-Based Acceleration

**Current State**:
The current SwissKnife implementation primarily focuses on server-side model execution without leveraging browser capabilities for acceleration.

**Integration Plan**:
- Integrate the WebGPU and WebNN acceleration capabilities
- Implement browser detection and optimization logic
- Support cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- Add configurable fallback mechanisms

#### 2. Hardware Abstraction Layer

**Current State**:
SwissKnife lacks a unified hardware abstraction layer for diverse execution environments.

**Integration Plan**:
- Adapt the hardware abstraction components from `ipfs_accelerate_js`
- Implement automatic hardware detection and selection
- Create a unified interface for model execution across different backends
- Support WebGPU, WebNN, WebAssembly, and CPU fallbacks

#### 3. Quantization and Optimization

**Current State**:
The current implementation doesn't support advanced model quantization or hardware-specific optimizations.

**Integration Plan**:
- Integrate the 2-bit, 3-bit, and 4-bit quantization capabilities
- Implement browser-specific shader optimizations
- Add tensor operation optimizations for WebGPU
- Support mixed-precision execution for balanced performance

#### 4. Model Streaming Support

**Current State**:
SwissKnife has limited support for streaming model outputs in web environments.

**Integration Plan**:
- Integrate the streaming inference capabilities from `ipfs_accelerate_js`
- Implement adaptive batch processing
- Add KV-cache optimizations for LLM inference
- Support real-time token generation with performance metrics

#### 5. Resource Management

**Current State**:
The current system doesn't have a resource pool management system for browser environments.

**Integration Plan**:
- Implement the resource pool management system
- Add browser-specific resource allocation strategies
- Support concurrent model execution
- Implement resource cleanup and lifecycle management

## IPFS Accelerate JS Technical Implementation

### Browser-Based Acceleration Implementation

```typescript
// Example implementation in src/services/browser-acceleration.ts
import { HardwareAbstraction, BrowserCapabilities } from '../types/hardware';

export class BrowserAccelerator {
  private hardwareAbstraction: HardwareAbstraction;
  private browserCapabilities: BrowserCapabilities | null = null;

  constructor() {
    this.hardwareAbstraction = new HardwareAbstraction({
      preferredBackends: ['webgpu', 'webnn', 'wasm', 'cpu']
    });
  }

  async initialize(): Promise<boolean> {
    // Initialize hardware detection
    await this.hardwareAbstraction.initialize();
    
    // Detect browser capabilities
    this.browserCapabilities = await this.detectCapabilities();
    
    return !!this.browserCapabilities;
  }

  async detectCapabilities(): Promise<BrowserCapabilities> {
    // Implementation based on ipfs_accelerate_js/src/browser detection
    return {
      webgpuSupported: typeof navigator.gpu !== 'undefined',
      webnnSupported: typeof navigator.ml?.getNeuralNetworkContext !== 'undefined',
      wasmSupported: typeof WebAssembly !== 'undefined',
      deviceMemoryGB: navigator.deviceMemory || 4,
      browser: this.detectBrowser(),
      hardwareConcurrency: navigator.hardwareConcurrency || 4
    };
  }

  detectBrowser(): string {
    const userAgent = navigator.userAgent;
    
    if (userAgent.indexOf("Firefox") > -1) return "firefox";
    if (userAgent.indexOf("Edge") > -1) return "edge";
    if (userAgent.indexOf("Chrome") > -1) return "chrome";
    if (userAgent.indexOf("Safari") > -1) return "safari";
    
    return "unknown";
  }

  // Additional methods based on ipfs_accelerate_js functionality
}
```

### Hardware Abstraction Layer Implementation

```typescript
// Example implementation in src/types/hardware.ts
export interface HardwareBackend {
  id: string;
  name: string;
  priority: number;
  isAvailable: boolean;
  capabilities: string[];
}

export interface BrowserCapabilities {
  webgpuSupported: boolean;
  webnnSupported: boolean;
  wasmSupported: boolean;
  deviceMemoryGB: number;
  browser: string;
  hardwareConcurrency: number;
}

export interface HardwareAbstractionOptions {
  preferredBackends?: string[];
  enableLogging?: boolean;
  webgpuOptions?: {
    shaderPrecompilation?: boolean;
    workgroupSize?: number[];
  };
}

// Implementation in src/services/hardware-abstraction.ts
export class HardwareAbstraction {
  private backends: HardwareBackend[] = [];
  private activeBackend: HardwareBackend | null = null;
  private options: HardwareAbstractionOptions;

  constructor(options: HardwareAbstractionOptions = {}) {
    this.options = options;
  }

  async initialize(): Promise<boolean> {
    // Initialize available backends based on ipfs_accelerate_js implementation
    await this.detectHardware();
    
    // Select the optimal backend
    this.activeBackend = this.selectOptimalBackend();
    
    return this.activeBackend !== null;
  }

  // Additional methods based on ipfs_accelerate_js implementation
}
```

### Quantization and Optimization Implementation

```typescript
// Example implementation in src/utils/quantization.ts
export enum QuantizationPrecision {
  TwoBit = '2-bit',
  ThreeBit = '3-bit',
  FourBit = '4-bit',
  EightBit = '8-bit',
  SixteenBit = '16-bit'
}

export interface QuantizationConfig {
  precision: QuantizationPrecision;
  scheme: 'symmetric' | 'asymmetric';
  groupSize?: number;
  mixedPrecision?: boolean;
}

export class ModelQuantizer {
  static getMemoryReduction(precision: QuantizationPrecision): number {
    // Calculate memory reduction percentage
    switch (precision) {
      case QuantizationPrecision.TwoBit:
        return 0.875; // 87.5% reduction
      case QuantizationPrecision.ThreeBit:
        return 0.8125; // 81.25% reduction
      case QuantizationPrecision.FourBit:
        return 0.75; // 75% reduction
      case QuantizationPrecision.EightBit:
        return 0.5; // 50% reduction
      default:
        return 0; // No reduction for 16-bit
    }
  }

  // Additional methods adapted from ipfs_accelerate_js
}

// Implementation in src/services/webgpu-optimizer.ts
export class WebGPUOptimizer {
  private browser: string;
  private shaderCompiler: any;
  
  constructor(browser: string) {
    this.browser = browser;
    // Initialize based on browser type
  }
  
  // Methods for browser-specific optimizations
}
```

### Model Streaming Implementation

```typescript
// Example implementation in src/services/model-streamer.ts
export interface StreamingConfig {
  maxTokensPerStep?: number;
  latencyOptimized?: boolean;
  adaptiveBatchSize?: boolean;
  optimizeKVCache?: boolean;
}

export class ModelStreamer {
  private accelerator: any;
  private config: StreamingConfig;
  
  constructor(accelerator: any, config: StreamingConfig = {}) {
    this.accelerator = accelerator;
    this.config = {
      maxTokensPerStep: 4,
      latencyOptimized: true,
      adaptiveBatchSize: true,
      optimizeKVCache: true,
      ...config
    };
  }
  
  async *generateTokenStream(prompt: string, options: any = {}): AsyncGenerator<string> {
    // Implementation based on ipfs_accelerate_js streaming functionality
    
    // Initialize metrics
    const startTime = Date.now();
    let firstTokenTime: number | null = null;
    let tokenCount = 0;
    
    try {
      // Generate response tokens
      // In a real implementation, this would interact with the model
      // Yield tokens as they become available
      
      // For demonstration purposes
      yield 'Simulated';
      tokenCount++;
      
      if (tokenCount === 1) {
        firstTokenTime = Date.now() - startTime;
      }
      
      yield ' token';
      tokenCount++;
      
      yield ' streaming';
      tokenCount++;
      
    } finally {
      // Update metrics
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Return metrics in a way that can be accessed after streaming
      this.metrics = {
        timeToFirstToken: firstTokenTime,
        tokensPerSecond: (tokenCount / totalTime) * 1000,
        totalGenerationTime: totalTime / 1000
      };
    }
  }
}
```

### Resource Pool Implementation

```typescript
// Example implementation in src/services/resource-pool.ts
export interface ResourcePoolOptions {
  maxConnections: number;
  browserPreferences?: Record<string, string>;
  enableFaultTolerance?: boolean;
}

export class ResourcePoolManager {
  private options: ResourcePoolOptions;
  private resources: Map<string, any[]> = new Map();
  private inUse: Map<string, Set<any>> = new Map();
  
  constructor(options: ResourcePoolOptions) {
    this.options = {
      maxConnections: 4,
      enableFaultTolerance: true,
      ...options
    };
  }
  
  async initialize(): Promise<boolean> {
    // Initialize resource pools based on ipfs_accelerate_js implementation
    return true;
  }
  
  async acquireResource(type: string): Promise<any> {
    // Resource acquisition logic
    if (!this.resources.has(type)) {
      this.resources.set(type, []);
    }
    
    if (!this.inUse.has(type)) {
      this.inUse.set(type, new Set());
    }
    
    // Get available resources
    const allResources = this.resources.get(type) || [];
    const inUseResources = this.inUse.get(type) || new Set();
    
    // Find available resource
    const availableResource = allResources.find(r => !inUseResources.has(r));
    
    if (availableResource) {
      inUseResources.add(availableResource);
      return availableResource;
    }
    
    // Create new resource if under limit
    if (allResources.length < this.options.maxConnections) {
      const newResource = await this.createResource(type);
      allResources.push(newResource);
      inUseResources.add(newResource);
      return newResource;
    }
    
    // Wait for resource to become available
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const availableResource = allResources.find(r => !inUseResources.has(r));
        if (availableResource) {
          clearInterval(checkInterval);
          inUseResources.add(availableResource);
          resolve(availableResource);
        }
      }, 100);
    });
  }
  
  releaseResource(type: string, resource: any): void {
    // Resource release logic
    const inUseResources = this.inUse.get(type);
    if (inUseResources) {
      inUseResources.delete(resource);
    }
  }
  
  // Additional methods based on ipfs_accelerate_js resource pool
}
```

### Integration with SwissKnife Command System

```typescript
// Example integration in src/commands/acceleration.ts
import { Command, CommandType } from '../types/command';
import { BrowserAccelerator } from '../services/browser-acceleration';

export const accelerationCommand: Command = {
  name: 'acceleration',
  description: 'Configure and manage browser-based model acceleration',
  type: CommandType.UI,
  
  handler: async (args, context) => {
    const accelerator = new BrowserAccelerator();
    await accelerator.initialize();
    
    // Command implementation that integrates with the browser accelerator
    
    // Return UI component for acceleration configuration
    return {
      component: 'AccelerationConfigScreen',
      props: {
        accelerator,
        capabilities: await accelerator.detectCapabilities()
      }
    };
  }
};
```

## Implementation Timeline

1. **Phase 1: Analysis and Planning** (Week 1)
   - Complete detailed analysis of `swissknife_old` components
   - Create detailed integration specifications for each component
   - Define test plan for integrated components

2. **Phase 2: Model Integration** (Week 2)
   - Implement missing models
   - Update model selection and configuration
   - Test model integrations

3. **Phase 3: Registry Integration** (Week 3)
   - Implement registry system if needed
   - Create provider registration mechanisms
   - Test registry functionality

4. **Phase 4: Worker Implementation** (Week 4)
   - Implement worker functionality
   - Integrate with command architecture
   - Test worker features

5. **Phase 5: Master Control Integration** (Week 5)
   - Implement remaining master control features
   - Update UI components
   - Complete integration testing

6. **Phase 6: Final Testing and Documentation** (Week 6)
   - Comprehensive integration testing
   - Update all documentation
   - Create user guides for new features

### Implementation Timeline for IPFS Accelerate Integration

1. **Phase 1: Core Integration** (Week 1-2)
   - Set up bridge between SwissKnife and browser environment
   - Implement basic hardware detection
   - Create initial WebGPU/WebNN execution paths

2. **Phase 2: Model Optimization** (Week 3)
   - Implement quantization support
   - Add browser-specific optimizations
   - Create model caching mechanisms

3. **Phase 3: Streaming and UI** (Week 4-5)
   - Implement streaming inference
   - Create browser-specific UI components
   - Add performance monitoring

4. **Phase 4: Testing and Optimization** (Week 6)
   - Comprehensive cross-browser testing
   - Performance benchmarking
   - Optimization based on test results

## Technical Details

### Model Integration

For each model in `swissknife_old/models/`:

```typescript
// Example integration in src/constants/models.ts
export const providers: Record<string, ProviderDefinition> = {
  // Existing providers...
  
  // Integrated provider from old swissknife
  integratedProvider: {
    name: 'Integrated Provider',
    baseURL: 'https://api.provider.com',
    envVar: 'INTEGRATED_PROVIDER_API_KEY',
    models: [
      {
        id: 'integrated-model',
        name: 'Integrated Model',
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
```

### Registry Integration

If dynamic provider registration is needed:

```typescript
// Example implementation based on CODE_ARCHITECTURE.md
// In src/utils/registry.ts
const providerRegistry = new Map<string, ProviderDefinition>();

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
registerProvider('integrated-provider', {
  name: 'Integrated Provider',
  baseURL: 'https://api.provider.com',
  models: [...],
});
```

### Worker Integration

```typescript
// Example worker implementation in src/services/worker.ts
export interface WorkerConfig {
  taskId: string;
  modelName: string;
  input: string;
  parameters: Record<string, unknown>;
}

export async function runWorkerTask(config: WorkerConfig): Promise<WorkerResult> {
  // Implementation based on swissknife_old/worker
  const { taskId, modelName, input, parameters } = config;
  
  // Worker processing logic...
  
  return {
    taskId,
    result,
    metrics
  };
}
```

### Configuration Extension

Extending the current configuration interface:

```typescript
// In src/utils/config.ts
export interface GlobalConfig {
  // Existing properties...
  
  // New properties from old swissknife
  workerConfig?: {
    maxConcurrent: number;
    timeout: number;
  };
  registryEnabled?: boolean;
  // Other new properties...
}
```

## Testing Strategy

### Unit Tests

For each integrated component:

```javascript
// Example test for integrated model
test('integratedModel returns expected response', async () => {
  const mockResponse = { result: 'test result' };
  // Set up mock for API call
  
  const result = await callIntegratedModel({
    prompt: 'test prompt',
    apiKey: 'test-key',
    // Other parameters...
  });
  
  expect(result).toBe('test result');
});
```

### Integration Tests

For workflows involving multiple components:

```javascript
test('Worker processes task with registry provider', async () => {
  // Register test provider
  registerProvider('test-provider', testProviderConfig);
  
  // Create worker task
  const task = {
    taskId: 'test-task',
    modelName: 'test-model',
    input: 'test input',
    parameters: {}
  };
  
  // Run worker task
  const result = await runWorkerTask(task);
  
  // Verify result
  expect(result.taskId).toBe('test-task');
  expect(result.result).toBeDefined();
});
```

## User Experience Considerations

1. **Backwards Compatibility**: Maintain compatibility with existing configurations
2. **Migration Path**: Provide utilities to migrate from old configurations
3. **Documentation**: Update user documentation with new features
4. **UI Consistency**: Ensure new features follow current UI patterns

## Conclusion

This integration plan provides a structured approach to incorporating features from `swissknife_old` into the current `swissknife` implementation. By following this plan, we will maintain the architecture and coding standards of the current project while adding valuable functionality from the previous implementation.

The integration will be done incrementally with thorough testing to ensure a stable and reliable final product.

## Next Steps

1. Begin detailed analysis of each `swissknife_old` component
2. Create detailed specifications for each component integration
3. Implement the first phase of integration (models)
4. Schedule regular review meetings to track progress

## Resources

- Current architecture documentation: `docs/CODE_ARCHITECTURE.md`
- API key management: `docs/API_KEY_MANAGEMENT.md`
- Testing guidelines: `test/README.md`
- Contribution guidelines: `docs/CONTRIBUTING.md`
