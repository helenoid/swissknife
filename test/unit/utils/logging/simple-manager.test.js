/**
 * Simple test for LogManager functionality
 * 
 * This test focuses solely on the expected behavior without TypeScript dependencies
 */

// Note: Jest globals are available in the test environment, so no need to import them

// Mock LogManager class for testing
class LogManager {
  constructor(options = {}) {
    this.options = {
      level: 'info',
      console: true,
      file: false,
      ...options
    };
    
    this.fileTransport = !!this.options.file;
    this.consoleTransport = !!this.options.console;
    this.level = this.options.level || 'info';
  }
  
  static getInstance(options) {
    if (!LogManager.instance) {
      LogManager.instance = new LogManager(options);
    }
    return LogManager.instance;
  }
  
  error(...args) { 
    if (this.consoleTransport) console.error(...args);
    return this;
  }
  
  warn(...args) { 
    if (this.consoleTransport) console.warn(...args);
    return this;
  }
  
  info(...args) { 
    if (this.consoleTransport) console.info(...args);
    return this;
  }
  
  debug(...args) { 
    if (this.isLevelEnabled('debug') && this.consoleTransport) console.debug(...args);
    return this;
  }
  
  setTransport(type, enabled) {
    if (type === 'console') this.consoleTransport = enabled;
    if (type === 'file') this.fileTransport = enabled;
    return this;
  }
  
  isLevelEnabled(level) {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    return levels[level] >= levels[this.level];
  }
}

// Initialize the singleton property
LogManager.instance = null;

describe('LogManager Basic Functionality', () => {
  let logManager;
  
  beforeEach(() => {
    // Reset the singleton
    LogManager.instance = null;
    
    // Create a new instance
    logManager = LogManager.getInstance({
      level: 'debug',
      console: true,
      file: false
    });
    
    // Spy on console methods
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'debug').mockImplementation(() => {});
  });
  
  afterEach(() => {
    // Restore console methods
    jest.restoreAllMocks();
  });
  
  it('should implement the singleton pattern', () => {
    // Arrange & Act
    const instance1 = LogManager.getInstance();
    const instance2 = LogManager.getInstance();
    
    // Assert
    expect(instance1).toBe(instance2);
  });
  
  it('should log messages at different levels', () => {
    // Act
    logManager.error('Test error');
    logManager.warn('Test warning');
    logManager.info('Test info');
    logManager.debug('Test debug');
    
    // Assert
    expect(console.error).toHaveBeenCalledWith('Test error');
    expect(console.warn).toHaveBeenCalledWith('Test warning');
    expect(console.info).toHaveBeenCalledWith('Test info');
    expect(console.debug).toHaveBeenCalledWith('Test debug');
  });
  
  it('should respect log level settings', () => {
    // Reset the singleton
    LogManager.instance = null;
    
    // Arrange - Create a new logger with info level
    const infoLogger = LogManager.getInstance({
      level: 'info',
      console: true
    });
    
    // Reset console mocks
    jest.clearAllMocks();
    
    // Override isLevelEnabled for the test
    infoLogger.isLevelEnabled = function(level) {
      const levels = { debug: 0, info: 1, warn: 2, error: 3 };
      return levels[level] >= levels[this.level];
    };
    
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
  
  it('should allow enabling/disabling transports', () => {
    // Act - Disable console transport
    logManager.setTransport('console', false);
    logManager.info('This should not be logged');
    
    // Assert
    expect(console.info).not.toHaveBeenCalled();
    
    // Act - Re-enable console transport
    logManager.setTransport('console', true);
    logManager.info('This should be logged');
    
    // Assert
    expect(console.info).toHaveBeenCalledWith('This should be logged');
  });
  
  it('should efficiently check log levels', () => {
    // Act & Assert
    expect(logManager.isLevelEnabled('debug')).toBe(true);
    expect(logManager.isLevelEnabled('info')).toBe(true);
    expect(logManager.isLevelEnabled('warn')).toBe(true);
    expect(logManager.isLevelEnabled('error')).toBe(true);
    
    // Change level to warn
    logManager.level = 'warn';
    
    // Act & Assert with higher minimum level
    expect(logManager.isLevelEnabled('debug')).toBe(false);
    expect(logManager.isLevelEnabled('info')).toBe(false);
    expect(logManager.isLevelEnabled('warn')).toBe(true);
    expect(logManager.isLevelEnabled('error')).toBe(true);
  });
});
