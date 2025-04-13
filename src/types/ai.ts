import { CID, Status, TaskID } from './common.js';
import { StorageProvider } from './storage.js'; 
import { ConfigManager } from '../config/manager.js'; 
import { TaskManager } from '../tasks/manager.js'; 
import { InferenceExecutor } from '../ml/inference/executor.js'; 
import { z, ZodType } from 'zod'; // Import Zod and ZodType

/**
 * Represents the input parameters for an AI model generation request.
 */
export interface ModelGenerateInput {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
  taskId?: TaskID; 
  userId?: string; 
}

/**
 * Represents the output from an AI model generation request.
 */
export interface ModelGenerateOutput {
  content: string; 
  status: Status; 
  modelUsed?: string; 
  usage?: { 
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  cost?: number; 
  error?: string; 
}

/**
 * Interface defining the contract for AI model providers.
 */
export interface Model {
  readonly id: string; 
  generate(input: ModelGenerateInput): Promise<ModelGenerateOutput>;
}

/**
 * Represents the input arguments for a Tool execution.
 * Defined by the tool's specific Zod input schema.
 */
export type ToolInput<T extends ZodType = ZodType> = z.infer<T>;

/**
 * Represents the output/result from a Tool execution.
 */
export type ToolOutput = string | Record<string, any> | Buffer; 

/**
 * Represents the context provided to a Tool during execution.
 */
export interface ToolExecutionContext {
  config: ConfigManager; 
  storage: StorageProvider;
  taskManager: TaskManager; 
  taskId?: TaskID;
  userId?: string;
  callTool?: (toolName: string, input: Record<string, any>) => Promise<ToolOutput>; // Input type changed
  inferenceExecutor?: InferenceExecutor; 
}

/**
 * Interface defining the contract for Tools that the AI Agent can use.
 * Uses Zod for input schema definition and validation.
 */
export interface Tool<T extends ZodType = ZodType> {
  readonly name: string;
  readonly description: string;
  /**
   * Zod schema definition for the expected input arguments.
   * Used for validation and potentially by the AI model for formatting requests.
   */
  readonly inputSchema: T; 

  /**
   * Executes the tool's logic.
   * @param input The input arguments, validated against inputSchema by the ToolExecutor.
   * @param context Execution context providing access to resources.
   * @returns A promise resolving to the tool's output.
   */
  execute(input: ToolInput<T>, context: ToolExecutionContext): Promise<ToolOutput>;
}

/**
 * Represents the context available to the AI Agent during its operation.
 */
export interface AgentContext {
  config: ConfigManager;
  storage: StorageProvider;
  // Add other shared resources or state needed by the agent
}
