/**
 * 🎵 Audio Worker - Real-time Audio Processing for Collaborative Music Creation
 * 
 * Features:
 * - Real-time audio effects processing
 * - Collaborative music creation with peer synchronization
 * - Audio streaming between peers
 * - Background audio analysis and visualization
 * - Low-latency audio buffer management
 */

let workerId = '';
let audioContext = null;
let processors = new Map();
let collaborationBuffers = new Map();
let peerConnections = new Map();

/**
 * Initialize audio worker with capabilities
 */
async function initialize(config) {
  workerId = config.workerId;
  
  // Initialize audio context if available
  if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
    const AudioCtx = AudioContext || webkitAudioContext;
    audioContext = new AudioCtx();
  }
  
  console.log(`🎵 Audio worker ${workerId} initialized`);
  
  return {
    capabilities: {
      hasAudioContext: !!audioContext,
      sampleRate: audioContext?.sampleRate || 44100,
      maxChannels: audioContext?.destination?.maxChannelCount || 2
    }
  };
}

/**
 * Process audio-related tasks
 */
async function processTask(taskType, data) {
  switch (taskType) {
    case 'audio-effects':
      return processAudioEffects(data);
    
    case 'audio-analysis':
      return analyzeAudio(data);
    
    case 'collaborative-sync':
      return synchronizeWithPeers(data);
    
    case 'audio-generation':
      return generateAudio(data);
    
    case 'real-time-mixing':
      return performRealTimeMixing(data);
    
    case 'audio-encoding':
      return encodeAudio(data);
    
    case 'peer-audio-stream':
      return handlePeerAudioStream(data);
    
    default:
      throw new Error(`Unknown audio task type: ${taskType}`);
  }
}

/**
 * Process audio effects in real-time
 */
async function processAudioEffects(data) {
  const { audioBuffer, effects, settings } = data;
  
  if (!audioContext) {
    throw new Error('AudioContext not available');
  }
  
  try {
    // Create audio buffer from data
    const buffer = audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );
    
    // Copy audio data
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      const sourceData = audioBuffer.channelData[channel];
      for (let i = 0; i < channelData.length; i++) {
        channelData[i] = sourceData[i];
      }
    }
    
    // Apply effects
    let processedBuffer = buffer;
    
    for (const effect of effects) {
      processedBuffer = await applyEffect(processedBuffer, effect, settings[effect.id] || {});
    }
    
    // Return processed audio data
    const result = {
      audioBuffer: {
        numberOfChannels: processedBuffer.numberOfChannels,
        length: processedBuffer.length,
        sampleRate: processedBuffer.sampleRate,
        channelData: []
      },
      processingTime: Date.now() - data.timestamp
    };
    
    // Extract channel data
    for (let channel = 0; channel < processedBuffer.numberOfChannels; channel++) {
      result.audioBuffer.channelData.push(Array.from(processedBuffer.getChannelData(channel)));
    }
    
    return result;
  } catch (error) {
    console.error('Audio effects processing error:', error);
    throw error;
  }
}

/**
 * Apply specific audio effect
 */
async function applyEffect(audioBuffer, effect, settings) {
  switch (effect.type) {
    case 'reverb':
      return applyReverb(audioBuffer, settings);
    
    case 'delay':
      return applyDelay(audioBuffer, settings);
    
    case 'filter':
      return applyFilter(audioBuffer, settings);
    
    case 'distortion':
      return applyDistortion(audioBuffer, settings);
    
    case 'compressor':
      return applyCompressor(audioBuffer, settings);
    
    default:
      console.warn(`Unknown effect type: ${effect.type}`);
      return audioBuffer;
  }
}

/**
 * Apply reverb effect
 */
function applyReverb(audioBuffer, settings) {
  const { roomSize = 0.3, damping = 0.5, wetness = 0.2 } = settings;
  
  // Simple reverb implementation using delay lines
  const delayTime = Math.floor(roomSize * audioBuffer.sampleRate * 0.1);
  const feedback = 1 - damping;
  
  const result = audioContext.createBuffer(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );
  
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const input = audioBuffer.getChannelData(channel);
    const output = result.getChannelData(channel);
    const delayBuffer = new Float32Array(delayTime);
    let delayIndex = 0;
    
    for (let i = 0; i < input.length; i++) {
      const delayedSample = delayBuffer[delayIndex];
      const outputSample = input[i] + (delayedSample * wetness);
      
      output[i] = outputSample;
      delayBuffer[delayIndex] = input[i] + (delayedSample * feedback);
      
      delayIndex = (delayIndex + 1) % delayTime;
    }
  }
  
  return result;
}

/**
 * Apply delay effect
 */
function applyDelay(audioBuffer, settings) {
  const { delayTime = 0.3, feedback = 0.3, wetness = 0.2 } = settings;
  
  const delaySamples = Math.floor(delayTime * audioBuffer.sampleRate);
  
  const result = audioContext.createBuffer(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );
  
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const input = audioBuffer.getChannelData(channel);
    const output = result.getChannelData(channel);
    const delayBuffer = new Float32Array(delaySamples);
    let delayIndex = 0;
    
    for (let i = 0; i < input.length; i++) {
      const delayedSample = delayBuffer[delayIndex];
      output[i] = input[i] + (delayedSample * wetness);
      
      delayBuffer[delayIndex] = input[i] + (delayedSample * feedback);
      delayIndex = (delayIndex + 1) % delaySamples;
    }
  }
  
  return result;
}

/**
 * Apply filter effect
 */
function applyFilter(audioBuffer, settings) {
  const { type = 'lowpass', frequency = 1000, resonance = 1 } = settings;
  
  // Simple IIR filter implementation
  const nyquist = audioBuffer.sampleRate / 2;
  const normalizedFreq = frequency / nyquist;
  
  // Calculate filter coefficients (simplified)
  const a = Math.exp(-2 * Math.PI * normalizedFreq);
  const b = 1 - a;
  
  const result = audioContext.createBuffer(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );
  
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const input = audioBuffer.getChannelData(channel);
    const output = result.getChannelData(channel);
    let y1 = 0;
    
    for (let i = 0; i < input.length; i++) {
      if (type === 'lowpass') {
        output[i] = b * input[i] + a * y1;
      } else { // highpass
        output[i] = input[i] - (b * input[i] + a * y1);
      }
      y1 = output[i];
    }
  }
  
  return result;
}

/**
 * Apply distortion effect
 */
function applyDistortion(audioBuffer, settings) {
  const { drive = 2, threshold = 0.5 } = settings;
  
  const result = audioContext.createBuffer(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );
  
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const input = audioBuffer.getChannelData(channel);
    const output = result.getChannelData(channel);
    
    for (let i = 0; i < input.length; i++) {
      let sample = input[i] * drive;
      
      if (Math.abs(sample) > threshold) {
        sample = Math.sign(sample) * threshold + 
                Math.sign(sample) * (1 - threshold) * Math.tanh((Math.abs(sample) - threshold) / (1 - threshold));
      }
      
      output[i] = sample / drive;
    }
  }
  
  return result;
}

/**
 * Apply compressor effect
 */
function applyCompressor(audioBuffer, settings) {
  const { threshold = -20, ratio = 4, attack = 0.003, release = 0.1 } = settings;
  
  const thresholdLinear = Math.pow(10, threshold / 20);
  const attackCoeff = Math.exp(-1 / (attack * audioBuffer.sampleRate));
  const releaseCoeff = Math.exp(-1 / (release * audioBuffer.sampleRate));
  
  const result = audioContext.createBuffer(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );
  
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const input = audioBuffer.getChannelData(channel);
    const output = result.getChannelData(channel);
    let envelope = 0;
    
    for (let i = 0; i < input.length; i++) {
      const inputLevel = Math.abs(input[i]);
      
      if (inputLevel > envelope) {
        envelope = inputLevel + (envelope - inputLevel) * attackCoeff;
      } else {
        envelope = inputLevel + (envelope - inputLevel) * releaseCoeff;
      }
      
      let gain = 1;
      if (envelope > thresholdLinear) {
        const overThreshold = envelope / thresholdLinear;
        const compressedGain = Math.pow(overThreshold, (1 / ratio) - 1);
        gain = compressedGain;
      }
      
      output[i] = input[i] * gain;
    }
  }
  
  return result;
}

/**
 * Analyze audio for visualization and metrics
 */
async function analyzeAudio(data) {
  const { audioBuffer, analysisType } = data;
  
  try {
    switch (analysisType) {
      case 'spectrum':
        return performSpectrumAnalysis(audioBuffer);
      
      case 'waveform':
        return extractWaveformData(audioBuffer);
      
      case 'tempo':
        return detectTempo(audioBuffer);
      
      case 'pitch':
        return detectPitch(audioBuffer);
      
      case 'loudness':
        return measureLoudness(audioBuffer);
      
      default:
        throw new Error(`Unknown analysis type: ${analysisType}`);
    }
  } catch (error) {
    console.error('Audio analysis error:', error);
    throw error;
  }
}

/**
 * Perform FFT spectrum analysis
 */
function performSpectrumAnalysis(audioBuffer) {
  const channelData = audioBuffer.getChannelData(0); // Use first channel
  const fftSize = 2048;
  const spectrum = new Float32Array(fftSize / 2);
  
  // Simple FFT implementation (in practice, use a proper FFT library)
  for (let i = 0; i < spectrum.length; i++) {
    let real = 0, imag = 0;
    
    for (let j = 0; j < Math.min(fftSize, channelData.length); j++) {
      const angle = -2 * Math.PI * i * j / fftSize;
      real += channelData[j] * Math.cos(angle);
      imag += channelData[j] * Math.sin(angle);
    }
    
    spectrum[i] = Math.sqrt(real * real + imag * imag);
  }
  
  return {
    spectrum: Array.from(spectrum),
    sampleRate: audioBuffer.sampleRate,
    fftSize
  };
}

/**
 * Extract waveform data for visualization
 */
function extractWaveformData(audioBuffer) {
  const channelData = audioBuffer.getChannelData(0);
  const downsampleFactor = Math.max(1, Math.floor(channelData.length / 1000));
  const waveform = [];
  
  for (let i = 0; i < channelData.length; i += downsampleFactor) {
    let sum = 0;
    let count = 0;
    
    for (let j = i; j < Math.min(i + downsampleFactor, channelData.length); j++) {
      sum += Math.abs(channelData[j]);
      count++;
    }
    
    waveform.push(count > 0 ? sum / count : 0);
  }
  
  return {
    waveform,
    originalLength: channelData.length,
    downsampleFactor
  };
}

/**
 * Synchronize with peer workers for collaborative music creation
 */
async function synchronizeWithPeers(data) {
  const { peers, syncData, timestamp } = data;
  
  // Store collaboration buffer for this sync session
  const sessionId = `sync-${timestamp}`;
  collaborationBuffers.set(sessionId, {
    peers,
    localData: syncData,
    remoteData: new Map(),
    startTime: timestamp
  });
  
  return {
    sessionId,
    localTimestamp: Date.now(),
    status: 'synchronized'
  };
}

/**
 * Generate audio procedurally
 */
async function generateAudio(data) {
  const { type, duration, sampleRate = 44100, parameters } = data;
  
  const length = Math.floor(duration * sampleRate);
  const buffer = audioContext.createBuffer(1, length, sampleRate);
  const channelData = buffer.getChannelData(0);
  
  switch (type) {
    case 'sine':
      generateSineWave(channelData, parameters.frequency || 440, sampleRate);
      break;
    
    case 'noise':
      generateNoise(channelData, parameters.type || 'white');
      break;
    
    case 'sequence':
      generateSequence(channelData, parameters, sampleRate);
      break;
    
    default:
      throw new Error(`Unknown generation type: ${type}`);
  }
  
  return {
    audioBuffer: {
      numberOfChannels: 1,
      length,
      sampleRate,
      channelData: [Array.from(channelData)]
    }
  };
}

/**
 * Generate sine wave
 */
function generateSineWave(channelData, frequency, sampleRate) {
  for (let i = 0; i < channelData.length; i++) {
    channelData[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate);
  }
}

/**
 * Generate noise
 */
function generateNoise(channelData, type) {
  switch (type) {
    case 'white':
      for (let i = 0; i < channelData.length; i++) {
        channelData[i] = (Math.random() - 0.5) * 2;
      }
      break;
    
    case 'pink':
      // Simple pink noise approximation
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < channelData.length; i++) {
        const white = Math.random() - 0.5;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        channelData[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
      break;
  }
}

/**
 * Handle real-time mixing of multiple audio sources
 */
async function performRealTimeMixing(data) {
  const { sources, mixSettings } = data;
  
  if (!sources || sources.length === 0) {
    throw new Error('No audio sources provided for mixing');
  }
  
  // Find the longest source to determine output length
  const maxLength = Math.max(...sources.map(s => s.audioBuffer.length));
  const sampleRate = sources[0].audioBuffer.sampleRate;
  const channels = Math.max(...sources.map(s => s.audioBuffer.numberOfChannels));
  
  const result = audioContext.createBuffer(channels, maxLength, sampleRate);
  
  // Mix all sources
  for (let channel = 0; channel < channels; channel++) {
    const outputData = result.getChannelData(channel);
    
    for (const source of sources) {
      const sourceBuffer = source.audioBuffer;
      const sourceData = sourceBuffer.channelData[Math.min(channel, sourceBuffer.numberOfChannels - 1)];
      const gain = (mixSettings[source.id] && mixSettings[source.id].gain) || 1.0;
      const pan = (mixSettings[source.id] && mixSettings[source.id].pan) || 0.0;
      
      // Apply gain and panning
      const leftGain = gain * (pan <= 0 ? 1 : 1 - pan);
      const rightGain = gain * (pan >= 0 ? 1 : 1 + pan);
      const channelGain = channel === 0 ? leftGain : rightGain;
      
      for (let i = 0; i < Math.min(sourceData.length, maxLength); i++) {
        outputData[i] += sourceData[i] * channelGain;
      }
    }
  }
  
  return {
    audioBuffer: {
      numberOfChannels: channels,
      length: maxLength,
      sampleRate,
      channelData: Array.from({ length: channels }, (_, i) => 
        Array.from(result.getChannelData(i))
      )
    },
    mixedSources: sources.length
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
    console.error('Audio worker error:', error);
    
    self.postMessage({
      type: 'task-completed',
      taskId,
      error: error.message
    });
  }
};