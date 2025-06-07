/**
 * Mock implementation of MerkleClock
 */

export class MerkleClock {
  constructor(nodeId) {
    this.nodeId = nodeId;
    this.time = 0;
    this.merkleRoot = '';
    this.clockValues = new Map();
    this.clockValues.set(nodeId, 0);
  }
  
  tick() {
    this.time += 1;
    this.clockValues.set(this.nodeId, this.time);
    this.updateMerkleRoot();
    return this.time;
  }
  
  getTime() {
    return this.time;
  }
  
  getNodeId() {
    return this.nodeId;
  }
  
  updateMerkleRoot() {
    // In a real implementation, this would compute a Merkle tree root
    // For mocking, we'll just concatenate values
    this.merkleRoot = Array.from(this.clockValues.entries())
      .map(([id, time]) => `${id}:${time}`)
      .join(',');
    return this.merkleRoot;
  }
  
  merge(otherClock) {
    // Merge the other clock's values
    for (const [nodeId, time] of otherClock.clockValues.entries()) {
      const currentTime = this.clockValues.get(nodeId) || 0;
      this.clockValues.set(nodeId, Math.max(currentTime, time));
    }
    
    // Update our time to be the maximum of all merged clocks
    this.time = Math.max(
      this.time,
      otherClock.time,
      ...Array.from(this.clockValues.values())
    );
    
    // Update merkle root
    this.updateMerkleRoot();
    
    return this;
  }
  
  getMerkleRoot() {
    return this.merkleRoot;
  }
  
  getHash() {
    // Simple hash implementation for testing
    return `merkle-hash-${this.nodeId}-${this.time}-${this.merkleRoot.replace(/[^a-zA-Z0-9]/g, '')}`;
  }
}

export default MerkleClock;
