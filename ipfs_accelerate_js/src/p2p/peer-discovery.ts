// SwissKnife P2P Peer Discovery System
import type { PeerId } from '@libp2p/peer-id'
import type { Multiaddr } from '@multiformats/multiaddr'
import type { 
  MLPeer, 
  P2PMessage, 
  PeerCapabilities,
  NetworkTopology,
  NetworkRegion 
} from './types.js'
import { SwissKnifeP2PNetworkManager } from './network-manager.js'

export class P2PPeerDiscovery {
  private networkManager: SwissKnifeP2PNetworkManager
  private discoveredPeers: Map<string, MLPeer> = new Map()
  private regions: Map<string, NetworkRegion> = new Map()
  private discoveryInterval: NodeJS.Timeout | null = null
  private topologyUpdateInterval: NodeJS.Timeout | null = null

  constructor(networkManager: SwissKnifeP2PNetworkManager) {
    this.networkManager = networkManager
    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    this.networkManager.on('peer:connected', (peer: MLPeer) => {
      this.handlePeerConnected(peer)
    })

    this.networkManager.on('peer:disconnected', (peerId: PeerId) => {
      this.handlePeerDisconnected(peerId)
    })

    this.networkManager.on('message:received', (message: P2PMessage) => {
      this.handleMessage(message)
    })
  }

  // Start peer discovery system
  async start(): Promise<void> {
    console.log('Starting SwissKnife P2P peer discovery...')
    
    // Start periodic discovery announcements
    this.discoveryInterval = setInterval(async () => {
      await this.announceDiscovery()
    }, 30000) // Every 30 seconds

    // Start topology analysis
    this.topologyUpdateInterval = setInterval(async () => {
      await this.updateNetworkTopology()
    }, 60000) // Every minute

    // Initial discovery announcement
    await this.announceDiscovery()
  }

  // Stop peer discovery
  async stop(): Promise<void> {
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval)
      this.discoveryInterval = null
    }

    if (this.topologyUpdateInterval) {
      clearInterval(this.topologyUpdateInterval)
      this.topologyUpdateInterval = null
    }

    console.log('SwissKnife P2P peer discovery stopped')
  }

  // Announce our presence to the network
  private async announceDiscovery(): Promise<void> {
    const message: P2PMessage = {
      id: `discovery-${Date.now()}`,
      from: this.networkManager.peerId!,
      type: 'peer_discovery',
      timestamp: new Date(),
      data: {
        nodeType: 'swissknife-ml',
        version: '0.1.0',
        capabilities: await this.getLocalCapabilities(),
        services: [
          'ml-inference',
          'distributed-training', 
          'model-sharing',
          'resource-pooling'
        ],
        protocols: [
          '/swissknife/ml/1.0.0',
          '/swissknife/task/1.0.0',
          '/swissknife/model/1.0.0'
        ]
      }
    }

    await this.networkManager.broadcast(message, 'swissknife-ml-discovery')
    console.log('Announced peer discovery to network')
  }

  // Handle incoming messages
  private async handleMessage(message: P2PMessage): Promise<void> {
    switch (message.type) {
      case 'peer_discovery':
        await this.handlePeerDiscovery(message)
        break
    }
  }

  // Handle peer discovery messages
  private async handlePeerDiscovery(message: P2PMessage): Promise<void> {
    const { nodeType, version, capabilities, services, protocols } = message.data
    
    // Only process SwissKnife ML nodes
    if (nodeType !== 'swissknife-ml') {
      return
    }

    console.log(`Discovered SwissKnife ML peer: ${message.from}`)

    // Update or create peer entry
    const existingPeer = this.discoveredPeers.get(message.from.toString())
    
    if (existingPeer) {
      // Update existing peer
      existingPeer.capabilities = capabilities
      existingPeer.lastSeen = new Date()
      existingPeer.status = 'connected'
    } else {
      // Create new peer entry
      const newPeer: MLPeer = {
        id: message.from,
        multiaddrs: [], // Will be populated from connection info
        capabilities,
        lastSeen: new Date(),
        status: 'connected',
        reputation: 0
      }
      
      this.discoveredPeers.set(message.from.toString(), newPeer)
    }

    // Send discovery response
    await this.sendDiscoveryResponse(message.from)
  }

  // Send discovery response to a peer
  private async sendDiscoveryResponse(peerId: PeerId): Promise<void> {
    const response: P2PMessage = {
      id: `discovery-response-${Date.now()}`,
      from: this.networkManager.peerId!,
      to: peerId,
      type: 'peer_discovery',
      timestamp: new Date(),
      data: {
        nodeType: 'swissknife-ml',
        version: '0.1.0',
        capabilities: await this.getLocalCapabilities(),
        responseType: 'discovery_response'
      }
    }

    try {
      await this.networkManager.sendToPeer(peerId, response)
    } catch (error) {
      console.error(`Failed to send discovery response to ${peerId}:`, error)
    }
  }

  // Handle peer connected event
  private handlePeerConnected(peer: MLPeer): void {
    this.discoveredPeers.set(peer.id.toString(), peer)
    this.updateRegionMembership(peer)
    console.log(`Peer connected and added to discovery: ${peer.id}`)
  }

  // Handle peer disconnected event
  private handlePeerDisconnected(peerId: PeerId): void {
    const peer = this.discoveredPeers.get(peerId.toString())
    if (peer) {
      peer.status = 'disconnected'
      this.removeFromRegions(peerId)
    }
    console.log(`Peer disconnected from discovery: ${peerId}`)
  }

  // Update network topology analysis
  private async updateNetworkTopology(): Promise<void> {
    const connectedPeers = Array.from(this.discoveredPeers.values())
      .filter(peer => peer.status === 'connected')

    // Simple region detection based on latency patterns
    await this.detectNetworkRegions(connectedPeers)
    
    // Calculate network statistics
    const topology = this.calculateNetworkTopology(connectedPeers)
    
    console.log(`Network topology: ${topology.connectedPeers} peers, ${topology.networkRegions.length} regions`)
  }

  // Detect network regions based on connectivity patterns
  private async detectNetworkRegions(peers: MLPeer[]): Promise<void> {
    // This is a simplified region detection algorithm
    // In practice, this would involve more sophisticated analysis
    
    const regionsMap = new Map<string, MLPeer[]>()
    
    for (const peer of peers) {
      // Use a simple heuristic based on peer capabilities and connection time
      const regionKey = this.determineRegionKey(peer)
      
      if (!regionsMap.has(regionKey)) {
        regionsMap.set(regionKey, [])
      }
      regionsMap.get(regionKey)!.push(peer)
    }

    // Update regions
    this.regions.clear()
    for (const [regionId, regionPeers] of regionsMap.entries()) {
      const region: NetworkRegion = {
        id: regionId,
        peers: regionPeers.map(p => p.id),
        averageLatency: this.calculateRegionLatency(regionPeers),
        totalCapacity: this.aggregateCapabilities(regionPeers)
      }
      
      this.regions.set(regionId, region)
    }
  }

  // Determine region key for a peer (simplified heuristic)
  private determineRegionKey(peer: MLPeer): string {
    const caps = peer.capabilities
    
    // Group by similar hardware capabilities
    if (caps.gpu.available && caps.gpu.memory > 4000) {
      return 'high-gpu'
    } else if (caps.gpu.available) {
      return 'low-gpu'
    } else if (caps.resources.cpuCores > 8) {
      return 'high-cpu'
    } else {
      return 'standard'
    }
  }

  // Calculate average latency for a region
  private calculateRegionLatency(peers: MLPeer[]): number {
    // Simplified calculation - in practice would measure actual latency
    return 50 + Math.random() * 100 // Mock latency between 50-150ms
  }

  // Aggregate capabilities across peers in a region
  private aggregateCapabilities(peers: MLPeer[]): PeerCapabilities {
    const totalCapabilities: PeerCapabilities = {
      gpu: {
        available: peers.some(p => p.capabilities.gpu.available),
        type: 'webgpu',
        memory: peers.reduce((sum, p) => sum + p.capabilities.gpu.memory, 0),
        computeUnits: peers.reduce((sum, p) => sum + p.capabilities.gpu.computeUnits, 0),
        supportedFeatures: []
      },
      frameworks: {
        webgpu: peers.some(p => p.capabilities.frameworks.webgpu),
        webnn: peers.some(p => p.capabilities.frameworks.webnn),
        onnx: peers.some(p => p.capabilities.frameworks.onnx),
        tensorflow: peers.some(p => p.capabilities.frameworks.tensorflow),
        pytorch: peers.some(p => p.capabilities.frameworks.pytorch)
      },
      resources: {
        cpuCores: peers.reduce((sum, p) => sum + p.capabilities.resources.cpuCores, 0),
        totalMemory: peers.reduce((sum, p) => sum + p.capabilities.resources.totalMemory, 0),
        availableMemory: peers.reduce((sum, p) => sum + p.capabilities.resources.availableMemory, 0),
        networkBandwidth: Math.max(...peers.map(p => p.capabilities.resources.networkBandwidth)),
        storageSpace: peers.reduce((sum, p) => sum + p.capabilities.resources.storageSpace, 0)
      },
      operations: {
        inference: peers.some(p => p.capabilities.operations.inference),
        training: peers.some(p => p.capabilities.operations.training),
        modelSharding: peers.some(p => p.capabilities.operations.modelSharding),
        dataProcessing: peers.some(p => p.capabilities.operations.dataProcessing),
        distributedCompute: peers.some(p => p.capabilities.operations.distributedCompute)
      }
    }

    // Aggregate supported features
    const allFeatures = new Set<string>()
    peers.forEach(peer => {
      peer.capabilities.gpu.supportedFeatures.forEach(feature => {
        allFeatures.add(feature)
      })
    })
    totalCapabilities.gpu.supportedFeatures = Array.from(allFeatures)

    return totalCapabilities
  }

  // Calculate overall network topology
  private calculateNetworkTopology(peers: MLPeer[]): NetworkTopology {
    return {
      totalPeers: this.discoveredPeers.size,
      connectedPeers: peers.length,
      networkRegions: Array.from(this.regions.values()),
      averageLatency: this.calculateAverageNetworkLatency(),
      bandwidth: this.calculateAverageBandwidth(peers),
      reliability: this.calculateNetworkReliability(peers)
    }
  }

  // Calculate average network latency
  private calculateAverageNetworkLatency(): number {
    const regionLatencies = Array.from(this.regions.values())
      .map(region => region.averageLatency)
    
    return regionLatencies.length > 0 
      ? regionLatencies.reduce((sum, lat) => sum + lat, 0) / regionLatencies.length
      : 0
  }

  // Calculate average bandwidth
  private calculateAverageBandwidth(peers: MLPeer[]): number {
    if (peers.length === 0) return 0
    
    const totalBandwidth = peers.reduce((sum, peer) => 
      sum + peer.capabilities.resources.networkBandwidth, 0)
    
    return totalBandwidth / peers.length
  }

  // Calculate network reliability
  private calculateNetworkReliability(peers: MLPeer[]): number {
    if (peers.length === 0) return 0
    
    // Simple reliability calculation based on peer reputation
    const avgReputation = peers.reduce((sum, peer) => sum + peer.reputation, 0) / peers.length
    const connectionRatio = peers.length / Math.max(this.discoveredPeers.size, 1)
    
    return Math.min((avgReputation + connectionRatio) / 2, 1)
  }

  // Update region membership for a peer
  private updateRegionMembership(peer: MLPeer): void {
    const regionKey = this.determineRegionKey(peer)
    const region = this.regions.get(regionKey)
    
    if (region && !region.peers.some(p => p.equals(peer.id))) {
      region.peers.push(peer.id)
      region.totalCapacity = this.aggregateCapabilities(
        region.peers.map(peerId => this.discoveredPeers.get(peerId.toString())!)
          .filter(p => p && p.status === 'connected')
      )
    }
  }

  // Remove peer from regions
  private removeFromRegions(peerId: PeerId): void {
    for (const region of this.regions.values()) {
      const index = region.peers.findIndex(p => p.equals(peerId))
      if (index !== -1) {
        region.peers.splice(index, 1)
        
        // Recalculate region capabilities
        const regionPeers = region.peers.map(pId => this.discoveredPeers.get(pId.toString())!)
          .filter(p => p && p.status === 'connected')
        
        region.totalCapacity = this.aggregateCapabilities(regionPeers)
      }
    }
  }

  // Get local capabilities
  private async getLocalCapabilities(): Promise<PeerCapabilities> {
    // This would typically get capabilities from the network manager
    // For now, return a default set
    return {
      gpu: { available: true, type: 'webgpu', memory: 2048, computeUnits: 4, supportedFeatures: ['compute'] },
      frameworks: { webgpu: true, webnn: false, onnx: true, tensorflow: false, pytorch: false },
      resources: { cpuCores: 4, totalMemory: 8192, availableMemory: 4096, networkBandwidth: 100, storageSpace: 10240 },
      operations: { inference: true, training: false, modelSharding: true, dataProcessing: true, distributedCompute: true }
    }
  }

  // Public API methods

  // Find peers with specific capabilities
  findPeersWithCapabilities(requirements: Partial<PeerCapabilities>): MLPeer[] {
    return Array.from(this.discoveredPeers.values())
      .filter(peer => peer.status === 'connected')
      .filter(peer => this.peerMatchesRequirements(peer, requirements))
  }

  // Check if peer matches requirements
  private peerMatchesRequirements(peer: MLPeer, requirements: Partial<PeerCapabilities>): boolean {
    const caps = peer.capabilities

    // Check GPU requirements
    if (requirements.gpu) {
      if (requirements.gpu.available && !caps.gpu.available) return false
      if (requirements.gpu.memory && caps.gpu.memory < requirements.gpu.memory) return false
      if (requirements.gpu.computeUnits && caps.gpu.computeUnits < requirements.gpu.computeUnits) return false
    }

    // Check framework requirements
    if (requirements.frameworks) {
      for (const [framework, required] of Object.entries(requirements.frameworks)) {
        if (required && !(caps.frameworks as any)[framework]) return false
      }
    }

    // Check resource requirements
    if (requirements.resources) {
      const res = requirements.resources
      if (res.cpuCores && caps.resources.cpuCores < res.cpuCores) return false
      if (res.totalMemory && caps.resources.totalMemory < res.totalMemory) return false
      if (res.networkBandwidth && caps.resources.networkBandwidth < res.networkBandwidth) return false
      if (res.storageSpace && caps.resources.storageSpace < res.storageSpace) return false
    }

    // Check operation requirements
    if (requirements.operations) {
      for (const [operation, required] of Object.entries(requirements.operations)) {
        if (required && !(caps.operations as any)[operation]) return false
      }
    }

    return true
  }

  // Get peers in a specific region
  getPeersInRegion(regionId: string): MLPeer[] {
    const region = this.regions.get(regionId)
    if (!region) return []

    return region.peers.map(peerId => this.discoveredPeers.get(peerId.toString())!)
      .filter(peer => peer && peer.status === 'connected')
  }

  // Get all discovered peers
  getAllDiscoveredPeers(): MLPeer[] {
    return Array.from(this.discoveredPeers.values())
  }

  // Get connected peers only
  getConnectedPeers(): MLPeer[] {
    return Array.from(this.discoveredPeers.values())
      .filter(peer => peer.status === 'connected')
  }

  // Get network regions
  getNetworkRegions(): NetworkRegion[] {
    return Array.from(this.regions.values())
  }

  // Get current network topology
  getCurrentTopology(): NetworkTopology {
    const connectedPeers = this.getConnectedPeers()
    return this.calculateNetworkTopology(connectedPeers)
  }

  // Find best peers for a specific task
  findBestPeersForTask(
    requirements: Partial<PeerCapabilities>,
    count: number = 1,
    preferredRegion?: string
  ): MLPeer[] {
    let candidates = this.findPeersWithCapabilities(requirements)

    // Filter by region if specified
    if (preferredRegion) {
      const regionPeers = this.getPeersInRegion(preferredRegion)
      candidates = candidates.filter(peer => 
        regionPeers.some(rPeer => rPeer.id.equals(peer.id))
      )
    }

    // Sort by reputation and capabilities
    candidates.sort((a, b) => {
      // Primary sort by reputation
      if (a.reputation !== b.reputation) {
        return b.reputation - a.reputation
      }
      
      // Secondary sort by GPU memory (if GPU required)
      if (requirements.gpu?.available) {
        return b.capabilities.gpu.memory - a.capabilities.gpu.memory
      }
      
      // Tertiary sort by total memory
      return b.capabilities.resources.totalMemory - a.capabilities.resources.totalMemory
    })

    return candidates.slice(0, count)
  }

  // Update peer reputation
  updatePeerReputation(peerId: PeerId, delta: number): void {
    const peer = this.discoveredPeers.get(peerId.toString())
    if (peer) {
      peer.reputation = Math.max(0, Math.min(100, peer.reputation + delta))
    }
  }

  // Get peer statistics
  getPeerStatistics(): {
    total: number
    connected: number
    byRegion: Record<string, number>
    byCapability: Record<string, number>
  } {
    const connectedPeers = this.getConnectedPeers()
    
    const byRegion: Record<string, number> = {}
    for (const [regionId, region] of this.regions.entries()) {
      byRegion[regionId] = region.peers.filter(peerId => 
        this.discoveredPeers.get(peerId.toString())?.status === 'connected'
      ).length
    }

    const byCapability: Record<string, number> = {
      gpu: connectedPeers.filter(p => p.capabilities.gpu.available).length,
      webgpu: connectedPeers.filter(p => p.capabilities.frameworks.webgpu).length,
      webnn: connectedPeers.filter(p => p.capabilities.frameworks.webnn).length,
      inference: connectedPeers.filter(p => p.capabilities.operations.inference).length,
      training: connectedPeers.filter(p => p.capabilities.operations.training).length
    }

    return {
      total: this.discoveredPeers.size,
      connected: connectedPeers.length,
      byRegion,
      byCapability
    }
  }
}