/**
 * LogManager implementation for SwissKnife
 * Provides centralized logging functionality
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';

/**
 * LogManager singleton
 */
class LogManager {
  constructor(options = {}) {
    this.options = {
      level: 'info',
      console: true,
      file: false,
      ...options
    };
    
    this.fileTransport = !!this.options.file;
    this.consoleTransport = this.options.console !== false;
    this.level = this.options.level || 'info';
    this.logFilePath = options.logFilePath || 'logs/app.log';
    
    // Initialize file logging if enabled
    if (this.fileTransport) {
      this.initFileLogging();
    }
  }
  
  /**
   * Initialize file logging
   */
  async initFileLogging() {
    try {
      // Ensure log directory exists
      const logDir = path.dirname(this.logFilePath);
      await mkdir(logDir, { recursive: true });
      
      // Write empty string to create file if it doesn't exist
      await fs.writeFile(this.logFilePath, '', { flag: 'a' });
    } catch (error) {
      console.error('Failed to initialize file logging:', error);
      this.fileTransport = false;
    }
  }
  
  /**
   * Format log message with timestamp and level
   */
  formatLogMessage(level, ...args) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] ${args.join(' ')}`;
  }
  
  /**
   * Write to log file
   */
  async writeToFile(level, ...args) {
    if (!this.fileTransport) return;
    
    try {
      const formattedMessage = this.formatLogMessage(level, ...args);
      await fs.writeFile(this.logFilePath, formattedMessage + '\n', { flag: 'a' });
    } catch (error) {
      console.error('Error writing to log file:', error);
    }
  }
  
  /**
   * Check if a log level should be displayed based on the current level setting
   */
  isLevelEnabled(level) {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    return levels[level] >= levels[this.level];
  }
  
  /**
   * Get singleton instance
   */
  static getInstance(options) {
    if (!LogManager.instance) {
      LogManager.instance = new LogManager(options);
    }
    return LogManager.instance;
  }
  
  /**
   * Log at error level
   */
  error(...args) {
    if (this.isLevelEnabled('error')) {
      if (this.consoleTransport) {
        console.error(...args);
      }
      if (this.fileTransport) {
        this.writeToFile('error', ...args);
      }
    }
    return this;
  }
  
  /**
   * Log at warning level
   */
  warn(...args) {
    if (this.isLevelEnabled('warn')) {
      if (this.consoleTransport) {
        console.warn(...args);
      }
      if (this.fileTransport) {
        this.writeToFile('warn', ...args);
      }
    }
    return this;
  }
  
  /**
   * Log at info level
   */
  info(...args) {
    if (this.isLevelEnabled('info')) {
      if (this.consoleTransport) {
        console.info(...args);
      }
      if (this.fileTransport) {
        this.writeToFile('info', ...args);
      }
    }
    return this;
  }
  
  /**
   * Log at debug level
   */
  debug(...args) {
    if (this.isLevelEnabled('debug')) {
      if (this.consoleTransport) {
        console.debug(...args);
      }
      if (this.fileTransport) {
        this.writeToFile('debug', ...args);
      }
    }
    return this;
  }
  
  /**
   * Create a child logger with a specific context
   */
  child(context) {
    const childLogger = Object.create(this);
    childLogger.context = context;
    
    // Override log methods to include context
    ['error', 'warn', 'info', 'debug'].forEach(level => {
      childLogger[level] = function(...args) {
        return LogManager.prototype[level].call(
          this, 
          `[${context}]`, 
          ...args
        );
      };
    });
    
    return childLogger;
  }
  
  /**
   * Set transport enabled/disabled
   */
  setTransport(type, enabled) {
    if (type === 'file') {
      this.fileTransport = enabled;
      if (enabled) {
        this.initFileLogging();
      }
    } else if (type === 'console') {
      this.consoleTransport = enabled;
    }
    return this;
  }
  
  /**
   * Set log file path
   */
  setLogFilePath(path) {
    this.logFilePath = path;
    // Re-initialize file logging if it was enabled
    if (this.fileTransport) {
      this.initFileLogging();
    }
    return this;
  }
}

export { LogManager };
