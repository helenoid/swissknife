/**
 * P2P Model Inference Coordinator
 * Bridges the P2P network with the transformers.js model server
 */

import { EventEmitter } from 'events';
import type { TransformersModelServer, InferenceRequest, InferenceResponse, ModelInfo } from '../api_backends/transformers-model-server.js';
import type { SimpleP2PManager, SimplePeer } from './simple-p2p.js';
import type { P2PTaskDistributor } from './task-distribution.js';
import type { MLTask, TaskRequirements, P2PMessage, PeerCapabilities } from './types.js';

export interface P2PInferenceRequest {
  id: string;
  type: 'p2p_inference';
  modelId: string;
  input: string | any[];
  options?: {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    streaming?: boolean;
    task?: 'text-generation' | 'text-classification' | 'question-answering' | 'summarization' | 'translation';
    priority?: 'low' | 'medium' | 'high';
    timeout?: number;
    preferLocalExecution?: boolean;
    requireGPU?: boolean;
  };
  requester: string; // Peer ID that initiated the request
}

export interface P2PInferenceResponse {
  id: string;
  originalRequestId: string;
  status: 'processing' | 'completed' | 'error' | 'routing';
  result?: any;
  error?: string;
  executedBy?: string;
  executionTime?: number;
  localExecution: boolean;
}

export interface PeerModelCapabilities {
  peerId: string;
  availableModels: string[];
  loadedModels: string[];
  currentLoad: number; // 0-1, percentage of capacity used
  lastUpdated: Date;
  hardware: {
    hasGPU: boolean;
    totalMemory: number;
    availableMemory: number;
  };
}

/**
 * Coordinates model inference across the P2P network
 */
export class P2PModelInferenceCoordinator extends EventEmitter {
  private modelServer: TransformersModelServer;
  private p2pManager: SimpleP2PManager;
  private taskDistributor: P2PTaskDistributor;
  
  private activeInferenceRequests: Map<string, P2PInferenceRequest> = new Map();
  private peerCapabilities: Map<string, PeerModelCapabilities> = new Map();
  private inferenceRouting: Map<string, string> = new Map(); // requestId -> peerId
  private loadBalancer: InferenceLoadBalancer;

  constructor(
    modelServer: TransformersModelServer,
    p2pManager: SimpleP2PManager,
    taskDistributor: P2PTaskDistributor
  ) {
    super();
    this.modelServer = modelServer;
    this.p2pManager = p2pManager;
    this.taskDistributor = taskDistributor;
    this.loadBalancer = new InferenceLoadBalancer();

    this.setupEventListeners();
    this.startCapabilityBroadcast();
  }

  /**
   * Setup event listeners for model server and P2P network
   */
  private setupEventListeners(): void {
    // Model server events
    this.modelServer.on('model:loaded', (data) => {
      this.broadcastCapabilities();
    });

    this.modelServer.on('model:unloaded', (data) => {
      this.broadcastCapabilities();
    });

    this.modelServer.on('inference:completed', (response: InferenceResponse) => {
      this.handleLocalInferenceCompleted(response);
    });

    this.modelServer.on('inference:error', (response: InferenceResponse) => {
      this.handleLocalInferenceError(response);
    });

    // P2P network events
    this.p2pManager.on('message:received', (message: any) => {
      this.handleP2PMessage(message);
    });

    this.p2pManager.on('peer:connected', (peer: SimplePeer) => {
      this.requestPeerCapabilities(peer.id.id);
    });

    this.p2pManager.on('peer:disconnected', (peer: SimplePeer) => {
      this.peerCapabilities.delete(peer.id.id);
      this.handlePeerDisconnection(peer.id.id);
    });
  }

  /**
   * Process an inference request, deciding whether to execute locally or distribute
   */
  async processInferenceRequest(request: P2PInferenceRequest): Promise<void> {
    console.log(`Processing P2P inference request ${request.id} for model ${request.modelId}`);
    
    this.activeInferenceRequests.set(request.id, request);

    try {
      // Check if we should prefer local execution
      if (request.options?.preferLocalExecution || await this.shouldExecuteLocally(request)) {
        await this.executeLocally(request);
      } else {
        await this.distributeInference(request);
      }

    } catch (error) {
      console.error(`Error processing P2P inference request ${request.id}:`, error);
      this.emitInferenceResponse({
        id: `response-${request.id}`,
        originalRequestId: request.id,
        status: 'error',
        error: error.message,
        localExecution: false
      });
    }
  }

  /**
   * Determine if inference should be executed locally
   */
  private async shouldExecuteLocally(request: P2PInferenceRequest): Promise<boolean> {
    // Check if model is available locally
    const modelInfo = this.modelServer.getModelInfo(request.modelId);
    if (!modelInfo) {
      return false; // Model not available locally
    }

    // Check current load
    const currentLoad = this.getCurrentLoad();
    if (currentLoad > 0.8) {
      console.log(`High local load (${currentLoad}), considering distribution`);
      return false;
    }

    // Check if any peer has better capabilities for this model
    const suitablePeers = this.findSuitablePeers(request);
    if (suitablePeers.length === 0) {
      return true; // No suitable peers, execute locally
    }

    // Use load balancer to decide
    return this.loadBalancer.shouldExecuteLocally(request, currentLoad, suitablePeers);
  }

  /**
   * Execute inference locally
   */
  private async executeLocally(request: P2PInferenceRequest): Promise<void> {
    console.log(`Executing inference ${request.id} locally`);

    const inferenceRequest: InferenceRequest = {
      id: request.id,
      modelId: request.modelId,
      input: request.input,
      options: request.options,
      metadata: {
        fromPeer: request.requester,
        priority: request.options?.priority || 'medium'
      }
    };

    // Process with local model server
    await this.modelServer.processInference(inferenceRequest);
  }

  /**
   * Distribute inference to a suitable peer
   */
  private async distributeInference(request: P2PInferenceRequest): Promise<void> {
    console.log(`Distributing inference ${request.id} to peer network`);

    const suitablePeers = this.findSuitablePeers(request);
    if (suitablePeers.length === 0) {
      console.log('No suitable peers found, executing locally as fallback');
      await this.executeLocally(request);
      return;
    }

    // Select best peer using load balancer
    const selectedPeer = this.loadBalancer.selectPeerForInference(request, suitablePeers);
    if (!selectedPeer) {
      await this.executeLocally(request);
      return;
    }

    // Route request to selected peer
    this.inferenceRouting.set(request.id, selectedPeer.peerId);
    
    await this.sendInferenceRequestToPeer(selectedPeer.peerId, request);

    this.emitInferenceResponse({
      id: `routing-${request.id}`,
      originalRequestId: request.id,
      status: 'routing',
      executedBy: selectedPeer.peerId,
      localExecution: false
    });
  }

  /**
   * Find peers suitable for executing the inference request
   */
  private findSuitablePeers(request: P2PInferenceRequest): PeerModelCapabilities[] {
    const suitable: PeerModelCapabilities[] = [];

    for (const [peerId, capabilities] of this.peerCapabilities) {
      // Check if peer has the required model
      if (!capabilities.availableModels.includes(request.modelId) && 
          !capabilities.loadedModels.includes(request.modelId)) {
        continue;
      }

      // Check GPU requirement
      if (request.options?.requireGPU && !capabilities.hardware.hasGPU) {
        continue;
      }

      // Check load
      if (capabilities.currentLoad > 0.9) {
        continue;
      }

      // Check memory requirements (rough estimate)
      const modelInfo = this.modelServer.getModelInfo(request.modelId);
      if (modelInfo && capabilities.hardware.availableMemory < modelInfo.size) {
        continue;
      }

      suitable.push(capabilities);
    }

    return suitable;
  }

  /**
   * Send inference request to a specific peer
   */
  private async sendInferenceRequestToPeer(peerId: string, request: P2PInferenceRequest): Promise<void> {
    const message = {
      type: 'p2p_inference_request',
      from: this.p2pManager.getLocalId().id,
      data: request,
      timestamp: new Date()
    };

    const success = await this.p2pManager.sendMessage(peerId, message);
    if (!success) {
      throw new Error(`Failed to send inference request to peer ${peerId}`);
    }

    console.log(`Sent inference request ${request.id} to peer ${peerId}`);
  }

  /**
   * Handle P2P messages
   */
  private async handleP2PMessage(message: any): Promise<void> {
    switch (message.data?.type) {
      case 'p2p_inference_request':
        await this.handleIncomingInferenceRequest(message);
        break;
      case 'p2p_inference_response':
        await this.handleIncomingInferenceResponse(message);
        break;
      case 'peer_capabilities':
        this.updatePeerCapabilities(message.from, message.data.capabilities);
        break;
      case 'capability_request':
        await this.sendCapabilitiesToPeer(message.from);
        break;
    }
  }

  /**
   * Handle incoming inference request from peer
   */
  private async handleIncomingInferenceRequest(message: any): Promise<void> {
    const request: P2PInferenceRequest = message.data;
    console.log(`Received inference request ${request.id} from peer ${message.from}`);

    try {
      // Execute locally (we were selected as the best peer)
      await this.executeLocally(request);

    } catch (error) {
      console.error(`Error executing peer inference request ${request.id}:`, error);
      
      // Send error response back to requesting peer
      await this.sendInferenceResponseToPeer(message.from, {
        id: `error-${request.id}`,
        originalRequestId: request.id,
        status: 'error',
        error: error.message,
        executedBy: this.p2pManager.getLocalId().id,
        localExecution: true
      });
    }
  }

  /**
   * Handle incoming inference response from peer
   */
  private async handleIncomingInferenceResponse(message: any): Promise<void> {
    const response: P2PInferenceResponse = message.data;
    console.log(`Received inference response ${response.id} from peer ${message.from}`);

    // Forward response to local listeners
    this.emitInferenceResponse(response);
    
    // Clean up routing
    this.inferenceRouting.delete(response.originalRequestId);
  }

  /**
   * Handle local inference completion
   */
  private async handleLocalInferenceCompleted(response: InferenceResponse): Promise<void> {
    const request = this.activeInferenceRequests.get(response.id);
    if (!request) {
      return;
    }

    const p2pResponse: P2PInferenceResponse = {
      id: `completed-${response.id}`,
      originalRequestId: response.id,
      status: 'completed',
      result: response.result,
      executedBy: this.p2pManager.getLocalId().id,
      executionTime: response.metadata?.executionTime,
      localExecution: true
    };

    // If this was a request from another peer, send response back
    if (request.requester !== this.p2pManager.getLocalId().id) {
      await this.sendInferenceResponseToPeer(request.requester, p2pResponse);
    } else {
      // Local request, emit response
      this.emitInferenceResponse(p2pResponse);
    }

    this.activeInferenceRequests.delete(response.id);
  }

  /**
   * Handle local inference error
   */
  private async handleLocalInferenceError(response: InferenceResponse): Promise<void> {
    const request = this.activeInferenceRequests.get(response.id);
    if (!request) {
      return;
    }

    const p2pResponse: P2PInferenceResponse = {
      id: `error-${response.id}`,
      originalRequestId: response.id,
      status: 'error',
      error: response.error,
      executedBy: this.p2pManager.getLocalId().id,
      localExecution: true
    };

    // If this was a request from another peer, send response back
    if (request.requester !== this.p2pManager.getLocalId().id) {
      await this.sendInferenceResponseToPeer(request.requester, p2pResponse);
    } else {
      // Local request, emit response
      this.emitInferenceResponse(p2pResponse);
    }

    this.activeInferenceRequests.delete(response.id);
  }

  /**
   * Send inference response to a specific peer
   */
  private async sendInferenceResponseToPeer(peerId: string, response: P2PInferenceResponse): Promise<void> {
    const message = {
      type: 'p2p_inference_response',
      from: this.p2pManager.getLocalId().id,
      data: response,
      timestamp: new Date()
    };

    await this.p2pManager.sendMessage(peerId, message);
    console.log(`Sent inference response ${response.id} to peer ${peerId}`);
  }

  /**
   * Emit inference response to local listeners
   */
  private emitInferenceResponse(response: P2PInferenceResponse): void {
    this.emit('inference:response', response);
  }

  /**
   * Broadcast local capabilities to all peers
   */
  private async broadcastCapabilities(): Promise<void> {
    const capabilities = await this.getLocalCapabilities();
    
    const message = {
      type: 'peer_capabilities',
      from: this.p2pManager.getLocalId().id,
      data: { capabilities },
      timestamp: new Date()
    };

    await this.p2pManager.broadcast(message);
  }

  /**
   * Get local model capabilities
   */
  private async getLocalCapabilities(): Promise<PeerModelCapabilities> {
    const availableModels = this.modelServer.getAvailableModels().map(m => m.id);
    const loadedModels = this.modelServer.getLoadedModels().map(m => m.id);
    
    return {
      peerId: this.p2pManager.getLocalId().id,
      availableModels,
      loadedModels,
      currentLoad: this.getCurrentLoad(),
      lastUpdated: new Date(),
      hardware: {
        hasGPU: await this.detectGPU(),
        totalMemory: this.getTotalMemory(),
        availableMemory: this.getAvailableMemory()
      }
    };
  }

  /**
   * Request capabilities from a specific peer
   */
  private async requestPeerCapabilities(peerId: string): Promise<void> {
    const message = {
      type: 'capability_request',
      from: this.p2pManager.getLocalId().id,
      data: {},
      timestamp: new Date()
    };

    await this.p2pManager.sendMessage(peerId, message);
  }

  /**
   * Send capabilities to a specific peer
   */
  private async sendCapabilitiesToPeer(peerId: string): Promise<void> {
    const capabilities = await this.getLocalCapabilities();
    
    const message = {
      type: 'peer_capabilities',
      from: this.p2pManager.getLocalId().id,
      data: { capabilities },
      timestamp: new Date()
    };

    await this.p2pManager.sendMessage(peerId, message);
  }

  /**
   * Update capabilities for a peer
   */
  private updatePeerCapabilities(peerId: string, capabilities: PeerModelCapabilities): void {
    this.peerCapabilities.set(peerId, capabilities);
    this.emit('peer:capabilities_updated', { peerId, capabilities });
  }

  /**
   * Handle peer disconnection
   */
  private handlePeerDisconnection(peerId: string): void {
    // Find any active requests routed to this peer and handle fallback
    for (const [requestId, routedPeerId] of this.inferenceRouting) {
      if (routedPeerId === peerId) {
        console.log(`Peer ${peerId} disconnected, failing over request ${requestId}`);
        const request = this.activeInferenceRequests.get(requestId);
        if (request) {
          // Try to redistribute or execute locally
          this.distributeInference(request).catch(console.error);
        }
      }
    }
  }

  /**
   * Start periodic capability broadcast
   */
  private startCapabilityBroadcast(): void {
    // Broadcast capabilities every 30 seconds
    setInterval(() => {
      this.broadcastCapabilities().catch(console.error);
    }, 30000);

    // Initial broadcast
    setTimeout(() => {
      this.broadcastCapabilities().catch(console.error);
    }, 1000);
  }

  /**
   * Get current system load (0-1)
   */
  private getCurrentLoad(): number {
    const activeRequests = this.modelServer.getActiveRequestsCount();
    const maxConcurrent = 4; // Should come from config
    return Math.min(activeRequests / maxConcurrent, 1);
  }

  /**
   * Detect GPU availability
   */
  private async detectGPU(): Promise<boolean> {
    // Simple GPU detection - in practice this would be more sophisticated
    return typeof navigator !== 'undefined' && 'gpu' in navigator;
  }

  /**
   * Get total memory estimate
   */
  private getTotalMemory(): number {
    // Rough estimate - in practice this would use actual system info
    return typeof navigator !== 'undefined' && 'deviceMemory' in navigator 
      ? (navigator as any).deviceMemory * 1024 
      : 8192; // Default 8GB
  }

  /**
   * Get available memory estimate
   */
  private getAvailableMemory(): number {
    return this.getTotalMemory() * 0.6; // Estimate 60% available
  }

  /**
   * Public API methods
   */
  async submitInferenceRequest(
    modelId: string,
    input: string | any[],
    options: P2PInferenceRequest['options'] = {}
  ): Promise<string> {
    const request: P2PInferenceRequest = {
      id: `inf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'p2p_inference',
      modelId,
      input,
      options,
      requester: this.p2pManager.getLocalId().id
    };

    await this.processInferenceRequest(request);
    return request.id;
  }

  getPeerCapabilities(): Map<string, PeerModelCapabilities> {
    return new Map(this.peerCapabilities);
  }

  getActiveInferenceRequests(): P2PInferenceRequest[] {
    return Array.from(this.activeInferenceRequests.values());
  }
}

/**
 * Load balancer for inference distribution
 */
class InferenceLoadBalancer {
  shouldExecuteLocally(
    request: P2PInferenceRequest,
    localLoad: number,
    suitablePeers: PeerModelCapabilities[]
  ): boolean {
    // If no peers or local load is low, execute locally
    if (suitablePeers.length === 0 || localLoad < 0.3) {
      return true;
    }

    // Find the least loaded suitable peer
    const leastLoadedPeer = suitablePeers.reduce((min, peer) => 
      peer.currentLoad < min.currentLoad ? peer : min
    );

    // Execute locally if we have lower load than best peer
    return localLoad <= leastLoadedPeer.currentLoad;
  }

  selectPeerForInference(
    request: P2PInferenceRequest,
    suitablePeers: PeerModelCapabilities[]
  ): PeerModelCapabilities | null {
    if (suitablePeers.length === 0) {
      return null;
    }

    // Score peers based on load, capabilities, and model availability
    const scoredPeers = suitablePeers.map(peer => ({
      peer,
      score: this.calculatePeerScore(peer, request)
    })).sort((a, b) => b.score - a.score);

    return scoredPeers[0]?.peer || null;
  }

  private calculatePeerScore(peer: PeerModelCapabilities, request: P2PInferenceRequest): number {
    let score = 100;

    // Load penalty (higher load = lower score)
    score -= peer.currentLoad * 50;

    // Model loaded bonus
    if (peer.loadedModels.includes(request.modelId)) {
      score += 30;
    }

    // GPU bonus if required
    if (request.options?.requireGPU && peer.hardware.hasGPU) {
      score += 20;
    }

    // Memory bonus
    score += Math.min(peer.hardware.availableMemory / 1024, 10) * 2;

    // Freshness bonus (more recent updates are better)
    const ageMinutes = (Date.now() - peer.lastUpdated.getTime()) / (1000 * 60);
    score -= Math.min(ageMinutes, 30); // Penalty for old data

    return Math.max(score, 0);
  }
}