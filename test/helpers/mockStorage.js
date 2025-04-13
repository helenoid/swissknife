/**
 * Mock storage helper for tests
 * 
 * Provides a mock implementation of storage interfaces for testing
 */

/**
 * Create a mock storage instance for testing
 * 
 * @param {Object} options Configuration options for the mock storage
 * @returns {Object} A mock storage implementation
 */
export function createMockStorage(options = {}) {
  const contentStore = new Map();
  const nodeStore = new Map();
  const carStore = new Map();
  
  return {
    isConnected: true,
    
    connect: jest.fn().mockResolvedValue(true),
    
    disconnect: jest.fn().mockResolvedValue(true),
    
    isConnectedToServer: jest.fn().mockReturnValue(true),
    
    add: jest.fn().mockImplementation(async (content) => {
      const cid = `mock-cid-${Math.random().toString(36).substring(2, 9)}`;
      contentStore.set(cid, content);
      return cid;
    }),
    
    get: jest.fn().mockImplementation(async (cid) => {
      if (!contentStore.has(cid)) {
        throw new Error(`Content with CID ${cid} not found`);
      }
      return contentStore.get(cid);
    }),
    
    addNode: jest.fn().mockImplementation(async (data, links = []) => {
      const cid = `mock-node-${Math.random().toString(36).substring(2, 9)}`;
      nodeStore.set(cid, { data, links });
      return cid;
    }),
    
    getNode: jest.fn().mockImplementation(async (cid) => {
      if (!nodeStore.has(cid)) {
        throw new Error(`Node with CID ${cid} not found`);
      }
      return nodeStore.get(cid);
    }),
    
    createCar: jest.fn().mockImplementation(async (roots, blocks = {}) => {
      const carCid = `mock-car-${Math.random().toString(36).substring(2, 9)}`;
      carStore.set(carCid, { roots, blocks });
      return { carCid, size: 1024 };
    }),
    
    loadCar: jest.fn().mockImplementation(async (carCid) => {
      if (!carStore.has(carCid)) {
        throw new Error(`CAR file with CID ${carCid} not found`);
      }
      return carStore.get(carCid);
    }),
    
    // Methods for testing
    _getContentStore: () => contentStore,
    _getNodeStore: () => nodeStore,
    _getCarStore: () => carStore,
    _reset: () => {
      contentStore.clear();
      nodeStore.clear();
      carStore.clear();
    }
  };
}