/**
 * Unit tests for Phase 4 CLI Integration components
 */
import { Command } from 'commander.js';
// Mock dependencies
jest.mock('commander');
jest.mock('../../../src/cli/commands/taskCommand');
jest.mock('../../../src/cli/commands/ipfsCommand');
jest.mock('../../../src/cli/commands/agentCommand');
describe('Phase 4: CLI Integration Components', () => {
    describe('Task System Commands', () => {
        let taskCommand;
        let mockProgram;
        beforeEach(() => {
            jest.clearAllMocks();
            // Mock commander program
            mockProgram = new Command();
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
        let ipfsCommand;
        let mockProgram;
        beforeEach(() => {
            jest.clearAllMocks();
            // Mock commander program
            mockProgram = new Command();
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
        let agentCommand;
        let mockProgram;
        beforeEach(() => {
            jest.clearAllMocks();
            // Mock commander program
            mockProgram = new Command();
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
        let crossIntegration;
        let mockTaskCommand;
        let mockIPFSCommand;
        let mockAgentCommand;
        beforeEach(() => {
            jest.clearAllMocks();
            // Mock command classes
            mockTaskCommand = new TaskCommand({});
            mockIPFSCommand = new IPFSCommand({});
            mockAgentCommand = new AgentCommand({});
            // Create cross-component integration
            crossIntegration = new CrossIntegration(mockTaskCommand, mockIPFSCommand, mockAgentCommand);
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
//# sourceMappingURL=components.test.js.map