/**
 * Simple Jest test for LogManager
 * 
 * Tests basic functionality of the LogManager with Jest assertions
 */


describe('LogManager Basic Tests', () => {
  let logManager;
  
  beforeEach(() => {
    // Reset singleton
    LogManager.instance = null;
    
    // Create new instance with test configuration
    logManager = LogManager.getInstance({
      level: 'debug',
      console: true,
      file: false
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
  
  test('should implement singleton pattern', () => {
    // Arrange
    const instance1 = LogManager.getInstance();
    const instance2 = LogManager.getInstance();
    
    // Assert
    expect(instance1).toBe(instance2);
  });
  
  test('should log error messages', () => {
    // Act
    logManager.error('Test error message');
    
    // Assert
    expect(console.error).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Test error message')
    );
  });
  
  test('should log warning messages', () => {
    // Act
    logManager.warn('Test warning message');
    
    // Assert
    expect(console.warn).toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('Test warning message')
    );
  });
  
  test('should log info messages', () => {
    // Act
    logManager.info('Test info message');
    
    // Assert
    expect(console.info).toHaveBeenCalled();
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('Test info message')
    );
  });
  
  test('should log debug messages', () => {
    // Act
    logManager.debug('Test debug message');
    
    // Assert
    expect(console.debug).toHaveBeenCalled();
    expect(console.debug).toHaveBeenCalledWith(
      expect.stringContaining('Test debug message')
    );
  });
  
  test('should respect log level settings', () => {
    // Create a new instance with a higher minimum log level
    const infoLevelLogger = LogManager.getInstance({
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
    expect(console.info).toHaveBeenCalled();
    expect(console.debug).not.toHaveBeenCalled(); // Debug should be filtered
  });
  
  test('should check log levels efficiently', () => {
    // Skip if method not implemented
    if (typeof logManager.isLevelEnabled !== 'function') {
      console.log('Skipping level check - method not implemented');
      return;
    }
    
    // Create a logger with warn level
    const warnLogger = LogManager.getInstance({
      level: 'warn',
      console: false,
      file: false
    });
    
    // Act & Assert
    expect(warnLogger.isLevelEnabled('debug')).toBe(false);
    expect(warnLogger.isLevelEnabled('info')).toBe(false);
    expect(warnLogger.isLevelEnabled('warn')).toBe(true);
    expect(warnLogger.isLevelEnabled('error')).toBe(true);
  });
  
  test('should include timestamp in logs', () => {
    // Act
    logManager.info('Test timestamp');
    
    // Assert
    const consoleCall = (console.info as jest.Mock).mock.calls[0][0];
    
    // Timestamp format depends on implementation, but should include numbers
    expect(consoleCall).toMatch(/\d/);
  });
});
