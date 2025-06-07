/**
 * Logging Manager
 *
 * Centralized logging system with support for multiple transports
 * and log levels.
 */
import * as fs from 'fs/promises.js';
import * as path from 'path.js';
import * as util from 'util.js';
export class LogManager {
    constructor(options = {}) {
        this.transports = new Map();
        // File-specific fields
        this.fileTransport = null;
        this.logFilePath = null;
        this.logFileHandle = null;
        this.level = options.level || 'info';
        // Set up console transport if enabled
        if (options.console !== false) {
            this.setTransport('console', this.createConsoleTransport());
        }
        // Set up file transport if enabled
        if (options.file !== false && options.logFilePath) {
            this.setLogFilePath(options.logFilePath);
        }
    }
    /**
     * Get the singleton instance of LogManager
     */
    static getInstance(options = {}) {
        if (!LogManager.instance) {
            LogManager.instance = new LogManager(options);
        }
        return LogManager.instance;
    }
    /**
     * Log a message at the error level
     */
    error(message, ...args) {
        this.logAtLevel('error', message, ...args);
    }
    /**
     * Log a message at the warn level
     */
    warn(message, ...args) {
        this.logAtLevel('warn', message, ...args);
    }
    /**
     * Log a message at the info level
     */
    info(message, ...args) {
        this.logAtLevel('info', message, ...args);
    }
    /**
     * Log a message at the debug level
     */
    debug(message, ...args) {
        this.logAtLevel('debug', message, ...args);
    }
    /**
     * Log a message at the trace level
     */
    trace(message, ...args) {
        this.logAtLevel('trace', message, ...args);
    }
    /**
     * Log a message at the specified level
     */
    logAtLevel(level, message, ...args) {
        // Check if level is enabled
        if (!this.isLevelEnabled(level)) {
            return;
        }
        // Format message with arguments
        const formattedMessage = args.length > 0
            ? util.format(message, ...args)
            : message;
        // Create log entry
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            message: formattedMessage
        };
        // Log to all transports
        this.transports.forEach(transport => {
            try {
                transport.log(entry);
            }
            catch (error) {
                console.error('Error logging to transport:', error);
            }
        });
    }
    /**
     * Create a console transport
     */
    createConsoleTransport() {
        return {
            log: (entry) => {
                const { timestamp, level, message, context } = entry;
                let formattedMessage = `${timestamp} [${level.toUpperCase()}] ${message}`;
                // Add context information if available
                if (context) {
                    const contextStr = JSON.stringify(context);
                    formattedMessage += ` ${contextStr}`;
                }
                switch (level) {
                    case 'error':
                        console.error(formattedMessage);
                        break;
                    case 'warn':
                        console.warn(formattedMessage);
                        break;
                    case 'info':
                        console.info(formattedMessage);
                        break;
                    case 'debug':
                        console.debug(formattedMessage);
                        break;
                    case 'trace':
                        console.log(formattedMessage);
                        break;
                }
            }
        };
    }
    /**
     * Create a file transport
     */
    async createFileTransport(filePath) {
        try {
            // Ensure directory exists
            const dir = path.dirname(filePath);
            await fs.mkdir(dir, { recursive: true });
            // Open file for appending
            this.logFileHandle = await fs.open(filePath, 'a');
            return {
                log: async (entry) => {
                    if (!this.logFileHandle)
                        return;
                    try {
                        const { timestamp, level, message, context } = entry;
                        let formattedMessage = `${timestamp} [${level.toUpperCase()}] ${message}`;
                        // Add context information if available
                        if (context) {
                            const contextStr = JSON.stringify(context);
                            formattedMessage += ` ${contextStr}`;
                        }
                        await this.logFileHandle.write(formattedMessage + '\n');
                    }
                    catch (error) {
                        console.error('Error writing to log file:', error);
                    }
                }
            };
        }
        catch (error) {
            console.error('Error creating file transport:', error);
            return {
                log: () => { } // No-op if file transport creation fails
            };
        }
    }
    /**
     * Set the log file path
     */
    async setLogFilePath(filePath) {
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
    setTransport(name, transport) {
        if (transport === null || transport === false) {
            this.transports.delete(name);
        }
        else if (transport === true) {
            // Activate built-in transport by name
            if (name === 'console') {
                this.transports.set(name, this.createConsoleTransport());
            }
            else if (name === 'file' && this.logFilePath) {
                this.createFileTransport(this.logFilePath).then(transport => {
                    this.fileTransport = transport;
                    this.transports.set(name, transport);
                });
            }
        }
        else {
            this.transports.set(name, transport);
        }
    }
    /**
     * Add a custom transport
     */
    addTransport(name, transport) {
        this.transports.set(name, transport);
    }
    /**
     * Set the log level
     */
    setLevel(level) {
        this.level = level;
    }
    /**
     * Check if a log level is enabled
     */
    isLevelEnabled(level) {
        return LogManager.LOG_LEVELS[level] >= LogManager.LOG_LEVELS[this.level];
    }
    /**
     * Create a child logger with context
     */
    child(context) {
        // Create a new instance with the same settings
        const childLogger = Object.create(this);
        // Override log methods to include context
        childLogger.logAtLevel = (level, message, ...args) => {
            // Check if level is enabled
            if (!this.isLevelEnabled(level)) {
                return;
            }
            // Format message with arguments
            const formattedMessage = args.length > 0
                ? util.format(message, ...args)
                : message;
            // Create log entry with context
            const entry = {
                timestamp: new Date().toISOString(),
                level,
                message: formattedMessage,
                context
            };
            // Log to all transports
            this.transports.forEach(transport => {
                try {
                    transport.log(entry);
                }
                catch (error) {
                    console.error('Error logging to transport:', error);
                }
            });
        };
        return childLogger;
    }
    /**
     * Log with specific context
     */
    withContext(context) {
        return this.child(context);
    }
    /**
     * Format a log message with arguments
     */
    format(message, ...args) {
        return util.format(message, ...args);
    }
}
// Level priorities (higher = more important)
LogManager.LOG_LEVELS = {
    error: 50,
    warn: 40,
    info: 30,
    debug: 20,
    trace: 10
};
