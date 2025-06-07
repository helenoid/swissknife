/**
 * Unit tests for performance CLI command
 */
// Mock dependencies
jest.mock('../../../src/performance/optimizer');
jest.mock('../../../src/tasks/manager');
jest.mock('../../../src/ipfs/client');
jest.mock('../../../src/ai/agent/agent');
jest.mock('../../../src/ai/models/model');
describe('Performance Command', () => {
    let mockOptimizer;
    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        // Setup mock implementations
        Model.mockImplementation(() => ({}));
        Agent.mockImplementation(() => ({}));
        TaskManager.mockImplementation(() => ({}));
        IPFSKitClient.mockImplementation(() => ({}));
        // Setup mock PerformanceOptimizer
        mockOptimizer = {
            optimize: jest.fn().mockResolvedValue(undefined)
        };
        PerformanceOptimizer.mockImplementation(() => mockOptimizer);
    });
    it('should create dependencies and run optimize when executed', async () => {
        // Arrange
        const action = performanceCommand.action;
        // Act
        await action({});
        // Assert
        expect(Model).toHaveBeenCalled();
        expect(Agent).toHaveBeenCalled();
        expect(TaskManager).toHaveBeenCalled();
        expect(IPFSKitClient).toHaveBeenCalled();
        expect(PerformanceOptimizer).toHaveBeenCalled();
        expect(mockOptimizer.optimize).toHaveBeenCalled();
    });
    it('should have the correct command name and description', () => {
        // Assert
        expect(performanceCommand.name()).toBe('performance');
        expect(performanceCommand.description()).toBe('Run performance optimization tasks');
    });
});
//# sourceMappingURL=performanceCommand.test.js.map