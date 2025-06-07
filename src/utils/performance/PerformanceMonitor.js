/**
 * Performance monitoring utility
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.timers = new Map();
    this.enabled = true;
  }

  /**
   * Start timing an operation
   */
  start(label) {
    if (!this.enabled) return;
    
    this.timers.set(label, {
      startTime: performance.now(),
      startMemory: this.getMemoryUsage()
    });
  }

  /**
   * End timing an operation and record metrics
   */
  end(label) {
    if (!this.enabled) return null;

    const timer = this.timers.get(label);
    if (!timer) {
      throw new Error(`Timer '${label}' not found`);
    }

    const endTime = performance.now();
    const endMemory = this.getMemoryUsage();
    
    const duration = endTime - timer.startTime;
    const memoryDelta = endMemory - timer.startMemory;

    const metric = {
      label,
      duration,
      memoryDelta,
      timestamp: new Date().toISOString()
    };

    // Store metric
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    this.metrics.get(label).push(metric);

    // Clean up timer
    this.timers.delete(label);

    return metric;
  }

  /**
   * Time a function execution
   */
  time(label, fn) {
    this.start(label);
    try {
      const result = fn();
      const metric = this.end(label);
      return { result, metric };
    } catch (error) {
      this.timers.delete(label); // Clean up on error
      throw error;
    }
  }

  /**
   * Time an async function execution
   */
  async timeAsync(label, fn) {
    this.start(label);
    try {
      const result = await fn();
      const metric = this.end(label);
      return { result, metric };
    } catch (error) {
      this.timers.delete(label); // Clean up on error
      throw error;
    }
  }

  /**
   * Get metrics for a specific label
   */
  getMetrics(label) {
    return this.metrics.get(label) || [];
  }

  /**
   * Get all metrics
   */
  getAllMetrics() {
    const result = {};
    for (const [label, metrics] of this.metrics) {
      result[label] = metrics;
    }
    return result;
  }

  /**
   * Get statistics for a label
   */
  getStats(label) {
    const metrics = this.getMetrics(label);
    if (metrics.length === 0) {
      return null;
    }

    const durations = metrics.map(m => m.duration);
    const memoryDeltas = metrics.map(m => m.memoryDelta);

    return {
      count: metrics.length,
      duration: {
        min: Math.min(...durations),
        max: Math.max(...durations),
        avg: durations.reduce((a, b) => a + b, 0) / durations.length,
        total: durations.reduce((a, b) => a + b, 0)
      },
      memory: {
        min: Math.min(...memoryDeltas),
        max: Math.max(...memoryDeltas),
        avg: memoryDeltas.reduce((a, b) => a + b, 0) / memoryDeltas.length,
        total: memoryDeltas.reduce((a, b) => a + b, 0)
      }
    };
  }

  /**
   * Clear metrics for a label or all metrics
   */
  clear(label = null) {
    if (label) {
      this.metrics.delete(label);
    } else {
      this.metrics.clear();
    }
  }

  /**
   * Enable or disable monitoring
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Check if monitoring is enabled
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Get current memory usage
   */
  getMemoryUsage() {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    return 0;
  }

  /**
   * Get current memory info
   */
  getMemoryInfo() {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return {
        rss: usage.rss,
        heapTotal: usage.heapTotal,
        heapUsed: usage.heapUsed,
        external: usage.external
      };
    }
    return null;
  }

  /**
   * Mark a point in time
   */
  mark(label) {
    if (!this.enabled) return;

    const metric = {
      label,
      timestamp: new Date().toISOString(),
      time: performance.now(),
      memory: this.getMemoryUsage()
    };

    if (!this.metrics.has('marks')) {
      this.metrics.set('marks', []);
    }
    this.metrics.get('marks').push(metric);

    return metric;
  }

  /**
   * Get all marks
   */
  getMarks() {
    return this.metrics.get('marks') || [];
  }

  /**
   * Create a decorator for timing methods
   */
  decorator(label) {
    return (target, propertyKey, descriptor) => {
      const originalMethod = descriptor.value;
      
      descriptor.value = async function(...args) {
        const monitor = this.performanceMonitor || new PerformanceMonitor();
        const methodLabel = label || `${target.constructor.name}.${propertyKey}`;
        
        if (originalMethod.constructor.name === 'AsyncFunction') {
          const { result } = await monitor.timeAsync(methodLabel, () => originalMethod.apply(this, args));
          return result;
        } else {
          const { result } = monitor.time(methodLabel, () => originalMethod.apply(this, args));
          return result;
        }
      };

      return descriptor;
    };
  }
}

module.exports = PerformanceMonitor;
