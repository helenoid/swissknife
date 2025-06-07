/**
 * Mock implementations for IPFS storage and integration
 * 
 * These mocks provide a simulated IPFS environment for testing the
 * storage integration components in Phase 1 of the SwissKnife project.
 */

/**
 * Mock Content Identifier (CID) implementation
 */
class MockCID {
  constructor(value) {
    this.value = value || `cid-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
  
  toString() {
    return this.value;
  }
  
  equals(other) {
    return other && other.value === this.value;
  }
}

/**
 * Mock IPFS client implementation
 */
class MockIPFSClient {
  constructor(options = {}) {
    this.blocks = new Map();
    this.pins = new Set();
    this.delay = options.delay || 10;
    this.errorRate = options.errorRate || 0;
    
    // Track method calls
    this.blockCalls = {
      put: [],
      get: [],
      stat: [],
      rm: []
    };
    
    this.pinCalls = {
      add: [],
      rm: [],
      ls: []
    };
    
    this.dagCalls = {
      put: [],
      get: [],
      resolve: []
    };
  }
  
  /**
   * Block API methods
   */
  block = {
    put: async (data, options = {}) => {
      // Record call
      this.blockCalls.put.push({ data, options });
      
      // Simulate delay
      await this._delay();
      
      // Simulate error
      this._simulateError('block.put');
      
      // Generate CID
      const format = options.format || 'raw';
      const cid = options.cid || new MockCID();
      
      // Store block
      this.blocks.set(cid.toString(), {
        data: Buffer.isBuffer(data) ? data : Buffer.from(data),
        format,
        size: Buffer.isBuffer(data) ? data.length : Buffer.from(data).length
      });
      
      return { cid };
    },
    
    get: async (cid) => {
      // Record call
      this.blockCalls.get.push({ cid });
      
      // Simulate delay
      await this._delay();
      
      // Convert CID to string if needed
      const cidStr = cid.toString ? cid.toString() : cid.toString();
      
      // Check if block exists
      if (!this.blocks.has(cidStr)) {
        throw new Error(`Block not found: ${cidStr}`);
      }
      
      // Simulate error
      this._simulateError('block.get');
      
      // Return block data
      return this.blocks.get(cidStr).data;
    },
    
    stat: async (cid) => {
      // Record call
      this.blockCalls.stat.push({ cid });
      
      // Simulate delay
      await this._delay();
      
      // Convert CID to string if needed
      const cidStr = cid.toString ? cid.toString() : cid.toString();
      
      // Check if block exists
      if (!this.blocks.has(cidStr)) {
        throw new Error(`Block not found: ${cidStr}`);
      }
      
      // Simulate error
      this._simulateError('block.stat');
      
      // Return block stats
      const block = this.blocks.get(cidStr);
      return {
        cid: new MockCID(cidStr),
        size: block.size
      };
    },
    
    rm: async (cid) => {
      // Record call
      this.blockCalls.rm.push({ cid });
      
      // Simulate delay
      await this._delay();
      
      // Convert CID to string if needed
      const cidStr = cid.toString ? cid.toString() : cid.toString();
      
      // Check if block exists
      if (!this.blocks.has(cidStr)) {
        return false;
      }
      
      // Simulate error
      this._simulateError('block.rm');
      
      // Remove block
      this.blocks.delete(cidStr);
      
      // Remove pin if it exists
      if (this.pins.has(cidStr)) {
        this.pins.delete(cidStr);
      }
      
      return true;
    }
  };
  
  /**
   * Pin API methods
   */
  pin = {
    add: async (cid, options = {}) => {
      // Record call
      this.pinCalls.add.push({ cid, options });
      
      // Simulate delay
      await this._delay();
      
      // Simulate error
      this._simulateError('pin.add');
      
      // Convert CID to string if needed
      const cidStr = cid.toString ? cid.toString() : cid.toString();
      
      // Add pin
      this.pins.add(cidStr);
      
      return { cid: new MockCID(cidStr) };
    },
    
    rm: async (cid, options = {}) => {
      // Record call
      this.pinCalls.rm.push({ cid, options });
      
      // Simulate delay
      await this._delay();
      
      // Simulate error
      this._simulateError('pin.rm');
      
      // Convert CID to string if needed
      const cidStr = cid.toString ? cid.toString() : cid.toString();
      
      // Check if pin exists
      if (!this.pins.has(cidStr)) {
        return false;
      }
      
      // Remove pin
      this.pins.delete(cidStr);
      
      return true;
    },
    
    ls: async (options = {}) => {
      // Record call
      this.pinCalls.ls.push({ options });
      
      // Simulate delay
      await this._delay();
      
      // Simulate error
      this._simulateError('pin.ls');
      
      // Filter pins if needed
      let pins = Array.from(this.pins);
      
      if (options.paths) {
        const paths = Array.isArray(options.paths) ? options.paths : [options.paths];
        const pathStrings = paths.map(p => p.toString ? p.toString() : p.toString());
        pins = pins.filter(pin => pathStrings.includes(pin));
      }
      
      // Return pins
      return pins.map(pin => ({
        cid: new MockCID(pin),
        type: 'recursive'
      }));
    }
  };
  
  /**
   * DAG API methods
   */
  dag = {
    put: async (data, options = {}) => {
      // Record call
      this.dagCalls.put.push({ data, options });
      
      // Simulate delay
      await this._delay();
      
      // Simulate error
      this._simulateError('dag.put');
      
      // Store data as JSON
      const serialized = Buffer.from(JSON.stringify(data));
      
      // Generate CID
      const cid = options.cid || new MockCID();
      
      // Store block
      this.blocks.set(cid.toString(), {
        data: serialized,
        format: 'dag-cbor',
        size: serialized.length
      });
      
      return { cid };
    },
    
    get: async (cid, options = {}) => {
      // Record call
      this.dagCalls.get.push({ cid, options });
      
      // Simulate delay
      await this._delay();
      
      // Convert CID to string if needed
      const cidStr = cid.toString ? cid.toString() : cid.toString();
      
      // Check if block exists
      if (!this.blocks.has(cidStr)) {
        throw new Error(`Block not found: ${cidStr}`);
      }
      
      // Simulate error
      this._simulateError('dag.get');
      
      // Get block data
      const block = this.blocks.get(cidStr);
      
      // Parse JSON data
      const data = JSON.parse(block.data.toString());
      
      // Handle path if specified
      if (options.path) {
        let result = data;
        const pathParts = options.path.split('/').filter(Boolean);
        
        for (const part of pathParts) {
          if (result === undefined || result === null) {
            throw new Error(`Path not found: ${options.path}`);
          }
          
          result = result[part];
        }
        
        return { value: result };
      }
      
      return { value: data };
    },
    
    resolve: async (path) => {
      // Record call
      this.dagCalls.resolve.push({ path });
      
      // Simulate delay
      await this._delay();
      
      // Simulate error
      this._simulateError('dag.resolve');
      
      // Split path into CID and remainder
      const [cidStr, ...pathParts] = path.split('/');
      const remainderPath = pathParts.length ? `/${pathParts.join('/')}` : '';
      
      // Check if block exists
      if (!this.blocks.has(cidStr)) {
        throw new Error(`Block not found: ${cidStr}`);
      }
      
      // Return CID and remainder path
      return {
        cid: new MockCID(cidStr),
        remainderPath
      };
    }
  };
  
  /**
   * Helper to simulate delay
   * @returns {Promise<void>}
   */
  async _delay() {
    if (this.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delay));
    }
  }
  
  /**
   * Helper to simulate errors
   * @param {string} method - Method name
   */
  _simulateError(method) {
    if (Math.random() < this.errorRate) {
      throw new Error(`Simulated error in ${method}`);
    }
  }
  
  /**
   * Reset all stored data
   */
  reset() {
    this.blocks.clear();
    this.pins.clear();
    
    // Reset call tracking
    this.blockCalls = {
      put: [],
      get: [],
      stat: [],
      rm: []
    };
    
    this.pinCalls = {
      add: [],
      rm: [],
      ls: []
    };
    
    this.dagCalls = {
      put: [],
      get: [],
      resolve: []
    };
  }
}

/**
 * Mock IPFS Storage Provider implementation
 */
class MockIPFSStorageProvider {
  constructor(options = {}) {
    this.client = options.client || new MockIPFSClient(options);
    
    // Track method calls
    this.calls = {
      add: [],
      get: [],
      list: [],
      delete: [],
      storeTask: [],
      getTask: [],
      updateTask: [],
      listTasks: []
    };
  }
  
  /**
   * Add content to storage
   * @param {string|Buffer} content - Content to store
   * @returns {Promise<string>} - CID of stored content
   */
  async add(content) {
    // Record call
    this.calls.add.push({ content });
    
    // Store content
    const result = await this.client.block.put(content);
    
    // Pin the content
    await this.client.pin.add(result.cid);
    
    return result.cid.toString();
  }
  
  /**
   * Get content from storage
   * @param {string} cid - CID of content to retrieve
   * @returns {Promise<Buffer>} - Retrieved content
   */
  async get(cid) {
    // Record call
    this.calls.get.push({ cid });
    
    // Retrieve content
    return await this.client.block.get(cid);
  }
  
  /**
   * List content in storage
   * @param {Object} options - List options
   * @returns {Promise<string[]>} - Array of CIDs
   */
  async list(options = {}) {
    // Record call
    this.calls.list.push({ options });
    
    // List pins
    const pins = await this.client.pin.ls();
    
    // Convert to array of CID strings
    return pins.map(pin => pin.cid.toString());
  }
  
  /**
   * Delete content from storage
   * @param {string} cid - CID to delete
   * @returns {Promise<boolean>} - Success status
   */
  async delete(cid) {
    // Record call
    this.calls.delete.push({ cid });
    
    // Remove pin
    await this.client.pin.rm(cid);
    
    // Remove block
    return await this.client.block.rm(cid);
  }
  
  /**
   * Store a task
   * @param {Object} task - Task to store
   * @returns {Promise<void>}
   */
  async storeTask(task) {
    // Record call
    this.calls.storeTask.push({ task });
    
    // Store task
    const result = await this.client.dag.put(task);
    
    // Store task ID -> CID mapping
    this._setTaskCID(task.id, result.cid.toString());
  }
  
  /**
   * Get a task
   * @param {string} taskId - Task ID
   * @returns {Promise<Object|null>} - Task or null if not found
   */
  async getTask(taskId) {
    // Record call
    this.calls.getTask.push({ taskId });
    
    // Get task CID
    const cid = this._getTaskCID(taskId);
    if (!cid) {
      return null;
    }
    
    // Retrieve task
    try {
      const result = await this.client.dag.get(cid);
      return result.value;
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Update a task
   * @param {Object} task - Updated task
   * @returns {Promise<void>}
   */
  async updateTask(task) {
    // Record call
    this.calls.updateTask.push({ task });
    
    // Store updated task
    await this.storeTask(task);
  }
  
  /**
   * List tasks
   * @param {Object} filter - Filter options
   * @returns {Promise<Object[]>} - Array of tasks
   */
  async listTasks(filter = {}) {
    // Record call
    this.calls.listTasks.push({ filter });
    
    // Get all task CIDs
    const taskCIDs = this._getAllTaskCIDs();
    
    // Retrieve all tasks
    const tasks = [];
    
    for (const [taskId, cid] of taskCIDs) {
      try {
        const result = await this.client.dag.get(cid);
        const task = result.value;
        
        // Apply filters if specified
        let include = true;
        
        for (const [key, value] of Object.entries(filter)) {
          if (task[key] !== value) {
            include = false;
            break;
          }
        }
        
        if (include) {
          tasks.push(task);
        }
      } catch (error) {
        // Skip tasks that can't be retrieved
      }
    }
    
    return tasks;
  }
  
  // Helper methods for task CID mapping
  _taskCIDMap = new Map();
  
  _setTaskCID(taskId, cid) {
    this._taskCIDMap.set(taskId, cid);
  }
  
  _getTaskCID(taskId) {
    return this._taskCIDMap.get(taskId);
  }
  
  _getAllTaskCIDs() {
    return Array.from(this._taskCIDMap.entries());
  }
  
  /**
   * Reset storage
   */
  reset() {
    this.client.reset();
    this._taskCIDMap.clear();
    
    // Reset call tracking
    this.calls = {
      add: [],
      get: [],
      list: [],
      delete: [],
      storeTask: [],
      getTask: [],
      updateTask: [],
      listTasks: []
    };
  }
}

/**
 * Mock MCP Client for IPFS Kit
 */
class MockMCPClient {
  constructor(options = {}) {
    this.storage = new MockIPFSStorageProvider(options);
    this.baseUrl = options.baseUrl || 'http://localhost:5001';
    this.authentication = options.authentication;
    this.timeout = options.timeout || 30000;
    
    // Track method calls
    this.calls = {
      addContent: [],
      getContent: [],
      storeGraph: [],
      loadGraph: []
    };
  }
  
  /**
   * Add content to IPFS
   * @param {string|Buffer} content - Content to add
   * @returns {Promise<{cid: string}>} - CID of added content
   */
  async addContent(content) {
    // Record call
    this.calls.addContent.push({ content });
    
    // Add content
    const cid = await this.storage.add(content);
    
    return { cid };
  }
  
  /**
   * Get content from IPFS
   * @param {string} cid - CID to retrieve
   * @returns {Promise<Buffer>} - Content
   */
  async getContent(cid) {
    // Record call
    this.calls.getContent.push({ cid });
    
    // Get content
    return await this.storage.get(cid);
  }
  
  /**
   * Store a graph in IPFS
   * @param {Object} graph - Graph to store
   * @returns {Promise<string>} - CID of stored graph
   */
  async storeGraph(graph) {
    // Record call
    this.calls.storeGraph.push({ graph });
    
    // Store graph
    const result = await this.storage.client.dag.put(graph);
    
    return result.cid.toString();
  }
  
  /**
   * Load a graph from IPFS
   * @param {string} cid - CID of graph
   * @returns {Promise<Object>} - Retrieved graph
   */
  async loadGraph(cid) {
    // Record call
    this.calls.loadGraph.push({ cid });
    
    // Load graph
    const result = await this.storage.client.dag.get(cid);
    
    return result.value;
  }
  
  /**
   * Reset client
   */
  reset() {
    this.storage.reset();
    
    // Reset call tracking
    this.calls = {
      addContent: [],
      getContent: [],
      storeGraph: [],
      loadGraph: []
    };
  }
}

module.exports = {
  MockCID,
  MockIPFSClient,
  MockIPFSStorageProvider,
  MockMCPClient
};