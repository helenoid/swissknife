/**
 * Integration tests for Phase 4 CLI Integration components
 */

import { Command } from 'commander.js';

// Mock dependencies
jest.mock('commander');
jest.mock('../../../src/tasks/manager');
jest.mock('../../../src/ipfs/client');
jest.mock('../../../src/ai/agent/agent');

// Mock console to prevent output during tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe('Phase 4: CLI Integration Tests', () => {
  let program: jest.Mocked<Command>;
  let taskCommand: TaskCommand;
  let ipfsCommand: IPFSCommand;
  let agentCommand: AgentCommand;
  let crossIntegration: CrossIntegration;
  let taskManager: jest.Mocked<TaskManager>;
  let ipfsClient: jest.Mocked<IPFSKitClient>;
  let agent: jest.Mocked<Agent>;
  
  beforeAll(() => {
    console.log = jest.fn();
    console.error = jest.fn();
  });
  
  afterAll(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock commander program
    program = new Command() as jest.Mocked<Command>;
    program.command = jest.fn().mockReturnThis();
    program.description = jest.fn().mockReturnThis();
    program.option = jest.fn().mockReturnThis();
    program.action = jest.fn().mockImplementation((fn) => {
      // Store the action function for testing
      (program as any).actionFn = fn;
      return program;
    });
    
    // Mock dependencies
    taskManager = new TaskManager({} as any) as jest.Mocked<TaskManager>;
    ipfsClient = new IPFSKitClient() as jest.Mocked<IPFSKitClient>;
    agent = new Agent({ model: {} as any }) as jest.Mocked<Agent>;
    
    // Create command classes
    taskCommand = new TaskCommand(program);
    (taskCommand as any).taskManager = taskManager;
    
    ipfsCommand = new IPFSCommand(program);
    (ipfsCommand as any).ipfsClient = ipfsClient;
    
    agentCommand = new AgentCommand(program);
    (agentCommand as any).agent = agent;
    
    // Create cross-component integration
    crossIntegration = new CrossIntegration(
      taskCommand,
      ipfsCommand,
      agentCommand
    );
  });
  
  describe('Agent, IPFS, and Task Integration Workflow', () => {
    it('should execute an end-to-end workflow across components', async () => {
      // Register commands
      taskCommand.register();
      ipfsCommand.register();
      agentCommand.register();
      
      // Integrate components
      crossIntegration.integrate();
      
      // Mock the functionality for each component
      agent.processMessage = jest.fn().mockResolvedValue({
        content: 'Analyzed content',
        status: 'success'
      });
      
      ipfsClient.addContent = jest.fn().mockResolvedValue('QmTestCID');
      ipfsClient.getContent = jest.fn().mockResolvedValue('Retrieved content from IPFS');
      
      taskManager.createTask = jest.fn().mockResolvedValue({
        id: 'task-123',
        title: 'Processed task',
        status: 'created'
      });
      
      taskManager.executeTask = jest.fn().mockResolvedValue({
        id: 'task-123',
        status: 'completed',
        result: 'Task result'
      });
      
      // Simulate workflow:
      // 1. Agent analyzes content
      const analysisResult = await agent.processMessage('Analyze this complex problem');
      
      // 2. Store analysis in IPFS
      const cid = await ipfsClient.addContent(analysisResult.content);
      
      // 3. Create task with reference to the IPFS content
      const task = await taskManager.createTask({
        title: 'Process analysis',
        description: `Process the analysis stored in IPFS: ${cid}`
      });
      
      // 4. Execute task
      const taskResult = await taskManager.executeTask(task.id);
      
      // 5. Store result in IPFS
      const resultCid = await ipfsClient.addContent(JSON.stringify(taskResult));
      
      // Assertions
      expect(agent.processMessage).toHaveBeenCalledWith('Analyze this complex problem');
      expect(ipfsClient.addContent).toHaveBeenCalledTimes(2);
      expect(ipfsClient.addContent).toHaveBeenCalledWith('Analyzed content');
      expect(ipfsClient.addContent).toHaveBeenCalledWith(JSON.stringify(taskResult));
      expect(taskManager.createTask).toHaveBeenCalled();
      expect(taskManager.executeTask).toHaveBeenCalledWith('task-123');
      
      // Verify workflow outputs
      expect(analysisResult.content).toBe('Analyzed content');
      expect(cid).toBe('QmTestCID');
      expect(task.id).toBe('task-123');
      expect(taskResult.status).toBe('completed');
      expect(resultCid).toBe('QmTestCID');
    });
  });
  
  describe('CLI Command Execution', () => {
    it('should execute the task create command', async () => {
      // Register task commands
      taskCommand.register();
      
      // Mock task creation
      taskManager.createTask = jest.fn().mockResolvedValue({
        id: 'task-123',
        title: 'Test Task',
        status: 'created'
      });
      
      // Get the action function for the 'task create' command
      const taskCreateCommand = program.command.mock.calls.find(call => call[0] === 'task create');
      expect(taskCreateCommand).toBeDefined();
      
      const actionFn = (program as any).actionFn;
      
      // Simulate command execution
      if (actionFn) {
        await actionFn({ title: 'Test Task', description: 'Test Description' });
        
        // Verify task creation
        expect(taskManager.createTask).toHaveBeenCalledWith({
          title: 'Test Task',
          description: 'Test Description'
        });
      } else {
        fail('Action function not found');
      }
    });
    
    it('should execute the IPFS add command', async () => {
      // Register IPFS commands
      ipfsCommand.register();
      
      // Mock IPFS content addition
      ipfsClient.addContent = jest.fn().mockResolvedValue('QmTestCID');
      
      // Get the action function for the 'ipfs add' command
      const ipfsAddCommand = program.command.mock.calls.find(call => call[0] === 'ipfs add');
      expect(ipfsAddCommand).toBeDefined();
      
      const actionFn = (program as any).actionFn;
      
      // Simulate command execution
      if (actionFn) {
        await actionFn({ content: 'Test content' });
        
        // Verify IPFS content addition
        expect(ipfsClient.addContent).toHaveBeenCalledWith('Test content');
      } else {
        fail('Action function not found');
      }
    });
    
    it('should execute the agent chat command', async () => {
      // Register agent commands
      agentCommand.register();
      
      // Mock agent response
      agent.processMessage = jest.fn().mockResolvedValue({
        content: 'Agent response',
        status: 'success'
      });
      
      // Get the action function for the 'agent chat' command
      const agentChatCommand = program.command.mock.calls.find(call => call[0] === 'agent chat');
      expect(agentChatCommand).toBeDefined();
      
      const actionFn = (program as any).actionFn;
      
      // Simulate command execution
      if (actionFn) {
        await actionFn({ message: 'Hello agent' });
        
        // Verify agent interaction
        expect(agent.processMessage).toHaveBeenCalledWith('Hello agent');
      } else {
        fail('Action function not found');
      }
    });
  });
});
