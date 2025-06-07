// src/storage/backend.ts

/**
 * Represents file statistics, similar to Node's fs.Stats
 */
export interface FileStat {
  isFile: boolean;
  isDirectory: boolean;
  isSymbolicLink?: boolean;
  size: number;
  modifiedTime: Date;
  createdTime?: Date;
  // Additional metadata relevant to specific backends
  metadata?: Record<string, any>;
}

/**
 * Entry in a directory listing
 */
export interface DirEntry {
  name: string;
  path: string;
  isFile: boolean;
  isDirectory: boolean;
  isSymbolicLink?: boolean;
}

/**
 * Information about available space in a storage backend
 */
export interface SpaceInfo {
  total?: number; // Total space in bytes, if applicable
  available?: number; // Available space in bytes, if applicable
  used?: number; // Used space in bytes, if applicable
}

/**
 * Standard error types for storage operations
 */
export enum StorageErrorType {
  NOT_FOUND = 'NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  NOT_A_DIRECTORY = 'NOT_A_DIRECTORY',
  IS_A_DIRECTORY = 'IS_A_DIRECTORY',
  NOT_EMPTY = 'NOT_EMPTY',
  NETWORK_ERROR = 'NETWORK_ERROR',
  BACKEND_SPECIFIC = 'BACKEND_SPECIFIC',
  INVALID_ARGUMENT = 'INVALID_ARGUMENT',
  OPERATION_NOT_SUPPORTED = 'OPERATION_NOT_SUPPORTED',
}

/**
 * Custom error class for storage operations
 */
export class StorageError extends Error {
  readonly type: StorageErrorType;
  readonly cause?: Error;
  
  constructor(message: string, type: StorageErrorType, cause?: Error) {
    super(message);
    this.name = 'StorageError';
    this.type = type;
    this.cause = cause;
  }
  
  static notFound(path: string, cause?: Error): StorageError {
    return new StorageError(`Path not found: ${path}`, StorageErrorType.NOT_FOUND, cause);
  }
  
  static permissionDenied(path: string, cause?: Error): StorageError {
    return new StorageError(`Permission denied: ${path}`, StorageErrorType.PERMISSION_DENIED, cause);
  }
  
  static alreadyExists(path: string, cause?: Error): StorageError {
    return new StorageError(`Path already exists: ${path}`, StorageErrorType.ALREADY_EXISTS, cause);
  }
  
  static notADirectory(path: string, cause?: Error): StorageError {
    return new StorageError(`Not a directory: ${path}`, StorageErrorType.NOT_A_DIRECTORY, cause);
  }
  
  static isADirectory(path: string, cause?: Error): StorageError {
    return new StorageError(`Is a directory: ${path}`, StorageErrorType.IS_A_DIRECTORY, cause);
  }
  
  static notEmpty(path: string, cause?: Error): StorageError {
    return new StorageError(`Directory not empty: ${path}`, StorageErrorType.NOT_EMPTY, cause);
  }
  
  static networkError(message: string, cause?: Error): StorageError {
    return new StorageError(`Network error: ${message}`, StorageErrorType.NETWORK_ERROR, cause);
  }
  
  static backendSpecific(message: string, cause?: Error): StorageError {
    return new StorageError(message, StorageErrorType.BACKEND_SPECIFIC, cause);
  }
  
  static invalidArgument(message: string, cause?: Error): StorageError {
    return new StorageError(`Invalid argument: ${message}`, StorageErrorType.INVALID_ARGUMENT, cause);
  }
  
  static operationNotSupported(operation: string, backend: string, cause?: Error): StorageError {
    return new StorageError(
      `Operation not supported: ${operation} on backend ${backend}`, 
      StorageErrorType.OPERATION_NOT_SUPPORTED,
      cause
    );
  }
}

/**
 * Options for file read operations
 */
export interface ReadFileOptions {
  encoding?: string | null;
}

/**
 * Options for file write operations
 */
export interface WriteFileOptions {
  encoding?: string | null;
  mode?: number;
  flag?: string;
  create?: boolean;
  overwrite?: boolean;
}

/**
 * Common interface for storage backends
 */
export interface StorageBackend {
  /**
   * Unique identifier for this backend instance
   */
  readonly id: string;
  
  /**
   * Display name for this backend
   */
  readonly name: string;
  
  /**
   * Whether this backend is read-only
   */
  readonly isReadOnly: boolean;

  /**
   * Initialize the backend
   */
  init(): Promise<void>;

  /**
   * Check if the backend is initialized
   */
  isInitialized(): boolean;
  
  /**
   * Read the contents of a file
   * @param relativePath - Path relative to the backend root
   * @param options - Read options
   * @returns File content as a Buffer
   * @throws StorageError if the file doesn't exist or cannot be read
   */
  readFile(relativePath: string, options?: ReadFileOptions): Promise<Buffer>;
  
  /**
   * Write content to a file
   * @param relativePath - Path relative to the backend root
   * @param data - Content to write
   * @param options - Write options
   * @throws StorageError if the file cannot be written
   */
  writeFile(relativePath: string, data: Buffer | string, options?: WriteFileOptions): Promise<void>;
  
  /**
   * Check if a path exists
   * @param relativePath - Path relative to the backend root
   * @returns True if the path exists, false otherwise
   */
  exists(relativePath: string): Promise<boolean>;
  
  /**
   * Get file or directory statistics
   * @param relativePath - Path relative to the backend root
   * @returns File statistics
   * @throws StorageError if the path doesn't exist or stats cannot be retrieved
   */
  stat(relativePath: string): Promise<FileStat>;
  
  /**
   * List directory contents
   * @param relativePath - Path relative to the backend root
   * @returns Array of directory entries
   * @throws StorageError if the path doesn't exist or is not a directory
   */
  readdir(relativePath: string): Promise<DirEntry[]>;
  
  /**
   * Create a directory
   * @param relativePath - Path relative to the backend root
   * @param options - Options for directory creation
   * @throws StorageError if the directory cannot be created
   */
  mkdir(relativePath: string, options?: { recursive?: boolean }): Promise<void>;
  
  /**
   * Delete a file
   * @param relativePath - Path relative to the backend root
   * @throws StorageError if the file cannot be deleted
   */
  unlink(relativePath: string): Promise<void>;
  
  /**
   * Delete a directory
   * @param relativePath - Path relative to the backend root
   * @param options - Options for directory removal
   * @throws StorageError if the directory cannot be deleted
   */
  rmdir(relativePath: string, options?: { recursive?: boolean }): Promise<void>;
  
  /**
   * Rename a file or directory
   * @param oldRelativePath - Current path relative to the backend root
   * @param newRelativePath - New path relative to the backend root
   * @throws StorageError if the rename operation fails
   */
  rename(oldRelativePath: string, newRelativePath: string): Promise<void>;
  
  /**
   * Copy a file
   * @param srcRelativePath - Source path relative to the backend root
   * @param destRelativePath - Destination path relative to the backend root
   * @throws StorageError if the copy operation fails
   */
  copyFile(srcRelativePath: string, destRelativePath: string): Promise<void>;
  
  /**
   * Create a readable stream for a file
   * @param relativePath - Path relative to the backend root
   * @param options - Stream options
   * @returns A readable stream
   * @throws StorageError if the stream cannot be created
   */
  createReadStream?(relativePath: string, options?: any): Promise<NodeJS.ReadableStream>;
  
  /**
   * Create a writable stream for a file
   * @param relativePath - Path relative to the backend root
   * @param options - Stream options
   * @returns A writable stream
   * @throws StorageError if the stream cannot be created
   */
  createWriteStream?(relativePath: string, options?: any): Promise<NodeJS.WritableStream>;
  
  /**
   * Get information about available space
   * @returns Space information
   */
  getAvailableSpace?(): Promise<SpaceInfo>;

  /**
   * Remove a file or directory
   * @param relativePath - Path relative to the backend root
   * @param options - Options for removal
   * @throws StorageError if the removal operation fails
   */
  rm(relativePath: string, options?: { recursive?: boolean }): Promise<void>;
}
