/**
 * P2P ML System Bridge for Web Integration with IPFS Storage
 * Enhanced with distributed model storage and sharing capabilities
 */

(function() {
  'use strict';

  // Global P2P ML System reference
  let p2pMLSystem = null;
  let ipfsStorage = null;
  let modelDiscoveryCoordinator = null;

  /**
   * Initialize P2P ML System with IPFS integration
   */
  window.initializeP2PMLSystem = async function(config = {}) {
    try {
      // Import the P2P ML System dynamically
      if (typeof window.P2PMLSystemManager === 'undefined') {
        console.warn('P2PMLSystemManager not available, using mock implementation');
        return createMockP2PMLSystem(config);
      }

      const systemConfig = {
        enableDistributedInference: true,
        enableModelSharing: true,
        enableIPFSStorage: true,
        autoStart: false,
        modelServer: {
          maxConcurrentTasks: 4,
          enableWebSocket: true,
          enableP2PIntegration: true,
          ...config.modelServer
        },
        p2pNetwork: {
          maxPeers: 50,
          ...config.p2pNetwork
        },
        ipfsStorage: {
          enablePinning: true,
          autoSync: true,
          compressionEnabled: true,
          maxModelSize: 2 * 1024 * 1024 * 1024, // 2GB
          ...config.ipfsStorage
        },
        modelDiscovery: {
          announceInterval: 30000,
          maxPeersPerModel: 5,
          enableAutoDownload: false,
          priorityTags: ['verified', 'popular'],
          modelSharingEnabled: true,
          ...config.modelDiscovery
        },
        ...config
      };

      p2pMLSystem = new window.P2PMLSystemManager(systemConfig);
      
      // Get references to subsystems
      ipfsStorage = p2pMLSystem.getIPFSStorage();
      modelDiscoveryCoordinator = p2pMLSystem.getModelDiscoveryCoordinator();

      // Setup enhanced event handlers
      setupEnhancedEventHandlers(p2pMLSystem);

      console.log('P2P ML System with IPFS integration initialized successfully');
      return p2pMLSystem;

    } catch (error) {
      console.error('Failed to initialize P2P ML System:', error);
      return createMockP2PMLSystem(config);
    }
  };

  /**
   * Setup enhanced event handlers for IPFS integration
   */
  function setupEnhancedEventHandlers(system) {
    // Original event handlers
    system.on('system:started', () => {
      console.log('P2P ML System started');
      window.dispatchEvent(new CustomEvent('p2pml:system:started'));
    });

    system.on('peer:connected', (peer) => {
      console.log('Peer connected:', peer.id.id);
      window.dispatchEvent(new CustomEvent('p2pml:peer:connected', { detail: peer }));
    });

    system.on('peer:disconnected', (peer) => {
      console.log('Peer disconnected:', peer.id.id);
      window.dispatchEvent(new CustomEvent('p2pml:peer:disconnected', { detail: peer }));
    });

    system.on('model:loaded', (data) => {
      console.log('Model loaded:', data.modelId);
      window.dispatchEvent(new CustomEvent('p2pml:model:loaded', { detail: data }));
    });

    system.on('p2p:inference:response', (response) => {
      console.log('P2P inference response:', response.id);
      window.dispatchEvent(new CustomEvent('p2pml:inference:response', { detail: response }));
    });

    // Enhanced IPFS-specific event handlers
    system.on('ipfs:model:stored', (data) => {
      console.log('Model stored on IPFS:', data.modelId, 'CID:', data.cid);
      window.dispatchEvent(new CustomEvent('p2pml:ipfs:model:stored', { detail: data }));
    });

    system.on('ipfs:model:loaded', (data) => {
      console.log('Model loaded from IPFS:', data.modelId, 'Source:', data.source);
      window.dispatchEvent(new CustomEvent('p2pml:ipfs:model:loaded', { detail: data }));
    });

    system.on('ipfs:registry:updated', () => {
      console.log('IPFS model registry updated');
      window.dispatchEvent(new CustomEvent('p2pml:ipfs:registry:updated'));
    });

    system.on('model:discovered', (data) => {
      console.log('New model discovered:', data.modelId, 'from peer:', data.peerId);
      window.dispatchEvent(new CustomEvent('p2pml:model:discovered', { detail: data }));
    });

    system.on('model:shared', (data) => {
      console.log('Model shared:', data.modelId, 'to peer:', data.peerId);
      window.dispatchEvent(new CustomEvent('p2pml:model:shared', { detail: data }));
    });

    system.on('model:received', (data) => {
      console.log('Model received:', data.modelId, 'from peer:', data.peerId);
      window.dispatchEvent(new CustomEvent('p2pml:model:received', { detail: data }));
    });

    system.on('peer:capabilities:updated', () => {
      console.log('Peer capabilities updated');
      window.dispatchEvent(new CustomEvent('p2pml:peer:capabilities:updated'));
    });
  }

  /**
   * Get P2P ML System instance
   */
  window.getP2PMLSystem = function() {
    return p2pMLSystem;
  };

  /**
   * Enhanced API methods for IPFS integration
   */
  window.p2pMLAPI = {
    // System control
    async start() {
      if (p2pMLSystem) {
        return await p2pMLSystem.start();
      }
      throw new Error('P2P ML System not initialized');
    },

    async stop() {
      if (p2pMLSystem) {
        return await p2pMLSystem.stop();
      }
      throw new Error('P2P ML System not initialized');
    },

    async getSystemStatus() {
      if (p2pMLSystem) {
        return await p2pMLSystem.getSystemStatus();
      }
      return null;
    },

    // Model management
    async loadModel(modelId) {
      if (p2pMLSystem) {
        return await p2pMLSystem.loadModel(modelId);
      }
      return false;
    },

    async unloadModel(modelId) {
      if (p2pMLSystem) {
        return await p2pMLSystem.unloadModel(modelId);
      }
      return false;
    },

    getAvailableModels() {
      if (p2pMLSystem) {
        return p2pMLSystem.getAvailableModels();
      }
      return [];
    },

    getLoadedModels() {
      if (p2pMLSystem) {
        return p2pMLSystem.getLoadedModels();
      }
      return [];
    },

    // IPFS model management
    async storeModelOnIPFS(modelId, modelData, metadata = {}) {
      if (p2pMLSystem) {
        return await p2pMLSystem.storeModelOnIPFS(modelId, modelData, metadata);
      }
      throw new Error('P2P ML System not initialized');
    },

    async loadModelFromIPFS(modelId) {
      if (p2pMLSystem) {
        return await p2pMLSystem.loadModelFromIPFS(modelId);
      }
      throw new Error('P2P ML System not initialized');
    },

    getIPFSModels() {
      if (p2pMLSystem) {
        return p2pMLSystem.getIPFSModels();
      }
      return [];
    },

    searchIPFSModels(criteria) {
      if (p2pMLSystem) {
        return p2pMLSystem.searchIPFSModels(criteria);
      }
      return [];
    },

    getNetworkModels() {
      if (p2pMLSystem) {
        return p2pMLSystem.getNetworkModels();
      }
      return [];
    },

    async requestModelFromNetwork(modelId) {
      if (p2pMLSystem) {
        return await p2pMLSystem.requestModelFromNetwork(modelId);
      }
      throw new Error('P2P ML System not initialized');
    },

    // Storage statistics
    async getIPFSStorageStats() {
      if (p2pMLSystem) {
        return await p2pMLSystem.getIPFSStorageStats();
      }
      return {
        totalModels: 0,
        localModels: 0,
        ipfsModels: 0,
        totalSize: 0,
        localSize: 0
      };
    },

    getModelDiscoveryStats() {
      if (p2pMLSystem) {
        return p2pMLSystem.getModelDiscoveryStats();
      }
      return {
        connectedPeers: 0,
        totalNetworkModels: 0,
        localModels: 0,
        sharedModels: 0,
        lastSyncTime: 0
      };
    },

    // P2P networking
    getConnectedPeers() {
      if (p2pMLSystem) {
        return p2pMLSystem.getConnectedPeers();
      }
      return [];
    },

    getPeerCapabilities() {
      if (p2pMLSystem) {
        return Array.from(p2pMLSystem.getPeerCapabilities().entries());
      }
      return [];
    },

    getModelDiscoveryPeerCapabilities() {
      if (p2pMLSystem) {
        return p2pMLSystem.getModelDiscoveryPeerCapabilities();
      }
      return [];
    },

    // Inference
    async submitInference(modelId, input, options = {}) {
      if (p2pMLSystem) {
        return await p2pMLSystem.submitInference(modelId, input, options);
      }
      throw new Error('P2P ML System not initialized');
    },

    // System information
    isRunning() {
      return p2pMLSystem ? p2pMLSystem.isSystemRunning() : false;
    }
  };

  /**
   * Create mock P2P ML system for development/fallback
   */
  function createMockP2PMLSystem(config) {
    console.log('Creating mock P2P ML System for development');
    
    const mockSystem = {
      async start() {
        console.log('Mock P2P ML System started');
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('p2pml:system:started'));
        }, 100);
      },

      async stop() {
        console.log('Mock P2P ML System stopped');
      },

      async getSystemStatus() {
        return {
          modelServer: {
            running: true,
            loadedModels: ['bert-base-uncased', 't5-small'],
            activeRequests: 0
          },
          p2pNetwork: {
            running: true,
            connectedPeers: 2,
            localPeerId: 'mock-peer-id'
          },
          inferenceCoordinator: {
            running: true,
            activeInferences: 0,
            peerCapabilities: 2
          },
          ipfsStorage: {
            enabled: true,
            totalModels: 5,
            localModels: 2,
            ipfsModels: 3,
            storageUsed: 1024 * 1024 * 100 // 100MB
          },
          modelDiscovery: {
            enabled: true,
            networkModels: 8,
            connectedPeers: 2,
            lastSyncTime: Date.now() - 30000
          }
        };
      },

      async loadModel(modelId) {
        console.log(`Mock loading model: ${modelId}`);
        return true;
      },

      async unloadModel(modelId) {
        console.log(`Mock unloading model: ${modelId}`);
        return true;
      },

      getAvailableModels() {
        return [
          { id: 'bert-base-uncased', name: 'BERT Base Uncased', type: 'text-classification', size: 110 },
          { id: 't5-small', name: 'T5 Small', type: 'text-generation', size: 60 },
          { id: 'gpt2', name: 'GPT-2', type: 'text-generation', size: 500 },
          { id: 'distilbert-base-uncased', name: 'DistilBERT Base', type: 'text-classification', size: 65 }
        ];
      },

      getLoadedModels() {
        return ['bert-base-uncased', 't5-small'];
      },

      getIPFSModels() {
        return [
          {
            metadata: {
              modelId: 'bert-base-uncased',
              name: 'BERT Base Uncased',
              version: '1.0.0',
              cid: 'QmBERTModel123...',
              size: 110 * 1024 * 1024,
              tags: ['nlp', 'classification', 'verified'],
              modelFormat: 'onnx'
            },
            availability: {
              local: true,
              ipfs: true,
              peers: ['peer1', 'peer2']
            }
          },
          {
            metadata: {
              modelId: 'llama-7b-chat',
              name: 'LLaMA 7B Chat',
              version: '2.0.0',
              cid: 'QmLLaMAModel456...',
              size: 7 * 1024 * 1024 * 1024,
              tags: ['llm', 'chat', 'popular'],
              modelFormat: 'onnx'
            },
            availability: {
              local: false,
              ipfs: true,
              peers: ['peer1']
            }
          }
        ];
      },

      searchIPFSModels(criteria) {
        return this.getIPFSModels().filter(model => {
          if (criteria.query) {
            const query = criteria.query.toLowerCase();
            return model.metadata.name.toLowerCase().includes(query) ||
                   model.metadata.tags?.some(tag => tag.toLowerCase().includes(query));
          }
          return true;
        });
      },

      getNetworkModels() {
        return [
          {
            modelId: 'bert-base-uncased',
            metadata: {
              modelId: 'bert-base-uncased',
              name: 'BERT Base Uncased',
              size: 110 * 1024 * 1024,
              tags: ['nlp', 'classification']
            },
            availablePeers: ['peer1', 'peer2']
          },
          {
            modelId: 'gpt-3.5-turbo-instruct',
            metadata: {
              modelId: 'gpt-3.5-turbo-instruct',
              name: 'GPT-3.5 Turbo Instruct',
              size: 800 * 1024 * 1024,
              tags: ['llm', 'instruction']
            },
            availablePeers: ['peer1']
          }
        ];
      },

      getConnectedPeers() {
        return [
          { id: { id: 'peer1' }, metadata: { nickname: 'GPU Node 1' }},
          { id: { id: 'peer2' }, metadata: { nickname: 'Mobile Device' }}
        ];
      },

      getModelDiscoveryPeerCapabilities() {
        return [
          {
            peerId: 'peer1',
            availableModels: [
              { modelId: 'bert-base-uncased', name: 'BERT Base' },
              { modelId: 'gpt-3.5-turbo-instruct', name: 'GPT-3.5 Turbo' }
            ],
            hardwareCapabilities: {
              gpu: true,
              webgpu: true,
              webnn: false,
              totalRAM: 16384
            },
            lastSeen: Date.now() - 5000
          },
          {
            peerId: 'peer2',
            availableModels: [
              { modelId: 'bert-base-uncased', name: 'BERT Base' }
            ],
            hardwareCapabilities: {
              gpu: false,
              webgpu: true,
              webnn: true,
              totalRAM: 8192
            },
            lastSeen: Date.now() - 15000
          }
        ];
      },

      async getIPFSStorageStats() {
        return {
          totalModels: 5,
          localModels: 2,
          ipfsModels: 3,
          totalSize: 2 * 1024 * 1024 * 1024, // 2GB
          localSize: 200 * 1024 * 1024 // 200MB
        };
      },

      getModelDiscoveryStats() {
        return {
          connectedPeers: 2,
          totalNetworkModels: 8,
          localModels: 2,
          sharedModels: 1,
          lastSyncTime: Date.now() - 30000
        };
      },

      isSystemRunning() {
        return true;
      },

      on: () => {},
      emit: () => {}
    };

    // Simulate some events
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('p2pml:peer:connected', { 
        detail: { id: { id: 'peer1' }, metadata: { nickname: 'GPU Node 1' }}
      }));
    }, 1000);

    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('p2pml:model:discovered', { 
        detail: { 
          modelId: 'llama-7b-chat', 
          peerId: 'peer1',
          metadata: { name: 'LLaMA 7B Chat', size: '7GB' }
        }
      }));
    }, 2000);

    return mockSystem;
  }

  console.log('P2P ML System Bridge with IPFS integration loaded');

})();