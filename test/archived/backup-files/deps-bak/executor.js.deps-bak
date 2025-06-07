/**
 * Mock tool executor for testing
 */

class ToolExecutor {
  constructor() {
    this.tools = new Map();
  }

  registerTool(name, handler) {
    this.tools.set(name, handler);
    return this;
  }

  async execute(toolName, params, context) {
    if (!this.tools.has(toolName)) {
      throw new Error(`Tool not found: ${toolName}`);
    }
    
    const handler = this.tools.get(toolName);
    return handler(params, context);
  }
  
  getRegisteredTools() {
    return Array.from(this.tools.keys());
  }
}

module.exports = { 
  ToolExecutor 
};
