/**
 * Mock storage provider implementation for testing
 */
/// <reference types="node" resolution-mode="require"/>
/// <reference types="node" resolution-mode="require"/>
/**
 * Interface representing a content-addressable storage provider
 */
export interface MockStorageProvider {
    add(content: string | Buffer): Promise<string>;
    get(cid: string): Promise<Buffer>;
    list(options?: {
        prefix?: string;
        limit?: number;
        recursive?: boolean;
    }): Promise<string[]>;
    delete(cid: string): Promise<boolean>;
    exists(cid: string): Promise<boolean>;
    storeTask(task: any): Promise<void>;
    getTask(taskId: string): Promise<any | null>;
    updateTask(task: any): Promise<void>;
    listTasks(filter?: any): Promise<any[]>;
    clear(): Promise<void>;
    stats(): {
        size: number;
        items: number;
    };
}
/**
 * Creates a mock in-memory storage provider for testing
 */
export declare function createMockStorage(): MockStorageProvider;
/**
 * Creates a mock file system storage provider for testing
 */
export declare function createMockFileSystemStorage(baseDir: string): MockStorageProvider;
