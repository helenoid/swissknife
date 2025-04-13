/**
 * Storage Provider Interface
 * 
 * Defines the common interface for all storage providers.
 */

export type CID = string;

export interface ListOptions {
  prefix?: string;
  limit?: number;
  offset?: number;
  recursive?: boolean;
}

export interface StorageProvider {
  /**
   * Add content to storage
   * @param content The content to add
   * @returns A CID (Content Identifier) for the content
   */
  add(content: string | Buffer): Promise<CID>;
  
  /**
   * Get content from storage by CID
   * @param cid The CID of the content to retrieve
   * @returns The content as a Buffer
   */
  get(cid: CID): Promise<Buffer>;
  
  /**
   * List CIDs in storage
   * @param options Options for listing
   * @returns Array of CIDs
   */
  list(options?: ListOptions): Promise<CID[]>;
  
  /**
   * Delete content from storage
   * @param cid The CID of the content to delete
   * @returns True if deleted, false if not found
   */
  delete(cid: CID): Promise<boolean>;
  
  /**
   * Check if content exists in storage
   * @param cid The CID to check
   * @returns True if exists, false otherwise
   */
  exists(cid: CID): Promise<boolean>;
  
  /**
   * Store a task in storage
   * @param task The task to store
   */
  storeTask(task: any): Promise<void>;
  
  /**
   * Get a task from storage
   * @param taskId The ID of the task to retrieve
   * @returns The task or null if not found
   */
  getTask(taskId: string): Promise<any | null>;
  
  /**
   * Update a task in storage
   * @param task The task to update
   */
  updateTask(task: any): Promise<void>;
  
  /**
   * List tasks in storage
   * @param filter Optional filter criteria
   * @returns Array of tasks
   */
  listTasks(filter?: any): Promise<any[]>;
}