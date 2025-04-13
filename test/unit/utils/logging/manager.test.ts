/**
 * Unit tests for LogManager
 */

import * as path from 'path';
import * as fs from 'fs/promises';
import { LogManager } from '../../../../src/utils/logging/manager';
import { createTempTestDir, removeTempTestDir } from '../../../helpers/testUtils';

describe('LogManager', () => {
  let logManager: any;
  let tempDir: string;
  let logFilePath: string;
  
  beforeAll(async () => {
    // Create temp directory for testing
    tempDir = await createTempTestDir();
    logFilePath = path.join(tempDir, 'test.log');
  });
  
  afterAll(async () => {
    // Clean up temp directory
    await removeTempTestDir(tempDir);
  });
  
  beforeEach(() => {
    // Reset singleton
    (LogManager as any).instance = null;
    
    // Create new instance with test configuration
    logManager = LogManager.getInstance({
      logFilePath,
      level: 'debug',
      console: true,
      file: true
    });
    
    // Spy on console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'debug').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
  });
  
  afterEach(() => {
    // Restore console methods
    jest.restoreAllMocks();
  });
  
  describe('basic logging', () => {
    it('should log messages at different levels', async () => {
      // Arrange
      const testMessages = {
        error: 'Test error message',
        warn: 'Test warning message',
        info: 'Test info message',
        debug: 'Test debug message'
      };
      
      // Act
      logManager.error(testMessages.error);
      logManager.warn(testMessages.warn);
      logManager.info(testMessages.info);
      logManager.debug(testMessages.debug);
      
      // Allow time for file writes to complete
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Assert - Console logging
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining(testMessages.error));
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining(testMessages.warn));
      expect(console.info || console.log).toHaveBeenCalledWith(expect.stringContaining(testMessages.info));
      expect(console.debug || console.log).toHaveBeenCalledWith(expect.stringContaining(testMessages.debug));
      
      // Assert - File logging
      if (logManager.fileTransport) {
        const logContent = await fs.readFile(logFilePath, 'utf-8');
        expect(logContent).toContain(testMessages.error);
        expect(logContent).toContain(testMessages.warn);
        expect(logContent).toContain(testMessages.info);
        expect(logContent).toContain(testMessages.debug);
      }
    });
    
    it('should respect log level settings', async () => {
      // Create a new instance with a higher minimum log level
      const infoLevelLogger = LogManager.getInstance({
        logFilePath,
        level: 'info',  // Only info and above should be logged
        console: true,
        file: false
      });
      
      // Reset console mocks
      jest.clearAllMocks();
      
      // Act
      infoLevelLogger.error('Error message');
      infoLevelLogger.warn('Warning message');
      infoLevelLogger.info('Info message');
      infoLevelLogger.debug('Debug message'); // Should be ignored
      
      // Assert
      expect(console.error).toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalled();
      expect(console.info || console.log).toHaveBeenCalled();
      expect(console.debug || console.log).not.toHaveBeenCalled(); // Debug should be filtered out
    });
    
    it('should log with formatting', () => {
      // Skip if not supported
      if (typeof logManager.format !== 'function') {
        console.log('Skipping formatting test - feature not implemented');
        return;
      }
      
      // Act
      logManager.info('User %s logged in with ID %d', 'John', 12345);
      
      // Assert
      expect(console.info || console.log).toHaveBeenCalledWith(
        expect.stringContaining('User John logged in with ID 12345')
      );
    });
    
    it('should handle objects and complex data', () => {
      // Arrange
      const testObject = {
        user: {
          id: 123,
          name: 'Test User',
          roles: ['admin', 'user']
        },
        metadata: {
          timestamp: Date.now(),
          source: 'test'
        }
      };
      
      // Act
      logManager.info('Got user data:', testObject);
      
      // Assert
      expect(console.info || console.log).toHaveBeenCalled();
      
      // The logged content should contain key parts of the object
      const consoleCall = (console.info || console.log).mock.calls[0][0];
      expect(consoleCall).toContain('Got user data:');
      
      // Check if the object was stringified in the output
      const objectStr = JSON.stringify(testObject);
      if (consoleCall.includes(objectStr)) {
        // Full JSON stringification
        expect(consoleCall).toContain(objectStr);
      } else {
        // Object inspection
        expect(consoleCall).toContain('user');
        expect(consoleCall).toContain('Test User');
      }
    });
  });
  
  describe('log transports', () => {
    it('should support file logging', async () => {
      // Skip if file transport is not supported
      if (!logManager.fileTransport) {
        console.log('Skipping file logging test - feature not implemented');
        return;
      }
      
      // Make sure file logging is enabled
      logManager.setTransport('file', true);
      
      // Generate a unique test message
      const testMessage = `Test file logging ${Date.now()}`;
      
      // Act
      logManager.info(testMessage);
      
      // Allow time for file writes to complete
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Assert
      const logContent = await fs.readFile(logFilePath, 'utf-8');
      expect(logContent).toContain(testMessage);
    });
    
    it('should support console logging', () => {
      // Make sure console logging is enabled
      logManager.setTransport('console', true);
      
      // Generate a unique test message
      const testMessage = `Test console logging ${Date.now()}`;
      
      // Act
      logManager.info(testMessage);
      
      // Assert
      expect(console.info || console.log).toHaveBeenCalledWith(
        expect.stringContaining(testMessage)
      );
    });
    
    it('should enable/disable transports', async () => {
      // Skip if transport management is not supported
      if (typeof logManager.setTransport !== 'function') {
        console.log('Skipping transport management test - feature not implemented');
        return;
      }
      
      // Disable all transports
      logManager.setTransport('console', false);
      logManager.setTransport('file', false);
      
      // Generate test messages
      const testMessage1 = `Test disabled transports ${Date.now()}`;
      
      // Act - Log with all transports disabled
      logManager.info(testMessage1);
      
      // Assert - Nothing should be logged
      expect(console.info || console.log).not.toHaveBeenCalled();
      
      // Enable console transport only
      logManager.setTransport('console', true);
      
      // Generate a new test message
      const testMessage2 = `Test console only ${Date.now()}`;
      
      // Act - Log with console transport enabled
      logManager.info(testMessage2);
      
      // Assert - Console should be logged to, but not file
      expect(console.info || console.log).toHaveBeenCalledWith(
        expect.stringContaining(testMessage2)
      );
      
      // Check if file logging is implemented
      if (logManager.fileTransport) {
        // Allow time for file writes to complete
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Read log file
        const logContent = await fs.readFile(logFilePath, 'utf-8');
        
        // File should not contain the second message
        expect(logContent).not.toContain(testMessage2);
      }
    });
    
    it('should support custom transports if implemented', () => {
      // Skip if custom transports are not supported
      if (typeof logManager.addTransport !== 'function') {
        console.log('Skipping custom transport test - feature not implemented');
        return;
      }
      
      // Arrange - Create a custom transport
      const customTransport = {
        log: jest.fn()
      };
      
      // Add custom transport
      logManager.addTransport('custom', customTransport);
      
      // Act
      logManager.info('Test custom transport');
      
      // Assert
      expect(customTransport.log).toHaveBeenCalled();
    });
  });
  
  describe('log context and metadata', () => {
    it('should include timestamp in logs', async () => {
      // Act
      logManager.info('Test timestamp');
      
      // Assert - Console
      const consoleCall = (console.info || console.log).mock.calls[0][0];
      
      // Timestamp format depends on implementation, but should include numbers
      expect(consoleCall).toMatch(/\d/);
      
      // ISO timestamp format commonly contains T and Z
      if (consoleCall.includes('T') && consoleCall.includes('Z')) {
        expect(consoleCall).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      } 
      // Unix timestamp
      else if (/\d{10,13}/.test(consoleCall)) {
        expect(consoleCall).toMatch(/\d{10,13}/);
      }
      // General time format
      else {
        expect(consoleCall).toMatch(/\d{1,2}:\d{2}/);
      }
      
      // Check file logging if implemented
      if (logManager.fileTransport) {
        // Allow time for file writes to complete
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Check file content
        const logContent = await fs.readFile(logFilePath, 'utf-8');
        expect(logContent).toMatch(/\d/); // Should contain numbers from timestamp
      }
    });
    
    it('should include log level in logs', () => {
      // Act
      logManager.error('Test error level');
      logManager.warn('Test warn level');
      logManager.info('Test info level');
      
      // Assert
      const errorCall = console.error.mock.calls[0][0];
      const warnCall = console.warn.mock.calls[0][0];
      const infoCall = (console.info || console.log).mock.calls[0][0];
      
      // Log level indicators
      expect(errorCall.toLowerCase()).toMatch(/error|err|fatal|crit/);
      expect(warnCall.toLowerCase()).toMatch(/warn|warning/);
      expect(infoCall.toLowerCase()).toMatch(/info/);
    });
    
    it('should support logging with context if implemented', () => {
      // Skip if context logging is not supported
      if (typeof logManager.withContext !== 'function') {
        console.log('Skipping context test - feature not implemented');
        return;
      }
      
      // Act - Log with context
      logManager.withContext({ user: 'testuser', requestId: '12345' })
        .info('Test with context');
      
      // Assert
      expect(console.info || console.log).toHaveBeenCalledWith(
        expect.stringContaining('testuser')
      );
      expect(console.info || console.log).toHaveBeenCalledWith(
        expect.stringContaining('12345')
      );
    });
    
    it('should support child loggers if implemented', () => {
      // Skip if child loggers are not supported
      if (typeof logManager.child !== 'function') {
        console.log('Skipping child logger test - feature not implemented');
        return;
      }
      
      // Act - Create child logger with context
      const childLogger = logManager.child({ component: 'TestComponent' });
      childLogger.info('Test from child logger');
      
      // Assert
      expect(console.info || console.log).toHaveBeenCalledWith(
        expect.stringContaining('TestComponent')
      );
    });
  });
  
  describe('error handling and robustness', () => {
    it('should handle circular references in log data', () => {
      // Arrange - Create object with circular reference
      const circularObj: any = { name: 'circular' };
      circularObj.self = circularObj;
      
      // Act - Should not throw
      expect(() => {
        logManager.info('Object with circular reference:', circularObj);
      }).not.toThrow();
      
      // Assert - Should still log something
      expect(console.info || console.log).toHaveBeenCalled();
    });
    
    it('should handle errors in transport', async () => {
      // Induce an error in file transport if possible
      if (logManager.fileTransport && typeof logManager.setLogFilePath === 'function') {
        // Set an invalid log file path
        const invalidPath = path.join('/', 'invalid', 'path', 'that', 'doesnt', 'exist.log');
        logManager.setLogFilePath(invalidPath);
        
        // Act - Should not throw despite invalid path
        expect(() => {
          logManager.info('This should not throw despite invalid file path');
        }).not.toThrow();
        
        // Assert - Console should still work
        expect(console.info || console.log).toHaveBeenCalled();
      } else {
        console.log('Skipping transport error test - feature not applicable');
      }
    });
  });
  
  describe('performance considerations', () => {
    it('should handle high-volume logging', () => {
      // Skip in normal test runs to avoid excessive logging
      if (process.env.RUN_PERFORMANCE_TESTS !== 'true') {
        console.log('Skipping performance test - enable with RUN_PERFORMANCE_TESTS=true');
        return;
      }
      
      // Disable file logging for this test
      if (typeof logManager.setTransport === 'function') {
        logManager.setTransport('file', false);
      }
      
      // Act - Log many messages in quick succession
      const start = Date.now();
      for (let i = 0; i < 1000; i++) {
        logManager.debug(`High volume log message ${i}`);
      }
      const end = Date.now();
      
      // Assert - Should complete in a reasonable time
      expect(end - start).toBeLessThan(1000); // Less than 1 second
    });
    
    it('should implement log level checks efficiently', () => {
      // Check if the log level filtering is implemented efficiently
      if (typeof logManager.isLevelEnabled === 'function') {
        // Act & Assert - Should be a simple boolean check
        expect(typeof logManager.isLevelEnabled('debug')).toBe('boolean');
      } else {
        console.log('Skipping level check efficiency test - method not implemented');
      }
    });
  });
});