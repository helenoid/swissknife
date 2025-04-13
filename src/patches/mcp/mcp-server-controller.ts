/**
 * MCP Server Controller
 * 
 * This class manages the lifecycle of an MCP server and provides
 * a clean API for starting, stopping, and interacting with the server.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  CallToolResultSchema,
  ListToolsRequestSchema,
  ListToolsResultSchema,
  ToolSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { AgentTool } from '../../tools/AgentTool/AgentTool';
import { BashTool } from '../../tools/BashTool/BashTool';
import { FileEditTool } from '../../tools/FileEditTool/FileEditTool';
import { FileReadTool } from '../../tools/FileReadTool/FileReadTool';
import { GlobTool } from '../../tools/GlobTool/GlobTool';
import { GrepTool } from '../../tools/GrepTool/GrepTool';
import { FileWriteTool } from '../../tools/FileWriteTool/FileWriteTool';
import { LSTool } from '../../tools/lsTool/lsTool';
import { Tool } from '../../Tool';
import { Command } from '../../commands';
import review from '../../commands/review';
import { lastX } from '../../utils/generators';
import { MACRO } from '../../constants/macros';
import { hasPermissionsToUseTool } from '../../permissions';
import { getSlowAndCapableModel } from '../../utils/model';
import { logError } from '../../utils/log';
import { setCwd } from '../../utils/state';
import { ServerTransport } from '@modelcontextprotocol/sdk/server/transport.js';

// Load patches
import '../../patches';

type ToolInput = z.infer<typeof ToolSchema.shape.inputSchema>;

/**
 * Controller for managing the MCP server
 */
export class MCPServerController {
  private server: Server;
  private transport?: ServerTransport;
  private connected: boolean = false;
  private tools: Tool[];
  private commands: Command[];
  private state: {
    readFileTimestamps: Record<string, number>;
  };
  
  /**
   * Create a new MCP Server Controller
   */
  constructor() {
    // Initialize server
    this.server = new Server(
      {
        name: 'claude/tengu',
        version: MACRO.VERSION,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    
    // Initialize tools and commands
    this.tools = [
      AgentTool,
      BashTool,
      FileEditTool,
      FileReadTool,
      GlobTool,
      GrepTool,
      FileWriteTool,
      LSTool,
    ];
    
    this.commands = [review];
    
    // Initialize state
    this.state = {
      readFileTimestamps: {},
    };
    
    // Register request handlers
    this.registerRequestHandlers();
  }
  
  /**
   * Register the request handlers for the server
   */
  private registerRequestHandlers(): void {
    // Handler for listing tools
    this.server.setRequestHandler(
      ListToolsRequestSchema,
      async (): Promise<z.infer<typeof ListToolsResultSchema>> => {
        const tools = await Promise.all(
          this.tools.map(async tool => ({
            ...tool,
            description: await tool.description(z.object({})),
            inputSchema: zodToJsonSchema(tool.inputSchema) as ToolInput,
          }))
        );
        
        return {
          tools,
        };
      }
    );
    
    // Handler for calling tools
    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request): Promise<z.infer<typeof CallToolResultSchema>> => {
        const { name, arguments: args } = request.params;
        const tool = this.tools.find(_ => _.name === name);
        
        if (!tool) {
          throw new Error(`Tool ${name} not found`);
        }
        
        try {
          if (!(await tool.isEnabled())) {
            throw new Error(`Tool ${name} is not enabled`);
          }
          
          const model = await getSlowAndCapableModel();
          const validationResult = await tool.validateInput?.(
            (args as never) ?? {},
            {
              abortController: new AbortController(),
              options: {
                commands: this.commands,
                tools: this.tools,
                slowAndCapableModel: model,
                forkNumber: 0,
                messageLogName: 'unused',
                maxThinkingTokens: 0,
              },
              messageId: undefined,
              readFileTimestamps: this.state.readFileTimestamps,
            }
          );
          
          if (validationResult && !validationResult.result) {
            throw new Error(
              `Tool ${name} input is invalid: ${validationResult.message}`
            );
          }
          
          const result = tool.call(
            (args ?? {}) as never,
            {
              abortController: new AbortController(),
              messageId: undefined,
              options: {
                commands: this.commands,
                tools: this.tools,
                slowAndCapableModel: await getSlowAndCapableModel(),
                forkNumber: 0,
                messageLogName: 'unused',
                maxThinkingTokens: 0,
              },
              readFileTimestamps: this.state.readFileTimestamps,
            },
            hasPermissionsToUseTool
          );
          
          const finalResult = await lastX(result);
          
          if (finalResult.type !== 'result') {
            throw new Error(`Tool ${name} did not return a result`);
          }
          
          return {
            content: Array.isArray(finalResult)
              ? finalResult.map(item => ({
                  type: 'text' as const,
                  text: 'text' in item ? item.text : JSON.stringify(item),
                }))
              : [
                  {
                    type: 'text' as const,
                    text:
                      typeof finalResult === 'string'
                        ? finalResult
                        : JSON.stringify(finalResult.data),
                  },
                ],
          };
        } catch (error) {
          logError(`Error executing tool ${name}: ${error}`);
          return {
            isError: true,
            content: [
              {
                type: 'text',
                text: `Error: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
          };
        }
      }
    );
  }
  
  /**
   * Start the MCP server with the specified working directory
   * @param cwd The current working directory for the server
   * @param transport Optional custom transport (uses StdioServerTransport by default)
   */
  async start(cwd: string, transport?: ServerTransport): Promise<void> {
    if (this.connected) {
      throw new Error('MCP server is already running');
    }
    
    // Set the current working directory
    await setCwd(cwd);
    
    // Use the provided transport or create a StdioServerTransport
    this.transport = transport || new StdioServerTransport();
    
    // Connect the server to the transport
    await this.server.connect(this.transport);
    this.connected = true;
    
    console.log(`MCP server started in directory: ${cwd}`);
  }
  
  /**
   * Stop the MCP server
   */
  async stop(): Promise<void> {
    if (!this.connected) {
      // Already stopped, nothing to do
      return;
    }
    
    await this.server.disconnect();
    this.connected = false;
    
    console.log('MCP server stopped');
  }
  
  /**
   * Check if the server is running
   */
  isRunning(): boolean {
    return this.connected;
  }
  
  /**
   * Get the list of available tools
   */
  getTools(): Tool[] {
    return [...this.tools];
  }
  
  /**
   * Get the list of available commands
   */
  getCommands(): Command[] {
    return [...this.commands];
  }
  
  /**
   * Add a custom tool to the server
   * @param tool The tool to add
   */
  addTool(tool: Tool): void {
    if (!this.tools.some(t => t.name === tool.name)) {
      this.tools.push(tool);
    }
  }
  
  /**
   * Add a custom command to the server
   * @param command The command to add
   */
  addCommand(command: Command): void {
    if (!this.commands.some(c => c.name === command.name)) {
      this.commands.push(command);
    }
  }
}