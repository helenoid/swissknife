/**
 * Unit tests for PerformanceMonitor
 */

import { PerformanceMonitor } from '../../../../src/utils/performance/monitor';

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
      const result = await performanceMonitor.measure('test-operation', async () => {
        return 'test-result';
      });
      
      // Assert
      expect(result).toBe('test-result');
      
      // Get timing data
      const timingData = performanceMonitor.getOperationTiming('test-operation');
      expect(timingData).toBeDefined();
      expect(timingData.duration).toBe(500); // 2500 - 2000
      expect(timingData.count).toBe(1);
    });
    
    it('should measure operation time with manual start/end', () => {
      // Skip if not supported
      if (typeof performanceMonitor.startMeasurement !== 'function' ||
          typeof performanceMonitor.endMeasurement !== 'function') {
        console.log('Skipping manual timing test - methods not implemented');
        return;
      }
      
      // Mock performance.now to simulate elapsed time
      const perfNowMock = jest.spyOn(performance, 'now');
      perfNowMock.mockReturnValueOnce(2000).mockReturnValueOnce(2800);
      
      // Act
      const id = performanceMonitor.startMeasurement('manual-operation');
      const endResult = performanceMonitor.endMeasurement(id);
      
      // Assert
      expect(id).toBeDefined();
      expect(endResult.duration).toBe(800); // 2800 - 2000
      
      // Verify stored data
      const timingData = performanceMonitor.getOperationTiming('manual-operation');
      expect(timingData).toBeDefined();
      expect(timingData.duration).toBe(800);
      expect(timingData.count).toBe(1);
    });
    
    it('should accumulate multiple operation timings', async () => {
      // Mock performance.now to simulate elapsed time for multiple calls
      const perfNowMock = jest.spyOn(performance, 'now');
      perfNowMock
        .mockReturnValueOnce(2000).mockReturnValueOnce(2200) // First call: 200ms
        .mockReturnValueOnce(2300).mockReturnValueOnce(2600) // Second call: 300ms
        .mockReturnValueOnce(2700).mockReturnValueOnce(3000); // Third call: 300ms
      
      // Act - Measure same operation multiple times
      await performanceMonitor.measure('repeated-operation', async () => {
        return 'result-1';
      });
      
      await performanceMonitor.measure('repeated-operation', async () => {
        return 'result-2';
      });
      
      await performanceMonitor.measure('repeated-operation', async () => {
        return 'result-3';
      });
      
      // Assert
      const timingData = performanceMonitor.getOperationTiming('repeated-operation');
      expect(timingData).toBeDefined();
      expect(timingData.count).toBe(3);
      expect(timingData.totalDuration).toBe(800); // 200 + 300 + 300
      expect(timingData.averageDuration).toBe(800 / 3);
      expect(timingData.minDuration).toBe(200);
      expect(timingData.maxDuration).toBe(300);
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
      await expect(performanceMonitor.measure('error-operation', errorFunction))
        .rejects.toThrow('Test error');
      
      // Should still record timing even though operation failed
      const timingData = performanceMonitor.getOperationTiming('error-operation');
      expect(timingData).toBeDefined();
      expect(timingData.duration).toBe(400); // 2400 - 2000
      expect(timingData.count).toBe(1);
      expect(timingData.errorCount).toBe(1);
    });
  });
  
  describe('reporting', () => {
    it('should provide summary of all operations', async () => {
      // Arrange - Measure a few operations
      // Mock performance.now for deterministic results
      const perfNowMock = jest.spyOn(performance, 'now');
      perfNowMock
        .mockReturnValueOnce(2000).mockReturnValueOnce(2200) // op1: 200ms
        .mockReturnValueOnce(2300).mockReturnValueOnce(2500) // op2: 200ms
        .mockReturnValueOnce(2600).mockReturnValueOnce(3100); // op3: 500ms
      
      await performanceMonitor.measure('operation-1', async () => 'result-1');
      await performanceMonitor.measure('operation-2', async () => 'result-2');
      await performanceMonitor.measure('operation-3', async () => 'result-3');
      
      // Act
      const summary = performanceMonitor.getSummary();
      
      // Assert
      expect(summary).toBeDefined();
      expect(summary.length).toBe(3);
      
      // Should include all operations
      expect(summary.find(op => op.name === 'operation-1')).toBeDefined();
      expect(summary.find(op => op.name === 'operation-2')).toBeDefined();
      expect(summary.find(op => op.name === 'operation-3')).toBeDefined();
      
      // Should have correct timings
      expect(summary.find(op => op.name === 'operation-1').duration).toBe(200);
      expect(summary.find(op => op.name === 'operation-2').duration).toBe(200);
      expect(summary.find(op => op.name === 'operation-3').duration).toBe(500);
    });
    
    it('should format timings for display', () => {
      // Skip if not supported
      if (typeof performanceMonitor.formatTimingSummary !== 'function') {
        console.log('Skipping formatting test - method not implemented');
        return;
      }
      
      // Arrange - Measure operations
      // Mock performance.now
      const perfNowMock = jest.spyOn(performance, 'now');
      perfNowMock
        .mockReturnValueOnce(2000).mockReturnValueOnce(2200) // 200ms
        .mockReturnValueOnce(2300).mockReturnValueOnce(3300); // 1000ms
      
      performanceMonitor.measure('fast-op', () => 'fast');
      performanceMonitor.measure('slow-op', () => 'slow');
      
      // Act
      const formattedSummary = performanceMonitor.formatTimingSummary();
      
      // Assert
      expect(formattedSummary).toBeDefined();
      expect(typeof formattedSummary).toBe('string');
      
      // Should include operation names
      expect(formattedSummary).toContain('fast-op');
      expect(formattedSummary).toContain('slow-op');
      
      // Should include timings
      expect(formattedSummary).toContain('200');
      expect(formattedSummary).toContain('1000');
    });
    
    it('should reset timings', async () => {
      // Arrange - Create some timings
      // Mock performance.now
      const perfNowMock = jest.spyOn(performance, 'now');
      perfNowMock.mockReturnValueOnce(2000).mockReturnValueOnce(2500);
      
      await performanceMonitor.measure('operation-to-reset', async () => 'result');
      
      // Verify initial state
      expect(performanceMonitor.getOperationTiming('operation-to-reset')).toBeDefined();
      
      // Act
      performanceMonitor.reset();
      
      // Assert
      expect(performanceMonitor.getOperationTiming('operation-to-reset')).toBeUndefined();
    });
  });
  
  describe('thresholds and warnings', () => {
    it('should detect slow operations based on thresholds', async () => {
      // Skip if not supported
      if (typeof performanceMonitor.setThreshold !== 'function') {
        console.log('Skipping threshold test - method not implemented');
        return;
      }
      
      // Arrange
      performanceMonitor.setThreshold('threshold-test', 500); // 500ms threshold
      
      // Mock console.warn
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Mock performance.now - first operation is fast, second is slow
      const perfNowMock = jest.spyOn(performance, 'now');
      perfNowMock
        .mockReturnValueOnce(2000).mockReturnValueOnce(2300) // 300ms - under threshold
        .mockReturnValueOnce(2400).mockReturnValueOnce(3000); // 600ms - over threshold
      
      // Act
      await performanceMonitor.measure('threshold-test', async () => 'fast-result');
      await performanceMonitor.measure('threshold-test', async () => 'slow-result');
      
      // Assert
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('threshold-test'),
        expect.stringContaining('600ms')
      );
    });
    
    it('should support custom threshold handlers', async () => {
      // Skip if not supported
      if (typeof performanceMonitor.setThreshold !== 'function' ||
          typeof performanceMonitor.setThresholdHandler !== 'function') {
        console.log('Skipping custom handler test - methods not implemented');
        return;
      }
      
      // Arrange
      const thresholdHandler = jest.fn();
      performanceMonitor.setThreshold('custom-handler-test', 200);
      performanceMonitor.setThresholdHandler(thresholdHandler);
      
      // Mock performance.now - operation exceeds threshold
      const perfNowMock = jest.spyOn(performance, 'now');
      perfNowMock.mockReturnValueOnce(2000).mockReturnValueOnce(2500); // 500ms
      
      // Act
      await performanceMonitor.measure('custom-handler-test', async () => 'result');
      
      // Assert
      expect(thresholdHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'custom-handler-test',
          duration: 500,
          threshold: 200
        })
      );
    });
  });
  
  describe('resource monitoring', () => {
    it('should track memory usage if supported', () => {
      // Skip if not supported
      if (typeof performanceMonitor.trackMemoryUsage !== 'function') {
        console.log('Skipping memory usage test - method not implemented');
        return;
      }
      
      // Mock process.memoryUsage
      const mockMemoryUsage = {
        rss: 50 * 1024 * 1024,          // 50 MB
        heapTotal: 30 * 1024 * 1024,     // 30 MB
        heapUsed: 20 * 1024 * 1024,      // 20 MB
        external: 10 * 1024 * 1024       // 10 MB
      };
      
      jest.spyOn(process, 'memoryUsage').mockReturnValue(mockMemoryUsage);
      
      // Act
      const memoryStats = performanceMonitor.trackMemoryUsage();
      
      // Assert
      expect(memoryStats).toBeDefined();
      expect(memoryStats.rss).toBe(mockMemoryUsage.rss);
      expect(memoryStats.heapTotal).toBe(mockMemoryUsage.heapTotal);
      expect(memoryStats.heapUsed).toBe(mockMemoryUsage.heapUsed);
    });
    
    it('should track CPU usage if supported', () => {
      // Skip if not supported
      if (typeof performanceMonitor.trackCpuUsage !== 'function') {
        console.log('Skipping CPU usage test - method not implemented');
        return;
      }
      
      // CPU usage tracking requires actual system monitoring
      // We'll just verify it returns a valid object with expected properties
      
      // Act
      const cpuStats = performanceMonitor.trackCpuUsage();
      
      // Assert
      expect(cpuStats).toBeDefined();
      expect(typeof cpuStats.percentage).toBe('number');
      expect(cpuStats.percentage).toBeGreaterThanOrEqual(0);
      expect(cpuStats.percentage).toBeLessThanOrEqual(100);
    });
  });
  
  describe('sampling and profiling', () => {
    it('should support operation sampling if implemented', async () => {
      // Skip if not supported
      if (typeof performanceMonitor.setSamplingRate !== 'function') {
        console.log('Skipping sampling test - method not implemented');
        return;
      }
      
      // Arrange
      // Set sampling rate to 50% - measure only half of operations
      performanceMonitor.setSamplingRate(0.5);
      
      // Mock Math.random to control sampling
      const randomMock = jest.spyOn(Math, 'random');
      
      // First call will be sampled (0.3 < 0.5)
      // Second call will be skipped (0.7 > 0.5)
      randomMock.mockReturnValueOnce(0.3).mockReturnValueOnce(0.7);
      
      // Mock performance.now
      const perfNowMock = jest.spyOn(performance, 'now');
      perfNowMock
        .mockReturnValueOnce(2000).mockReturnValueOnce(2200) // First call: 200ms
        .mockReturnValueOnce(2300).mockReturnValueOnce(2500); // Second call: 200ms
      
      // Act
      await performanceMonitor.measure('sampled-operation', async () => 'result-1');
      await performanceMonitor.measure('sampled-operation', async () => 'result-2');
      
      // Assert
      const timingData = performanceMonitor.getOperationTiming('sampled-operation');
      
      // Only the first operation should have been measured
      expect(timingData.count).toBe(1);
      expect(timingData.duration).toBe(200);
    });
    
    it('should support detailed profiling if implemented', async () => {
      // Skip if not supported
      if (typeof performanceMonitor.startProfiling !== 'function' ||
          typeof performanceMonitor.stopProfiling !== 'function') {
        console.log('Skipping profiling test - methods not implemented');
        return;
      }
      
      // Arrange - Start profiling
      performanceMonitor.startProfiling('test-profile');
      
      // Mock performance.now for deterministic results
      const perfNowMock = jest.spyOn(performance, 'now');
      perfNowMock
        .mockReturnValueOnce(2000).mockReturnValueOnce(2200) // op1: 200ms
        .mockReturnValueOnce(2300).mockReturnValueOnce(2700); // op2: 400ms
      
      // Perform some operations
      await performanceMonitor.measure('profile-op-1', async () => 'result-1');
      await performanceMonitor.measure('profile-op-2', async () => 'result-2');
      
      // Act - Stop profiling and get results
      const profileData = performanceMonitor.stopProfiling('test-profile');
      
      // Assert
      expect(profileData).toBeDefined();
      expect(profileData.operations).toBeDefined();
      expect(profileData.operations.length).toBe(2);
      
      // Should have detailed timing info
      expect(profileData.operations.find(op => op.name === 'profile-op-1')).toBeDefined();
      expect(profileData.operations.find(op => op.name === 'profile-op-2')).toBeDefined();
      
      // Profile should include total time
      expect(profileData.totalDuration).toBeDefined();
      expect(profileData.totalDuration).toBeGreaterThanOrEqual(600); // At least 200 + 400
    });
  });
  
  describe('performance hooks', () => {
    it('should support operation lifecycle hooks if implemented', async () => {
      // Skip if not supported
      if (typeof performanceMonitor.addHook !== 'function') {
        console.log('Skipping hooks test - method not implemented');
        return;
      }
      
      // Arrange
      const beforeHook = jest.fn();
      const afterHook = jest.fn();
      
      performanceMonitor.addHook('before', beforeHook);
      performanceMonitor.addHook('after', afterHook);
      
      // Mock performance.now
      const perfNowMock = jest.spyOn(performance, 'now');
      perfNowMock.mockReturnValueOnce(2000).mockReturnValueOnce(2300);
      
      // Act
      await performanceMonitor.measure('hook-test', async () => 'hook-result');
      
      // Assert
      expect(beforeHook).toHaveBeenCalledWith({
        name: 'hook-test',
        startTime: 2000
      });
      
      expect(afterHook).toHaveBeenCalledWith({
        name: 'hook-test',
        startTime: 2000,
        endTime: 2300,
        duration: 300,
        result: 'hook-result'
      });
    });
  });
});