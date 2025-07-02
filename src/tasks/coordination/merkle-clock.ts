import * as crypto from 'crypto';

const sha256 = (data: string): Buffer => {
  return crypto.createHash('sha256').update(data).digest();
};

// Simple mock for MerkleTree since merkletreejs is not installed
class SimpleMerkleTree {
  private leaves: Buffer[];
  
  constructor(leaves: Buffer[], _hashFunction: (data: string) => Buffer) {
    this.leaves = leaves;
  }
  
  getRoot(): Buffer {
    if (this.leaves.length === 0) {
      return sha256('');
    }
    // Simple concatenation and hash for demonstration
    const combined = Buffer.concat(this.leaves);
    return sha256(combined.toString('hex'));
  }
}

export class MerkleClock {
  private timestamps: Map<string, number>;
  private localPeerId: string;
  private head: string;
  private logicalTime: number;

  constructor(localPeerId: string) {
    this.timestamps = new Map();
    this.localPeerId = localPeerId;
    this.logicalTime = 0;
    this.timestamps.set(localPeerId, 0);
    this.head = this._calculateHead();
  }

  private _calculateHead(): string {
    const leaves = Array.from(this.timestamps.entries())
      .sort(([peerIdA], [peerIdB]) => peerIdA.localeCompare(peerIdB))
      .map(([peerId, time]) => sha256(`${peerId}:${time}`));
    if (leaves.length === 0) {
      return sha256('').toString('hex');
    }
    const tree = new SimpleMerkleTree(leaves, sha256);
    return tree.getRoot().toString('hex');
  }

  public tick(): void {
    this.logicalTime++;
    const currentTimestamp = this.timestamps.get(this.localPeerId) || 0;
    this.timestamps.set(this.localPeerId, currentTimestamp + 1);
    this.head = this._calculateHead();
  }

  public merge(other: MerkleClock): void {
    const otherTimestamps = other.getTimestamps();
    for (const [peerId, timestamp] of Object.entries(otherTimestamps)) {
      const currentTimestamp = this.timestamps.get(peerId) || 0;
      this.timestamps.set(peerId, Math.max(currentTimestamp, timestamp));
    }
    // Update logical time to be greater than both clocks
    this.logicalTime = Math.max(this.logicalTime, other.getTime()) + 1;
    this.head = this._calculateHead();
  }

  public getNodeId(): string {
    return this.localPeerId;
  }

  public getTime(): number {
    return this.logicalTime;
  }

  public getHash(): string {
    return this.head;
  }

  public compare(other: MerkleClock): 'before' | 'after' | 'equal' | 'concurrent' {
    // Simplified comparison logic for demonstration
    if (this.head === other.head) return 'equal';
    // More complex logic might be needed for 'before', 'after', and 'concurrent'
    return 'concurrent';
  }

  public toJSON(): string {
    return JSON.stringify(Object.fromEntries(this.timestamps));
  }

  public static fromJSON(json: string, localPeerId: string): MerkleClock {
    const data = JSON.parse(json) as Record<string, number>;
    const timestamps = new Map(Object.entries(data).map(([k, v]) => [k, Number(v)]));
    const clock = new MerkleClock(localPeerId);
    clock.timestamps = timestamps;
    clock.head = clock._calculateHead();
    return clock;
  }

  public getTimestamps(): Record<string, number> {
    return Object.fromEntries(this.timestamps);
  }

  public getHead(): string {
    return this.head;
  }
}
