// Mock common dependencies
jest.mock("chalk", () => ({ default: (str) => str, red: (str) => str, green: (str) => str, blue: (str) => str }));
jest.mock("nanoid", () => ({ nanoid: () => "test-id" }));
jest.mock("fs", () => ({ promises: { readFile: jest.fn(), writeFile: jest.fn(), mkdir: jest.fn() } }));
/**
 * Mock bridge implementations for integration testing
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from 'events';
/**
 * Creates a mock bridge implementation for testing
 */
export declare function createMockBridge(id?: string, options?: {
    source?: 'current' | 'goose' | 'ipfs_accelerate' | 'swissknife_old';
    target?: 'current' | 'goose' | 'ipfs_accelerate' | 'swissknife_old';
    methods?: Record<string, (...args: any[]) => any>;
    autoInitialize?: boolean;
}): {
    id: string;
    name: string;
    source: "current" | "goose" | "ipfs_accelerate" | "swissknife_old";
    target: "current" | "goose" | "ipfs_accelerate" | "swissknife_old";
    events: EventEmitter<[never]>;
    callHistory: {
        method: string;
        args: any;
    }[];
    initialize(): Promise<boolean>;
    isInitialized(): boolean;
    call<T>(method: string, args: any): Promise<T>;
};
/**
 * Creates a mock IPFS MCP bridge for testing
 */
export declare function createMockIPFSBridge(): {
    id: string;
    name: string;
    source: "current" | "goose" | "ipfs_accelerate" | "swissknife_old";
    target: "current" | "goose" | "ipfs_accelerate" | "swissknife_old";
    events: EventEmitter<[never]>;
    callHistory: {
        method: string;
        args: any;
    }[];
    initialize(): Promise<boolean>;
    isInitialized(): boolean;
    call<T>(method: string, args: any): Promise<T>;
};
/**
 * Creates a mock Goose bridge for testing
 */
export declare function createMockGooseBridge(): {
    id: string;
    name: string;
    source: "current" | "goose" | "ipfs_accelerate" | "swissknife_old";
    target: "current" | "goose" | "ipfs_accelerate" | "swissknife_old";
    events: EventEmitter<[never]>;
    callHistory: {
        method: string;
        args: any;
    }[];
    initialize(): Promise<boolean>;
    isInitialized(): boolean;
    call<T>(method: string, args: any): Promise<T>;
};
/**
 * Creates a mock TaskNet bridge for testing
 */
export declare function createMockTaskNetBridge(): {
    id: string;
    name: string;
    source: "current" | "goose" | "ipfs_accelerate" | "swissknife_old";
    target: "current" | "goose" | "ipfs_accelerate" | "swissknife_old";
    events: EventEmitter<[never]>;
    callHistory: {
        method: string;
        args: any;
    }[];
    initialize(): Promise<boolean>;
    isInitialized(): boolean;
    call<T>(method: string, args: any): Promise<T>;
};
