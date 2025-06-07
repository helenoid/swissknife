/**
 * Centralized logging management system
 */
class LogManager {
  constructor(options = {}) {
    this.level = options.level || 'info';
    this.enabled = options.enabled !== false;
    this.outputs = options.outputs || ['console'];
    this.format = options.format || 'simple';
    this.metadata = options.metadata || {};
    
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
      trace: 4
    };

    this.logs = []; // Store logs in memory
    this.maxLogs = options.maxLogs || 1000;
  }

  /**
   * Log an error message
   */
  error(message, meta = {}) {
    return this.log('error', message, meta);
  }

  /**
   * Log a warning message
   */
  warn(message, meta = {}) {
    return this.log('warn', message, meta);
  }

  /**
   * Log an info message
   */
  info(message, meta = {}) {
    return this.log('info', message, meta);
  }

  /**
   * Log a debug message
   */
  debug(message, meta = {}) {
    return this.log('debug', message, meta);
  }

  /**
   * Log a trace message
   */
  trace(message, meta = {}) {
    return this.log('trace', message, meta);
  }

  /**
   * Core logging method
   */
  log(level, message, meta = {}) {
    if (!this.enabled) {
      return;
    }

    if (this.levels[level] > this.levels[this.level]) {
      return; // Level too verbose
    }

    const logEntry = {
      level,
      message,
      meta: { ...this.metadata, ...meta },
      timestamp: new Date().toISOString(),
      id: this.generateId()
    };

    // Store in memory
    this.storeLogs(logEntry);

    // Output to configured destinations
    this.output(logEntry);

    return logEntry;
  }

  /**
   * Store logs in memory with rotation
   */
  storeLogs(logEntry) {
    this.logs.push(logEntry);
    
    // Rotate logs if exceeding max
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  /**
   * Output log entry to configured destinations
   */
  output(logEntry) {
    const formatted = this.formatMessage(logEntry);

    for (const output of this.outputs) {
      switch (output) {
        case 'console':
          this.outputToConsole(logEntry, formatted);
          break;
        case 'memory':
          // Already stored in storeLogs
          break;
        default:
          // Custom output handler
          if (typeof output === 'function') {
            output(logEntry, formatted);
          }
      }
    }
  }

  /**
   * Output to console with appropriate method
   */
  outputToConsole(logEntry, formatted) {
    switch (logEntry.level) {
      case 'error':
        console.error(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'debug':
        console.debug(formatted);
        break;
      case 'trace':
        console.trace(formatted);
        break;
      default:
        console.log(formatted);
    }
  }

  /**
   * Format log message
   */
  formatMessage(logEntry) {
    switch (this.format) {
      case 'json':
        return JSON.stringify(logEntry);
      case 'simple':
        return `[${logEntry.timestamp}] ${logEntry.level.toUpperCase()}: ${logEntry.message}`;
      case 'detailed':
        const metaStr = Object.keys(logEntry.meta).length > 0 
          ? ` ${JSON.stringify(logEntry.meta)}` 
          : '';
        return `[${logEntry.timestamp}] ${logEntry.level.toUpperCase()}: ${logEntry.message}${metaStr}`;
      default:
        if (typeof this.format === 'function') {
          return this.format(logEntry);
        }
        return logEntry.message;
    }
  }

  /**
   * Generate unique log ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Set log level
   */
  setLevel(level) {
    if (!(level in this.levels)) {
      throw new Error(`Invalid log level: ${level}`);
    }
    this.level = level;
    return this;
  }

  /**
   * Get current log level
   */
  getLevel() {
    return this.level;
  }

  /**
   * Add output destination
   */
  addOutput(output) {
    if (!this.outputs.includes(output)) {
      this.outputs.push(output);
    }
    return this;
  }

  /**
   * Remove output destination
   */
  removeOutput(output) {
    const index = this.outputs.indexOf(output);
    if (index > -1) {
      this.outputs.splice(index, 1);
    }
    return this;
  }

  /**
   * Set metadata that will be included in all logs
   */
  setMetadata(metadata) {
    this.metadata = metadata;
    return this;
  }

  /**
   * Add to existing metadata
   */
  addMetadata(metadata) {
    this.metadata = { ...this.metadata, ...metadata };
    return this;
  }

  /**
   * Get stored logs
   */
  getLogs(filter = {}) {
    let logs = [...this.logs];

    if (filter.level) {
      logs = logs.filter(log => log.level === filter.level);
    }

    if (filter.since) {
      const since = new Date(filter.since);
      logs = logs.filter(log => new Date(log.timestamp) >= since);
    }

    if (filter.limit) {
      logs = logs.slice(-filter.limit);
    }

    return logs;
  }

  /**
   * Clear stored logs
   */
  clearLogs() {
    this.logs = [];
    return this;
  }

  /**
   * Enable or disable logging
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    return this;
  }

  /**
   * Check if logging is enabled
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Create a child logger with additional metadata
   */
  child(metadata = {}) {
    const childLogger = new LogManager({
      level: this.level,
      enabled: this.enabled,
      outputs: [...this.outputs],
      format: this.format,
      metadata: { ...this.metadata, ...metadata },
      maxLogs: this.maxLogs
    });

    return childLogger;
  }

  /**
   * Create a timer for performance logging
   */
  timer(label, level = 'info') {
    const start = Date.now();
    
    return {
      end: (message = `${label} completed`) => {
        const duration = Date.now() - start;
        this.log(level, message, { duration, label });
        return duration;
      }
    };
  }

  /**
   * Log function execution time
   */
  time(label, fn, level = 'debug') {
    const timer = this.timer(label, level);
    
    try {
      const result = fn();
      timer.end();
      return result;
    } catch (error) {
      timer.end(`${label} failed`);
      throw error;
    }
  }

  /**
   * Log async function execution time
   */
  async timeAsync(label, fn, level = 'debug') {
    const timer = this.timer(label, level);
    
    try {
      const result = await fn();
      timer.end();
      return result;
    } catch (error) {
      timer.end(`${label} failed`);
      throw error;
    }
  }

  /**
   * Get log statistics
   */
  getStats() {
    const stats = {
      total: this.logs.length,
      byLevel: {}
    };

    for (const level of Object.keys(this.levels)) {
      stats.byLevel[level] = this.logs.filter(log => log.level === level).length;
    }

    return stats;
  }
}

module.exports = LogManager;
