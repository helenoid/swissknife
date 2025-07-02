/**
 * Logging manager with file and console output support
 */
import fs from 'fs/promises';
import path from 'path';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface LogConfig {
  logFilePath?: string;
  level?: LogLevel;
  console?: boolean;
  file?: boolean;
  maxFileSize?: number;
  maxFiles?: number;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  metadata?: Record<string, any>;
}

export class LogManager {
  private static instance: LogManager | null = null;
  private config: Required<LogConfig>;
  private logLevels: Record<LogLevel, number> = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
  };

  private constructor(config: LogConfig = {}) {
    this.config = {
      logFilePath: config.logFilePath || './logs/app.log',
      level: config.level || 'info',
      console: config.console ?? true,
      file: config.file ?? true,
      maxFileSize: config.maxFileSize || 10 * 1024 * 1024, // 10MB
      maxFiles: config.maxFiles || 5
    };
  }

  static getInstance(config?: LogConfig): LogManager {
    if (!LogManager.instance) {
      LogManager.instance = new LogManager(config);
    }
    return LogManager.instance;
  }

  async log(level: LogLevel, message: string, metadata?: Record<string, any>): Promise<void> {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata
    };

    if (this.config.console) {
      this.logToConsole(entry);
    }

    if (this.config.file && this.config.logFilePath) {
      await this.logToFile(entry);
    }
  }

  async error(message: string, metadata?: Record<string, any>): Promise<void> {
    await this.log('error', message, metadata);
  }

  async warn(message: string, metadata?: Record<string, any>): Promise<void> {
    await this.log('warn', message, metadata);
  }

  async info(message: string, metadata?: Record<string, any>): Promise<void> {
    await this.log('info', message, metadata);
  }

  async debug(message: string, metadata?: Record<string, any>): Promise<void> {
    await this.log('debug', message, metadata);
  }

  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  getLevel(): LogLevel {
    return this.config.level;
  }

  async getLogs(count?: number): Promise<LogEntry[]> {
    if (!this.config.logFilePath) {
      return [];
    }

    try {
      const content = await fs.readFile(this.config.logFilePath, 'utf-8');
      const lines = content.trim().split('\n').filter(line => line.trim());
      
      const logs: LogEntry[] = [];
      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          logs.push(entry);
        } catch {
          // Skip invalid lines
        }
      }

      if (count) {
        return logs.slice(-count);
      }
      return logs;
    } catch {
      return [];
    }
  }

  async clearLogs(): Promise<void> {
    if (this.config.logFilePath) {
      try {
        await fs.writeFile(this.config.logFilePath, '');
      } catch {
        // Ignore errors
      }
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return this.logLevels[level] <= this.logLevels[this.config.level];
  }

  private logToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp;
    const formattedMessage = `[${timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`;
    
    switch (entry.level) {
      case 'error':
        console.error(formattedMessage, entry.metadata || '');
        break;
      case 'warn':
        console.warn(formattedMessage, entry.metadata || '');
        break;
      case 'info':
        console.info(formattedMessage, entry.metadata || '');
        break;
      case 'debug':
        console.debug(formattedMessage, entry.metadata || '');
        break;
      default:
        console.log(formattedMessage, entry.metadata || '');
    }
  }

  private async logToFile(entry: LogEntry): Promise<void> {
    if (!this.config.logFilePath) {
      return;
    }

    try {
      // Ensure directory exists
      const dir = path.dirname(this.config.logFilePath);
      await fs.mkdir(dir, { recursive: true });

      // Check file size and rotate if needed
      await this.rotateLogIfNeeded();

      // Append log entry
      const logLine = JSON.stringify(entry) + '\n';
      await fs.appendFile(this.config.logFilePath, logLine);
    } catch (error) {
      // Fallback to console if file logging fails
      console.error('Failed to write to log file:', error);
    }
  }

  private async rotateLogIfNeeded(): Promise<void> {
    if (!this.config.logFilePath) {
      return;
    }

    try {
      const stats = await fs.stat(this.config.logFilePath);
      if (stats.size > this.config.maxFileSize) {
        // Rotate logs
        const basePath = this.config.logFilePath.replace(/\.log$/, '');
        const extension = '.log';

        // Move existing rotated logs
        for (let i = this.config.maxFiles - 1; i > 0; i--) {
          const oldFile = `${basePath}.${i}${extension}`;
          const newFile = `${basePath}.${i + 1}${extension}`;
          try {
            await fs.rename(oldFile, newFile);
          } catch {
            // File doesn't exist, continue
          }
        }

        // Move current log to .1
        await fs.rename(this.config.logFilePath, `${basePath}.1${extension}`);
      }
    } catch {
      // File doesn't exist yet, continue
    }
  }

  // For testing purposes
  static resetInstance(): void {
    LogManager.instance = null;
  }
}
