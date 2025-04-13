import { HelpGenerator, HelpFormatOptions } from '../../../src/commands/help-generator';
import { CommandRegistry, Command } from '../../../src/command-registry';
import { expect } from 'chai';
import * as sinon from 'sinon';

describe('Help Generator', () => {
  let helpGenerator: HelpGenerator;
  let commandRegistry: CommandRegistry;
  let commands: Command[];
  
  beforeEach(() => {
    // Set up command registry with mock commands
    commandRegistry = CommandRegistry.getInstance();
    
    // Mock methods
    sinon.stub(commandRegistry, 'getCommand');
    sinon.stub(commandRegistry, 'getAllCommands');
    sinon.stub(commandRegistry, 'getCommandsByCategory');
    sinon.stub(commandRegistry, 'getCategories');
    
    // Create test commands
    commands = [
      {
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
          }
        ],
        examples: [
          'swissknife test --input value',
          'swissknife test -f -i value'
        ],
        category: 'test',
        handler: async () => 0
      },
      {
        id: 'config',
        name: 'config',
        description: 'Configuration command',
        subcommands: [
          {
            id: 'config:set',
            name: 'set',
            description: 'Set configuration value',
            handler: async () => 0
          },
          {
            id: 'config:get',
            name: 'get',
            description: 'Get configuration value',
            handler: async () => 0
          }
        ],
        category: 'core',
        handler: async () => 0
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
    
    // Configure method responses
    (commandRegistry.getCommand as sinon.SinonStub)
      .withArgs('test').returns(commands[0])
      .withArgs('config').returns(commands[1])
      .withArgs('help').returns(commands[2]);
    
    (commandRegistry.getAllCommands as sinon.SinonStub).returns(commands);
    
    (commandRegistry.getCommandsByCategory as sinon.SinonStub)
      .withArgs('test').returns([commands[0]])
      .withArgs('core').returns([commands[1], commands[2]]);
    
    (commandRegistry.getCategories as sinon.SinonStub).returns(['test', 'core']);
    
    // Create help generator
    helpGenerator = new HelpGenerator();
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  it('should generate general help text', () => {
    const helpText = helpGenerator.generateHelp();
    
    // Verify general structure
    expect(helpText).to.include('SwissKnife CLI');
    expect(helpText).to.include('USAGE:');
    
    // Verify categories
    expect(helpText).to.include('TEST:');
    expect(helpText).to.include('CORE:');
    
    // Verify commands
    expect(helpText).to.include('test');
    expect(helpText).to.include('config');
    expect(helpText).to.include('help');
    
    // Verify descriptions
    expect(helpText).to.include('Test command');
    expect(helpText).to.include('Configuration command');
    expect(helpText).to.include('Display help');
  });
  
  it('should generate help for a specific command', () => {
    const helpText = helpGenerator.generateHelp('test');
    
    // Verify command info
    expect(helpText).to.include('test - Test command');
    
    // Verify usage
    expect(helpText).to.include('USAGE:');
    expect(helpText).to.include('swissknife test [OPTIONS]');
    
    // Verify options
    expect(helpText).to.include('OPTIONS:');
    expect(helpText).to.include('--flag, -f');
    expect(helpText).to.include('--input, -i <string>');
    expect(helpText).to.include('(required)');
    expect(helpText).to.include('(default: false)');
    
    // Verify examples
    expect(helpText).to.include('EXAMPLES:');
    expect(helpText).to.include('swissknife test --input value');
    expect(helpText).to.include('swissknife test -f -i value');
  });
  
  it('should generate help for a command with subcommands', () => {
    const helpText = helpGenerator.generateHelp('config');
    
    // Verify command info
    expect(helpText).to.include('config - Configuration command');
    
    // Verify subcommands
    expect(helpText).to.include('SUBCOMMANDS:');
    expect(helpText).to.include('set');
    expect(helpText).to.include('get');
    expect(helpText).to.include('Set configuration value');
    expect(helpText).to.include('Get configuration value');
  });
  
  it('should generate help for a command with aliases', () => {
    const helpText = helpGenerator.generateHelp('help');
    
    // Verify command info
    expect(helpText).to.include('help - Display help');
    
    // Verify aliases
    expect(helpText).to.include('ALIASES:');
    expect(helpText).to.include('?, h');
  });
  
  it('should handle command not found', () => {
    const helpText = helpGenerator.generateHelp('unknown');
    
    // Verify error message
    expect(helpText).to.include('Command not found: unknown');
    expect(helpText).to.include("Run 'swissknife help'");
  });
  
  it('should respect format options', () => {
    // Test with minimal options
    const minimalOptions: HelpFormatOptions = {
      includeExamples: false,
      includeOptions: false,
      includeSubcommands: false,
      includeAliases: false
    };
    
    const minimalHelpText = helpGenerator.generateHelp('test', minimalOptions);
    
    // Verify minimal content
    expect(minimalHelpText).to.include('test - Test command');
    expect(minimalHelpText).to.include('USAGE:');
    
    // Verify options are excluded
    expect(minimalHelpText).not.to.include('OPTIONS:');
    expect(minimalHelpText).not.to.include('--flag');
    
    // Verify examples are excluded
    expect(minimalHelpText).not.to.include('EXAMPLES:');
  });
  
  it('should generate markdown documentation', () => {
    const markdown = helpGenerator.generateMarkdownDocs();
    
    // Verify structure
    expect(markdown).to.include('# SwissKnife CLI Documentation');
    expect(markdown).to.include('## Overview');
    expect(markdown).to.include('## Usage');
    
    // Verify categories
    expect(markdown).to.include('## test');
    expect(markdown).to.include('## core');
    
    // Verify command documentation
    expect(markdown).to.include('### test');
    expect(markdown).to.include('### config');
    expect(markdown).to.include('### help');
    
    // Verify markdown formatting
    expect(markdown).to.include('```');
    expect(markdown).to.include('| Option | Type | Description | Default |');
    expect(markdown).to.include('|--------|------|-------------|--------|');
  });
  
  it('should create a help command implementation', () => {
    const helpCommand = helpGenerator.createHelpCommand();
    
    // Verify command structure
    expect(helpCommand.id).to.equal('help');
    expect(helpCommand.name).to.equal('help');
    expect(helpCommand.description).to.include('Display help');
    expect(helpCommand.options).to.be.an('array');
    expect(helpCommand.examples).to.be.an('array');
    expect(helpCommand.handler).to.be.a('function');
    
    // Verify options
    const markdownOption = helpCommand.options?.find(opt => opt.name === 'markdown');
    expect(markdownOption).to.exist;
    expect(markdownOption?.type).to.equal('boolean');
  });
});