/**
 * Mock MCP client for tests
 */

const createClient = jest.fn().mockImplementation((url) => {
  return {
    callTool: jest.fn().mockImplementation(async (request) => {
      if (request?.name === 'bash' && 
          request?.arguments?.command && 
          request.arguments.command.includes('sleep')) {
        throw new Error('Command timed out');
      }
      return { result: `Mock result for tool: ${request?.name || 'unknown'}` };
    }),
    close: jest.fn().mockResolvedValue(undefined)
  };
});

module.exports = {
  createClient
};
