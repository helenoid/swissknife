// SwissKnife Collaborative Workspace Manager
// Manages collaborative workspaces, real-time synchronization, and workspace state

import type { CollaborativeWorkspace, CollaborativeP2PManager, WorkspacePermissions, WorkspaceSettings } from './collaborative-p2p.js'
import type { SimplePeerId } from './simple-p2p.js'

export interface WorkspaceEvent {
  id: string;
  type: 'user_joined' | 'user_left' | 'app_opened' | 'app_closed' | 'state_changed' | 'message_sent';
  workspaceId: string;
  userId: string;
  timestamp: Date;
  data?: any;
}

export interface WorkspaceState {
  sharedVariables: Map<string, any>;
  openApplications: Set<string>;
  userCursors: Map<string, { x: number; y: number; app?: string }>;
  chatHistory: WorkspaceMessage[];
  fileReferences: Map<string, WorkspaceFile>;
  lastSync: Date;
}

export interface WorkspaceMessage {
  id: string;
  userId: string;
  username: string;
  content: string;
  type: 'text' | 'file' | 'code' | 'system';
  timestamp: Date;
  replyTo?: string;
  attachments?: WorkspaceAttachment[];
}

export interface WorkspaceAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  ipfsHash?: string;
}

export interface WorkspaceFile {
  id: string;
  name: string;
  path: string;
  type: string;
  size: number;
  lastModified: Date;
  modifiedBy: string;
  versions: FileVersion[];
  isShared: boolean;
  permissions: FilePermissions;
  ipfsHash?: string;
}

export interface FileVersion {
  id: string;
  timestamp: Date;
  userId: string;
  changes: string;
  hash: string;
}

export interface FilePermissions {
  read: string[];
  write: string[];
  admin: string[];
}

export interface WorkspaceInvitation {
  id: string;
  workspaceId: string;
  workspaceName: string;
  invitedBy: string;
  invitedUser: string;
  expiresAt: Date;
  message?: string;
  permissions: string[];
}

export class WorkspaceManager {
  private p2pManager: CollaborativeP2PManager;
  private workspaceStates: Map<string, WorkspaceState> = new Map();
  private eventHistory: Map<string, WorkspaceEvent[]> = new Map();
  private pendingInvitations: Map<string, WorkspaceInvitation> = new Map();
  private stateUpdateCallbacks: Map<string, Function[]> = new Map();
  private autoSaveIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(p2pManager: CollaborativeP2PManager) {
    this.p2pManager = p2pManager;
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Listen to P2P events for workspace coordination
    this.p2pManager.on('message:received', (data: { from: SimplePeerId; data: any }) => {
      this.handleWorkspaceMessage(data.from, data.data);
    });

    // Listen to workspace changes
    this.p2pManager.on('workspace:user_joined', (data: any) => {
      this.handleUserJoined(data.workspaceId, data.user);
    });

    this.p2pManager.on('workspace:user_left', (data: any) => {
      this.handleUserLeft(data.workspaceId, data.user);
    });
  }

  // Workspace State Management
  async initializeWorkspaceState(workspaceId: string): Promise<WorkspaceState> {
    const state: WorkspaceState = {
      sharedVariables: new Map(),
      openApplications: new Set(),
      userCursors: new Map(),
      chatHistory: [],
      fileReferences: new Map(),
      lastSync: new Date()
    };

    this.workspaceStates.set(workspaceId, state);
    this.eventHistory.set(workspaceId, []);

    // Start auto-save for workspace
    this.startAutoSave(workspaceId);

    return state;
  }

  async getWorkspaceState(workspaceId: string): Promise<WorkspaceState | undefined> {
    return this.workspaceStates.get(workspaceId);
  }

  async updateWorkspaceState(workspaceId: string, updates: Partial<WorkspaceState>): Promise<void> {
    const state = this.workspaceStates.get(workspaceId);
    if (!state) {
      throw new Error(`Workspace state ${workspaceId} not found`);
    }

    // Apply updates
    if (updates.sharedVariables) {
      updates.sharedVariables.forEach((value, key) => {
        state.sharedVariables.set(key, value);
      });
    }

    if (updates.openApplications) {
      state.openApplications = updates.openApplications;
    }

    if (updates.userCursors) {
      updates.userCursors.forEach((cursor, userId) => {
        state.userCursors.set(userId, cursor);
      });
    }

    if (updates.chatHistory) {
      state.chatHistory = updates.chatHistory;
    }

    if (updates.fileReferences) {
      updates.fileReferences.forEach((file, fileId) => {
        state.fileReferences.set(fileId, file);
      });
    }

    state.lastSync = new Date();

    // Broadcast state changes to workspace participants
    await this.broadcastStateUpdate(workspaceId, updates);

    // Trigger callbacks
    this.triggerStateUpdateCallbacks(workspaceId, state);
  }

  // Real-time Collaboration Features
  async setSharedVariable(workspaceId: string, key: string, value: any): Promise<void> {
    const state = this.workspaceStates.get(workspaceId);
    if (!state) {
      throw new Error(`Workspace ${workspaceId} not found`);
    }

    state.sharedVariables.set(key, value);
    state.lastSync = new Date();

    // Broadcast the variable change
    await this.broadcastVariableUpdate(workspaceId, key, value);

    // Record event
    await this.recordEvent(workspaceId, {
      id: `var-${Date.now()}`,
      type: 'state_changed',
      workspaceId,
      userId: this.p2pManager.getLocalId().id,
      timestamp: new Date(),
      data: { variable: key, value }
    });
  }

  async getSharedVariable(workspaceId: string, key: string): Promise<any> {
    const state = this.workspaceStates.get(workspaceId);
    return state?.sharedVariables.get(key);
  }

  async updateUserCursor(workspaceId: string, x: number, y: number, app?: string): Promise<void> {
    const state = this.workspaceStates.get(workspaceId);
    if (!state) return;

    const userId = this.p2pManager.getLocalId().id;
    state.userCursors.set(userId, { x, y, app });

    // Broadcast cursor update (throttled)
    await this.throttledBroadcastCursor(workspaceId, userId, { x, y, app });
  }

  private cursorUpdateThrottles: Map<string, NodeJS.Timeout> = new Map();

  private async throttledBroadcastCursor(workspaceId: string, userId: string, cursor: any): Promise<void> {
    const throttleKey = `${workspaceId}-${userId}`;
    
    // Clear existing throttle
    const existingThrottle = this.cursorUpdateThrottles.get(throttleKey);
    if (existingThrottle) {
      clearTimeout(existingThrottle);
    }

    // Set new throttle (update every 100ms max)
    const newThrottle = setTimeout(async () => {
      await this.broadcastMessage(workspaceId, {
        type: 'workspace:cursor_update',
        userId,
        cursor,
        timestamp: new Date()
      });
      this.cursorUpdateThrottles.delete(throttleKey);
    }, 100);

    this.cursorUpdateThrottles.set(throttleKey, newThrottle);
  }

  // Application Management
  async openApplication(workspaceId: string, applicationId: string): Promise<void> {
    const state = this.workspaceStates.get(workspaceId);
    if (!state) {
      throw new Error(`Workspace ${workspaceId} not found`);
    }

    state.openApplications.add(applicationId);
    state.lastSync = new Date();

    // Broadcast application opening
    await this.broadcastMessage(workspaceId, {
      type: 'workspace:app_opened',
      applicationId,
      userId: this.p2pManager.getLocalId().id,
      timestamp: new Date()
    });

    // Record event
    await this.recordEvent(workspaceId, {
      id: `app-open-${Date.now()}`,
      type: 'app_opened',
      workspaceId,
      userId: this.p2pManager.getLocalId().id,
      timestamp: new Date(),
      data: { applicationId }
    });
  }

  async closeApplication(workspaceId: string, applicationId: string): Promise<void> {
    const state = this.workspaceStates.get(workspaceId);
    if (!state) return;

    state.openApplications.delete(applicationId);
    state.lastSync = new Date();

    // Broadcast application closing
    await this.broadcastMessage(workspaceId, {
      type: 'workspace:app_closed',
      applicationId,
      userId: this.p2pManager.getLocalId().id,
      timestamp: new Date()
    });

    // Record event
    await this.recordEvent(workspaceId, {
      id: `app-close-${Date.now()}`,
      type: 'app_closed',
      workspaceId,
      userId: this.p2pManager.getLocalId().id,
      timestamp: new Date(),
      data: { applicationId }
    });
  }

  // Chat and Communication
  async sendMessage(workspaceId: string, content: string, type: WorkspaceMessage['type'] = 'text'): Promise<WorkspaceMessage> {
    const state = this.workspaceStates.get(workspaceId);
    if (!state) {
      throw new Error(`Workspace ${workspaceId} not found`);
    }

    const message: WorkspaceMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: this.p2pManager.getLocalId().id,
      username: this.p2pManager.getLocalId().id, // In practice, would be user's display name
      content,
      type,
      timestamp: new Date()
    };

    state.chatHistory.push(message);
    state.lastSync = new Date();

    // Broadcast message to workspace
    await this.broadcastMessage(workspaceId, {
      type: 'workspace:chat_message',
      message,
      timestamp: new Date()
    });

    // Record event
    await this.recordEvent(workspaceId, {
      id: `chat-${Date.now()}`,
      type: 'message_sent',
      workspaceId,
      userId: this.p2pManager.getLocalId().id,
      timestamp: new Date(),
      data: { messageId: message.id, messageType: type }
    });

    return message;
  }

  async getChatHistory(workspaceId: string, limit: number = 50): Promise<WorkspaceMessage[]> {
    const state = this.workspaceStates.get(workspaceId);
    if (!state) return [];

    return state.chatHistory.slice(-limit);
  }

  // File Management
  async shareFile(workspaceId: string, filePath: string, permissions: FilePermissions): Promise<WorkspaceFile> {
    const state = this.workspaceStates.get(workspaceId);
    if (!state) {
      throw new Error(`Workspace ${workspaceId} not found`);
    }

    const file: WorkspaceFile = {
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: filePath.split('/').pop() || 'unknown',
      path: filePath,
      type: this.getFileType(filePath),
      size: 0, // Would be populated from actual file
      lastModified: new Date(),
      modifiedBy: this.p2pManager.getLocalId().id,
      versions: [],
      isShared: true,
      permissions
    };

    state.fileReferences.set(file.id, file);
    state.lastSync = new Date();

    // Broadcast file sharing
    await this.broadcastMessage(workspaceId, {
      type: 'workspace:file_shared',
      file,
      timestamp: new Date()
    });

    return file;
  }

  async updateFileVersion(workspaceId: string, fileId: string, changes: string): Promise<void> {
    const state = this.workspaceStates.get(workspaceId);
    if (!state) return;

    const file = state.fileReferences.get(fileId);
    if (!file) return;

    const version: FileVersion = {
      id: `ver-${Date.now()}`,
      timestamp: new Date(),
      userId: this.p2pManager.getLocalId().id,
      changes,
      hash: this.generateHash(changes)
    };

    file.versions.push(version);
    file.lastModified = new Date();
    file.modifiedBy = this.p2pManager.getLocalId().id;

    // Broadcast file update
    await this.broadcastMessage(workspaceId, {
      type: 'workspace:file_updated',
      fileId,
      version,
      timestamp: new Date()
    });
  }

  // Invitation Management
  async inviteUserToWorkspace(workspaceId: string, userId: string, permissions: string[] = ['read'], message?: string): Promise<WorkspaceInvitation> {
    const workspace = this.p2pManager.getActiveWorkspaces().find(w => w.id === workspaceId);
    if (!workspace) {
      throw new Error(`Workspace ${workspaceId} not found`);
    }

    const invitation: WorkspaceInvitation = {
      id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      workspaceId,
      workspaceName: workspace.name,
      invitedBy: this.p2pManager.getLocalId().id,
      invitedUser: userId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      message,
      permissions
    };

    this.pendingInvitations.set(invitation.id, invitation);

    // Send invitation to user
    await this.p2pManager.sendMessage(userId, {
      type: 'workspace:invitation',
      invitation,
      timestamp: new Date()
    });

    return invitation;
  }

  async acceptInvitation(invitationId: string): Promise<boolean> {
    const invitation = this.pendingInvitations.get(invitationId);
    if (!invitation) return false;

    if (invitation.expiresAt < new Date()) {
      this.pendingInvitations.delete(invitationId);
      return false;
    }

    // Join the workspace
    const success = await this.p2pManager.joinWorkspace(invitation.workspaceId);
    if (success) {
      this.pendingInvitations.delete(invitationId);
      
      // Notify the inviter
      await this.p2pManager.sendMessage(invitation.invitedBy, {
        type: 'workspace:invitation_accepted',
        invitationId,
        userId: this.p2pManager.getLocalId().id,
        timestamp: new Date()
      });
    }

    return success;
  }

  // Event and History Management
  private async recordEvent(workspaceId: string, event: WorkspaceEvent): Promise<void> {
    const events = this.eventHistory.get(workspaceId) || [];
    events.push(event);
    
    // Keep only last 1000 events
    if (events.length > 1000) {
      events.splice(0, events.length - 1000);
    }
    
    this.eventHistory.set(workspaceId, events);
  }

  async getWorkspaceEvents(workspaceId: string, limit: number = 100): Promise<WorkspaceEvent[]> {
    const events = this.eventHistory.get(workspaceId) || [];
    return events.slice(-limit);
  }

  // State Synchronization
  private async broadcastStateUpdate(workspaceId: string, updates: Partial<WorkspaceState>): Promise<void> {
    await this.broadcastMessage(workspaceId, {
      type: 'workspace:state_update',
      updates,
      timestamp: new Date()
    });
  }

  private async broadcastVariableUpdate(workspaceId: string, key: string, value: any): Promise<void> {
    await this.broadcastMessage(workspaceId, {
      type: 'workspace:variable_update',
      variable: key,
      value,
      timestamp: new Date()
    });
  }

  private async broadcastMessage(workspaceId: string, message: any): Promise<void> {
    const workspace = this.p2pManager.getActiveWorkspaces().find(w => w.id === workspaceId);
    if (!workspace) return;

    for (const participant of workspace.participants) {
      if (participant.id !== this.p2pManager.getLocalId().id) {
        await this.p2pManager.sendMessage(participant.id, message);
      }
    }
  }

  // Auto-save functionality
  private startAutoSave(workspaceId: string): void {
    const workspace = this.p2pManager.getActiveWorkspaces().find(w => w.id === workspaceId);
    if (!workspace) return;

    const interval = setInterval(async () => {
      await this.saveWorkspaceState(workspaceId);
    }, workspace.settings.autoSaveInterval);

    this.autoSaveIntervals.set(workspaceId, interval);
  }

  private stopAutoSave(workspaceId: string): void {
    const interval = this.autoSaveIntervals.get(workspaceId);
    if (interval) {
      clearInterval(interval);
      this.autoSaveIntervals.delete(workspaceId);
    }
  }

  private async saveWorkspaceState(workspaceId: string): Promise<void> {
    const state = this.workspaceStates.get(workspaceId);
    if (!state) return;

    // In a real implementation, this would save to IPFS or local storage
    console.log(`Auto-saving workspace state for ${workspaceId}`);
    
    // Convert Maps to objects for serialization
    const serializedState = {
      sharedVariables: Object.fromEntries(state.sharedVariables),
      openApplications: Array.from(state.openApplications),
      userCursors: Object.fromEntries(state.userCursors),
      chatHistory: state.chatHistory,
      fileReferences: Object.fromEntries(state.fileReferences),
      lastSync: state.lastSync
    };

    // Store in local storage as a fallback
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`workspace-state-${workspaceId}`, JSON.stringify(serializedState));
    }
  }

  // Message Handling
  private async handleWorkspaceMessage(from: SimplePeerId, message: any): Promise<void> {
    switch (message.type) {
      case 'workspace:state_update':
        await this.handleStateUpdate(message.workspaceId, message.updates);
        break;
      case 'workspace:variable_update':
        await this.handleVariableUpdate(message.workspaceId, message.variable, message.value);
        break;
      case 'workspace:cursor_update':
        await this.handleCursorUpdate(message.workspaceId, message.userId, message.cursor);
        break;
      case 'workspace:chat_message':
        await this.handleChatMessage(message.workspaceId, message.message);
        break;
      case 'workspace:file_shared':
        await this.handleFileShared(message.workspaceId, message.file);
        break;
      case 'workspace:invitation':
        await this.handleInvitationReceived(message.invitation);
        break;
      default:
        console.log(`Unknown workspace message type: ${message.type}`);
    }
  }

  private async handleStateUpdate(workspaceId: string, updates: Partial<WorkspaceState>): Promise<void> {
    const state = this.workspaceStates.get(workspaceId);
    if (!state) return;

    // Apply updates without broadcasting (to avoid loops)
    if (updates.sharedVariables) {
      Object.entries(updates.sharedVariables).forEach(([key, value]) => {
        state.sharedVariables.set(key, value);
      });
    }

    state.lastSync = new Date();
    this.triggerStateUpdateCallbacks(workspaceId, state);
  }

  private async handleVariableUpdate(workspaceId: string, key: string, value: any): Promise<void> {
    const state = this.workspaceStates.get(workspaceId);
    if (!state) return;

    state.sharedVariables.set(key, value);
    state.lastSync = new Date();
    
    this.triggerStateUpdateCallbacks(workspaceId, state);
  }

  private async handleCursorUpdate(workspaceId: string, userId: string, cursor: any): Promise<void> {
    const state = this.workspaceStates.get(workspaceId);
    if (!state) return;

    state.userCursors.set(userId, cursor);
    this.triggerStateUpdateCallbacks(workspaceId, state);
  }

  private async handleChatMessage(workspaceId: string, message: WorkspaceMessage): Promise<void> {
    const state = this.workspaceStates.get(workspaceId);
    if (!state) return;

    state.chatHistory.push(message);
    state.lastSync = new Date();
    
    this.triggerStateUpdateCallbacks(workspaceId, state);
  }

  private async handleFileShared(workspaceId: string, file: WorkspaceFile): Promise<void> {
    const state = this.workspaceStates.get(workspaceId);
    if (!state) return;

    state.fileReferences.set(file.id, file);
    state.lastSync = new Date();
    
    this.triggerStateUpdateCallbacks(workspaceId, state);
  }

  private async handleInvitationReceived(invitation: WorkspaceInvitation): Promise<void> {
    this.pendingInvitations.set(invitation.id, invitation);
    console.log(`Received workspace invitation: ${invitation.workspaceName}`);
  }

  private async handleUserJoined(workspaceId: string, user: SimplePeerId): Promise<void> {
    await this.recordEvent(workspaceId, {
      id: `join-${Date.now()}`,
      type: 'user_joined',
      workspaceId,
      userId: user.id,
      timestamp: new Date()
    });
  }

  private async handleUserLeft(workspaceId: string, user: SimplePeerId): Promise<void> {
    await this.recordEvent(workspaceId, {
      id: `leave-${Date.now()}`,
      type: 'user_left',
      workspaceId,
      userId: user.id,
      timestamp: new Date()
    });

    // Clean up user-specific state
    const state = this.workspaceStates.get(workspaceId);
    if (state) {
      state.userCursors.delete(user.id);
    }
  }

  // Callback Management
  onStateUpdate(workspaceId: string, callback: (state: WorkspaceState) => void): void {
    const callbacks = this.stateUpdateCallbacks.get(workspaceId) || [];
    callbacks.push(callback);
    this.stateUpdateCallbacks.set(workspaceId, callbacks);
  }

  offStateUpdate(workspaceId: string, callback: Function): void {
    const callbacks = this.stateUpdateCallbacks.get(workspaceId) || [];
    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
    }
  }

  private triggerStateUpdateCallbacks(workspaceId: string, state: WorkspaceState): void {
    const callbacks = this.stateUpdateCallbacks.get(workspaceId) || [];
    callbacks.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('Error in state update callback:', error);
      }
    });
  }

  // Utility methods
  private getFileType(filePath: string): string {
    const extension = filePath.split('.').pop()?.toLowerCase();
    const typeMap: { [key: string]: string } = {
      'js': 'javascript',
      'ts': 'typescript',
      'py': 'python',
      'html': 'html',
      'css': 'css',
      'md': 'markdown',
      'json': 'json',
      'txt': 'text',
      'png': 'image',
      'jpg': 'image',
      'gif': 'image',
      'pdf': 'document'
    };
    return typeMap[extension || ''] || 'unknown';
  }

  private generateHash(content: string): string {
    // Simple hash function - in practice would use crypto
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  // Cleanup
  async cleanup(): Promise<void> {
    // Stop all auto-save intervals
    for (const [workspaceId, interval] of this.autoSaveIntervals) {
      clearInterval(interval);
    }
    this.autoSaveIntervals.clear();

    // Clear throttles
    for (const timeout of this.cursorUpdateThrottles.values()) {
      clearTimeout(timeout);
    }
    this.cursorUpdateThrottles.clear();

    // Save all workspace states before cleanup
    for (const workspaceId of this.workspaceStates.keys()) {
      await this.saveWorkspaceState(workspaceId);
    }
  }
}

export default WorkspaceManager;