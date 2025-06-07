// test/unit/commands/registry.test.js

jest.mock('../../../src/commands/registry', () => ({
    CommandRegistry: {
        getInstance: jest.fn().mockReturnThis(),
        registerCommand: jest.fn(),
        getCommand: jest.fn(),
        executeCommand: jest.fn(),
    },
}));
describe('CommandRegistry', () => {
    let registry;
    let context;
    beforeEach(() => {
        registry = CommandRegistry.getInstance();
        context = {}; // Mock ExecutionContext
    });
    it('should register and retrieve a command', async () => {
        const command = {
            id: 'test-command',
            name: 'Test Command',
            description: 'A test command',
            handler: async () => 0,
        };
        registry.registerCommand(command);
        const retrievedCommand = await registry.getCommand('test-command');
        expect(retrievedCommand).toEqual(command);
    });
    it('should handle lazy command loading', async () => {
        const lazyCommand = {
            id: 'lazy-command',
            name: 'Lazy Command',
            description: 'A lazy command',
            handler: async () => 0,
        };
        const lazyCommandWrapper = {
            id: 'lazy-command',
            loader: async () => lazyCommand,
        };
        registry.registerCommand(lazyCommandWrapper);
        const retrievedCommand = await registry.getCommand('lazy-command');
        expect(retrievedCommand).toEqual(lazyCommand);
    });
    it('should execute a command successfully', async () => {
        const command = {
            id: 'test-command',
            name: 'Test Command',
            description: 'A test command',
            handler: async () => 0,
        };
        registry.registerCommand(command);
        const exitCode = await registry.executeCommand('test-command', {}, context);
        expect(exitCode).toBe(0);
    });
    it('should handle command execution errors', async () => {
        const command = {
            id: 'error-command',
            name: 'Error Command',
            description: 'A command that throws an error',
            handler: async () => {
                throw new Error('Test error');
            },
        };
        registry.registerCommand(command);
        const exitCode = await registry.executeCommand('error-command', {}, context);
        expect(exitCode).toBe(1);
    });
    it('should return undefined for non-existent commands', async () => {
        const retrievedCommand = await registry.getCommand('non-existent');
        expect(retrievedCommand).toBeUndefined();
    });
    it('should handle command aliases', async () => {
        const command = {
            id: 'original-command',
            name: 'Original Command',
            description: 'An original command',
            aliases: ['alias-command'],
            handler: async () => 0,
        };
        registry.registerCommand(command);
        const retrievedCommand = await registry.getCommand('alias-command');
        expect(retrievedCommand?.id).toBe('original-command');
    });
});
//# sourceMappingURL=registry.test.js.map