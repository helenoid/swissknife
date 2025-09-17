/**
 * Flexible Command Interpreter
 * 
 * Provides AI-powered natural language command interpretation similar to 
 * GitHub Codex/Claude Code, making the CLI more conversational and flexible.
 */

import { BaseCommand, CommandContext, CommandResult, CommandOptions } from './base.js';
import { sharedCommandRegistry } from './base.js';
import { aiManager } from '../ai/index.js';

export interface InterpretationResult {
  command?: string;
  args: string[];
  options: CommandOptions;
  confidence: number;
  intent: string;
  suggestions?: string[];
}

export class FlexibleCommandInterpreter {
  private static instance: FlexibleCommandInterpreter;

  static getInstance(): FlexibleCommandInterpreter {
    if (!FlexibleCommandInterpreter.instance) {
      FlexibleCommandInterpreter.instance = new FlexibleCommandInterpreter();
    }
    return FlexibleCommandInterpreter.instance;
  }

  /**
   * Interpret natural language input and convert it to executable commands
   */
  async interpret(input: string, context: CommandContext): Promise<InterpretationResult> {
    const trimmedInput = input.trim();
    
    // Handle empty input
    if (!trimmedInput) {
      return {
        args: [],
        options: {},
        confidence: 0,
        intent: 'empty',
        suggestions: ['Try asking for help or describing what you want to do']
      };
    }

    // Try direct command matching first
    const directMatch = this.tryDirectCommandMatch(trimmedInput, context);
    if (directMatch.confidence > 0.8) {
      return directMatch;
    }

    // Use AI to interpret natural language
    const aiInterpretation = await this.interpretWithAI(trimmedInput, context);
    if (aiInterpretation.confidence > 0.6) {
      return aiInterpretation;
    }

    // Fall back to pattern matching
    const patternMatch = this.interpretWithPatterns(trimmedInput, context);
    
    return patternMatch;
  }

  /**
   * Execute interpreted command
   */
  async execute(input: string, context: CommandContext): Promise<CommandResult> {
    const interpretation = await this.interpret(input, context);
    
    if (!interpretation.command) {
      return {
        success: false,
        output: `I couldn't understand what you want to do. ${interpretation.suggestions?.join(' ') || ''}`,
        error: 'Command interpretation failed',
        exitCode: 1,
        metadata: {
          timestamp: Date.now(),
          duration: 0,
          command: 'unknown'
        }
      };
    }

    return await sharedCommandRegistry.execute(
      interpretation.command,
      interpretation.args,
      interpretation.options,
      context
    );
  }

  /**
   * Try to match input directly to known commands
   */
  private tryDirectCommandMatch(input: string, context: CommandContext): InterpretationResult {
    const words = input.split(/\s+/);
    const possibleCommand = words[0];
    
    // Check if first word is a known command
    const command = sharedCommandRegistry.get(possibleCommand);
    if (command && command.isAvailable(context)) {
      const parsed = command.parseNaturalLanguage(input.substring(possibleCommand.length).trim());
      return {
        command: possibleCommand,
        args: parsed.args,
        options: parsed.options,
        confidence: 0.9,
        intent: 'direct_command'
      };
    }

    // Check for partial matches
    const availableCommands = sharedCommandRegistry.list(context);
    const partialMatches = availableCommands.filter(cmd => 
      cmd.name.startsWith(possibleCommand) || 
      cmd.aliases.some(alias => alias.startsWith(possibleCommand))
    );

    if (partialMatches.length === 1) {
      const cmd = partialMatches[0];
      const parsed = cmd.parseNaturalLanguage(input.substring(possibleCommand.length).trim());
      return {
        command: cmd.name,
        args: parsed.args,
        options: parsed.options,
        confidence: 0.7,
        intent: 'partial_match'
      };
    }

    return {
      args: words,
      options: {},
      confidence: 0,
      intent: 'no_direct_match',
      suggestions: partialMatches.map(cmd => cmd.name)
    };
  }

  /**
   * Use AI to interpret natural language commands
   */
  private async interpretWithAI(input: string, context: CommandContext): Promise<InterpretationResult> {
    try {
      const availableCommands = sharedCommandRegistry.list(context);
      const commandList = availableCommands.map(cmd => ({
        name: cmd.name,
        description: cmd.description,
        usage: cmd.usage,
        aliases: cmd.aliases
      }));

      const prompt = `
You are a command interpreter for SwissKnife CLI. Given the user input and available commands, 
determine the most appropriate command to execute.

User input: "${input}"
Context: ${context.environment} environment

Available commands:
${commandList.map(cmd => `- ${cmd.name}: ${cmd.description} (Usage: ${cmd.usage})`).join('\n')}

Respond with JSON in this format:
{
  "command": "command_name" or null,
  "args": ["arg1", "arg2"],
  "options": {"option": "value"},
  "confidence": 0.0-1.0,
  "intent": "description of what user wants",
  "reasoning": "why you chose this interpretation"
}

If you're not confident about the interpretation, set command to null and provide suggestions.
`;

      const response = await aiManager.generateText(prompt, {
        maxTokens: 500,
        temperature: 0.3
      });

      try {
        const parsed = JSON.parse(response);
        return {
          command: parsed.command,
          args: parsed.args || [],
          options: parsed.options || {},
          confidence: Math.min(parsed.confidence || 0, 0.9), // Cap AI confidence
          intent: parsed.intent || 'ai_interpretation',
          suggestions: parsed.suggestions
        };
      } catch (parseError) {
        console.warn('Failed to parse AI response:', parseError);
        return this.interpretWithPatterns(input, context);
      }
    } catch (error) {
      console.warn('AI interpretation failed:', error);
      return this.interpretWithPatterns(input, context);
    }
  }

  /**
   * Use pattern matching for command interpretation
   */
  private interpretWithPatterns(input: string, context: CommandContext): InterpretationResult {
    const lowerInput = input.toLowerCase();
    
    // Common patterns
    const patterns = [
      {
        pattern: /^(show|list|get)\s+(.+)/,
        command: 'list',
        confidence: 0.6,
        intent: 'list_items'
      },
      {
        pattern: /^(create|make|add|new)\s+(.+)/,
        command: 'create',
        confidence: 0.6,
        intent: 'create_item'
      },
      {
        pattern: /^(delete|remove|rm)\s+(.+)/,
        command: 'delete',
        confidence: 0.6,
        intent: 'delete_item'
      },
      {
        pattern: /^(help|h|\?)/,
        command: 'help',
        confidence: 0.8,
        intent: 'get_help'
      },
      {
        pattern: /^(status|state|info)/,
        command: 'status',
        confidence: 0.7,
        intent: 'get_status'
      }
    ];

    for (const pattern of patterns) {
      const match = lowerInput.match(pattern.pattern);
      if (match) {
        const command = sharedCommandRegistry.get(pattern.command);
        if (command && command.isAvailable(context)) {
          return {
            command: pattern.command,
            args: match.slice(2) || [],
            options: {},
            confidence: pattern.confidence,
            intent: pattern.intent
          };
        }
      }
    }

    // If no patterns match, suggest help
    return {
      args: input.split(/\s+/),
      options: {},
      confidence: 0.1,
      intent: 'unknown',
      suggestions: [
        'Try "help" to see available commands',
        'Use more specific language like "show status" or "create task"',
        'Check the command syntax with "help <command>"'
      ]
    };
  }

  /**
   * Get suggestions for partial input
   */
  async getSuggestions(partialInput: string, context: CommandContext): Promise<string[]> {
    const availableCommands = sharedCommandRegistry.list(context);
    const words = partialInput.toLowerCase().split(/\s+/);
    const lastWord = words[words.length - 1];

    // Command name suggestions
    if (words.length === 1) {
      return availableCommands
        .filter(cmd => cmd.name.startsWith(lastWord) || 
                      cmd.aliases.some(alias => alias.startsWith(lastWord)))
        .map(cmd => cmd.name)
        .slice(0, 5);
    }

    // Use AI for more complex suggestions if available
    try {
      const prompt = `
Given partial input "${partialInput}" in ${context.environment} environment,
suggest 3-5 completions or next words. Respond with JSON array of strings.
Available commands: ${availableCommands.map(cmd => cmd.name).join(', ')}
`;

      const response = await aiManager.generateText(prompt, {
        maxTokens: 200,
        temperature: 0.5
      });

      const suggestions = JSON.parse(response);
      if (Array.isArray(suggestions)) {
        return suggestions.slice(0, 5);
      }
    } catch (error) {
      // Fall back to simple suggestions
    }

    return ['--help', 'status', 'list'];
  }
}

export const flexibleCommandInterpreter = FlexibleCommandInterpreter.getInstance();