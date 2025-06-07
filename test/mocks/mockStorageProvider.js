// Mock common dependencies
jest.mock("chalk", () => ({ default: (str) => str, red: (str) => str, green: (str) => str, blue: (str) => str }));
jest.mock("nanoid", () => ({ nanoid: () => "test-id" }));
jest.mock("fs", () => ({ promises: { readFile: jest.fn(), writeFile: jest.fn(), mkdir: jest.fn() } }));
/**
 * In-memory mock implementation of the StorageProvider interface for testing.
 */
export class MockStorageProvider {
    storage = new Map();
    taskStorage = new Map();
    metadataStorage = new Map();
    nodeStorage = new Map();
    // --- Basic Operations ---
    async add(content, options) {
        const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content);
        const cid = `mock-cid-${this.storage.size + 1}-${buffer.length}`;
        this.storage.set(cid, buffer);
        this.metadataStorage.set(cid, {
            cid: cid,
            size: buffer.length,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            contentType: options?.contentType,
            tags: options?.tags,
            ...(options?.metadata || {})
        });
        // Use console.log in mock as logger might be mocked in tests using this
        console.log(`[MockStorage] Added content with CID: ${cid}`);
        return cid;
    }
    async get(cid) {
        const content = this.storage.get(cid);
        if (!content) {
            throw new Error(`[MockStorage] CID not found: ${cid}`);
        }
        console.log(`[MockStorage] Retrieved content for CID: ${cid}`);
        return content;
    }
    async exists(cid) {
        const exists = this.storage.has(cid);
        console.log(`[MockStorage] Exists check for CID ${cid}: ${exists}`);
        return exists;
    }
    async delete(cid) {
        const deletedMeta = this.metadataStorage.delete(cid);
        const deletedContent = this.storage.delete(cid);
        const deleted = deletedMeta || deletedContent;
        console.log(`[MockStorage] Deleting CID ${cid}: ${deleted}`);
        return deleted;
    }
    // --- Metadata Operations ---
    async getMetadata(cid) {
        const metadata = this.metadataStorage.get(cid);
        if (!metadata) {
            throw new Error(`[MockStorage] Metadata not found for CID: ${cid}`);
        }
        console.log(`[MockStorage] GetMetadata for CID ${cid}`);
        return { ...metadata };
    }
    async updateMetadata(cid, metadataUpdate) {
        const existingMetadata = this.metadataStorage.get(cid);
        if (!existingMetadata) {
            console.warn(`[MockStorage] Cannot update metadata for non-existent CID: ${cid}`);
            return false;
        }
        const updatedMetadata = {
            ...existingMetadata,
            ...metadataUpdate,
            updatedAt: Date.now(),
        };
        this.metadataStorage.set(cid, updatedMetadata);
        console.log(`[MockStorage] Updated metadata for CID ${cid}`);
        return true;
    }
    // --- Listing Operations ---
    async list(options) {
        console.log(`[MockStorage] Listing CIDs with options:`, options);
        let cids = Array.from(this.storage.keys());
        if (options?.prefix) {
            cids = cids.filter(cid => cid.startsWith(options.prefix));
        }
        if (options?.tag) {
            const tagsToMatch = Array.isArray(options.tag) ? options.tag : [options.tag];
            cids = cids.filter(cid => {
                const meta = this.metadataStorage.get(cid);
                return meta?.tags?.some(t => tagsToMatch.includes(t));
            });
        }
        if (options?.sortBy) {
            cids.sort((a, b) => {
                const metaA = this.metadataStorage.get(a);
                const metaB = this.metadataStorage.get(b);
                const valA = metaA?.[options.sortBy] ?? 0;
                const valB = metaB?.[options.sortBy] ?? 0;
                const direction = options.sortDirection === 'desc' ? -1 : 1;
                if (typeof valA === 'number' && typeof valB === 'number') {
                    return (valA - valB) * direction;
                }
                return 0;
            });
        }
        const offset = options?.offset || 0;
        const limit = options?.limit ?? cids.length;
        const paginatedCids = cids.slice(offset, offset + limit);
        const metadataList = paginatedCids.map(cid => this.metadataStorage.get(cid)).filter(m => m);
        return {
            cids: paginatedCids,
            metadata: metadataList.length > 0 ? metadataList : undefined
        };
    }
    // --- IPLD Operations (Placeholders) ---
    async addNode(data, links) {
        const content = JSON.stringify({ data, links: links || [] });
        const buffer = Buffer.from(content);
        const cid = `mock-ipld-cid-${this.nodeStorage.size + 1}`;
        this.nodeStorage.set(cid, { data, links: links || [] });
        this.storage.set(cid, buffer);
        this.metadataStorage.set(cid, { cid, size: buffer.length, createdAt: Date.now() });
        console.warn('[MockStorage] addNode implemented simply by storing JSON.'); // Use console in mock
        return cid;
    }
    async getNode(cid) {
        const node = this.nodeStorage.get(cid);
        if (!node) {
            throw new Error(`[MockStorage] IPLD Node not found: ${cid}`);
        }
        console.warn('[MockStorage] getNode returning stored JSON data.'); // Use console in mock
        return { ...node };
    }
    // --- CAR Operations (Placeholders) ---
    async createCar(roots, blocks) {
        console.warn('[MockStorage] createCar not implemented.'); // Use console in mock
        return { carCid: 'mock-car-cid', size: 0 };
    }
    async loadCar(carCid) {
        console.warn('[MockStorage] loadCar not implemented.'); // Use console in mock
        return { roots: [], blocks: {} };
    }
    // --- Stream Operations (Placeholders) ---
    async getStream(cid) {
        console.warn('[MockStorage] getStream not implemented.'); // Use console in mock
        const { Readable } = await import('stream');
        const content = this.storage.get(cid);
        if (!content)
            throw new Error(`[MockStorage] CID not found for stream: ${cid}`);
        return Readable.from(content);
    }
    async addStream(stream, options) {
        console.warn('[MockStorage] addStream not implemented.'); // Use console in mock
        return 'mock-stream-cid';
    }
    // --- Mock Task Methods ---
    async storeTask(task) {
        if (!task.id)
            throw new Error('[MockStorage] Task must have an ID to be stored.');
        this.taskStorage.set(task.id, { ...task });
        console.log(`[MockStorage] Stored task with ID: ${task.id}`);
    }
    async getTask(taskId) {
        const task = this.taskStorage.get(taskId);
        console.log(`[MockStorage] Get task for ID ${taskId}:`, task ? 'Found' : 'Not Found');
        return task ? { ...task } : null;
    }
    async updateTask(task) {
        if (!task.id)
            throw new Error('[MockStorage] Task must have an ID to be updated.');
        if (!this.taskStorage.has(task.id)) {
            console.warn(`[MockStorage] Task with ID ${task.id} not found for update, storing instead.`);
        }
        this.taskStorage.set(task.id, { ...task });
        console.log(`[MockStorage] Updated/Stored task with ID: ${task.id}`);
    }
    async listTasks(filter) {
        console.log(`[MockStorage] Listing tasks with filter:`, filter);
        const tasks = Array.from(this.taskStorage.values()).map(task => ({ ...task }));
        if (filter?.status) {
            return tasks.filter(t => t.status === filter.status);
        }
        return tasks;
    }
    // --- Helper methods for testing ---
    clear() {
        this.storage.clear();
        this.taskStorage.clear();
        this.metadataStorage.clear();
        this.nodeStorage.clear();
        console.log('[MockStorage] Cleared all mock storage.');
    }
    getSize() {
        return this.storage.size;
    }
    getTaskSize() {
        return this.taskStorage.size;
    }
}
//# sourceMappingURL=mockStorageProvider.js.map