/**
 * Unit tests for Phase 4 CLI Integration components
 */

import { Command } from 'commander';

// Import the actual command classes
import { TaskCommand } from '../../../src/cli/commands/taskCommand.js';
import { IPFSCommand } from '../../../src/cli/commands/ipfsCommand.js';
import { AgentCommand } from '../../../src/cli/commands/agentCommand.js';
import { CrossIntegration } from '../../../src/cli/integration/crossIntegration.js';

// Mock only external dependencies
jest.mock('../../../src/utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Phase 4: CLI Integration Components', () => {
  describe('Task System Commands', () => {
    let taskCommand: TaskCommand;
    let mockProgram: jest.Mocked<Command>;
    
    beforeEach(() => {
      jest.clearAllMocks();
      
      // Mock commander program
      mockProgram = new Command() as jest.Mocked<Command>;
      mockProgram.command = jest.fn().mockReturnThis();
      mockProgram.description = jest.fn().mockReturnThis();
      mockProgram.option = jest.fn().mockReturnThis();
      mockProgram.action = jest.fn().mockReturnThis();
      
      // Create task command
      taskCommand = new TaskCommand(mockProgram);
    });
    
    it('should register task commands with commander', () => {
      // Act
      taskCommand.register();
      
      // Assert
      expect(mockProgram.command).toHaveBeenCalled();
      expect(mockProgram.description).toHaveBeenCalled();
      expect(mockProgram.option).toHaveBeenCalled();
      expect(mockProgram.action).toHaveBeenCalled();
    });
  });
  
  describe('IPFS Kit Commands', () => {
    let ipfsCommand: IPFSCommand;
    let mockProgram: jest.Mocked<Command>;
    
    beforeEach(() => {
      jest.clearAllMocks();
      
      // Mock commander program
      mockProgram = new Command() as jest.Mocked<Command>;
      mockProgram.command = jest.fn().mockReturnThis();
      mockProgram.description = jest.fn().mockReturnThis();
      mockProgram.option = jest.fn().mockReturnThis();
      mockProgram.action = jest.fn().mockReturnThis();
      
      // Create IPFS command
      ipfsCommand = new IPFSCommand(mockProgram);
    });
    
    it('should register IPFS commands with commander', () => {
      // Act
      ipfsCommand.register();
      
      // Assert
      expect(mockProgram.command).toHaveBeenCalled();
      expect(mockProgram.description).toHaveBeenCalled();
      expect(mockProgram.option).toHaveBeenCalled();
      expect(mockProgram.action).toHaveBeenCalled();
    });
  });
  
  describe('AI Agent Commands', () => {
    let agentCommand: AgentCommand;
    let mockProgram: jest.Mocked<Command>;
    
    beforeEach(() => {
      jest.clearAllMocks();
      
      // Mock commander program
      mockProgram = new Command() as jest.Mocked<Command>;
      mockProgram.command = jest.fn().mockReturnThis();
      mockProgram.description = jest.fn().mockReturnThis();
      mockProgram.option = jest.fn().mockReturnThis();
      mockProgram.action = jest.fn().mockReturnThis();
      
      // Create agent command
      agentCommand = new AgentCommand(mockProgram);
    });
    
    it('should register agent commands with commander', () => {
      // Act
      agentCommand.register();
      
      // Assert
      expect(mockProgram.command).toHaveBeenCalled();
      expect(mockProgram.description).toHaveBeenCalled();
      expect(mockProgram.option).toHaveBeenCalled();
      expect(mockProgram.action).toHaveBeenCalled();
    });
  });
  
  describe('Cross-Component Integration', () => {
    let crossIntegration: CrossIntegration;
    let mockTaskCommand: jest.Mocked<TaskCommand>;
    let mockIPFSCommand: jest.Mocked<IPFSCommand>;
    let mockAgentCommand: jest.Mocked<AgentCommand>;
    
    beforeEach(() => {
      jest.clearAllMocks();
      
      // Mock command classes
      mockTaskCommand = new TaskCommand({} as any) as jest.Mocked<TaskCommand>;
      mockIPFSCommand = new IPFSCommand({} as any) as jest.Mocked<IPFSCommand>;
      mockAgentCommand = new AgentCommand({} as any) as jest.Mocked<AgentCommand>;
      
      // Create cross-component integration
      crossIntegration = new CrossIntegration(
        mockTaskCommand,
        mockIPFSCommand,
        mockAgentCommand
      );
    });
    
    it('should integrate components for workflows', () => {
      // Arrange
      mockTaskCommand.addIPFSIntegration = jest.fn();
      mockIPFSCommand.addTaskIntegration = jest.fn();
      mockAgentCommand.addTaskIntegration = jest.fn();
      mockAgentCommand.addIPFSIntegration = jest.fn();
      
      // Act
      crossIntegration.integrate();
      
      // Assert
      expect(mockTaskCommand.addIPFSIntegration).toHaveBeenCalled();
      expect(mockIPFSCommand.addTaskIntegration).toHaveBeenCalled();
      expect(mockAgentCommand.addTaskIntegration).toHaveBeenCalled();
      expect(mockAgentCommand.addIPFSIntegration).toHaveBeenCalled();
    });
  });
});
