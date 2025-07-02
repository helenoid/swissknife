/**
 * Simple unit tests for LogManager
 * 
 * Plain JavaScript version for better compatibility
 */

// Mock the fs module
const mockFs = {
  writeFileSync: jest.fn(),
  appendFileSync: jest.fn(),
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn()
};

// Mock path module
const mockPath = {
  join: jest.fn((...paths) => paths.join('/')),
  dirname: jest.fn(path => path.split('/').slice(0, -1).join('/'))
};

jest.mock('fs', () => mockFs);
jest.mock('path', () => mockPath);

// Import our LogManager module
const { LogManager } = require('../../../../src/utils/logging/manager');

describe('LogManager Basic Tests', () => {
  let logManager;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Reset singleton
    LogManager.instance = null;
    
    // Create a new log manager
    logManager = LogManager.getInstance({
      level: 'debug',
      console: true,
      file: true,
      filePath: '/test/log/path.log'
    });
    
    // Spy on console methods
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'debug').mockImplementation(() => {});
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  test('should implement singleton pattern', () => {
    // Arrange & Act
    const instance1 = LogManager.getInstance();
    const instance2 = LogManager.getInstance();
    
    // Assert
    expect(instance1).toEqual(instance2);
  });
  
  test('should log error messages', () => {
    // Arrange
    const errorMessage = 'Test error message';
    
    // Act
    logManager.error(errorMessage);
    
    // Assert
    expect(console.error).toHaveBeenCalledWith(errorMessage);
  });
  
  test('should log warn messages', () => {
    // Arrange
    const warnMessage = 'Test warning message';
    
    // Act
    logManager.warn(warnMessage);
    
    // Assert
    expect(console.warn).toHaveBeenCalledWith(warnMessage);
  });
  
  test('should log info messages', () => {
    // Arrange
    const infoMessage = 'Test info message';
    
    // Act
    logManager.info(infoMessage);
    
    // Assert
    expect(console.info).toHaveBeenCalledWith(infoMessage);
  });
  
  test('should log debug messages when debug level is enabled', () => {
    // Arrange
    const debugMessage = 'Test debug message';
    
    // Act
    logManager.debug(debugMessage);
    
    // Assert
    expect(console.debug).toHaveBeenCalledWith(debugMessage);
  });
  
  test('should not log debug messages when debug level is not enabled', () => {
    // Arrange
    LogManager.instance = null;
    logManager = LogManager.getInstance({ level: 'info' }); // Set level to info
    const debugMessage = 'Test debug message';
    
    // Act
    logManager.debug(debugMessage);
    
    // Assert
    expect(console.debug).not.toHaveBeenCalled();
  });
  
  test('should enable console transport by default', () => {
    // Arrange
    LogManager.instance = null;
    logManager = LogManager.getInstance();
    const infoMessage = 'Test message';
    
    // Act
    logManager.info(infoMessage);
    
    // Assert
    expect(console.info).toHaveBeenCalledWith(infoMessage);
  });
  
  test('should disable console transport when specified', () => {
    // Arrange
    LogManager.instance = null;
    logManager = LogManager.getInstance({ console: false });
    const infoMessage = 'Test message';
    
    // Act
    logManager.info(infoMessage);
    
    // Assert
    expect(console.info).not.toHaveBeenCalled();
  });
});
