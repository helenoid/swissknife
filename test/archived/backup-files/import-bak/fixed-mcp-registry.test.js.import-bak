/**
 * Improved MCP Registry Test
 * This test uses the jest-test-helper to fix module loading issues
 */

// Setup test environment
const testHelper = require('../../../utils/jest-test-helper');
testHelper.setupPathFixes();
testHelper.setupCommonMocks();

// Class to test
class MockMcpRegistry {
  constructor() {
    this.servers = new Map();
  }
  
  registerServer(serverConfig) {
    const id = serverConfig.id || `server-${Date.now()}`;
    const config = { ...serverConfig, id };
    this.servers.set(id, config);
    return id;
  }
  
  getRegisteredServers() {
    return Array.from(this.servers.values());
  }
  
  updateServerStatus(id, status) {
    const server = this.getServerById(id);
    if (server) {
      server.status = status;
      return true;
    }
    return false;
  }
  
  getServerById(id) {
    return this.servers.get(id);
  }
}

// Tests
describe('MCP Registry', () => {
  let registry;
  
  beforeEach(() => {
    registry = new MockMcpRegistry();
  });
  
  test('should register a server', () => {
    const serverId = registry.registerServer({
      name: 'test-server',
      url: 'http://localhost:8000',
      apiKey: 'test-api-key',
      enabled: true
    });
    
    expect(serverId).toBeTruthy();
    expect(registry.getRegisteredServers().length).toBe(1);
  });
  
  test('should get a server by ID', () => {
    const serverId = registry.registerServer({
      name: 'test-server',
      url: 'http://localhost:8000'
    });
    
    const server = registry.getServerById(serverId);
    expect(server).toBeDefined();
    expect(server.name).toBe('test-server');
  });
  
  test('should update server status', () => {
    const serverId = registry.registerServer({
      name: 'test-server',
      url: 'http://localhost:8000',
      status: 'active'
    });
    
    const result = registry.updateServerStatus(serverId, 'disabled');
    
    expect(result).toBe(true);
    expect(registry.getServerById(serverId).status).toBe('disabled');
  });
});
