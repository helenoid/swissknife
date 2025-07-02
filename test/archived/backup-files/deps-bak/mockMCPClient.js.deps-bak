/**
 * Mock MCP client for testing IPFS storage
 * Enhanced with additional functionality and configurable behavior
 * This implementation provides reliable test functionality for core components
 */

// Shared storage and pins for consistent behavior across test runs
const mockStorage = new Map();
const mockPins = new Set(['mock-cid-1', 'mock-cid-2']);

// Define common error types for consistent error simulation
const ERROR_TYPES = {
  NETWORK: 'network',
  TIMEOUT: 'timeout',
  SERVER: 'server',
  AUTH: 'auth',
  NOT_FOUND: 'not_found',
  CONTENT_REJECTED: 'content_rejected'
};

/**
 * Create a configurable mock MCP client for testing IPFS storage
 * @param {object} options - Configuration options
 * @returns {object} Mock MCP client implementation
 */
const createMockMCPClient = (options = {}) => {
  // Default storage state can be pre-populated
  if (!mockStorage.has('test-cid-1')) {
    mockStorage.set('test-cid-1', { content: 'Test content 1', pins: 2 });
    mockStorage.set('test-cid-2', { content: 'Test content 2', pins: 1 });
  }
  
  const defaultOptions = {
    successRate: 1.0,  // Success rate for operations (0.0-1.0)
    delay: 0,          // Delay in ms for async operations
    emulateErrors: false, // Whether to emulate specific error conditions
    errorType: ERROR_TYPES.NETWORK, // Type of error to simulate
    contentPrefix: 'mock-content-', // Prefix for mock content
    persistentStorage: true // Whether to use persistent storage across test runs
  };
  
  const config = { ...defaultOptions, ...options };
  
  // Helper to introduce delayed response
  const delayResponse = (fn) => {
    if (config.delay > 0) {
      return (...args) => new Promise((resolve, reject) => {
        setTimeout(() => {
          try {
            const result = fn(...args);
            if (result instanceof Promise) {
              result.then(resolve).catch(reject);
            } else {
              resolve(result);
            }
          } catch (error) {
            reject(error);
          }
        }, config.delay);
      });
    }
    return fn;
  };
  
  // Helper to introduce random failures
  const maybeSucceed = (fn) => {
    return (...args) => {
      if (Math.random() < config.successRate) {
        return fn(...args);
      }
      return Promise.reject(new Error("Random operation failure for testing"));
    };
  };
  
  // Utility function to generate error based on configuration
  const generateError = (operation, id) => {
    switch (config.errorType) {
      case ERROR_TYPES.NETWORK:
        return new Error(`Network error during ${operation} for ${id}`);
      case ERROR_TYPES.TIMEOUT:
        return new Error(`Operation timeout during ${operation} for ${id}`);
      case ERROR_TYPES.SERVER:
        return new Error(`Server error (500) during ${operation} for ${id}`);
      case ERROR_TYPES.AUTH:
        return new Error(`Authentication failed during ${operation} for ${id}`);
      case ERROR_TYPES.NOT_FOUND:
        return new Error(`Resource not found during ${operation} for ${id}`);
      case ERROR_TYPES.CONTENT_REJECTED:
        return new Error(`Content rejected during ${operation} for ${id}`);
      default:
        return new Error(`Error during ${operation} for ${id}`);
    }
  };

  const client = {
    // Add content to IPFS and get a CID
    addContent: jest.fn().mockImplementation(delayResponse(maybeSucceed((content, options = {}) => {
      // Generate consistent CID based on content
      let contentStr = '';
      if (Buffer.isBuffer(content)) {
        contentStr = content.toString('utf8');
      } else if (typeof content === 'string') {
        contentStr = content;
      } else {
        contentStr = JSON.stringify(content);
      }
      
      // Use consistent CID generation or custom CID if provided
      const cid = options.cid || options.fixedCid || 
                  `mock-cid-${contentStr.slice(0, 10).replace(/[^a-z0-9]/gi, '')}-${Date.now().toString(36)}`;
      
      if (config.persistentStorage) {
        mockStorage.set(cid, {
          content: Buffer.isBuffer(content) ? content : Buffer.from(contentStr),
          timestamp: Date.now(),
          metadata: options.metadata || {}
        });
      }
      
      return Promise.resolve({ cid });
    }))),
    
    // Get content by CID
    getContent: jest.fn().mockImplementation(delayResponse(maybeSucceed((cid, options = {}) => {
      // Handle special test CIDs
      if (cid === 'mock-cid-get') {
        return Promise.resolve({
          content: Buffer.from(`${config.contentPrefix} for mock-cid-get`),
          metadata: { type: 'test', timestamp: Date.now() }
        });
      }
      
      if (cid === 'non-existent-cid') {
        return Promise.reject(generateError('getContent', cid));
      }
      
      // Handle stored content
      const storedItem = mockStorage.get(cid);
      if (!storedItem) {
        return Promise.reject(generateError('getContent', cid));
      }
      
      return Promise.resolve({
        content: storedItem.content,
        metadata: { ...storedItem.metadata, retrieved: true }
      });
    }))),
    
    // Pin content by CID
    pinContent: jest.fn().mockImplementation(delayResponse(maybeSucceed((cid, options = {}) => {
      mockPins.add(cid);
      
      // Update pin count in storage if present
      const storedItem = mockStorage.get(cid);
      if (storedItem) {
        storedItem.pins = (storedItem.pins || 0) + 1;
        mockStorage.set(cid, storedItem);
      }
      
      return Promise.resolve({
        cid,
        pinned: true,
        pins: storedItem ? storedItem.pins : 1
      });
    }))),
    
    // Unpin content by CID
    unpinContent: jest.fn().mockImplementation(delayResponse(maybeSucceed((cid, options = {}) => {
      // Handle special test cases
      if (cid === 'mock-cid-fail-delete' || cid === 'mock-cid-error-delete') {
        return Promise.resolve({ cid, unpinned: false });
      }
      
      const existed = mockPins.has(cid);
      mockPins.delete(cid);
      
      // Update pin count in storage if present
      const storedItem = mockStorage.get(cid);
      if (storedItem && storedItem.pins) {
        storedItem.pins = Math.max(0, storedItem.pins - 1);
        mockStorage.set(cid, storedItem);
      }
      
      return Promise.resolve({ 
        cid, 
        unpinned: existed, 
        pins: storedItem ? storedItem.pins : 0 
      });
    }))),
    
    // List pinned CIDs
    listPins: jest.fn().mockImplementation(delayResponse(maybeSucceed((options = {}) => {
      const pinList = [...mockPins].map(cid => {
        const item = mockStorage.get(cid) || {};
        return {
          cid,
          pins: item.pins || 1,
          metadata: item.metadata || {}
        };
      });
      
      return Promise.resolve(pinList);
    }))),
    
    // Simulate DAG API for advanced testing
    dag: {
      get: jest.fn().mockImplementation(delayResponse(maybeSucceed((cid, path) => {
        if (!mockStorage.has(cid)) {
          return Promise.reject(generateError('dag.get', cid));
        }
        
        try {
          // Try to parse content as JSON for DAG operations
          const content = mockStorage.get(cid).content;
          let data;
          
          if (Buffer.isBuffer(content)) {
            data = JSON.parse(content.toString('utf8'));
          } else {
            data = JSON.parse(content);
          }
          
          // Handle path traversal
          if (path) {
            const segments = path.split('/').filter(Boolean);
            let current = data;
            for (const segment of segments) {
              if (current[segment] === undefined) {
                return Promise.reject(new Error(`Path not found: ${path}`));
              }
              current = current[segment];
            }
            return Promise.resolve({ value: current });
          }
          
          return Promise.resolve({ value: data });
        } catch (e) {
          return Promise.reject(new Error(`Invalid DAG content: ${e.message}`));
        }
      }))
    },
    
    // Utility methods for testing
    _reset: jest.fn().mockImplementation(() => {
      mockStorage.clear();
      mockPins.clear();
      // Add some default pins
      mockPins.add('mock-cid-1');
      mockPins.add('mock-cid-2');
      // Add some default content
      mockStorage.set('test-cid-1', { content: Buffer.from('Test content 1'), pins: 2 });
      mockStorage.set('test-cid-2', { content: Buffer.from('Test content 2'), pins: 1 });
    }),
    
    _getStorageSize: jest.fn().mockImplementation(() => {
      return mockStorage.size;
    }),
    
    _getPinsSize: jest.fn().mockImplementation(() => {
      return mockPins.size;
    })
  };
  
  return client;
};

// Export a pre-configured instance and the factory
module.exports = { 
  createMockMCPClient,
  
  // Default export for convenience when used with jest.mock
  default: createMockMCPClient(),
  
  // For use as an ES module (imported as MCPClient)
  MCPClient: createMockMCPClient()
};
