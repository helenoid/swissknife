// SwissKnife Real-time Synchronization Engine
// Handles operational transforms, conflict resolution, and real-time collaboration

export interface SyncOperation {
  id: string;
  type: 'insert' | 'delete' | 'replace' | 'move' | 'format' | 'cursor' | 'selection';
  position: number;
  content?: string;
  length?: number;
  metadata?: any;
  userId: string;
  timestamp: Date;
  vectorClock: VectorClock;
  transformed?: boolean;
}

export interface VectorClock {
  [userId: string]: number;
}

export interface SyncState {
  document: string;
  operations: SyncOperation[];
  vectorClock: VectorClock;
  lastSync: Date;
  conflicts: ConflictRecord[];
}

export interface ConflictRecord {
  id: string;
  operations: SyncOperation[];
  resolution: 'auto' | 'manual' | 'pending';
  resolvedBy?: string;
  timestamp: Date;
}

export interface CursorPosition {
  userId: string;
  position: number;
  anchor?: number;
  color: string;
  userName: string;
  timestamp: Date;
}

export interface DocumentRange {
  start: number;
  end: number;
  userId: string;
  type: 'selection' | 'highlight' | 'comment';
  metadata?: any;
}

export class RealTimeSyncEngine {
  private syncStates: Map<string, SyncState> = new Map();
  private cursors: Map<string, Map<string, CursorPosition>> = new Map();
  private ranges: Map<string, Map<string, DocumentRange>> = new Map();
  private operationHistory: Map<string, SyncOperation[]> = new Map();
  private conflictResolutionCallbacks: Map<string, Function[]> = new Map();
  private syncCallbacks: Map<string, Function[]> = new Map();

  constructor() {
    this.setupPeriodicSync();
  }

  // Document Synchronization
  async initializeDocument(documentId: string, initialContent: string = '', userId: string): Promise<SyncState> {
    const state: SyncState = {
      document: initialContent,
      operations: [],
      vectorClock: { [userId]: 0 },
      lastSync: new Date(),
      conflicts: []
    };

    this.syncStates.set(documentId, state);
    this.cursors.set(documentId, new Map());
    this.ranges.set(documentId, new Map());
    this.operationHistory.set(documentId, []);

    return state;
  }

  async applyOperation(documentId: string, operation: SyncOperation): Promise<SyncState> {
    const state = this.syncStates.get(documentId);
    if (!state) {
      throw new Error(`Document ${documentId} not found`);
    }

    // Update vector clock
    state.vectorClock[operation.userId] = (state.vectorClock[operation.userId] || 0) + 1;
    operation.vectorClock = { ...state.vectorClock };

    // Check for conflicts
    const conflicts = await this.detectConflicts(documentId, operation);
    if (conflicts.length > 0) {
      await this.handleConflicts(documentId, operation, conflicts);
      return state;
    }

    // Transform operation against concurrent operations
    const transformedOperation = await this.transformOperation(documentId, operation);

    // Apply the operation
    await this.executeOperation(state, transformedOperation);

    // Add to operation history
    state.operations.push(transformedOperation);
    const history = this.operationHistory.get(documentId) || [];
    history.push(transformedOperation);
    this.operationHistory.set(documentId, history);

    state.lastSync = new Date();

    // Trigger sync callbacks
    this.triggerSyncCallbacks(documentId, state);

    return state;
  }

  private async detectConflicts(documentId: string, operation: SyncOperation): Promise<SyncOperation[]> {
    const state = this.syncStates.get(documentId);
    if (!state) return [];

    const conflicts: SyncOperation[] = [];

    // Look for concurrent operations that might conflict
    for (const existingOp of state.operations) {
      if (this.operationsConflict(operation, existingOp)) {
        conflicts.push(existingOp);
      }
    }

    return conflicts;
  }

  private operationsConflict(op1: SyncOperation, op2: SyncOperation): boolean {
    // Operations conflict if they:
    // 1. Are from different users
    // 2. Operate on overlapping positions
    // 3. Are concurrent (not causally ordered)

    if (op1.userId === op2.userId) {
      return false;
    }

    // Check if operations are concurrent
    if (!this.areConcurrent(op1.vectorClock, op2.vectorClock)) {
      return false;
    }

    // Check position overlap
    return this.positionsOverlap(op1, op2);
  }

  private areConcurrent(clock1: VectorClock, clock2: VectorClock): boolean {
    // Two operations are concurrent if neither causally precedes the other
    let clock1Greater = false;
    let clock2Greater = false;

    const allUsers = new Set([...Object.keys(clock1), ...Object.keys(clock2)]);

    for (const user of allUsers) {
      const c1 = clock1[user] || 0;
      const c2 = clock2[user] || 0;

      if (c1 > c2) clock1Greater = true;
      if (c2 > c1) clock2Greater = true;
    }

    return clock1Greater && clock2Greater;
  }

  private positionsOverlap(op1: SyncOperation, op2: SyncOperation): boolean {
    const range1 = this.getOperationRange(op1);
    const range2 = this.getOperationRange(op2);

    return !(range1.end <= range2.start || range2.end <= range1.start);
  }

  private getOperationRange(op: SyncOperation): { start: number; end: number } {
    switch (op.type) {
      case 'insert':
        return { start: op.position, end: op.position };
      case 'delete':
        return { start: op.position, end: op.position + (op.length || 0) };
      case 'replace':
        return { start: op.position, end: op.position + (op.length || 0) };
      default:
        return { start: op.position, end: op.position };
    }
  }

  // Operational Transform Implementation
  private async transformOperation(documentId: string, operation: SyncOperation): Promise<SyncOperation> {
    const state = this.syncStates.get(documentId);
    if (!state) return operation;

    let transformedOp = { ...operation };

    // Transform against all operations that came before this one
    for (const existingOp of state.operations) {
      if (this.shouldTransformAgainst(transformedOp, existingOp)) {
        transformedOp = this.transformOperationPair(transformedOp, existingOp);
      }
    }

    transformedOp.transformed = true;
    return transformedOp;
  }

  private shouldTransformAgainst(newOp: SyncOperation, existingOp: SyncOperation): boolean {
    // Transform if the existing operation is causally before or concurrent
    return this.isCaruallyBefore(existingOp.vectorClock, newOp.vectorClock) ||
           this.areConcurrent(existingOp.vectorClock, newOp.vectorClock);
  }

  private isCaruallyBefore(clock1: VectorClock, clock2: VectorClock): boolean {
    const allUsers = new Set([...Object.keys(clock1), ...Object.keys(clock2)]);
    
    for (const user of allUsers) {
      const c1 = clock1[user] || 0;
      const c2 = clock2[user] || 0;
      
      if (c1 > c2) return false;
    }
    
    return true;
  }

  private transformOperationPair(op1: SyncOperation, op2: SyncOperation): SyncOperation {
    // Implement operational transform rules
    const transformed = { ...op1 };

    if (op2.type === 'insert') {
      if (op2.position <= op1.position) {
        transformed.position += op2.content?.length || 0;
      }
    } else if (op2.type === 'delete') {
      if (op2.position < op1.position) {
        transformed.position -= Math.min(op2.length || 0, op1.position - op2.position);
      }
    } else if (op2.type === 'replace') {
      if (op2.position < op1.position) {
        const deletedLength = op2.length || 0;
        const insertedLength = op2.content?.length || 0;
        transformed.position += insertedLength - deletedLength;
      }
    }

    return transformed;
  }

  // Operation Execution
  private async executeOperation(state: SyncState, operation: SyncOperation): Promise<void> {
    switch (operation.type) {
      case 'insert':
        await this.executeInsert(state, operation);
        break;
      case 'delete':
        await this.executeDelete(state, operation);
        break;
      case 'replace':
        await this.executeReplace(state, operation);
        break;
      case 'move':
        await this.executeMove(state, operation);
        break;
      default:
        console.warn(`Unknown operation type: ${operation.type}`);
    }
  }

  private async executeInsert(state: SyncState, operation: SyncOperation): Promise<void> {
    const content = operation.content || '';
    const position = Math.max(0, Math.min(operation.position, state.document.length));
    
    state.document = 
      state.document.slice(0, position) + 
      content + 
      state.document.slice(position);
  }

  private async executeDelete(state: SyncState, operation: SyncOperation): Promise<void> {
    const start = Math.max(0, operation.position);
    const length = operation.length || 0;
    const end = Math.min(start + length, state.document.length);
    
    state.document = 
      state.document.slice(0, start) + 
      state.document.slice(end);
  }

  private async executeReplace(state: SyncState, operation: SyncOperation): Promise<void> {
    const start = Math.max(0, operation.position);
    const length = operation.length || 0;
    const end = Math.min(start + length, state.document.length);
    const content = operation.content || '';
    
    state.document = 
      state.document.slice(0, start) + 
      content + 
      state.document.slice(end);
  }

  private async executeMove(state: SyncState, operation: SyncOperation): Promise<void> {
    // Move operation implementation would be more complex
    // For now, treat as delete + insert
    const length = operation.length || 0;
    const content = state.document.slice(operation.position, operation.position + length);
    
    // Delete from original position
    await this.executeDelete(state, operation);
    
    // Insert at new position (would need target position in metadata)
    const targetPosition = operation.metadata?.targetPosition || 0;
    await this.executeInsert(state, {
      ...operation,
      type: 'insert',
      position: targetPosition,
      content
    });
  }

  // Conflict Resolution
  private async handleConflicts(documentId: string, operation: SyncOperation, conflicts: SyncOperation[]): Promise<void> {
    const conflict: ConflictRecord = {
      id: `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      operations: [operation, ...conflicts],
      resolution: 'pending',
      timestamp: new Date()
    };

    const state = this.syncStates.get(documentId);
    if (state) {
      state.conflicts.push(conflict);
    }

    // Try automatic resolution
    const resolved = await this.attemptAutoResolution(documentId, conflict);
    if (!resolved) {
      // Trigger manual resolution callback
      this.triggerConflictResolutionCallbacks(documentId, conflict);
    }
  }

  private async attemptAutoResolution(documentId: string, conflict: ConflictRecord): Promise<boolean> {
    // Simple auto-resolution strategies
    const operations = conflict.operations;
    
    if (operations.length === 2) {
      const [op1, op2] = operations;
      
      // If operations don't actually overlap, apply both
      if (!this.positionsOverlap(op1, op2)) {
        await this.applyOperation(documentId, op1);
        await this.applyOperation(documentId, op2);
        conflict.resolution = 'auto';
        return true;
      }
      
      // If one is insert and one is delete at same position, prefer insert
      if (op1.type === 'insert' && op2.type === 'delete' && op1.position === op2.position) {
        await this.applyOperation(documentId, op1);
        conflict.resolution = 'auto';
        conflict.resolvedBy = op1.userId;
        return true;
      }
      
      // Timestamp-based resolution (latest wins)
      const laterOp = op1.timestamp > op2.timestamp ? op1 : op2;
      await this.applyOperation(documentId, laterOp);
      conflict.resolution = 'auto';
      conflict.resolvedBy = laterOp.userId;
      return true;
    }
    
    return false;
  }

  // Cursor and Selection Management
  async updateCursor(documentId: string, userId: string, position: number, anchor?: number): Promise<void> {
    const cursors = this.cursors.get(documentId);
    if (!cursors) return;

    const cursor: CursorPosition = {
      userId,
      position,
      anchor,
      color: this.getUserColor(userId),
      userName: userId, // In practice, would be user's display name
      timestamp: new Date()
    };

    cursors.set(userId, cursor);
    this.triggerCursorCallbacks(documentId, cursor);
  }

  async updateSelection(documentId: string, userId: string, start: number, end: number): Promise<void> {
    const ranges = this.ranges.get(documentId);
    if (!ranges) return;

    const range: DocumentRange = {
      start,
      end,
      userId,
      type: 'selection',
      metadata: { timestamp: new Date() }
    };

    ranges.set(`selection-${userId}`, range);
    this.triggerRangeCallbacks(documentId, range);
  }

  getCursors(documentId: string): CursorPosition[] {
    const cursors = this.cursors.get(documentId);
    return cursors ? Array.from(cursors.values()) : [];
  }

  getSelections(documentId: string): DocumentRange[] {
    const ranges = this.ranges.get(documentId);
    if (!ranges) return [];
    
    return Array.from(ranges.values()).filter(range => range.type === 'selection');
  }

  // Synchronization and Persistence
  private setupPeriodicSync(): void {
    setInterval(() => {
      this.performPeriodicSync();
    }, 5000); // Sync every 5 seconds
  }

  private async performPeriodicSync(): Promise<void> {
    for (const [documentId, state] of this.syncStates) {
      if (Date.now() - state.lastSync.getTime() > 30000) { // 30 seconds since last sync
        await this.compactOperationHistory(documentId);
      }
    }
  }

  private async compactOperationHistory(documentId: string): Promise<void> {
    const state = this.syncStates.get(documentId);
    if (!state) return;

    // Remove operations older than 1 hour that have been applied by all users
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    state.operations = state.operations.filter(op => 
      op.timestamp > oneHourAgo || this.isOperationStillNeeded(op, state)
    );

    console.log(`Compacted operation history for document ${documentId}`);
  }

  private isOperationStillNeeded(operation: SyncOperation, state: SyncState): boolean {
    // Check if operation is still needed for transformation
    // This is a simplified check - in practice would be more sophisticated
    return state.conflicts.some(conflict => 
      conflict.operations.includes(operation) && conflict.resolution === 'pending'
    );
  }

  // Utility Methods
  private getUserColor(userId: string): string {
    // Generate consistent color for user
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
      '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43'
    ];
    
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }

  // Event System
  onSync(documentId: string, callback: (state: SyncState) => void): void {
    const callbacks = this.syncCallbacks.get(documentId) || [];
    callbacks.push(callback);
    this.syncCallbacks.set(documentId, callbacks);
  }

  onConflict(documentId: string, callback: (conflict: ConflictRecord) => void): void {
    const callbacks = this.conflictResolutionCallbacks.get(documentId) || [];
    callbacks.push(callback);
    this.conflictResolutionCallbacks.set(documentId, callbacks);
  }

  private triggerSyncCallbacks(documentId: string, state: SyncState): void {
    const callbacks = this.syncCallbacks.get(documentId) || [];
    callbacks.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('Error in sync callback:', error);
      }
    });
  }

  private triggerConflictResolutionCallbacks(documentId: string, conflict: ConflictRecord): void {
    const callbacks = this.conflictResolutionCallbacks.get(documentId) || [];
    callbacks.forEach(callback => {
      try {
        callback(conflict);
      } catch (error) {
        console.error('Error in conflict resolution callback:', error);
      }
    });
  }

  private triggerCursorCallbacks(documentId: string, cursor: CursorPosition): void {
    // Would trigger cursor update callbacks if implemented
    console.log(`Cursor updated for ${cursor.userId} in ${documentId}`);
  }

  private triggerRangeCallbacks(documentId: string, range: DocumentRange): void {
    // Would trigger range update callbacks if implemented
    console.log(`Range updated for ${range.userId} in ${documentId}`);
  }

  // Public API
  getDocumentState(documentId: string): SyncState | undefined {
    return this.syncStates.get(documentId);
  }

  getDocument(documentId: string): string {
    const state = this.syncStates.get(documentId);
    return state?.document || '';
  }

  getOperationHistory(documentId: string, limit: number = 100): SyncOperation[] {
    const history = this.operationHistory.get(documentId) || [];
    return history.slice(-limit);
  }

  getConflicts(documentId: string): ConflictRecord[] {
    const state = this.syncStates.get(documentId);
    return state?.conflicts || [];
  }

  async resolveConflict(documentId: string, conflictId: string, resolution: SyncOperation, resolvedBy: string): Promise<void> {
    const state = this.syncStates.get(documentId);
    if (!state) return;

    const conflict = state.conflicts.find(c => c.id === conflictId);
    if (!conflict) return;

    conflict.resolution = 'manual';
    conflict.resolvedBy = resolvedBy;

    // Apply the resolution
    await this.applyOperation(documentId, resolution);
  }

  // Cleanup
  cleanup(): void {
    this.syncStates.clear();
    this.cursors.clear();
    this.ranges.clear();
    this.operationHistory.clear();
    this.conflictResolutionCallbacks.clear();
    this.syncCallbacks.clear();
  }
}

export default RealTimeSyncEngine;