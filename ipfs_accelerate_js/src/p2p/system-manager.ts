/**
 * P2P ML System Integration Manager
 * Coordinates the model server, P2P network, inference coordinator, and IPFS model storage
 */

import { EventEmitter } from 'events';
import { TransformersModelServer, initializeModelServer, type ModelServerConfig } from '../api_backends/transformers-model-server.js';
import { SimpleP2PManager, type P2PConfig } from './simple-p2p.js';
import { P2PTaskDistributor } from './task-distribution.js';
import { P2PModelInferenceCoordinator, type P2PInferenceRequest, type P2PInferenceResponse } from './model-inference-coordinator.js';
import { IPFSModelStorage, createIPFSModelStorage, type IPFSModelConfig } from '../storage/ipfs-model-storage.js';
import { P2PModelDiscoveryCoordinator, createP2PModelDiscoveryCoordinator, type ModelDiscoveryConfig } from './model-discovery-coordinator.js';
import { ModelEncryptionManager, createSecureModelManager, type SecurityPolicy } from '../security/model-encryption.js';
import { NetworkOptimizationManager, type LoadBalancingConfig, type OptimizationPolicy } from '../security/network-optimization.js';

export interface P2PMLSystemConfig {
  modelServer?: ModelServerConfig;
  p2pNetwork?: Partial<P2PConfig>;
  ipfsStorage?: IPFSModelConfig;
  modelDiscovery?: ModelDiscoveryConfig;
  security?: Partial<SecurityPolicy>;
  networkOptimization?: {
    loadBalancing?: Partial<LoadBalancingConfig>;
    optimization?: Partial<OptimizationPolicy>;
  };
  enableDistributedInference?: boolean;
  enableModelSharing?: boolean;
  enableIPFSStorage?: boolean;
  enableSecurity?: boolean;
  enableNetworkOptimization?: boolean;
  autoStart?: boolean;
}

export interface SystemStatus {
  modelServer: {
    running: boolean;
    loadedModels: string[];
    activeRequests: number;
  };
  p2pNetwork: {
    running: boolean;
    connectedPeers: number;
    localPeerId: string;
  };
  inferenceCoordinator: {
    running: boolean;
    activeInferences: number;
    peerCapabilities: number;
  };
  ipfsStorage: {
    enabled: boolean;
    totalModels: number;
    localModels: number;
    ipfsModels: number;
    storageUsed: number;
  };
  modelDiscovery: {
    enabled: boolean;
    networkModels: number;
    connectedPeers: number;
    lastSyncTime: number;
  };
  security: {
    enabled: boolean;
    encryptionActive: boolean;
    authenticatedPeers: number;
    securityPolicy: SecurityPolicy;
  };
  networkOptimization: {
    enabled: boolean;
    totalPeers: number;
    averageLatency: number;
    reliabilityScore: number;
    overallHealth: string;
  };
}

/**
 * Main integration manager for the P2P ML system with IPFS storage
 */
export class P2PMLSystemManager extends EventEmitter {
  private config: P2PMLSystemConfig;
  private modelServer: TransformersModelServer;
  private p2pManager: SimpleP2PManager;
  private taskDistributor: P2PTaskDistributor;
  private inferenceCoordinator: P2PModelInferenceCoordinator | null = null;
  private ipfsStorage: IPFSModelStorage | null = null;
  private modelDiscoveryCoordinator: P2PModelDiscoveryCoordinator | null = null;
  private securityManager: ModelEncryptionManager | null = null;
  private networkOptimizer: NetworkOptimizationManager | null = null;
  private isRunning: boolean = false;

  constructor(config: P2PMLSystemConfig = {}) {
    super();
    this.config = {
      enableDistributedInference: true,
      enableModelSharing: true,
      enableIPFSStorage: true,
      enableSecurity: true,
      enableNetworkOptimization: true,
      autoStart: false,
      ...config
    };

    // Initialize synchronously, async components will be initialized in start()
    this.initializeSyncComponents();
    this.setupEventListeners();

    if (this.config.autoStart) {
      this.start().catch(console.error);
    }
  }

  /**
   * Initialize synchronous components
   */
  private initializeSyncComponents(): void {
    // Initialize model server
    this.modelServer = initializeModelServer(this.config.modelServer);

    // Initialize P2P network with default configuration
    const p2pConfig: P2PConfig = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ],
      signaling: {
        url: 'wss://swissknife-signaling.herokuapp.com', // Placeholder
        protocol: 'wss'
      },
      enableP2P: true,
      maxPeers: 50,
      ...this.config.p2pNetwork
    };

    this.p2pManager = new SimpleP2PManager(p2pConfig);
    this.taskDistributor = new P2PTaskDistributor(this.p2pManager as any);

    // Initialize inference coordinator if distributed inference is enabled
    if (this.config.enableDistributedInference) {
      this.inferenceCoordinator = new P2PModelInferenceCoordinator(
        this.modelServer,
        this.p2pManager,
        this.taskDistributor
      );
    }
  }

  /**
   * Initialize async components (IPFS storage and model discovery)
   */
  private async initializeAsyncComponents(): Promise<void> {
    // Initialize IPFS storage if enabled
    if (this.config.enableIPFSStorage) {
      try {
        this.ipfsStorage = await createIPFSModelStorage(this.config.ipfsStorage);
        console.log('IPFS Model Storage initialized successfully');
      } catch (error) {
        console.error('Failed to initialize IPFS storage:', error);
        this.config.enableIPFSStorage = false;
      }
    }

    // Initialize model discovery coordinator if model sharing and IPFS are enabled
    if (this.config.enableModelSharing && this.ipfsStorage) {
      try {
        this.modelDiscoveryCoordinator = await createP2PModelDiscoveryCoordinator(
          this.ipfsStorage,
          this.p2pManager,
          this.config.modelDiscovery
        );
        console.log('P2P Model Discovery Coordinator initialized successfully');
      } catch (error) {
        console.error('Failed to initialize model discovery coordinator:', error);
      }
    }
  }

  /**
   * Setup event listeners across components
   */
  private setupEventListeners(): void {
    // Model server events
    this.modelServer.on('server:started', () => {
      this.emit('component:started', { component: 'modelServer' });
    });

    this.modelServer.on('server:stopped', () => {
      this.emit('component:stopped', { component: 'modelServer' });
    });

    this.modelServer.on('model:loaded', (data) => {
      this.emit('model:loaded', data);
    });

    this.modelServer.on('inference:completed', (response) => {
      this.emit('inference:completed', response);
    });

    // P2P network events
    this.p2pManager.on('peer:connected', (peer) => {
      this.emit('peer:connected', peer);
    });

    this.p2pManager.on('peer:disconnected', (peer) => {
      this.emit('peer:disconnected', peer);
    });

    this.p2pManager.on('message:received', (message) => {
      this.emit('message:received', message);
    });

    // Inference coordinator events (if enabled)
    if (this.inferenceCoordinator) {
      this.inferenceCoordinator.on('inference:response', (response) => {
        this.emit('p2p:inference:response', response);
      });

      this.inferenceCoordinator.on('peer:capabilities_updated', (data) => {
        this.emit('peer:capabilities_updated', data);
      });
    }

    // IPFS storage events (if enabled)
    if (this.ipfsStorage) {
      this.ipfsStorage.on('model:stored', (data) => {
        this.emit('ipfs:model:stored', data);
      });

      this.ipfsStorage.on('model:loaded', (data) => {
        this.emit('ipfs:model:loaded', data);
      });

      this.ipfsStorage.on('registry:updated', () => {
        this.emit('ipfs:registry:updated');
      });
    }

    // Model discovery coordinator events (if enabled)
    if (this.modelDiscoveryCoordinator) {
      this.modelDiscoveryCoordinator.on('model:discovered', (data) => {
        this.emit('model:discovered', data);
      });

      this.modelDiscoveryCoordinator.on('model:shared', (data) => {
        this.emit('model:shared', data);
      });

      this.modelDiscoveryCoordinator.on('model:received', (data) => {
        this.emit('model:received', data);
      });

      this.modelDiscoveryCoordinator.on('peer:capabilities:updated', () => {
        this.emit('peer:capabilities:updated');
      });
    }
  }

  /**
   * Start the entire P2P ML system
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('P2P ML system is already running');
      return;
    }

    console.log('Starting P2P ML System...');

    try {
      // Initialize async components first
      await this.initializeAsyncComponents();

      // Start model server
      console.log('Starting model server...');
      await this.modelServer.start();

      // Start P2P network
      console.log('Starting P2P network...');
      await this.p2pManager.start();

      // Load default models
      await this.loadDefaultModels();

      this.isRunning = true;
      this.emit('system:started');
      console.log('P2P ML System started successfully');

    } catch (error) {
      console.error('Failed to start P2P ML system:', error);
      await this.stop(); // Clean up on failure
      throw error;
    }
  }

  /**
   * Stop the entire P2P ML system
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log('Stopping P2P ML System...');

    try {
      // Stop P2P network
      await this.p2pManager.stop();

      // Stop model server
      await this.modelServer.stop();

      this.isRunning = false;
      this.emit('system:stopped');
      console.log('P2P ML System stopped');

    } catch (error) {
      console.error('Error stopping P2P ML system:', error);
      throw error;
    }
  }

  /**
   * Load default models for immediate availability
   */
  private async loadDefaultModels(): Promise<void> {
    console.log('Loading default models...');

    const defaultModels = ['bert-base-uncased', 't5-small'];
    
    for (const modelId of defaultModels) {
      try {
        await this.modelServer.loadModel(modelId);
        console.log(`Loaded default model: ${modelId}`);
      } catch (error) {
        console.warn(`Failed to load default model ${modelId}:`, error);
      }
    }
  }

  /**
   * Submit an inference request (local or distributed)
   */
  async submitInference(
    modelId: string,
    input: string | any[],
    options: {
      maxTokens?: number;
      temperature?: number;
      streaming?: boolean;
      task?: string;
      priority?: 'low' | 'medium' | 'high';
      preferLocal?: boolean;
      requireGPU?: boolean;
    } = {}
  ): Promise<string> {
    if (!this.isRunning) {
      throw new Error('P2P ML system is not running');
    }

    if (this.inferenceCoordinator && !options.preferLocal) {
      // Use distributed inference
      return await this.inferenceCoordinator.submitInferenceRequest(modelId, input, options);
    } else {
      // Use local model server directly
      const requestId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      await this.modelServer.processInference({
        id: requestId,
        modelId,
        input,
        options,
        metadata: { priority: options.priority || 'medium' }
      });

      return requestId;
    }
  }

  /**
   * Load a model into the local model server
   */
  async loadModel(modelId: string): Promise<boolean> {
    return await this.modelServer.loadModel(modelId);
  }

  /**
   * Unload a model from the local model server
   */
  async unloadModel(modelId: string): Promise<boolean> {
    return await this.modelServer.unloadModel(modelId);
  }

  /**
   * Get system status
   */
  async getSystemStatus(): Promise<SystemStatus> {
    const modelServerStatus = this.modelServer.getStatus();
    const connectedPeers = this.p2pManager.getConnectedPeers();
    
    // Get IPFS storage stats
    let ipfsStats = {
      enabled: false,
      totalModels: 0,
      localModels: 0,
      ipfsModels: 0,
      storageUsed: 0
    };

    if (this.ipfsStorage) {
      const stats = await this.ipfsStorage.getStorageStats();
      ipfsStats = {
        enabled: true,
        totalModels: stats.totalModels,
        localModels: stats.localModels,
        ipfsModels: stats.ipfsModels,
        storageUsed: stats.localSize
      };
    }

    // Get model discovery stats
    let discoveryStats = {
      enabled: false,
      networkModels: 0,
      connectedPeers: 0,
      lastSyncTime: 0
    };

    if (this.modelDiscoveryCoordinator) {
      const stats = this.modelDiscoveryCoordinator.getDiscoveryStats();
      discoveryStats = {
        enabled: true,
        networkModels: stats.totalNetworkModels,
        connectedPeers: stats.connectedPeers,
        lastSyncTime: stats.lastSyncTime
      };
    }
    
    return {
      modelServer: {
        running: modelServerStatus.running,
        loadedModels: modelServerStatus.loadedModels,
        activeRequests: modelServerStatus.activeRequests
      },
      p2pNetwork: {
        running: this.isRunning,
        connectedPeers: connectedPeers.length,
        localPeerId: this.p2pManager.getLocalId().id
      },
      inferenceCoordinator: {
        running: this.inferenceCoordinator !== null,
        activeInferences: this.inferenceCoordinator?.getActiveInferenceRequests().length || 0,
        peerCapabilities: this.inferenceCoordinator?.getPeerCapabilities().size || 0
      },
      ipfsStorage: ipfsStats,
      modelDiscovery: discoveryStats
    };
  }

  /**
   * Get available models
   */
  getAvailableModels() {
    return this.modelServer.getAvailableModels();
  }

  /**
   * Get loaded models
   */
  getLoadedModels() {
    return this.modelServer.getLoadedModels();
  }

  /**
   * Get connected peers
   */
  getConnectedPeers() {
    return this.p2pManager.getConnectedPeers();
  }

  /**
   * Get peer capabilities (if inference coordinator is enabled)
   */
  getPeerCapabilities() {
    return this.inferenceCoordinator?.getPeerCapabilities() || new Map();
  }

  /**
   * Broadcast a message to all connected peers
   */
  async broadcastMessage(message: any): Promise<number> {
    return await this.p2pManager.broadcast(message);
  }

  /**
   * Send a message to a specific peer
   */
  async sendMessageToPeer(peerId: string, message: any): Promise<boolean> {
    return await this.p2pManager.sendMessage(peerId, message);
  }

  /**
   * Check if the system is running
   */
  isSystemRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get the model server instance
   */
  getModelServer(): TransformersModelServer {
    return this.modelServer;
  }

  /**
   * Get the P2P manager instance
   */
  getP2PManager(): SimpleP2PManager {
    return this.p2pManager;
  }

  /**
   * Get the inference coordinator instance (if enabled)
   */
  getInferenceCoordinator(): P2PModelInferenceCoordinator | null {
    return this.inferenceCoordinator;
  }

  // === IPFS Model Storage Methods ===

  /**
   * Get IPFS storage instance
   */
  getIPFSStorage(): IPFSModelStorage | null {
    return this.ipfsStorage;
  }

  /**
   * Get model discovery coordinator instance
   */
  getModelDiscoveryCoordinator(): P2PModelDiscoveryCoordinator | null {
    return this.modelDiscoveryCoordinator;
  }

  /**
   * Store a model on IPFS
   */
  async storeModelOnIPFS(
    modelId: string,
    modelData: ArrayBuffer,
    metadata: any = {}
  ): Promise<string | null> {
    if (!this.ipfsStorage) {
      throw new Error('IPFS storage is not enabled');
    }

    return await this.ipfsStorage.storeModelOnIPFS(modelId, modelData, metadata);
  }

  /**
   * Load a model from IPFS or network
   */
  async loadModelFromIPFS(modelId: string): Promise<ArrayBuffer | null> {
    if (!this.ipfsStorage) {
      throw new Error('IPFS storage is not enabled');
    }

    return await this.ipfsStorage.loadModelFromIPFS(modelId);
  }

  /**
   * Get all models from IPFS registry
   */
  getIPFSModels(): any[] {
    if (!this.ipfsStorage) {
      return [];
    }

    return this.ipfsStorage.getAvailableModels();
  }

  /**
   * Search IPFS models by criteria
   */
  searchIPFSModels(criteria: any): any[] {
    if (!this.ipfsStorage) {
      return [];
    }

    return this.ipfsStorage.searchModels(criteria);
  }

  /**
   * Get network-wide available models
   */
  getNetworkModels(): any[] {
    if (!this.modelDiscoveryCoordinator) {
      return [];
    }

    return this.modelDiscoveryCoordinator.getNetworkModels();
  }

  /**
   * Get peer capabilities for model discovery
   */
  getModelDiscoveryPeerCapabilities(): any[] {
    if (!this.modelDiscoveryCoordinator) {
      return [];
    }

    return this.modelDiscoveryCoordinator.getPeerCapabilities();
  }

  /**
   * Request a model from the network
   */
  async requestModelFromNetwork(modelId: string): Promise<ArrayBuffer | null> {
    if (!this.modelDiscoveryCoordinator) {
      throw new Error('Model discovery coordinator is not enabled');
    }

    return await this.modelDiscoveryCoordinator.requestModelFromNetwork(modelId);
  }

  /**
   * Get IPFS storage statistics
   */
  async getIPFSStorageStats(): Promise<any> {
    if (!this.ipfsStorage) {
      return {
        totalModels: 0,
        localModels: 0,
        ipfsModels: 0,
        totalSize: 0,
        localSize: 0
      };
    }

    return await this.ipfsStorage.getStorageStats();
  }

  /**
   * Get model discovery statistics
   */
  getModelDiscoveryStats(): any {
    if (!this.modelDiscoveryCoordinator) {
      return {
        connectedPeers: 0,
        totalNetworkModels: 0,
        localModels: 0,
        sharedModels: 0,
        lastSyncTime: 0
      };
    }

    return this.modelDiscoveryCoordinator.getDiscoveryStats();
  }
}

/**
 * Global instance for easy access
 */
export let globalP2PMLSystem: P2PMLSystemManager | null = null;

/**
 * Initialize the global P2P ML system
 */
export function initializeP2PMLSystem(config?: P2PMLSystemConfig): P2PMLSystemManager {
  if (!globalP2PMLSystem) {
    globalP2PMLSystem = new P2PMLSystemManager(config);
  }
  return globalP2PMLSystem;
}

/**
 * Get the global P2P ML system instance
 */
export function getP2PMLSystem(): P2PMLSystemManager | null {
  return globalP2PMLSystem;
}