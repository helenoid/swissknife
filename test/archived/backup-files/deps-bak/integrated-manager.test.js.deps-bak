/**
 * Fixed test for LogManager functionality
 * Using the actual implementation
 */

// Mock the LogManager's console references
beforeEach(() => {
  // Spy on console methods
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'info').mockImplementation(() => {});
  jest.spyOn(console, 'debug').mockImplementation(() => {});
});

afterEach(() => {
  // Restore console methods
  jest.restoreAllMocks();
  // Reset the LogManager singleton
  const { LogManager } = require('../../../../src/utils/logging/manager');
  LogManager.instance = null;
});

// Import the actual LogManager
const { LogManager } = require('../../../../src/utils/logging/manager');

describe('LogManager Integration Tests', () => {
  let logManager;
  
  beforeEach(() => {
    // Reset the singleton
    LogManager.instance = null;
    
    // Create a new instance with debug level
    logManager = LogManager.getInstance({
      level: 'debug',
      console: true,
      file: false
    });
  });
  
  test('should implement the singleton pattern', () => {
    // Arrange & Act
    const instance1 = LogManager.getInstance();
    const instance2 = LogManager.getInstance();
    
    // Assert
    expect(instance1).toEqual(instance2);
  });
  
  test('should log messages at different levels', () => {
    // Act
    logManager.error('Error message');
    logManager.warn('Warning message');
    logManager.info('Info message');
    logManager.debug('Debug message');
    
    // Assert
    expect(console.error).toHaveBeenCalledWith('Error message');
    expect(console.warn).toHaveBeenCalledWith('Warning message');
    expect(console.info).toHaveBeenCalledWith('Info message');
    expect(console.debug).toHaveBeenCalledWith('Debug message');
  });
  
  test('should respect log level settings', () => {
    // Arrange - Create a new logger with info level
    LogManager.instance = null;
    const infoLogger = LogManager.getInstance({
      level: 'info',
      console: true
    });
    
    // Act
    infoLogger.error('Error message');
    infoLogger.warn('Warning message');
    infoLogger.info('Info message');
    infoLogger.debug('Debug message'); // Should be filtered
    
    // Assert
    expect(console.error).toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalled();
    expect(console.info).toHaveBeenCalled();
    expect(console.debug).not.toHaveBeenCalled(); // Debug should be ignored
  });
  
  test('should allow enabling/disabling transports', () => {
    // Act - Disable console transport
    logManager.setTransport('console', false);
    logManager.info('This should not be logged');
    
    // Assert
    expect(console.info).not.toHaveBeenCalled();
    
    // Re-enable and test
    logManager.setTransport('console', true);
    logManager.info('This should be logged');
    
    // Assert
    expect(console.info).toHaveBeenCalled();
  });
  
  test('should efficiently check log levels', () => {
    // Arrange
    LogManager.instance = null;
    const warnLogger = LogManager.getInstance({ level: 'warn' });
    
    // Act & Assert
    expect(warnLogger.isLevelEnabled('debug')).toBe(false);
    expect(warnLogger.isLevelEnabled('info')).toBe(false);
    expect(warnLogger.isLevelEnabled('warn')).toBe(true);
    expect(warnLogger.isLevelEnabled('error')).toBe(true);
  });
});
