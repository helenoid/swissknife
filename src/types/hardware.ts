/**
 * Defines types related to hardware capabilities and abstraction layers,
 * based on the ipfs_accelerate_js integration plan.
 */

/**
 * Represents a hardware backend available for computation.
 */
export interface HardwareBackend {
  id: string; // Unique identifier (e.g., 'webgpu', 'webnn', 'wasm', 'cpu')
  name: string; // Human-readable name (e.g., 'WebGPU', 'WebNN (CPU)', 'WebAssembly SIMD')
  priority: number; // Order of preference for selection (lower is higher priority)
  isAvailable: boolean; // Whether the backend was successfully initialized/detected
  capabilities: string[]; // List of features supported (e.g., 'fp16', 'int8', 'specific_ops')
}

/**
 * Represents detected capabilities of the browser environment.
 */
export interface BrowserCapabilities {
  webgpuSupported: boolean;
  webnnSupported: boolean;
  wasmSupported: boolean;
  deviceMemoryGB: number; // Estimated device memory
  browser: string; // Detected browser name ('chrome', 'firefox', etc.)
  hardwareConcurrency: number; // Number of logical CPU cores
}

/**
 * Options for configuring the HardwareAbstraction layer.
 */
export interface HardwareAbstractionOptions {
  preferredBackends?: string[]; // Order of backend preference (e.g., ['webgpu', 'webnn'])
  enableLogging?: boolean; // Enable detailed logging during detection/selection
  webgpuOptions?: {
    shaderPrecompilation?: boolean; // Hint to precompile shaders if possible
    workgroupSize?: number[]; // Preferred workgroup size
    // Add other WebGPU specific options as needed
  };
  webnnOptions?: {
    devicePreference?: 'gpu' | 'cpu'; // Prefer GPU or CPU for WebNN
    // Add other WebNN specific options as needed
  };
  // Add options for other backends (WASM, CPU) if necessary
}

// Add other hardware-related types as needed for the abstraction layer.
