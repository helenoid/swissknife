/**
 * Unit Tests for the HelpGenerator class (`src/commands/help-generator.js`).
 *
 * These tests verify the HelpGenerator's ability to format help text for
 * individual commands and generate overall help/documentation based on
 * command definitions retrieved from a mocked CommandRegistry.
 */
// --- Mock Setup ---
// Add .js extension
// Mock CommandRegistry and its methods
// Assume CommandRegistry is instantiated directly, not a singleton
const mockCommandRegistryInstance = {
    getCommand: jest.fn(),
    getAllCommands: jest.fn(),
    getCommandsByCategory: jest.fn(),
    getCategories: jest.fn(),
    // Add other methods if HelpGenerator uses them
};
jest.mock('../../../src/commands/registry.ts', () => ({
    CommandRegistry: jest.fn().mockImplementation(() => mockCommandRegistryInstance),
}));
// --- Imports ---
const { CommandRegistry } = require('../../../src/commands/registry.ts');
// Add .js extension
// Add .js/.ts extension to relative imports
// Add .js extension
// Add .js extension
// Add .js extension
// Add .js extension to relative imports
// Add .js extension to relative imports
// --- Test Data ---
// Define mock commands used in tests
const mockCommands = [
    {
        id: 'test',
        name: 'test',
        description: 'Test command',
        options: [
            { name: 'flag', alias: 'f', type: 'boolean', description: 'Test flag', default: false },
            { name: 'input', alias: 'i', type: 'string', description: 'Test input', required: true }
        ],
        examples: ['swissknife test --input value', 'swissknife test -f -i value'],
        category: 'test',
        handler: async () => 0
    },
    {
        id: 'config',
        name: 'config',
        description: 'Configuration command',
        subcommands: [
            { id: 'config:set', name: 'set', description: 'Set configuration value', handler: async () => 0 },
            { id: 'config:get', name: 'get', description: 'Get configuration value', handler: async () => 0 }
        ],
        category: 'core',
        handler: async () => 0 // Parent command might have a default handler or just show help
    },
    {
        id: 'help',
        name: 'help',
        description: 'Display help',
        aliases: ['?', 'h'],
        category: 'core',
        handler: async () => 0
    }
];
// --- Test Suite ---
describe('HelpGenerator', () => {
    let helpGenerator;
    // Use the mocked instance type for clarity, cast to any if needed
    let commandRegistry;
    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        // Get the singleton instance of CommandRegistry
        commandRegistry = CommandRegistry.getInstance(); // Use 'as any' to bypass strict type check
        // Configure mock responses for registry methods
        commandRegistry.getCommand.mockImplementation((name) => {
            return mockCommands.find(cmd => cmd.name === name || cmd.aliases?.includes(name));
        });
        commandRegistry.getAllCommands.mockReturnValue(mockCommands); // Cast if Command type differs
        commandRegistry.getCommandsByCategory.mockImplementation((category) => {
            return mockCommands.filter(cmd => cmd.category === category);
        });
        commandRegistry.getCategories.mockReturnValue(['test', 'core']);
        // Create help generator instance for each test, potentially injecting registry if needed
        // Assuming HelpGenerator uses CommandRegistry.getInstance() internally, which is mocked
        helpGenerator = new HelpGenerator();
    });
    // --- Test Cases ---
    it('should generate general help text listing categories and commands', () => {
        // Act
        const helpText = helpGenerator.generateHelp();
        // Assert
        // Verify general structure
        expect(helpText).toContain('SwissKnife CLI'); // Or appropriate title
        expect(helpText).toContain('USAGE:');
        expect(helpText).toContain('swissknife <command> [options]'); // Example usage
        // Verify categories are listed (case might differ based on implementation)
        expect(helpText).toMatch(/TEST:/i);
        expect(helpText).toMatch(/CORE:/i);
        // Verify commands within categories
        // Use regex for flexibility with spacing/formatting
        expect(helpText).toMatch(/test\s+- Test command/);
        expect(helpText).toMatch(/config\s+- Configuration command/);
        expect(helpText).toMatch(/help\s+- Display help/);
    });
    it('should generate specific help text for a command with options and examples', () => {
        // Arrange
        const commandName = 'test';
        // Act
        const helpText = helpGenerator.generateHelp(commandName);
        // Assert
        // Verify command info
        expect(helpText).toContain('test - Test command');
        // Verify usage section
        expect(helpText).toContain('USAGE:');
        expect(helpText).toContain(`swissknife ${commandName} [OPTIONS]`); // Adjust based on actual format
        // Verify options section
        expect(helpText).toContain('OPTIONS:');
        expect(helpText).toMatch(/--flag,\s+-f\s+Test flag\s+\(default: false\)/); // Check boolean option
        expect(helpText).toMatch(/--input,\s+-i\s+<string>\s+Test input\s+\(required\)/); // Check required string option
        // Verify examples section
        expect(helpText).toContain('EXAMPLES:');
        expect(helpText).toContain('swissknife test --input value');
        expect(helpText).toContain('swissknife test -f -i value');
    });
    it('should generate specific help text for a command with subcommands', () => {
        // Arrange
        const commandName = 'config';
        // Act
        const helpText = helpGenerator.generateHelp(commandName);
        // Assert
        // Verify command info
        expect(helpText).toContain('config - Configuration command');
        // Verify subcommands section
        expect(helpText).toContain('SUBCOMMANDS:');
        expect(helpText).toMatch(/set\s+- Set configuration value/);
        expect(helpText).toMatch(/get\s+- Get configuration value/);
        // Verify it suggests help for subcommands
        expect(helpText).toContain('Run `swissknife config <subcommand> --help` for more information');
    });
    it('should generate specific help text for a command with aliases', () => {
        // Arrange
        const commandName = 'help';
        // Act
        const helpText = helpGenerator.generateHelp(commandName);
        // Assert
        // Verify command info
        expect(helpText).toContain('help - Display help');
        // Verify aliases section
        expect(helpText).toContain('ALIASES:');
        expect(helpText).toContain('?, h');
    });
    it('should return an error message if the command is not found', () => {
        // Arrange
        const commandName = 'unknown-command';
        commandRegistry.getCommand.mockReturnValueOnce(undefined); // Ensure command is not found
        // Act
        const helpText = helpGenerator.generateHelp(commandName);
        // Assert
        expect(helpText).toContain(`Command not found: ${commandName}`);
        expect(helpText).toContain("Run 'swissknife help' for a list of available commands.");
    });
    it('should respect format options to exclude sections', () => {
        // Arrange
        const commandName = 'test';
        const minimalOptions = {
            includeExamples: false,
            includeOptions: false,
            includeSubcommands: false,
            includeAliases: false, // Although 'test' has no aliases
        };
        // Act
        const minimalHelpText = helpGenerator.generateHelp(commandName, minimalOptions);
        // Assert: Check included content
        expect(minimalHelpText).toContain('test - Test command');
        expect(minimalHelpText).toContain('USAGE:');
        // Assert: Check excluded content
        expect(minimalHelpText).not.toContain('OPTIONS:');
        expect(minimalHelpText).not.toContain('--flag');
        expect(minimalHelpText).not.toContain('EXAMPLES:');
        expect(minimalHelpText).not.toContain('ALIASES:');
        expect(minimalHelpText).not.toContain('SUBCOMMANDS:');
    });
    it('should generate markdown documentation for all commands', () => {
        // Act
        const markdown = helpGenerator.generateMarkdownDocs();
        // Assert: Basic structure
        expect(markdown).toContain('# SwissKnife CLI Documentation');
        expect(markdown).toContain('## Overview');
        expect(markdown).toContain('## Usage');
        // Assert: Categories
        expect(markdown).toContain('## test');
        expect(markdown).toContain('## core');
        // Assert: Command sections
        expect(markdown).toContain('### `test`');
        expect(markdown).toContain('### `config`');
        expect(markdown).toContain('### `help`');
        // Assert: Details for a specific command (e.g., 'test')
        expect(markdown).toMatch(/### `test`\s+Test command/); // Header and description
        expect(markdown).toContain('#### Usage');
        expect(markdown).toContain('```bash\nswissknife test [OPTIONS]\n```');
        expect(markdown).toContain('#### Options');
        expect(markdown).toContain('| Option        | Alias | Type      | Description | Required | Default |'); // Table header
        expect(markdown).toContain('| `--flag`      | `-f`  | `boolean` | Test flag   | No       | `false` |');
        expect(markdown).toContain('| `--input`     | `-i`  | `string`  | Test input  | Yes      |         |');
        expect(markdown).toContain('#### Examples');
        expect(markdown).toContain('```bash\nswissknife test --input value\n```');
        // Assert: Subcommand listing for 'config'
        expect(markdown).toMatch(/### `config`\s+Configuration command/);
        expect(markdown).toContain('#### Subcommands');
        expect(markdown).toContain('- **`set`**: Set configuration value');
        expect(markdown).toContain('- **`get`**: Get configuration value');
    });
    it('should create a functional help command definition', () => {
        // Act
        const helpCommand = helpGenerator.createHelpCommand();
        // Assert: Command definition structure
        expect(helpCommand).toBeDefined();
        expect(helpCommand.name).toBe('help');
        expect(helpCommand.description).toContain('Display help information');
        expect(helpCommand.options).toBeInstanceOf(Array);
        expect(helpCommand.handler).toBeInstanceOf(Function);
        // Assert: Specific options for the help command itself
        const commandArgOption = helpCommand.options?.find((opt) => opt.name === 'command'); // Add type 'any'
        expect(commandArgOption).toBeDefined();
        expect(commandArgOption?.type).toBe('string'); // Expecting command name as string arg
        // Optional: Test the handler function (requires mocking console.log or context)
        // const mockContext = { args: { _: ['test'] } } as any;
        // await helpCommand.handler(mockContext);
        // Verify helpGenerator.generateHelp('test') was called indirectly
    });
});
//# sourceMappingURL=help-generator.test.js.map