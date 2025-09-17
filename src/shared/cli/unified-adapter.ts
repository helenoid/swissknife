/**
 * Unified CLI Adapter
 * 
 * A single CLI adapter that works across all environments (CLI, web, desktop)
 * and provides flexible, AI-powered command interpretation.
 */

import { 
  BaseCommand, 
  CommandContext, 
  CommandResult, 
  sharedCommandRegistry,
  flexibleCommandInterpreter
} from '../commands/index.js';
import { eventBus } from '../events/index.js';

export interface CLISession {
  id: string;
  environment: 'cli' | 'web' | 'desktop';
  workingDirectory: string;
  user: string;
  history: string[];
  context: Record<string, any>;
}

export class UnifiedCLIAdapter {
  private sessions: Map<string, CLISession> = new Map();
  private conversationalMode: boolean = false;

  constructor() {
    this.setupEventListeners();
  }

  /**
   * Create a new CLI session
   */
  createSession(environment: 'cli' | 'web' | 'desktop', options: Partial<CLISession> = {}): CLISession {
    const session: CLISession = {
      id: this.generateSessionId(),
      environment,
      workingDirectory: options.workingDirectory || process.cwd?.() || '/home/user',
      user: options.user || process.env.USER || 'user',
      history: [],
      context: options.context || {},
      ...options
    };

    this.sessions.set(session.id, session);
    return session;
  }

  /**
   * Execute a command in conversational or direct mode
   */
  async executeCommand(input: string, sessionId: string): Promise<CommandResult> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return {
        success: false,
        output: '',
        error: 'Session not found',
        exitCode: 1,
        metadata: {
          timestamp: Date.now(),
          duration: 0,
          command: 'unknown'
        }
      };
    }

    // Add to history
    session.history.push(input);

    // Create command context
    const context: CommandContext = {
      environment: session.environment,
      workingDirectory: session.workingDirectory,
      user: session.user,
      session: session.id,
      ...session.context
    };

    try {
      // Use flexible interpreter for natural language processing
      const result = await flexibleCommandInterpreter.execute(input, context);
      
      // Emit event for logging/monitoring
      eventBus.emit('cli:command:executed', {
        sessionId,
        input,
        result,
        context
      });

      return result;
    } catch (error) {
      const result: CommandResult = {
        success: false,
        output: '',
        error: `Command execution failed: ${(error as Error).message}`,
        exitCode: 1,
        metadata: {
          timestamp: Date.now(),
          duration: 0,
          command: 'error'
        }
      };

      eventBus.emit('cli:command:error', {
        sessionId,
        input,
        error,
        context
      });

      return result;
    }
  }

  /**
   * Get command suggestions for auto-completion
   */
  async getSuggestions(partialInput: string, sessionId: string): Promise<string[]> {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    const context: CommandContext = {
      environment: session.environment,
      workingDirectory: session.workingDirectory,
      user: session.user,
      session: session.id,
      ...session.context
    };

    return await flexibleCommandInterpreter.getSuggestions(partialInput, context);
  }

  /**
   * Enable or disable conversational mode
   */
  setConversationalMode(enabled: boolean): void {
    this.conversational = enabled;
  }

  /**
   * Get session information
   */
  getSession(sessionId: string): CLISession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * List all active sessions
   */
  listSessions(): CLISession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Close a session
   */
  closeSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * Get available commands for an environment
   */
  getAvailableCommands(environment: 'cli' | 'web' | 'desktop'): BaseCommand[] {
    const context: CommandContext = { environment };
    return sharedCommandRegistry.list(context);
  }

  /**
   * Register a new command
   */
  registerCommand(command: BaseCommand): void {
    sharedCommandRegistry.register(command);
  }

  /**
   * Setup event listeners for cross-component communication
   */
  private setupEventListeners(): void {
    // Listen for commands from other components
    eventBus.on('cli:execute', async (data: { command: string; sessionId: string }) => {
      const result = await this.executeCommand(data.command, data.sessionId);
      eventBus.emit('cli:result', { sessionId: data.sessionId, result });
    });

    // Listen for session management requests
    eventBus.on('cli:create-session', (data: { environment: 'cli' | 'web' | 'desktop'; options?: any }) => {
      const session = this.createSession(data.environment, data.options);
      eventBus.emit('cli:session-created', { session });
    });
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Format command result for display
   */
  formatResult(result: CommandResult, format: 'text' | 'json' | 'minimal' = 'text'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(result, null, 2);
        
      case 'minimal':
        return result.success ? result.output : (result.error || 'Command failed');
        
      case 'text':
      default:
        let output = '';
        
        if (result.success) {
          output = result.output;
        } else {
          output = `Error: ${result.error || 'Command failed'}`;
          if (result.exitCode && result.exitCode !== 1) {
            output += ` (exit code: ${result.exitCode})`;
          }
        }

        // Add metadata if verbose mode
        if (result.metadata?.duration) {
          output += `\n[Executed in ${result.metadata.duration}ms]`;
        }

        return output;
    }
  }
}

// Global instance for easy access
export const unifiedCLIAdapter = new UnifiedCLIAdapter();