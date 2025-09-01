/**
 * 🚀 GPU Worker - High-Performance GPU Computing with WebGPU
 * 
 * Features:
 * - WebGPU accelerated computations
 * - Parallel processing with compute shaders
 * - GPU-accelerated AI inference
 * - Graphics processing and effects
 * - Scientific computing on GPU
 * - Collaborative GPU task distribution
 */

let workerId = '';
let gpuDevice = null;
let gpuCapabilities = {
  hasWebGPU: false,
  hasWebGL: false,
  deviceType: 'unknown',
  limits: {},
  features: [],
  supportedShaderFormats: []
};

/**
 * Initialize GPU worker with WebGPU capabilities
 */
async function initialize(config) {
  workerId = config.workerId;
  
  console.log(`🚀 GPU worker ${workerId} initializing...`);
  
  // Try to initialize WebGPU
  if ('gpu' in navigator) {
    try {
      const adapter = await navigator.gpu.requestAdapter({
        powerPreference: 'high-performance'
      });
      
      if (adapter) {
        // Get device info
        const adapterInfo = await adapter.requestAdapterInfo();
        
        // Request device with all available features
        const requiredFeatures = [];
        if (adapter.features.has('shader-f16')) requiredFeatures.push('shader-f16');
        if (adapter.features.has('timestamp-query')) requiredFeatures.push('timestamp-query');
        
        gpuDevice = await adapter.requestDevice({
          requiredFeatures,
          requiredLimits: {
            maxComputeWorkgroupStorageSize: Math.min(adapter.limits.maxComputeWorkgroupStorageSize, 32768),
            maxComputeInvocationsPerWorkgroup: Math.min(adapter.limits.maxComputeInvocationsPerWorkgroup, 256),
            maxComputeWorkgroupSizeX: Math.min(adapter.limits.maxComputeWorkgroupSizeX, 256)
          }
        });
        
        gpuCapabilities = {
          hasWebGPU: true,
          hasWebGL: false,
          deviceType: adapterInfo.device || 'unknown',
          vendor: adapterInfo.vendor || 'unknown',
          architecture: adapterInfo.architecture || 'unknown',
          limits: adapter.limits,
          features: Array.from(adapter.features),
          supportedShaderFormats: ['wgsl']
        };
        
        console.log(`✅ WebGPU initialized successfully`);
        console.log(`   Device: ${gpuCapabilities.vendor} ${gpuCapabilities.deviceType}`);
        console.log(`   Features: ${gpuCapabilities.features.join(', ')}`);
        
        // Set up error handling
        gpuDevice.addEventListener('uncapturederror', (event) => {
          console.error('GPU uncaptured error:', event.error);
        });
        
      } else {
        console.warn('❌ No WebGPU adapter available');
      }
    } catch (error) {
      console.error('❌ WebGPU initialization failed:', error);
    }
  }
  
  // Fallback to WebGL if WebGPU is not available
  if (!gpuCapabilities.hasWebGPU) {
    try {
      const canvas = new OffscreenCanvas(1, 1);
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      
      if (gl) {
        gpuCapabilities.hasWebGL = true;
        gpuCapabilities.supportedShaderFormats.push('glsl');
        console.log('✅ WebGL available as fallback');
      }
    } catch (error) {
      console.error('❌ WebGL initialization failed:', error);
    }
  }
  
  return {
    capabilities: gpuCapabilities,
    workerId
  };
}

/**
 * Process GPU tasks
 */
async function processTask(taskType, data) {
  const startTime = performance.now();
  
  if (!gpuCapabilities.hasWebGPU && !gpuCapabilities.hasWebGL) {
    throw new Error('No GPU capabilities available');
  }
  
  let result;
  
  switch (taskType) {
    case 'compute-shader':
      result = await runComputeShader(data);
      break;
    
    case 'matrix-multiply-gpu':
      result = await matrixMultiplyGPU(data);
      break;
    
    case 'parallel-reduction':
      result = await parallelReduction(data);
      break;
    
    case 'image-processing-gpu':
      result = await processImageGPU(data);
      break;
    
    case 'neural-network-gpu':
      result = await runNeuralNetworkGPU(data);
      break;
    
    case 'fft-gpu':
      result = await computeFFTGPU(data);
      break;
    
    case 'monte-carlo-gpu':
      result = await monteCarloGPU(data);
      break;
    
    case 'particle-simulation':
      result = await simulateParticlesGPU(data);
      break;
    
    default:
      throw new Error(`Unknown GPU task type: ${taskType}`);
  }
  
  const computeTime = performance.now() - startTime;
  
  return {
    ...result,
    computeTime,
    usedGPU: gpuCapabilities.hasWebGPU,
    workerId,
    timestamp: Date.now()
  };
}

/**
 * Run custom compute shader
 */
async function runComputeShader(data) {
  const { shaderCode, buffers, workgroupSize = [64, 1, 1], dispatch = [1, 1, 1] } = data;
  
  if (!gpuDevice) {
    throw new Error('WebGPU device not available');
  }
  
  console.log(`🧮 Running compute shader with workgroup size ${workgroupSize.join('x')}`);
  
  // Create shader module
  const shaderModule = gpuDevice.createShaderModule({
    code: shaderCode
  });
  
  // Create compute pipeline
  const computePipeline = gpuDevice.createComputePipeline({
    layout: 'auto',
    compute: {
      module: shaderModule,
      entryPoint: 'main'
    }
  });
  
  // Create buffers
  const gpuBuffers = [];
  const stagingBuffers = [];
  
  for (let i = 0; i < buffers.length; i++) {
    const buffer = buffers[i];
    const size = buffer.data.byteLength;
    
    // Create GPU buffer
    const gpuBuffer = gpuDevice.createBuffer({
      size,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
    });
    
    // Create staging buffer for reading results
    const stagingBuffer = gpuDevice.createBuffer({
      size,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
    });
    
    // Write initial data
    gpuDevice.queue.writeBuffer(gpuBuffer, 0, buffer.data);
    
    gpuBuffers.push(gpuBuffer);
    stagingBuffers.push(stagingBuffer);
  }
  
  // Create bind group
  const bindGroup = gpuDevice.createBindGroup({
    layout: computePipeline.getBindGroupLayout(0),
    entries: gpuBuffers.map((buffer, index) => ({
      binding: index,
      resource: { buffer }
    }))
  });
  
  // Create command encoder
  const commandEncoder = gpuDevice.createCommandEncoder();
  
  // Compute pass
  const computePass = commandEncoder.beginComputePass();
  computePass.setPipeline(computePipeline);
  computePass.setBindGroup(0, bindGroup);
  computePass.dispatchWorkgroups(dispatch[0], dispatch[1], dispatch[2]);
  computePass.end();
  
  // Copy results to staging buffers
  for (let i = 0; i < gpuBuffers.length; i++) {
    commandEncoder.copyBufferToBuffer(
      gpuBuffers[i], 0,
      stagingBuffers[i], 0,
      buffers[i].data.byteLength
    );
  }
  
  // Submit and wait
  gpuDevice.queue.submit([commandEncoder.finish()]);
  
  // Read results
  const results = [];
  for (let i = 0; i < stagingBuffers.length; i++) {
    await stagingBuffers[i].mapAsync(GPUMapMode.READ);
    const arrayBuffer = stagingBuffers[i].getMappedRange();
    
    // Copy data based on buffer type
    let resultData;
    if (buffers[i].type === 'float32') {
      resultData = new Float32Array(arrayBuffer.slice());
    } else if (buffers[i].type === 'uint32') {
      resultData = new Uint32Array(arrayBuffer.slice());
    } else {
      resultData = new ArrayBuffer(arrayBuffer.byteLength);
      new Uint8Array(resultData).set(new Uint8Array(arrayBuffer));
    }
    
    results.push(resultData);
    stagingBuffers[i].unmap();
  }
  
  return {
    results,
    workgroupsDispatched: dispatch[0] * dispatch[1] * dispatch[2]
  };
}

/**
 * GPU-accelerated matrix multiplication
 */
async function matrixMultiplyGPU(data) {
  const { matrixA, matrixB } = data;
  
  if (!gpuDevice) {
    throw new Error('WebGPU device not available');
  }
  
  const M = matrixA.length;      // Rows in A
  const N = matrixB[0].length;   // Columns in B
  const K = matrixA[0].length;   // Columns in A / Rows in B
  
  console.log(`🔢 GPU matrix multiply: ${M}x${K} × ${K}x${N} = ${M}x${N}`);
  
  // Convert matrices to flat arrays
  const flatA = new Float32Array(M * K);
  const flatB = new Float32Array(K * N);
  
  for (let i = 0; i < M; i++) {
    for (let j = 0; j < K; j++) {
      flatA[i * K + j] = matrixA[i][j];
    }
  }
  
  for (let i = 0; i < K; i++) {
    for (let j = 0; j < N; j++) {
      flatB[i * N + j] = matrixB[i][j];
    }
  }
  
  const resultSize = M * N;
  const flatResult = new Float32Array(resultSize);
  
  // Create matrix multiplication shader
  const shaderCode = `
    @group(0) @binding(0) var<storage, read> matrixA: array<f32>;
    @group(0) @binding(1) var<storage, read> matrixB: array<f32>;
    @group(0) @binding(2) var<storage, read_write> result: array<f32>;
    @group(0) @binding(3) var<uniform> dimensions: vec3<u32>; // M, N, K
    
    @compute @workgroup_size(16, 16)
    fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
      let row = global_id.x;
      let col = global_id.y;
      let M = dimensions.x;
      let N = dimensions.y;
      let K = dimensions.z;
      
      if (row >= M || col >= N) {
        return;
      }
      
      var sum = 0.0;
      for (var k = 0u; k < K; k++) {
        sum += matrixA[row * K + k] * matrixB[k * N + col];
      }
      
      result[row * N + col] = sum;
    }
  `;
  
  // Create dimensions buffer
  const dimensionsArray = new Uint32Array([M, N, K]);
  
  const result = await runComputeShader({
    shaderCode,
    buffers: [
      { data: flatA.buffer, type: 'float32' },
      { data: flatB.buffer, type: 'float32' },
      { data: flatResult.buffer, type: 'float32' },
      { data: dimensionsArray.buffer, type: 'uint32' }
    ],
    workgroupSize: [16, 16, 1],
    dispatch: [Math.ceil(M / 16), Math.ceil(N / 16), 1]
  });
  
  // Convert result back to 2D matrix
  const resultMatrix = [];
  const flatRes = result.results[2];
  
  for (let i = 0; i < M; i++) {
    resultMatrix[i] = [];
    for (let j = 0; j < N; j++) {
      resultMatrix[i][j] = flatRes[i * N + j];
    }
  }
  
  return {
    result: resultMatrix,
    dimensions: { M, N, K },
    flops: 2 * M * N * K // Floating point operations
  };
}

/**
 * Parallel reduction on GPU
 */
async function parallelReduction(data) {
  const { array, operation = 'sum' } = data;
  
  if (!gpuDevice) {
    throw new Error('WebGPU device not available');
  }
  
  console.log(`📊 GPU parallel reduction (${operation}) on ${array.length} elements`);
  
  let shaderCode;
  switch (operation) {
    case 'sum':
      shaderCode = `
        @group(0) @binding(0) var<storage, read> input: array<f32>;
        @group(0) @binding(1) var<storage, read_write> output: array<f32>;
        
        var<workgroup> temp: array<f32, 256>;
        
        @compute @workgroup_size(256)
        fn main(@builtin(local_invocation_id) local_id: vec3<u32>, 
               @builtin(global_invocation_id) global_id: vec3<u32>,
               @builtin(workgroup_id) workgroup_id: vec3<u32>) {
          let tid = local_id.x;
          let gid = global_id.x;
          
          // Load data into shared memory
          temp[tid] = select(0.0, input[gid], gid < arrayLength(&input));
          workgroupBarrier();
          
          // Reduction in shared memory
          var stride = 128u;
          while (stride > 0u) {
            if (tid < stride) {
              temp[tid] += temp[tid + stride];
            }
            workgroupBarrier();
            stride /= 2u;
          }
          
          // Write result
          if (tid == 0u) {
            output[workgroup_id.x] = temp[0];
          }
        }
      `;
      break;
    
    case 'max':
      shaderCode = `
        @group(0) @binding(0) var<storage, read> input: array<f32>;
        @group(0) @binding(1) var<storage, read_write> output: array<f32>;
        
        var<workgroup> temp: array<f32, 256>;
        
        @compute @workgroup_size(256)
        fn main(@builtin(local_invocation_id) local_id: vec3<u32>, 
               @builtin(global_invocation_id) global_id: vec3<u32>,
               @builtin(workgroup_id) workgroup_id: vec3<u32>) {
          let tid = local_id.x;
          let gid = global_id.x;
          
          temp[tid] = select(-3.40282347e+38, input[gid], gid < arrayLength(&input));
          workgroupBarrier();
          
          var stride = 128u;
          while (stride > 0u) {
            if (tid < stride) {
              temp[tid] = max(temp[tid], temp[tid + stride]);
            }
            workgroupBarrier();
            stride /= 2u;
          }
          
          if (tid == 0u) {
            output[workgroup_id.x] = temp[0];
          }
        }
      `;
      break;
    
    default:
      throw new Error(`Unsupported reduction operation: ${operation}`);
  }
  
  const inputArray = new Float32Array(array);
  const workgroups = Math.ceil(array.length / 256);
  const outputArray = new Float32Array(workgroups);
  
  const result = await runComputeShader({
    shaderCode,
    buffers: [
      { data: inputArray.buffer, type: 'float32' },
      { data: outputArray.buffer, type: 'float32' }
    ],
    workgroupSize: [256, 1, 1],
    dispatch: [workgroups, 1, 1]
  });
  
  // Final reduction on CPU for partial results
  const partialResults = result.results[1];
  let finalResult = partialResults[0];
  
  for (let i = 1; i < partialResults.length; i++) {
    if (operation === 'sum') {
      finalResult += partialResults[i];
    } else if (operation === 'max') {
      finalResult = Math.max(finalResult, partialResults[i]);
    }
  }
  
  return {
    result: finalResult,
    operation,
    inputSize: array.length,
    workgroupsUsed: workgroups
  };
}

/**
 * GPU-accelerated image processing
 */
async function processImageGPU(data) {
  const { imageData, filter, parameters = {} } = data;
  
  if (!gpuDevice) {
    throw new Error('WebGPU device not available');
  }
  
  console.log(`🖼️ GPU image processing: ${filter} (${imageData.width}x${imageData.height})`);
  
  const width = imageData.width;
  const height = imageData.height;
  const inputPixels = new Uint8Array(imageData.data);
  const outputPixels = new Uint8Array(inputPixels.length);
  
  let shaderCode;
  switch (filter) {
    case 'blur':
      const radius = parameters.radius || 5;
      shaderCode = `
        @group(0) @binding(0) var<storage, read> input: array<u32>;
        @group(0) @binding(1) var<storage, read_write> output: array<u32>;
        @group(0) @binding(2) var<uniform> dimensions: vec2<u32>;
        
        @compute @workgroup_size(16, 16)
        fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
          let x = global_id.x;
          let y = global_id.y;
          let width = dimensions.x;
          let height = dimensions.y;
          
          if (x >= width || y >= height) {
            return;
          }
          
          var sum = vec4<f32>(0.0);
          var count = 0.0;
          let radius = ${radius}u;
          
          for (var dy = -i32(radius); dy <= i32(radius); dy++) {
            for (var dx = -i32(radius); dx <= i32(radius); dx++) {
              let nx = i32(x) + dx;
              let ny = i32(y) + dy;
              
              if (nx >= 0 && nx < i32(width) && ny >= 0 && ny < i32(height)) {
                let idx = u32(ny) * width + u32(nx);
                let pixel = input[idx];
                
                let r = f32((pixel >> 0u) & 0xFFu);
                let g = f32((pixel >> 8u) & 0xFFu);
                let b = f32((pixel >> 16u) & 0xFFu);
                let a = f32((pixel >> 24u) & 0xFFu);
                
                sum += vec4<f32>(r, g, b, a);
                count += 1.0;
              }
            }
          }
          
          sum /= count;
          
          let result = (u32(sum.a) << 24u) | (u32(sum.b) << 16u) | (u32(sum.g) << 8u) | u32(sum.r);
          output[y * width + x] = result;
        }
      `;
      break;
    
    case 'edge':
      shaderCode = `
        @group(0) @binding(0) var<storage, read> input: array<u32>;
        @group(0) @binding(1) var<storage, read_write> output: array<u32>;
        @group(0) @binding(2) var<uniform> dimensions: vec2<u32>;
        
        @compute @workgroup_size(16, 16)
        fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
          let x = global_id.x;
          let y = global_id.y;
          let width = dimensions.x;
          let height = dimensions.y;
          
          if (x >= width || y >= height || x == 0u || y == 0u || x == width - 1u || y == height - 1u) {
            output[y * width + x] = 0u;
            return;
          }
          
          // Sobel edge detection
          var gx = 0.0;
          var gy = 0.0;
          
          for (var dy = -1; dy <= 1; dy++) {
            for (var dx = -1; dx <= 1; dx++) {
              let idx = (i32(y) + dy) * i32(width) + (i32(x) + dx);
              let pixel = input[idx];
              let gray = (f32((pixel >> 0u) & 0xFFu) + f32((pixel >> 8u) & 0xFFu) + f32((pixel >> 16u) & 0xFFu)) / 3.0;
              
              // Sobel X kernel: -1 0 1, -2 0 2, -1 0 1
              // Sobel Y kernel: -1 -2 -1, 0 0 0, 1 2 1
              let sobelX = f32(dx);
              let sobelY = f32(dy);
              
              if (dy == 0) {
                gx += gray * sobelX * 2.0;
              } else {
                gx += gray * sobelX;
              }
              
              if (dx == 0) {
                gy += gray * sobelY * 2.0;
              } else {
                gy += gray * sobelY;
              }
            }
          }
          
          let magnitude = sqrt(gx * gx + gy * gy);
          let edge = u32(clamp(magnitude, 0.0, 255.0));
          
          output[y * width + x] = (255u << 24u) | (edge << 16u) | (edge << 8u) | edge;
        }
      `;
      break;
    
    default:
      throw new Error(`Unsupported image filter: ${filter}`);
  }
  
  // Convert RGBA to packed uint32
  const inputUint32 = new Uint32Array(width * height);
  for (let i = 0; i < inputUint32.length; i++) {
    const base = i * 4;
    inputUint32[i] = (inputPixels[base + 3] << 24) | 
                    (inputPixels[base + 2] << 16) | 
                    (inputPixels[base + 1] << 8) | 
                    inputPixels[base];
  }
  
  const outputUint32 = new Uint32Array(width * height);
  const dimensionsArray = new Uint32Array([width, height]);
  
  const result = await runComputeShader({
    shaderCode,
    buffers: [
      { data: inputUint32.buffer, type: 'uint32' },
      { data: outputUint32.buffer, type: 'uint32' },
      { data: dimensionsArray.buffer, type: 'uint32' }
    ],
    workgroupSize: [16, 16, 1],
    dispatch: [Math.ceil(width / 16), Math.ceil(height / 16), 1]
  });
  
  // Convert back to RGBA
  const resultUint32 = result.results[1];
  const resultPixels = new Uint8ClampedArray(width * height * 4);
  
  for (let i = 0; i < resultUint32.length; i++) {
    const packed = resultUint32[i];
    const base = i * 4;
    resultPixels[base] = packed & 0xFF;         // R
    resultPixels[base + 1] = (packed >> 8) & 0xFF;  // G
    resultPixels[base + 2] = (packed >> 16) & 0xFF; // B
    resultPixels[base + 3] = (packed >> 24) & 0xFF; // A
  }
  
  return {
    imageData: {
      data: resultPixels,
      width,
      height
    },
    filter,
    parameters
  };
}

// Worker message handling
self.onmessage = async function(event) {
  const { type, taskId, data } = event.data;
  
  try {
    let result;
    
    switch (type) {
      case 'init':
        result = await initialize(data);
        break;
      
      case 'task':
        result = await processTask(data.taskType, data.data);
        break;
      
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
    
    self.postMessage({
      type: 'task-completed',
      taskId,
      result
    });
    
  } catch (error) {
    console.error('GPU worker error:', error);
    
    self.postMessage({
      type: 'task-completed',
      taskId,
      error: error.message
    });
  }
};