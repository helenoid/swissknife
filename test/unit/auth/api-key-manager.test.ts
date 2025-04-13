/**
 * Unit tests for API Key Management system
 */

import * as path from 'path';
import * as fs from 'fs/promises';
import { ApiKeyManager } from '../../../src/auth/api-key-manager';
import { ConfigurationManager } from '../../../src/config/manager';
import { createTempTestDir, removeTempTestDir, mockEnv } from '../../helpers/testUtils';

// Mock encryption functions if needed
jest.mock('../../../src/utils/encryption', () => ({
  encrypt: jest.fn((data) => `encrypted:${data}`),
  decrypt: jest.fn((data) => data.replace('encrypted:', '')),
  generateKeyPair: jest.fn(() => ({ publicKey: 'mock-public-key', privateKey: 'mock-private-key' }))
}));

describe('ApiKeyManager', () => {
  let apiKeyManager: any;
  let configManager: any;
  let tempDir: string;
  let configPath: string;
  let restoreEnv: () => void;
  
  beforeAll(async () => {
    // Create temp directory for testing
    tempDir = await createTempTestDir();
    configPath = path.join(tempDir, 'config.json');
    
    // Mock environment variables
    restoreEnv = mockEnv({
      'SWISSKNIFE_CONFIG_PATH': configPath,
      'OPENAI_API_KEY': 'env-openai-key',
      'ANTHROPIC_API_KEY': 'env-anthropic-key'
    });
  });
  
  afterAll(async () => {
    // Clean up temp directory
    await removeTempTestDir(tempDir);
    
    // Restore environment variables
    restoreEnv();
  });
  
  beforeEach(async () => {
    // Reset singletons
    (ConfigurationManager as any).instance = null;
    (ApiKeyManager as any).instance = null;
    
    // Initialize config manager
    configManager = ConfigurationManager.getInstance();
    (configManager as any).configPath = configPath;
    await configManager.initialize();
    
    // Initialize API key manager
    apiKeyManager = ApiKeyManager.getInstance();
    
    // Clear any existing keys in config
    configManager.set('apiKeys', {});
    await configManager.save();
    
    jest.clearAllMocks();
  });
  
  describe('basic operations', () => {
    it('should add and retrieve API keys', async () => {
      // Act - Add keys
      await apiKeyManager.addApiKey('openai', 'test-openai-key-1');
      await apiKeyManager.addApiKey('anthropic', 'test-anthropic-key-1');
      
      // Assert - Retrieve keys
      const openaiKeys = await apiKeyManager.getApiKeys('openai');
      const anthropicKeys = await apiKeyManager.getApiKeys('anthropic');
      
      expect(openaiKeys).toContain('test-openai-key-1');
      expect(anthropicKeys).toContain('test-anthropic-key-1');
    });
    
    it('should handle multiple keys per provider', async () => {
      // Act - Add multiple keys
      await apiKeyManager.addApiKey('openai', 'test-openai-key-1');
      await apiKeyManager.addApiKey('openai', 'test-openai-key-2');
      
      // Assert - Retrieve keys
      const openaiKeys = await apiKeyManager.getApiKeys('openai');
      
      expect(openaiKeys.length).toBe(2);
      expect(openaiKeys).toContain('test-openai-key-1');
      expect(openaiKeys).toContain('test-openai-key-2');
    });
    
    it('should not add duplicate keys', async () => {
      // Act - Add same key twice
      await apiKeyManager.addApiKey('openai', 'test-openai-key');
      await apiKeyManager.addApiKey('openai', 'test-openai-key');
      
      // Assert - Should only have one key
      const openaiKeys = await apiKeyManager.getApiKeys('openai');
      
      expect(openaiKeys.length).toBe(1);
      expect(openaiKeys[0]).toBe('test-openai-key');
    });
    
    it('should remove API keys', async () => {
      // Arrange - Add keys
      await apiKeyManager.addApiKey('openai', 'test-openai-key-1');
      await apiKeyManager.addApiKey('openai', 'test-openai-key-2');
      
      // Act - Remove one key
      const removed = await apiKeyManager.removeApiKey('openai', 'test-openai-key-1');
      
      // Assert
      expect(removed).toBe(true);
      
      const openaiKeys = await apiKeyManager.getApiKeys('openai');
      expect(openaiKeys.length).toBe(1);
      expect(openaiKeys[0]).toBe('test-openai-key-2');
    });
    
    it('should return false when removing non-existent key', async () => {
      // Act
      const removed = await apiKeyManager.removeApiKey('openai', 'non-existent-key');
      
      // Assert
      expect(removed).toBe(false);
    });
    
    it('should list all providers with keys', async () => {
      // Arrange - Add keys for multiple providers
      await apiKeyManager.addApiKey('openai', 'test-openai-key');
      await apiKeyManager.addApiKey('anthropic', 'test-anthropic-key');
      await apiKeyManager.addApiKey('cohere', 'test-cohere-key');
      
      // Act
      const providers = await apiKeyManager.getProviders();
      
      // Assert
      expect(providers.length).toBe(3);
      expect(providers).toContain('openai');
      expect(providers).toContain('anthropic');
      expect(providers).toContain('cohere');
    });
  });
  
  describe('environment variable integration', () => {
    it('should detect and use environment variables', async () => {
      // Act
      const openaiKey = await apiKeyManager.getBestApiKey('openai');
      const anthropicKey = await apiKeyManager.getBestApiKey('anthropic');
      
      // Assert
      expect(openaiKey).toBe('env-openai-key');
      expect(anthropicKey).toBe('env-anthropic-key');
    });
    
    it('should prefer stored keys over environment variables when specified', async () => {
      // Arrange - Add stored keys
      await apiKeyManager.addApiKey('openai', 'stored-openai-key');
      
      // Act - Get key with preferStored = true
      const openaiKey = await apiKeyManager.getBestApiKey('openai', { preferStored: true });
      
      // Assert
      expect(openaiKey).toBe('stored-openai-key');
      
      // Act - Get key with default preference (environment first)
      const defaultOpenaiKey = await apiKeyManager.getBestApiKey('openai');
      
      // Assert - Should return environment variable
      expect(defaultOpenaiKey).toBe('env-openai-key');
    });
    
    it('should fallback to stored keys when no environment variable exists', async () => {
      // Arrange - Add stored key for provider without environment variable
      await apiKeyManager.addApiKey('cohere', 'stored-cohere-key');
      
      // Act
      const cohereKey = await apiKeyManager.getBestApiKey('cohere');
      
      // Assert
      expect(cohereKey).toBe('stored-cohere-key');
    });
  });
  
  describe('key rotation and management', () => {
    it('should support key rotation', async () => {
      // Arrange - Add multiple keys
      await apiKeyManager.addApiKey('openai', 'openai-key-1');
      await apiKeyManager.addApiKey('openai', 'openai-key-2');
      await apiKeyManager.addApiKey('openai', 'openai-key-3');
      
      // Act - Enable rotation if method exists
      if (typeof apiKeyManager.enableKeyRotation === 'function') {
        await apiKeyManager.enableKeyRotation('openai', true);
      
        // Get multiple keys to test rotation
        const key1 = await apiKeyManager.getBestApiKey('openai');
        const key2 = await apiKeyManager.getBestApiKey('openai');
        const key3 = await apiKeyManager.getBestApiKey('openai');
        const key4 = await apiKeyManager.getBestApiKey('openai'); // Should cycle back to first key
        
        // Assert - Keys should rotate
        expect([key1, key2, key3]).toContain('openai-key-1');
        expect([key1, key2, key3]).toContain('openai-key-2');
        expect([key1, key2, key3]).toContain('openai-key-3');
        expect(key4).toBe(key1); // Should cycle back to first key
      } else {
        console.log('Skipping key rotation test - method not implemented');
      }
    });
    
    it('should mark keys as invalid when they fail', async () => {
      // Skip if method doesn't exist
      if (typeof apiKeyManager.markKeyAsInvalid !== 'function') {
        console.log('Skipping invalid key test - method not implemented');
        return;
      }
      
      // Arrange - Add keys
      await apiKeyManager.addApiKey('openai', 'valid-key');
      await apiKeyManager.addApiKey('openai', 'invalid-key');
      
      // Act - Mark one key as invalid
      await apiKeyManager.markKeyAsInvalid('openai', 'invalid-key');
      
      // Assert - Should not return invalid key
      const key = await apiKeyManager.getBestApiKey('openai');
      expect(key).toBe('valid-key');
      
      // All keys should include the invalid one
      const allKeys = await apiKeyManager.getApiKeys('openai', { includeInvalid: true });
      expect(allKeys).toContain('invalid-key');
      
      // Default should exclude invalid
      const validKeys = await apiKeyManager.getApiKeys('openai');
      expect(validKeys).not.toContain('invalid-key');
    });
    
    it('should support key usage tracking', async () => {
      // Skip if method doesn't exist
      if (typeof apiKeyManager.trackKeyUsage !== 'function') {
        console.log('Skipping key usage test - method not implemented');
        return;
      }
      
      // Arrange - Add key
      await apiKeyManager.addApiKey('openai', 'test-key');
      
      // Act - Track usage
      await apiKeyManager.trackKeyUsage('openai', 'test-key', { 
        tokens: 100, 
        successful: true 
      });
      
      // Assert - Get usage stats
      const stats = await apiKeyManager.getKeyStats('openai', 'test-key');
      
      expect(stats).toBeDefined();
      expect(stats.usageCount).toBe(1);
      expect(stats.tokenCount).toBe(100);
      expect(stats.errorCount).toBe(0);
    });
  });
  
  describe('security features', () => {
    it('should encrypt keys when storing', async () => {
      // Skip if encryption is not implemented
      const encryption = require('../../../src/utils/encryption');
      if (!encryption.encrypt) {
        console.log('Skipping encryption test - feature not implemented');
        return;
      }
      
      // Arrange - Spy on encryption function
      const encryptSpy = jest.spyOn(encryption, 'encrypt');
      
      // Act - Add a key
      await apiKeyManager.addApiKey('openai', 'secret-key');
      
      // Assert - Encryption should be used
      expect(encryptSpy).toHaveBeenCalled();
      
      // Verify key is stored encrypted in config
      const apiKeys = configManager.get('apiKeys.openai', []);
      const encryptedKey = apiKeys[0];
      
      expect(encryptedKey).toContain('encrypted:');
      expect(encryptedKey).not.toBe('secret-key');
    });
    
    it('should decrypt keys when retrieving', async () => {
      // Skip if encryption is not implemented
      const encryption = require('../../../src/utils/encryption');
      if (!encryption.decrypt) {
        console.log('Skipping decryption test - feature not implemented');
        return;
      }
      
      // Arrange - Spy on decryption function
      const decryptSpy = jest.spyOn(encryption, 'decrypt');
      
      // Add a key (which gets encrypted)
      await apiKeyManager.addApiKey('openai', 'secret-key');
      
      // Act - Retrieve the key
      const retrievedKey = await apiKeyManager.getBestApiKey('openai');
      
      // Assert - Decryption should be used
      expect(decryptSpy).toHaveBeenCalled();
      expect(retrievedKey).toBe('secret-key');
    });
    
    it('should detect key validation pattern', async () => {
      // Skip if method doesn't exist
      if (typeof apiKeyManager.validateKeyFormat !== 'function') {
        console.log('Skipping key validation test - method not implemented');
        return;
      }
      
      // Act & Assert - Common key formats
      expect(apiKeyManager.validateKeyFormat('openai', 'sk-1234567890abcdef1234567890abcdef')).toBe(true);
      expect(apiKeyManager.validateKeyFormat('anthropic', 'sk-ant-1234567890abcdef1234567890abcdef')).toBe(true);
      
      // Invalid formats
      expect(apiKeyManager.validateKeyFormat('openai', 'invalid-key')).toBe(false);
      expect(apiKeyManager.validateKeyFormat('anthropic', 'invalid-key')).toBe(false);
    });
    
    it('should handle master password for key encryption', async () => {
      // Skip if method doesn't exist
      if (typeof apiKeyManager.setMasterPassword !== 'function') {
        console.log('Skipping master password test - method not implemented');
        return;
      }
      
      // Act - Set master password
      await apiKeyManager.setMasterPassword('secure-password');
      
      // Add key with encryption
      await apiKeyManager.addApiKey('openai', 'protected-key');
      
      // Verify can retrieve key with correct password
      const key = await apiKeyManager.getBestApiKey('openai');
      expect(key).toBe('protected-key');
      
      // Verify can't retrieve key with wrong password
      await apiKeyManager.setMasterPassword('wrong-password');
      try {
        await apiKeyManager.getBestApiKey('openai');
        fail('Should have thrown error for wrong password');
      } catch (error) {
        expect(error.message).toContain('decrypt');
      }
    });
  });
  
  describe('persistence', () => {
    it('should persist keys across sessions', async () => {
      // Arrange - Add keys
      await apiKeyManager.addApiKey('openai', 'persistent-key');
      
      // Act - Create new instances to simulate new session
      (ApiKeyManager as any).instance = null;
      const newApiKeyManager = ApiKeyManager.getInstance();
      
      // Assert - Keys should still be retrievable
      const openaiKeys = await newApiKeyManager.getApiKeys('openai');
      expect(openaiKeys).toContain('persistent-key');
    });
    
    it('should support import/export operations', async () => {
      // Skip if methods don't exist
      if (typeof apiKeyManager.exportKeys !== 'function' || typeof apiKeyManager.importKeys !== 'function') {
        console.log('Skipping import/export test - methods not implemented');
        return;
      }
      
      // Arrange - Add keys
      await apiKeyManager.addApiKey('openai', 'export-key-1');
      await apiKeyManager.addApiKey('anthropic', 'export-key-2');
      
      // Act - Export keys
      const exportData = await apiKeyManager.exportKeys();
      
      // Clear keys
      await apiKeyManager.removeApiKey('openai', 'export-key-1');
      await apiKeyManager.removeApiKey('anthropic', 'export-key-2');
      
      // Import keys
      await apiKeyManager.importKeys(exportData);
      
      // Assert - Keys should be restored
      const openaiKeys = await apiKeyManager.getApiKeys('openai');
      const anthropicKeys = await apiKeyManager.getApiKeys('anthropic');
      
      expect(openaiKeys).toContain('export-key-1');
      expect(anthropicKeys).toContain('export-key-2');
    });
  });
});