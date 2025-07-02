/**
 * Logging Manager
 * 
 * Centralized logging system with support for multiple transports
 * and log levels.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as util from 'util';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';

export interface LogOptions {
  logFilePath?: string;
  level?: LogLevel;
  console?: boolean;
  file?: boolean;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  context?: Record<string, any>;
}

export interface LogTransport {
  log(entry: LogEntry): void;
}

export class LogManager {
  private static instance: LogManager;
  private level: LogLevel;
  private transports: Map<string, LogTransport> = new Map();
  
  // File-specific fields
  public fileTransport: LogTransport | null = null;
  private logFilePath: string | null = null;
  private logFileHandle: fs.FileHandle | null = null;
  
  // Level priorities (higher = more important)
  private static readonly LOG_LEVELS: Record<LogLevel, number> = {
    error: 50,
    warn: 40,
    info: 30,
    debug: 20,
    trace: 10
  };
  
  private constructor(options: LogOptions = {}) {
    this.level = options.level || 'info';
    
    // Set up console transport if enabled
    if (options.console !== false) {
      this.addTransport('console', this.createConsoleTransport());
    }
    
    // Set up file transport if enabled
    if (options.file !== false && options.logFilePath) {
      this.setLogFilePath(options.logFilePath);
    }
  }
  
  /**
   * Get the singleton instance of LogManager
   */
  static getInstance(options: LogOptions = {}): LogManager {
    if (!LogManager.instance) {
      LogManager.instance = new LogManager(options);
    }
    return LogManager.instance;
  }
  
  /**
   * Log a message at the error level
   */
  error(message: string, ...args: any[]): void {
    this.logAtLevel('error', message, ...args);
  }
  
  /**
   * Log a message at the warn level
   */
  warn(message: string, ...args: any[]): void {
    this.logAtLevel('warn', message, ...args);
  }
  
  /**
   * Log a message at the info level
   */
  info(message: string, ...args: any[]): void {
    this.logAtLevel('info', message, ...args);
  }
  
  /**
   * Log a message at the debug level
   */
  debug(message: string, ...args: any[]): void {
    this.logAtLevel('debug', message, ...args);
  }
  
  /**
   * Log a message at the trace level
   */
  trace(message: string, ...args: any[]): void {
    this.logAtLevel('trace', message, ...args);
  }
  
  /**
   * Log a message at the specified level
   */
  private logAtLevel(level: LogLevel, message: string, ...args: any[]): void {
    // Check if level is enabled
    if (!this.isLevelEnabled(level)) {
      return;
    }
    
    // Format message with arguments
    const formattedMessage = args.length > 0 
      ? util.format(message, ...args)
      : message;
    
    // Create log entry
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: formattedMessage
    };
    
    // Log to all transports
    this.transports.forEach(transport => {
      try {
        transport.log(entry);
      } catch (error) {
        console.error('Error logging to transport:', error);
      }
    });
  }
  
  /**
   * Create a console transport
   */
  private createConsoleTransport(): LogTransport {
    return {
      log: (entry: LogEntry) => {
        const { timestamp, level, message, context } = entry;
        let formattedMessage = `${timestamp} [${level.toUpperCase()}] ${message}`;
        
        // Add context information if available
        if (context) {
          const contextStr = JSON.stringify(context);
          formattedMessage += ` ${contextStr}`;
        }
        
        switch (level) {
          case 'error':
            console.error(formattedMessage, entry.data || '');
            break;
          case 'warn':
            console.warn(formattedMessage, entry.data || '');
            break;
          case 'info':
            console.info(formattedMessage, entry.data || '');
            break;
          case 'debug':
            console.debug(formattedMessage, entry.data || '');
            break;
          case 'trace':
            console.log(formattedMessage, entry.data || '');
            break;
        }
      }
    };
  }
  
  /**
   * Create a file transport
   */
  private async createFileTransport(filePath: string): Promise<LogTransport> {
    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      
      // Open file for appending
      this.logFileHandle = await fs.open(filePath, 'a');
      
      return {
        log: async (entry: LogEntry) => {
          if (!this.logFileHandle) return;
          
          try {
            const { timestamp, level, message, context } = entry;
            let formattedMessage = `${timestamp} [${level.toUpperCase()}] ${message}`;
            
            // Add context information if available
            if (context) {
              const contextStr = JSON.stringify(context);
              formattedMessage += ` ${contextStr}`;
            }
            
            await this.logFileHandle.write(formattedMessage + '\n');
          } catch (error) {
            console.error('Error writing to log file:', error);
          }
        }
      };
    } catch (error) {
      console.error('Error creating file transport:', error);
      return {
        log: () => {} // No-op if file transport creation fails
      };
    }
  }
  
  /**
   * Set the log file path
   */
  async setLogFilePath(filePath: string): Promise<void> {
    // Close existing file handle if there is one
    if (this.logFileHandle) {
      await this.logFileHandle.close();
      this.logFileHandle = null;
    }
    
    this.logFilePath = filePath;
    this.fileTransport = await this.createFileTransport(filePath);
    this.setTransport('file', this.fileTransport);
  }
  
  /**
   * Set or remove a transport
   */
  setTransport(name: string, transport: LogTransport | null | boolean): void {
    if (transport === null || transport === false) {
      this.transports.delete(name);
    } else if (transport === true) {
      // Activate built-in transport by name
      if (name === 'console') {
        this.transports.set(name, this.createConsoleTransport());
      } else if (name === 'file' && this.logFilePath) {
        this.createFileTransport(this.logFilePath).then(transport => {
          this.fileTransport = transport;
          this.transports.set(name, transport);
        });
      }
    } else {
      this.transports.set(name, transport);
    }
  }
  
  /**
   * Add a custom transport
   */
  addTransport(name: string, transport: LogTransport): void {
    this.transports.set(name, transport);
  }
  
  /**
   * Set the log level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }
  
  /**
   * Check if a log level is enabled
   */
  isLevelEnabled(level: LogLevel): boolean {
    return LogManager.LOG_LEVELS[level] >= LogManager.LOG_LEVELS[this.level];
  }
  
  /**
   * Create a child logger with context
   */
  child(context: Record<string, any>): LogManager {
    // Create a new instance with the same settings
    const childLogger = Object.create(this);
    
    // Override log methods to include context
    childLogger.logAtLevel = (level: LogLevel, message: string, ...args: any[]) => {
      // Check if level is enabled
      if (!this.isLevelEnabled(level)) {
        return;
      }
      
      // Format message with arguments
      const formattedMessage = args.length > 0 
        ? util.format(message, ...args)
        : message;
      
      // Create log entry with context
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        message: formattedMessage,
        context
      };
      
      // Log to all transports
      this.transports.forEach(transport => {
        try {
          transport.log(entry);
        } catch (error) {
          console.error('Error logging to transport:', error);
        }
      });
    };
    
    return childLogger;
  }
  
  /**
   * Log with specific context
   */
  withContext(context: Record<string, any>): LogManager {
    return this.child(context);
  }
  
  /**
   * Format a log message with arguments
   */
  format(message: string, ...args: any[]): string {
    return util.format(message, ...args);
  }
}
