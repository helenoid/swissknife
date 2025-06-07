// Mock common dependencies
jest.mock("chalk", () => ({ default: (str) => str, red: (str) => str, green: (str) => str, blue: (str) => str }));
jest.mock("nanoid", () => ({ nanoid: () => "test-id" }));
jest.mock("fs", () => ({ promises: { readFile: jest.fn(), writeFile: jest.fn(), mkdir: jest.fn() } }));
// Mock temp directory helpers
const createTempTestDir = jest.fn().mockImplementation((name) => `/tmp/test-${name}-${Date.now()}`);
const removeTempTestDir = jest.fn().mockImplementation(async (dir) => Promise.resolve());
/**
 * Unit tests for LogManager
 */

const path = require('path');
import { LogManager } from '../../../../src/utils/logging/manager.ts';
const testUtils = require('../../../helpers/testUtils.cjs');

// Set up Jest globals
const { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } = require('@jest/globals');

describe('LogManager', () => {
  let logManager;
  let tempDir;
  let logFilePath;
  
  beforeAll(async () => {
    // Create temp directory for testing
    tempDir = await testUtils.createTempTestDir();
    logFilePath = path.join(tempDir, 'test.log');
  });
  
  afterAll(async () => {
    // Clean up temp directory
    await testUtils.removeTempTestDir(tempDir);
  });
  
  beforeEach(() => {
    // Reset singleton
    LogManager.instance = null;
    
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

  // Basic tests
  it('should create a singleton instance', () => {
    expect(logManager).toBeDefined();
    expect(LogManager.getInstance()).toBe(logManager);
  });

  it('should log at error level', () => {
    logManager.error('Test error message');
    // Should be called with formatted message including timestamp and level
    expect(console.error).toHaveBeenCalledWith(
      expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[ERROR\] Test error message/),
      ''
    );
  });

  it('should log at warn level', () => {
    logManager.warn('Test warning message');
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[WARN\] Test warning message/),
      ''
    );
  });

  it('should log at info level', () => {
    logManager.info('Test info message');
    expect(console.info).toHaveBeenCalledWith(
      expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[INFO\] Test info message/),
      ''
    );
  });

  it('should log at debug level', () => {
    logManager.debug('Test debug message');
    expect(console.debug).toHaveBeenCalledWith(
      expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[DEBUG\] Test debug message/),
      ''
    );
  });

  it('should respect log level settings', () => {
    // Set to info level, debug shouldn't show
    LogManager.instance = null;
    logManager = LogManager.getInstance({
      logFilePath,
      level: 'info',
      console: true
    });
    
    logManager.debug('Debug message');
    logManager.info('Info message');
    
    expect(console.debug).not.toHaveBeenCalled();
    expect(console.info).toHaveBeenCalledWith(
      expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[INFO\] Info message/),
      ''
    );
  });
});
