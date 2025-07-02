// Type definitions for FileStorage
// This provides TypeScript type definitions for the FileStorage class

/**
 * Options for initializing FileStorage
 */
export interface FileStorageOptions {
  /**
   * Base path where files will be stored
   */
  basePath: string;
  
  /**
   * Whether to create the directory if it doesn't exist
   */
  createDir?: boolean;
}

/**
 * Metadata for stored content
 */
export interface ContentMetadata {
  /**
   * When the content was created
   */
  created: number;
  
  /**
   * When the content was last accessed
   */
  accessed: number;
  
  /**
   * Content type/MIME type
   */
  contentType?: string;
  
  /**
   * Size of the content in bytes
   */
  size: number;
  
  /**
   * Original filename if provided
   */
  filename?: string;
  
  /**
   * Additional metadata
   */
  [key: string]: any;
}

/**
 * Options for adding content
 */
export interface AddOptions {
  /**
   * Content type/MIME type
   */
  contentType?: string;
  
  /**
   * Original filename
   */
  filename?: string;
  
  /**
   * Additional metadata
   */
  metadata?: Record<string, any>;
}

/**
 * FileStorage class for storing and retrieving content
 */
export class FileStorage {
  /**
   * Creates a new FileStorage instance
   * @param options Options for initializing the storage
   */
  constructor(options: FileStorageOptions);
  
  /**
   * Get the base path where files are stored
   */
  get basePath(): string;
  
  /**
   * Adds content to storage
   * @param content Content to store (string or Buffer)
   * @param options Options for adding content
   * @returns Content ID (CID) for the stored content
   */
  add(content: string | Buffer, options?: AddOptions): Promise<string>;
  
  /**
   * Retrieves content by its CID
   * @param cid Content ID to retrieve
   * @returns Buffer containing the content or null if not found
   */
  get(cid: string): Promise<Buffer | null>;
  
  /**
   * Checks if content with the given CID exists
   * @param cid Content ID to check
   * @returns Whether the content exists
   */
  exists(cid: string): Promise<boolean>;
  
  /**
   * Deletes content with the given CID
   * @param cid Content ID to delete
   * @returns Whether the deletion was successful
   */
  delete(cid: string): Promise<boolean>;
  
  /**
   * Lists all content IDs in storage
   * @returns Array of content IDs
   */
  list(): Promise<string[]>;
  
  /**
   * Gets metadata for content with the given CID
   * @param cid Content ID to get metadata for
   * @returns Metadata for the content or null if not found
   */
  getMetadata(cid: string): Promise<ContentMetadata | null>;
  
  /**
   * Updates metadata for content with the given CID
   * @param cid Content ID to update metadata for
   * @param metadata New metadata (will be merged with existing)
   * @returns Whether the update was successful
   */
  updateMetadata(cid: string, metadata: Partial<ContentMetadata>): Promise<boolean>;
}
