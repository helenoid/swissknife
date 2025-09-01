/**
 * ⚡ Compute Worker - High-Performance Computing for Distributed Processing
 * 
 * Features:
 * - Heavy mathematical computations
 * - Parallel processing algorithms
 * - Cryptographic operations
 * - Data analysis and statistics
 * - Scientific computing tasks
 * - Background processing for applications
 */

let workerId = '';
let computeCapabilities = {
  maxArraySize: 0,
  supportedOperations: [],
  estimatedPerformance: 0
};

/**
 * Initialize compute worker
 */
async function initialize(config) {
  workerId = config.workerId;
  
  console.log(`⚡ Compute worker ${workerId} initializing...`);
  
  // Benchmark system capabilities
  await benchmarkCapabilities();
  
  computeCapabilities.supportedOperations = [
    'matrix-operations',
    'statistical-analysis',
    'cryptographic-operations',
    'numerical-integration',
    'optimization',
    'signal-processing',
    'data-transformation',
    'parallel-algorithms'
  ];
  
  return {
    capabilities: computeCapabilities,
    workerId
  };
}

/**
 * Benchmark system performance
 */
async function benchmarkCapabilities() {
  const startTime = performance.now();
  
  // Perform benchmark computation (matrix multiplication)
  const size = 100;
  const a = createRandomMatrix(size, size);
  const b = createRandomMatrix(size, size);
  const result = matrixMultiply(a, b);
  
  const endTime = performance.now();
  const computeTime = endTime - startTime;
  
  computeCapabilities.estimatedPerformance = 1000 / computeTime; // Operations per second
  computeCapabilities.maxArraySize = Math.floor(1000000 / computeTime); // Estimated max array size
  
  console.log(`📊 Benchmark complete: ${computeCapabilities.estimatedPerformance.toFixed(2)} ops/sec`);
}

/**
 * Process compute tasks
 */
async function processTask(taskType, data) {
  const startTime = performance.now();
  
  let result;
  
  switch (taskType) {
    case 'matrix-operations':
      result = await performMatrixOperations(data);
      break;
    
    case 'statistical-analysis':
      result = await performStatisticalAnalysis(data);
      break;
    
    case 'cryptographic-operations':
      result = await performCryptographicOperations(data);
      break;
    
    case 'numerical-integration':
      result = await performNumericalIntegration(data);
      break;
    
    case 'optimization':
      result = await performOptimization(data);
      break;
    
    case 'signal-processing':
      result = await performSignalProcessing(data);
      break;
    
    case 'data-transformation':
      result = await performDataTransformation(data);
      break;
    
    case 'parallel-algorithms':
      result = await performParallelAlgorithms(data);
      break;
    
    case 'monte-carlo':
      result = await performMonteCarloSimulation(data);
      break;
    
    case 'fourier-transform':
      result = await performFourierTransform(data);
      break;
    
    default:
      throw new Error(`Unknown compute task type: ${taskType}`);
  }
  
  const computeTime = performance.now() - startTime;
  
  return {
    ...result,
    computeTime,
    workerId,
    timestamp: Date.now()
  };
}

/**
 * Perform matrix operations
 */
async function performMatrixOperations(data) {
  const { operation, matrices, options = {} } = data;
  
  console.log(`🔢 Performing matrix operation: ${operation}`);
  
  switch (operation) {
    case 'multiply':
      return {
        result: matrixMultiply(matrices.a, matrices.b),
        operation: 'multiply'
      };
    
    case 'add':
      return {
        result: matrixAdd(matrices.a, matrices.b),
        operation: 'add'
      };
    
    case 'transpose':
      return {
        result: matrixTranspose(matrices.a),
        operation: 'transpose'
      };
    
    case 'inverse':
      return {
        result: matrixInverse(matrices.a),
        operation: 'inverse'
      };
    
    case 'eigenvalues':
      return {
        result: computeEigenvalues(matrices.a),
        operation: 'eigenvalues'
      };
    
    case 'lu-decomposition':
      return {
        result: luDecomposition(matrices.a),
        operation: 'lu-decomposition'
      };
    
    default:
      throw new Error(`Unknown matrix operation: ${operation}`);
  }
}

/**
 * Matrix multiplication
 */
function matrixMultiply(a, b) {
  const rows = a.length;
  const cols = b[0].length;
  const shared = a[0].length;
  
  if (shared !== b.length) {
    throw new Error('Matrix dimensions incompatible');
  }
  
  const result = [];
  
  for (let i = 0; i < rows; i++) {
    result[i] = [];
    for (let j = 0; j < cols; j++) {
      let sum = 0;
      for (let k = 0; k < shared; k++) {
        sum += a[i][k] * b[k][j];
      }
      result[i][j] = sum;
    }
  }
  
  return result;
}

/**
 * Matrix addition
 */
function matrixAdd(a, b) {
  if (a.length !== b.length || a[0].length !== b[0].length) {
    throw new Error('Matrix dimensions must match');
  }
  
  return a.map((row, i) => row.map((val, j) => val + b[i][j]));
}

/**
 * Matrix transpose
 */
function matrixTranspose(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const result = [];
  
  for (let j = 0; j < cols; j++) {
    result[j] = [];
    for (let i = 0; i < rows; i++) {
      result[j][i] = matrix[i][j];
    }
  }
  
  return result;
}

/**
 * Matrix inverse (using Gauss-Jordan elimination)
 */
function matrixInverse(matrix) {
  const n = matrix.length;
  if (n !== matrix[0].length) {
    throw new Error('Matrix must be square');
  }
  
  // Create augmented matrix [A|I]
  const augmented = [];
  for (let i = 0; i < n; i++) {
    augmented[i] = [...matrix[i]];
    for (let j = 0; j < n; j++) {
      augmented[i][n + j] = i === j ? 1 : 0;
    }
  }
  
  // Gauss-Jordan elimination
  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
        maxRow = k;
      }
    }
    
    // Swap rows
    if (maxRow !== i) {
      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
    }
    
    // Check for singular matrix
    if (Math.abs(augmented[i][i]) < 1e-10) {
      throw new Error('Matrix is singular');
    }
    
    // Scale pivot row
    const pivot = augmented[i][i];
    for (let j = 0; j < 2 * n; j++) {
      augmented[i][j] /= pivot;
    }
    
    // Eliminate column
    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = augmented[k][i];
        for (let j = 0; j < 2 * n; j++) {
          augmented[k][j] -= factor * augmented[i][j];
        }
      }
    }
  }
  
  // Extract inverse matrix
  const inverse = [];
  for (let i = 0; i < n; i++) {
    inverse[i] = augmented[i].slice(n);
  }
  
  return inverse;
}

/**
 * Perform statistical analysis
 */
async function performStatisticalAnalysis(data) {
  const { operation, dataset, options = {} } = data;
  
  console.log(`📊 Performing statistical analysis: ${operation}`);
  
  switch (operation) {
    case 'descriptive':
      return computeDescriptiveStats(dataset);
    
    case 'correlation':
      return computeCorrelation(dataset.x, dataset.y);
    
    case 'regression':
      return performLinearRegression(dataset.x, dataset.y);
    
    case 'hypothesis-test':
      return performHypothesisTest(dataset, options);
    
    case 'distribution-fitting':
      return fitDistribution(dataset, options.distribution);
    
    default:
      throw new Error(`Unknown statistical operation: ${operation}`);
  }
}

/**
 * Compute descriptive statistics
 */
function computeDescriptiveStats(data) {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Invalid dataset');
  }
  
  const n = data.length;
  const sorted = [...data].sort((a, b) => a - b);
  
  const mean = data.reduce((sum, val) => sum + val, 0) / n;
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1);
  const stdDev = Math.sqrt(variance);
  
  const median = n % 2 === 0 
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
    : sorted[Math.floor(n / 2)];
  
  const mode = findMode(data);
  const range = sorted[n - 1] - sorted[0];
  const q1 = sorted[Math.floor(n * 0.25)];
  const q3 = sorted[Math.floor(n * 0.75)];
  const iqr = q3 - q1;
  
  return {
    count: n,
    mean,
    median,
    mode,
    standardDeviation: stdDev,
    variance,
    range,
    minimum: sorted[0],
    maximum: sorted[n - 1],
    q1,
    q3,
    iqr,
    skewness: computeSkewness(data, mean, stdDev),
    kurtosis: computeKurtosis(data, mean, stdDev)
  };
}

/**
 * Find mode of dataset
 */
function findMode(data) {
  const frequency = new Map();
  let maxFreq = 0;
  let mode = [];
  
  for (const value of data) {
    const freq = (frequency.get(value) || 0) + 1;
    frequency.set(value, freq);
    
    if (freq > maxFreq) {
      maxFreq = freq;
      mode = [value];
    } else if (freq === maxFreq && !mode.includes(value)) {
      mode.push(value);
    }
  }
  
  return mode.length === 1 ? mode[0] : mode;
}

/**
 * Compute skewness
 */
function computeSkewness(data, mean, stdDev) {
  const n = data.length;
  const skewSum = data.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 3), 0);
  return (n / ((n - 1) * (n - 2))) * skewSum;
}

/**
 * Compute kurtosis
 */
function computeKurtosis(data, mean, stdDev) {
  const n = data.length;
  const kurtSum = data.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 4), 0);
  return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * kurtSum - 
         (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
}

/**
 * Perform linear regression
 */
function performLinearRegression(x, y) {
  if (x.length !== y.length) {
    throw new Error('X and Y arrays must have same length');
  }
  
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Calculate R-squared
  const meanY = sumY / n;
  const totalSumSquares = y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0);
  const residualSumSquares = y.reduce((sum, yi, i) => {
    const predicted = slope * x[i] + intercept;
    return sum + Math.pow(yi - predicted, 2);
  }, 0);
  
  const rSquared = 1 - (residualSumSquares / totalSumSquares);
  const correlation = Math.sqrt(rSquared) * Math.sign(slope);
  
  return {
    slope,
    intercept,
    rSquared,
    correlation,
    equation: `y = ${slope.toFixed(4)}x + ${intercept.toFixed(4)}`
  };
}

/**
 * Perform cryptographic operations
 */
async function performCryptographicOperations(data) {
  const { operation, input, options = {} } = data;
  
  console.log(`🔐 Performing cryptographic operation: ${operation}`);
  
  switch (operation) {
    case 'hash':
      return await computeHash(input, options.algorithm || 'sha256');
    
    case 'encrypt':
      return await encrypt(input, options.key, options.algorithm || 'aes');
    
    case 'decrypt':
      return await decrypt(input, options.key, options.algorithm || 'aes');
    
    case 'generate-keypair':
      return await generateKeyPair(options.algorithm || 'rsa');
    
    case 'digital-signature':
      return await digitalSignature(input, options.privateKey);
    
    case 'verify-signature':
      return await verifySignature(input, options.signature, options.publicKey);
    
    default:
      throw new Error(`Unknown cryptographic operation: ${operation}`);
  }
}

/**
 * Compute cryptographic hash
 */
async function computeHash(input, algorithm) {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  
  let hashBuffer;
  switch (algorithm) {
    case 'sha1':
      hashBuffer = await crypto.subtle.digest('SHA-1', data);
      break;
    case 'sha256':
      hashBuffer = await crypto.subtle.digest('SHA-256', data);
      break;
    case 'sha384':
      hashBuffer = await crypto.subtle.digest('SHA-384', data);
      break;
    case 'sha512':
      hashBuffer = await crypto.subtle.digest('SHA-512', data);
      break;
    default:
      throw new Error(`Unsupported hash algorithm: ${algorithm}`);
  }
  
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return {
    algorithm,
    hash: hashHex,
    input: input.substring(0, 100) + (input.length > 100 ? '...' : '')
  };
}

/**
 * Perform Monte Carlo simulation
 */
async function performMonteCarloSimulation(data) {
  const { simulation, iterations = 10000, parameters = {} } = data;
  
  console.log(`🎲 Running Monte Carlo simulation: ${simulation} (${iterations} iterations)`);
  
  switch (simulation) {
    case 'pi-estimation':
      return estimatePi(iterations);
    
    case 'portfolio-risk':
      return simulatePortfolioRisk(parameters, iterations);
    
    case 'option-pricing':
      return simulateOptionPricing(parameters, iterations);
    
    case 'random-walk':
      return simulateRandomWalk(parameters, iterations);
    
    default:
      throw new Error(`Unknown simulation type: ${simulation}`);
  }
}

/**
 * Estimate Pi using Monte Carlo method
 */
function estimatePi(iterations) {
  let insideCircle = 0;
  
  for (let i = 0; i < iterations; i++) {
    const x = Math.random() * 2 - 1; // -1 to 1
    const y = Math.random() * 2 - 1; // -1 to 1
    
    if (x * x + y * y <= 1) {
      insideCircle++;
    }
  }
  
  const piEstimate = (insideCircle / iterations) * 4;
  const error = Math.abs(piEstimate - Math.PI);
  
  return {
    piEstimate,
    actualPi: Math.PI,
    error,
    errorPercentage: (error / Math.PI) * 100,
    iterations,
    pointsInside: insideCircle
  };
}

/**
 * Perform Fourier Transform
 */
async function performFourierTransform(data) {
  const { signal, type = 'fft', options = {} } = data;
  
  console.log(`📡 Performing Fourier Transform: ${type}`);
  
  if (type === 'fft') {
    return computeFFT(signal);
  } else if (type === 'dft') {
    return computeDFT(signal);
  } else {
    throw new Error(`Unknown transform type: ${type}`);
  }
}

/**
 * Compute Fast Fourier Transform (simplified)
 */
function computeFFT(signal) {
  const N = signal.length;
  
  // Ensure power of 2
  if (N & (N - 1)) {
    throw new Error('Signal length must be power of 2 for FFT');
  }
  
  if (N <= 1) {
    return signal.map(x => ({ real: x, imag: 0 }));
  }
  
  // Divide
  const even = [];
  const odd = [];
  for (let i = 0; i < N; i++) {
    if (i % 2 === 0) {
      even.push(signal[i]);
    } else {
      odd.push(signal[i]);
    }
  }
  
  // Conquer
  const evenFFT = computeFFT(even);
  const oddFFT = computeFFT(odd);
  
  // Combine
  const result = new Array(N);
  for (let k = 0; k < N / 2; k++) {
    const t = {
      real: Math.cos(-2 * Math.PI * k / N) * oddFFT[k].real - Math.sin(-2 * Math.PI * k / N) * oddFFT[k].imag,
      imag: Math.sin(-2 * Math.PI * k / N) * oddFFT[k].real + Math.cos(-2 * Math.PI * k / N) * oddFFT[k].imag
    };
    
    result[k] = {
      real: evenFFT[k].real + t.real,
      imag: evenFFT[k].imag + t.imag
    };
    
    result[k + N / 2] = {
      real: evenFFT[k].real - t.real,
      imag: evenFFT[k].imag - t.imag
    };
  }
  
  return result;
}

/**
 * Perform data transformation
 */
async function performDataTransformation(data) {
  const { operation, dataset, options = {} } = data;
  
  console.log(`🔄 Performing data transformation: ${operation}`);
  
  switch (operation) {
    case 'normalize':
      return normalizeData(dataset, options.method || 'minmax');
    
    case 'standardize':
      return standardizeData(dataset);
    
    case 'filter':
      return filterData(dataset, options.filter);
    
    case 'sort':
      return sortData(dataset, options.key, options.order || 'asc');
    
    case 'aggregate':
      return aggregateData(dataset, options.groupBy, options.aggregations);
    
    default:
      throw new Error(`Unknown transformation: ${operation}`);
  }
}

/**
 * Create random matrix for testing
 */
function createRandomMatrix(rows, cols) {
  const matrix = [];
  for (let i = 0; i < rows; i++) {
    matrix[i] = [];
    for (let j = 0; j < cols; j++) {
      matrix[i][j] = Math.random() * 2 - 1; // Random values between -1 and 1
    }
  }
  return matrix;
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
    console.error('Compute worker error:', error);
    
    self.postMessage({
      type: 'task-completed',
      taskId,
      error: error.message
    });
  }
};