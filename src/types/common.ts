/**
 * Common type definitions for SwissKnife
 * 
 * This file contains type definitions that are used across multiple modules.
 */

// Content-addressable identifier
export type CID = string;

// Unique identifiers for tasks and GoT nodes
export type TaskID = string;
export type GoTNodeID = string;

// Result of an operation that may fail
export interface Result<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Function that returns a promise, used for async handlers
export type AsyncHandler<T, U> = (input: T) => Promise<U>;

// Generic key-value record type
export type KeyValueRecord<T = any> = Record<string, T>;

// JSON serializable primitive types
export type JSONPrimitive = string | number | boolean | null;

// JSON serializable array
export type JSONArray = Array<JSONValue>;

// JSON serializable object
export type JSONObject = { [key: string]: JSONValue };

// Any JSON serializable value
export type JSONValue = JSONPrimitive | JSONObject | JSONArray;

// Metadata with timestamps
export interface Metadata {
  createdAt: number;
  updatedAt: number;
  [key: string]: any;
}

// Options for pagination
export interface PaginationOptions {
  limit?: number;
  offset?: number;
  page?: number;
}

// Sorting direction
export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc'
}

// Options for sorting
export interface SortOptions {
  field: string;
  direction: SortDirection;
}

// Options for filtering
export interface FilterOptions {
  [key: string]: any;
}

// Combined query options
export interface QueryOptions {
  pagination?: PaginationOptions;
  sort?: SortOptions;
  filter?: FilterOptions;
}

// Status of an asynchronous operation
export enum Status {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// Priority levels
export enum Priority {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2,
  CRITICAL = 3
}

// Type guard function to check if a value is a JSON object
export function isJSONObject(value: any): value is JSONObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

// Type guard function to check if a value is a JSON array
export function isJSONArray(value: any): value is JSONArray {
  return Array.isArray(value);
}

// Type guard function to check if a value is a JSON primitive
export function isJSONPrimitive(value: any): value is JSONPrimitive {
  return (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}

// Type guard function to check if a value is JSON serializable
export function isJSONValue(value: any): value is JSONValue {
  if (isJSONPrimitive(value)) return true;
  if (isJSONArray(value)) {
    return value.every(item => isJSONValue(item));
  }
  if (isJSONObject(value)) {
    return Object.values(value).every(item => isJSONValue(item));
  }
  return false;
}
