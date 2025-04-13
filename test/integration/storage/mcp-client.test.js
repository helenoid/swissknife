/**
 * Tests for the IPFS MCP Client
 */

import { MCPClient } from '../../../src/storage/ipfs/mcp-client';

// Mock axios
jest.mock('axios', () => {
  // Create a mock axios instance
  const mockGet = jest.fn().mockImplementation((url) => {
    if (url === '/status') {
      return Promise.resolve({ status: 200, data: { status: 'ok' } });
    }
    
    if (url.startsWith('/content/')) {
      const cid = url.replace('/content/', '');
      return Promise.resolve({
        data: {
          cid,
          content: 'test content',
          encoding: 'utf8'
        }
      });
    }
    
    if (url.startsWith('/ipld/node/')) {
      const cid = url.replace('/ipld/node/', '');
      return Promise.resolve({
        data: {
          cid,
          data: { test: 'data' },
          links: [
            { name: 'test-link', cid: 'test-link-cid' }
          ]
        }
      });
    }
    
    return Promise.reject(new Error(`Unhandled GET request: ${url}`));
  });

  const mockPost = jest.fn().mockImplementation((url, data) => {
    if (url === '/content') {
      return Promise.resolve({
        data: {
          cid: `cid-${Math.random().toString(36).substring(2, 9)}`
        }
      });
    }
    
    if (url === '/ipld/node') {
      return Promise.resolve({
        data: {
          cid: `cid-${Math.random().toString(36).substring(2, 9)}`
        }
      });
    }
    
    if (url === '/car') {
      return Promise.resolve({
        data: {
          carCid: `car-cid-${Math.random().toString(36).substring(2, 9)}`
        }
      });
    }
    
    return Promise.reject(new Error(`Unhandled POST request: ${url}`));
  });

  // Return mock axios
  return {
    create: jest.fn().mockReturnValue({
      get: mockGet,
      post: mockPost
    })
  };
});

// Mock the LogManager
jest.mock('../../../src/utils/logging/manager', () => ({
  LogManager: {
    getInstance: jest.fn().mockReturnValue({
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    })
  }
}));

// Mock the ConfigurationManager
jest.mock('../../../src/config/manager', () => ({
  ConfigurationManager: {
    getInstance: jest.fn().mockReturnValue({
      get: jest.fn().mockImplementation((key, defaultValue) => defaultValue)
    })
  }
}));

describe('MCPClient', () => {
  let client;
  
  beforeEach(() => {
    client = new MCPClient({
      baseUrl: 'http://localhost:5000',
      token: 'test-token'
    });
    
    // Reset mock data
    jest.clearAllMocks();
  });
  
  test('should initialize with default values', () => {
    const defaultClient = new MCPClient();
    expect(defaultClient).toBeDefined();
  });
  
  test('should connect to the MCP server', async () => {
    const result = await client.connect();
    
    expect(result).toBe(true);
    expect(client.isConnectedToServer()).toBe(true);
    
    const axiosCreate = require('axios').create;
    const mockAxiosInstance = axiosCreate();
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/status');
  });
  
  test('should disconnect from the MCP server', async () => {
    // First connect
    await client.connect();
    expect(client.isConnectedToServer()).toBe(true);
    
    // Then disconnect
    client.disconnect();
    expect(client.isConnectedToServer()).toBe(false);
  });
  
  test('should add content to IPFS', async () => {
    // First connect
    await client.connect();
    
    // Add string content
    const stringResult = await client.addContent('test content');
    expect(stringResult).toHaveProperty('cid');
    expect(typeof stringResult.cid).toBe('string');
    
    // Add buffer content
    const bufferResult = await client.addContent(Buffer.from('test buffer content'));
    expect(bufferResult).toHaveProperty('cid');
    
    // Check that the correct data was sent
    const axiosCreate = require('axios').create;
    const mockAxiosInstance = axiosCreate();
    expect(mockAxiosInstance.post).toHaveBeenCalledTimes(2);
    
    // First call should have string content with utf8 encoding
    expect(mockAxiosInstance.post.mock.calls[0][0]).toBe('/content');
    expect(mockAxiosInstance.post.mock.calls[0][1]).toHaveProperty('content', 'test content');
    expect(mockAxiosInstance.post.mock.calls[0][1]).toHaveProperty('encoding', 'utf8');
    
    // Second call should have base64 encoded buffer
    expect(mockAxiosInstance.post.mock.calls[1][0]).toBe('/content');
    expect(mockAxiosInstance.post.mock.calls[1][1]).toHaveProperty('encoding', 'base64');
  });
  
  test('should get content from IPFS', async () => {
    // First connect
    await client.connect();
    
    // Get content as string (default)
    const stringContent = await client.getContent('test-cid');
    expect(typeof stringContent).toBe('string');
    expect(stringContent).toBe('test content');
    
    // Get content as buffer
    const bufferContent = await client.getContent('test-cid', 'buffer');
    expect(Buffer.isBuffer(bufferContent)).toBe(true);
    
    // Check that the correct requests were made
    const axiosCreate = require('axios').create;
    const mockAxiosInstance = axiosCreate();
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/content/test-cid');
  });
  
  test('should add and get IPLD nodes', async () => {
    // First connect
    await client.connect();
    
    // Add a node
    const data = { test: 'data', nested: { foo: 'bar' } };
    const links = [
      { name: 'link1', cid: 'cid1' },
      { name: 'link2', cid: 'cid2' }
    ];
    
    const addResult = await client.addNode(data, links);
    expect(addResult).toHaveProperty('cid');
    
    // Get a node
    const nodeResult = await client.getNode('test-node-cid');
    expect(nodeResult).toHaveProperty('cid');
    expect(nodeResult).toHaveProperty('data');
    expect(nodeResult).toHaveProperty('links');
    
    // Check that the correct requests were made
    const axiosCreate = require('axios').create;
    const mockAxiosInstance = axiosCreate();
    
    // For addNode
    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/ipld/node', {
      data,
      links
    });
    
    // For getNode
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/ipld/node/test-node-cid');
  });
  
  test('should create CAR files', async () => {
    // First connect
    await client.connect();
    
    // Create a CAR file with roots only
    const roots = ['root1', 'root2'];
    const carResult = await client.createCar(roots);
    
    expect(carResult).toHaveProperty('carCid');
    expect(typeof carResult.carCid).toBe('string');
    
    // Create a CAR file with roots and blocks
    const blocks = {
      'block1': Buffer.from('block1 data'),
      'block2': Buffer.from('block2 data')
    };
    
    const carResultWithBlocks = await client.createCar(roots, blocks);
    expect(carResultWithBlocks).toHaveProperty('carCid');
    
    // Check that the correct requests were made
    const axiosCreate = require('axios').create;
    const mockAxiosInstance = axiosCreate();
    const postCalls = mockAxiosInstance.post.mock.calls;
    
    // Verify we have calls to /car endpoint
    const carCalls = postCalls.filter(call => call[0] === '/car');
    expect(carCalls.length).toBe(2);
    
    // One call should have just roots
    const rootsOnlyCall = carCalls.find(call => !call[1].blocks);
    expect(rootsOnlyCall).toBeDefined();
    expect(rootsOnlyCall[1].roots).toEqual(roots);
    
    // One call should have roots and blocks
    const blocksCall = carCalls.find(call => call[1].blocks);
    expect(blocksCall).toBeDefined();
    expect(blocksCall[1].roots).toEqual(roots);
    expect(blocksCall[1].blocks).toBeDefined();
  });
  
  test('should throw errors for operations when not connected', async () => {
    // Don't connect
    
    // Try to add content
    await expect(client.addContent('test content'))
      .rejects.toThrow('Not connected to MCP server');
    
    // Try to get content
    await expect(client.getContent('test-cid'))
      .rejects.toThrow('Not connected to MCP server');
    
    // Try to add a node
    await expect(client.addNode({ test: 'data' }))
      .rejects.toThrow('Not connected to MCP server');
    
    // Try to get a node
    await expect(client.getNode('test-cid'))
      .rejects.toThrow('Not connected to MCP server');
    
    // Try to create a CAR file
    await expect(client.createCar(['root1']))
      .rejects.toThrow('Not connected to MCP server');
  });
});