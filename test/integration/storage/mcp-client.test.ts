/**
 * Integration Tests for the MCPClient class.
 *
 * These tests verify the client's ability to connect, disconnect, and interact
 * with a mocked MCP server (simulated via axios mock) for operations like
 * content add/get, IPLD node add/get, and CAR file creation.
 */

// --- Mock Setup ---
// Add .js extensions

// Mock axios to simulate MCP server responses
const mockAxiosGet = jest.fn();
const mockAxiosPost = jest.fn();
jest.mock('axios', () => ({
  create: jest.fn().mockReturnValue({
    get: mockAxiosGet,
    post: mockAxiosPost,
  }),
}));

// Mock LogManager
jest.mock('../../../src/utils/logging/manager.js', () => ({
  LogManager: {
    getInstance: jest.fn().mockReturnValue({
      info: jest.fn(), error: jest.fn(), debug: jest.fn(), warn: jest.fn(),
    }),
  },
}));

// Mock ConfigurationManager
jest.mock('../../../src/config/manager.js', () => ({
  ConfigurationManager: {
    getInstance: jest.fn().mockReturnValue({
      get: jest.fn((key, defaultValue) => defaultValue), // Basic mock
    }),
  },
}));

// --- Imports ---
// Add .js extension
import { MCPClient } from '../../../src/storage/ipfs/mcp-client.js'; // Adjust path if needed
import axios from 'axios'; // Import to reference the mocked 'create'

// --- Test Suite ---

describe('MCPClient Integration', () => {
  let client: MCPClient;
  const testBaseUrl = 'http://mock-mcp-server:5001';
  const testToken = 'test-auth-token';

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    mockAxiosGet.mockClear();
    mockAxiosPost.mockClear();

    // Configure default mock responses for axios
    mockAxiosGet.mockImplementation(async (url: string) => {
        console.log(`Mock Axios GET: ${url}`); // Debugging
        if (url === '/status') {
            return { status: 200, data: { status: 'ok', version: 'mock-server-1.0' } };
        }
        if (url.startsWith('/content/')) {
            const cid = url.replace('/content/', '');
            return { status: 200, data: { cid, content: `mock content for ${cid}`, encoding: 'utf8' } };
        }
        if (url.startsWith('/ipld/node/')) {
            const cid = url.replace('/ipld/node/', '');
            return { status: 200, data: { cid, data: { mock: 'data' }, links: [{ name: 'link', cid: 'link-cid' }] } };
        }
        throw new Error(`Unhandled Mock GET request: ${url}`);
    });
    mockAxiosPost.mockImplementation(async (url: string, data: any) => {
        console.log(`Mock Axios POST: ${url}`, data); // Debugging
        if (url === '/content') {
            return { status: 200, data: { cid: `mock-cid-${Math.random().toString(16).slice(2)}` } };
        }
        if (url === '/ipld/node') {
            return { status: 200, data: { cid: `mock-cid-${Math.random().toString(16).slice(2)}` } };
        }
        if (url === '/car') {
            return { status: 200, data: { carCid: `mock-car-cid-${Math.random().toString(16).slice(2)}` } };
        }
        throw new Error(`Unhandled Mock POST request: ${url}`);
    });

    // Create a new client instance for each test
    client = new MCPClient({
      baseUrl: testBaseUrl,
      token: testToken,
    });
  });

  it('should initialize with provided options or defaults', () => {
    // Arrange: Create client with specific options
    const specificClient = new MCPClient({ baseUrl: 'http://specific:1234', token: 'specific-token', timeout: 1000 });
    // Arrange: Create client with default options
    const defaultClient = new MCPClient(); // Assumes constructor handles defaults

    // Assert
    expect((specificClient as any).config.baseUrl).toBe('http://specific:1234');
    expect((specificClient as any).config.token).toBe('specific-token');
    expect((specificClient as any).config.timeout).toBe(1000);
    expect(defaultClient).toBeDefined();
    // Add checks for default values if known
  });

  describe('Connection Handling', () => {
    it('should connect to the MCP server and verify status', async () => {
      // Arrange: Mock the /status response specifically for this test if needed
      // mockAxiosGet.mockResolvedValueOnce({ status: 200, data: { status: 'ok', version: '1.2.3' } });

      // Act
      const result = await client.connect();

      // Assert
      expect(result).toBe(true);
      expect(client.isConnectedToServer()).toBe(true);
      expect(axios.create).toHaveBeenCalledWith({ // Verify axios instance creation
          baseURL: testBaseUrl,
          headers: { Authorization: `Bearer ${testToken}` },
          timeout: expect.any(Number), // Default timeout
      });
      expect(mockAxiosGet).toHaveBeenCalledWith('/status'); // Verify status check
    });

     it('should fail to connect if status check fails', async () => {
      // Arrange: Mock the /status response to simulate an error
      const error = new Error('Server unavailable');
      (error as any).response = { status: 503 }; // Simulate Axios error structure
      mockAxiosGet.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(client.connect()).rejects.toThrow('Failed to connect to MCP server');
      expect(client.isConnectedToServer()).toBe(false);
      expect(mockAxiosGet).toHaveBeenCalledWith('/status');
    });

    it('should disconnect from the MCP server', async () => {
      // Arrange: Connect first
      await client.connect();
      expect(client.isConnectedToServer()).toBe(true);

      // Act: Disconnect
      client.disconnect(); // Assuming disconnect is synchronous

      // Assert
      expect(client.isConnectedToServer()).toBe(false);
      // Optionally check if any cleanup (like cancelling requests) happened if applicable
    });

    it('should throw errors for operations when not connected', async () => {
      // Arrange: Ensure client is not connected (default state)
      expect(client.isConnectedToServer()).toBe(false);

      // Act & Assert for various methods
      await expect(client.addContent('test')).rejects.toThrow('Not connected to MCP server');
      await expect(client.getContent('cid')).rejects.toThrow('Not connected to MCP server');
      await expect(client.addNode({})).rejects.toThrow('Not connected to MCP server');
      await expect(client.getNode('cid')).rejects.toThrow('Not connected to MCP server');
      await expect(client.createCar([])).rejects.toThrow('Not connected to MCP server');

      // Verify axios was not called
      expect(mockAxiosPost).not.toHaveBeenCalled();
      expect(mockAxiosGet).not.toHaveBeenCalled();
    });
  });

  describe('Content Operations', () => {
    beforeEach(async () => {
      await client.connect(); // Ensure connected for these tests
    });

    it('should add string content via POST /content', async () => {
      // Arrange
      const content = 'Hello MCP!';
      const expectedCid = 'mock-cid-generated';
      mockAxiosPost.mockResolvedValueOnce({ data: { cid: expectedCid } }); // Specific mock for this call

      // Act
      const result = await client.addContent(content);

      // Assert
      expect(result).toEqual({ cid: expectedCid });
      expect(mockAxiosPost).toHaveBeenCalledTimes(1);
      expect(mockAxiosPost).toHaveBeenCalledWith('/content', {
        content: content, // Expect raw string
        encoding: 'utf8',
      });
    });

    it('should add buffer content via POST /content (base64 encoded)', async () => {
      // Arrange
      const content = Buffer.from('Buffer data');
      const expectedCid = 'mock-cid-buffer';
      mockAxiosPost.mockResolvedValueOnce({ data: { cid: expectedCid } });

      // Act
      const result = await client.addContent(content);

      // Assert
      expect(result).toEqual({ cid: expectedCid });
      expect(mockAxiosPost).toHaveBeenCalledTimes(1);
      expect(mockAxiosPost).toHaveBeenCalledWith('/content', {
        content: content.toString('base64'), // Expect base64 string
        encoding: 'base64',
      });
    });

    it('should get content as string via GET /content/{cid}', async () => {
      // Arrange
      const cid = 'test-cid-string';
      const expectedContent = `mock content for ${cid}`;
      mockAxiosGet.mockResolvedValueOnce({ data: { cid, content: expectedContent, encoding: 'utf8' } });

      // Act
      const result = await client.getContent(cid); // Default is string

      // Assert
      expect(result).toBe(expectedContent);
      expect(mockAxiosGet).toHaveBeenCalledTimes(1);
      expect(mockAxiosGet).toHaveBeenCalledWith(`/content/${cid}`);
    });

    it('should get content as buffer via GET /content/{cid}', async () => {
      // Arrange
      const cid = 'test-cid-buffer';
      const contentString = `mock content for ${cid}`;
      const expectedContent = Buffer.from(contentString);
      // Simulate server returning base64
      mockAxiosGet.mockResolvedValueOnce({ data: { cid, content: expectedContent.toString('base64'), encoding: 'base64' } });

      // Act
      const result = await client.getContent(cid, 'buffer');

      // Assert
      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.toString()).toBe(contentString);
      expect(mockAxiosGet).toHaveBeenCalledTimes(1);
      expect(mockAxiosGet).toHaveBeenCalledWith(`/content/${cid}`);
    });
  });

  describe('IPLD Operations', () => {
     beforeEach(async () => {
      await client.connect(); // Ensure connected
    });

    it('should add an IPLD node via POST /ipld/node', async () => {
      // Arrange
      const nodeData = { message: 'hello IPLD', value: 123 };
      const nodeLinks = [{ name: 'prev', cid: 'cid-prev' }];
      const expectedCid = 'mock-ipld-cid-add';
      mockAxiosPost.mockResolvedValueOnce({ data: { cid: expectedCid } });

      // Act
      const result = await client.addNode(nodeData, nodeLinks);

      // Assert
      expect(result).toEqual({ cid: expectedCid });
      expect(mockAxiosPost).toHaveBeenCalledTimes(1);
      expect(mockAxiosPost).toHaveBeenCalledWith('/ipld/node', {
        data: nodeData,
        links: nodeLinks,
      });
    });

    it('should get an IPLD node via GET /ipld/node/{cid}', async () => {
      // Arrange
      const cid = 'test-ipld-cid-get';
      const expectedNode = {
        cid,
        data: { mock: 'data' },
        links: [{ name: 'link', cid: 'link-cid' }],
      };
      mockAxiosGet.mockResolvedValueOnce({ data: expectedNode });

      // Act
      const result = await client.getNode(cid);

      // Assert
      expect(result).toEqual(expectedNode);
      expect(mockAxiosGet).toHaveBeenCalledTimes(1);
      expect(mockAxiosGet).toHaveBeenCalledWith(`/ipld/node/${cid}`);
    });
  });

  describe('CAR File Operations', () => {
     beforeEach(async () => {
      await client.connect(); // Ensure connected
    });

    it('should create a CAR file with roots via POST /car', async () => {
      // Arrange
      const roots = ['root-cid-1', 'root-cid-2'];
      const expectedCarCid = 'mock-car-roots-only';
      mockAxiosPost.mockResolvedValueOnce({ data: { carCid: expectedCarCid } });

      // Act
      const result = await client.createCar(roots);

      // Assert
      expect(result).toEqual({ carCid: expectedCarCid });
      expect(mockAxiosPost).toHaveBeenCalledTimes(1);
      expect(mockAxiosPost).toHaveBeenCalledWith('/car', {
        roots: roots,
        blocks: undefined, // Explicitly check blocks is undefined
      });
    });

    it('should create a CAR file with roots and blocks via POST /car', async () => {
      // Arrange
      const roots = ['root-cid-3'];
      const blocks = {
        'block-cid-1': Buffer.from('data1').toString('base64'), // Assuming server expects base64
        'block-cid-2': Buffer.from('data2').toString('base64'),
      };
      const expectedCarCid = 'mock-car-with-blocks';
      mockAxiosPost.mockResolvedValueOnce({ data: { carCid: expectedCarCid } });

      // Act
      // Pass Buffers, client should handle encoding
      const result = await client.createCar(roots, {
          'block-cid-1': Buffer.from('data1'),
          'block-cid-2': Buffer.from('data2'),
      });

      // Assert
      expect(result).toEqual({ carCid: expectedCarCid });
      expect(mockAxiosPost).toHaveBeenCalledTimes(1);
      expect(mockAxiosPost).toHaveBeenCalledWith('/car', {
        roots: roots,
        blocks: blocks, // Expect client to have encoded buffers to base64
      });
    });
  });

});
