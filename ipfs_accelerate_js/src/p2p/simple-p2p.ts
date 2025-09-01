// SwissKnife P2P System - Simplified WebRTC-based Implementation
// This provides P2P networking without full LibP2P dependency

export interface SimplePeerId {
  id: string
  publicKey?: string
}

export interface SimplePeer {
  id: SimplePeerId
  connection?: RTCPeerConnection
  dataChannel?: RTCDataChannel
  capabilities: any
  status: 'connecting' | 'connected' | 'disconnected'
  lastSeen: Date
}

export interface P2PConfig {
  iceServers: RTCIceServer[]
  signaling: {
    url: string
    protocol: 'ws' | 'wss' | 'http' | 'https'
  }
  enableP2P: boolean
  maxPeers: number
}

export class SimpleP2PManager {
  private peers: Map<string, SimplePeer> = new Map()
  private localId: SimplePeerId
  private config: P2PConfig
  private signalingConnection: WebSocket | null = null
  private eventHandlers: Map<string, Function[]> = new Map()

  constructor(config: P2PConfig) {
    this.config = config
    this.localId = { id: this.generatePeerId() }
    this.initializeEventHandlers()
  }

  private generatePeerId(): string {
    return 'peer-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
  }

  private initializeEventHandlers(): void {
    const events = ['peer:connected', 'peer:disconnected', 'message:received', 'peer:discovered']
    events.forEach(event => {
      this.eventHandlers.set(event, [])
    })
  }

  async start(): Promise<void> {
    if (!this.config.enableP2P) {
      console.log('P2P networking disabled in configuration')
      return
    }

    console.log(`Starting SimpleP2P Manager with ID: ${this.localId.id}`)
    
    try {
      await this.connectToSignalingServer()
      console.log('P2P Manager started successfully')
    } catch (error) {
      console.warn('Failed to start P2P Manager:', error)
      // Continue without P2P networking
    }
  }

  async stop(): Promise<void> {
    // Close all peer connections
    for (const peer of this.peers.values()) {
      if (peer.connection) {
        peer.connection.close()
      }
    }
    this.peers.clear()

    // Close signaling connection
    if (this.signalingConnection) {
      this.signalingConnection.close()
      this.signalingConnection = null
    }

    console.log('P2P Manager stopped')
  }

  private async connectToSignalingServer(): Promise<void> {
    if (!this.config.signaling.url) {
      throw new Error('No signaling server configured')
    }

    return new Promise((resolve, reject) => {
      try {
        this.signalingConnection = new WebSocket(this.config.signaling.url)
        
        this.signalingConnection.onopen = () => {
          console.log('Connected to signaling server')
          this.announcePresence()
          resolve()
        }

        this.signalingConnection.onmessage = (event) => {
          this.handleSignalingMessage(event)
        }

        this.signalingConnection.onerror = (error) => {
          console.error('Signaling connection error:', error)
          reject(error)
        }

        this.signalingConnection.onclose = () => {
          console.log('Signaling connection closed')
          // Attempt to reconnect after delay
          setTimeout(() => this.connectToSignalingServer(), 5000)
        }

      } catch (error) {
        reject(error)
      }
    })
  }

  private announcePresence(): void {
    if (this.signalingConnection?.readyState === WebSocket.OPEN) {
      this.signalingConnection.send(JSON.stringify({
        type: 'announce',
        peerId: this.localId.id,
        capabilities: this.getLocalCapabilities()
      }))
    }
  }

  private handleSignalingMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data)
      
      switch (message.type) {
        case 'peer_discovered':
          this.handlePeerDiscovered(message.peerId, message.capabilities)
          break
        case 'offer':
          this.handleOffer(message.from, message.offer)
          break
        case 'answer':
          this.handleAnswer(message.from, message.answer)
          break
        case 'ice_candidate':
          this.handleIceCandidate(message.from, message.candidate)
          break
        default:
          console.log('Unknown signaling message type:', message.type)
      }
    } catch (error) {
      console.error('Error handling signaling message:', error)
    }
  }

  private async handlePeerDiscovered(peerId: string, capabilities: any): Promise<void> {
    if (peerId === this.localId.id || this.peers.has(peerId)) {
      return
    }

    console.log(`Discovered peer: ${peerId}`)
    
    // Create peer connection
    const peer = await this.createPeerConnection(peerId, capabilities)
    this.peers.set(peerId, peer)
    
    // Initiate connection
    await this.initiateConnection(peer)
    
    this.emit('peer:discovered', peer)
  }

  private async createPeerConnection(peerId: string, capabilities: any): Promise<SimplePeer> {
    const peerConnection = new RTCPeerConnection({
      iceServers: this.config.iceServers
    })

    const peer: SimplePeer = {
      id: { id: peerId },
      connection: peerConnection,
      capabilities: capabilities || this.getDefaultCapabilities(),
      status: 'connecting',
      lastSeen: new Date()
    }

    // Set up connection event handlers
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.signalingConnection?.readyState === WebSocket.OPEN) {
        this.signalingConnection.send(JSON.stringify({
          type: 'ice_candidate',
          to: peerId,
          from: this.localId.id,
          candidate: event.candidate
        }))
      }
    }

    peerConnection.ondatachannel = (event) => {
      const channel = event.channel
      this.setupDataChannel(peer, channel)
    }

    peerConnection.onconnectionstatechange = () => {
      if (peerConnection.connectionState === 'connected') {
        peer.status = 'connected'
        peer.lastSeen = new Date()
        this.emit('peer:connected', peer)
      } else if (peerConnection.connectionState === 'disconnected' || 
                 peerConnection.connectionState === 'failed') {
        peer.status = 'disconnected'
        this.emit('peer:disconnected', peer)
      }
    }

    return peer
  }

  private async initiateConnection(peer: SimplePeer): Promise<void> {
    if (!peer.connection) return

    try {
      // Create data channel
      const dataChannel = peer.connection.createDataChannel('swissknife-ml', {
        ordered: true
      })
      
      this.setupDataChannel(peer, dataChannel)
      peer.dataChannel = dataChannel

      // Create and send offer
      const offer = await peer.connection.createOffer()
      await peer.connection.setLocalDescription(offer)

      if (this.signalingConnection?.readyState === WebSocket.OPEN) {
        this.signalingConnection.send(JSON.stringify({
          type: 'offer',
          to: peer.id.id,
          from: this.localId.id,
          offer: offer
        }))
      }

    } catch (error) {
      console.error('Error initiating connection:', error)
    }
  }

  private setupDataChannel(peer: SimplePeer, channel: RTCDataChannel): void {
    channel.onopen = () => {
      console.log(`Data channel opened with peer ${peer.id.id}`)
    }

    channel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        this.emit('message:received', { from: peer.id, data: message })
      } catch (error) {
        console.error('Error parsing peer message:', error)
      }
    }

    channel.onclose = () => {
      console.log(`Data channel closed with peer ${peer.id.id}`)
    }

    channel.onerror = (error) => {
      console.error(`Data channel error with peer ${peer.id.id}:`, error)
    }
  }

  private async handleOffer(fromPeerId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    const peer = this.peers.get(fromPeerId)
    if (!peer?.connection) return

    try {
      await peer.connection.setRemoteDescription(offer)
      const answer = await peer.connection.createAnswer()
      await peer.connection.setLocalDescription(answer)

      if (this.signalingConnection?.readyState === WebSocket.OPEN) {
        this.signalingConnection.send(JSON.stringify({
          type: 'answer',
          to: fromPeerId,
          from: this.localId.id,
          answer: answer
        }))
      }

    } catch (error) {
      console.error('Error handling offer:', error)
    }
  }

  private async handleAnswer(fromPeerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const peer = this.peers.get(fromPeerId)
    if (!peer?.connection) return

    try {
      await peer.connection.setRemoteDescription(answer)
    } catch (error) {
      console.error('Error handling answer:', error)
    }
  }

  private async handleIceCandidate(fromPeerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const peer = this.peers.get(fromPeerId)
    if (!peer?.connection) return

    try {
      await peer.connection.addIceCandidate(candidate)
    } catch (error) {
      console.error('Error adding ICE candidate:', error)
    }
  }

  // Public API
  async sendMessage(peerId: string, message: any): Promise<boolean> {
    const peer = this.peers.get(peerId)
    if (!peer?.dataChannel || peer.dataChannel.readyState !== 'open') {
      return false
    }

    try {
      peer.dataChannel.send(JSON.stringify(message))
      return true
    } catch (error) {
      console.error('Error sending message:', error)
      return false
    }
  }

  async broadcast(message: any): Promise<number> {
    let sent = 0
    for (const peer of this.peers.values()) {
      if (await this.sendMessage(peer.id.id, message)) {
        sent++
      }
    }
    return sent
  }

  getConnectedPeers(): SimplePeer[] {
    return Array.from(this.peers.values()).filter(peer => peer.status === 'connected')
  }

  getPeer(peerId: string): SimplePeer | undefined {
    return this.peers.get(peerId)
  }

  getLocalId(): SimplePeerId {
    return this.localId
  }

  // Event system
  on(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event) || []
    handlers.push(handler)
    this.eventHandlers.set(event, handlers)
  }

  off(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event) || []
    const index = handlers.indexOf(handler)
    if (index !== -1) {
      handlers.splice(index, 1)
    }
  }

  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event) || []
    handlers.forEach(handler => {
      try {
        handler(data)
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error)
      }
    })
  }

  protected getLocalCapabilities(): any {
    // Return mock capabilities - in practice this would detect real hardware
    return {
      gpu: { available: true, type: 'webgpu', memory: 4096, computeUnits: 8, supportedFeatures: ['compute'] },
      frameworks: { webgpu: true, webnn: false, onnx: true, tensorflow: false, pytorch: false },
      resources: { cpuCores: 8, totalMemory: 16384, availableMemory: 12288, networkBandwidth: 100, storageSpace: 20480 },
      operations: { inference: true, training: false, modelSharding: true, dataProcessing: true, distributedCompute: true }
    }
  }

  private getDefaultCapabilities(): any {
    return {
      gpu: { available: false, type: 'webgpu', memory: 0, computeUnits: 1, supportedFeatures: [] },
      frameworks: { webgpu: false, webnn: false, onnx: false, tensorflow: false, pytorch: false },
      resources: { cpuCores: 4, totalMemory: 4096, availableMemory: 2048, networkBandwidth: 50, storageSpace: 1024 },
      operations: { inference: true, training: false, modelSharding: false, dataProcessing: true, distributedCompute: false }
    }
  }
}

// Re-export types for compatibility
export type { PeerCapabilities, MLPeer, MLTask, P2PMessage } from './types.js'