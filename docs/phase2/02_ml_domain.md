# Phase 2: ML Domain Implementation

**Timeline:** Week 5-6 of Phase 2 (Aligned with Roadmap)

This document outlines the implementation plan for the core Machine Learning (ML) domain components within SwissKnife during Phase 2. The focus is on establishing the infrastructure needed to load and execute ML models (particularly for inference) within the Node.js CLI environment, including tensor handling and leveraging available hardware acceleration.

## Goals

-   Implement a basic `Tensor` representation suitable for Node.js ML libraries.
-   Develop a `HardwareManager` or similar mechanism to detect available Node.js execution providers (CPU, CUDA, DirectML via ONNX Runtime, etc.), replacing browser-specific concepts like WebGPU/WebNN.
-   Create an `MLEngine` (or `InferenceEngine`) service responsible for loading models (e.g., ONNX format) and running inference using appropriate Node.js runtimes (`onnxruntime-node`, `tensorflow.js-node`) and detected hardware capabilities.
-   Integrate the `MLEngine` with the `ModelRegistry` and `StorageService` for model loading.
-   *Defer advanced optimization (quantization, pruning) to later phases or specific needs.*

## Implementation Details

### 1. Tensor Representation (`src/ml/tensor.ts`) (Day 1)

-   **Leverage Existing Libraries:** Instead of a custom `Tensor` class, primarily rely on the tensor representations provided by the chosen Node.js ML runtime libraries (e.g., `onnxruntime-node`'s `Ort.Tensor`, `tensorflow.js-node`'s `tf.Tensor`).
-   **Type Definitions:** Define common interfaces or type aliases (`TensorData`, potentially a wrapper `AppTensor` type if needed for abstraction) for passing tensor information (data, shape, dtype) between components.
-   **Utility Functions:** Create utility functions (`src/ml/tensor-utils.ts`) for common tasks like:
    -   Converting between library-specific tensors and standard `TypedArray`/`Array`.
    -   Basic shape validation or manipulation if not adequately covered by the library.
    -   *Avoid reimplementing complex math operations; use the runtime library's capabilities.*

### 2. Hardware Capability Detection (`src/ml/hardware.ts`) (Day 2)

-   **`HardwareManager` Service:**
    -   Purpose: Detect available hardware and corresponding execution providers supported by the chosen ML runtime(s) (e.g., `onnxruntime-node`).
    -   `detectCapabilities()`: Asynchronously checks for:
        -   CPU features (AVX, etc. - potentially via `systeminformation`).
        -   Presence and usability of GPU execution providers (e.g., attempt to load `onnxruntime-node` with CUDA or DirectML options, check for required drivers/libraries).
    -   `getAvailableProviders()`: Returns a list of available provider IDs (e.g., `['cpu', 'cuda', 'directml']`) based on detection results.
    -   `getPreferredProvider(hints?: HardwareHints)`: Selects the best available provider based on detection and optional user hints (e.g., prefer GPU).
-   **Remove Browser Concepts:** Eliminate abstractions based on WebGPU/WebNN. Focus directly on Node.js runtime capabilities (ONNX Runtime Execution Providers, TFJS Node backends).

### 3. ML Engine / Inference Service (`src/ml/engine.ts`) (Day 3-6)

-   **`MLEngine` Service:**
    -   Constructor takes `HardwareManager`, `StorageService`, `ConfigurationManager`.
    -   `loadModel(modelPathOrId: string, options?: ModelLoadOptions)`:
        -   Resolves `modelPathOrId` (potentially using `ModelRegistry` or direct path via `StorageService`).
        -   Loads the model file (e.g., `.onnx`) from storage.
        -   Initializes the ML runtime session (e.g., `Ort.InferenceSession.create`) using the appropriate execution providers determined via `HardwareManager` and `options`.
        -   Stores the loaded session internally, keyed by an ID.
    -   `runInference(modelId: string, inputs: InputTensors)`:
        -   Retrieves the loaded model session.
        -   Prepares input tensors in the format required by the runtime.
        -   Executes the inference using the session (`session.run(inputs)`).
        -   Processes and returns the output tensors.
    -   `unloadModel(modelId: string)`: Releases resources associated with a loaded model.
-   **Runtime Integration:** Focus initially on one runtime, likely `onnxruntime-node` due to its broad support and performance.
-   **Input/Output Handling:** Implement basic pre/post-processing logic if needed (e.g., converting data to/from the runtime's tensor format). More complex pipelines might be handled outside the core engine.

### 4. Model Optimization (Deferred)

-   Initial implementation will focus on loading and running pre-optimized models (e.g., standard ONNX format).
-   Implementing quantization or pruning *within* SwissKnife is complex and deferred beyond Phase 2 unless a critical need arises. Users would typically use external tools to optimize models before loading them.

## Key Interfaces (Node.js Focus)

```typescript
// src/types/ml.ts or relevant domain files

/** Represents basic tensor data for inter-component communication. */
export interface TensorData {
  /** Raw data buffer. */
  data: Float32Array | Int32Array | Uint8Array | etc; // Use appropriate TypedArray
  /** Shape of the tensor. */
  shape: readonly number[];
  /** Data type string (e.g., 'float32', 'int32'). */
  dtype: string;
}

/** Input tensors for inference, typically a map keyed by input name. */
export type InputTensors = Record<string, TensorData>; // Or use library-specific Tensor type

/** Output tensors from inference, typically a map keyed by output name. */
export type OutputTensors = Record<string, TensorData>; // Or use library-specific Tensor type

// src/ml/hardware.ts

/** Hints for selecting hardware providers. */
export interface HardwareHints {
  prefer?: 'cpu' | 'gpu';
}

/** Information about detected hardware capabilities relevant to ML runtimes. */
export interface HardwareInfo {
  /** List of available ONNX Runtime execution providers (e.g., 'cpu', 'cuda', 'directml'). */
  onnxExecutionProviders: string[];
  // Add info for other runtimes like TFJS Node backends if supported
}

/** Service for detecting hardware capabilities. */
export interface HardwareManager {
  /** Detects available capabilities asynchronously. */
  detectCapabilities(): Promise<HardwareInfo>;
  /** Gets the currently detected capabilities (cached). */
  getCapabilities(): HardwareInfo | null;
  /** Gets a list of available provider IDs based on detection. */
  getAvailableProviders(): string[];
  /** Selects the best provider based on availability and hints. */
  getPreferredProvider(hints?: HardwareHints): string; // Returns provider ID
}

// src/ml/engine.ts

/** Options for loading a model. */
export interface ModelLoadOptions {
  /** Preferred execution provider(s) (e.g., ['cuda', 'cpu']). */
  executionProviders?: string[];
  // Add other runtime-specific options (interOpNumThreads, etc.)
}

/** Represents a loaded model session (runtime-specific). */
type LoadedModel = any; // e.g., Ort.InferenceSession | tf.GraphModel

/** Service for loading models and running inference. */
export interface MLEngine {
  /** Loads a model from a given path or identifier. */
  loadModel(modelPathOrId: string, options?: ModelLoadOptions): Promise<{ modelId: string }>;
  /** Unloads a previously loaded model. */
  unloadModel(modelId: string): Promise<void>;
  /** Runs inference using a loaded model. */
  runInference(modelId: string, inputs: InputTensors): Promise<OutputTensors>;
  /** Gets information about the hardware detected by the HardwareManager. */
  getHardwareInfo(): HardwareInfo | null;
}

// Model type from AI domain (src/models/types.ts) - ensure it exists
export interface Model {
  id: string;
  // ... other properties
}

```

## Deliverables

-   Utility functions or types for basic Tensor data handling (`TensorData`).
-   `HardwareManager` service capable of detecting CPU and potentially GPU execution providers via `onnxruntime-node` (or chosen runtime).
-   Functional `MLEngine` service capable of:
    -   Loading an ONNX model from the filesystem (via `StorageService`).
    -   Running inference using `onnxruntime-node` on the preferred available provider (CPU required, GPU optional).
-   Integration points for `MLEngine` within `ExecutionContext` or relevant services.
-   Unit tests for `HardwareManager` detection logic (may require mocking).
-   Integration tests for `MLEngine` loading and running a simple ONNX model (e.g., MNIST, basic math model) on CPU.
