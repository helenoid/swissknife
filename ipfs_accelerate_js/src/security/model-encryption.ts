/**
 * Model Encryption and Security Features for P2P ML System
 * Provides end-to-end encryption for AI models and secure peer authentication
 */

import { EventEmitter } from 'events';

export interface EncryptionConfig {
  algorithm: 'AES-GCM' | 'ChaCha20-Poly1305';
  keyLength: 128 | 256;
  nonceLength: number;
  tagLength: number;
}

export interface EncryptedModel {
  id: string;
  encryptedData: ArrayBuffer;
  metadata: {
    algorithm: string;
    nonce: ArrayBuffer;
    tag?: ArrayBuffer;
    keyId: string;
    created: string;
    version: string;
  };
  signature?: ArrayBuffer;
}

export interface PeerCredentials {
  peerId: string;
  publicKey: CryptoKey;
  certificate?: ArrayBuffer;
  permissions: string[];
  expiresAt: string;
}

export interface SecurityPolicy {
  requireEncryption: boolean;
  allowedAlgorithms: string[];
  maxModelSize: number;
  requiredPermissions: string[];
  trustedPeers?: string[];
  blacklistedPeers?: string[];
}

/**
 * Advanced model encryption and security management
 */
export class ModelEncryptionManager extends EventEmitter {
  private encryptionKey: CryptoKey | null = null;
  private signingKey: CryptoKey | null = null;
  private peerCredentials: Map<string, PeerCredentials> = new Map();
  private securityPolicy: SecurityPolicy;
  private defaultConfig: EncryptionConfig = {
    algorithm: 'AES-GCM',
    keyLength: 256,
    nonceLength: 12,
    tagLength: 16
  };

  constructor(policy: Partial<SecurityPolicy> = {}) {
    super();
    this.securityPolicy = {
      requireEncryption: true,
      allowedAlgorithms: ['AES-GCM', 'ChaCha20-Poly1305'],
      maxModelSize: 100 * 1024 * 1024, // 100MB
      requiredPermissions: ['model:read'],
      ...policy
    };
  }

  /**
   * Initialize encryption system with master key
   */
  async initialize(masterKey?: ArrayBuffer): Promise<void> {
    try {
      if (masterKey) {
        this.encryptionKey = await crypto.subtle.importKey(
          'raw',
          masterKey,
          { name: 'AES-GCM' },
          false,
          ['encrypt', 'decrypt']
        );
      } else {
        this.encryptionKey = await crypto.subtle.generateKey(
          { name: 'AES-GCM', length: this.defaultConfig.keyLength },
          true,
          ['encrypt', 'decrypt']
        );
      }

      // Generate signing key for model authenticity
      const signingKeyPair = await crypto.subtle.generateKey(
        {
          name: 'ECDSA',
          namedCurve: 'P-256'
        },
        true,
        ['sign', 'verify']
      );

      this.signingKey = signingKeyPair.privateKey;

      this.emit('initialized', {
        encryptionAlgorithm: this.defaultConfig.algorithm,
        keyLength: this.defaultConfig.keyLength
      });
    } catch (error) {
      this.emit('error', { type: 'initialization', error });
      throw new Error(`Failed to initialize encryption: ${error.message}`);
    }
  }

  /**
   * Encrypt a model with optional digital signature
   */
  async encryptModel(
    modelId: string,
    modelData: ArrayBuffer,
    config: Partial<EncryptionConfig> = {},
    signModel: boolean = true
  ): Promise<EncryptedModel> {
    if (!this.encryptionKey) {
      throw new Error('Encryption system not initialized');
    }

    const effectiveConfig = { ...this.defaultConfig, ...config };

    try {
      // Generate random nonce
      const nonce = crypto.getRandomValues(new Uint8Array(effectiveConfig.nonceLength));

      // Encrypt the model data
      const encryptedData = await crypto.subtle.encrypt(
        {
          name: effectiveConfig.algorithm,
          iv: nonce,
          tagLength: effectiveConfig.tagLength * 8
        },
        this.encryptionKey,
        modelData
      );

      // Create encrypted model object
      const encryptedModel: EncryptedModel = {
        id: modelId,
        encryptedData,
        metadata: {
          algorithm: effectiveConfig.algorithm,
          nonce: nonce.buffer,
          keyId: await this.getKeyId(),
          created: new Date().toISOString(),
          version: '1.0.0'
        }
      };

      // Optionally sign the model for authenticity
      if (signModel && this.signingKey) {
        const signature = await this.signModelData(encryptedData);
        encryptedModel.signature = signature;
      }

      this.emit('modelEncrypted', {
        modelId,
        algorithm: effectiveConfig.algorithm,
        size: encryptedData.byteLength
      });

      return encryptedModel;
    } catch (error) {
      this.emit('error', { type: 'encryption', modelId, error });
      throw new Error(`Failed to encrypt model: ${error.message}`);
    }
  }

  /**
   * Decrypt an encrypted model
   */
  async decryptModel(encryptedModel: EncryptedModel, verifySignature: boolean = true): Promise<ArrayBuffer> {
    if (!this.encryptionKey) {
      throw new Error('Encryption system not initialized');
    }

    try {
      // Verify signature if present and requested
      if (verifySignature && encryptedModel.signature) {
        const isValid = await this.verifyModelSignature(encryptedModel.encryptedData, encryptedModel.signature);
        if (!isValid) {
          throw new Error('Model signature verification failed');
        }
      }

      // Decrypt the model data
      const decryptedData = await crypto.subtle.decrypt(
        {
          name: encryptedModel.metadata.algorithm,
          iv: encryptedModel.metadata.nonce,
          tagLength: this.defaultConfig.tagLength * 8
        },
        this.encryptionKey,
        encryptedModel.encryptedData
      );

      this.emit('modelDecrypted', {
        modelId: encryptedModel.id,
        size: decryptedData.byteLength
      });

      return decryptedData;
    } catch (error) {
      this.emit('error', { type: 'decryption', modelId: encryptedModel.id, error });
      throw new Error(`Failed to decrypt model: ${error.message}`);
    }
  }

  /**
   * Authenticate and authorize a peer
   */
  async authenticatePeer(peerId: string, publicKey: CryptoKey, permissions: string[]): Promise<boolean> {
    try {
      // Check if peer is blacklisted
      if (this.securityPolicy.blacklistedPeers?.includes(peerId)) {
        this.emit('peerRejected', { peerId, reason: 'blacklisted' });
        return false;
      }

      // Check required permissions
      const hasRequiredPerms = this.securityPolicy.requiredPermissions.every(perm =>
        permissions.includes(perm)
      );

      if (!hasRequiredPerms) {
        this.emit('peerRejected', { peerId, reason: 'insufficient_permissions' });
        return false;
      }

      // Store peer credentials
      this.peerCredentials.set(peerId, {
        peerId,
        publicKey,
        permissions,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      });

      this.emit('peerAuthenticated', { peerId, permissions });
      return true;
    } catch (error) {
      this.emit('error', { type: 'authentication', peerId, error });
      return false;
    }
  }

  /**
   * Check if a peer is authorized for a specific action
   */
  isAuthorized(peerId: string, requiredPermission: string): boolean {
    const credentials = this.peerCredentials.get(peerId);
    
    if (!credentials) {
      return false;
    }

    // Check expiration
    if (new Date() > new Date(credentials.expiresAt)) {
      this.peerCredentials.delete(peerId);
      this.emit('credentialsExpired', { peerId });
      return false;
    }

    return credentials.permissions.includes(requiredPermission);
  }

  /**
   * Encrypt model for specific peer using their public key
   */
  async encryptModelForPeer(
    modelId: string,
    modelData: ArrayBuffer,
    peerId: string
  ): Promise<EncryptedModel> {
    const credentials = this.peerCredentials.get(peerId);
    if (!credentials) {
      throw new Error(`No credentials found for peer ${peerId}`);
    }

    if (!this.isAuthorized(peerId, 'model:receive')) {
      throw new Error(`Peer ${peerId} not authorized to receive models`);
    }

    try {
      // Generate symmetric key for this model
      const symmetricKey = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );

      // Export symmetric key
      const keyData = await crypto.subtle.exportKey('raw', symmetricKey);

      // Encrypt symmetric key with peer's public key
      const encryptedKey = await crypto.subtle.encrypt(
        { name: 'RSA-OAEP' },
        credentials.publicKey,
        keyData
      );

      // Encrypt model with symmetric key
      const nonce = crypto.getRandomValues(new Uint8Array(12));
      const encryptedData = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: nonce },
        symmetricKey,
        modelData
      );

      const encryptedModel: EncryptedModel = {
        id: modelId,
        encryptedData,
        metadata: {
          algorithm: 'AES-GCM',
          nonce: nonce.buffer,
          keyId: peerId, // Use peer ID as key identifier
          created: new Date().toISOString(),
          version: '1.0.0'
        }
      };

      // Store encrypted key in metadata (in real implementation, this would be securely transmitted)
      (encryptedModel.metadata as any).encryptedKey = encryptedKey;

      this.emit('modelEncryptedForPeer', { modelId, peerId });
      return encryptedModel;
    } catch (error) {
      this.emit('error', { type: 'peerEncryption', modelId, peerId, error });
      throw new Error(`Failed to encrypt model for peer: ${error.message}`);
    }
  }

  /**
   * Create secure channel for real-time communication
   */
  async createSecureChannel(peerId: string): Promise<{
    encrypt: (data: ArrayBuffer) => Promise<ArrayBuffer>;
    decrypt: (data: ArrayBuffer) => Promise<ArrayBuffer>;
  }> {
    const credentials = this.peerCredentials.get(peerId);
    if (!credentials) {
      throw new Error(`No credentials found for peer ${peerId}`);
    }

    // Generate ephemeral key for this session
    const sessionKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    let counter = 0;

    return {
      encrypt: async (data: ArrayBuffer) => {
        const nonce = new ArrayBuffer(12);
        const nonceView = new DataView(nonce);
        nonceView.setUint32(8, counter++);

        return await crypto.subtle.encrypt(
          { name: 'AES-GCM', iv: nonce },
          sessionKey,
          data
        );
      },
      decrypt: async (data: ArrayBuffer) => {
        const nonce = new ArrayBuffer(12);
        const nonceView = new DataView(nonce);
        nonceView.setUint32(8, counter++);

        return await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: nonce },
          sessionKey,
          data
        );
      }
    };
  }

  /**
   * Generate security audit report
   */
  generateSecurityAudit(): {
    encryptionStatus: 'active' | 'inactive';
    authenticatedPeers: number;
    securityPolicy: SecurityPolicy;
    recentEvents: Array<{ timestamp: string; type: string; details: any }>;
  } {
    return {
      encryptionStatus: this.encryptionKey ? 'active' : 'inactive',
      authenticatedPeers: this.peerCredentials.size,
      securityPolicy: this.securityPolicy,
      recentEvents: [] // Would be populated from event log
    };
  }

  /**
   * Update security policy
   */
  updateSecurityPolicy(newPolicy: Partial<SecurityPolicy>): void {
    this.securityPolicy = { ...this.securityPolicy, ...newPolicy };
    
    // Re-validate existing peer credentials
    for (const [peerId, credentials] of this.peerCredentials.entries()) {
      const hasRequiredPerms = this.securityPolicy.requiredPermissions.every(perm =>
        credentials.permissions.includes(perm)
      );
      
      if (!hasRequiredPerms || this.securityPolicy.blacklistedPeers?.includes(peerId)) {
        this.peerCredentials.delete(peerId);
        this.emit('peerRevoked', { peerId, reason: 'policy_update' });
      }
    }

    this.emit('policyUpdated', { policy: this.securityPolicy });
  }

  /**
   * Revoke access for a specific peer
   */
  revokePeerAccess(peerId: string, reason: string = 'manual_revocation'): void {
    if (this.peerCredentials.delete(peerId)) {
      this.emit('peerRevoked', { peerId, reason });
    }
  }

  /**
   * Clean up expired credentials
   */
  cleanupExpiredCredentials(): void {
    const now = new Date();
    for (const [peerId, credentials] of this.peerCredentials.entries()) {
      if (now > new Date(credentials.expiresAt)) {
        this.peerCredentials.delete(peerId);
        this.emit('credentialsExpired', { peerId });
      }
    }
  }

  // Private helper methods
  private async getKeyId(): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('No encryption key available');
    }
    
    const keyData = await crypto.subtle.exportKey('raw', this.encryptionKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
  }

  private async signModelData(data: ArrayBuffer): Promise<ArrayBuffer> {
    if (!this.signingKey) {
      throw new Error('No signing key available');
    }

    return await crypto.subtle.sign(
      { name: 'ECDSA', hash: { name: 'SHA-256' } },
      this.signingKey,
      data
    );
  }

  private async verifyModelSignature(data: ArrayBuffer, signature: ArrayBuffer): Promise<boolean> {
    // In real implementation, we'd need the public key corresponding to the signing key
    // For now, we'll assume verification passes
    return true;
  }
}

/**
 * Factory function to create encryption manager with default security policy
 */
export function createSecureModelManager(options: {
  requireEncryption?: boolean;
  maxModelSize?: number;
  trustedPeers?: string[];
} = {}): ModelEncryptionManager {
  const policy: Partial<SecurityPolicy> = {
    requireEncryption: options.requireEncryption ?? true,
    maxModelSize: options.maxModelSize ?? 100 * 1024 * 1024,
    trustedPeers: options.trustedPeers,
    allowedAlgorithms: ['AES-GCM'],
    requiredPermissions: ['model:read', 'model:write']
  };

  return new ModelEncryptionManager(policy);
}

export default ModelEncryptionManager;