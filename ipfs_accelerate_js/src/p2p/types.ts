// P2P System Types for SwissKnife ML Virtual OS
import type { PeerId } from '@libp2p/peer-id'
import type { Multiaddr } from '@multiformats/multiaddr'

export interface MLPeer {
  id: PeerId
  multiaddrs: Multiaddr[]
  capabilities: PeerCapabilities
  lastSeen: Date
  status: 'connected' | 'disconnected' | 'connecting'
  reputation: number
}

export interface PeerCapabilities {
  // Hardware capabilities
  gpu: {
    available: boolean
    type: 'webgpu' | 'webnn' | 'cuda' | 'opencl' | 'metal'
    memory: number // in MB
    computeUnits: number
    supportedFeatures: string[]
  }
  
  // ML Framework support
  frameworks: {
    webgpu: boolean
    webnn: boolean
    onnx: boolean
    tensorflow: boolean
    pytorch: boolean
  }
  
  // Resource availability
  resources: {
    cpuCores: number
    totalMemory: number // in MB
    availableMemory: number // in MB
    networkBandwidth: number // in Mbps
    storageSpace: number // in MB
  }
  
  // Supported operations
  operations: {
    inference: boolean
    training: boolean
    modelSharding: boolean
    dataProcessing: boolean
    distributedCompute: boolean
  }
}

export interface MLTask {
  id: string
  type: 'inference' | 'training' | 'preprocessing' | 'optimization' | 'custom'
  modelId?: string
  requirements: TaskRequirements
  priority: 'low' | 'medium' | 'high' | 'critical'
  deadline?: Date
  status: 'pending' | 'assigned' | 'running' | 'completed' | 'failed'
  assignedPeers: PeerId[]
  progress: number // 0-100
  results?: any
  metadata: Record<string, any>
}

export interface TaskRequirements {
  minGpuMemory?: number
  preferredFramework?: string
  estimatedRuntime?: number // in seconds
  requiredPeers?: number
  bandwidth?: number // minimum required bandwidth
  storage?: number // required storage space
  capabilities?: string[] // specific capabilities needed
}

export interface P2PMessage {
  id: string
  from: PeerId
  to?: PeerId | PeerId[] // undefined for broadcast
  type: P2PMessageType
  timestamp: Date
  data: any
  signature?: string
}

export type P2PMessageType = 
  | 'peer_discovery'
  | 'capability_announcement'
  | 'task_assignment'
  | 'task_status_update'
  | 'task_result'
  | 'model_share'
  | 'resource_request'
  | 'resource_offer'
  | 'heartbeat'
  | 'system_announcement'

export interface ModelShare {
  modelId: string
  modelName: string
  version: string
  framework: string
  size: number // in bytes
  cid: string // IPFS content identifier
  metadata: ModelMetadata
  permissions: ModelPermissions
}

export interface ModelMetadata {
  description: string
  author: string
  tags: string[]
  task: string // e.g., 'image-classification', 'text-generation'
  accuracy?: number
  latency?: number // in ms
  license: string
  createdAt: Date
  lastModified: Date
}

export interface ModelPermissions {
  public: boolean
  allowedPeers?: PeerId[]
  allowInference: boolean
  allowTraining: boolean
  allowModification: boolean
  allowRedistribution: boolean
}

export interface ResourceOffer {
  peerId: PeerId
  resourceType: 'compute' | 'storage' | 'bandwidth' | 'model'
  capacity: number
  cost?: number // credits or tokens per unit
  duration?: number // availability duration in seconds
  conditions?: string[]
}

export interface NetworkTopology {
  totalPeers: number
  connectedPeers: number
  networkRegions: NetworkRegion[]
  averageLatency: number
  bandwidth: number
  reliability: number
}

export interface NetworkRegion {
  id: string
  peers: PeerId[]
  centerPoint?: { lat: number; lng: number }
  averageLatency: number
  totalCapacity: PeerCapabilities
}

export interface P2PEvents {
  'peer:connected': (peer: MLPeer) => void
  'peer:disconnected': (peerId: PeerId) => void
  'peer:updated': (peer: MLPeer) => void
  'task:assigned': (task: MLTask) => void
  'task:completed': (task: MLTask) => void
  'task:failed': (task: MLTask, error: Error) => void
  'model:shared': (modelShare: ModelShare) => void
  'resource:offered': (offer: ResourceOffer) => void
  'message:received': (message: P2PMessage) => void
  'network:topology_changed': (topology: NetworkTopology) => void
}

// Configuration interfaces
export interface P2PConfig {
  // Network configuration
  network: {
    bootstrap: Multiaddr[]
    listenAddresses: string[]
    maxConnections: number
    minConnections: number
    heartbeatInterval: number
    connectionTimeout: number
  }
  
  // Security configuration
  security: {
    enableEncryption: boolean
    allowUnsafeConnections: boolean
    trustedPeers: PeerId[]
    bannedPeers: PeerId[]
  }
  
  // ML-specific configuration
  ml: {
    maxTasksPerPeer: number
    defaultTimeout: number
    enableModelSharing: boolean
    enableDistributedTraining: boolean
    resourceSharingEnabled: boolean
  }
  
  // DHT configuration
  dht: {
    enabled: boolean
    bucketSize: number
    kValue: number
    alpha: number
  }
}