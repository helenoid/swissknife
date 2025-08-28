/**
 * IPFS Accelerate JavaScript SDK - Simplified Entry Point
 * Hardware-accelerated machine learning in the browser
 */

// Core exports
export interface AcceleratorConfig {
  preferredDevice?: 'webgpu' | 'webgl' | 'cpu';
  enableOptimizations?: boolean;
  memoryLimit?: number;
}

export interface TensorInfo {
  shape: number[];
  dtype: string;
  size: number;
}

export class IPFSAccelerator {
  private config: AcceleratorConfig;
  
  constructor(config: AcceleratorConfig = {}) {
    this.config = {
      preferredDevice: 'webgpu',
      enableOptimizations: true,
      memoryLimit: 2048,
      ...config
    };
  }
  
  async initialize(): Promise<boolean> {
    console.log('IPFS Accelerator initializing...');
    // WebGPU detection
    if (this.config.preferredDevice === 'webgpu' && navigator.gpu) {
      try {
        const adapter = await navigator.gpu.requestAdapter();
        if (adapter) {
          console.log('WebGPU acceleration available');
          return true;
        }
      } catch (error) {
        console.warn('WebGPU initialization failed:', error);
      }
    }
    
    // Fallback to WebGL/CPU
    console.log('Using fallback acceleration');
    return true;
  }
  
  async loadModel(modelUrl: string): Promise<any> {
    console.log(`Loading model from: ${modelUrl}`);
    // Model loading logic will be implemented
    return { modelLoaded: true, url: modelUrl };
  }
  
  async runInference(input: any): Promise<any> {
    console.log('Running inference...');
    // Inference logic will be implemented
    return { result: 'inference_complete', input };
  }
  
  getDeviceInfo(): string {
    return `IPFS Accelerator - Device: ${this.config.preferredDevice}`;
  }
}

// WebGPU utilities
export const detectWebGPUSupport = async (): Promise<boolean> => {
  if (!navigator.gpu) return false;
  
  try {
    const adapter = await navigator.gpu.requestAdapter();
    return !!adapter;
  } catch {
    return false;
  }
};

// Export main class as default
export default IPFSAccelerator;