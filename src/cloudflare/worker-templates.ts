// CloudFlare Worker Templates for SwissKnife Distributed Computing
// Phase 5: Edge Computing Infrastructure

/**
 * AI Inference CloudFlare Worker Template
 * Handles distributed AI model inference on edge
 */
export const AI_INFERENCE_WORKER = `
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { taskId, model, input, parameters } = await request.json()
    
    console.log(\`🤖 Processing AI inference task: \${taskId}\`)
    
    // Simulate AI model inference
    const startTime = Date.now()
    const result = await processAIInference(model, input, parameters)
    const executionTime = Date.now() - startTime
    
    const response = {
      taskId,
      result: {
        prediction: result.prediction,
        confidence: result.confidence,
        executionTime,
        location: 'cloudflare-ai-edge',
        edgeLocation: request.cf?.colo || 'unknown'
      }
    }
    
    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('AI Inference Error:', error)
    return new Response(JSON.stringify({
      error: error.message,
      location: 'cloudflare-ai-edge'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

async function processAIInference(model, input, parameters = {}) {
  // Simulate AI model processing based on model type
  switch (model) {
    case 'text-generation':
      return await processTextGeneration(input, parameters)
    case 'image-classification':
      return await processImageClassification(input, parameters)
    case 'sentiment-analysis':
      return await processSentimentAnalysis(input, parameters)
    default:
      return await processGenericAI(input, parameters)
  }
}

async function processTextGeneration(input, parameters) {
  const temperature = parameters.temperature || 0.7
  const maxTokens = parameters.maxTokens || 100
  
  // Simulate text generation processing
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
  
  return {
    prediction: \`Generated text based on: "\${input.substring(0, 50)}..." with temperature \${temperature}\`,
    confidence: 0.85 + Math.random() * 0.15,
    tokens: Math.floor(Math.random() * maxTokens),
    model: 'text-generation-edge-v1'
  }
}

async function processImageClassification(input, parameters) {
  const threshold = parameters.threshold || 0.5
  
  // Simulate image classification
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1500))
  
  const classes = ['cat', 'dog', 'bird', 'car', 'person', 'building']
  const selectedClass = classes[Math.floor(Math.random() * classes.length)]
  const confidence = threshold + Math.random() * (1 - threshold)
  
  return {
    prediction: selectedClass,
    confidence,
    allClasses: classes.map(cls => ({
      class: cls,
      confidence: cls === selectedClass ? confidence : Math.random() * threshold
    }))
  }
}

async function processSentimentAnalysis(input, parameters) {
  // Simulate sentiment analysis
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))
  
  const sentiments = ['positive', 'negative', 'neutral']
  const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)]
  const confidence = 0.7 + Math.random() * 0.3
  
  return {
    prediction: sentiment,
    confidence,
    scores: {
      positive: sentiment === 'positive' ? confidence : Math.random() * 0.5,
      negative: sentiment === 'negative' ? confidence : Math.random() * 0.5,
      neutral: sentiment === 'neutral' ? confidence : Math.random() * 0.5
    }
  }
}

async function processGenericAI(input, parameters) {
  // Generic AI processing
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
  
  return {
    prediction: \`AI processed: \${JSON.stringify(input).substring(0, 100)}\`,
    confidence: 0.8 + Math.random() * 0.2,
    parameters
  }
}
`;

/**
 * Compute Worker Template for Mathematical Operations
 */
export const COMPUTE_WORKER = `
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { taskId, operation, data, parameters } = await request.json()
    
    console.log(\`🧮 Processing compute task: \${taskId} - \${operation}\`)
    
    const startTime = Date.now()
    const result = await processComputation(operation, data, parameters)
    const executionTime = Date.now() - startTime
    
    const response = {
      taskId,
      result: {
        ...result,
        executionTime,
        location: 'cloudflare-compute-edge',
        edgeLocation: request.cf?.colo || 'unknown'
      }
    }
    
    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Compute Error:', error)
    return new Response(JSON.stringify({
      error: error.message,
      location: 'cloudflare-compute-edge'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

async function processComputation(operation, data, parameters) {
  switch (operation) {
    case 'matrix-multiply':
      return await matrixMultiply(data.matrixA, data.matrixB)
    case 'statistical-analysis':
      return await statisticalAnalysis(data.dataset)
    case 'monte-carlo':
      return await monteCarloSimulation(data.iterations, parameters)
    case 'cryptographic-hash':
      return await cryptographicHash(data.input, parameters.algorithm)
    case 'fourier-transform':
      return await fourierTransform(data.signal)
    default:
      return await genericComputation(data)
  }
}

async function matrixMultiply(matrixA, matrixB) {
  const rowsA = matrixA.length
  const colsA = matrixA[0].length
  const colsB = matrixB[0].length
  
  const result = Array(rowsA).fill().map(() => Array(colsB).fill(0))
  
  for (let i = 0; i < rowsA; i++) {
    for (let j = 0; j < colsB; j++) {
      for (let k = 0; k < colsA; k++) {
        result[i][j] += matrixA[i][k] * matrixB[k][j]
      }
    }
  }
  
  return {
    operation: 'matrix-multiply',
    result,
    dimensions: \`\${rowsA}x\${colsA} * \${colsA}x\${colsB} = \${rowsA}x\${colsB}\`
  }
}

async function statisticalAnalysis(dataset) {
  const n = dataset.length
  const sum = dataset.reduce((a, b) => a + b, 0)
  const mean = sum / n
  
  const variance = dataset.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n
  const stdDev = Math.sqrt(variance)
  
  const sorted = [...dataset].sort((a, b) => a - b)
  const median = n % 2 === 0 ? 
    (sorted[n/2 - 1] + sorted[n/2]) / 2 : 
    sorted[Math.floor(n/2)]
  
  return {
    operation: 'statistical-analysis',
    count: n,
    sum,
    mean,
    median,
    variance,
    standardDeviation: stdDev,
    min: Math.min(...dataset),
    max: Math.max(...dataset)
  }
}

async function monteCarloSimulation(iterations, parameters) {
  const { type = 'pi-estimation' } = parameters
  
  if (type === 'pi-estimation') {
    let inside = 0
    
    for (let i = 0; i < iterations; i++) {
      const x = Math.random()
      const y = Math.random()
      if (x * x + y * y <= 1) inside++
    }
    
    const piEstimate = (inside / iterations) * 4
    
    return {
      operation: 'monte-carlo-pi',
      iterations,
      estimate: piEstimate,
      accuracy: Math.abs(Math.PI - piEstimate) / Math.PI
    }
  }
  
  return { operation: 'monte-carlo', iterations, result: 'unknown-type' }
}

async function cryptographicHash(input, algorithm = 'SHA-256') {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  
  const hashBuffer = await crypto.subtle.digest(algorithm, data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  return {
    operation: 'cryptographic-hash',
    algorithm,
    hash: hashHex,
    inputLength: input.length
  }
}

async function fourierTransform(signal) {
  // Simplified DFT for demonstration
  const N = signal.length
  const result = []
  
  for (let k = 0; k < N; k++) {
    let real = 0
    let imag = 0
    
    for (let n = 0; n < N; n++) {
      const angle = (-2 * Math.PI * k * n) / N
      real += signal[n] * Math.cos(angle)
      imag += signal[n] * Math.sin(angle)
    }
    
    result.push({
      frequency: k,
      magnitude: Math.sqrt(real * real + imag * imag),
      phase: Math.atan2(imag, real)
    })
  }
  
  return {
    operation: 'fourier-transform',
    inputLength: N,
    spectrum: result
  }
}

async function genericComputation(data) {
  // Generic computation for unknown operations
  const startTime = Date.now()
  
  // Simulate computational work
  let result = 0
  for (let i = 0; i < 1000000; i++) {
    result += Math.sqrt(i)
  }
  
  return {
    operation: 'generic-compute',
    result,
    computationTime: Date.now() - startTime
  }
}
`;

/**
 * File Processing Worker Template
 */
export const FILE_PROCESSING_WORKER = `
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { taskId, operation, fileData, parameters } = await request.json()
    
    console.log(\`📁 Processing file task: \${taskId} - \${operation}\`)
    
    const startTime = Date.now()
    const result = await processFile(operation, fileData, parameters)
    const executionTime = Date.now() - startTime
    
    const response = {
      taskId,
      result: {
        ...result,
        executionTime,
        location: 'cloudflare-file-edge',
        edgeLocation: request.cf?.colo || 'unknown'
      }
    }
    
    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('File Processing Error:', error)
    return new Response(JSON.stringify({
      error: error.message,
      location: 'cloudflare-file-edge'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

async function processFile(operation, fileData, parameters) {
  switch (operation) {
    case 'text-analysis':
      return await analyzeText(fileData, parameters)
    case 'image-metadata':
      return await extractImageMetadata(fileData, parameters)
    case 'json-validation':
      return await validateJSON(fileData, parameters)
    case 'csv-analysis':
      return await analyzeCSV(fileData, parameters)
    case 'file-compression':
      return await compressFile(fileData, parameters)
    default:
      return await genericFileProcessing(fileData)
  }
}

async function analyzeText(content, parameters) {
  const text = typeof content === 'string' ? content : content.toString()
  
  const words = text.toLowerCase().match(/\\b\\w+\\b/g) || []
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const paragraphs = text.split(/\\n\\s*\\n/).filter(p => p.trim().length > 0)
  
  // Word frequency analysis
  const wordFreq = {}
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1
  })
  
  const topWords = Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }))
  
  // Basic sentiment analysis
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic']
  const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'disappointing', 'poor']
  
  const positiveCount = words.filter(word => positiveWords.includes(word)).length
  const negativeCount = words.filter(word => negativeWords.includes(word)).length
  
  const sentiment = positiveCount > negativeCount ? 'positive' : 
                   negativeCount > positiveCount ? 'negative' : 'neutral'
  
  return {
    operation: 'text-analysis',
    statistics: {
      characters: text.length,
      words: words.length,
      sentences: sentences.length,
      paragraphs: paragraphs.length,
      avgWordsPerSentence: Math.round(words.length / sentences.length),
      avgCharsPerWord: Math.round(text.length / words.length)
    },
    topWords,
    sentiment: {
      overall: sentiment,
      positiveWords: positiveCount,
      negativeWords: negativeCount
    }
  }
}

async function extractImageMetadata(imageData, parameters) {
  // Simulate image metadata extraction
  const metadata = {
    operation: 'image-metadata',
    size: imageData.length || 0,
    format: parameters.format || 'unknown',
    dimensions: {
      width: Math.floor(Math.random() * 2000) + 500,
      height: Math.floor(Math.random() * 2000) + 500
    },
    colorDepth: Math.random() > 0.5 ? 24 : 32,
    compression: Math.random() > 0.3 ? 'compressed' : 'uncompressed',
    hasTransparency: Math.random() > 0.5,
    estimatedColors: Math.floor(Math.random() * 1000000)
  }
  
  metadata.aspectRatio = (metadata.dimensions.width / metadata.dimensions.height).toFixed(2)
  
  return metadata
}

async function validateJSON(jsonData, parameters) {
  try {
    const parsed = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData
    
    const analysis = {
      operation: 'json-validation',
      valid: true,
      structure: analyzeJSONStructure(parsed),
      size: JSON.stringify(jsonData).length,
      depth: calculateJSONDepth(parsed)
    }
    
    return analysis
    
  } catch (error) {
    return {
      operation: 'json-validation',
      valid: false,
      error: error.message,
      size: typeof jsonData === 'string' ? jsonData.length : JSON.stringify(jsonData).length
    }
  }
}

function analyzeJSONStructure(obj, path = '') {
  if (Array.isArray(obj)) {
    return {
      type: 'array',
      length: obj.length,
      elements: obj.length > 0 ? analyzeJSONStructure(obj[0], path + '[0]') : null
    }
  } else if (obj !== null && typeof obj === 'object') {
    const keys = Object.keys(obj)
    return {
      type: 'object',
      keys: keys.length,
      properties: keys.slice(0, 5).reduce((acc, key) => {
        acc[key] = analyzeJSONStructure(obj[key], path + '.' + key)
        return acc
      }, {})
    }
  } else {
    return {
      type: typeof obj,
      value: obj !== null && typeof obj === 'string' && obj.length > 50 ? 
        obj.substring(0, 50) + '...' : obj
    }
  }
}

function calculateJSONDepth(obj, currentDepth = 0) {
  if (Array.isArray(obj)) {
    return obj.length > 0 ? 
      Math.max(...obj.map(item => calculateJSONDepth(item, currentDepth + 1))) : 
      currentDepth + 1
  } else if (obj !== null && typeof obj === 'object') {
    const depths = Object.values(obj).map(value => calculateJSONDepth(value, currentDepth + 1))
    return depths.length > 0 ? Math.max(...depths) : currentDepth + 1
  } else {
    return currentDepth + 1
  }
}

async function analyzeCSV(csvData, parameters) {
  const text = typeof csvData === 'string' ? csvData : csvData.toString()
  const lines = text.split('\\n').filter(line => line.trim().length > 0)
  
  if (lines.length === 0) {
    return {
      operation: 'csv-analysis',
      error: 'Empty CSV data'
    }
  }
  
  const delimiter = parameters.delimiter || (text.includes(',') ? ',' : '\\t')
  const headers = lines[0].split(delimiter).map(h => h.trim().replace(/['"]/g, ''))
  const dataRows = lines.slice(1).map(line => line.split(delimiter))
  
  const columnStats = headers.map((header, index) => {
    const values = dataRows.map(row => row[index]).filter(val => val && val.trim())
    const numericValues = values.map(val => parseFloat(val)).filter(val => !isNaN(val))
    
    return {
      name: header,
      totalValues: values.length,
      nullValues: dataRows.length - values.length,
      numericValues: numericValues.length,
      isNumeric: numericValues.length > values.length * 0.8,
      statistics: numericValues.length > 0 ? {
        min: Math.min(...numericValues),
        max: Math.max(...numericValues),
        avg: numericValues.reduce((a, b) => a + b, 0) / numericValues.length
      } : null
    }
  })
  
  return {
    operation: 'csv-analysis',
    rows: dataRows.length,
    columns: headers.length,
    headers,
    columnAnalysis: columnStats,
    delimiter,
    estimatedSize: text.length
  }
}

async function compressFile(fileData, parameters) {
  // Simulate file compression
  const originalSize = typeof fileData === 'string' ? 
    fileData.length : JSON.stringify(fileData).length
  
  const compressionRatio = Math.random() * 0.5 + 0.3 // 30-80% compression
  const compressedSize = Math.floor(originalSize * compressionRatio)
  
  return {
    operation: 'file-compression',
    originalSize,
    compressedSize,
    compressionRatio: ((originalSize - compressedSize) / originalSize * 100).toFixed(1) + '%',
    algorithm: parameters.algorithm || 'gzip',
    savings: originalSize - compressedSize
  }
}

async function genericFileProcessing(fileData) {
  const size = typeof fileData === 'string' ? 
    fileData.length : JSON.stringify(fileData).length
  
  return {
    operation: 'generic-file-processing',
    processed: true,
    fileSize: size,
    processingTime: Math.floor(Math.random() * 1000) + 500
  }
}
`;

/**
 * Data Analysis Worker Template
 */
export const DATA_ANALYSIS_WORKER = `
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { taskId, analysis, dataset, parameters } = await request.json()
    
    console.log(\`📊 Processing data analysis: \${taskId} - \${analysis}\`)
    
    const startTime = Date.now()
    const result = await performDataAnalysis(analysis, dataset, parameters)
    const executionTime = Date.now() - startTime
    
    const response = {
      taskId,
      result: {
        ...result,
        executionTime,
        location: 'cloudflare-data-edge',
        edgeLocation: request.cf?.colo || 'unknown'
      }
    }
    
    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Data Analysis Error:', error)
    return new Response(JSON.stringify({
      error: error.message,
      location: 'cloudflare-data-edge'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

async function performDataAnalysis(analysis, dataset, parameters) {
  switch (analysis) {
    case 'correlation':
      return await calculateCorrelation(dataset, parameters)
    case 'regression':
      return await linearRegression(dataset, parameters)
    case 'clustering':
      return await performClustering(dataset, parameters)
    case 'outlier-detection':
      return await detectOutliers(dataset, parameters)
    case 'time-series':
      return await analyzeTimeSeries(dataset, parameters)
    default:
      return await genericDataAnalysis(dataset)
  }
}

async function calculateCorrelation(dataset, parameters) {
  const { xField, yField } = parameters
  
  if (!Array.isArray(dataset) || dataset.length < 2) {
    throw new Error('Dataset must be an array with at least 2 items')
  }
  
  const xValues = dataset.map(item => parseFloat(item[xField])).filter(val => !isNaN(val))
  const yValues = dataset.map(item => parseFloat(item[yField])).filter(val => !isNaN(val))
  
  if (xValues.length !== yValues.length || xValues.length < 2) {
    throw new Error('Insufficient valid numeric data for correlation')
  }
  
  const n = xValues.length
  const xMean = xValues.reduce((a, b) => a + b, 0) / n
  const yMean = yValues.reduce((a, b) => a + b, 0) / n
  
  let numerator = 0
  let xSumSquares = 0
  let ySumSquares = 0
  
  for (let i = 0; i < n; i++) {
    const xDiff = xValues[i] - xMean
    const yDiff = yValues[i] - yMean
    
    numerator += xDiff * yDiff
    xSumSquares += xDiff * xDiff
    ySumSquares += yDiff * yDiff
  }
  
  const correlation = numerator / Math.sqrt(xSumSquares * ySumSquares)
  
  return {
    analysis: 'correlation',
    fields: [xField, yField],
    correlation,
    strength: Math.abs(correlation) > 0.7 ? 'strong' : 
              Math.abs(correlation) > 0.3 ? 'moderate' : 'weak',
    direction: correlation > 0 ? 'positive' : correlation < 0 ? 'negative' : 'none',
    sampleSize: n
  }
}

async function linearRegression(dataset, parameters) {
  const { xField, yField } = parameters
  
  const xValues = dataset.map(item => parseFloat(item[xField])).filter(val => !isNaN(val))
  const yValues = dataset.map(item => parseFloat(item[yField])).filter(val => !isNaN(val))
  
  const n = Math.min(xValues.length, yValues.length)
  const xMean = xValues.slice(0, n).reduce((a, b) => a + b, 0) / n
  const yMean = yValues.slice(0, n).reduce((a, b) => a + b, 0) / n
  
  let numerator = 0
  let denominator = 0
  
  for (let i = 0; i < n; i++) {
    const xDiff = xValues[i] - xMean
    numerator += xDiff * (yValues[i] - yMean)
    denominator += xDiff * xDiff
  }
  
  const slope = numerator / denominator
  const intercept = yMean - slope * xMean
  
  // Calculate R-squared
  let totalSumSquares = 0
  let residualSumSquares = 0
  
  for (let i = 0; i < n; i++) {
    const predicted = slope * xValues[i] + intercept
    totalSumSquares += Math.pow(yValues[i] - yMean, 2)
    residualSumSquares += Math.pow(yValues[i] - predicted, 2)
  }
  
  const rSquared = 1 - (residualSumSquares / totalSumSquares)
  
  return {
    analysis: 'linear-regression',
    equation: \`y = \${slope.toFixed(4)}x + \${intercept.toFixed(4)}\`,
    slope,
    intercept,
    rSquared,
    goodnessOfFit: rSquared > 0.8 ? 'excellent' : 
                   rSquared > 0.6 ? 'good' : 
                   rSquared > 0.4 ? 'moderate' : 'poor',
    sampleSize: n
  }
}

async function performClustering(dataset, parameters) {
  const { features, clusters = 3 } = parameters
  
  if (!features || features.length === 0) {
    throw new Error('Features array is required for clustering')
  }
  
  // Extract feature values
  const dataPoints = dataset.map(item => 
    features.map(feature => parseFloat(item[feature]) || 0)
  )
  
  // Simple k-means clustering simulation
  const centroids = []
  for (let i = 0; i < clusters; i++) {
    centroids.push(dataPoints[Math.floor(Math.random() * dataPoints.length)])
  }
  
  const assignments = dataPoints.map(point => {
    let minDistance = Infinity
    let cluster = 0
    
    centroids.forEach((centroid, index) => {
      const distance = euclideanDistance(point, centroid)
      if (distance < minDistance) {
        minDistance = distance
        cluster = index
      }
    })
    
    return cluster
  })
  
  // Calculate cluster statistics
  const clusterStats = []
  for (let i = 0; i < clusters; i++) {
    const clusterPoints = assignments.filter(assignment => assignment === i).length
    clusterStats.push({
      cluster: i,
      size: clusterPoints,
      percentage: ((clusterPoints / dataPoints.length) * 100).toFixed(1) + '%'
    })
  }
  
  return {
    analysis: 'clustering',
    algorithm: 'k-means',
    clusters,
    features,
    assignments,
    clusterStats,
    totalPoints: dataPoints.length
  }
}

function euclideanDistance(point1, point2) {
  return Math.sqrt(
    point1.reduce((sum, val, index) => 
      sum + Math.pow(val - point2[index], 2), 0
    )
  )
}

async function detectOutliers(dataset, parameters) {
  const { field, method = 'iqr' } = parameters
  
  const values = dataset.map(item => parseFloat(item[field])).filter(val => !isNaN(val))
  values.sort((a, b) => a - b)
  
  let outliers = []
  
  if (method === 'iqr') {
    const q1Index = Math.floor(values.length * 0.25)
    const q3Index = Math.floor(values.length * 0.75)
    const q1 = values[q1Index]
    const q3 = values[q3Index]
    const iqr = q3 - q1
    
    const lowerBound = q1 - 1.5 * iqr
    const upperBound = q3 + 1.5 * iqr
    
    outliers = values.filter(val => val < lowerBound || val > upperBound)
  } else if (method === 'zscore') {
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const stdDev = Math.sqrt(
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    )
    
    outliers = values.filter(val => Math.abs((val - mean) / stdDev) > 2)
  }
  
  return {
    analysis: 'outlier-detection',
    field,
    method,
    totalValues: values.length,
    outliers: outliers.length,
    outliersPercentage: ((outliers.length / values.length) * 100).toFixed(1) + '%',
    outlierValues: outliers.slice(0, 10), // Show first 10 outliers
    statistics: {
      min: Math.min(...values),
      max: Math.max(...values),
      mean: values.reduce((a, b) => a + b, 0) / values.length
    }
  }
}

async function analyzeTimeSeries(dataset, parameters) {
  const { timeField, valueField } = parameters
  
  const timeSeries = dataset
    .map(item => ({
      time: new Date(item[timeField]),
      value: parseFloat(item[valueField])
    }))
    .filter(item => !isNaN(item.time.getTime()) && !isNaN(item.value))
    .sort((a, b) => a.time - b.time)
  
  if (timeSeries.length < 3) {
    throw new Error('Insufficient data for time series analysis')
  }
  
  // Calculate trend
  const values = timeSeries.map(item => item.value)
  const n = values.length
  const indices = Array.from({length: n}, (_, i) => i)
  
  const xMean = (n - 1) / 2
  const yMean = values.reduce((a, b) => a + b, 0) / n
  
  let numerator = 0
  let denominator = 0
  
  for (let i = 0; i < n; i++) {
    const xDiff = i - xMean
    numerator += xDiff * (values[i] - yMean)
    denominator += xDiff * xDiff
  }
  
  const trend = numerator / denominator
  
  // Calculate seasonality (simple approach)
  const seasonalPeriod = Math.min(12, Math.floor(n / 4))
  let seasonality = null
  
  if (n >= seasonalPeriod * 2) {
    const seasonalValues = []
    for (let s = 0; s < seasonalPeriod; s++) {
      const seasonValues = []
      for (let i = s; i < n; i += seasonalPeriod) {
        seasonValues.push(values[i])
      }
      seasonalValues.push(seasonValues.reduce((a, b) => a + b, 0) / seasonValues.length)
    }
    seasonality = seasonalValues
  }
  
  return {
    analysis: 'time-series',
    timeField,
    valueField,
    dataPoints: n,
    timeRange: {
      start: timeSeries[0].time.toISOString(),
      end: timeSeries[n-1].time.toISOString()
    },
    trend: {
      direction: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable',
      slope: trend,
      strength: Math.abs(trend) > 1 ? 'strong' : Math.abs(trend) > 0.1 ? 'moderate' : 'weak'
    },
    seasonality: seasonality ? {
      detected: true,
      period: seasonalPeriod,
      values: seasonality
    } : { detected: false },
    statistics: {
      mean: yMean,
      min: Math.min(...values),
      max: Math.max(...values),
      volatility: Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0) / n)
    }
  }
}

async function genericDataAnalysis(dataset) {
  const size = Array.isArray(dataset) ? dataset.length : 0
  
  return {
    analysis: 'generic-data-analysis',
    datasetSize: size,
    processed: true,
    summary: 'Basic data analysis completed'
  }
}
`;

/**
 * CloudFlare Worker Template Registry
 */
export const WORKER_TEMPLATES = {
  'ai-inference': AI_INFERENCE_WORKER,
  'compute': COMPUTE_WORKER,
  'file-processing': FILE_PROCESSING_WORKER,
  'data-analysis': DATA_ANALYSIS_WORKER
};

/**
 * Get worker template by name
 */
export function getWorkerTemplate(name: string): string {
  return WORKER_TEMPLATES[name] || '';
}

/**
 * Get all available worker template names
 */
export function getAvailableWorkerTemplates(): string[] {
  return Object.keys(WORKER_TEMPLATES);
}