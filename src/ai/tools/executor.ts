import {
  Tool,
  ToolExecutionContext,
  ToolInput,
  ToolOutput,
} from '../../types/ai.js';
import { logger } from '../../utils/logger.js';
import { ZodError, ZodType } from 'zod'; // Import ZodError and ZodType

export class ToolExecutor {

  constructor() {
    logger.debug('ToolExecutor initialized.');
  }

  /**
   * Executes a specified tool with the given input and context.
   * Validates the input against the tool's Zod schema before execution.
   * 
   * @param tool The Tool instance to execute.
   * @param rawInput The raw input arguments received (expected to be parsed JSON/object).
   * @param context The execution context containing resources like config and storage.
   * @returns A promise resolving to the tool's output.
   * @throws If input validation fails or tool execution errors occur.
   */
  async execute<T extends ZodType>(
    tool: Tool<T>, // Use generic Tool type with Zod schema
    rawInput: Record<string, any>, // Raw input before validation
    context: ToolExecutionContext,
  ): Promise<ToolOutput> {
    logger.info(`Attempting to execute tool: ${tool.name}`);
    logger.debug(`Raw input for ${tool.name}:`, rawInput);

    let validatedInput: ToolInput<T>;

    // 1. Input Validation using Zod schema
    try {
      // Use safeParse to handle validation errors gracefully
      const validationResult = tool.inputSchema.safeParse(rawInput);
      if (!validationResult.success) {
        logger.error(`Input validation failed for tool ${tool.name}:`, validationResult.error.errors);
        // Format Zod errors for better readability
        const errorMessages = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
        throw new Error(`Invalid input for tool ${tool.name}: ${errorMessages}`);
      }
      validatedInput = validationResult.data; // Use the validated and potentially transformed data
      logger.debug(`Input validation successful for tool ${tool.name}. Validated input:`, validatedInput);
    } catch (error: any) {
       // Catch potential errors during validation itself (though safeParse should prevent most)
       logger.error(`An unexpected error occurred during input validation for ${tool.name}:`, error);
       throw new Error(`Input validation process failed for ${tool.name}: ${error.message}`);
    }
    
    // 2. Execute the tool with validated input
    try {
      // Pass the validated input to the tool's execute method
      const output = await tool.execute(validatedInput, context); 
      logger.info(`Tool ${tool.name} executed successfully.`);
      logger.debug(`Output from ${tool.name}:`, output);
      return output;
    } catch (error: any) {
      logger.error(`Error during execution of tool ${tool.name}:`, error);
      // Rethrow or handle specific errors as needed
      throw new Error(`Tool ${tool.name} failed: ${error.message}`);
    }
  }
}
