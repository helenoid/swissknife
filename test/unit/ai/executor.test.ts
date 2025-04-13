// Mock logger
jest.mock('@/utils/logger.js', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { ToolExecutor } from '@/ai/tools/executor.js';
// Use relative path for types
import { Tool, ToolExecutionContext } from '../../../src/types/ai.js'; // Keep ToolExecutionContext, remove ToolParameter
import { z } from 'zod'; // Keep Zod

// Define schemas for mock tools (as required by Tool<Schema>)
const SimpleSchema = z.object({ message: z.string() });
const ComplexSchema = z.object({
    name: z.string(),
    count: z.number().optional().default(1),
    active: z.boolean().optional(),
});

// Define mock tools - Use Tool<Schema> and inputSchema
class SuccessTool implements Tool<typeof SimpleSchema> {
    readonly name = 'success_tool';
    readonly description = 'Always succeeds';
    readonly inputSchema = SimpleSchema; // Required by Tool<Schema>
    execute = jest.fn().mockResolvedValue('Success!');
}

class FailureTool implements Tool<typeof SimpleSchema> {
    readonly name = 'failure_tool';
    readonly description = 'Always fails';
    readonly inputSchema = SimpleSchema; // Required by Tool<Schema>
    execute = jest.fn().mockRejectedValue(new Error('Tool execution failed'));
}

class ComplexTool implements Tool<typeof ComplexSchema> {
    readonly name = 'complex_tool';
    readonly description = 'Uses complex schema';
    readonly inputSchema = ComplexSchema; // Required by Tool<Schema>
    execute = jest.fn().mockImplementation(async (input) => ({ // Tool receives parsed input
        receivedName: input.name,
        receivedCount: input.count, // Default applied by Zod
        receivedActive: input.active,
    }));
}


describe('ToolExecutor', () => {
  let executor: ToolExecutor;
  let mockContext: ToolExecutionContext; // Use ToolExecutionContext

  beforeEach(() => {
    jest.clearAllMocks();
    executor = new ToolExecutor();

    // Create a basic mock context matching ToolExecutionContext structure
    mockContext = {
      config: {} as any,
      storage: {} as any,
      taskManager: {} as any,
      // inferenceExecutor: {} as any, // Add other context parts if needed
    };
  });

  // No registerTool method exists on executor

  it('should execute a tool successfully with valid input', async () => {
    const tool = new SuccessTool();
    const rawInput = { message: 'Valid input' };

    // Execute using tool object, rawInput, and context
    const result = await executor.execute(tool, rawInput, mockContext);

    expect(result).toBe('Success!');
    expect(tool.execute).toHaveBeenCalledTimes(1);
    // Tool's execute method receives the Zod-parsed input and context
    expect(tool.execute).toHaveBeenCalledWith({ message: 'Valid input' }, mockContext);
  });

  // No tool not found test as execute takes the tool object directly

  it('should throw an error if input validation fails (Zod)', async () => {
    const tool = new SuccessTool(); // Schema requires 'message' string
    const invalidInput = { msg: 'Wrong property name' }; // 'message' is missing

    // Executor's internal Zod parsing should throw
    await expect(executor.execute(tool, invalidInput, mockContext))
      .rejects
      .toThrow(/Invalid input for tool success_tool: message: Required/); // Zod error

    expect(tool.execute).not.toHaveBeenCalled();
  });

  it('should throw an error if input type is incorrect (Zod)', async () => {
    const tool = new SuccessTool(); // Schema requires 'message' string
    const invalidInput = { message: 123 }; // Incorrect type

    await expect(executor.execute(tool, invalidInput, mockContext))
      .rejects
      .toThrow(/Invalid input for tool success_tool: message: Expected string, received number/); // Zod error

    expect(tool.execute).not.toHaveBeenCalled();
  });

  it('should handle tool execution errors', async () => {
    const tool = new FailureTool();
    const rawInput = { message: 'This will fail' };

    // The error comes from the tool's execute method itself
    await expect(executor.execute(tool, rawInput, mockContext))
      .rejects
      // Error message now includes tool name from executor's catch block
      .toThrow(`Tool ${tool.name} failed: Tool execution failed`);

    expect(tool.execute).toHaveBeenCalledTimes(1);
    expect(tool.execute).toHaveBeenCalledWith({ message: 'This will fail' }, mockContext);
  });

  it('should handle complex schema with optional values and defaults (Zod)', async () => {
     const tool = new ComplexTool();
     const rawInput = { name: 'Test Name', active: true }; // 'count' is missing

     // Executor validates via Zod, which applies default
     const result = await executor.execute(tool, rawInput, mockContext);

     // Check the result returned by the mock tool's implementation
     expect(result).toEqual({
        receivedName: 'Test Name',
        receivedCount: 1, // Default value applied by Zod during parsing
        receivedActive: true,
     });
     expect(tool.execute).toHaveBeenCalledTimes(1);
     // Tool receives the parsed args including defaults
     expect(tool.execute).toHaveBeenCalledWith({ name: 'Test Name', count: 1, active: true }, mockContext);
  });

   it('should fail complex schema validation with incorrect type (Zod)', async () => {
     const tool = new ComplexTool();
     const rawInput = { name: 'Test Name', count: 'not-a-number' };

     await expect(executor.execute(tool, rawInput, mockContext))
      .rejects
      .toThrow(/Invalid input for tool complex_tool: count: Expected number, received string/); // Zod error

    expect(tool.execute).not.toHaveBeenCalled();
   });

});
