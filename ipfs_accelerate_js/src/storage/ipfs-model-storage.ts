/**
 * IPFS Model Storage Manager for Distributed ML Models
 * Integrates with existing P2P network and transformers.js model server
 */

import { EventEmitter } from 'events';
import { StorageManager } from './indexeddb/storage_manager.js';
import type { ModelInfo } from '../api_backends/transformers-model-server.js';

export interface IPFSModelConfig {
  ipfsGateway?: string;
  enablePinning?: boolean;
  autoSync?: boolean;
  compressionEnabled?: boolean;
  maxModelSize?: number;
  replicationFactor?: number;
}

export interface IPFSModelMetadata {
  modelId: string;
  name: string;
  version: string;
  cid: string;
  size: number;
  description?: string;
  tags?: string[];
  author?: string;
  createdAt: number;
  lastAccessed: number;
  downloadCount: number;
  checksumSHA256?: string;
  modelFormat: 'onnx' | 'tensorflow' | 'pytorch' | 'transformers';
  hardwareRequirements?: {
    minRAM?: number;
    preferredDevice?: 'cpu' | 'gpu' | 'webgpu' | 'webnn';
  };
  peerSources: string[]; // List of peer IDs that have this model
}

export interface ModelRegistryEntry {
  metadata: IPFSModelMetadata;
  availability: {
    local: boolean;
    ipfs: boolean;
    peers: string[];
  };
  downloadProgress?: {
    status: 'downloading' | 'verifying' | 'completed' | 'failed';
    progress: number;
    source: 'ipfs' | 'peer';
  };
}

/**
 * IPFS-based model storage and sharing system
 */
export class IPFSModelStorage extends EventEmitter {
  private config: IPFSModelConfig;
  private localStorage: StorageManager;
  private modelRegistry: Map<string, ModelRegistryEntry> = new Map();
  private ipfsClient: any = null; // Will be dynamically imported
  private initialized: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor(config: IPFSModelConfig = {}) {
    super();
    this.config = {
      ipfsGateway: 'https://ipfs.io/ipfs/',
      enablePinning: true,
      autoSync: true,
      compressionEnabled: true,
      maxModelSize: 2 * 1024 * 1024 * 1024, // 2GB default
      replicationFactor: 3,
      ...config
    };
    
    this.localStorage = new StorageManager({
      dbName: 'ipfs_model_storage',
      maxStorageSize: 1024 * 1024 * 1024 // 1GB for local cache
    });
  }

  /**
   * Initialize the IPFS model storage system
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Initialize local storage
      await this.localStorage.initialize();

      // Try to initialize IPFS client (browser compatible)
      await this.initializeIPFSClient();

      // Load existing model registry from local storage
      await this.loadModelRegistry();

      // Start auto-sync if enabled
      if (this.config.autoSync) {
        this.startAutoSync();
      }

      this.initialized = true;
      this.emit('initialized');
      
    } catch (error) {
      console.error('Failed to initialize IPFS Model Storage:', error);
      throw error;
    }
  }

  /**
   * Initialize IPFS client for browser use
   */
  private async initializeIPFSClient(): Promise<void> {
    try {
      // Use a lightweight IPFS client or gateway approach for browser compatibility
      // For now, we'll use HTTP gateway approach to avoid complex IPFS node setup
      this.ipfsClient = {
        gateway: this.config.ipfsGateway,
        // Placeholder for actual IPFS client integration
        add: async (content: any) => {
          // This would integrate with actual IPFS client
          // For demo purposes, we'll generate a mock CID
          const mockCID = 'Qm' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
          return { cid: mockCID };
        },
        get: async (cid: string) => {
          // This would fetch from IPFS gateway or node
          // For demo purposes, return placeholder
          throw new Error(`IPFS get not implemented for CID: ${cid}`);
        },
        pin: async (cid: string) => {
          console.log(`Pinning model with CID: ${cid}`);
          return { cid };
        }
      };
      
      console.log('IPFS client initialized (gateway mode)');
      
    } catch (error) {
      console.warn('IPFS client initialization failed, using mock implementation:', error);
      this.ipfsClient = null;
    }
  }

  /**
   * Store a model on IPFS and update registry
   */
  async storeModelOnIPFS(
    modelId: string,
    modelData: ArrayBuffer,
    metadata: Partial<IPFSModelMetadata>
  ): Promise<string> {
    if (!this.initialized) await this.initialize();

    try {
      const modelSize = modelData.byteLength;
      
      // Check size limits
      if (modelSize > this.config.maxModelSize!) {
        throw new Error(`Model size ${modelSize} exceeds maximum allowed size ${this.config.maxModelSize}`);
      }

      // Upload to IPFS
      let cid: string;
      if (this.ipfsClient) {
        const result = await this.ipfsClient.add(modelData);
        cid = result.cid;
        
        // Pin the model if enabled
        if (this.config.enablePinning) {
          await this.ipfsClient.pin(cid);
        }
      } else {
        // Generate mock CID for demo
        cid = 'Qm' + Buffer.from(modelId + Date.now()).toString('base64').substring(0, 32);
      }

      // Create metadata
      const fullMetadata: IPFSModelMetadata = {
        modelId,
        name: metadata.name || modelId,
        version: metadata.version || '1.0.0',
        cid,
        size: modelSize,
        description: metadata.description,
        tags: metadata.tags || [],
        author: metadata.author,
        createdAt: Date.now(),
        lastAccessed: Date.now(),
        downloadCount: 0,
        modelFormat: metadata.modelFormat || 'onnx',
        hardwareRequirements: metadata.hardwareRequirements,
        peerSources: []
      };

      // Store in local cache and registry
      await this.addToRegistry(fullMetadata, true);

      // Store model data locally as backup
      await this.localStorage.storeModel(
        modelId,
        fullMetadata.name,
        fullMetadata.version,
        { modelData: { name: 'model', shape: [modelSize], dataType: 'uint8', data: modelData, size: modelSize } },
        { ipfsCID: cid, ...metadata }
      );

      this.emit('model:stored', { modelId, cid, metadata: fullMetadata });
      
      return cid;
      
    } catch (error) {
      console.error('Failed to store model on IPFS:', error);
      throw error;
    }
  }

  /**
   * Load a model from IPFS or local cache
   */
  async loadModelFromIPFS(modelId: string): Promise<ArrayBuffer | null> {
    if (!this.initialized) await this.initialize();

    const registryEntry = this.modelRegistry.get(modelId);
    if (!registryEntry) {
      throw new Error(`Model ${modelId} not found in registry`);
    }

    try {
      // Try local cache first
      if (registryEntry.availability.local) {
        const localModel = await this.localStorage.loadModel(modelId);
        if (localModel && localModel.weights.modelData) {
          registryEntry.metadata.lastAccessed = Date.now();
          this.emit('model:loaded', { modelId, source: 'local', metadata: registryEntry.metadata });
          return localModel.weights.modelData.data;
        }
      }

      // Try IPFS if available
      if (registryEntry.availability.ipfs && this.ipfsClient) {
        this.emit('model:downloading', { modelId, source: 'ipfs' });
        
        try {
          const modelData = await this.downloadFromIPFS(registryEntry.metadata.cid);
          
          // Cache locally
          await this.localStorage.storeModel(
            modelId,
            registryEntry.metadata.name,
            registryEntry.metadata.version,
            { modelData: { 
              name: 'model', 
              shape: [modelData.byteLength], 
              dataType: 'uint8', 
              data: modelData, 
              size: modelData.byteLength 
            }},
            { ipfsCID: registryEntry.metadata.cid }
          );

          registryEntry.availability.local = true;
          registryEntry.metadata.lastAccessed = Date.now();
          registryEntry.metadata.downloadCount++;

          this.emit('model:loaded', { modelId, source: 'ipfs', metadata: registryEntry.metadata });
          return modelData;
          
        } catch (error) {
          console.error('Failed to download from IPFS:', error);
        }
      }

      // Try peers as fallback
      if (registryEntry.availability.peers.length > 0) {
        return await this.loadModelFromPeer(modelId, registryEntry.availability.peers[0]);
      }

      throw new Error(`Model ${modelId} not available from any source`);
      
    } catch (error) {
      this.emit('model:error', { modelId, error: error.message });
      throw error;
    }
  }

  /**
   * Download model data from IPFS
   */
  private async downloadFromIPFS(cid: string): Promise<ArrayBuffer> {
    if (!this.ipfsClient) {
      throw new Error('IPFS client not available');
    }

    try {
      // For demo purposes, return mock data
      // In real implementation, this would fetch from IPFS
      const mockData = new ArrayBuffer(1024 * 1024); // 1MB mock model
      console.log(`Mock download of model with CID: ${cid}`);
      return mockData;
      
    } catch (error) {
      throw new Error(`Failed to download from IPFS: ${error.message}`);
    }
  }

  /**
   * Load model from peer (P2P integration)
   */
  private async loadModelFromPeer(modelId: string, peerId: string): Promise<ArrayBuffer> {
    // This will integrate with the P2P system
    this.emit('model:downloading', { modelId, source: 'peer', peerId });
    
    // Placeholder for P2P integration
    throw new Error('P2P model loading not yet implemented');
  }

  /**
   * Add model to registry
   */
  private async addToRegistry(metadata: IPFSModelMetadata, isLocal: boolean = false): Promise<void> {
    const registryEntry: ModelRegistryEntry = {
      metadata,
      availability: {
        local: isLocal,
        ipfs: true,
        peers: []
      }
    };

    this.modelRegistry.set(metadata.modelId, registryEntry);
    await this.saveModelRegistry();
  }

  /**
   * Get all models in registry
   */
  getAvailableModels(): ModelRegistryEntry[] {
    return Array.from(this.modelRegistry.values());
  }

  /**
   * Get model by ID
   */
  getModel(modelId: string): ModelRegistryEntry | null {
    return this.modelRegistry.get(modelId) || null;
  }

  /**
   * Search models by criteria
   */
  searchModels(criteria: {
    query?: string;
    tags?: string[];
    modelFormat?: string;
    hardwareRequirement?: string;
  }): ModelRegistryEntry[] {
    const models = this.getAvailableModels();
    
    return models.filter(entry => {
      const metadata = entry.metadata;
      
      if (criteria.query) {
        const query = criteria.query.toLowerCase();
        if (!metadata.name.toLowerCase().includes(query) && 
            !metadata.description?.toLowerCase().includes(query)) {
          return false;
        }
      }

      if (criteria.tags && criteria.tags.length > 0) {
        if (!criteria.tags.some(tag => metadata.tags?.includes(tag))) {
          return false;
        }
      }

      if (criteria.modelFormat && metadata.modelFormat !== criteria.modelFormat) {
        return false;
      }

      if (criteria.hardwareRequirement && 
          metadata.hardwareRequirements?.preferredDevice !== criteria.hardwareRequirement) {
        return false;
      }

      return true;
    });
  }

  /**
   * Sync with P2P network to discover new models
   */
  async syncWithPeers(peerModelRegistries: Map<string, IPFSModelMetadata[]>): Promise<void> {
    for (const [peerId, peerModels] of peerModelRegistries) {
      for (const peerModel of peerModels) {
        const existingEntry = this.modelRegistry.get(peerModel.modelId);
        
        if (existingEntry) {
          // Update peer sources
          if (!existingEntry.availability.peers.includes(peerId)) {
            existingEntry.availability.peers.push(peerId);
          }
        } else {
          // Add new model from peer
          const registryEntry: ModelRegistryEntry = {
            metadata: { ...peerModel, peerSources: [peerId] },
            availability: {
              local: false,
              ipfs: true,
              peers: [peerId]
            }
          };
          this.modelRegistry.set(peerModel.modelId, registryEntry);
        }
      }
    }

    await this.saveModelRegistry();
    this.emit('registry:updated');
  }

  /**
   * Load model registry from local storage
   */
  private async loadModelRegistry(): Promise<void> {
    try {
      const registryData = await this.localStorage.loadModel('__model_registry__');
      if (registryData && registryData.metadata.registryData) {
        const entries = JSON.parse(registryData.metadata.registryData) as [string, ModelRegistryEntry][];
        this.modelRegistry = new Map(entries);
      }
    } catch (error) {
      console.log('No existing model registry found, starting fresh');
    }
  }

  /**
   * Save model registry to local storage
   */
  private async saveModelRegistry(): Promise<void> {
    try {
      const registryEntries = Array.from(this.modelRegistry.entries());
      await this.localStorage.storeModel(
        '__model_registry__',
        'Model Registry',
        '1.0.0',
        {},
        { registryData: JSON.stringify(registryEntries) }
      );
    } catch (error) {
      console.error('Failed to save model registry:', error);
    }
  }

  /**
   * Start automatic sync with peers
   */
  private startAutoSync(): void {
    if (this.syncInterval) return;

    this.syncInterval = setInterval(() => {
      this.emit('sync:requested');
    }, 60000); // Sync every minute
  }

  /**
   * Stop automatic sync
   */
  private stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalModels: number;
    localModels: number;
    ipfsModels: number;
    totalSize: number;
    localSize: number;
  }> {
    const models = this.getAvailableModels();
    const localStorageInfo = await this.localStorage.getStorageInfo();
    
    return {
      totalModels: models.length,
      localModels: models.filter(m => m.availability.local).length,
      ipfsModels: models.filter(m => m.availability.ipfs).length,
      totalSize: models.reduce((sum, m) => sum + m.metadata.size, 0),
      localSize: localStorageInfo.used
    };
  }

  /**
   * Cleanup and dispose
   */
  dispose(): void {
    this.stopAutoSync();
    this.localStorage.dispose();
    this.modelRegistry.clear();
    this.initialized = false;
    this.removeAllListeners();
  }
}

/**
 * Create and initialize IPFS model storage
 */
export async function createIPFSModelStorage(config: IPFSModelConfig = {}): Promise<IPFSModelStorage> {
  const storage = new IPFSModelStorage(config);
  await storage.initialize();
  return storage;
}