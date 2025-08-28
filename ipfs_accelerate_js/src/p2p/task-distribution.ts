// SwissKnife P2P Task Distribution System
import type { PeerId } from '@libp2p/peer-id'
import type { 
  MLTask, 
  MLPeer, 
  TaskRequirements,
  P2PMessage,
  PeerCapabilities 
} from './types.js'
import { SwissKnifeP2PNetworkManager } from './network-manager.js'

export class P2PTaskDistributor {
  private networkManager: SwissKnifeP2PNetworkManager
  private activeTasks: Map<string, MLTask> = new Map()
  private taskQueue: MLTask[] = []
  private taskHistory: Map<string, MLTask> = new Map()
  private executionCallbacks: Map<string, (result: any) => void> = new Map()

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

  // Submit a task for distributed execution
  async submitTask(
    taskType: MLTask['type'],
    requirements: TaskRequirements,
    data: any,
    priority: MLTask['priority'] = 'medium'
  ): Promise<string> {
    const task: MLTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: taskType,
      requirements,
      priority,
      status: 'pending',
      assignedPeers: [],
      progress: 0,
      metadata: {
        submittedAt: new Date(),
        data,
        submittedBy: this.networkManager.peerId
      }
    }

    this.activeTasks.set(task.id, task)
    
    // Try to assign task immediately
    const assigned = await this.assignTask(task)
    
    if (!assigned) {
      // Add to queue if no suitable peers available
      this.taskQueue.push(task)
      console.log(`Task ${task.id} queued - no suitable peers available`)
    }

    return task.id
  }

  // Assign task to suitable peers
  private async assignTask(task: MLTask): Promise<boolean> {
    const suitablePeers = this.findSuitablePeers(task.requirements)
    
    if (suitablePeers.length === 0) {
      return false
    }

    // Select best peer(s) based on capabilities and load
    const selectedPeers = this.selectOptimalPeers(suitablePeers, task.requirements)
    
    if (selectedPeers.length === 0) {
      return false
    }

    // Assign task to selected peers
    task.assignedPeers = selectedPeers.map(peer => peer.id)
    task.status = 'assigned'

    // Send task assignment messages
    for (const peer of selectedPeers) {
      await this.sendTaskAssignment(peer.id, task)
    }

    console.log(`Task ${task.id} assigned to ${selectedPeers.length} peer(s)`)
    return true
  }

  // Find peers that meet task requirements
  private findSuitablePeers(requirements: TaskRequirements): MLPeer[] {
    return this.networkManager.connectedPeers.filter(peer => {
      return this.peerMeetsRequirements(peer, requirements)
    })
  }

  // Check if peer meets task requirements
  private peerMeetsRequirements(peer: MLPeer, requirements: TaskRequirements): boolean {
    const caps = peer.capabilities

    // Check GPU memory requirement
    if (requirements.minGpuMemory && caps.gpu.memory < requirements.minGpuMemory) {
      return false
    }

    // Check framework preference
    if (requirements.preferredFramework) {
      const framework = requirements.preferredFramework.toLowerCase()
      if (framework === 'webgpu' && !caps.frameworks.webgpu) return false
      if (framework === 'webnn' && !caps.frameworks.webnn) return false
      if (framework === 'onnx' && !caps.frameworks.onnx) return false
      if (framework === 'tensorflow' && !caps.frameworks.tensorflow) return false
      if (framework === 'pytorch' && !caps.frameworks.pytorch) return false
    }

    // Check storage requirement
    if (requirements.storage && caps.resources.storageSpace < requirements.storage) {
      return false
    }

    // Check bandwidth requirement
    if (requirements.bandwidth && caps.resources.networkBandwidth < requirements.bandwidth) {
      return false
    }

    // Check specific capabilities
    if (requirements.capabilities) {
      for (const capability of requirements.capabilities) {
        if (!this.peerHasCapability(caps, capability)) {
          return false
        }
      }
    }

    return true
  }

  // Check if peer has specific capability
  private peerHasCapability(caps: PeerCapabilities, capability: string): boolean {
    switch (capability) {
      case 'inference':
        return caps.operations.inference
      case 'training':
        return caps.operations.training
      case 'modelSharding':
        return caps.operations.modelSharding
      case 'dataProcessing':
        return caps.operations.dataProcessing
      case 'distributedCompute':
        return caps.operations.distributedCompute
      case 'gpu':
        return caps.gpu.available
      default:
        return caps.gpu.supportedFeatures.includes(capability)
    }
  }

  // Select optimal peers for task execution
  private selectOptimalPeers(candidates: MLPeer[], requirements: TaskRequirements): MLPeer[] {
    // Sort candidates by suitability score
    const scoredPeers = candidates.map(peer => ({
      peer,
      score: this.calculatePeerScore(peer, requirements)
    })).sort((a, b) => b.score - a.score)

    // Select required number of peers
    const requiredPeers = requirements.requiredPeers || 1
    return scoredPeers.slice(0, requiredPeers).map(item => item.peer)
  }

  // Calculate peer suitability score
  private calculatePeerScore(peer: MLPeer, requirements: TaskRequirements): number {
    let score = 0
    const caps = peer.capabilities

    // Base score from reputation
    score += peer.reputation * 10

    // GPU capability bonus
    if (caps.gpu.available) {
      score += 50
      score += Math.min(caps.gpu.memory / 1024, 10) * 5 // Memory bonus
      score += Math.min(caps.gpu.computeUnits, 16) * 2 // Compute units bonus
    }

    // Framework match bonus
    if (requirements.preferredFramework) {
      const framework = requirements.preferredFramework.toLowerCase()
      if ((framework === 'webgpu' && caps.frameworks.webgpu) ||
          (framework === 'webnn' && caps.frameworks.webnn) ||
          (framework === 'onnx' && caps.frameworks.onnx) ||
          (framework === 'tensorflow' && caps.frameworks.tensorflow) ||
          (framework === 'pytorch' && caps.frameworks.pytorch)) {
        score += 30
      }
    }

    // Resource availability bonus
    score += Math.min(caps.resources.availableMemory / 1024, 8) * 3
    score += Math.min(caps.resources.networkBandwidth / 100, 10) * 2
    score += Math.min(caps.resources.storageSpace / 1024, 5) * 2

    // Recent activity penalty (avoid overloading busy peers)
    const currentTasks = this.getActivePeerTasks(peer.id)
    score -= currentTasks * 10

    return Math.max(score, 0)
  }

  // Get number of active tasks for a peer
  private getActivePeerTasks(peerId: PeerId): number {
    return Array.from(this.activeTasks.values())
      .filter(task => 
        task.assignedPeers.some(assignedId => assignedId.equals(peerId)) &&
        (task.status === 'assigned' || task.status === 'running')
      ).length
  }

  // Send task assignment to peer
  private async sendTaskAssignment(peerId: PeerId, task: MLTask): Promise<void> {
    const message: P2PMessage = {
      id: `task-assign-${Date.now()}`,
      from: this.networkManager.peerId!,
      to: peerId,
      type: 'task_assignment',
      timestamp: new Date(),
      data: {
        task: {
          ...task,
          // Don't send full data in assignment, just reference
          metadata: {
            ...task.metadata,
            data: undefined,
            dataSize: JSON.stringify(task.metadata.data).length
          }
        }
      }
    }

    await this.networkManager.sendToPeer(peerId, message)
  }

  // Handle incoming messages
  private async handleMessage(message: P2PMessage): Promise<void> {
    switch (message.type) {
      case 'task_assignment':
        await this.handleTaskAssignment(message)
        break
      case 'task_status_update':
        await this.handleTaskStatusUpdate(message)
        break
      case 'task_result':
        await this.handleTaskResult(message)
        break
    }
  }

  // Handle task assignment (when we receive a task to execute)
  private async handleTaskAssignment(message: P2PMessage): Promise<void> {
    const { task } = message.data
    console.log(`Received task assignment: ${task.id}`)

    try {
      // Validate that we can handle this task
      if (!this.canExecuteTask(task)) {
        await this.sendTaskStatusUpdate(message.from, task.id, 'failed', 
          'Insufficient capabilities to execute task')
        return
      }

      // Accept task
      task.status = 'running'
      task.progress = 0
      this.activeTasks.set(task.id, task)

      await this.sendTaskStatusUpdate(message.from, task.id, 'running')

      // Execute task
      const result = await this.executeTask(task)

      // Send result back
      await this.sendTaskResult(message.from, task.id, result)

    } catch (error) {
      console.error(`Error executing task ${task.id}:`, error)
      await this.sendTaskStatusUpdate(message.from, task.id, 'failed', error.message)
    }
  }

  // Check if we can execute a task
  private canExecuteTask(task: MLTask): boolean {
    // This is a simplified check - in practice, this would involve
    // more sophisticated capability matching
    return true
  }

  // Execute a task locally
  private async executeTask(task: MLTask): Promise<any> {
    console.log(`Executing task ${task.id} of type ${task.type}`)

    // Simulate task execution based on type
    switch (task.type) {
      case 'inference':
        return await this.executeInferenceTask(task)
      case 'training':
        return await this.executeTrainingTask(task)
      case 'preprocessing':
        return await this.executePreprocessingTask(task)
      case 'optimization':
        return await this.executeOptimizationTask(task)
      default:
        return await this.executeCustomTask(task)
    }
  }

  // Execute inference task
  private async executeInferenceTask(task: MLTask): Promise<any> {
    // Simulate inference execution
    console.log(`Running inference task ${task.id}`)
    
    // Update progress
    for (let progress = 0; progress <= 100; progress += 20) {
      task.progress = progress
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    return {
      type: 'inference_result',
      taskId: task.id,
      predictions: [0.8, 0.15, 0.05], // Mock predictions
      confidence: 0.85,
      executionTime: 500
    }
  }

  // Execute training task
  private async executeTrainingTask(task: MLTask): Promise<any> {
    console.log(`Running training task ${task.id}`)
    
    // Simulate longer training process
    for (let progress = 0; progress <= 100; progress += 10) {
      task.progress = progress
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    return {
      type: 'training_result',
      taskId: task.id,
      modelUpdates: 'mock_model_weights',
      loss: 0.125,
      accuracy: 0.92,
      epochs: 10
    }
  }

  // Execute preprocessing task
  private async executePreprocessingTask(task: MLTask): Promise<any> {
    console.log(`Running preprocessing task ${task.id}`)
    
    for (let progress = 0; progress <= 100; progress += 25) {
      task.progress = progress
      await new Promise(resolve => setTimeout(resolve, 150))
    }

    return {
      type: 'preprocessing_result',
      taskId: task.id,
      processedData: 'mock_processed_data',
      statistics: { mean: 0.5, std: 0.2, count: 1000 }
    }
  }

  // Execute optimization task
  private async executeOptimizationTask(task: MLTask): Promise<any> {
    console.log(`Running optimization task ${task.id}`)
    
    for (let progress = 0; progress <= 100; progress += 15) {
      task.progress = progress
      await new Promise(resolve => setTimeout(resolve, 180))
    }

    return {
      type: 'optimization_result',
      taskId: task.id,
      optimizedModel: 'mock_optimized_model',
      compressionRatio: 0.7,
      speedImprovement: 2.3
    }
  }

  // Execute custom task
  private async executeCustomTask(task: MLTask): Promise<any> {
    console.log(`Running custom task ${task.id}`)
    
    // Basic execution simulation
    task.progress = 100
    
    return {
      type: 'custom_result',
      taskId: task.id,
      result: 'Task completed successfully'
    }
  }

  // Send task status update
  private async sendTaskStatusUpdate(
    to: PeerId, 
    taskId: string, 
    status: MLTask['status'], 
    error?: string
  ): Promise<void> {
    const message: P2PMessage = {
      id: `status-${Date.now()}`,
      from: this.networkManager.peerId!,
      to,
      type: 'task_status_update',
      timestamp: new Date(),
      data: {
        taskId,
        status,
        error,
        progress: this.activeTasks.get(taskId)?.progress || 0
      }
    }

    await this.networkManager.sendToPeer(to, message)
  }

  // Send task result
  private async sendTaskResult(to: PeerId, taskId: string, result: any): Promise<void> {
    const message: P2PMessage = {
      id: `result-${Date.now()}`,
      from: this.networkManager.peerId!,
      to,
      type: 'task_result',
      timestamp: new Date(),
      data: {
        taskId,
        result,
        completedAt: new Date()
      }
    }

    await this.networkManager.sendToPeer(to, message)
  }

  // Handle task status updates
  private async handleTaskStatusUpdate(message: P2PMessage): Promise<void> {
    const { taskId, status, error, progress } = message.data
    const task = this.activeTasks.get(taskId)
    
    if (task) {
      task.status = status
      task.progress = progress || task.progress
      
      console.log(`Task ${taskId} status: ${status} (${progress}%)`)
      
      if (status === 'failed') {
        console.error(`Task ${taskId} failed: ${error}`)
        this.taskHistory.set(taskId, task)
        this.activeTasks.delete(taskId)
      }
    }
  }

  // Handle task results
  private async handleTaskResult(message: P2PMessage): Promise<void> {
    const { taskId, result } = message.data
    const task = this.activeTasks.get(taskId)
    
    if (task) {
      task.status = 'completed'
      task.progress = 100
      task.results = result
      
      console.log(`Task ${taskId} completed successfully`)
      
      // Execute callback if registered
      const callback = this.executionCallbacks.get(taskId)
      if (callback) {
        callback(result)
        this.executionCallbacks.delete(taskId)
      }
      
      // Move to history
      this.taskHistory.set(taskId, task)
      this.activeTasks.delete(taskId)
      
      // Process queued tasks
      await this.processTaskQueue()
    }
  }

  // Handle peer disconnection
  private async handlePeerDisconnection(peerId: PeerId): Promise<void> {
    // Find tasks assigned to disconnected peer
    const affectedTasks = Array.from(this.activeTasks.values()).filter(task =>
      task.assignedPeers.some(assignedId => assignedId.equals(peerId))
    )

    for (const task of affectedTasks) {
      // Remove disconnected peer from assignment
      task.assignedPeers = task.assignedPeers.filter(id => !id.equals(peerId))
      
      if (task.assignedPeers.length === 0) {
        // Reassign task if no peers left
        task.status = 'pending'
        task.progress = 0
        
        const reassigned = await this.assignTask(task)
        if (!reassigned) {
          this.taskQueue.push(task)
        }
      }
    }
  }

  // Process queued tasks
  private async processTaskQueue(): Promise<void> {
    const remainingQueue: MLTask[] = []
    
    for (const task of this.taskQueue) {
      const assigned = await this.assignTask(task)
      if (!assigned) {
        remainingQueue.push(task)
      }
    }
    
    this.taskQueue = remainingQueue
  }

  // Public API methods
  async waitForTaskCompletion(taskId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const task = this.activeTasks.get(taskId) || this.taskHistory.get(taskId)
      
      if (!task) {
        reject(new Error(`Task ${taskId} not found`))
        return
      }
      
      if (task.status === 'completed') {
        resolve(task.results)
        return
      }
      
      if (task.status === 'failed') {
        reject(new Error(`Task ${taskId} failed`))
        return
      }
      
      // Register callback for completion
      this.executionCallbacks.set(taskId, resolve)
      
      // Set timeout
      setTimeout(() => {
        this.executionCallbacks.delete(taskId)
        reject(new Error(`Task ${taskId} timeout`))
      }, 300000) // 5 minute timeout
    })
  }

  getTaskStatus(taskId: string): MLTask | undefined {
    return this.activeTasks.get(taskId) || this.taskHistory.get(taskId)
  }

  getActiveTasks(): MLTask[] {
    return Array.from(this.activeTasks.values())
  }

  getTaskHistory(): MLTask[] {
    return Array.from(this.taskHistory.values())
  }

  cancelTask(taskId: string): boolean {
    const task = this.activeTasks.get(taskId)
    if (task && task.status !== 'completed') {
      task.status = 'failed'
      this.activeTasks.delete(taskId)
      this.taskHistory.set(taskId, task)
      return true
    }
    return false
  }
}