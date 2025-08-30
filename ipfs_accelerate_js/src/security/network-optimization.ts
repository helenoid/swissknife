/**
 * Network Optimization and Monitoring for P2P ML System
 * Provides advanced network optimization, load balancing, and performance monitoring
 */

import { EventEmitter } from 'events';

export interface NetworkMetrics {
  latency: number;
  bandwidth: number;
  packetLoss: number;
  throughput: number;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface PeerPerformance {
  peerId: string;
  responseTime: number;
  reliability: number;
  computeCapability: number;
  networkMetrics: NetworkMetrics;
  lastUpdated: string;
}

export interface LoadBalancingConfig {
  strategy: 'round-robin' | 'least-connections' | 'weighted' | 'adaptive';
  healthCheckInterval: number;
  maxRetries: number;
  timeoutMs: number;
}

export interface OptimizationPolicy {
  enableAdaptiveRouting: boolean;
  preferLocalPeers: boolean;
  bandwidthThreshold: number;
  latencyThreshold: number;
  enableCaching: boolean;
  cacheSize: number;
}

/**
 * Advanced network optimization and monitoring system
 */
export class NetworkOptimizationManager extends EventEmitter {
  private peerPerformance: Map<string, PeerPerformance> = new Map();
  private networkCache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private loadBalancingConfig: LoadBalancingConfig;
  private optimizationPolicy: OptimizationPolicy;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private requestCounter: Map<string, number> = new Map();

  constructor(
    loadBalancingConfig: Partial<LoadBalancingConfig> = {},
    optimizationPolicy: Partial<OptimizationPolicy> = {}
  ) {
    super();
    
    this.loadBalancingConfig = {
      strategy: 'adaptive',
      healthCheckInterval: 30000, // 30 seconds
      maxRetries: 3,
      timeoutMs: 10000, // 10 seconds
      ...loadBalancingConfig
    };

    this.optimizationPolicy = {
      enableAdaptiveRouting: true,
      preferLocalPeers: true,
      bandwidthThreshold: 1000000, // 1MB/s
      latencyThreshold: 100, // 100ms
      enableCaching: true,
      cacheSize: 100 * 1024 * 1024, // 100MB
      ...optimizationPolicy
    };
  }

  /**
   * Initialize network optimization system
   */
  async initialize(): Promise<void> {
    try {
      // Start continuous monitoring
      this.startNetworkMonitoring();
      
      // Initialize cache cleanup
      this.startCacheCleanup();
      
      this.emit('initialized', {
        strategy: this.loadBalancingConfig.strategy,
        cacheEnabled: this.optimizationPolicy.enableCaching
      });
    } catch (error) {
      this.emit('error', { type: 'initialization', error });
      throw new Error(`Failed to initialize network optimization: ${error.message}`);
    }
  }

  /**
   * Register peer and start performance monitoring
   */
  async registerPeer(peerId: string, initialMetrics?: Partial<NetworkMetrics>): Promise<void> {
    const defaultMetrics: NetworkMetrics = {
      latency: 0,
      bandwidth: 0,
      packetLoss: 0,
      throughput: 0,
      connectionQuality: 'fair'
    };

    const peerPerformance: PeerPerformance = {
      peerId,
      responseTime: 0,
      reliability: 1.0,
      computeCapability: 1.0,
      networkMetrics: { ...defaultMetrics, ...initialMetrics },
      lastUpdated: new Date().toISOString()
    };

    this.peerPerformance.set(peerId, peerPerformance);
    this.requestCounter.set(peerId, 0);

    // Start health checks for this peer
    this.startPeerHealthCheck(peerId);

    this.emit('peerRegistered', { peerId, performance: peerPerformance });
  }

  /**
   * Update peer performance metrics
   */
  updatePeerMetrics(peerId: string, metrics: Partial<NetworkMetrics>): void {
    const performance = this.peerPerformance.get(peerId);
    if (!performance) {
      return;
    }

    // Update metrics
    performance.networkMetrics = { ...performance.networkMetrics, ...metrics };
    performance.lastUpdated = new Date().toISOString();

    // Calculate connection quality
    performance.networkMetrics.connectionQuality = this.calculateConnectionQuality(performance.networkMetrics);

    // Update reliability based on recent performance
    this.updatePeerReliability(performance);

    this.emit('metricsUpdated', { peerId, metrics: performance.networkMetrics });
  }

  /**
   * Select optimal peer for a task using load balancing strategy
   */
  selectOptimalPeer(
    availablePeers: string[],
    taskType: 'inference' | 'training' | 'storage',
    taskSize?: number
  ): string | null {
    const eligiblePeers = availablePeers
      .map(peerId => this.peerPerformance.get(peerId))
      .filter(peer => peer && this.isPeerEligible(peer, taskType))
      .sort((a, b) => this.calculatePeerScore(b!, taskType, taskSize) - this.calculatePeerScore(a!, taskType, taskSize));

    if (eligiblePeers.length === 0) {
      return null;
    }

    const selectedPeer = eligiblePeers[0];
    
    // Update request counter for load balancing
    const currentCount = this.requestCounter.get(selectedPeer!.peerId) || 0;
    this.requestCounter.set(selectedPeer!.peerId, currentCount + 1);

    this.emit('peerSelected', {
      peerId: selectedPeer!.peerId,
      taskType,
      score: this.calculatePeerScore(selectedPeer!, taskType, taskSize)
    });

    return selectedPeer!.peerId;
  }

  /**
   * Route request through optimized path
   */
  async routeRequest(
    targetPeer: string,
    requestData: any,
    options: {
      enableRetry?: boolean;
      cacheKey?: string;
      priority?: 'low' | 'normal' | 'high';
    } = {}
  ): Promise<any> {
    const { enableRetry = true, cacheKey, priority = 'normal' } = options;

    // Check cache first
    if (cacheKey && this.optimizationPolicy.enableCaching) {
      const cached = this.getCachedResult(cacheKey);
      if (cached) {
        this.emit('cacheHit', { cacheKey, peerId: targetPeer });
        return cached;
      }
    }

    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < this.loadBalancingConfig.maxRetries) {
      try {
        const startTime = Date.now();
        
        // Simulate network request with optimization
        const result = await this.executeOptimizedRequest(targetPeer, requestData, priority);
        
        const responseTime = Date.now() - startTime;
        
        // Update peer performance
        this.updatePeerResponseTime(targetPeer, responseTime);

        // Cache result if enabled
        if (cacheKey && this.optimizationPolicy.enableCaching) {
          this.cacheResult(cacheKey, result);
        }

        this.emit('requestCompleted', {
          peerId: targetPeer,
          responseTime,
          attempt: attempt + 1,
          cached: false
        });

        return result;
      } catch (error) {
        lastError = error as Error;
        attempt++;
        
        // Update peer reliability on failure
        this.recordPeerFailure(targetPeer);

        if (attempt < this.loadBalancingConfig.maxRetries && enableRetry) {
          // Exponential backoff
          const backoffDelay = Math.min(1000 * Math.pow(2, attempt), 10000);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
          
          this.emit('requestRetry', {
            peerId: targetPeer,
            attempt: attempt + 1,
            error: error.message,
            backoffDelay
          });
        }
      }
    }

    this.emit('requestFailed', {
      peerId: targetPeer,
      attempts: attempt,
      finalError: lastError?.message
    });

    throw lastError || new Error('Request failed after all retries');
  }

  /**
   * Optimize network topology for better performance
   */
  async optimizeNetworkTopology(peers: string[]): Promise<{
    clusters: string[][];
    recommendations: Array<{ type: string; description: string; impact: string }>;
  }> {
    const clusters: string[][] = [];
    const recommendations: Array<{ type: string; description: string; impact: string }> = [];

    // Group peers by performance characteristics
    const highPerformancePeers = peers.filter(peerId => {
      const performance = this.peerPerformance.get(peerId);
      return performance && this.calculatePeerScore(performance, 'inference') > 0.8;
    });

    const mediumPerformancePeers = peers.filter(peerId => {
      const performance = this.peerPerformance.get(peerId);
      return performance && this.calculatePeerScore(performance, 'inference') > 0.5 && 
             this.calculatePeerScore(performance, 'inference') <= 0.8;
    });

    const lowPerformancePeers = peers.filter(peerId => {
      const performance = this.peerPerformance.get(peerId);
      return performance && this.calculatePeerScore(performance, 'inference') <= 0.5;
    });

    if (highPerformancePeers.length > 0) clusters.push(highPerformancePeers);
    if (mediumPerformancePeers.length > 0) clusters.push(mediumPerformancePeers);
    if (lowPerformancePeers.length > 0) clusters.push(lowPerformancePeers);

    // Generate recommendations
    if (highPerformancePeers.length < peers.length * 0.3) {
      recommendations.push({
        type: 'performance',
        description: 'Consider upgrading network infrastructure or peer hardware',
        impact: 'High - would significantly improve overall network performance'
      });
    }

    if (lowPerformancePeers.length > peers.length * 0.4) {
      recommendations.push({
        type: 'load-balancing',
        description: 'Implement more aggressive load balancing to avoid overloading high-performance peers',
        impact: 'Medium - would distribute load more evenly'
      });
    }

    this.emit('topologyOptimized', { clusters, recommendations });

    return { clusters, recommendations };
  }

  /**
   * Generate comprehensive network performance report
   */
  generatePerformanceReport(): {
    overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
    totalPeers: number;
    averageLatency: number;
    averageThroughput: number;
    reliabilityScore: number;
    topPerformers: PeerPerformance[];
    bottlenecks: Array<{ peerId: string; issue: string; severity: string }>;
    recommendations: Array<{ category: string; suggestion: string; priority: string }>;
  } {
    const peers = Array.from(this.peerPerformance.values());
    const totalPeers = peers.length;

    if (totalPeers === 0) {
      return {
        overallHealth: 'poor',
        totalPeers: 0,
        averageLatency: 0,
        averageThroughput: 0,
        reliabilityScore: 0,
        topPerformers: [],
        bottlenecks: [],
        recommendations: [{ category: 'connectivity', suggestion: 'No peers connected', priority: 'critical' }]
      };
    }

    // Calculate aggregate metrics
    const averageLatency = peers.reduce((sum, peer) => sum + peer.networkMetrics.latency, 0) / totalPeers;
    const averageThroughput = peers.reduce((sum, peer) => sum + peer.networkMetrics.throughput, 0) / totalPeers;
    const reliabilityScore = peers.reduce((sum, peer) => sum + peer.reliability, 0) / totalPeers;

    // Determine overall health
    let overallHealth: 'excellent' | 'good' | 'fair' | 'poor' = 'poor';
    if (reliabilityScore > 0.9 && averageLatency < 50) overallHealth = 'excellent';
    else if (reliabilityScore > 0.8 && averageLatency < 100) overallHealth = 'good';
    else if (reliabilityScore > 0.6 && averageLatency < 200) overallHealth = 'fair';

    // Identify top performers
    const topPerformers = peers
      .sort((a, b) => this.calculatePeerScore(b, 'inference') - this.calculatePeerScore(a, 'inference'))
      .slice(0, 5);

    // Identify bottlenecks
    const bottlenecks: Array<{ peerId: string; issue: string; severity: string }> = [];
    peers.forEach(peer => {
      if (peer.networkMetrics.latency > this.optimizationPolicy.latencyThreshold) {
        bottlenecks.push({
          peerId: peer.peerId,
          issue: `High latency: ${peer.networkMetrics.latency}ms`,
          severity: peer.networkMetrics.latency > 500 ? 'critical' : 'warning'
        });
      }
      if (peer.reliability < 0.7) {
        bottlenecks.push({
          peerId: peer.peerId,
          issue: `Low reliability: ${(peer.reliability * 100).toFixed(1)}%`,
          severity: peer.reliability < 0.5 ? 'critical' : 'warning'
        });
      }
    });

    // Generate recommendations
    const recommendations: Array<{ category: string; suggestion: string; priority: string }> = [];
    
    if (averageLatency > this.optimizationPolicy.latencyThreshold) {
      recommendations.push({
        category: 'performance',
        suggestion: 'Enable adaptive routing to reduce average latency',
        priority: 'high'
      });
    }

    if (reliabilityScore < 0.8) {
      recommendations.push({
        category: 'reliability',
        suggestion: 'Implement peer redundancy and health monitoring',
        priority: 'high'
      });
    }

    if (!this.optimizationPolicy.enableCaching) {
      recommendations.push({
        category: 'optimization',
        suggestion: 'Enable caching to improve response times',
        priority: 'medium'
      });
    }

    return {
      overallHealth,
      totalPeers,
      averageLatency,
      averageThroughput,
      reliabilityScore,
      topPerformers,
      bottlenecks,
      recommendations
    };
  }

  /**
   * Update optimization policy
   */
  updateOptimizationPolicy(newPolicy: Partial<OptimizationPolicy>): void {
    this.optimizationPolicy = { ...this.optimizationPolicy, ...newPolicy };
    
    if (!newPolicy.enableCaching) {
      this.clearCache();
    }

    this.emit('policyUpdated', { policy: this.optimizationPolicy });
  }

  /**
   * Clear performance data for a peer
   */
  removePeer(peerId: string): void {
    this.peerPerformance.delete(peerId);
    this.requestCounter.delete(peerId);
    this.emit('peerRemoved', { peerId });
  }

  /**
   * Stop all monitoring and cleanup
   */
  destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    this.clearCache();
    this.peerPerformance.clear();
    this.requestCounter.clear();
    
    this.emit('destroyed');
  }

  // Private methods
  private startNetworkMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.performHealthChecks();
      this.cleanupStaleData();
      this.optimizeCache();
    }, this.loadBalancingConfig.healthCheckInterval);
  }

  private startCacheCleanup(): void {
    setInterval(() => {
      this.cleanupExpiredCache();
    }, 60000); // Every minute
  }

  private async startPeerHealthCheck(peerId: string): Promise<void> {
    // Simulate health check
    const performance = this.peerPerformance.get(peerId);
    if (performance) {
      // Update with simulated metrics
      const metrics = await this.measurePeerMetrics(peerId);
      this.updatePeerMetrics(peerId, metrics);
    }
  }

  private async measurePeerMetrics(peerId: string): Promise<Partial<NetworkMetrics>> {
    // Simulate network measurement
    return {
      latency: Math.random() * 200,
      bandwidth: Math.random() * 10000000,
      packetLoss: Math.random() * 0.05,
      throughput: Math.random() * 5000000
    };
  }

  private calculateConnectionQuality(metrics: NetworkMetrics): 'excellent' | 'good' | 'fair' | 'poor' {
    if (metrics.latency < 50 && metrics.packetLoss < 0.01) return 'excellent';
    if (metrics.latency < 100 && metrics.packetLoss < 0.02) return 'good';
    if (metrics.latency < 200 && metrics.packetLoss < 0.05) return 'fair';
    return 'poor';
  }

  private isPeerEligible(peer: PeerPerformance, taskType: string): boolean {
    return peer.reliability > 0.5 && 
           peer.networkMetrics.connectionQuality !== 'poor' &&
           peer.networkMetrics.latency < this.optimizationPolicy.latencyThreshold;
  }

  private calculatePeerScore(peer: PeerPerformance, taskType: string, taskSize?: number): number {
    let score = 0;

    // Base score from reliability
    score += peer.reliability * 0.3;

    // Network performance score
    const latencyScore = Math.max(0, 1 - (peer.networkMetrics.latency / 1000));
    const throughputScore = Math.min(1, peer.networkMetrics.throughput / 1000000);
    score += (latencyScore * 0.3 + throughputScore * 0.2);

    // Compute capability score
    score += peer.computeCapability * 0.2;

    // Load balancing - prefer less busy peers
    const requestCount = this.requestCounter.get(peer.peerId) || 0;
    const loadScore = Math.max(0, 1 - (requestCount / 100));
    score += loadScore * 0.1;

    return Math.min(1, score);
  }

  private updatePeerReliability(performance: PeerPerformance): void {
    // Simple exponential moving average
    const alpha = 0.1;
    const currentReliability = performance.networkMetrics.connectionQuality === 'poor' ? 0.5 : 1.0;
    performance.reliability = alpha * currentReliability + (1 - alpha) * performance.reliability;
  }

  private updatePeerResponseTime(peerId: string, responseTime: number): void {
    const performance = this.peerPerformance.get(peerId);
    if (performance) {
      performance.responseTime = responseTime;
      this.updatePeerMetrics(peerId, { latency: responseTime });
    }
  }

  private recordPeerFailure(peerId: string): void {
    const performance = this.peerPerformance.get(peerId);
    if (performance) {
      performance.reliability *= 0.9; // Reduce reliability on failure
      this.emit('peerFailure', { peerId, newReliability: performance.reliability });
    }
  }

  private async executeOptimizedRequest(peerId: string, requestData: any, priority: string): Promise<any> {
    // Simulate optimized request execution
    const performance = this.peerPerformance.get(peerId);
    if (!performance) {
      throw new Error(`Peer ${peerId} not found`);
    }

    // Simulate request based on peer performance
    const delay = performance.networkMetrics.latency + Math.random() * 100;
    await new Promise(resolve => setTimeout(resolve, delay));

    if (Math.random() < (1 - performance.reliability)) {
      throw new Error('Simulated network error');
    }

    return { success: true, data: 'response', peerId, delay };
  }

  private getCachedResult(cacheKey: string): any | null {
    const cached = this.networkCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    if (cached) {
      this.networkCache.delete(cacheKey);
    }
    return null;
  }

  private cacheResult(cacheKey: string, result: any, ttl: number = 300000): void {
    // Check cache size limit
    const currentSize = this.networkCache.size * 1000; // Rough estimate
    if (currentSize > this.optimizationPolicy.cacheSize) {
      this.evictOldestCacheEntries();
    }

    this.networkCache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
      ttl
    });
  }

  private clearCache(): void {
    this.networkCache.clear();
    this.emit('cacheCleared');
  }

  private cleanupExpiredCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.networkCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.networkCache.delete(key);
      }
    }
  }

  private evictOldestCacheEntries(): void {
    const entries = Array.from(this.networkCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest 25% of entries
    const toRemove = Math.ceil(entries.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      this.networkCache.delete(entries[i][0]);
    }
  }

  private performHealthChecks(): void {
    for (const peerId of this.peerPerformance.keys()) {
      this.startPeerHealthCheck(peerId);
    }
  }

  private cleanupStaleData(): void {
    const staleThreshold = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();
    
    for (const [peerId, performance] of this.peerPerformance.entries()) {
      if (now - new Date(performance.lastUpdated).getTime() > staleThreshold) {
        this.emit('peerStale', { peerId });
        // Could mark as stale or remove entirely
      }
    }
  }

  private optimizeCache(): void {
    // Could implement intelligent prefetching or cache warming here
    this.emit('cacheOptimized', { size: this.networkCache.size });
  }
}

export default NetworkOptimizationManager;