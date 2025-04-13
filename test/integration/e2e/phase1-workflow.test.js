/**
 * End-to-End Integration Test for Phase 1 Components
 * 
 * This test demonstrates how all the Phase 1 components work together
 * to handle a complete workflow.
 */

import { 
  IntegrationRegistry, 
  GooseBridge,
  GoTManager,
  GoTNode,
  MCPClient,
  FibHeapScheduler 
} from '../../../src/integration';

// Mock dependencies
jest.mock('../../../src/utils/logging/manager', () => ({
  LogManager: {
    getInstance: jest.fn().mockReturnValue({
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn()
    })
  }
}));

jest.mock('../../../src/config/manager', () => ({
  ConfigurationManager: {
    getInstance: jest.fn().mockReturnValue({
      get: jest.fn().mockImplementation((key, defaultValue) => defaultValue),
      set: jest.fn().mockImplementation((key, value) => Promise.resolve(true)),
      save: jest.fn().mockImplementation(() => Promise.resolve())
    })
  }
}));

// Mock axios for MCP client
jest.mock('axios', () => {
  return {
    create: jest.fn().mockReturnValue({
      get: jest.fn().mockImplementation((url) => {
        if (url === '/status') {
          return Promise.resolve({ status: 200, data: { status: 'ok' } });
        }
        
        if (url.startsWith('/content/')) {
          const cid = url.replace('/content/', '');
          return Promise.resolve({
            data: {
              cid,
              content: 'mock content for ' + cid,
              encoding: 'utf8'
            }
          });
        }
        
        if (url.startsWith('/ipld/node/')) {
          const cid = url.replace('/ipld/node/', '');
          return Promise.resolve({
            data: {
              cid,
              data: { test: 'data' },
              links: []
            }
          });
        }
        
        return Promise.resolve({ status: 200, data: {} });
      }),
      
      post: jest.fn().mockImplementation((url, data) => {
        if (url === '/content') {
          return Promise.resolve({
            data: {
              cid: `cid-${Math.random().toString(36).substring(2, 9)}`
            }
          });
        }
        
        if (url === '/ipld/node') {
          return Promise.resolve({
            data: {
              cid: `cid-${Math.random().toString(36).substring(2, 9)}`
            }
          });
        }
        
        return Promise.resolve({ data: {} });
      })
    })
  };
});

describe('Phase 1 End-to-End Integration', () => {
  let registry, gooseBridge, gotManager, mcpClient, scheduler;
  
  beforeEach(async () => {
    // Create and initialize components
    registry = IntegrationRegistry.getInstance();
    gooseBridge = new GooseBridge();
    gotManager = GoTManager.getInstance();
    mcpClient = new MCPClient();
    scheduler = new FibHeapScheduler();
    
    // Connect components
    registry.registerBridge(gooseBridge);
    await registry.initializeBridge(gooseBridge.id);
    
    await mcpClient.connect();
    gotManager.setMCPClient(mcpClient);
  });
  
  test('Complete workflow from question to answer', async () => {
    // SCENARIO: User asks a question that requires breaking down into tasks
    const userQuestion = "What are the benefits of GraphQL over REST?";
    
    // 1. Process the initial question through Goose Bridge
    const initialResponse = await gooseBridge.call('processMessage', {
      message: userQuestion
    });
    
    expect(initialResponse).toHaveProperty('messageId');
    expect(initialResponse).toHaveProperty('content');
    
    // 2. Create a Graph-of-Thought to analyze and solve the problem
    const graphId = gotManager.createGraph();
    
    // Add question node (root of the graph)
    const questionNode = gotManager.createNode(graphId, {
      type: 'question',
      content: userQuestion,
      data: {
        source: 'user',
        timestamp: Date.now()
      }
    });
    
    // 3. Create task nodes to break down the problem
    const task1 = gotManager.createNode(graphId, {
      type: 'task',
      content: 'Research GraphQL benefits',
      parentIds: [questionNode.id],
      data: {
        assignedTo: 'research_tool'
      }
    });
    
    const task2 = gotManager.createNode(graphId, {
      type: 'task',
      content: 'Research REST limitations',
      parentIds: [questionNode.id],
      data: {
        assignedTo: 'research_tool'
      }
    });
    
    const task3 = gotManager.createNode(graphId, {
      type: 'task',
      content: 'Compare GraphQL and REST',
      parentIds: [task1.id, task2.id],
      data: {
        assignedTo: 'analysis_tool',
        requiresAllParents: true
      }
    });
    
    const answerNode = gotManager.createNode(graphId, {
      type: 'answer',
      content: '',  // Empty until we process
      parentIds: [task3.id],
      data: {
        requiresAllParents: true
      }
    });
    
    // 4. Schedule tasks based on priority and dependencies
    scheduler.scheduleTask(1, {
      nodeId: task1.id,
      graphId: graphId,
      type: 'process_node'
    });
    
    scheduler.scheduleTask(1, {
      nodeId: task2.id,
      graphId: graphId,
      type: 'process_node'
    });
    
    // 5. Process first two tasks in parallel
    // In a real implementation, this would be more sophisticated with actual tool calls
    expect(scheduler.hasTasks()).toBe(true);
    expect(scheduler.getTaskCount()).toBe(2);
    
    // Process first task
    const nextTask1 = scheduler.getNextTask();
    expect(nextTask1).toHaveProperty('nodeId');
    expect(nextTask1).toHaveProperty('graphId');
    
    // Update node with result
    gotManager.getNode(nextTask1.nodeId).updateContent(
      'GraphQL benefits: single request for multiple resources, type system, no over/under fetching, introspection'
    );
    gotManager.updateNodeStatus(nextTask1.nodeId, 'completed');
    
    // Process second task
    const nextTask2 = scheduler.getNextTask();
    expect(nextTask2).toHaveProperty('nodeId');
    
    // Update node with result
    gotManager.getNode(nextTask2.nodeId).updateContent(
      'REST limitations: multiple requests for related data, over/under fetching, versioning challenges'
    );
    gotManager.updateNodeStatus(nextTask2.nodeId, 'completed');
    
    // 6. Schedule the comparison task now that dependencies are complete
    scheduler.scheduleTask(2, {
      nodeId: task3.id,
      graphId: graphId,
      type: 'process_node'
    });
    
    // Process comparison task
    const nextTask3 = scheduler.getNextTask();
    expect(nextTask3).toHaveProperty('nodeId');
    expect(nextTask3.nodeId).toBe(task3.id);
    
    // Update node with result
    gotManager.getNode(nextTask3.nodeId).updateContent(
      'Comparison: GraphQL provides efficient data fetching with a single request, strong typing, and' +
      ' eliminates over/under fetching issues commonly found in REST APIs.'
    );
    gotManager.updateNodeStatus(nextTask3.nodeId, 'completed');
    
    // 7. Schedule final answer task
    scheduler.scheduleTask(3, {
      nodeId: answerNode.id,
      graphId: graphId,
      type: 'process_node'
    });
    
    // Process answer task
    const answerTask = scheduler.getNextTask();
    expect(answerTask).toHaveProperty('nodeId');
    expect(answerTask.nodeId).toBe(answerNode.id);
    
    // Generate final answer by collecting information from all parent nodes
    const task1Content = gotManager.getNode(task1.id).content;
    const task2Content = gotManager.getNode(task2.id).content;
    const task3Content = gotManager.getNode(task3.id).content;
    
    const finalAnswer = 
      "Benefits of GraphQL over REST:\n\n" +
      "1. Efficient data fetching with a single request for multiple resources\n" +
      "2. Strong type system providing better developer experience and validation\n" +
      "3. Eliminates over-fetching and under-fetching of data\n" +
      "4. Built-in introspection capabilities\n" +
      "5. Avoids the multiple round-trip requests common in REST\n" +
      "6. Simplifies versioning compared to REST APIs";
    
    gotManager.getNode(answerTask.nodeId).updateContent(finalAnswer);
    gotManager.updateNodeStatus(answerTask.nodeId, 'completed');
    
    // 8. Persist the entire graph to IPFS
    // Make sure all nodes are marked as completed, including the question node
    gotManager.updateNodeStatus(questionNode.id, 'completed');
    
    const graphCid = await gotManager.persistGraph(graphId);
    expect(graphCid).toBeDefined();
    expect(typeof graphCid).toBe('string');
    
    // 9. Verify the graph structure and results
    // Check that all nodes are completed
    const allNodes = gotManager.getGraphNodes(graphId);
    
    // Debug: Check which nodes are not completed
    const incompleteNodes = allNodes.filter(node => node.status !== 'completed');
    if (incompleteNodes.length > 0) {
      console.log('Incomplete nodes:');
      incompleteNodes.forEach(node => {
        console.log(`Node ${node.id} (${node.type}): status=${node.status}`);
      });
    }
    
    expect(allNodes.every(node => node.status === 'completed')).toBe(true);
    
    // Verify the answer node has the correct content
    const finalAnswerNode = gotManager.getNode(answerNode.id);
    expect(finalAnswerNode.content).toBe(finalAnswer);
    
    // 10. Return the answer via Goose Bridge
    const finalResponse = await gooseBridge.call('processMessage', {
      message: `Question: ${userQuestion}\nAnswer: ${finalAnswerNode.content}`
    });
    
    expect(finalResponse).toHaveProperty('messageId');
    expect(finalResponse).toHaveProperty('content');
  });
});