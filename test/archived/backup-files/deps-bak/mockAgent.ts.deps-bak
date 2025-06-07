// test/mocks/mockAgent.ts
/**
 * Mock implementation of Agent for testing
 */

export class MockAgent {
  id: string;
  name: string;
  private capabilities: string[];

  constructor(options: { id?: string; name?: string; capabilities?: string[] } = {}) {
    this.id = options.id || 'mock-agent';
    this.name = options.name || 'Mock Agent';
    this.capabilities = options.capabilities || ['reasoning', 'planning'];
  }

  async generate(prompt: string, options: any = {}): Promise<any> {
    return {
      text: `Mock response for: ${prompt.substring(0, 30)}...`,
      usage: {
        promptTokens: Math.floor(prompt.length / 4),
        completionTokens: 100,
        totalTokens: Math.floor(prompt.length / 4) + 100
      }
    };
  }

  async reasonWithTools(prompt: string, tools: any[], options: any = {}): Promise<any> {
    return {
      text: `Mock tool reasoning for: ${prompt.substring(0, 20)}...`,
      toolUsage: tools.map(t => ({ tool: t.name, calls: 1 })),
      usage: {
        promptTokens: Math.floor(prompt.length / 4),
        completionTokens: 150,
        totalTokens: Math.floor(prompt.length / 4) + 150
      }
    };
  }

  getCapabilities(): string[] {
    return [...this.capabilities];
  }
}

export default MockAgent;
