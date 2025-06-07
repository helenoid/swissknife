/**
 * Unit tests for DocumentationGenerator
 */

import * as fs from 'fs/promises';
import { DocumentationGenerator } from '../../../src/documentation/doc-generator.js';

// Mock fs/promises
jest.mock('fs/promises', () => ({
  writeFile: jest.fn().mockResolvedValue(undefined)
}));

describe('DocumentationGenerator', () => {
  let docGenerator: DocumentationGenerator;
  let consoleLogSpy: jest.SpyInstance;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create instance
    docGenerator = new DocumentationGenerator();
    
    // Spy on console.log to prevent output during tests
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });
  
  afterEach(() => {
    consoleLogSpy.mockRestore();
  });
  
  describe('generateUserGuide', () => {
    it('should generate the user guide file', async () => {
      // Act
      await docGenerator.generateUserGuide();
      
      // Assert
      expect(fs.writeFile).toHaveBeenCalledWith(
        'docs/user-guide.md',
        expect.stringContaining('# SwissKnife User Guide')
      );
    });
  });
  
  describe('generateAPIReference', () => {
    it('should generate the API reference file', async () => {
      // Act
      await docGenerator.generateAPIReference();
      
      // Assert
      expect(fs.writeFile).toHaveBeenCalledWith(
        'docs/api-reference.md',
        expect.stringContaining('# SwissKnife API Reference')
      );
    });
  });
  
  describe('generateAllDocs', () => {
    it('should call both document generation methods', async () => {
      // Arrange
      const userGuideSpy = jest.spyOn(docGenerator, 'generateUserGuide').mockResolvedValue(undefined);
      const apiRefSpy = jest.spyOn(docGenerator, 'generateAPIReference').mockResolvedValue(undefined);
      
      // Act
      await docGenerator.generateAllDocs();
      
      // Assert
      expect(userGuideSpy).toHaveBeenCalled();
      expect(apiRefSpy).toHaveBeenCalled();
    });
    
    it('should handle errors gracefully', async () => {
      // Arrange
      jest.spyOn(docGenerator, 'generateUserGuide').mockRejectedValue(new Error('Test error'));
      jest.spyOn(console, 'error').mockImplementation();
      
      // Act & Assert
      await expect(docGenerator.generateAllDocs()).resolves.not.toThrow();
    });
  });
});
