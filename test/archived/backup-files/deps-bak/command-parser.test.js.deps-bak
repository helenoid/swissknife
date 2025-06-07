import { CommandRegistry } from '@/commands/registry';
import { parseCommandLine } from '@/commands/parser'; // Import parseCommandLine

describe('Command Parser', () => {
    let registry;
    beforeEach(() => {
        // Reset the singleton for testing
        // Accessing a private member for testing purposes
        CommandRegistry.instance = null;
        registry = CommandRegistry.getInstance();
        // Register test commands
        registry.registerCommand({
            id: 'test',
            name: 'test',
            description: 'Test command',
            options: [
                {
                    name: 'flag',
                    alias: 'f',
                    type: 'boolean',
                    description: 'Test flag',
                    default: false
                },
                {
                    name: 'input',
                    alias: 'i',
                    type: 'string',
                    description: 'Test input',
                    required: true
                },
                {
                    name: 'count',
                    alias: 'c',
                    type: 'number',
                    description: 'Test count',
                    default: 1
                }
            ],
            handler: async () => 0
        });
        registry.registerCommand({
            id: 'test:subcommand',
            name: 'subcommand',
            description: 'Test subcommand',
            handler: async () => 0
        });
        registry.registerCommand({
            id: 'config',
            name: 'config',
            description: 'Configuration command',
            handler: async () => 0
        });
        registry.registerCommand({
            id: 'config:set',
            name: 'set',
            description: 'Set configuration value',
            options: [
                {
                    name: 'global',
                    alias: 'g',
                    type: 'boolean',
                    description: 'Set globally',
                    default: false
                }
            ],
            handler: async () => 0
        });
    });
    it('should parse a simple command', () => {
        const result = parseCommandLine(['node', 'script.js', 'test', '--input', 'value']);
        expect(result).not.toBeNull();
        expect(result?.command.id).toBe('test');
        expect(result?.args.input).toBe('value');
        expect(result?.args.flag).toBe(false);
    });
    it('should parse a command with flags', () => {
        const result = parseCommandLine(['node', 'script.js', 'test', '-f', '--input', 'value']);
        expect(result).not.toBeNull();
        expect(result?.command.id).toBe('test');
        expect(result?.args.input).toBe('value');
        expect(result?.args.flag).toBe(true);
    });
    it('should parse equals format for options', () => {
        const result = parseCommandLine(['node', 'script.js', 'test', '--input=value', '--count=42']);
        expect(result).not.toBeNull();
        expect(result?.command.id).toBe('test');
        expect(result?.args.input).toBe('value');
        expect(result?.args.count).toBe(42);
    });
    it('should parse a subcommand', () => {
        const result = parseCommandLine(['node', 'script.js', 'test', 'subcommand']);
        expect(result).not.toBeNull();
        expect(result?.command.id).toBe('test:subcommand');
        expect(result?.subcommands).toEqual(['subcommand']);
    });
    it('should parse nested subcommands', () => {
        const result = parseCommandLine(['node', 'script.js', 'config', 'set', '--global']);
        expect(result).not.toBeNull();
        expect(result?.command.id).toBe('config:set');
        expect(result?.args.global).toBe(true);
        expect(result?.subcommands).toEqual(['set']);
    });
    it('should return null for unknown command', () => {
        const result = parseCommandLine(['node', 'script.js', 'unknown']);
        expect(result).toBeNull();
    });
    it('should handle positional arguments', () => {
        const result = parseCommandLine(['node', 'script.js', 'test', '--input', 'value', 'pos1', 'pos2']);
        expect(result).not.toBeNull();
        expect(result?.command.id).toBe('test');
        expect(result?.args._).toEqual(['pos1', 'pos2']);
    });
    it('should apply default values for missing options', () => {
        const result = parseCommandLine(['node', 'script.js', 'test', '--input', 'value']);
        expect(result).not.toBeNull();
        expect(result?.args.count).toBe(1);
        expect(result?.args.flag).toBe(false);
    });
    it('should parse numeric values correctly', () => {
        const result = parseCommandLine(['node', 'script.js', 'test', '--input', 'value', '--count', '42']);
        expect(result).not.toBeNull();
        expect(result?.args.count).toBe(42);
    });
    it('should parse boolean values correctly', () => {
        const result = parseCommandLine(['node', 'script.js', 'test', '--input', 'value', '--flag', 'true']);
        expect(result).not.toBeNull();
        expect(result?.args.flag).toBe(true);
    });
    it('should handle options with short aliases', () => {
        const result = parseCommandLine(['node', 'script.js', 'test', '-i', 'value', '-c', '5']);
        expect(result).not.toBeNull();
        expect(result?.args.input).toBe('value');
        expect(result?.args.count).toBe(5);
    });
});
//# sourceMappingURL=command-parser.test.js.map
