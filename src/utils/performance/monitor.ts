export interface OperationTiming {
  name?: string;
  count: number;
  totalDuration: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  errorCount?: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private operationTimings: { 
    [operation: string]: { 
      totalDuration: number;
      count: number;
      errorCount: number;
      minDuration: number;
      maxDuration: number;
      lastDuration: number;
    } 
  };
  private thresholds: { [operation: string]: number };
  private thresholdHandlers: ((data: { name: string; duration: number; threshold: number }) => void)[];

  private constructor() {
    this.operationTimings = {};
    this.thresholds = {};
    this.thresholdHandlers = [];
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  async measure<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    try {
      const result = await fn();
      const endTime = performance.now();
      this.recordTiming(operation, endTime - startTime);
      return result;
    } catch (error) {
      const endTime = performance.now();
      this.recordTiming(operation, endTime - startTime, true);
      throw error;
    }
  }

  startTiming(operation: string): () => number {
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      this.recordTiming(operation, endTime - startTime);
      return endTime - startTime;
    };
  }
  
  manualTiming(operation: string, duration: number, isError = false): void {
    this.recordTiming(operation, duration, isError);
  }

  private recordTiming(operation: string, duration: number, isError = false) {
    if (!this.operationTimings[operation]) {
      this.operationTimings[operation] = { 
        totalDuration: duration, 
        count: 1, 
        errorCount: isError ? 1 : 0,
        minDuration: duration,
        maxDuration: duration,
        lastDuration: duration
      };
    } else {
      this.operationTimings[operation].lastDuration = duration;
      this.operationTimings[operation].count++;
      this.operationTimings[operation].totalDuration += duration;
      
      // Update min and max durations
      if (duration < this.operationTimings[operation].minDuration) {
        this.operationTimings[operation].minDuration = duration;
      }
      if (duration > this.operationTimings[operation].maxDuration) {
        this.operationTimings[operation].maxDuration = duration;
      }

      if (isError) {
        this.operationTimings[operation].errorCount++;
      }
    }

    this.checkThreshold(operation, duration);
  }

  getOperationTiming(operation: string): OperationTiming | undefined {
    const timing = this.operationTimings[operation];
    if (!timing) return undefined;
    
    return {
      name: operation,
      count: timing.count,
      totalDuration: timing.totalDuration,
      averageDuration: timing.totalDuration / timing.count,
      minDuration: timing.minDuration,
      maxDuration: timing.maxDuration,
      errorCount: timing.errorCount
    };
  }

  getSummary(): OperationTiming[] {
    return Object.entries(this.operationTimings).map(([name, timing]) => ({
      name,
      count: timing.count,
      totalDuration: timing.totalDuration,
      averageDuration: timing.totalDuration / timing.count,
      minDuration: timing.minDuration,
      maxDuration: timing.maxDuration,
      errorCount: timing.errorCount
    }));
  }

  reset(operation?: string): void {
    if (operation) {
      delete this.operationTimings[operation];
    } else {
      this.operationTimings = {};
    }
  }

  setThreshold(operation: string, threshold: number): void {
    this.thresholds[operation] = threshold;
  }

  setThresholdHandler(handler: (data: { name: string; duration: number; threshold: number }) => void): void {
    this.thresholdHandlers.push(handler);
  }

  private checkThreshold(operation: string, duration: number): void {
    const threshold = this.thresholds[operation];
    if (threshold && duration > threshold) {
      this.thresholdHandlers.forEach((handler) => handler({ name: operation, duration, threshold }));
    }
  }
}
