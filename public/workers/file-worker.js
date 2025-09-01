/**
 * 📁 File Processing Worker - Background File Operations for Collaborative Desktop
 * 
 * Features:
 * - Background file indexing and search
 * - File format conversion and processing
 * - Batch file operations
 * - Content analysis and metadata extraction
 * - File compression and optimization
 * - IPFS content processing and pinning
 */

let workerId = '';
let indexingCapabilities = {
  supportedFormats: [],
  maxFileSize: 0,
  processingSpeed: 0
};

/**
 * Initialize file processing worker
 */
async function initialize(config) {
  workerId = config.workerId;
  
  console.log(`📁 File processing worker ${workerId} initializing...`);
  
  // Detect supported file formats and capabilities
  indexingCapabilities = {
    supportedFormats: [
      'text/plain', 'text/html', 'text/css', 'text/javascript',
      'application/json', 'application/xml', 'text/markdown',
      'text/csv', 'application/pdf', 'text/rtf',
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'audio/mpeg', 'audio/wav', 'audio/ogg',
      'video/mp4', 'video/webm', 'video/ogg'
    ],
    maxFileSize: 100 * 1024 * 1024, // 100MB
    processingSpeed: await benchmarkProcessingSpeed()
  };
  
  return {
    capabilities: indexingCapabilities,
    workerId
  };
}

/**
 * Benchmark file processing speed
 */
async function benchmarkProcessingSpeed() {
  const startTime = performance.now();
  
  // Create test data
  const testData = 'Lorem ipsum '.repeat(10000);
  const testFile = new Blob([testData], { type: 'text/plain' });
  
  // Process test file
  await processTextContent(await testFile.text());
  
  const endTime = performance.now();
  const processingTime = endTime - startTime;
  
  // Calculate bytes per second
  const bytesPerSecond = testFile.size / (processingTime / 1000);
  
  console.log(`📊 File processing benchmark: ${(bytesPerSecond / 1024 / 1024).toFixed(2)} MB/s`);
  
  return bytesPerSecond;
}

/**
 * Process file operations
 */
async function processTask(taskType, data) {
  const startTime = performance.now();
  
  let result;
  
  switch (taskType) {
    case 'file-indexing':
      result = await performFileIndexing(data);
      break;
    
    case 'content-analysis':
      result = await performContentAnalysis(data);
      break;
    
    case 'format-conversion':
      result = await performFormatConversion(data);
      break;
    
    case 'batch-operations':
      result = await performBatchOperations(data);
      break;
    
    case 'metadata-extraction':
      result = await extractMetadata(data);
      break;
    
    case 'file-compression':
      result = await performFileCompression(data);
      break;
    
    case 'search-indexing':
      result = await performSearchIndexing(data);
      break;
    
    case 'ipfs-processing':
      result = await performIPFSProcessing(data);
      break;
    
    case 'duplicate-detection':
      result = await detectDuplicates(data);
      break;
    
    case 'file-validation':
      result = await validateFiles(data);
      break;
    
    default:
      throw new Error(`Unknown file processing task: ${taskType}`);
  }
  
  const processingTime = performance.now() - startTime;
  
  return {
    ...result,
    processingTime,
    workerId,
    timestamp: Date.now()
  };
}

/**
 * Perform file indexing for search
 */
async function performFileIndexing(data) {
  const { files, options = {} } = data;
  const { includeContent = true, generateThumbnails = false } = options;
  
  console.log(`📂 Indexing ${files.length} files...`);
  
  const indexedFiles = [];
  
  for (const file of files) {
    try {
      const fileInfo = {
        id: generateFileId(file),
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified ? new Date(file.lastModified) : new Date(),
        path: file.path || file.name,
        extension: getFileExtension(file.name),
        indexedAt: new Date()
      };
      
      // Extract metadata
      if (file.type.startsWith('image/')) {
        fileInfo.metadata = await extractImageMetadata(file);
        if (generateThumbnails) {
          fileInfo.thumbnail = await generateThumbnail(file);
        }
      } else if (file.type.startsWith('audio/')) {
        fileInfo.metadata = await extractAudioMetadata(file);
      } else if (file.type.startsWith('video/')) {
        fileInfo.metadata = await extractVideoMetadata(file);
      }
      
      // Index content for searchable files
      if (includeContent && isTextFile(file.type)) {
        const content = await file.text();
        fileInfo.content = {
          text: content,
          wordCount: countWords(content),
          keywords: extractKeywords(content),
          language: detectLanguage(content)
        };
      }
      
      // Calculate file hash for duplicate detection
      fileInfo.hash = await calculateFileHash(file);
      
      indexedFiles.push(fileInfo);
      
    } catch (error) {
      console.error(`Error indexing file ${file.name}:`, error);
      indexedFiles.push({
        id: generateFileId(file),
        name: file.name,
        error: error.message,
        indexedAt: new Date()
      });
    }
  }
  
  return {
    indexedFiles,
    totalFiles: files.length,
    successfullyIndexed: indexedFiles.filter(f => !f.error).length,
    errors: indexedFiles.filter(f => f.error).length
  };
}

/**
 * Perform content analysis
 */
async function performContentAnalysis(data) {
  const { file, analysisType = 'comprehensive' } = data;
  
  console.log(`🔍 Analyzing content of ${file.name}...`);
  
  const analysis = {
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    analysisType,
    timestamp: new Date()
  };
  
  if (isTextFile(file.type)) {
    const content = await file.text();
    analysis.textAnalysis = await analyzeTextContent(content);
  } else if (file.type.startsWith('image/')) {
    analysis.imageAnalysis = await analyzeImageContent(file);
  } else if (file.type.startsWith('audio/')) {
    analysis.audioAnalysis = await analyzeAudioContent(file);
  } else {
    analysis.binaryAnalysis = await analyzeBinaryContent(file);
  }
  
  return analysis;
}

/**
 * Analyze text content
 */
async function analyzeTextContent(content) {
  const lines = content.split('\n');
  const words = content.split(/\s+/).filter(word => word.length > 0);
  const characters = content.length;
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  // Language detection (simplified)
  const language = detectLanguage(content);
  
  // Sentiment analysis (simplified)
  const sentiment = analyzeSentiment(content);
  
  // Keyword extraction
  const keywords = extractKeywords(content);
  
  // Reading time estimation (average 200 words per minute)
  const readingTimeMinutes = Math.ceil(words.length / 200);
  
  return {
    lines: lines.length,
    words: words.length,
    characters,
    charactersNoSpaces: content.replace(/\s/g, '').length,
    paragraphs: paragraphs.length,
    language,
    sentiment,
    keywords,
    readingTime: `${readingTimeMinutes} min`,
    avgWordsPerSentence: words.length / Math.max(1, content.split(/[.!?]+/).length - 1),
    avgCharsPerWord: content.replace(/\s/g, '').length / Math.max(1, words.length)
  };
}

/**
 * Extract keywords from text
 */
function extractKeywords(text, maxKeywords = 10) {
  // Common stop words
  const stopWords = new Set([
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'a', 'an', 'as', 'are', 'was', 'were', 'been', 'be', 'have', 'has',
    'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may',
    'might', 'must', 'can', 'is', 'it', 'this', 'that', 'these', 'those'
  ]);
  
  // Extract words and count frequency
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
  
  const frequency = new Map();
  words.forEach(word => {
    frequency.set(word, (frequency.get(word) || 0) + 1);
  });
  
  // Sort by frequency and return top keywords
  return Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word, count]) => ({ word, count }));
}

/**
 * Detect language (simplified)
 */
function detectLanguage(text) {
  // Simple language detection based on character patterns
  const englishPattern = /[a-zA-Z]/g;
  const englishMatches = (text.match(englishPattern) || []).length;
  const totalChars = text.replace(/\s/g, '').length;
  
  if (englishMatches / totalChars > 0.7) {
    return 'en';
  }
  
  // Could add more language detection logic here
  return 'unknown';
}

/**
 * Analyze sentiment (simplified)
 */
function analyzeSentiment(text) {
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome', 'perfect', 'love', 'like'];
  const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'dislike', 'poor', 'worst', 'disappointing', 'frustrating'];
  
  const words = text.toLowerCase().split(/\W+/);
  
  let positiveScore = 0;
  let negativeScore = 0;
  
  words.forEach(word => {
    if (positiveWords.includes(word)) positiveScore++;
    if (negativeWords.includes(word)) negativeScore++;
  });
  
  const totalScore = positiveScore - negativeScore;
  
  if (totalScore > 0) return { polarity: 'positive', score: totalScore };
  if (totalScore < 0) return { polarity: 'negative', score: Math.abs(totalScore) };
  return { polarity: 'neutral', score: 0 };
}

/**
 * Analyze image content
 */
async function analyzeImageContent(file) {
  // Create image bitmap for analysis
  const imageBitmap = await createImageBitmap(file);
  
  const analysis = {
    width: imageBitmap.width,
    height: imageBitmap.height,
    aspectRatio: imageBitmap.width / imageBitmap.height,
    format: file.type,
    size: file.size
  };
  
  // Create canvas for pixel analysis
  const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(imageBitmap, 0, 0);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  
  // Color analysis
  let r = 0, g = 0, b = 0;
  let brightness = 0;
  
  for (let i = 0; i < pixels.length; i += 4) {
    r += pixels[i];
    g += pixels[i + 1];
    b += pixels[i + 2];
    brightness += (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
  }
  
  const pixelCount = pixels.length / 4;
  analysis.averageColor = {
    r: Math.round(r / pixelCount),
    g: Math.round(g / pixelCount),
    b: Math.round(b / pixelCount)
  };
  analysis.averageBrightness = brightness / pixelCount;
  
  // Determine if image is predominantly light or dark
  analysis.theme = analysis.averageBrightness > 128 ? 'light' : 'dark';
  
  imageBitmap.close();
  
  return analysis;
}

/**
 * Extract metadata from files
 */
async function extractMetadata(data) {
  const { file } = data;
  
  console.log(`🏷️ Extracting metadata from ${file.name}...`);
  
  const metadata = {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    lastModified: file.lastModified ? new Date(file.lastModified) : null,
    extractedAt: new Date()
  };
  
  if (file.type.startsWith('image/')) {
    metadata.image = await extractImageMetadata(file);
  } else if (file.type.startsWith('audio/')) {
    metadata.audio = await extractAudioMetadata(file);
  } else if (file.type.startsWith('video/')) {
    metadata.video = await extractVideoMetadata(file);
  } else if (isTextFile(file.type)) {
    const content = await file.text();
    metadata.text = {
      encoding: 'utf-8',
      lineCount: content.split('\n').length,
      wordCount: countWords(content),
      characterCount: content.length
    };
  }
  
  return metadata;
}

/**
 * Extract image metadata
 */
async function extractImageMetadata(file) {
  const imageBitmap = await createImageBitmap(file);
  
  const metadata = {
    width: imageBitmap.width,
    height: imageBitmap.height,
    aspectRatio: (imageBitmap.width / imageBitmap.height).toFixed(2),
    megapixels: ((imageBitmap.width * imageBitmap.height) / 1000000).toFixed(2)
  };
  
  imageBitmap.close();
  
  return metadata;
}

/**
 * Extract audio metadata (simplified)
 */
async function extractAudioMetadata(file) {
  // In a real implementation, this would parse audio headers
  return {
    duration: 'unknown',
    bitrate: 'unknown',
    sampleRate: 'unknown',
    channels: 'unknown',
    format: file.type
  };
}

/**
 * Extract video metadata (simplified)
 */
async function extractVideoMetadata(file) {
  // In a real implementation, this would parse video headers
  return {
    duration: 'unknown',
    resolution: 'unknown',
    framerate: 'unknown',
    bitrate: 'unknown',
    codec: 'unknown',
    format: file.type
  };
}

/**
 * Perform batch file operations
 */
async function performBatchOperations(data) {
  const { operations, files } = data;
  
  console.log(`⚙️ Performing batch operations on ${files.length} files...`);
  
  const results = [];
  
  for (const operation of operations) {
    for (const file of files) {
      try {
        let result;
        
        switch (operation.type) {
          case 'rename':
            result = await renameFile(file, operation.pattern);
            break;
          case 'convert':
            result = await convertFile(file, operation.targetFormat);
            break;
          case 'compress':
            result = await compressFile(file, operation.quality);
            break;
          case 'validate':
            result = await validateFile(file, operation.rules);
            break;
          default:
            throw new Error(`Unknown operation: ${operation.type}`);
        }
        
        results.push({
          file: file.name,
          operation: operation.type,
          success: true,
          result
        });
        
      } catch (error) {
        results.push({
          file: file.name,
          operation: operation.type,
          success: false,
          error: error.message
        });
      }
    }
  }
  
  return {
    totalOperations: operations.length * files.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results
  };
}

/**
 * Detect duplicate files
 */
async function detectDuplicates(data) {
  const { files } = data;
  
  console.log(`🔍 Detecting duplicates among ${files.length} files...`);
  
  const fileHashes = new Map();
  const duplicates = [];
  
  for (const file of files) {
    const hash = await calculateFileHash(file);
    
    if (fileHashes.has(hash)) {
      // Found duplicate
      const existingFile = fileHashes.get(hash);
      duplicates.push({
        hash,
        files: [existingFile, {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        }]
      });
    } else {
      fileHashes.set(hash, {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      });
    }
  }
  
  return {
    totalFiles: files.length,
    uniqueFiles: fileHashes.size,
    duplicateGroups: duplicates.length,
    duplicates,
    spaceWasted: duplicates.reduce((total, group) => {
      return total + (group.files[0].size * (group.files.length - 1));
    }, 0)
  };
}

/**
 * Calculate file hash
 */
async function calculateFileHash(file) {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate file ID
 */
function generateFileId(file) {
  return `file_${file.name}_${file.size}_${file.lastModified || Date.now()}`;
}

/**
 * Get file extension
 */
function getFileExtension(fileName) {
  const lastDot = fileName.lastIndexOf('.');
  return lastDot > 0 ? fileName.substring(lastDot + 1).toLowerCase() : '';
}

/**
 * Check if file is text-based
 */
function isTextFile(mimeType) {
  return mimeType.startsWith('text/') || 
         mimeType === 'application/json' ||
         mimeType === 'application/xml' ||
         mimeType === 'application/javascript';
}

/**
 * Count words in text
 */
function countWords(text) {
  return text.split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Generate thumbnail for image (simplified)
 */
async function generateThumbnail(file, maxSize = 150) {
  const imageBitmap = await createImageBitmap(file);
  
  // Calculate thumbnail dimensions
  let { width, height } = imageBitmap;
  const aspectRatio = width / height;
  
  if (width > height) {
    width = maxSize;
    height = maxSize / aspectRatio;
  } else {
    height = maxSize;
    width = maxSize * aspectRatio;
  }
  
  // Create thumbnail canvas
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(imageBitmap, 0, 0, width, height);
  
  // Convert to blob
  const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.8 });
  
  imageBitmap.close();
  
  return {
    width,
    height,
    size: blob.size,
    dataUrl: await blobToDataUrl(blob)
  };
}

/**
 * Convert blob to data URL
 */
function blobToDataUrl(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
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
    console.error('File processing worker error:', error);
    
    self.postMessage({
      type: 'task-completed',
      taskId,
      error: error.message
    });
  }
};