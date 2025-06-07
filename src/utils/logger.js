/**
 * Logging utilities for the SwissKnife application
 * 
 * This module provides consistent logging functionality across the application.
 */

// Log levels in order of verbosity
export const LogLevels = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Current log level (can be overridden via config)
let currentLogLevel = LogLevels.INFO;

/**
 * Set the current log level
 * 
 * @param {number} level The log level to set
 */
export function setLogLevel(level) {
  if (level >= LogLevels.ERROR && level <= LogLevels.DEBUG) {
    currentLogLevel = level;
  }
}

/**
 * Get the current log level
 * 
 * @returns {number} The current log level
 */
export function getLogLevel() {
  return currentLogLevel;
}

/**
 * Format a log message with timestamp and level
 * 
 * @param {string} level The log level
 * @param {string} message The message to log
 * @returns {string} The formatted log message
 */
function formatLogMessage(level, message) {
  const timestamp = new Date().toISOString();
  return `${timestamp} [${level}] ${message}`;
}

/**
 * Log an error message
 * 
 * @param {string} message The message to log
 * @param {Error} [error] Optional error object
 */
export function error(message, error) {
  if (currentLogLevel >= LogLevels.ERROR) {
    const formattedMessage = formatLogMessage('ERROR', message);
    console.error(formattedMessage);
    if (error) {
      console.error(error);
    }
  }
}

/**
 * Log a warning message
 * 
 * @param {string} message The message to log
 */
export function warn(message) {
  if (currentLogLevel >= LogLevels.WARN) {
    const formattedMessage = formatLogMessage('WARN', message);
    console.warn(formattedMessage);
  }
}

/**
 * Log an info message
 * 
 * @param {string} message The message to log
 */
export function info(message) {
  if (currentLogLevel >= LogLevels.INFO) {
    const formattedMessage = formatLogMessage('INFO', message);
    console.info(formattedMessage);
  }
}

/**
 * Log a debug message
 * 
 * @param {string} message The message to log
 */
export function debug(message) {
  if (currentLogLevel >= LogLevels.DEBUG) {
    const formattedMessage = formatLogMessage('DEBUG', message);
    console.debug(formattedMessage);
  }
}

// Export a logger object for convenience
export const logger = {
  error,
  warn,
  info,
  debug,
  setLevel: setLogLevel,
  getLevel: getLogLevel
};