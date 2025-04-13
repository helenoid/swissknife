/**
 * Storage type definitions for SwissKnife
 * 
 * This file contains type definitions for the storage system.
 */

import { CID, JSONValue } from './common.js';

// Base interface for storage item metadata
export interface StorageItemMetadata {
  contentType?: string;
  size?: number;
  createdAt: number;
  updatedAt?: number;
  tags?: string[];
  [key: string]: any;
}

// Options for listing storage items
export interface ListOptions {
  limit?: number;
  prefix?: string;
  offset?: number;
  tag?: string | string[];
  sortBy?: 'createdAt' | 'updatedAt' | 'size';
  sortDirection?: 'asc' | 'desc';
}

// Storage provider interface
export interface StorageProvider {
  // Basic operations
  add(content: Buffer | string, options?: AddOptions): Promise<CID>;
  get(cid: CID): Promise<Buffer>;
  exists(cid: CID): Promise<boolean>;
  delete?(cid: CID): Promise<boolean>;
  
  // Metadata operations
  getMetadata?(cid: CID): Promise<StorageItemMetadata>;
  updateMetadata?(cid: CID, metadata: Partial<StorageItemMetadata>): Promise<boolean>;
  
  // Listing operations
  list?(options?: ListOptions): Promise<{ cids: CID[], metadata?: StorageItemMetadata[] }>;
  
  // IPLD operations
  addNode?(data: JSONValue, links?: IPLDLink[]): Promise<CID>;
  getNode?(cid: CID): Promise<{ data: JSONValue, links: IPLDLink[] }>;
  
  // CAR operations
  createCar?(roots: CID[], blocks?: Record<CID, Buffer>): Promise<{ carCid: CID, size: number }>;
  loadCar?(carCid: CID): Promise<{ roots: CID[], blocks: Record<CID, Buffer> }>;
  
  // Stream operations
  getStream?(cid: CID): Promise<NodeJS.ReadableStream>;
  addStream?(stream: NodeJS.ReadableStream, options?: AddOptions): Promise<CID>;
}

// Options for adding content to storage
export interface AddOptions {
  contentType?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  pin?: boolean;
  wrapWithDirectory?: boolean;
  onlyHash?: boolean;
}

// IPLD link representation
export interface IPLDLink {
  name?: string;
  size?: number;
  cid: CID;
}

// Storage configuration
export interface StorageConfig {
  type: 'local' | 'ipfs' | 'mcp' | 's3';
  path?: string;
  gateway?: string;
  endpoint?: string;
  accessKey?: string;
  secretKey?: string;
  bucket?: string;
}

// Storage initialization options
export interface StorageOptions {
  config?: StorageConfig;
  namespace?: string;
  cacheSize?: number;
  cacheTTL?: number;
}

// Storage event types
export enum StorageEventType {
  CONTENT_ADDED = 'content_added',
  CONTENT_RETRIEVED = 'content_retrieved',
  CONTENT_DELETED = 'content_deleted',
  NODE_ADDED = 'node_added',
  NODE_RETRIEVED = 'node_retrieved',
  CAR_CREATED = 'car_created',
  CAR_LOADED = 'car_loaded',
  ERROR = 'error'
}

// Storage event
export interface StorageEvent {
  type: StorageEventType;
  cid?: CID;
  size?: number;
  timestamp: number;
  metadata?: Record<string, any>;
  error?: Error;
}