// SwissKnife Collaborative P2P Manager - Phase 2 Implementation
// Enhanced P2P system with workspace collaboration and real-time task sharing

import { SimpleP2PManager, SimplePeer, SimplePeerId, P2PConfig } from './simple-p2p.js'
import type { 
  MLTask, 
  PeerCapabilities,
  P2PMessage,
  TaskRequirements 
} from './types.js'

// Enhanced interfaces for collaboration
export interface CollaborativeTask {
  id: string;
  type: 'computation' | 'ai-inference' | 'file-processing' | 'code-execution' | 'collaboration';
  payload: any;
  requirements: CollaborativeTaskRequirements;
  assignedPeer?: string;
  status: 'pending' | 'assigned' | 'running' | 'completed' | 'failed';
  assignedPeers: any[];
  progress: number;
  result?: any;
  collaborators?: string[];
  sharedState?: Map<string, any>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  metadata: Record<string, any>;
}

export interface CollaborativeTaskRequirements {
  memory?: number;
  compute?: number;
  gpu?: boolean;
  realTimeSync?: boolean;
  maxLatency?: number;
  collaboratorCount?: number;
  minGpuMemory?: number;
  preferredFramework?: string;
  estimatedRuntime?: number;
  requiredPeers?: number;
  bandwidth?: number;
  storage?: number;
  capabilities?: string[];
}

export interface CollaborativeWorkspace {
  id: string;
  name: string;
  description: string;
  participants: SimplePeerId[];
  owner: SimplePeerId;
  sharedState: Map<string, any>;
  activeApplications: string[];
  permissions: WorkspacePermissions;
  createdAt: Date;
  lastActivity: Date;
  settings: WorkspaceSettings;
}

export interface WorkspacePermissions {
  public: boolean;
  allowJoin: boolean;
  canInviteOthers: boolean;
  adminUsers: string[];
  bannedUsers: string[];
  allowedUsers?: string[];
  maxParticipants: number;
  requiresApproval: boolean;
}

export interface WorkspaceSettings {
  enableFileSharing: boolean;
  enableRealTimeSync: boolean;
  enableVoiceChat: boolean;
  enableScreenShare: boolean;
  autoSaveInterval: number;
  maxFileSize: number;
  encryptionEnabled: boolean;
}

export interface CollaborativeSession {
  workspaceId: string;
  applicationId: string;
  participants: SimplePeerId[];
  sharedCursor: Map<string, CursorPosition>;
  sharedSelection: Map<string, SelectionRange>;
  operationalTransform: OperationHistory;
  lastSync: Date;
}

export interface CursorPosition {
  x: number;
  y: number;
  user: string;
  color: string;
  timestamp: Date;
}

export interface SelectionRange {
  start: number;
  end: number;
  user: string;
  timestamp: Date;
}

export interface OperationHistory {
  operations: FileOperation[];
  lastSequenceNumber: number;
  conflictResolution: 'latest-wins' | 'operational-transform' | 'manual';
}

export interface FileOperation {
  id: string;
  type: 'insert' | 'delete' | 'replace' | 'move';
  position: number;
  content?: string;
  length?: number;
  user: string;
  timestamp: Date;
  sequenceNumber: number;
}

export interface PeerPresence {
  peerId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  currentWorkspace?: string;
  currentApplication?: string;
  lastSeen: Date;
  capabilities: PeerCapabilities;
  location?: { country: string; timezone: string };
}

export class CollaborativeP2PManager extends SimpleP2PManager {
  private workspaces: Map<string, CollaborativeWorkspace> = new Map();
  private collaborativeTasks: Map<string, CollaborativeTask> = new Map();
  private activeSessions: Map<string, CollaborativeSession> = new Map();
  private peerPresence: Map<string, PeerPresence> = new Map();
  private taskQueue: CollaborativeTask[] = [];
  private taskDistributionCallbacks: Map<string, (result: any) => void> = new Map();
  private currentWorkspace?: CollaborativeWorkspace;

  constructor(config: P2PConfig) {
    super(config);
    this.setupCollaborativeEventHandlers();
  }

  private setupCollaborativeEventHandlers(): void {
    // Listen to base P2P events
    this.on('peer:connected', (peer: SimplePeer) => {
      this.handlePeerConnectedCollaborative(peer);
    });

    this.on('peer:disconnected', (peer: SimplePeer) => {
      this.handlePeerDisconnectedCollaborative(peer);
    });

    this.on('message:received', (data: { from: SimplePeerId; data: any }) => {
      this.handleCollaborativeMessage(data.from, data.data);
    });

    // Start presence heartbeat
    setInterval(() => {
      this.broadcastPresence();
    }, 30000); // Every 30 seconds
  }

  // Workspace Management
  async createWorkspace(
    name: string, 
    description: string = '',
    settings: Partial<WorkspaceSettings> = {}
  ): Promise<CollaborativeWorkspace> {
    const workspace: CollaborativeWorkspace = {
      id: `workspace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      participants: [this.getLocalId()],
      owner: this.getLocalId(),
      sharedState: new Map(),
      activeApplications: [],
      permissions: {
        public: false,
        allowJoin: true,
        canInviteOthers: true,
        adminUsers: [this.getLocalId().id],
        bannedUsers: [],
        maxParticipants: 10,
        requiresApproval: false
      },
      createdAt: new Date(),
      lastActivity: new Date(),
      settings: {
        enableFileSharing: true,
        enableRealTimeSync: true,
        enableVoiceChat: false,
        enableScreenShare: false,
        autoSaveInterval: 30000,
        maxFileSize: 100 * 1024 * 1024, // 100MB
        encryptionEnabled: true,
        ...settings
      }
    };

    this.workspaces.set(workspace.id, workspace);
    this.currentWorkspace = workspace;

    // Announce workspace creation
    await this.broadcastWorkspaceAnnouncement(workspace);

    console.log(`Created collaborative workspace: ${workspace.name} (${workspace.id})`);
    return workspace;
  }

  async joinWorkspace(workspaceId: string): Promise<boolean> {
    // Check if workspace exists in our known workspaces
    const workspace = this.workspaces.get(workspaceId);
    if (workspace) {
      return await this.joinExistingWorkspace(workspace);
    }

    // Request workspace info from peers
    return await this.requestWorkspaceJoin(workspaceId);
  }

  private async joinExistingWorkspace(workspace: CollaborativeWorkspace): Promise<boolean> {
    const localId = this.getLocalId();
    
    // Check permissions
    if (!this.canJoinWorkspace(workspace, localId)) {
      console.log(`Cannot join workspace ${workspace.id}: insufficient permissions`);
      return false;
    }

    // Add to participants
    if (!workspace.participants.some(p => p.id === localId.id)) {
      workspace.participants.push(localId);
      workspace.lastActivity = new Date();
    }

    this.currentWorkspace = workspace;

    // Notify other participants
    await this.broadcastToWorkspace(workspace.id, {
      type: 'workspace:user_joined',
      user: localId,
      timestamp: new Date()
    });

    console.log(`Joined workspace: ${workspace.name}`);
    return true;
  }

  private async requestWorkspaceJoin(workspaceId: string): Promise<boolean> {
    // Broadcast workspace join request
    const sent = await this.broadcast({
      type: 'workspace:join_request',
      workspaceId,
      requestingUser: this.getLocalId(),
      timestamp: new Date()
    });

    if (sent === 0) {
      console.log('No peers available to request workspace join');
      return false;
    }

    // Wait for workspace invitation (timeout after 10 seconds)
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(false);
      }, 10000);

      const handler = (data: any) => {
        if (data.type === 'workspace:invitation' && data.workspaceId === workspaceId) {
          clearTimeout(timeout);
          this.off('message:received', handler);
          
          // Add workspace to our local storage
          this.workspaces.set(workspaceId, data.workspace);
          resolve(this.joinExistingWorkspace(data.workspace));
        }
      };

      this.on('message:received', handler);
    });
  }

  private canJoinWorkspace(workspace: CollaborativeWorkspace, user: SimplePeerId): boolean {
    const permissions = workspace.permissions;
    
    // Check if banned
    if (permissions.bannedUsers.includes(user.id)) {
      return false;
    }

    // Check if at capacity
    if (workspace.participants.length >= permissions.maxParticipants) {
      return false;
    }

    // Check if public or user is allowed
    if (!permissions.public && permissions.allowedUsers && !permissions.allowedUsers.includes(user.id)) {
      return false;
    }

    return permissions.allowJoin;
  }

  async leaveWorkspace(workspaceId?: string): Promise<void> {
    const targetWorkspace = workspaceId ? this.workspaces.get(workspaceId) : this.currentWorkspace;
    if (!targetWorkspace) return;

    const localId = this.getLocalId();
    
    // Remove from participants
    targetWorkspace.participants = targetWorkspace.participants.filter(p => p.id !== localId.id);
    
    // Notify other participants
    await this.broadcastToWorkspace(targetWorkspace.id, {
      type: 'workspace:user_left',
      user: localId,
      timestamp: new Date()
    });

    // Clear current workspace if leaving it
    if (this.currentWorkspace?.id === targetWorkspace.id) {
      this.currentWorkspace = undefined;
    }

    console.log(`Left workspace: ${targetWorkspace.name}`);
  }

  // Task Distribution System
  async submitCollaborativeTask(
    taskType: CollaborativeTask['type'],
    requirements: CollaborativeTaskRequirements,
    payload: any,
    priority: CollaborativeTask['priority'] = 'medium'
  ): Promise<string> {
    const task: CollaborativeTask = {
      id: `collab-task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: taskType,
      requirements,
      priority,
      status: 'pending',
      assignedPeers: [],
      progress: 0,
      payload,
      collaborators: [],
      sharedState: new Map(),
      metadata: {
        submittedAt: new Date(),
        submittedBy: this.getLocalId(),
        workspaceId: this.currentWorkspace?.id
      }
    };

    this.collaborativeTasks.set(task.id, task);
    
    // Try to assign task immediately
    const assigned = await this.assignCollaborativeTask(task);
    
    if (!assigned) {
      // Add to queue if no suitable peers available
      this.taskQueue.push(task);
      console.log(`Collaborative task ${task.id} queued - no suitable peers available`);
    }

    return task.id;
  }

  private async assignCollaborativeTask(task: CollaborativeTask): Promise<boolean> {
    const connectedPeers = this.getConnectedPeers();
    
    // Filter peers based on task requirements
    const suitablePeers = connectedPeers.filter(peer => 
      this.peerMeetsCollaborativeRequirements(peer, task.requirements)
    );

    if (suitablePeers.length === 0) {
      return false;
    }

    // Select optimal peer(s)
    const selectedPeers = this.selectOptimalCollaborativePeers(suitablePeers, task.requirements);
    
    if (selectedPeers.length === 0) {
      return false;
    }

    // Assign task
    task.assignedPeers = selectedPeers.map(peer => ({ id: peer.id.id }));
    task.status = 'assigned';

    // Send task assignment
    for (const peer of selectedPeers) {
      await this.sendCollaborativeTaskAssignment(peer.id.id, task);
    }

    console.log(`Collaborative task ${task.id} assigned to ${selectedPeers.length} peer(s)`);
    return true;
  }

  private peerMeetsCollaborativeRequirements(peer: SimplePeer, requirements: CollaborativeTaskRequirements): boolean {
    const caps = peer.capabilities;

    // Check memory requirement
    if (requirements.memory && caps.resources.availableMemory < requirements.memory) {
      return false;
    }

    // Check compute requirement
    if (requirements.compute && caps.resources.cpuCores < requirements.compute) {
      return false;
    }

    // Check GPU requirement
    if (requirements.gpu && !caps.gpu.available) {
      return false;
    }

    // Check real-time sync capability
    if (requirements.realTimeSync && !caps.operations.distributedCompute) {
      return false;
    }

    // Check latency requirement (simplified check)
    if (requirements.maxLatency && requirements.maxLatency < 100) {
      // For now, assume local network latency is acceptable
      return true;
    }

    return true;
  }

  private selectOptimalCollaborativePeers(candidates: SimplePeer[], requirements: CollaborativeTaskRequirements): SimplePeer[] {
    // Score peers based on capabilities and current load
    const scoredPeers = candidates.map(peer => ({
      peer,
      score: this.calculateCollaborativePeerScore(peer, requirements)
    })).sort((a, b) => b.score - a.score);

    // Select required number of peers
    const requiredPeers = requirements.collaboratorCount || 1;
    return scoredPeers.slice(0, requiredPeers).map(item => item.peer);
  }

  private calculateCollaborativePeerScore(peer: SimplePeer, requirements: CollaborativeTaskRequirements): number {
    let score = 0;
    const caps = peer.capabilities;

    // Base capability scores
    score += caps.resources.cpuCores * 10;
    score += (caps.resources.availableMemory / 1024) * 5;
    score += caps.resources.networkBandwidth;

    // GPU bonus
    if (caps.gpu.available && requirements.gpu) {
      score += 50;
      score += caps.gpu.memory / 100;
    }

    // Real-time sync bonus
    if (caps.operations.distributedCompute && requirements.realTimeSync) {
      score += 30;
    }

    // Current workspace participant bonus
    const presence = this.peerPresence.get(peer.id.id);
    if (presence?.currentWorkspace === this.currentWorkspace?.id) {
      score += 25;
    }

    // Penalize for current load
    const activeTasks = this.getActivePeerCollaborativeTasks(peer.id.id);
    score -= activeTasks * 15;

    return Math.max(score, 0);
  }

  private getActivePeerCollaborativeTasks(peerId: string): number {
    return Array.from(this.collaborativeTasks.values())
      .filter(task => 
        task.assignedPeers.some(assignedId => assignedId.id === peerId) &&
        (task.status === 'assigned' || task.status === 'running')
      ).length;
  }

  private async sendCollaborativeTaskAssignment(peerId: string, task: CollaborativeTask): Promise<void> {
    await this.sendMessage(peerId, {
      type: 'collaborative_task_assignment',
      task: {
        ...task,
        // Don't send full payload in assignment
        payload: undefined,
        payloadSize: JSON.stringify(task.payload).length
      }
    });
  }

  // Real-time Collaboration Support
  async startCollaborativeSession(applicationId: string, workspaceId?: string): Promise<CollaborativeSession> {
    const targetWorkspace = workspaceId ? this.workspaces.get(workspaceId) : this.currentWorkspace;
    if (!targetWorkspace) {
      throw new Error('No workspace available for collaborative session');
    }

    const session: CollaborativeSession = {
      workspaceId: targetWorkspace.id,
      applicationId,
      participants: [this.getLocalId()],
      sharedCursor: new Map(),
      sharedSelection: new Map(),
      operationalTransform: {
        operations: [],
        lastSequenceNumber: 0,
        conflictResolution: 'operational-transform'
      },
      lastSync: new Date()
    };

    const sessionId = `${targetWorkspace.id}-${applicationId}`;
    this.activeSessions.set(sessionId, session);

    // Notify workspace participants
    await this.broadcastToWorkspace(targetWorkspace.id, {
      type: 'collaboration:session_started',
      sessionId,
      applicationId,
      initiator: this.getLocalId(),
      timestamp: new Date()
    });

    return session;
  }

  async joinCollaborativeSession(sessionId: string): Promise<boolean> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return false;
    }

    const localId = this.getLocalId();
    if (!session.participants.some(p => p.id === localId.id)) {
      session.participants.push(localId);
    }

    // Notify other participants
    await this.broadcastToWorkspace(session.workspaceId, {
      type: 'collaboration:user_joined_session',
      sessionId,
      user: localId,
      timestamp: new Date()
    });

    return true;
  }

  async syncCollaborativeOperation(sessionId: string, operation: FileOperation): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Collaborative session ${sessionId} not found`);
    }

    // Add operation to history
    operation.sequenceNumber = ++session.operationalTransform.lastSequenceNumber;
    session.operationalTransform.operations.push(operation);
    session.lastSync = new Date();

    // Broadcast operation to session participants
    await this.broadcastToSessionParticipants(session, {
      type: 'collaboration:operation',
      sessionId,
      operation,
      timestamp: new Date()
    });
  }

  // Presence and Status Management
  private async broadcastPresence(): Promise<void> {
    const presence: PeerPresence = {
      peerId: this.getLocalId().id,
      status: 'online',
      currentWorkspace: this.currentWorkspace?.id,
      lastSeen: new Date(),
      capabilities: this.getLocalCapabilities(),
      location: {
        country: 'Unknown',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };

    await this.broadcast({
      type: 'presence:update',
      presence,
      timestamp: new Date()
    });
  }

  // Utility methods
  protected getLocalCapabilities(): any {
    // Return mock capabilities - in practice this would detect real hardware
    return {
      gpu: { available: true, type: 'webgpu', memory: 4096, computeUnits: 8, supportedFeatures: ['compute'] },
      frameworks: { webgpu: true, webnn: false, onnx: true, tensorflow: false, pytorch: false },
      resources: { cpuCores: 8, totalMemory: 16384, availableMemory: 12288, networkBandwidth: 100, storageSpace: 20480 },
      operations: { inference: true, training: false, modelSharding: true, dataProcessing: true, distributedCompute: true }
    };
  }

  // Message Handling
  private async handleCollaborativeMessage(from: SimplePeerId, message: any): Promise<void> {
    switch (message.type) {
      case 'workspace:join_request':
        await this.handleWorkspaceJoinRequest(from, message);
        break;
      case 'workspace:invitation':
        await this.handleWorkspaceInvitation(from, message);
        break;
      case 'collaborative_task_assignment':
        await this.handleCollaborativeTaskAssignment(from, message);
        break;
      case 'collaboration:operation':
        await this.handleCollaborativeOperation(from, message);
        break;
      case 'presence:update':
        await this.handlePresenceUpdate(from, message);
        break;
      default:
        console.log(`Unknown collaborative message type: ${message.type}`);
    }
  }

  private async handleWorkspaceJoinRequest(from: SimplePeerId, message: any): Promise<void> {
    const { workspaceId } = message;
    const workspace = this.workspaces.get(workspaceId);
    
    if (workspace && this.canJoinWorkspace(workspace, from)) {
      // Send workspace invitation
      await this.sendMessage(from.id, {
        type: 'workspace:invitation',
        workspaceId,
        workspace,
        timestamp: new Date()
      });
    }
  }

  private async handleWorkspaceInvitation(from: SimplePeerId, message: any): Promise<void> {
    // This is handled in requestWorkspaceJoin promise
    console.log(`Received workspace invitation from ${from.id}`);
  }

  private async handleCollaborativeTaskAssignment(from: SimplePeerId, message: any): Promise<void> {
    const { task } = message;
    console.log(`Received collaborative task assignment: ${task.id}`);

    try {
      // Execute the task
      const result = await this.executeCollaborativeTask(task);
      
      // Send result back
      await this.sendMessage(from.id, {
        type: 'collaborative_task_result',
        taskId: task.id,
        result,
        timestamp: new Date()
      });

    } catch (error) {
      console.error(`Error executing collaborative task ${task.id}:`, error);
      await this.sendMessage(from.id, {
        type: 'collaborative_task_error',
        taskId: task.id,
        error: error.message,
        timestamp: new Date()
      });
    }
  }

  private async executeCollaborativeTask(task: CollaborativeTask): Promise<any> {
    console.log(`Executing collaborative task ${task.id} of type ${task.type}`);

    switch (task.type) {
      case 'computation':
        return await this.executeComputationTask(task);
      case 'ai-inference':
        return await this.executeAIInferenceTask(task);
      case 'file-processing':
        return await this.executeFileProcessingTask(task);
      case 'code-execution':
        return await this.executeCodeTask(task);
      case 'collaboration':
        return await this.executeCollaborationTask(task);
      default:
        throw new Error(`Unknown collaborative task type: ${task.type}`);
    }
  }

  private async executeComputationTask(task: CollaborativeTask): Promise<any> {
    // Simulate computational work
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      type: 'computation_result',
      taskId: task.id,
      result: 'Computation completed',
      executionTime: 1000
    };
  }

  private async executeAIInferenceTask(task: CollaborativeTask): Promise<any> {
    // Simulate AI inference
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {
      type: 'ai_inference_result',
      taskId: task.id,
      predictions: [0.8, 0.15, 0.05],
      confidence: 0.85,
      executionTime: 2000
    };
  }

  private async executeFileProcessingTask(task: CollaborativeTask): Promise<any> {
    // Simulate file processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      type: 'file_processing_result',
      taskId: task.id,
      processedFiles: ['file1.txt', 'file2.txt'],
      totalSize: 2048,
      executionTime: 1500
    };
  }

  private async executeCodeTask(task: CollaborativeTask): Promise<any> {
    // Simulate code execution
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      type: 'code_execution_result',
      taskId: task.id,
      output: 'Code executed successfully',
      exitCode: 0,
      executionTime: 500
    };
  }

  private async executeCollaborationTask(task: CollaborativeTask): Promise<any> {
    // Handle collaboration-specific tasks
    return {
      type: 'collaboration_result',
      taskId: task.id,
      message: 'Collaboration task completed',
      participants: task.collaborators || []
    };
  }

  private async handleCollaborativeOperation(from: SimplePeerId, message: any): Promise<void> {
    const { sessionId, operation } = message;
    const session = this.activeSessions.get(sessionId);
    
    if (session) {
      // Apply operational transform logic here
      session.operationalTransform.operations.push(operation);
      session.lastSync = new Date();
      
      console.log(`Applied collaborative operation in session ${sessionId}`);
    }
  }

  private async handlePresenceUpdate(from: SimplePeerId, message: any): Promise<void> {
    const { presence } = message;
    this.peerPresence.set(from.id, presence);
  }

  private async handlePeerConnectedCollaborative(peer: SimplePeer): Promise<void> {
    console.log(`Peer connected for collaboration: ${peer.id.id}`);
    
    // Update presence
    this.peerPresence.set(peer.id.id, {
      peerId: peer.id.id,
      status: 'online',
      lastSeen: new Date(),
      capabilities: peer.capabilities
    });

    // Process any queued collaborative tasks
    await this.processCollaborativeTaskQueue();
  }

  private async handlePeerDisconnectedCollaborative(peer: SimplePeer): Promise<void> {
    console.log(`Peer disconnected from collaboration: ${peer.id.id}`);
    
    // Update presence
    const presence = this.peerPresence.get(peer.id.id);
    if (presence) {
      presence.status = 'offline';
      presence.lastSeen = new Date();
    }

    // Handle task reassignment
    await this.reassignTasksFromDisconnectedPeer(peer.id.id);
  }

  private async processCollaborativeTaskQueue(): Promise<void> {
    const remainingQueue: CollaborativeTask[] = [];
    
    for (const task of this.taskQueue) {
      const assigned = await this.assignCollaborativeTask(task);
      if (!assigned) {
        remainingQueue.push(task);
      }
    }
    
    this.taskQueue = remainingQueue;
  }

  private async reassignTasksFromDisconnectedPeer(peerId: string): Promise<void> {
    const affectedTasks = Array.from(this.collaborativeTasks.values()).filter(task =>
      task.assignedPeers.some(assignedId => assignedId.id === peerId)
    );

    for (const task of affectedTasks) {
      task.assignedPeers = task.assignedPeers.filter(id => id.id !== peerId);
      
      if (task.assignedPeers.length === 0) {
        task.status = 'pending';
        task.progress = 0;
        
        const reassigned = await this.assignCollaborativeTask(task);
        if (!reassigned) {
          this.taskQueue.push(task);
        }
      }
    }
  }

  // Utility methods
  private async broadcastToWorkspace(workspaceId: string, message: any): Promise<void> {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) return;

    for (const participant of workspace.participants) {
      if (participant.id !== this.getLocalId().id) {
        await this.sendMessage(participant.id, message);
      }
    }
  }

  private async broadcastToSessionParticipants(session: CollaborativeSession, message: any): Promise<void> {
    for (const participant of session.participants) {
      if (participant.id !== this.getLocalId().id) {
        await this.sendMessage(participant.id, message);
      }
    }
  }

  private async broadcastWorkspaceAnnouncement(workspace: CollaborativeWorkspace): Promise<void> {
    if (workspace.permissions.public) {
      await this.broadcast({
        type: 'workspace:announcement',
        workspace: {
          id: workspace.id,
          name: workspace.name,
          description: workspace.description,
          participantCount: workspace.participants.length,
          maxParticipants: workspace.permissions.maxParticipants,
          requiresApproval: workspace.permissions.requiresApproval
        },
        timestamp: new Date()
      });
    }
  }

  // Public API Extensions
  getActiveWorkspaces(): CollaborativeWorkspace[] {
    return Array.from(this.workspaces.values());
  }

  getCurrentWorkspace(): CollaborativeWorkspace | undefined {
    return this.currentWorkspace;
  }

  getCollaborativeTasks(): CollaborativeTask[] {
    return Array.from(this.collaborativeTasks.values());
  }

  getPeerPresence(): Map<string, PeerPresence> {
    return this.peerPresence;
  }

  getActiveSessions(): CollaborativeSession[] {
    return Array.from(this.activeSessions.values());
  }

  async waitForCollaborativeTaskCompletion(taskId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const task = this.collaborativeTasks.get(taskId);
      
      if (!task) {
        reject(new Error(`Collaborative task ${taskId} not found`));
        return;
      }
      
      if (task.status === 'completed') {
        resolve(task.result);
        return;
      }
      
      if (task.status === 'failed') {
        reject(new Error(`Collaborative task ${taskId} failed`));
        return;
      }
      
      // Register callback for completion
      this.taskDistributionCallbacks.set(taskId, resolve);
      
      // Set timeout
      setTimeout(() => {
        this.taskDistributionCallbacks.delete(taskId);
        reject(new Error(`Collaborative task ${taskId} timeout`));
      }, 300000); // 5 minute timeout
    });
  }
}

export default CollaborativeP2PManager;