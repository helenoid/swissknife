/**
 * Unit tests for TestRunner
 */

import * as childProcess from 'child_process';
import { TestRunner } from '../../../src/testing/test-runner.js';

// Mock child_process.exec
jest.mock('child_process', () => ({
  exec: jest.fn((_cmd, callback) => {
    callback(null, { stdout: 'Test output', stderr: '' });
  })
}));

describe('TestRunner', () => {
  let testRunner: TestRunner;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create instance
    testRunner = new TestRunner();
    
    // Spy on console methods to prevent output during tests
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });
  
  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
  
  describe('runUnitTests', () => {
    it('should execute pnpm test:unit command', async () => {
      // Act
      await testRunner.runUnitTests();
      
      // Assert
      expect(childProcess.exec).toHaveBeenCalledWith(
        'pnpm test:unit',
        expect.any(Function)
      );
    });
    
    it('should log stderr if present', async () => {
      // Arrange
      (childProcess.exec as any).mockImplementationOnce((_cmd: any, callback: any) => {
        callback(null, { stdout: 'Test output', stderr: 'Error output' });
      });
      
      // Act
      await testRunner.runUnitTests();
      
      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error output');
    });
  });
  
  describe('runIntegrationTests', () => {
    it('should execute pnpm test:integration command', async () => {
      // Act
      await testRunner.runIntegrationTests();
      
      // Assert
      expect(childProcess.exec).toHaveBeenCalledWith(
        'pnpm test:integration',
        expect.any(Function)
      );
    });
  });
  
  describe('runE2ETests', () => {
    it('should execute pnpm test:e2e command', async () => {
      // Act
      await testRunner.runE2ETests();
      
      // Assert
      expect(childProcess.exec).toHaveBeenCalledWith(
        'pnpm test:e2e',
        expect.any(Function)
      );
    });
  });
  
  describe('runAllTests', () => {
    it('should call all test runner methods in sequence', async () => {
      // Arrange
      const unitSpy = jest.spyOn(testRunner, 'runUnitTests').mockResolvedValue(undefined);
      const integrationSpy = jest.spyOn(testRunner, 'runIntegrationTests').mockResolvedValue(undefined);
      const e2eSpy = jest.spyOn(testRunner, 'runE2ETests').mockResolvedValue(undefined);
      
      // Act
      await testRunner.runAllTests();
      
      // Assert
      expect(unitSpy).toHaveBeenCalled();
      expect(integrationSpy).toHaveBeenCalled();
      expect(e2eSpy).toHaveBeenCalled();
    });
    
    it('should handle test failure gracefully', async () => {
      // Arrange
      (childProcess.exec as any).mockImplementationOnce((_cmd: any, callback: any) => {
        const error = new Error('Test command failed') as any;
        error.stderr = 'Test failed';
        callback(error, { stdout: '', stderr: 'Test failed' });
      });
      
      // Act
      await testRunner.runAllTests();
      
      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith('Test failed');
    });
  });
});
