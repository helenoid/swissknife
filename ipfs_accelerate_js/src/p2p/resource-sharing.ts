// SwissKnife P2P Resource Sharing System
import type { PeerId } from '@libp2p/peer-id'
import type { 
  MLPeer, 
  ResourceOffer, 
  P2PMessage, 
  PeerCapabilities 
} from './types.js'
import { SwissKnifeP2PNetworkManager } from './network-manager.js'

export interface ResourceRequest {
  id: string
  requesterId: PeerId
  type: 'compute' | 'storage' | 'bandwidth' | 'model' | 'data'
  requirements: {
    amount: number
    duration?: number // in seconds
    priority: 'low' | 'medium' | 'high' | 'urgent'
    maxCost?: number
    deadline?: Date
    specifications?: Record<string, any>
  }
  status: 'pending' | 'fulfilled' | 'partial' | 'expired' | 'cancelled'
  offers: ResourceOffer[]
  selectedOffer?: ResourceOffer
  createdAt: Date
}

export interface ResourceAllocation {
  id: string
  requestId: string
  providerId: PeerId
  consumerId: PeerId
  resource: ResourceOffer
  status: 'active' | 'completed' | 'failed' | 'cancelled'
  startTime: Date
  endTime?: Date
  actualUsage?: {
    amount: number
    duration: number
    efficiency: number
  }
}

export class P2PResourceSharing {
  private networkManager: SwissKnifeP2PNetworkManager
  private pendingRequests: Map<string, ResourceRequest> = new Map()
  private activeAllocations: Map<string, ResourceAllocation> = new Map()
  private myOffers: Map<string, ResourceOffer> = new Map()
  private resourceHistory: Map<string, ResourceAllocation> = new Map()
  private monitoringInterval: NodeJS.Timeout | null = null

  constructor(networkManager: SwissKnifeP2PNetworkManager) {
    this.networkManager = networkManager
    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    this.networkManager.on('message:received', (message: P2PMessage) => {
      this.handleMessage(message)
    })

    this.networkManager.on('peer:disconnected', (peerId: PeerId) => {
      this.handlePeerDisconnection(peerId)
    })
  }

  // Start resource sharing system
  async start(): Promise<void> {
    console.log('Starting SwissKnife P2P resource sharing...')
    
    // Start resource monitoring
    this.monitoringInterval = setInterval(async () => {
      await this.monitorResources()
    }, 30000) // Every 30 seconds

    // Announce available resources
    await this.announceAvailableResources()
  }

  // Stop resource sharing
  async stop(): Promise<void> {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }

    // Cancel all active allocations
    for (const allocation of this.activeAllocations.values()) {
      if (allocation.status === 'active') {
        await this.cancelAllocation(allocation.id, 'System shutdown')
      }
    }

    console.log('SwissKnife P2P resource sharing stopped')
  }

  // Request resources from the network
  async requestResource(
    type: ResourceRequest['type'],
    amount: number,
    duration?: number,
    priority: ResourceRequest['requirements']['priority'] = 'medium',
    specifications?: Record<string, any>
  ): Promise<string> {
    const request: ResourceRequest = {
      id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      requesterId: this.networkManager.peerId!,
      type,
      requirements: {
        amount,
        duration,
        priority,
        specifications
      },
      status: 'pending',
      offers: [],
      createdAt: new Date()
    }

    this.pendingRequests.set(request.id, request)

    // Broadcast resource request
    await this.broadcastResourceRequest(request)

    console.log(`Resource request ${request.id} submitted for ${type} (${amount} units)`)
    return request.id
  }

  // Offer resources to the network
  async offerResource(
    type: ResourceOffer['resourceType'],
    capacity: number,
    cost?: number,
    duration?: number,
    conditions?: string[]
  ): Promise<string> {
    const offer: ResourceOffer = {
      peerId: this.networkManager.peerId!,
      resourceType: type,
      capacity,
      cost,
      duration,
      conditions
    }

    const offerId = `offer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    this.myOffers.set(offerId, offer)

    // Broadcast resource offer
    await this.broadcastResourceOffer(offer)

    console.log(`Resource offer ${offerId} published for ${type} (${capacity} units)`)
    return offerId
  }

  // Handle incoming messages
  private async handleMessage(message: P2PMessage): Promise<void> {
    switch (message.type) {
      case 'resource_request':
        await this.handleResourceRequest(message)
        break
      case 'resource_offer':
        await this.handleResourceOffer(message)
        break
    }
  }

  // Handle resource request from another peer
  private async handleResourceRequest(message: P2PMessage): Promise<void> {
    const { request } = message.data
    console.log(`Received resource request: ${request.id} from ${message.from}`)

    // Check if we can fulfill this request
    const availableOffers = this.findMatchingOffers(request)
    
    for (const offer of availableOffers) {
      // Send offer response
      await this.sendOfferResponse(message.from, request.id, offer)
    }
  }

  // Handle resource offer from another peer
  private async handleResourceOffer(message: P2PMessage): Promise<void> {
    const { offer } = message.data
    console.log(`Received resource offer from ${message.from}`)

    // Check if this offer matches any of our pending requests
    const matchingRequests = Array.from(this.pendingRequests.values())
      .filter(req => this.offerMatchesRequest(offer, req))

    for (const request of matchingRequests) {
      request.offers.push(offer)
      
      // Auto-accept if high priority and good offer
      if (request.requirements.priority === 'urgent' || 
          request.requirements.priority === 'high') {
        await this.acceptOffer(request.id, offer)
        break
      }
    }
  }

  // Find matching offers for a request
  private findMatchingOffers(request: ResourceRequest): ResourceOffer[] {
    return Array.from(this.myOffers.values())
      .filter(offer => this.offerMatchesRequest(offer, request))
  }

  // Check if offer matches request
  private offerMatchesRequest(offer: ResourceOffer, request: ResourceRequest): boolean {
    // Basic type matching
    if (offer.resourceType !== request.type) {
      return false
    }

    // Capacity check
    if (offer.capacity < request.requirements.amount) {
      return false
    }

    // Cost check
    if (request.requirements.maxCost && 
        offer.cost && 
        offer.cost > request.requirements.maxCost) {
      return false
    }

    // Duration check
    if (request.requirements.duration && 
        offer.duration && 
        offer.duration < request.requirements.duration) {
      return false
    }

    // Specifications check
    if (request.requirements.specifications) {
      // Custom specification matching logic would go here
      // For now, assume all specifications are met
    }

    return true
  }

  // Send offer response to requesting peer
  private async sendOfferResponse(
    to: PeerId, 
    requestId: string, 
    offer: ResourceOffer
  ): Promise<void> {
    const message: P2PMessage = {
      id: `offer-response-${Date.now()}`,
      from: this.networkManager.peerId!,
      to,
      type: 'resource_offer',
      timestamp: new Date(),
      data: {
        requestId,
        offer,
        responseType: 'offer_response'
      }
    }

    await this.networkManager.sendToPeer(to, message)
  }

  // Accept an offer for a resource request
  async acceptOffer(requestId: string, offer: ResourceOffer): Promise<boolean> {
    const request = this.pendingRequests.get(requestId)
    if (!request || request.status !== 'pending') {
      return false
    }

    try {
      // Create allocation
      const allocation: ResourceAllocation = {
        id: `alloc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        requestId,
        providerId: offer.peerId,
        consumerId: request.requesterId,
        resource: offer,
        status: 'active',
        startTime: new Date()
      }

      this.activeAllocations.set(allocation.id, allocation)
      request.status = 'fulfilled'
      request.selectedOffer = offer

      // Notify provider
      await this.notifyAllocationStart(offer.peerId, allocation)

      console.log(`Resource allocation ${allocation.id} started`)
      return true

    } catch (error) {
      console.error(`Failed to accept offer for request ${requestId}:`, error)
      return false
    }
  }

  // Notify peer about allocation start
  private async notifyAllocationStart(
    providerId: PeerId, 
    allocation: ResourceAllocation
  ): Promise<void> {
    const message: P2PMessage = {
      id: `alloc-start-${Date.now()}`,
      from: this.networkManager.peerId!,
      to: providerId,
      type: 'resource_offer',
      timestamp: new Date(),
      data: {
        allocation,
        action: 'allocation_start'
      }
    }

    await this.networkManager.sendToPeer(providerId, message)
  }

  // Cancel an allocation
  async cancelAllocation(allocationId: string, reason: string): Promise<boolean> {
    const allocation = this.activeAllocations.get(allocationId)
    if (!allocation || allocation.status !== 'active') {
      return false
    }

    allocation.status = 'cancelled'
    allocation.endTime = new Date()

    // Notify provider
    await this.notifyAllocationEnd(allocation.providerId, allocation, reason)

    // Move to history
    this.resourceHistory.set(allocationId, allocation)
    this.activeAllocations.delete(allocationId)

    console.log(`Resource allocation ${allocationId} cancelled: ${reason}`)
    return true
  }

  // Complete an allocation
  async completeAllocation(
    allocationId: string, 
    actualUsage?: ResourceAllocation['actualUsage']
  ): Promise<boolean> {
    const allocation = this.activeAllocations.get(allocationId)
    if (!allocation || allocation.status !== 'active') {
      return false
    }

    allocation.status = 'completed'
    allocation.endTime = new Date()
    allocation.actualUsage = actualUsage

    // Notify provider
    await this.notifyAllocationEnd(allocation.providerId, allocation)

    // Move to history
    this.resourceHistory.set(allocationId, allocation)
    this.activeAllocations.delete(allocationId)

    console.log(`Resource allocation ${allocationId} completed`)
    return true
  }

  // Notify peer about allocation end
  private async notifyAllocationEnd(
    providerId: PeerId, 
    allocation: ResourceAllocation,
    reason?: string
  ): Promise<void> {
    const message: P2PMessage = {
      id: `alloc-end-${Date.now()}`,
      from: this.networkManager.peerId!,
      to: providerId,
      type: 'resource_offer',
      timestamp: new Date(),
      data: {
        allocation,
        action: 'allocation_end',
        reason
      }
    }

    await this.networkManager.sendToPeer(providerId, message)
  }

  // Broadcast resource request to network
  private async broadcastResourceRequest(request: ResourceRequest): Promise<void> {
    const message: P2PMessage = {
      id: `req-broadcast-${Date.now()}`,
      from: this.networkManager.peerId!,
      type: 'resource_request',
      timestamp: new Date(),
      data: {
        request: {
          ...request,
          // Don't include sensitive data in broadcast
          offers: undefined
        }
      }
    }

    await this.networkManager.broadcast(message, 'swissknife-ml-resources')
  }

  // Broadcast resource offer to network
  private async broadcastResourceOffer(offer: ResourceOffer): Promise<void> {
    const message: P2PMessage = {
      id: `offer-broadcast-${Date.now()}`,
      from: this.networkManager.peerId!,
      type: 'resource_offer',
      timestamp: new Date(),
      data: {
        offer,
        action: 'offer_announcement'
      }
    }

    await this.networkManager.broadcast(message, 'swissknife-ml-resources')
  }

  // Announce available resources based on current capabilities
  private async announceAvailableResources(): Promise<void> {
    const capabilities = await this.getCurrentCapabilities()
    
    // Offer compute resources if GPU available
    if (capabilities.gpu.available) {
      await this.offerResource(
        'compute',
        capabilities.gpu.computeUnits,
        0.1, // Cost per compute unit
        3600, // 1 hour availability
        ['gpu-accelerated', 'ml-optimized']
      )
    }

    // Offer storage resources
    if (capabilities.resources.storageSpace > 1024) {
      await this.offerResource(
        'storage',
        Math.floor(capabilities.resources.storageSpace * 0.5), // Offer 50% of storage
        0.01, // Cost per MB
        7200, // 2 hours availability
        ['distributed', 'encrypted']
      )
    }

    // Offer bandwidth resources
    if (capabilities.resources.networkBandwidth > 50) {
      await this.offerResource(
        'bandwidth',
        Math.floor(capabilities.resources.networkBandwidth * 0.3), // Offer 30% of bandwidth
        0.05, // Cost per Mbps
        1800, // 30 minutes availability
        ['p2p', 'low-latency']
      )
    }

    console.log('Available resources announced to network')
  }

  // Monitor resources and update availability
  private async monitorResources(): Promise<void> {
    // Check expired allocations
    const now = new Date()
    for (const allocation of this.activeAllocations.values()) {
      if (allocation.resource.duration) {
        const elapsed = now.getTime() - allocation.startTime.getTime()
        if (elapsed > allocation.resource.duration * 1000) {
          await this.completeAllocation(allocation.id, {
            amount: allocation.resource.capacity,
            duration: elapsed / 1000,
            efficiency: 0.8 // Mock efficiency
          })
        }
      }
    }

    // Check expired requests
    for (const request of this.pendingRequests.values()) {
      if (request.requirements.deadline && now > request.requirements.deadline) {
        request.status = 'expired'
        this.pendingRequests.delete(request.id)
      }
    }

    // Update resource offers based on current load
    await this.updateResourceAvailability()
  }

  // Update resource availability based on current system load
  private async updateResourceAvailability(): Promise<void> {
    const currentLoad = this.calculateCurrentLoad()
    
    // Adjust offers based on load
    for (const [offerId, offer] of this.myOffers.entries()) {
      if (currentLoad > 0.8) {
        // High load - reduce or withdraw offers
        offer.capacity = Math.floor(offer.capacity * 0.5)
        if (offer.capacity < 1) {
          this.myOffers.delete(offerId)
        }
      } else if (currentLoad < 0.3) {
        // Low load - increase offers
        const capabilities = await this.getCurrentCapabilities()
        if (offer.resourceType === 'compute' && capabilities.gpu.available) {
          offer.capacity = Math.min(offer.capacity * 1.2, capabilities.gpu.computeUnits)
        }
      }
    }
  }

  // Calculate current system load
  private calculateCurrentLoad(): number {
    const activeCount = this.activeAllocations.size
    const maxCapacity = 10 // Assume max 10 concurrent allocations
    return Math.min(activeCount / maxCapacity, 1.0)
  }

  // Get current system capabilities
  private async getCurrentCapabilities(): Promise<PeerCapabilities> {
    // This would typically get real-time capabilities
    // For now, return mock capabilities
    return {
      gpu: { available: true, type: 'webgpu', memory: 4096, computeUnits: 8, supportedFeatures: ['compute'] },
      frameworks: { webgpu: true, webnn: false, onnx: true, tensorflow: false, pytorch: false },
      resources: { cpuCores: 8, totalMemory: 16384, availableMemory: 8192, networkBandwidth: 200, storageSpace: 20480 },
      operations: { inference: true, training: true, modelSharding: true, dataProcessing: true, distributedCompute: true }
    }
  }

  // Handle peer disconnection
  private async handlePeerDisconnection(peerId: PeerId): Promise<void> {
    // Cancel allocations involving disconnected peer
    for (const allocation of this.activeAllocations.values()) {
      if (allocation.providerId.equals(peerId) || allocation.consumerId.equals(peerId)) {
        await this.cancelAllocation(allocation.id, 'Peer disconnected')
      }
    }

    // Remove offers from disconnected peer
    for (const request of this.pendingRequests.values()) {
      request.offers = request.offers.filter(offer => !offer.peerId.equals(peerId))
    }
  }

  // Public API methods

  // Get pending resource requests
  getPendingRequests(): ResourceRequest[] {
    return Array.from(this.pendingRequests.values())
  }

  // Get active allocations
  getActiveAllocations(): ResourceAllocation[] {
    return Array.from(this.activeAllocations.values())
  }

  // Get resource history
  getResourceHistory(): ResourceAllocation[] {
    return Array.from(this.resourceHistory.values())
  }

  // Get resource request status
  getRequestStatus(requestId: string): ResourceRequest | undefined {
    return this.pendingRequests.get(requestId)
  }

  // Get allocation status
  getAllocationStatus(allocationId: string): ResourceAllocation | undefined {
    return this.activeAllocations.get(allocationId) || this.resourceHistory.get(allocationId)
  }

  // Get current resource utilization
  getResourceUtilization(): {
    compute: { used: number; available: number }
    storage: { used: number; available: number }
    bandwidth: { used: number; available: number }
  } {
    const activeAllocations = Array.from(this.activeAllocations.values())
    
    const computeUsed = activeAllocations
      .filter(a => a.resource.resourceType === 'compute')
      .reduce((sum, a) => sum + a.resource.capacity, 0)
    
    const storageUsed = activeAllocations
      .filter(a => a.resource.resourceType === 'storage')
      .reduce((sum, a) => sum + a.resource.capacity, 0)
    
    const bandwidthUsed = activeAllocations
      .filter(a => a.resource.resourceType === 'bandwidth')
      .reduce((sum, a) => sum + a.resource.capacity, 0)

    return {
      compute: { used: computeUsed, available: 8 - computeUsed },
      storage: { used: storageUsed, available: 10240 - storageUsed },
      bandwidth: { used: bandwidthUsed, available: 200 - bandwidthUsed }
    }
  }

  // Get resource statistics
  getResourceStatistics(): {
    totalRequests: number
    fulfilledRequests: number
    totalAllocations: number
    completedAllocations: number
    averageAllocationDuration: number
    resourceEfficiency: number
  } {
    const allRequests = Array.from(this.pendingRequests.values())
    const fulfilledRequests = allRequests.filter(r => r.status === 'fulfilled').length
    
    const allAllocations = [
      ...Array.from(this.activeAllocations.values()),
      ...Array.from(this.resourceHistory.values())
    ]
    const completedAllocations = allAllocations.filter(a => a.status === 'completed')
    
    const avgDuration = completedAllocations.length > 0
      ? completedAllocations.reduce((sum, a) => {
          if (a.endTime) {
            return sum + (a.endTime.getTime() - a.startTime.getTime()) / 1000
          }
          return sum
        }, 0) / completedAllocations.length
      : 0

    const efficiency = completedAllocations.length > 0
      ? completedAllocations.reduce((sum, a) => 
          sum + (a.actualUsage?.efficiency || 0.8), 0) / completedAllocations.length
      : 0

    return {
      totalRequests: allRequests.length,
      fulfilledRequests,
      totalAllocations: allAllocations.length,
      completedAllocations: completedAllocations.length,
      averageAllocationDuration: avgDuration,
      resourceEfficiency: efficiency
    }
  }
}