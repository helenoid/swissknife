// Note: This runs as a separate Node.js process (worker thread).
// It cannot directly access variables or classes from the main thread's scope.
// Communication happens via message passing (parentPort.postMessage).
// Use require for Node.js built-ins if needed.
const { parentPort, workerData } = require('worker_threads');

if (!parentPort) {
  throw new Error('This script must be run as a worker thread.');
}

console.log(`[Worker #${workerData?.workerId ?? 'N/A'}] Worker script started.`);

// Function to simulate CPU-intensive work
function performComputation(input) {
  console.log(`[Worker #${workerData?.workerId ?? 'N/A'}] Performing computation on:`, input);
  // Replace with actual complex calculation
  const result = (input || 0) * 2; 
  // Simulate delay
  const waitTime = 500 + Math.random() * 1000; // 0.5 - 1.5 seconds
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, waitTime); 
  console.log(`[Worker #${workerData?.workerId ?? 'N/A'}] Computation finished. Result: ${result}`);
  return { value: result };
}

// Function to simulate I/O-bound work (e.g., network request, file access)
async function performIoTask(input) {
   console.log(`[Worker #${workerData?.workerId ?? 'N/A'}] Performing I/O task with:`, input);
   // Replace with actual async I/O operation
   await new Promise(resolve => setTimeout(resolve, 750 + Math.random() * 1500)); // 0.75 - 2.25 seconds
   console.log(`[Worker #${workerData?.workerId ?? 'N/A'}] I/O task finished.`);
   return { status: 'completed', dataReceived: `Data related to ${input}` };
}


parentPort.on('message', async (taskPayload /* Type: TaskPayload from worker-pool.ts */) => {
  console.log(`[Worker #${workerData?.workerId ?? 'N/A'}] Received task:`, taskPayload);
  const { taskId, type, data } = taskPayload;

  try {
    let resultData;
    switch (type) {
      case 'compute':
        resultData = performComputation(data?.input);
        break;
      case 'io':
        resultData = await performIoTask(data?.url || 'default_resource');
        break;
      // Add more task types as needed
      default:
        throw new Error(`Unknown task type received: ${type}`);
    }
    
    // Send success result back to the main thread
    parentPort.postMessage({ taskId: taskId, result: resultData });
    console.log(`[Worker #${workerData?.workerId ?? 'N/A'}] Task ${taskId} completed successfully.`);

  } catch (error) {
    console.error(`[Worker #${workerData?.workerId ?? 'N/A'}] Error processing task ${taskId}:`, error);
    // Send error result back to the main thread
    parentPort.postMessage({ taskId: taskId, error: error.message || 'An unknown error occurred in the worker.' });
  }
});

// Handle potential cleanup on worker exit (though terminate is usually forceful)
parentPort.on('close', () => {
  console.log(`[Worker #${workerData?.workerId ?? 'N/A'}] Worker closing.`);
});

console.log(`[Worker #${workerData?.workerId ?? 'N/A'}] Worker ready and listening for messages.`);
