/**
 * AI Model Router for SwissKnife Virtual Desktop
 * Automatically detects and routes AI requests to optimal endpoints
 */

class AIModelRouter {
  constructor() {
    this.endpoints = new Map();
    this.routingRules = new Map();
    this.loadBalancer = new Map();
    this.healthMonitor = new Map();
    this.requestHistory = [];
    this.isInitialized = false;
    this.eventListeners = new Map();
    
    // Endpoint types and priorities
    this.endpointTypes = {
      LOCAL_TRANSFORMERS: { priority: 1, cost: 0, latency: 'low' },
      P2P_PEER: { priority: 2, cost: 0, latency: 'medium' },
      IPFS_DISTRIBUTED: { priority: 3, cost: 0, latency: 'medium' },
      CLOUD_API: { priority: 4, cost: 'high', latency: 'low' },
      FALLBACK: { priority: 5, cost: 0, latency: 'high' }
    };
    
    // Model capability mappings
    this.modelCapabilities = {
      'text-generation': ['gpt2', 't5-small', 'gpt-3.5-turbo', 'gpt-4'],
      'text-embedding': ['bert-base-uncased', 'distilbert-base-uncased'],
      'text-classification': ['bert-base-uncased', 'distilbert-base-uncased'],
      'question-answering': ['bert-base-uncased', 't5-small'],
      'summarization': ['t5-small', 'gpt-3.5-turbo'],
      'translation': ['t5-small', 'gpt-3.5-turbo'],
      'code-generation': ['gpt-3.5-turbo', 'gpt-4', 'codellama']
    };
    
    this.init();
  }

  async init() {
    console.log('Initializing AI Model Router...');
    
    try {
      // Discover available endpoints
      await this.discoverEndpoints();
      
      // Setup routing rules
      this.setupRoutingRules();
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      // Setup load balancing
      this.setupLoadBalancing();
      
      this.isInitialized = true;
      this.emit('router:initialized', { endpoints: this.endpoints.size });
      
      console.log('AI Model Router initialized successfully');
      console.log(`Discovered ${this.endpoints.size} endpoints`);
      
    } catch (error) {
      console.error('Failed to initialize AI Model Router:', error);
      this.emit('router:error', { error: error.message });
    }
  }

  async discoverEndpoints() {
    const endpoints = [];
    
    // 1. Local Transformers Model Server (via IPFS Accelerate Bridge)
    if (window.ipfsAccelerateBridge && window.ipfsAccelerateBridge.isInitialized) {
      endpoints.push({
        id: 'local-transformers',
        type: 'LOCAL_TRANSFORMERS',
        name: 'Local Transformers Server',
        capabilities: Object.keys(window.ipfsAccelerateBridge.supportedModels),
        handler: this.createLocalTransformersHandler(),
        status: 'available',
        metrics: {
          latency: 50,
          throughput: 100,
          reliability: 0.99
        }
      });
    }
    
    // 2. P2P Network Peers
    if (window.p2pMLSystem && window.p2pMLSystem.isRunning) {
      const peers = window.p2pMLSystem.getConnectedPeers();
      peers.forEach(peer => {
        if (peer.capabilities && peer.capabilities.models) {
          endpoints.push({
            id: `p2p-${peer.id}`,
            type: 'P2P_PEER',
            name: `P2P Peer: ${peer.nickname || peer.id.substring(0, 8)}`,
            capabilities: peer.capabilities.models,
            handler: this.createP2PHandler(peer),
            status: 'available',
            metrics: {
              latency: peer.latency || 200,
              throughput: peer.capabilities.throughput || 50,
              reliability: peer.reliability || 0.85
            }
          });
        }
      });
    }
    
    // 3. Cloud API Endpoints (OpenAI, Anthropic, etc.)
    const cloudEndpoints = this.getConfiguredCloudEndpoints();
    endpoints.push(...cloudEndpoints);
    
    // 4. IPFS Distributed Models
    if (window.ipfsModelStorage) {
      endpoints.push({
        id: 'ipfs-distributed',
        type: 'IPFS_DISTRIBUTED',
        name: 'IPFS Distributed Models',
        capabilities: ['text-generation', 'text-embedding'],
        handler: this.createIPFSHandler(),
        status: 'available',
        metrics: {
          latency: 300,
          throughput: 30,
          reliability: 0.90
        }
      });
    }
    
    // Store endpoints
    endpoints.forEach(endpoint => {
      this.endpoints.set(endpoint.id, endpoint);
      this.healthMonitor.set(endpoint.id, {
        lastCheck: Date.now(),
        status: endpoint.status,
        consecutiveFailures: 0
      });
    });
    
    console.log(`Discovered ${endpoints.length} AI endpoints`);
  }

  getConfiguredCloudEndpoints() {
    const endpoints = [];
    
    // Check for configured API keys
    const apiKeys = this.getStoredApiKeys();
    
    if (apiKeys.openai) {
      endpoints.push({
        id: 'openai-api',
        type: 'CLOUD_API',
        name: 'OpenAI API',
        capabilities: ['text-generation', 'text-embedding', 'code-generation'],
        handler: this.createOpenAIHandler(apiKeys.openai),
        status: 'available',
        metrics: {
          latency: 150,
          throughput: 200,
          reliability: 0.99
        }
      });
    }
    
    if (apiKeys.anthropic) {
      endpoints.push({
        id: 'anthropic-api',
        type: 'CLOUD_API',
        name: 'Anthropic Claude API',
        capabilities: ['text-generation', 'question-answering'],
        handler: this.createAnthropicHandler(apiKeys.anthropic),
        status: 'available',
        metrics: {
          latency: 180,
          throughput: 150,
          reliability: 0.98
        }
      });
    }
    
    return endpoints;
  }

  getStoredApiKeys() {
    // Integration with API Keys Manager
    try {
      const apiKeysData = localStorage.getItem('swissknife-api-keys');
      return apiKeysData ? JSON.parse(apiKeysData) : {};
    } catch (error) {
      console.warn('Could not load API keys for AI router:', error);
      return {};
    }
  }

  setupRoutingRules() {
    // Define routing rules based on request type, model requirements, etc.
    this.routingRules.set('text-generation', {
      preferLocal: true,
      fallbackToCloud: true,
      maxLatency: 5000,
      costSensitive: false
    });
    
    this.routingRules.set('text-embedding', {
      preferLocal: true,
      fallbackToCloud: false,
      maxLatency: 2000,
      costSensitive: true
    });
    
    this.routingRules.set('code-generation', {
      preferLocal: false,
      fallbackToCloud: true,
      maxLatency: 10000,
      costSensitive: false
    });
  }

  async routeRequest(request) {
    const { 
      capability, 
      model, 
      input, 
      options = {},
      priority = 'normal'
    } = request;
    
    const requestId = this.generateRequestId();
    const startTime = Date.now();
    
    try {
      // Log request
      this.emit('request:started', { requestId, capability, model });
      
      // Find suitable endpoints
      const suitableEndpoints = this.findSuitableEndpoints(capability, model, options);
      
      if (suitableEndpoints.length === 0) {
        throw new Error(`No suitable endpoints found for capability: ${capability}`);
      }
      
      // Select optimal endpoint
      const selectedEndpoint = this.selectOptimalEndpoint(suitableEndpoints, priority, options);
      
      console.log(`Routing request ${requestId} to endpoint: ${selectedEndpoint.name}`);
      
      // Execute request
      const result = await this.executeRequest(selectedEndpoint, request);
      
      // Update metrics
      const responseTime = Date.now() - startTime;
      this.updateEndpointMetrics(selectedEndpoint.id, responseTime, true);
      
      // Log successful request
      this.logRequest(requestId, selectedEndpoint.id, responseTime, true);
      this.emit('request:completed', { requestId, endpoint: selectedEndpoint.id, responseTime });
      
      return {
        success: true,
        requestId,
        result,
        metadata: {
          endpoint: selectedEndpoint.name,
          responseTime,
          model: model || 'auto-selected'
        }
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.logRequest(requestId, null, responseTime, false, error.message);
      this.emit('request:failed', { requestId, error: error.message });
      
      // Try fallback if available
      if (!options.noFallback) {
        console.log(`Primary request failed, attempting fallback...`);
        return await this.attemptFallback(request, requestId);
      }
      
      throw error;
    }
  }

  findSuitableEndpoints(capability, model, options) {
    const endpoints = Array.from(this.endpoints.values());
    
    return endpoints.filter(endpoint => {
      // Check if endpoint is healthy
      const health = this.healthMonitor.get(endpoint.id);
      if (health.status !== 'available' || health.consecutiveFailures > 3) {
        return false;
      }
      
      // Check capability match
      if (model) {
        return endpoint.capabilities.includes(model);
      } else {
        const capabilityModels = this.modelCapabilities[capability] || [];
        return endpoint.capabilities.some(cap => capabilityModels.includes(cap));
      }
    });
  }

  selectOptimalEndpoint(endpoints, priority, options) {
    if (endpoints.length === 1) {
      return endpoints[0];
    }
    
    // Score endpoints based on multiple factors
    const scoredEndpoints = endpoints.map(endpoint => {
      let score = 0;
      
      // Priority score (lower priority number = higher score)
      const priorityWeight = this.endpointTypes[endpoint.type].priority;
      score += (6 - priorityWeight) * 10;
      
      // Latency score (lower latency = higher score)
      const latency = endpoint.metrics.latency;
      score += Math.max(0, 500 - latency) / 10;
      
      // Reliability score
      score += endpoint.metrics.reliability * 20;
      
      // Load balancing (prefer less used endpoints)
      const usage = this.loadBalancer.get(endpoint.id) || 0;
      score += Math.max(0, 10 - usage);
      
      // Cost consideration (for cost-sensitive requests)
      if (options.costSensitive && this.endpointTypes[endpoint.type].cost === 'high') {
        score -= 15;
      }
      
      return { endpoint, score };
    });
    
    // Sort by score (highest first)
    scoredEndpoints.sort((a, b) => b.score - a.score);
    
    return scoredEndpoints[0].endpoint;
  }

  async executeRequest(endpoint, request) {
    // Update load balancer
    const currentLoad = this.loadBalancer.get(endpoint.id) || 0;
    this.loadBalancer.set(endpoint.id, currentLoad + 1);
    
    try {
      const result = await endpoint.handler(request);
      return result;
    } finally {
      // Decrease load
      this.loadBalancer.set(endpoint.id, Math.max(0, currentLoad));
    }
  }

  async attemptFallback(request, originalRequestId) {
    const fallbackEndpoints = Array.from(this.endpoints.values())
      .filter(endpoint => endpoint.type === 'CLOUD_API')
      .sort((a, b) => this.endpointTypes[a.type].priority - this.endpointTypes[b.type].priority);
    
    for (const endpoint of fallbackEndpoints) {
      try {
        console.log(`Trying fallback endpoint: ${endpoint.name}`);
        const result = await this.executeRequest(endpoint, request);
        
        this.emit('request:fallback-success', { 
          originalRequestId, 
          fallbackEndpoint: endpoint.id 
        });
        
        return {
          success: true,
          requestId: originalRequestId,
          result,
          metadata: {
            endpoint: endpoint.name,
            fallback: true
          }
        };
      } catch (error) {
        console.warn(`Fallback endpoint ${endpoint.name} failed:`, error.message);
        continue;
      }
    }
    
    throw new Error('All endpoints failed, including fallbacks');
  }

  // Endpoint handlers
  createLocalTransformersHandler() {
    return async (request) => {
      const { capability, model, input, options } = request;
      
      // Use the local transformers model server
      const modelServer = window.ipfsAccelerateBridge.modelServer;
      
      // Auto-select model if not specified
      const selectedModel = model || this.selectModelForCapability(capability, 'local');
      
      // Ensure model is loaded
      if (!modelServer.getLoadedModels().includes(selectedModel)) {
        await modelServer.loadModel(selectedModel);
      }
      
      // Run inference
      return await modelServer.inference(selectedModel, input, options);
    };
  }

  createP2PHandler(peer) {
    return async (request) => {
      // Use P2P ML system to route request to peer
      if (window.p2pMLSystem) {
        return await window.p2pMLSystem.requestInference(peer.id, request);
      }
      throw new Error('P2P ML system not available');
    };
  }

  createIPFSHandler() {
    return async (request) => {
      // Use IPFS model storage for distributed inference
      if (window.ipfsModelStorage) {
        return await window.ipfsModelStorage.distributedInference(request);
      }
      throw new Error('IPFS model storage not available');
    };
  }

  createOpenAIHandler(apiKey) {
    return async (request) => {
      const { input, options } = request;
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: options.model || 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: input }],
          max_tokens: options.maxTokens || 150,
          temperature: options.temperature || 0.7
        })
      });
      
      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        generated_text: data.choices[0].message.content
      };
    };
  }

  createAnthropicHandler(apiKey) {
    return async (request) => {
      const { input, options } = request;
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: options.model || 'claude-3-sonnet-20240229',
          max_tokens: options.maxTokens || 150,
          messages: [{ role: 'user', content: input }]
        })
      });
      
      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        generated_text: data.content[0].text
      };
    };
  }

  selectModelForCapability(capability, endpointType) {
    const availableModels = this.modelCapabilities[capability] || [];
    
    if (endpointType === 'local') {
      // Prefer smaller, faster models for local inference
      const localPreference = ['distilbert-base-uncased', 'bert-base-uncased', 't5-small', 'gpt2'];
      for (const model of localPreference) {
        if (availableModels.includes(model)) {
          return model;
        }
      }
    }
    
    return availableModels[0] || null;
  }

  startHealthMonitoring() {
    setInterval(() => {
      this.checkEndpointHealth();
    }, 30000); // Check every 30 seconds
  }

  async checkEndpointHealth() {
    for (const [endpointId, endpoint] of this.endpoints) {
      try {
        // Simple health check - attempt a lightweight operation
        const healthCheck = await this.performHealthCheck(endpoint);
        
        if (healthCheck.success) {
          this.updateEndpointHealth(endpointId, 'available', 0);
        } else {
          this.updateEndpointHealth(endpointId, 'degraded', 1);
        }
      } catch (error) {
        this.updateEndpointHealth(endpointId, 'unavailable', 1);
      }
    }
  }

  async performHealthCheck(endpoint) {
    // Simple ping/status check based on endpoint type
    switch (endpoint.type) {
      case 'LOCAL_TRANSFORMERS':
        return { success: window.ipfsAccelerateBridge?.isInitialized || false };
        
      case 'P2P_PEER':
        return { success: window.p2pMLSystem?.isRunning || false };
        
      case 'CLOUD_API':
        // For cloud APIs, we could do a simple API call
        return { success: true }; // Assume available unless proven otherwise
        
      default:
        return { success: true };
    }
  }

  updateEndpointHealth(endpointId, status, failureIncrement) {
    const health = this.healthMonitor.get(endpointId);
    if (health) {
      health.lastCheck = Date.now();
      health.status = status;
      health.consecutiveFailures = status === 'available' ? 0 : 
        health.consecutiveFailures + failureIncrement;
    }
  }

  updateEndpointMetrics(endpointId, responseTime, success) {
    const endpoint = this.endpoints.get(endpointId);
    if (endpoint) {
      // Update latency with exponential moving average
      endpoint.metrics.latency = Math.round(
        endpoint.metrics.latency * 0.8 + responseTime * 0.2
      );
      
      // Update reliability
      const currentReliability = endpoint.metrics.reliability;
      endpoint.metrics.reliability = success ?
        Math.min(0.99, currentReliability * 0.95 + 0.05) :
        Math.max(0.1, currentReliability * 0.9);
    }
  }

  logRequest(requestId, endpointId, responseTime, success, error = null) {
    this.requestHistory.push({
      requestId,
      endpointId,
      responseTime,
      success,
      error,
      timestamp: Date.now()
    });
    
    // Keep only last 1000 requests
    if (this.requestHistory.length > 1000) {
      this.requestHistory = this.requestHistory.slice(-1000);
    }
  }

  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods
  getAvailableEndpoints() {
    return Array.from(this.endpoints.values()).map(endpoint => ({
      id: endpoint.id,
      name: endpoint.name,
      type: endpoint.type,
      capabilities: endpoint.capabilities,
      status: this.healthMonitor.get(endpoint.id)?.status || 'unknown',
      metrics: endpoint.metrics
    }));
  }

  getRoutingStats() {
    const totalRequests = this.requestHistory.length;
    const successfulRequests = this.requestHistory.filter(r => r.success).length;
    const avgResponseTime = totalRequests > 0 ?
      this.requestHistory.reduce((sum, r) => sum + r.responseTime, 0) / totalRequests : 0;
    
    return {
      totalRequests,
      successfulRequests,
      successRate: totalRequests > 0 ? successfulRequests / totalRequests : 0,
      avgResponseTime: Math.round(avgResponseTime),
      endpointUsage: this.getEndpointUsageStats()
    };
  }

  getEndpointUsageStats() {
    const usage = {};
    this.requestHistory.forEach(request => {
      if (request.endpointId) {
        usage[request.endpointId] = (usage[request.endpointId] || 0) + 1;
      }
    });
    return usage;
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
    console.log('Destroying AI Model Router...');
    this.eventListeners.clear();
    this.endpoints.clear();
    this.isInitialized = false;
    console.log('AI Model Router destroyed');
  }
}

// Initialize and expose globally
window.AIModelRouter = AIModelRouter;

// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    // Wait for other systems to initialize first
    setTimeout(() => {
      window.aiModelRouter = new AIModelRouter();
    }, 1000);
  });
}

export { AIModelRouter };