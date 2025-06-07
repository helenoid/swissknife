// src/types/storage.js
/**
 * Storage type definitions for SwissKnife
 * 
 * This file contains JSDoc type definitions for the storage system.
 */

/**
 * @typedef {string} CID - Content Identifier
 */

/**
 * @typedef {Object} StorageItemMetadata
 * @property {string} [contentType] - MIME type of the content
 * @property {number} [size] - Size in bytes
 * @property {number} createdAt - Timestamp of creation
 * @property {number} [updatedAt] - Timestamp of last update
 * @property {string[]} [tags] - Tags for the content
 */

/**
 * @typedef {Object} ListOptions
 * @property {number} [limit] - Maximum number of items to return
 * @property {string} [prefix] - Prefix for filtering items
 * @property {number} [offset] - Starting offset for pagination
 * @property {string|string[]} [tag] - Tag(s) for filtering
 * @property {'createdAt'|'updatedAt'|'size'} [sortBy] - Field to sort by
 * @property {'asc'|'desc'} [sortDirection] - Sort direction
 */

/**
 * @typedef {Object} AddOptions
 * @property {string} [filename] - Name of the file
 * @property {string} [contentType] - MIME type
 * @property {string[]} [tags] - Tags for the content
 * @property {Object} [metadata] - Additional metadata
 * @property {boolean} [pin] - Whether to pin the content
 * @property {boolean} [wrapWithDirectory] - Whether to wrap in a directory
 * @property {boolean} [onlyHash] - Whether to only compute the hash
 */

/**
 * @typedef {Object} IPLDLink
 * @property {string} [name] - Name of the link
 * @property {number} [size] - Size of the linked content
 * @property {CID} cid - CID of the linked content
 */

/**
 * @typedef {Object} StorageConfig
 * @property {'local'|'ipfs'|'mcp'|'s3'} type - Type of storage
 * @property {string} [path] - Local path for file storage
 * @property {string} [gateway] - IPFS gateway URL
 * @property {string} [endpoint] - S3 endpoint URL
 * @property {string} [accessKey] - S3 access key
 * @property {string} [secretKey] - S3 secret key
 * @property {string} [bucket] - S3 bucket name
 */

/**
 * @typedef {Object} StorageOptions
 * @property {StorageConfig} [config] - Storage configuration
 * @property {string} [namespace] - Namespace for the storage
 * @property {number} [cacheSize] - Size of the cache in bytes
 * @property {number} [cacheTTL] - TTL for cache entries in milliseconds
 */

/**
 * @typedef {Object} StorageProvider
 * @property {function(Buffer|string, AddOptions=): Promise<CID>} add - Add content to storage
 * @property {function(CID): Promise<Buffer>} get - Get content from storage
 * @property {function(CID): Promise<boolean>} exists - Check if content exists
 * @property {function(CID): Promise<boolean>} [delete] - Delete content from storage
 * @property {function(CID): Promise<StorageItemMetadata|undefined>} [getMetadata] - Get metadata for content
 * @property {function(CID, Partial<StorageItemMetadata>): Promise<boolean>} [updateMetadata] - Update metadata
 * @property {function(ListOptions=): Promise<{cids: CID[], metadata?: StorageItemMetadata[]}>} [list] - List content
 * @property {function(Object, IPLDLink[]): Promise<CID>} [addNode] - Add IPLD node
 * @property {function(CID): Promise<{data: Object, links: IPLDLink[]}>} [getNode] - Get IPLD node
 * @property {function(CID[], Record<CID, Buffer>): Promise<{carCid: CID, size: number}>} [createCar] - Create CAR archive
 * @property {function(CID): Promise<{roots: CID[], blocks: Record<CID, Buffer>}>} [loadCar] - Load CAR archive
 * @property {function(CID): Promise<ReadableStream>} [getStream] - Get content as stream
 * @property {function(ReadableStream, AddOptions=): Promise<CID>} [addStream] - Add content from stream
 */

/**
 * Storage event types
 * @enum {string}
 */
export const StorageEventType = {
  CONTENT_ADDED: 'content_added',
  CONTENT_RETRIEVED: 'content_retrieved',
  CONTENT_DELETED: 'content_deleted',
  NODE_ADDED: 'node_added',
  NODE_RETRIEVED: 'node_retrieved',
  CAR_CREATED: 'car_created',
  CAR_LOADED: 'car_loaded'
};

export default {
  StorageEventType
};
