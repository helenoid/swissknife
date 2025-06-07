/**
 * Unit tests for PerformanceMonitor
 */
import { PerformanceMonitor } from '../../../../src/utils/performance/performance-monitor.ts';

describe('PerformanceMonitor', () => {
  let performanceMonitor: any;
  
  beforeEach(() => {
    // Reset singleton
    (PerformanceMonitor as any).instance = null;
    
    // Create new instance
    performanceMonitor = PerformanceMonitor.getInstance();
    
    // Mock Date.now and performance.now
    jest.spyOn(Date, 'now').mockImplementation(() => 1000);
    jest.spyOn(performance, 'now').mockImplementation(() => 2000);
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  describe('basic timing', () => {
    it('should measure operation time correctly', async () => {
      // Mock performance.now to simulate elapsed time
      const perfNowMock = jest.spyOn(performance, 'now');
      perfNowMock.mockReturnValueOnce(2000).mockReturnValueOnce(2500);
      
      // Act
      const result = await performanceMonitor.measureAsync('test-operation', async () => {
        return 'test-result';
      });
      
      // Assert
      expect(result).toBe('test-result');
      
      // Get timing data
      const stats = performanceMonitor.getStats('test-operation');
      expect(stats).toBeDefined();
      expect(stats.averageTime).toBe(500); // 2500 - 2000
      expect(stats.totalOperations).toBe(1);
    });
    
    it('should measure operation time with manual start/end', () => {
      // Mock performance.now to simulate elapsed time
      const perfNowMock = jest.spyOn(performance, 'now');
      perfNowMock.mockReturnValueOnce(2000).mockReturnValueOnce(2800);
      
      // Act
      const operationId = 'manual-test-op';
      performanceMonitor.startOperation(operationId, 'manual-operation');
      const duration = performanceMonitor.endOperation(operationId);
      
      // Assert
      expect(duration).toBe(800); // 2800 - 2000
      
      // Verify stored data
      const stats = performanceMonitor.getStats('manual-operation');
      expect(stats).toBeDefined();
      expect(stats.averageTime).toBe(800);
      expect(stats.totalOperations).toBe(1);
    });
    
    it('should accumulate multiple operation timings', async () => {
      // Mock performance.now to simulate elapsed time for multiple calls
      const perfNowMock = jest.spyOn(performance, 'now');
      perfNowMock
        .mockReturnValueOnce(2000).mockReturnValueOnce(2200) // First call: 200ms
        .mockReturnValueOnce(2300).mockReturnValueOnce(2600) // Second call: 300ms
        .mockReturnValueOnce(2700).mockReturnValueOnce(3000); // Third call: 300ms
      
      // Act - Measure same operation multiple times
      await performanceMonitor.measureAsync('repeated-operation', async () => {
        return 'result-1';
      });
      
      await performanceMonitor.measureAsync('repeated-operation', async () => {
        return 'result-2';
      });
      
      await performanceMonitor.measureAsync('repeated-operation', async () => {
        return 'result-3';
      });
      
      // Assert
      const stats = performanceMonitor.getStats('repeated-operation');
      expect(stats).toBeDefined();
      expect(stats.totalOperations).toBe(3);
      expect(stats.averageTime).toBe(800 / 3); // (200 + 300 + 300) / 3
      expect(stats.minTime).toBe(200);
      expect(stats.maxTime).toBe(300);
    });
    
    it('should handle errors during measurement', async () => {
      // Mock performance.now
      const perfNowMock = jest.spyOn(performance, 'now');
      perfNowMock.mockReturnValueOnce(2000).mockReturnValueOnce(2400);
      
      // Define a function that throws
      const errorFunction = async () => {
        throw new Error('Test error');
      };
      
      // Act & Assert
      await expect(performanceMonitor.measureAsync('error-operation', errorFunction))
        .rejects.toThrow('Test error');
      
      // Should still record timing even though operation failed
      const stats = performanceMonitor.getStats('error-operation');
      expect(stats).toBeDefined();
      expect(stats.averageTime).toBe(400); // 2400 - 2000
      expect(stats.totalOperations).toBe(1);
    });
  });

  describe('reporting', () => {
    it('should provide summary of all operations', () => {
      // Arrange - Measure a few operations
      // Mock performance.now for deterministic results
      const perfNowMock = jest.spyOn(performance, 'now');
      perfNowMock
        .mockReturnValueOnce(2000).mockReturnValueOnce(2200) // op1: 200ms
        .mockReturnValueOnce(2300).mockReturnValueOnce(2500) // op2: 200ms
        .mockReturnValueOnce(2600).mockReturnValueOnce(3100); // op3: 500ms

      performanceMonitor.measure('operation-1', () => 'result-1');
      performanceMonitor.measure('operation-2', () => 'result-2');
      performanceMonitor.measure('operation-3', () => 'result-3');

      // Act
      const allStats = performanceMonitor.getAllStats();

      // Assert
      expect(allStats).toBeDefined();
      expect(Object.keys(allStats)).toHaveLength(3);

      // Should include all operations
      expect(allStats['operation-1']).toBeDefined();
      expect(allStats['operation-2']).toBeDefined();
      expect(allStats['operation-3']).toBeDefined();

      // Should have correct timings
      expect(allStats['operation-1'].averageTime).toBe(200);
      expect(allStats['operation-2'].averageTime).toBe(200);
      expect(allStats['operation-3'].averageTime).toBe(500);
    });

    it('should clear metrics', () => {
      // Arrange - Create some timings
      // Mock performance.now
      const perfNowMock = jest.spyOn(performance, 'now');
      perfNowMock.mockReturnValueOnce(2000).mockReturnValueOnce(2500);

      performanceMonitor.measure('operation-to-clear', () => 'result');

      // Verify initial state
      expect(performanceMonitor.getStats('operation-to-clear')).toBeDefined();

      // Act
      performanceMonitor.clearMetrics('operation-to-clear');

      // Assert
      expect(performanceMonitor.getStats('operation-to-clear')).toBeNull();
    });
  });
});
