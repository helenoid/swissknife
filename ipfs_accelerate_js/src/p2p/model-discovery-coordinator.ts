/**
 * P2P Model Discovery and Sharing Coordinator
 * Manages distributed model discovery and sharing across P2P network with IPFS integration
 */

import { EventEmitter } from 'events';
import type { IPFSModelStorage, IPFSModelMetadata, ModelRegistryEntry } from '../storage/ipfs-model-storage.js';
import type { SimpleP2PManager, PeerInfo } from './simple-p2p.js';

export interface P2PModelMessage {
  type: 'model:registry' | 'model:request' | 'model:response' | 'model:announce' | 'model:remove';
  payload: any;
  timestamp: number;
  senderId: string;
}

export interface ModelDiscoveryConfig {
  announceInterval?: number;
  maxPeersPerModel?: number;
  enableAutoDownload?: boolean;
  priorityTags?: string[];
  modelSharingEnabled?: boolean;
}

export interface PeerModelCapabilities {
  peerId: string;
  availableModels: IPFSModelMetadata[];
  hardwareCapabilities: {
    gpu: boolean;
    webgpu: boolean;
    webnn: boolean;
    totalRAM: number;
  };
  bandwidth: {
    upload: number;
    download: number;
  };
  lastSeen: number;
}

/**
 * Coordinates model discovery and sharing across P2P network
 */
export class P2PModelDiscoveryCoordinator extends EventEmitter {
  private config: ModelDiscoveryConfig;
  private ipfsStorage: IPFSModelStorage;
  private p2pManager: SimpleP2PManager;
  private peerCapabilities: Map<string, PeerModelCapabilities> = new Map();
  private modelAnnounceInterval: NodeJS.Timeout | null = null;
  private pendingModelRequests: Map<string, {
    modelId: string;
    requesterId: string;
    timestamp: number;
    resolve: (data: ArrayBuffer) => void;
    reject: (error: Error) => void;
  }> = new Map();
  private initialized: boolean = false;

  constructor(
    ipfsStorage: IPFSModelStorage,
    p2pManager: SimpleP2PManager,
    config: ModelDiscoveryConfig = {}
  ) {
    super();
    
    this.ipfsStorage = ipfsStorage;
    this.p2pManager = p2pManager;
    this.config = {
      announceInterval: 30000, // 30 seconds
      maxPeersPerModel: 5,
      enableAutoDownload: false,
      priorityTags: ['popular', 'verified', 'fast'],
      modelSharingEnabled: true,
      ...config
    };
  }

  /**
   * Initialize the model discovery coordinator
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Setup P2P message handlers
      this.setupP2PMessageHandlers();

      // Start periodic model announcements
      this.startModelAnnouncements();

      // Setup IPFS storage event handlers
      this.setupIPFSEventHandlers();

      this.initialized = true;
      this.emit('initialized');
      
      console.log('P2P Model Discovery Coordinator initialized');
      
    } catch (error) {
      console.error('Failed to initialize P2P Model Discovery Coordinator:', error);
      throw error;
    }
  }

  /**
   * Setup P2P network message handlers
   */
  private setupP2PMessageHandlers(): void {
    this.p2pManager.on('peer:message', (data) => {
      this.handleP2PMessage(data);
    });

    this.p2pManager.on('peer:connected', (peer) => {
      // Request model registry from new peer
      this.requestPeerModelRegistry(peer.id.id);
    });

    this.p2pManager.on('peer:disconnected', (peer) => {
      // Remove peer from capabilities map
      this.peerCapabilities.delete(peer.id.id);
      this.emit('peer:capabilities:updated');
    });
  }

  /**
   * Setup IPFS storage event handlers
   */
  private setupIPFSEventHandlers(): void {
    this.ipfsStorage.on('model:stored', (event) => {
      // Announce new model to network
      this.announceModelToNetwork(event.metadata);
    });

    this.ipfsStorage.on('registry:updated', () => {
      // Broadcast updated registry to peers
      this.broadcastModelRegistry();
    });

    this.ipfsStorage.on('sync:requested', () => {
      // Request sync from all peers
      this.requestSyncFromAllPeers();
    });
  }

  /**
   * Handle incoming P2P messages
   */
  private async handleP2PMessage(data: any): Promise<void> {
    try {
      const message = data.message as P2PModelMessage;
      const senderId = data.senderId;

      switch (message.type) {
        case 'model:registry':
          await this.handleModelRegistryMessage(senderId, message.payload);
          break;

        case 'model:request':
          await this.handleModelRequestMessage(senderId, message.payload);
          break;

        case 'model:response':
          await this.handleModelResponseMessage(senderId, message.payload);
          break;

        case 'model:announce':
          await this.handleModelAnnounceMessage(senderId, message.payload);
          break;

        case 'model:remove':
          await this.handleModelRemoveMessage(senderId, message.payload);
          break;

        default:
          console.warn('Unknown P2P model message type:', message.type);
      }
      
    } catch (error) {
      console.error('Error handling P2P message:', error);
    }
  }

  /**
   * Handle model registry message from peer
   */
  private async handleModelRegistryMessage(senderId: string, payload: any): Promise<void> {
    const { models, capabilities } = payload;

    // Update peer capabilities
    this.peerCapabilities.set(senderId, {
      peerId: senderId,
      availableModels: models || [],
      hardwareCapabilities: capabilities?.hardware || {
        gpu: false,
        webgpu: false,
        webnn: false,
        totalRAM: 0
      },
      bandwidth: capabilities?.bandwidth || { upload: 0, download: 0 },
      lastSeen: Date.now()
    });

    // Sync with IPFS storage
    const peerModelMap = new Map([[senderId, models || []]]);
    await this.ipfsStorage.syncWithPeers(peerModelMap);

    this.emit('peer:capabilities:updated');
    
    console.log(`Updated model registry from peer ${senderId}: ${models?.length || 0} models`);
  }

  /**
   * Handle model request from peer
   */
  private async handleModelRequestMessage(senderId: string, payload: any): Promise<void> {
    if (!this.config.modelSharingEnabled) return;

    const { modelId, requestId } = payload;
    
    try {
      // Check if we have the model locally
      const modelData = await this.ipfsStorage.loadModelFromIPFS(modelId);
      
      if (modelData) {
        // Send model data to requesting peer
        const response: P2PModelMessage = {
          type: 'model:response',
          payload: {
            requestId,
            modelId,
            success: true,
            data: Array.from(new Uint8Array(modelData)) // Convert to transferable format
          },
          timestamp: Date.now(),
          senderId: this.p2pManager.getLocalPeerId()
        };

        this.p2pManager.sendMessage(senderId, response);
        
        console.log(`Sent model ${modelId} to peer ${senderId}`);
        this.emit('model:shared', { modelId, peerId: senderId });
        
      } else {
        // Model not available
        const response: P2PModelMessage = {
          type: 'model:response',
          payload: {
            requestId,
            modelId,
            success: false,
            error: 'Model not available'
          },
          timestamp: Date.now(),
          senderId: this.p2pManager.getLocalPeerId()
        };

        this.p2pManager.sendMessage(senderId, response);
      }
      
    } catch (error) {
      console.error(`Failed to handle model request for ${modelId}:`, error);
      
      // Send error response
      const response: P2PModelMessage = {
        type: 'model:response',
        payload: {
          requestId,
          modelId,
          success: false,
          error: error.message
        },
        timestamp: Date.now(),
        senderId: this.p2pManager.getLocalPeerId()
      };

      this.p2pManager.sendMessage(senderId, response);
    }
  }

  /**
   * Handle model response from peer
   */
  private async handleModelResponseMessage(senderId: string, payload: any): Promise<void> {
    const { requestId, modelId, success, data, error } = payload;
    
    const pendingRequest = this.pendingModelRequests.get(requestId);
    if (!pendingRequest) return;

    this.pendingModelRequests.delete(requestId);

    if (success && data) {
      try {
        // Convert received data back to ArrayBuffer
        const modelData = new Uint8Array(data).buffer;
        
        // Store in local cache
        const model = this.ipfsStorage.getModel(modelId);
        if (model) {
          // This would store locally and emit events
          console.log(`Received model ${modelId} from peer ${senderId}`);
          this.emit('model:received', { modelId, peerId: senderId, size: modelData.byteLength });
        }
        
        pendingRequest.resolve(modelData);
        
      } catch (err) {
        console.error('Failed to process received model data:', err);
        pendingRequest.reject(new Error('Failed to process model data'));
      }
    } else {
      pendingRequest.reject(new Error(error || 'Model request failed'));
    }
  }

  /**
   * Handle model announcement from peer
   */
  private async handleModelAnnounceMessage(senderId: string, payload: any): Promise<void> {
    const modelMetadata = payload as IPFSModelMetadata;
    
    // Update peer's available models
    const peerCapabilities = this.peerCapabilities.get(senderId);
    if (peerCapabilities) {
      const existingIndex = peerCapabilities.availableModels.findIndex(m => m.modelId === modelMetadata.modelId);
      if (existingIndex >= 0) {
        peerCapabilities.availableModels[existingIndex] = modelMetadata;
      } else {
        peerCapabilities.availableModels.push(modelMetadata);
      }
      peerCapabilities.lastSeen = Date.now();
    }

    // Sync with IPFS storage
    const peerModelMap = new Map([[senderId, [modelMetadata]]]);
    await this.ipfsStorage.syncWithPeers(peerModelMap);

    this.emit('model:discovered', { modelId: modelMetadata.modelId, peerId: senderId, metadata: modelMetadata });
    
    // Auto-download if enabled and matches priority tags
    if (this.config.enableAutoDownload && this.shouldAutoDownload(modelMetadata)) {
      await this.requestModelFromNetwork(modelMetadata.modelId);
    }
  }

  /**
   * Handle model removal announcement from peer
   */
  private async handleModelRemoveMessage(senderId: string, payload: any): Promise<void> {
    const { modelId } = payload;
    
    const peerCapabilities = this.peerCapabilities.get(senderId);
    if (peerCapabilities) {
      peerCapabilities.availableModels = peerCapabilities.availableModels.filter(m => m.modelId !== modelId);
    }

    this.emit('model:removed', { modelId, peerId: senderId });
  }

  /**
   * Request model registry from specific peer
   */
  private requestPeerModelRegistry(peerId: string): void {
    const message: P2PModelMessage = {
      type: 'model:registry',
      payload: {
        action: 'request'
      },
      timestamp: Date.now(),
      senderId: this.p2pManager.getLocalPeerId()
    };

    this.p2pManager.sendMessage(peerId, message);
  }

  /**
   * Broadcast model registry to all peers
   */
  private broadcastModelRegistry(): void {
    const localModels = this.ipfsStorage.getAvailableModels()
      .filter(entry => entry.availability.local)
      .map(entry => entry.metadata);

    const message: P2PModelMessage = {
      type: 'model:registry',
      payload: {
        models: localModels,
        capabilities: {
          hardware: this.getLocalHardwareCapabilities(),
          bandwidth: this.getLocalBandwidthCapabilities()
        }
      },
      timestamp: Date.now(),
      senderId: this.p2pManager.getLocalPeerId()
    };

    this.p2pManager.broadcastMessage(message);
  }

  /**
   * Announce new model to network
   */
  private announceModelToNetwork(metadata: IPFSModelMetadata): void {
    const message: P2PModelMessage = {
      type: 'model:announce',
      payload: metadata,
      timestamp: Date.now(),
      senderId: this.p2pManager.getLocalPeerId()
    };

    this.p2pManager.broadcastMessage(message);
    
    console.log(`Announced model ${metadata.modelId} to network`);
  }

  /**
   * Request model from network peers
   */
  async requestModelFromNetwork(modelId: string): Promise<ArrayBuffer> {
    const availablePeers = this.findPeersWithModel(modelId);
    
    if (availablePeers.length === 0) {
      throw new Error(`No peers have model ${modelId}`);
    }

    // Select best peer based on capabilities and bandwidth
    const selectedPeer = this.selectBestPeerForDownload(availablePeers);
    
    return new Promise((resolve, reject) => {
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Store pending request
      this.pendingModelRequests.set(requestId, {
        modelId,
        requesterId: selectedPeer.peerId,
        timestamp: Date.now(),
        resolve,
        reject
      });

      // Send request
      const message: P2PModelMessage = {
        type: 'model:request',
        payload: {
          modelId,
          requestId
        },
        timestamp: Date.now(),
        senderId: this.p2pManager.getLocalPeerId()
      };

      this.p2pManager.sendMessage(selectedPeer.peerId, message);
      
      // Set timeout
      setTimeout(() => {
        if (this.pendingModelRequests.has(requestId)) {
          this.pendingModelRequests.delete(requestId);
          reject(new Error('Model request timeout'));
        }
      }, 30000); // 30 second timeout
    });
  }

  /**
   * Find peers that have a specific model
   */
  private findPeersWithModel(modelId: string): PeerModelCapabilities[] {
    return Array.from(this.peerCapabilities.values())
      .filter(peer => peer.availableModels.some(model => model.modelId === modelId));
  }

  /**
   * Select best peer for model download
   */
  private selectBestPeerForDownload(peers: PeerModelCapabilities[]): PeerModelCapabilities {
    // Score peers based on bandwidth, hardware capabilities, and recency
    return peers.reduce((best, current) => {
      const currentScore = this.calculatePeerScore(current);
      const bestScore = this.calculatePeerScore(best);
      return currentScore > bestScore ? current : best;
    });
  }

  /**
   * Calculate peer score for selection
   */
  private calculatePeerScore(peer: PeerModelCapabilities): number {
    let score = 0;
    
    // Bandwidth score (40% weight)
    score += (peer.bandwidth.upload / 1000000) * 0.4; // Convert to Mbps
    
    // Hardware capabilities score (30% weight)
    if (peer.hardwareCapabilities.gpu) score += 10 * 0.3;
    if (peer.hardwareCapabilities.webgpu) score += 8 * 0.3;
    if (peer.hardwareCapabilities.webnn) score += 6 * 0.3;
    
    // Recency score (20% weight)
    const hoursSinceLastSeen = (Date.now() - peer.lastSeen) / (1000 * 60 * 60);
    score += Math.max(0, 24 - hoursSinceLastSeen) * 0.2;
    
    // Model count score (10% weight) - peers with more models might be more reliable
    score += Math.min(peer.availableModels.length / 10, 1) * 0.1;
    
    return score;
  }

  /**
   * Check if model should be auto-downloaded
   */
  private shouldAutoDownload(metadata: IPFSModelMetadata): boolean {
    return this.config.priorityTags?.some(tag => metadata.tags?.includes(tag)) || false;
  }

  /**
   * Start periodic model announcements
   */
  private startModelAnnouncements(): void {
    if (this.modelAnnounceInterval) return;

    this.modelAnnounceInterval = setInterval(() => {
      this.broadcastModelRegistry();
    }, this.config.announceInterval);
  }

  /**
   * Stop model announcements
   */
  private stopModelAnnouncements(): void {
    if (this.modelAnnounceInterval) {
      clearInterval(this.modelAnnounceInterval);
      this.modelAnnounceInterval = null;
    }
  }

  /**
   * Request sync from all connected peers
   */
  private requestSyncFromAllPeers(): void {
    const connectedPeers = this.p2pManager.getConnectedPeers();
    connectedPeers.forEach(peer => {
      this.requestPeerModelRegistry(peer.id.id);
    });
  }

  /**
   * Get local hardware capabilities
   */
  private getLocalHardwareCapabilities(): any {
    // This would detect actual hardware capabilities
    return {
      gpu: false, // Would detect GPU
      webgpu: typeof (navigator as any).gpu !== 'undefined',
      webnn: typeof (navigator as any).ml !== 'undefined',
      totalRAM: (navigator as any).deviceMemory ? (navigator as any).deviceMemory * 1024 : 4096
    };
  }

  /**
   * Get local bandwidth capabilities
   */
  private getLocalBandwidthCapabilities(): any {
    // This would measure actual bandwidth
    return {
      upload: 1000000, // 1 Mbps default
      download: 10000000 // 10 Mbps default
    };
  }

  /**
   * Get all peer capabilities
   */
  getPeerCapabilities(): PeerModelCapabilities[] {
    return Array.from(this.peerCapabilities.values());
  }

  /**
   * Get models available across network
   */
  getNetworkModels(): { modelId: string; metadata: IPFSModelMetadata; availablePeers: string[] }[] {
    const networkModels = new Map<string, { metadata: IPFSModelMetadata; peers: string[] }>();

    for (const peer of this.peerCapabilities.values()) {
      for (const model of peer.availableModels) {
        if (networkModels.has(model.modelId)) {
          networkModels.get(model.modelId)!.peers.push(peer.peerId);
        } else {
          networkModels.set(model.modelId, {
            metadata: model,
            peers: [peer.peerId]
          });
        }
      }
    }

    return Array.from(networkModels.entries()).map(([modelId, data]) => ({
      modelId,
      metadata: data.metadata,
      availablePeers: data.peers
    }));
  }

  /**
   * Get discovery statistics
   */
  getDiscoveryStats(): {
    connectedPeers: number;
    totalNetworkModels: number;
    localModels: number;
    sharedModels: number;
    lastSyncTime: number;
  } {
    const networkModels = this.getNetworkModels();
    const localModels = this.ipfsStorage.getAvailableModels().filter(m => m.availability.local);
    
    return {
      connectedPeers: this.peerCapabilities.size,
      totalNetworkModels: networkModels.length,
      localModels: localModels.length,
      sharedModels: localModels.filter(m => m.availability.peers.length > 0).length,
      lastSyncTime: Math.max(...Array.from(this.peerCapabilities.values()).map(p => p.lastSeen), 0)
    };
  }

  /**
   * Cleanup and dispose
   */
  dispose(): void {
    this.stopModelAnnouncements();
    this.peerCapabilities.clear();
    this.pendingModelRequests.clear();
    this.initialized = false;
    this.removeAllListeners();
  }
}

/**
 * Create and initialize P2P model discovery coordinator
 */
export async function createP2PModelDiscoveryCoordinator(
  ipfsStorage: IPFSModelStorage,
  p2pManager: SimpleP2PManager,
  config: ModelDiscoveryConfig = {}
): Promise<P2PModelDiscoveryCoordinator> {
  const coordinator = new P2PModelDiscoveryCoordinator(ipfsStorage, p2pManager, config);
  await coordinator.initialize();
  return coordinator;
}