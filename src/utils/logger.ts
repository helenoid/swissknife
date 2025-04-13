// Basic logger utility
// TODO: Enhance with log levels, different transports (console, file), formatting options

enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

// Simple console logger for now
class Logger {
  private log(level: LogLevel, message: string, ...optionalParams: any[]): void {
    const timestamp = new Date().toISOString();
    console[level](`[${timestamp}] [${level.toUpperCase()}] ${message}`, ...optionalParams);
  }

  debug(message: string, ...optionalParams: any[]): void {
    // TODO: Check configured log level before logging
    this.log(LogLevel.DEBUG, message, ...optionalParams);
  }

  info(message: string, ...optionalParams: any[]): void {
    this.log(LogLevel.INFO, message, ...optionalParams);
  }

  warn(message: string, ...optionalParams: any[]): void {
    this.log(LogLevel.WARN, message, ...optionalParams);
  }

  error(message: string, ...optionalParams: any[]): void {
    this.log(LogLevel.ERROR, message, ...optionalParams);
  }
}

// Export a singleton instance
export const logger = new Logger();
