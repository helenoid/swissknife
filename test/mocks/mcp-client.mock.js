/**
 * Enhanced Mock MCP Client for testing
 * 
 * This mock provides a consistent implementation of the MCP client for testing
 * storage components. It tracks all calls and provides typed responses.
 */

// Map for storing content by CID
const mockStorage = new Map();

/**
 * Reset the mock storage (helpful between tests)
 */
export function resetMockStorage() {
  mockStorage.clear();
}

/**
 * Mock MCPClient class
 */
export class MockMCPClient {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || 'http://mock-mcp-endpoint:5001';
    this.mockData = {
      calls: {
        addContent: [],
        getContent: [],
        pinContent: [],
        unpinContent: [],
        listPins: [],
      },
      responses: {
        // Custom responses can be set here
      },
    };
  }

  /**
   * Add content to IPFS
   * @param {string|Buffer} content Content to add
   * @returns {Promise<{cid: string}>} CID object
   */
  async addContent(content) {
    this.mockData.calls.addContent.push({ content });
    
    const data = typeof content === 'string' ? Buffer.from(content) : content;
    const cid = `mock-cid-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    mockStorage.set(cid, data);
    
    return { cid };
  }

  /**
   * Get content from IPFS by CID
   * @param {string} cid Content identifier
   * @returns {Promise<Buffer>} Content data
   */
  async getContent(cid) {
    this.mockData.calls.getContent.push({ cid });
    
    const content = mockStorage.get(cid);
    if (!content) {
      throw new Error(`Content not found for CID: ${cid}`);
    }
    
    return content;
  }

  /**
   * Pin content in IPFS
   * @param {string} cid Content identifier to pin
   * @returns {Promise<boolean>} Success status
   */
  async pinContent(cid) {
    this.mockData.calls.pinContent.push({ cid });
    
    return mockStorage.has(cid);
  }

  /**
   * Unpin content from IPFS
   * @param {string} cid Content identifier to unpin
   * @returns {Promise<boolean>} Success status
   */
  async unpinContent(cid) {
    this.mockData.calls.unpinContent.push({ cid });
    
    return mockStorage.delete(cid);
  }

  /**
   * List pinned CIDs
   * @returns {Promise<string[]>} Array of pinned CIDs
   */
  async listPins() {
    this.mockData.calls.listPins.push({});
    
    return Array.from(mockStorage.keys());
  }

  /**
   * Helper to set custom response for a method
   * @param {string} method Method name
   * @param {*} response Response to return
   */
  setResponse(method, response) {
    this.mockData.responses[method] = response;
  }

  /**
   * Helper to get calls for a method
   * @param {string} method Method name
   * @returns {Array} Array of calls
   */
  getCalls(method) {
    return this.mockData.calls[method] || [];
  }
}

// Export mock creator for Jest
export const createMockMCPClient = (config = {}) => new MockMCPClient(config);

// Default export is the mock class
export default MockMCPClient;
