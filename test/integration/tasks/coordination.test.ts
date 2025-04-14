// NOTE: Using relative paths to source .ts files. If 'Cannot find module' errors persist,
// check Jest/TS configuration (moduleNameMapper, preset, module resolution).
import { Coordinator } from '../../../../src/tasks/coordination/coordinator';
import { MerkleClock } from '../../../../src/tasks/coordination/merkle_clock';
import { normalizeId, calculateHammingDistance, determineResponsibility } from '../../../../src/tasks/coordination/responsibility'; // Added determineResponsibility
import type { NetworkService } from '../../../../src/network/service'; // Assuming interface/type exists
import type { TaskExecutor } from '../../../../src/tasks/execution/executor'; // Assuming interface/type exists
import type { Task } from '../../../../src/tasks/types'; // Assuming Task type exists

// --- Mocks ---

// Mock NetworkService (LibP2P)
const mockNetworkService: jest.Mocked<NetworkService> = {
  getLocalPeerId: jest.fn(),
  getActivePeers: jest.fn(),
  publish: jest.fn(),
  subscribe: jest.fn(),
  // Add other methods if needed by Coordinator
};

// Mock TaskExecutor
const mockTaskExecutor: jest.Mocked<TaskExecutor> = {
  executeRemoteTask: jest.fn(), // Method called by Coordinator when responsible
  // Add other methods if needed
};

// Mock TaskManager (if Coordinator interacts with it directly for completion)
const mockTaskManager = {
    completeTask: jest.fn(),
    failTask: jest.fn(),
};

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// --- Test Suite ---

describe('Coordinator Integration Tests', () => {
  const localPeerId = 'peerA';
  const remotePeerIdB = 'peerB';
  const remotePeerIdC = 'peerC';
  const activePeers = [localPeerId, remotePeerIdB, remotePeerIdC];
  const taskId = 'task-xyz';
  const taskCid = 'bafy...taskcid';
  const resultCid = 'bafy...resultcid';

  let coordinator: Coordinator;
  let clock: MerkleClock;

  beforeEach(async () => {
    // Setup Coordinator with mocked dependencies
    mockNetworkService.getLocalPeerId.mockReturnValue(localPeerId);
    mockNetworkService.getActivePeers.mockResolvedValue(activePeers);

    // Instantiate clock and coordinator for each test
    clock = new MerkleClock(localPeerId);
    coordinator = new Coordinator(
        clock,
        mockNetworkService,
        mockTaskExecutor,
        mockTaskManager as any // Cast if type mismatch
        // Pass other dependencies if needed
    );

    // Mocking internal functions called by Coordinator - adjust based on actual implementation
    // If Coordinator directly uses functions from responsibility.ts:
    jest.mock('../../../../src/tasks/coordination/responsibility', () => ({
      ...jest.requireActual('../../../../src/tasks/coordination/responsibility'), // Keep original implementations by default
      determineResponsibility: jest.fn(), // Mock only determineResponsibility
    }));
  });

  // --- Task Distribution Tests ---

  it('should tick clock and publish TaskAnnouncement on distributeTask', async () => {
    const task: Task = { id: taskId, type: 'test', input: { cid: taskCid } };
    const initialTime = clock.getTimestamps()[localPeerId] ?? 0;
    const initialHead = clock.getHead();

    await coordinator.distributeTask(task);

    // Check clock ticked
    expect(clock.getTimestamps()[localPeerId]).toBe(initialTime + 1);
    const newHead = clock.getHead();
    expect(newHead).not.toBe(initialHead);

    // Check publish called correctly
    expect(mockNetworkService.publish).toHaveBeenCalledTimes(1);
    expect(mockNetworkService.publish).toHaveBeenCalledWith(
      expect.stringContaining('task-announce'), // Check topic
      expect.any(Buffer) // Assuming serialized message
      // TODO: Deserialize and check message content more thoroughly if possible
      // expect(deserialize(mockNetworkService.publish.mock.calls[0][1])).toEqual({
      //   taskId: taskId,
      //   taskCid: taskCid, // Assuming input.cid is taskCid
      //   announcerId: localPeerId,
      //   announcerHead: newHead,
      //   targetId: taskId, // Using taskId as the target for Hamming distance calculation
      // });
    );
  });

  // --- Task Responsibility Tests ---

  it('should execute task locally if determined responsible', async () => {
    // Simulate receiving an announcement where this peer IS responsible
    // Mock determineResponsibility or the underlying functions if needed
    const announcerHead = 'someOtherHead'; // Example head
    const announcement = {
        taskId: taskId,
        taskCid: taskCid,
        announcerId: remotePeerIdB,
        announcerHead: announcerHead,
        targetId: taskId, // Using taskId as the target for Hamming distance calculation
    };

    // Mock determineResponsibility to return true for this test case
    (determineResponsibility as jest.Mock).mockReturnValue(true);

    // Simulate receiving the message (assuming Coordinator has a handler method)
    await coordinator.handleTaskAnnouncement(announcement);

    // Check if TaskExecutor was called
    expect(mockTaskExecutor.executeRemoteTask).toHaveBeenCalledTimes(1);
    expect(mockTaskExecutor.executeRemoteTask).toHaveBeenCalledWith(taskId, taskCid);

    // No need to restore if using jest.mock() which resets between tests
  });

  it('should NOT execute task locally if determined NOT responsible', async () => {
     // Simulate receiving an announcement where this peer IS NOT responsible
    const announcerHead = 'someOtherHead';
    const announcement = {
        taskId: taskId,
        taskCid: taskCid,
        announcerId: remotePeerIdB,
        announcerHead: announcerHead,
        targetId: taskId, // Using taskId as the target for Hamming distance calculation
    };

    // Mock determineResponsibility to return false for this test case
     (determineResponsibility as jest.Mock).mockReturnValue(false);

    // Simulate receiving the message
    await coordinator.handleTaskAnnouncement(announcement);

    // Check if TaskExecutor was NOT called
    expect(mockTaskExecutor.executeRemoteTask).not.toHaveBeenCalled();

    // No need to restore
  });

  // --- Task Completion Tests ---

  it('should tick clock and publish TaskCompletion on successful execution', async () => {
      // Simulate local execution completing successfully
      const resultData = { output: 'success' };
      const resultCid = 'bafy...resultcid'; // Assume result is stored in IPFS

      const initialTime = clock.getTimestamps()[localPeerId] ?? 0;
      const initialHead = clock.getHead();

      // Assume TaskExecutor calls coordinator.handleLocalTaskCompletion on success
      await coordinator.handleLocalTaskCompletion(taskId, resultCid, resultData);

      // Check clock ticked
      expect(clock.getTimestamps()[localPeerId]).toBe(initialTime + 1);
      const newHead = clock.getHead();
      expect(newHead).not.toBe(initialHead);

      // Check publish called correctly
      expect(mockNetworkService.publish).toHaveBeenCalledTimes(1);
      expect(mockNetworkService.publish).toHaveBeenCalledWith(
        expect.stringContaining('task-complete'), // Check topic
        expect.any(Buffer) // Assuming serialized message
        // TODO: Deserialize and check message content
        // expect(deserialize(mockNetworkService.publish.mock.calls[0][1])).toEqual({
        //   taskId: taskId,
        //   resultCid: resultCid,
        //   executerId: localPeerId,
        //   executerHead: newHead,
        //   status: 'Succeeded',
        // });
      );
  });

   it('should tick clock and publish TaskCompletion on failed execution', async () => {
      // Simulate local execution failing
      const error = new Error("Execution failed");

      const initialTime = clock.getTimestamps()[localPeerId] ?? 0;
      const initialHead = clock.getHead();

      // Assume TaskExecutor calls coordinator.handleLocalTaskFailure on error
      await coordinator.handleLocalTaskFailure(taskId, error);

      // Check clock ticked
      expect(clock.getTimestamps()[localPeerId]).toBe(initialTime + 1);
      const newHead = clock.getHead();
      expect(newHead).not.toBe(initialHead);

      // Check publish called correctly
      expect(mockNetworkService.publish).toHaveBeenCalledTimes(1);
      expect(mockNetworkService.publish).toHaveBeenCalledWith(
        expect.stringContaining('task-complete'), // Check topic
        expect.any(Buffer) // Assuming serialized message
        // TODO: Deserialize and check message content
        // expect(deserialize(mockNetworkService.publish.mock.calls[0][1])).toEqual({
        //   taskId: taskId,
        //   resultCid: undefined,
        //   executerId: localPeerId,
        //   executerHead: newHead,
        //   status: 'Failed',
        //   error: "Execution failed",
        // });
      );
  });

  // --- Receiving Completion Tests ---

  it('should merge clock and notify TaskManager when receiving completion for originated task', async () => {
      // Assume Peer A originated the task
      const executerPeerId = remotePeerIdB;
      const executerHead = 'someExecuterHead';
      const executerTimestamps = { [remotePeerIdB]: 5, [localPeerId]: 2 }; // Example remote clock data

      const completionMessage = {
          taskId: taskId,
          resultCid: resultCid,
          executerId: executerPeerId,
          executerHead: executerHead,
          status: 'Succeeded',
          clockData: executerTimestamps, // Assuming full clock data is sent for merge
      };

      const initialLocalTime = clock.getTimestamps()[localPeerId] ?? 0;

      // Simulate receiving the message (assuming Coordinator has a handler)
      await coordinator.handleTaskCompletionMessage(completionMessage);

      // Check clock was merged (local time shouldn't change, remote time updated)
      expect(clock.getTimestamps()[localPeerId]).toBe(initialLocalTime);
      expect(clock.getTimestamps()[remotePeerIdB]).toBe(5);

      // Check TaskManager notified (assuming Coordinator calls it)
      expect(mockTaskManager.completeTask).toHaveBeenCalledTimes(1);
      expect(mockTaskManager.completeTask).toHaveBeenCalledWith(taskId, resultCid);
      expect(mockTaskManager.failTask).not.toHaveBeenCalled();
  });

   it('should merge clock and notify TaskManager on received failure', async () => {
      const executerPeerId = remotePeerIdB;
      const executerHead = 'someExecuterHead';
      const executerTimestamps = { [remotePeerIdB]: 5, [localPeerId]: 2 };
      const errorMessage = "Remote execution failed";

      const completionMessage = {
          taskId: taskId,
          resultCid: undefined,
          executerId: executerPeerId,
          executerHead: executerHead,
          status: 'Failed',
          error: errorMessage,
          clockData: executerTimestamps,
      };

      await coordinator.handleTaskCompletionMessage(completionMessage);

      expect(clock.getTimestamps()[remotePeerIdB]).toBe(5);
      expect(mockTaskManager.failTask).toHaveBeenCalledTimes(1);
      expect(mockTaskManager.failTask).toHaveBeenCalledWith(taskId, expect.objectContaining({ message: errorMessage }));
      expect(mockTaskManager.completeTask).not.toHaveBeenCalled();
  });

   it('should only merge clock if not the originator', async () => {
      // Assume Peer C originated the task, Peer A is just observing
      const originatorPeerId = remotePeerIdC;
      const executerPeerId = remotePeerIdB;
      const executerHead = 'someExecuterHead';
      const executerTimestamps = { [remotePeerIdB]: 5, [originatorPeerId]: 3 };

      const completionMessage = {
          taskId: taskId,
          resultCid: resultCid,
          executerId: executerPeerId,
          executerHead: executerHead,
          status: 'Succeeded',
          clockData: executerTimestamps,
          // Need a way to know originator, maybe included in message or task info
          originatorId: originatorPeerId
      };

      await coordinator.handleTaskCompletionMessage(completionMessage);

      // Check clock merged
      expect(clock.getTimestamps()[remotePeerIdB]).toBe(5);
      expect(clock.getTimestamps()[originatorPeerId]).toBe(3);

      // Check TaskManager was NOT notified
      expect(mockTaskManager.completeTask).not.toHaveBeenCalled();
      expect(mockTaskManager.failTask).not.toHaveBeenCalled();
  });

  // Add tests for clock synchronization logic if implemented within Coordinator
});
