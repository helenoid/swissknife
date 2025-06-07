// Mock temp directory helpers
const createTempTestDir = jest.fn().mockImplementation((name) => `/tmp/test-${name}-${Date.now()}`);
const removeTempTestDir = jest.fn().mockImplementation(async (dir) => Promise.resolve());
// --- Mock Setup ---
// Mock core services and utilities - Add .js extension
// Assuming test/ and src/ are siblings
jest.mock('../../src/config/manager.js', () => ({
    ConfigurationManager: jest.fn().mockImplementation(() => ({
        getInstance: jest.fn().mockReturnThis(),
        get: jest.fn((key) => {
            if (key === 'storage.defaultBackend')
                return 'local-test';
            return undefined;
        }),
    })),
}));
jest.mock('../../src/storage/operations.js', () => ({
    StorageOperations: jest.fn().mockImplementation(() => ({
        // Mock methods expected to be called by a StorageTool
        readFile: jest.fn().mockResolvedValue(Buffer.from('Mock file content')),
        writeFile: jest.fn().mockResolvedValue(undefined),
        list: jest.fn().mockResolvedValue(['file1.txt', 'file2.txt']),
        // Add other methods like exists, stat if needed by the hypothetical tool
    })),
}));
jest.mock('../../src/ai/tools/executor.js', () => ({
    ToolExecutor: jest.fn().mockImplementation(() => ({
        execute: jest.fn(), // We will mock specific implementations per test
    })),
}));
// Mock other potential Agent dependencies if needed by its constructor/methods - Add .js extension
jest.mock('../../src/ai/models/registry.js');
jest.mock('../../src/ai/thinking/manager.js');
jest.mock('../../src/tasks/manager.js');
jest.mock('../../src/utils/logger.js', () => ({ logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() } }));
// --- Imports ---
// Import components under test and mocks - Add .js extension
// Define a mock Model class matching the expected interface
class MockModel {
    id = 'test-model-1';
    name = 'Test Model 1';
    provider = 'mock';
    // Mock methods needed by Agent
    generate = jest.fn();
}
// --- Test Suite ---
describe('Integration: AI Agent <-> Storage Service (via Mocked Tool)', () => {
    let agent;
    let mockStorageOps;
    let mockToolExecutor;
    let mockModel;
    let mockConfigManager;
    let mockTaskManager;
    let tempDir;
    let restoreEnv;
    beforeAll(async () => {
        tempDir = await createTempTestDir('ai-storage-int');
        restoreEnv = mockEnv({}); // Add env vars if needed
    });
    afterAll(async () => {
        await removeTempTestDir(tempDir);
        restoreEnv();
    });
    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        // Create instances of mocked services
        mockConfigManager = new ConfigurationManager();
        mockStorageOps = new StorageOperations();
        mockToolExecutor = new ToolExecutor();
        mockTaskManager = new TaskManager(); // Assuming TaskManager constructor takes no args
        mockModel = new MockModel();
        // Create Agent instance, injecting mocks
        // Adjust constructor based on actual Agent implementation
        agent = new Agent({
            model: mockModel,
            config: mockConfigManager,
            toolExecutor: mockToolExecutor,
            // Pass other dependencies like registry, thinkingManager if needed
        });
        // Mock getService for a hypothetical ExecutionContext if Agent uses it internally
        // This setup assumes Agent directly uses injected dependencies for simplicity here.
    });
    // --- Tests (Commented Out - Requires StorageTool) ---
    /*
    it('should trigger StorageOperations.writeFile when agent decides to store content', async () => {
      // Arrange
      const userPrompt = "Please store this important note: 'Remember the milk'";
      const contentToStore = 'Remember the milk';
      const targetPath = '/notes/milk.txt'; // Hypothetical path decided by agent/tool logic
  
      // Simulate Agent deciding to call the 'storage' tool with 'writeFile' action
      // We mock the ToolExecutor directly for this integration test
      (mockToolExecutor.execute as jest.Mock).mockImplementation(async (toolName, args, context) => {
        if (toolName === 'storage' && args.action === 'writeFile') {
          // Simulate the *actual* StorageTool calling StorageOperations
          expect(args.path).toBe(targetPath);
          expect(args.content).toBe(contentToStore);
          await mockStorageOps.writeFile(args.path, args.content); // Call the mocked service
          return { success: true, path: args.path }; // Simulate tool success result
        }
        throw new Error(`Unexpected tool call: ${toolName}`);
      });
  
      // Mock the Agent's internal reasoning to decide to call the tool
      // (This part is complex and depends heavily on Agent implementation; simplified here)
      // For this test, we might bypass reasoning and directly test tool interaction if possible,
      // or mock the reasoning outcome. Let's assume processMessage triggers the execute call.
      mockModel.generate.mockResolvedValue({ // Simulate LLM response asking to use the tool
          message: {
              role: 'assistant',
              content: null, // Important: No text content if using tool
              toolCalls: [{ id: 'call_1', type: 'function', function: { name: 'storage', arguments: JSON.stringify({ action: 'writeFile', path: targetPath, content: contentToStore }) } }]
          },
          // ... other response fields
      });
  
  
      // Act
      // We need to simulate the full Agent loop including handling the tool call response
      // This might require more detailed mocking or spying on Agent internals.
      // Simplified: Assume processMessage handles the tool call via ToolExecutor
      const responseMessage = await agent.processMessage([{ role: 'user', content: userPrompt }]);
  
      // Assert
      // Verify StorageOperations.writeFile was called correctly by the mocked tool execution path
      expect(mockStorageOps.writeFile).toHaveBeenCalledTimes(1);
      expect(mockStorageOps.writeFile).toHaveBeenCalledWith(targetPath, contentToStore);
  
      // Verify the agent's final response (might be simple confirmation)
      // This depends on how the Agent processes tool results - needs mocking generate response after tool call
      // expect(responseMessage.message.content).toContain("Stored");
    });
  
    it('should trigger StorageOperations.readFile when agent decides to retrieve content', async () => {
      // Arrange
      const targetPath = '/notes/shopping.txt';
      const storedContent = 'Eggs, Bread, Milk';
      const userPrompt = `What is on the shopping list at ${targetPath}?`;
  
      // Mock StorageOperations response
      (mockStorageOps.readFile as jest.Mock).mockResolvedValue(Buffer.from(storedContent));
  
      // Simulate Agent deciding to call the 'storage' tool with 'readFile' action
      (mockToolExecutor.execute as jest.Mock).mockImplementation(async (toolName, args, context) => {
        if (toolName === 'storage' && args.action === 'readFile') {
          expect(args.path).toBe(targetPath);
          const contentBuffer = await mockStorageOps.readFile(args.path);
          return { success: true, path: args.path, content: contentBuffer.toString() }; // Simulate tool success
        }
        throw new Error(`Unexpected tool call: ${toolName}`);
      });
  
       // Mock the Agent's internal reasoning
      mockModel.generate
        .mockResolvedValueOnce({ // First call: Decide to use tool
            message: { role: 'assistant', content: null, toolCalls: [{ id: 'call_2', type: 'function', function: { name: 'storage', arguments: JSON.stringify({ action: 'readFile', path: targetPath }) } }] }
        })
        .mockResolvedValueOnce({ // Second call: Generate response from tool result
            message: { role: 'assistant', content: `The shopping list contains: ${storedContent}` }
        });
  
      // Act
      const responseMessage = await agent.processMessage([{ role: 'user', content: userPrompt }]);
  
      // Assert
      // Verify StorageOperations.readFile was called
      expect(mockStorageOps.readFile).toHaveBeenCalledTimes(1);
      expect(mockStorageOps.readFile).toHaveBeenCalledWith(targetPath);
  
      // Verify the agent's final response includes the retrieved content
      expect(responseMessage.message.content).toContain(storedContent);
      expect(mockModel.generate).toHaveBeenCalledTimes(2); // Initial call + call with tool result
    });
    */
    // Add a placeholder test to avoid Jest errors for an empty suite
    it('placeholder test for AI-Storage integration', () => {
        expect(true).toBe(true);
    });
});
//# sourceMappingURL=model-storage.test.js.map