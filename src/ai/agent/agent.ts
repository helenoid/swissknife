import {
  AgentContext,
  Model,
  ModelGenerateInput,
  ModelGenerateOutput,
  Tool,
  ToolExecutionContext,
  ToolInput,
  ToolOutput,
} from '../../types/ai.js';
import { StorageProvider } from '../../types/storage.js';
import { logger } from '../../utils/logger.js';
import { ConfigManager } from '../../config/manager.js';
import { ToolExecutor } from '../tools/executor.js'; 
// Import other necessary types and utilities
import { GraphOfThoughtEngine } from '../../tasks/graph/graph-of-thought.js'; 
import { TaskManager } from '../../tasks/manager.js'; 
import { InferenceExecutor } from '../../ml/inference/executor.js'; 

interface AgentOptions {
  model: Model;
  storage: StorageProvider;
  config: ConfigManager;
  tools?: Tool[];
  useGraphOfThought?: boolean; // Flag to enable GoT
}

export class Agent {
  readonly model: Model; // Make model publicly readable
  private storage: StorageProvider;
  private config: ConfigManager;
  private tools = new Map<string, Tool>();
  private toolExecutor: ToolExecutor; 
  private graphOfThought?: GraphOfThoughtEngine; 
  private taskManager: TaskManager; 
  private inferenceExecutor: InferenceExecutor; 

  constructor(options: AgentOptions) {
    logger.debug('Initializing Agent...');
    this.model = options.model;
    this.storage = options.storage;
    this.config = options.config;
    this.toolExecutor = new ToolExecutor(); 
    // TaskManager no longer needs the model directly
    this.taskManager = new TaskManager({ storage: this.storage }); 
    this.inferenceExecutor = new InferenceExecutor(); 

    // Instantiate GoT engine if the flag is set, passing the agent instance (this)
    if (options.useGraphOfThought) {
      // GoTEngine needs the agent to access model and tools
      this.graphOfThought = new GraphOfThoughtEngine({ storage: this.storage, agent: this }); 
      logger.info('Graph-of-Thought engine enabled for Agent.');
    }

    if (options.tools) {
      options.tools.forEach(tool => this.registerTool(tool));
    }
    logger.info(`Agent initialized with model: ${this.model.id}`);
  }

  registerTool(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      logger.warn(`Tool with name "${tool.name}" is already registered. Overwriting.`);
    }
    logger.debug(`Registering tool: ${tool.name}`);
    this.tools.set(tool.name, tool);
  }

  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  listTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  // Placeholder function to parse tool calls from model output
  private parseToolCall(content: string): { name: string; input: ToolInput } | null {
    // Simple regex example: [TOOL_CALL: tool_name({"arg": "value"})]
    const match = content.match(/\[TOOL_CALL:\s*(\w+)\((.*)\)\]/);
    if (match) {
      const name = match[1];
      const argsString = match[2];
      try {
        const input = JSON.parse(argsString || '{}'); 
        logger.debug(`Parsed tool call: Name=${name}, Input=`, input);
        return { name, input };
      } catch (e) {
        logger.error(`Failed to parse tool arguments for ${name}: ${argsString}`, e);
        return null; 
      }
    }
    return null; 
  }

  /**
   * Processes a user message, potentially involving model generation and tool execution.
   * Uses Graph-of-Thought if enabled, otherwise falls back to direct model interaction.
   */
  async processMessage(message: string, userId?: string, taskId?: string): Promise<string> {
    logger.info(`Processing message (task: ${taskId || 'none'}, user: ${userId || 'unknown'}): "${message}"`);

    // If GoT engine is available and enabled, use it
    if (this.graphOfThought) {
        logger.info('Processing message using Graph-of-Thought engine.');
        try {
            const result = await this.graphOfThought.processQuery(message);
            return result.finalAnswer; 
        } catch (error: any) {
            logger.error('Error during GoT processing:', error);
            return `Sorry, an error occurred during complex processing: ${error.message}`;
        }
    }

    // Fallback to simple model call loop if GoT is not used
    logger.info('Processing message using direct model call (GoT not enabled/available).');
    
    const history: { role: 'User' | 'Assistant' | 'TOOL_RESULT' | 'TOOL_ERROR'; content: string }[] = [
        { role: 'User', content: message }
    ];
    let finalResponse = '';
    const maxIterations = 5; 

    for (let i = 0; i < maxIterations; i++) {
        const currentPrompt = history.map(item => `${item.role}: ${item.content}`).join('\n') + '\nAssistant:'; 
        logger.debug(`Prompt for Iteration ${i+1}:\n${currentPrompt}`);

        const modelInput: ModelGenerateInput = {
            prompt: currentPrompt, 
            maxTokens: 500, 
            temperature: 0.7,
            userId: userId,
            taskId: taskId,
        };

        try {
            const modelOutput: ModelGenerateOutput = await this.model.generate(modelInput);
            
            if (modelOutput.status !== 'success') {
                logger.error('Model generation failed:', modelOutput.error);
                return `Sorry, I encountered an error: ${modelOutput.error || 'Unknown error'}`;
            }

            logger.info(`Model generation successful (Iteration ${i+1}).`);
            logger.debug(`Model Output (Iteration ${i+1}):`, modelOutput.content);

            const toolCall = this.parseToolCall(modelOutput.content);

            if (toolCall) {
                logger.info(`Detected tool call: ${toolCall.name}`);
                try {
                    // Execute tool using the public executeTool method
                    const toolResult = await this.executeTool(toolCall.name, toolCall.input, taskId, userId); 
                    const resultString = typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult);
                    
                    history.push({ role: 'Assistant', content: modelOutput.content });
                    history.push({ role: 'TOOL_RESULT', content: resultString }); 
                    logger.debug(`Appended tool result to history.`);

                } catch (toolError: any) {
                    logger.error(`Error executing tool ${toolCall.name}:`, toolError);
                    history.push({ role: 'Assistant', content: modelOutput.content });
                    history.push({ role: 'TOOL_ERROR', content: toolError.message });
                    logger.debug(`Appended tool error to history.`);
                }
            } else {
                finalResponse = modelOutput.content;
                history.push({ role: 'Assistant', content: finalResponse }); 
                logger.info('No tool call detected. Final response generated.');
                break; 
            }

        } catch (error: any) {
            logger.error(`Error during agent processing loop (Iteration ${i+1}):`, error);
            return `Sorry, an unexpected error occurred: ${error.message}`;
        }
        
        if (i === maxIterations - 1) {
           logger.warn('Reached max iterations for tool calls.');
           finalResponse = "Sorry, I couldn't complete the request within the allowed steps.";
        }
    }
    
    return finalResponse;
  }

  /**
   * Executes a tool by name with the given input.
   * This method is now public to be callable by GoTEngine.
   */
  async executeTool(name: string, input: ToolInput, taskId?: string, userId?: string): Promise<ToolOutput> {
     const tool = this.getTool(name);
     if (!tool) {
       throw new Error(`Tool "${name}" not found.`);
     }
     
     const context: ToolExecutionContext = {
        config: this.config,
        storage: this.storage,
        taskManager: this.taskManager, 
        inferenceExecutor: this.inferenceExecutor, 
        taskId: taskId,
        userId: userId,
        // TODO: Implement callTool if needed for tool chaining
        // callTool: (toolName, toolInput) => this.executeTool(toolName, toolInput, taskId, userId), 
     };

     // Delegate execution to the ToolExecutor
     return this.toolExecutor.execute(tool, input, context);
  }
}
