import { CommandRegistry, Command } from '../../../../src/command-registry';
import { expect } from 'chai';

describe('Command Parser', () => {
  let registry: CommandRegistry;
  
  beforeEach(() => {
    // Reset the singleton for testing
    (CommandRegistry as any).instance = null;
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
    const result = registry.parseCommandLine(['node', 'script.js', 'test', '--input', 'value']);
    
    expect(result).to.not.be.null;
    expect(result?.command.id).to.equal('test');
    expect(result?.args.input).to.equal('value');
    expect(result?.args.flag).to.equal(false);
  });
  
  it('should parse a command with flags', () => {
    const result = registry.parseCommandLine(['node', 'script.js', 'test', '-f', '--input', 'value']);
    
    expect(result).to.not.be.null;
    expect(result?.command.id).to.equal('test');
    expect(result?.args.input).to.equal('value');
    expect(result?.args.flag).to.equal(true);
  });

  it('should parse equals format for options', () => {
    const result = registry.parseCommandLine(['node', 'script.js', 'test', '--input=value', '--count=42']);
    
    expect(result).to.not.be.null;
    expect(result?.command.id).to.equal('test');
    expect(result?.args.input).to.equal('value');
    expect(result?.args.count).to.equal(42);
  });
  
  it('should parse a subcommand', () => {
    const result = registry.parseCommandLine(['node', 'script.js', 'test', 'subcommand']);
    
    expect(result).to.not.be.null;
    expect(result?.command.id).to.equal('test:subcommand');
    expect(result?.subcommands).to.deep.equal(['subcommand']);
  });

  it('should parse nested subcommands', () => {
    const result = registry.parseCommandLine(['node', 'script.js', 'config', 'set', '--global']);
    
    expect(result).to.not.be.null;
    expect(result?.command.id).to.equal('config:set');
    expect(result?.args.global).to.equal(true);
    expect(result?.subcommands).to.deep.equal(['set']);
  });
  
  it('should return null for unknown command', () => {
    const result = registry.parseCommandLine(['node', 'script.js', 'unknown']);
    
    expect(result).to.be.null;
  });
  
  it('should handle positional arguments', () => {
    const result = registry.parseCommandLine(['node', 'script.js', 'test', '--input', 'value', 'pos1', 'pos2']);
    
    expect(result).to.not.be.null;
    expect(result?.command.id).to.equal('test');
    expect(result?.args._).to.deep.equal(['pos1', 'pos2']);
  });

  it('should apply default values for missing options', () => {
    const result = registry.parseCommandLine(['node', 'script.js', 'test', '--input', 'value']);
    
    expect(result).to.not.be.null;
    expect(result?.args.count).to.equal(1);
    expect(result?.args.flag).to.equal(false);
  });

  it('should parse numeric values correctly', () => {
    const result = registry.parseCommandLine(['node', 'script.js', 'test', '--input', 'value', '--count', '42']);
    
    expect(result).to.not.be.null;
    expect(result?.args.count).to.equal(42);
  });

  it('should parse boolean values correctly', () => {
    const result = registry.parseCommandLine(['node', 'script.js', 'test', '--input', 'value', '--flag', 'true']);
    
    expect(result).to.not.be.null;
    expect(result?.args.flag).to.equal(true);
  });

  it('should handle options with short aliases', () => {
    const result = registry.parseCommandLine(['node', 'script.js', 'test', '-i', 'value', '-c', '5']);
    
    expect(result).to.not.be.null;
    expect(result?.args.input).to.equal('value');
    expect(result?.args.count).to.equal(5);
  });
});