// SwissKnife P2P ML Compute Pool - Distributed Neural Network Processing
import type { PeerId } from '@libp2p/peer-id'
import type { 
  MLPeer, 
  MLTask, 
  PeerCapabilities,
  ModelShare,
  P2PMessage 
} from './types.js'
import { SwissKnifeP2PNetworkManager } from './network-manager.js'
import { P2PTaskDistributor } from './task-distribution.js'
import { P2PResourceSharing } from './resource-sharing.js'

export interface ComputeNode {
  peerId: PeerId
  capabilities: PeerCapabilities
  currentLoad: number // 0.0 to 1.0
  reputation: number
  specializations: string[] // e.g., ['image-classification', 'nlp', 'computer-vision']
  status: 'available' | 'busy' | 'maintenance' | 'offline'
  lastHeartbeat: Date
}

export interface DistributedTrainingJob {
  id: string
  modelId: string
  coordinator: PeerId
  participants: ComputeNode[]
  config: {
    batchSize: number
    learningRate: number
    epochs: number
    optimizerType: string
    lossFunctionType: string
    distributionStrategy: 'data_parallel' | 'model_parallel' | 'pipeline_parallel'
  }
  status: 'initializing' | 'training' | 'synchronizing' | 'completed' | 'failed'
  progress: {
    currentEpoch: number
    totalEpochs: number
    globalLoss: number
    accuracy?: number
    participantProgress: Map<string, number>
  }
  startTime: Date
  lastUpdate: Date
}

export interface ModelInferenceJob {
  id: string
  modelId: string
  inputData: any
  requiredNodes: number
  shardingStrategy: 'layer_wise' | 'tensor_wise' | 'pipeline'
  assignedNodes: ComputeNode[]
  status: 'pending' | 'processing' | 'aggregating' | 'completed' | 'failed'
  results?: any
  performance: {
    totalLatency: number
    throughput: number
    energyEfficiency: number
  }
}

export class P2PMLComputePool {
  private networkManager: SwissKnifeP2PNetworkManager
  private taskDistributor: P2PTaskDistributor
  private resourceSharing: P2PResourceSharing
  private computeNodes: Map<string, ComputeNode> = new Map()
  private trainingJobs: Map<string, DistributedTrainingJob> = new Map()
  private inferenceJobs: Map<string, ModelInferenceJob> = new Map()
  private sharedModels: Map<string, ModelShare> = new Map()
  private monitoringInterval: NodeJS.Timeout | null = null

  constructor(
    networkManager: SwissKnifeP2PNetworkManager,
    taskDistributor: P2PTaskDistributor,
    resourceSharing: P2PResourceSharing
  ) {
    this.networkManager = networkManager
    this.taskDistributor = taskDistributor
    this.resourceSharing = resourceSharing
    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    this.networkManager.on('peer:connected', (peer: MLPeer) => {
      this.registerComputeNode(peer)
    })

    this.networkManager.on('peer:disconnected', (peerId: PeerId) => {
      this.unregisterComputeNode(peerId)
    })

    this.networkManager.on('message:received', (message: P2PMessage) => {
      this.handleMessage(message)
    })
  }

  // Start ML compute pool
  async start(): Promise<void> {
    console.log('Starting SwissKnife P2P ML Compute Pool...')
    
    // Start monitoring and load balancing
    this.monitoringInterval = setInterval(async () => {
      await this.monitorComputeNodes()
      await this.balanceLoad()
      await this.optimizeJobDistribution()
    }, 15000) // Every 15 seconds

    // Register ourselves as a compute node
    await this.registerSelfAsComputeNode()
    
    console.log('ML Compute Pool started')
  }

  // Stop ML compute pool
  async stop(): Promise<void> {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }

    // Complete or cancel ongoing jobs
    await this.cleanupJobs()
    
    console.log('ML Compute Pool stopped')
  }

  // Register a peer as a compute node
  private async registerComputeNode(peer: MLPeer): Promise<void> {
    const node: ComputeNode = {
      peerId: peer.id,
      capabilities: peer.capabilities,
      currentLoad: 0.0,
      reputation: peer.reputation,
      specializations: this.detectSpecializations(peer.capabilities),
      status: 'available',
      lastHeartbeat: new Date()
    }

    this.computeNodes.set(peer.id.toString(), node)
    console.log(`Registered compute node: ${peer.id}`)
  }

  // Unregister a compute node
  private unregisterComputeNode(peerId: PeerId): void {
    const node = this.computeNodes.get(peerId.toString())
    if (node) {
      node.status = 'offline'
      
      // Handle ongoing jobs on this node
      this.handleNodeDisconnection(peerId)
      
      this.computeNodes.delete(peerId.toString())
      console.log(`Unregistered compute node: ${peerId}`)
    }
  }

  // Register ourselves as a compute node
  private async registerSelfAsComputeNode(): Promise<void> {
    const capabilities = await this.detectLocalCapabilities()
    const selfNode: ComputeNode = {
      peerId: this.networkManager.peerId!,
      capabilities,
      currentLoad: 0.0,
      reputation: 100, // Start with high reputation
      specializations: this.detectSpecializations(capabilities),
      status: 'available',
      lastHeartbeat: new Date()
    }

    this.computeNodes.set(this.networkManager.peerId!.toString(), selfNode)
  }

  // Detect ML specializations based on capabilities
  private detectSpecializations(capabilities: PeerCapabilities): string[] {
    const specializations: string[] = []

    if (capabilities.gpu.available) {
      specializations.push('gpu-acceleration')
      
      if (capabilities.gpu.memory > 8000) {
        specializations.push('large-model-inference')
        specializations.push('model-training')
      }
      
      if (capabilities.frameworks.webgpu) {
        specializations.push('webgpu-compute')
      }
      
      if (capabilities.frameworks.webnn) {
        specializations.push('neural-network-optimization')
      }
    }

    if (capabilities.operations.inference) {
      specializations.push('model-inference')
    }

    if (capabilities.operations.training) {
      specializations.push('distributed-training')
    }

    if (capabilities.operations.modelSharding) {
      specializations.push('model-sharding')
    }

    if (capabilities.resources.cpuCores > 8) {
      specializations.push('parallel-processing')
    }

    if (capabilities.resources.networkBandwidth > 100) {
      specializations.push('high-bandwidth-tasks')
    }

    return specializations
  }

  // Submit distributed training job
  async submitDistributedTraining(
    modelId: string,
    trainingConfig: DistributedTrainingJob['config'],
    requiredNodes: number = 3
  ): Promise<string> {
    const jobId = `train-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Select suitable nodes for training
    const selectedNodes = this.selectNodesForTraining(requiredNodes, trainingConfig)
    
    if (selectedNodes.length < requiredNodes) {
      throw new Error(`Insufficient nodes available for training (need ${requiredNodes}, found ${selectedNodes.length})`)
    }

    const trainingJob: DistributedTrainingJob = {
      id: jobId,
      modelId,
      coordinator: this.networkManager.peerId!,
      participants: selectedNodes,
      config: trainingConfig,
      status: 'initializing',
      progress: {
        currentEpoch: 0,
        totalEpochs: trainingConfig.epochs,
        globalLoss: Infinity,
        participantProgress: new Map()
      },
      startTime: new Date(),
      lastUpdate: new Date()
    }

    this.trainingJobs.set(jobId, trainingJob)

    // Initialize training on selected nodes
    await this.initializeDistributedTraining(trainingJob)

    console.log(`Distributed training job ${jobId} submitted with ${selectedNodes.length} nodes`)
    return jobId
  }

  // Submit model inference job
  async submitModelInference(
    modelId: string,
    inputData: any,
    shardingStrategy: ModelInferenceJob['shardingStrategy'] = 'layer_wise',
    requiredNodes: number = 1
  ): Promise<string> {
    const jobId = `infer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Select suitable nodes for inference
    const selectedNodes = this.selectNodesForInference(requiredNodes, modelId)
    
    if (selectedNodes.length === 0) {
      throw new Error('No suitable nodes available for inference')
    }

    const inferenceJob: ModelInferenceJob = {
      id: jobId,
      modelId,
      inputData,
      requiredNodes,
      shardingStrategy,
      assignedNodes: selectedNodes,
      status: 'pending',
      performance: {
        totalLatency: 0,
        throughput: 0,
        energyEfficiency: 0
      }
    }

    this.inferenceJobs.set(jobId, inferenceJob)

    // Start inference
    await this.executeModelInference(inferenceJob)

    console.log(`Model inference job ${jobId} submitted to ${selectedNodes.length} nodes`)
    return jobId
  }

  // Select nodes for distributed training
  private selectNodesForTraining(
    requiredNodes: number,
    config: DistributedTrainingJob['config']
  ): ComputeNode[] {
    const availableNodes = Array.from(this.computeNodes.values())
      .filter(node => 
        node.status === 'available' && 
        node.currentLoad < 0.7 &&
        node.capabilities.operations.training &&
        node.capabilities.gpu.available
      )
      .sort((a, b) => {
        // Sort by reputation and capabilities
        const scoreA = this.calculateTrainingNodeScore(a, config)
        const scoreB = this.calculateTrainingNodeScore(b, config)
        return scoreB - scoreA
      })

    return availableNodes.slice(0, requiredNodes)
  }

  // Calculate training node suitability score
  private calculateTrainingNodeScore(
    node: ComputeNode,
    config: DistributedTrainingJob['config']
  ): number {
    let score = 0

    // Base reputation score
    score += node.reputation * 0.3

    // GPU capabilities
    score += node.capabilities.gpu.memory / 1000 * 0.2
    score += node.capabilities.gpu.computeUnits * 0.1

    // Network bandwidth (important for gradient synchronization)
    score += node.capabilities.resources.networkBandwidth / 100 * 0.2

    // Load penalty
    score -= node.currentLoad * 50

    // Specialization bonus
    if (node.specializations.includes('distributed-training')) {
      score += 20
    }
    if (node.specializations.includes('gpu-acceleration')) {
      score += 15
    }

    return score
  }

  // Select nodes for model inference
  private selectNodesForInference(requiredNodes: number, modelId: string): ComputeNode[] {
    const availableNodes = Array.from(this.computeNodes.values())
      .filter(node => 
        node.status === 'available' && 
        node.currentLoad < 0.8 &&
        node.capabilities.operations.inference
      )
      .sort((a, b) => {
        const scoreA = this.calculateInferenceNodeScore(a, modelId)
        const scoreB = this.calculateInferenceNodeScore(b, modelId)
        return scoreB - scoreA
      })

    return availableNodes.slice(0, Math.min(requiredNodes, availableNodes.length))
  }

  // Calculate inference node suitability score
  private calculateInferenceNodeScore(node: ComputeNode, modelId: string): number {
    let score = 0

    // Base reputation score
    score += node.reputation * 0.4

    // GPU performance for inference
    if (node.capabilities.gpu.available) {
      score += node.capabilities.gpu.memory / 1000 * 0.3
      score += node.capabilities.gpu.computeUnits * 0.2
    }

    // Load penalty (more important for inference due to latency requirements)
    score -= node.currentLoad * 30

    // Specialization bonus
    if (node.specializations.includes('model-inference')) {
      score += 25
    }
    if (node.specializations.includes('gpu-acceleration')) {
      score += 20
    }

    // Check if node has model cached (would be implemented with actual model tracking)
    // For now, just give bonus to high-memory nodes
    if (node.capabilities.resources.totalMemory > 8192) {
      score += 10
    }

    return score
  }

  // Initialize distributed training
  private async initializeDistributedTraining(job: DistributedTrainingJob): Promise<void> {
    job.status = 'initializing'

    // Send training initialization messages to all participants
    for (const node of job.participants) {
      await this.sendTrainingInitMessage(node.peerId, job)
    }

    // Wait for initialization confirmation from all nodes
    await new Promise(resolve => setTimeout(resolve, 2000)) // Mock delay

    job.status = 'training'
    console.log(`Distributed training initialized for job ${job.id}`)
  }

  // Execute model inference
  private async executeModelInference(job: ModelInferenceJob): Promise<void> {
    job.status = 'processing'
    const startTime = Date.now()

    try {
      // Send inference requests to assigned nodes
      const inferencePromises = job.assignedNodes.map(node => 
        this.sendInferenceRequest(node.peerId, job)
      )

      // Wait for all inference results
      const results = await Promise.all(inferencePromises)

      // Aggregate results based on sharding strategy
      job.results = await this.aggregateInferenceResults(results, job.shardingStrategy)
      job.status = 'completed'

      // Calculate performance metrics
      const endTime = Date.now()
      job.performance.totalLatency = endTime - startTime
      job.performance.throughput = 1000 / job.performance.totalLatency // inferences per second
      job.performance.energyEfficiency = this.calculateEnergyEfficiency(job)

      console.log(`Model inference job ${job.id} completed in ${job.performance.totalLatency}ms`)

    } catch (error) {
      job.status = 'failed'
      console.error(`Model inference job ${job.id} failed:`, error)
    }
  }

  // Send training initialization message
  private async sendTrainingInitMessage(peerId: PeerId, job: DistributedTrainingJob): Promise<void> {
    const message: P2PMessage = {
      id: `train-init-${Date.now()}`,
      from: this.networkManager.peerId!,
      to: peerId,
      type: 'task_assignment',
      timestamp: new Date(),
      data: {
        jobType: 'distributed_training',
        jobId: job.id,
        modelId: job.modelId,
        config: job.config,
        role: peerId.equals(job.coordinator) ? 'coordinator' : 'participant',
        participants: job.participants.map(p => p.peerId.toString())
      }
    }

    await this.networkManager.sendToPeer(peerId, message)
  }

  // Send inference request
  private async sendInferenceRequest(peerId: PeerId, job: ModelInferenceJob): Promise<any> {
    const message: P2PMessage = {
      id: `infer-req-${Date.now()}`,
      from: this.networkManager.peerId!,
      to: peerId,
      type: 'task_assignment',
      timestamp: new Date(),
      data: {
        jobType: 'model_inference',
        jobId: job.id,
        modelId: job.modelId,
        inputData: job.inputData,
        shardingStrategy: job.shardingStrategy
      }
    }

    await this.networkManager.sendToPeer(peerId, message)
    
    // Simulate inference result (in practice, this would wait for actual response)
    return {
      nodeId: peerId.toString(),
      result: [0.8, 0.15, 0.05], // Mock prediction
      latency: 50 + Math.random() * 100,
      confidence: 0.85
    }
  }

  // Aggregate inference results
  private async aggregateInferenceResults(
    results: any[], 
    strategy: ModelInferenceJob['shardingStrategy']
  ): Promise<any> {
    switch (strategy) {
      case 'layer_wise':
        // Combine results from different layers
        return this.aggregateLayerWiseResults(results)
      
      case 'tensor_wise':
        // Combine tensor-sharded results
        return this.aggregateTensorWiseResults(results)
      
      case 'pipeline':
        // Use final stage result
        return this.aggregatePipelineResults(results)
      
      default:
        // Simple ensemble averaging
        return this.aggregateEnsembleResults(results)
    }
  }

  // Aggregate layer-wise results
  private aggregateLayerWiseResults(results: any[]): any {
    // In practice, this would reconstruct the full model output
    // from layer-wise computation results
    return {
      prediction: results[results.length - 1]?.result || [0, 0, 1],
      confidence: results.reduce((acc, r) => acc + r.confidence, 0) / results.length,
      aggregationStrategy: 'layer_wise'
    }
  }

  // Aggregate tensor-wise results
  private aggregateTensorWiseResults(results: any[]): any {
    // Reconstruct tensors from sharded computation
    const aggregatedResult = results.reduce((acc, result) => {
      if (Array.isArray(result.result) && Array.isArray(acc)) {
        return acc.map((val, idx) => val + (result.result[idx] || 0))
      }
      return acc
    }, [0, 0, 0])

    return {
      prediction: aggregatedResult.map(val => val / results.length),
      confidence: results.reduce((acc, r) => acc + r.confidence, 0) / results.length,
      aggregationStrategy: 'tensor_wise'
    }
  }

  // Aggregate pipeline results
  private aggregatePipelineResults(results: any[]): any {
    // Use the final stage result in pipeline parallelism
    const finalResult = results[results.length - 1]
    return {
      prediction: finalResult?.result || [0, 0, 1],
      confidence: finalResult?.confidence || 0.5,
      aggregationStrategy: 'pipeline'
    }
  }

  // Aggregate ensemble results
  private aggregateEnsembleResults(results: any[]): any {
    // Simple ensemble averaging
    const avgPrediction = results.reduce((acc, result) => {
      if (Array.isArray(result.result) && Array.isArray(acc)) {
        return acc.map((val, idx) => val + (result.result[idx] || 0))
      }
      return acc
    }, [0, 0, 0]).map(val => val / results.length)

    return {
      prediction: avgPrediction,
      confidence: results.reduce((acc, r) => acc + r.confidence, 0) / results.length,
      aggregationStrategy: 'ensemble'
    }
  }

  // Calculate energy efficiency
  private calculateEnergyEfficiency(job: ModelInferenceJob): number {
    // Simple efficiency calculation based on latency and node count
    const baseEfficiency = 1000 / job.performance.totalLatency
    const nodeEfficiency = 1 / job.assignedNodes.length // More nodes = less efficient per node
    return baseEfficiency * nodeEfficiency
  }

  // Handle incoming messages
  private async handleMessage(message: P2PMessage): Promise<void> {
    if (message.data.jobType === 'distributed_training') {
      await this.handleTrainingMessage(message)
    } else if (message.data.jobType === 'model_inference') {
      await this.handleInferenceMessage(message)
    }
  }

  // Handle training-related messages
  private async handleTrainingMessage(message: P2PMessage): Promise<void> {
    const { jobId, modelId, config } = message.data
    
    console.log(`Received training job: ${jobId}`)
    
    // Simulate training participation
    await this.participateInTraining(jobId, modelId, config)
  }

  // Handle inference-related messages
  private async handleInferenceMessage(message: P2PMessage): Promise<void> {
    const { jobId, modelId, inputData } = message.data
    
    console.log(`Received inference job: ${jobId}`)
    
    // Simulate inference execution
    const result = await this.executeLocalInference(jobId, modelId, inputData)
    
    // Send result back
    await this.sendInferenceResult(message.from, jobId, result)
  }

  // Participate in distributed training
  private async participateInTraining(jobId: string, modelId: string, config: any): Promise<void> {
    // Simulate training participation
    console.log(`Participating in training job ${jobId}`)
    
    // Mock training loop
    for (let epoch = 0; epoch < config.epochs; epoch++) {
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate training time
      
      // Send progress update
      await this.sendTrainingProgress(jobId, epoch, config.epochs)
    }
  }

  // Execute local inference
  private async executeLocalInference(jobId: string, modelId: string, inputData: any): Promise<any> {
    // Simulate inference execution
    console.log(`Executing inference for job ${jobId}`)
    
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100))
    
    return {
      prediction: [0.7 + Math.random() * 0.2, 0.1 + Math.random() * 0.1, 0.1 + Math.random() * 0.1],
      confidence: 0.8 + Math.random() * 0.15,
      latency: 50 + Math.random() * 100
    }
  }

  // Send training progress
  private async sendTrainingProgress(jobId: string, currentEpoch: number, totalEpochs: number): Promise<void> {
    const coordinatorId = this.getJobCoordinator(jobId)
    if (!coordinatorId) return

    const message: P2PMessage = {
      id: `progress-${Date.now()}`,
      from: this.networkManager.peerId!,
      to: coordinatorId,
      type: 'task_status_update',
      timestamp: new Date(),
      data: {
        jobId,
        progress: (currentEpoch / totalEpochs) * 100,
        currentEpoch,
        totalEpochs
      }
    }

    await this.networkManager.sendToPeer(coordinatorId, message)
  }

  // Send inference result
  private async sendInferenceResult(to: PeerId, jobId: string, result: any): Promise<void> {
    const message: P2PMessage = {
      id: `result-${Date.now()}`,
      from: this.networkManager.peerId!,
      to,
      type: 'task_result',
      timestamp: new Date(),
      data: {
        jobId,
        result
      }
    }

    await this.networkManager.sendToPeer(to, message)
  }

  // Get job coordinator
  private getJobCoordinator(jobId: string): PeerId | null {
    const trainingJob = this.trainingJobs.get(jobId)
    return trainingJob?.coordinator || null
  }

  // Monitor compute nodes
  private async monitorComputeNodes(): Promise<void> {
    const now = new Date()
    
    for (const node of this.computeNodes.values()) {
      // Check for stale heartbeats
      const timeSinceHeartbeat = now.getTime() - node.lastHeartbeat.getTime()
      if (timeSinceHeartbeat > 60000) { // 1 minute timeout
        node.status = 'offline'
      }
    }
  }

  // Balance load across compute nodes
  private async balanceLoad(): Promise<void> {
    const activeNodes = Array.from(this.computeNodes.values())
      .filter(node => node.status === 'available')

    if (activeNodes.length === 0) return

    // Calculate average load
    const avgLoad = activeNodes.reduce((sum, node) => sum + node.currentLoad, 0) / activeNodes.length
    
    // Identify overloaded and underloaded nodes
    const overloaded = activeNodes.filter(node => node.currentLoad > avgLoad + 0.3)
    const underloaded = activeNodes.filter(node => node.currentLoad < avgLoad - 0.3)

    // Implement load balancing logic
    if (overloaded.length > 0 && underloaded.length > 0) {
      console.log(`Load balancing: ${overloaded.length} overloaded, ${underloaded.length} underloaded nodes`)
      // In practice, this would migrate tasks between nodes
    }
  }

  // Optimize job distribution
  private async optimizeJobDistribution(): Promise<void> {
    // Check for failed or stalled jobs
    for (const job of this.trainingJobs.values()) {
      if (job.status === 'training') {
        const timeSinceUpdate = Date.now() - job.lastUpdate.getTime()
        if (timeSinceUpdate > 300000) { // 5 minutes without update
          console.warn(`Training job ${job.id} may be stalled`)
          // Could implement recovery logic here
        }
      }
    }

    for (const job of this.inferenceJobs.values()) {
      if (job.status === 'processing') {
        // Check if inference is taking too long
        const startTime = job.assignedNodes.length > 0 ? Date.now() : 0
        if (startTime > 0 && Date.now() - startTime > 30000) { // 30 seconds timeout
          console.warn(`Inference job ${job.id} may be stalled`)
        }
      }
    }
  }

  // Handle node disconnection
  private async handleNodeDisconnection(peerId: PeerId): Promise<void> {
    // Handle training jobs
    for (const job of this.trainingJobs.values()) {
      const participantIndex = job.participants.findIndex(p => p.peerId.equals(peerId))
      if (participantIndex !== -1) {
        job.participants.splice(participantIndex, 1)
        
        if (job.participants.length < 2) {
          job.status = 'failed'
          console.error(`Training job ${job.id} failed due to insufficient participants`)
        }
      }
    }

    // Handle inference jobs
    for (const job of this.inferenceJobs.values()) {
      const nodeIndex = job.assignedNodes.findIndex(n => n.peerId.equals(peerId))
      if (nodeIndex !== -1) {
        job.assignedNodes.splice(nodeIndex, 1)
        
        if (job.assignedNodes.length === 0 && job.status === 'processing') {
          job.status = 'failed'
          console.error(`Inference job ${job.id} failed due to no available nodes`)
        }
      }
    }
  }

  // Cleanup jobs on shutdown
  private async cleanupJobs(): Promise<void> {
    // Mark all active jobs as cancelled
    for (const job of this.trainingJobs.values()) {
      if (job.status === 'training' || job.status === 'initializing') {
        job.status = 'failed'
      }
    }

    for (const job of this.inferenceJobs.values()) {
      if (job.status === 'processing' || job.status === 'pending') {
        job.status = 'failed'
      }
    }
  }

  // Detect local capabilities
  private async detectLocalCapabilities(): Promise<PeerCapabilities> {
    // This would detect actual hardware capabilities
    // For now, return mock capabilities
    return {
      gpu: { available: true, type: 'webgpu', memory: 4096, computeUnits: 8, supportedFeatures: ['compute'] },
      frameworks: { webgpu: true, webnn: false, onnx: true, tensorflow: false, pytorch: false },
      resources: { cpuCores: 8, totalMemory: 16384, availableMemory: 12288, networkBandwidth: 200, storageSpace: 51200 },
      operations: { inference: true, training: true, modelSharding: true, dataProcessing: true, distributedCompute: true }
    }
  }

  // Public API methods

  // Get available compute nodes
  getAvailableComputeNodes(): ComputeNode[] {
    return Array.from(this.computeNodes.values())
      .filter(node => node.status === 'available')
  }

  // Get training job status
  getTrainingJobStatus(jobId: string): DistributedTrainingJob | undefined {
    return this.trainingJobs.get(jobId)
  }

  // Get inference job status
  getInferenceJobStatus(jobId: string): ModelInferenceJob | undefined {
    return this.inferenceJobs.get(jobId)
  }

  // Cancel training job
  async cancelTrainingJob(jobId: string): Promise<boolean> {
    const job = this.trainingJobs.get(jobId)
    if (job && (job.status === 'training' || job.status === 'initializing')) {
      job.status = 'failed'
      console.log(`Training job ${jobId} cancelled`)
      return true
    }
    return false
  }

  // Cancel inference job
  async cancelInferenceJob(jobId: string): Promise<boolean> {
    const job = this.inferenceJobs.get(jobId)
    if (job && (job.status === 'processing' || job.status === 'pending')) {
      job.status = 'failed'
      console.log(`Inference job ${jobId} cancelled`)
      return true
    }
    return false
  }

  // Get compute pool statistics
  getComputePoolStatistics(): {
    totalNodes: number
    availableNodes: number
    activeTrainingJobs: number
    activeInferenceJobs: number
    totalComputeCapacity: number
    averageLoad: number
  } {
    const availableNodes = this.getAvailableComputeNodes()
    const activeTraining = Array.from(this.trainingJobs.values())
      .filter(j => j.status === 'training' || j.status === 'initializing').length
    const activeInference = Array.from(this.inferenceJobs.values())
      .filter(j => j.status === 'processing' || j.status === 'pending').length

    const totalCapacity = Array.from(this.computeNodes.values())
      .reduce((sum, node) => sum + node.capabilities.gpu.computeUnits, 0)
    
    const avgLoad = availableNodes.length > 0 
      ? availableNodes.reduce((sum, node) => sum + node.currentLoad, 0) / availableNodes.length
      : 0

    return {
      totalNodes: this.computeNodes.size,
      availableNodes: availableNodes.length,
      activeTrainingJobs: activeTraining,
      activeInferenceJobs: activeInference,
      totalComputeCapacity: totalCapacity,
      averageLoad: avgLoad
    }
  }
}