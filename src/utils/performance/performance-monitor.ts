/**
 * Performance monitoring and metrics collection
 */

export interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface PerformanceStats {
  totalOperations: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  operations: PerformanceMetric[];
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor | null = null;
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private activeOperations: Map<string, PerformanceMetric> = new Map();

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startOperation(operationId: string, name: string, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      startTime: this.getTime(),
      metadata
    };
    
    this.activeOperations.set(operationId, metric);
  }

  endOperation(operationId: string): number {
    const metric = this.activeOperations.get(operationId);
    if (!metric) {
      throw new Error(`No active operation found with id: ${operationId}`);
    }

    metric.endTime = this.getTime();
    metric.duration = metric.endTime - metric.startTime;

    // Store the completed metric
    if (!this.metrics.has(metric.name)) {
      this.metrics.set(metric.name, []);
    }
    this.metrics.get(metric.name)!.push(metric);

    // Remove from active operations
    this.activeOperations.delete(operationId);

    return metric.duration;
  }

  measure<T>(name: string, operation: () => T, metadata?: Record<string, any>): T {
    const operationId = `measure_${Date.now()}_${Math.random()}`;
    this.startOperation(operationId, name, metadata);
    
    try {
      const result = operation();
      this.endOperation(operationId);
      return result;
    } catch (error) {
      this.endOperation(operationId);
      throw error;
    }
  }

  async measureAsync<T>(name: string, operation: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    const operationId = `measureAsync_${Date.now()}_${Math.random()}`;
    this.startOperation(operationId, name, metadata);
    
    try {
      const result = await operation();
      this.endOperation(operationId);
      return result;
    } catch (error) {
      this.endOperation(operationId);
      throw error;
    }
  }

  getStats(operationName: string): PerformanceStats | null {
    const operations = this.metrics.get(operationName);
    if (!operations || operations.length === 0) {
      return null;
    }

    const durations = operations
      .filter(op => op.duration !== undefined)
      .map(op => op.duration!);

    if (durations.length === 0) {
      return null;
    }

    const totalTime = durations.reduce((sum, duration) => sum + duration, 0);
    const averageTime = totalTime / durations.length;
    const minTime = Math.min(...durations);
    const maxTime = Math.max(...durations);

    return {
      totalOperations: durations.length,
      averageTime,
      minTime,
      maxTime,
      operations: [...operations]
    };
  }

  getAllStats(): Record<string, PerformanceStats> {
    const stats: Record<string, PerformanceStats> = {};
    for (const operationName of this.metrics.keys()) {
      const operationStats = this.getStats(operationName);
      if (operationStats) {
        stats[operationName] = operationStats;
      }
    }
    return stats;
  }

  clearMetrics(operationName?: string): void {
    if (operationName) {
      this.metrics.delete(operationName);
    } else {
      this.metrics.clear();
    }
  }

  getActiveOperations(): string[] {
    return Array.from(this.activeOperations.keys());
  }

  private getTime(): number {
    // Use performance.now() if available for higher precision, fallback to Date.now()
    return typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
  }

  // For testing purposes
  static resetInstance(): void {
    PerformanceMonitor.instance = null;
  }
}
