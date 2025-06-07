// Mock worker_threads
jest.mock('worker_threads', () => {
  return {
    Worker: function() {
      return new (require('../../../test/mocks/workers/worker').MockWorker)();
    },
    isMainThread: true
  };
});

// Import WorkerPool after mocks are set up
import { WorkerPool } from '../../../src/workers/worker-pool.ts';

// Mock temp directory helpers
const createTempTestDir = jest.fn().mockImplementation((name) => `/tmp/test-${name}-${Date.now()}`);
const removeTempTestDir = jest.fn().mockImplementation(async (_dir: any) => Promise.resolve());

describe('WorkerPool', () => {

  let workerPool: WorkerPool;
  let tempDir: string;

  beforeAll(async () => {
    tempDir = await createTempTestDir('worker-pool-test');
  });

  afterAll(async () => {
    await removeTempTestDir(tempDir);
  });

  beforeEach(() => {
    (WorkerPool as any).instance = null;
    workerPool = WorkerPool.getInstance({
      minWorkers: 2,
      maxWorkers: 5,
      taskTimeout: 1000
    });
  });

  it('should start and stop successfully', async () => {
    workerPool.start();
    expect(workerPool.getWorkerCount()).toBe(2);
    workerPool.stop();
    expect(workerPool.getWorkerCount()).toBe(0);
  });

  // Additional tests...
});
