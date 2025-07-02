/**
 * Simplified test for Agent basic functionality
 */

// Mock basic agent structure
interface SimpleAgent {
  id: string;
  name?: string;
  status: 'idle' | 'busy' | 'error';
  metadata?: Record<string, any>;
}

class AgentManager {
  private agents = new Map<string, SimpleAgent>();
  
  createAgent(id: string, name?: string): SimpleAgent {
    const agent: SimpleAgent = {
      id,
      name,
      status: 'idle',
      metadata: {}
    };
    this.agents.set(id, agent);
    return agent;
  }
  
  getAgent(id: string): SimpleAgent | undefined {
    return this.agents.get(id);
  }
  
  listAgents(): SimpleAgent[] {
    return Array.from(this.agents.values());
  }
  
  updateAgentStatus(id: string, status: SimpleAgent['status']): boolean {
    const agent = this.agents.get(id);
    if (agent) {
      agent.status = status;
      return true;
    }
    return false;
  }
  
  removeAgent(id: string): boolean {
    return this.agents.delete(id);
  }
}

describe('Agent Manager', () => {
  let manager: AgentManager;
  
  beforeEach(() => {
    manager = new AgentManager();
  });
  
  describe('agent creation', () => {
    test('should create agent with id', () => {
      const agent = manager.createAgent('test-agent');
      
      expect(agent).toBeDefined();
      expect(agent.id).toBe('test-agent');
      expect(agent.status).toBe('idle');
    });
    
    test('should create agent with name', () => {
      const agent = manager.createAgent('test-agent', 'Test Agent');
      
      expect(agent.name).toBe('Test Agent');
    });
  });
  
  describe('agent retrieval', () => {
    test('should retrieve existing agent', () => {
      const created = manager.createAgent('test-agent');
      const retrieved = manager.getAgent('test-agent');
      
      expect(retrieved).toBe(created);
    });
    
    test('should return undefined for non-existent agent', () => {
      const agent = manager.getAgent('non-existent');
      
      expect(agent).toBeUndefined();
    });
  });
  
  describe('agent listing', () => {
    test('should list all agents', () => {
      manager.createAgent('agent1');
      manager.createAgent('agent2');
      
      const agents = manager.listAgents();
      
      expect(agents).toHaveLength(2);
      expect(agents.some(a => a.id === 'agent1')).toBe(true);
      expect(agents.some(a => a.id === 'agent2')).toBe(true);
    });
    
    test('should return empty array when no agents', () => {
      const agents = manager.listAgents();
      
      expect(agents).toHaveLength(0);
    });
  });
  
  describe('agent status updates', () => {
    test('should update agent status', () => {
      manager.createAgent('test-agent');
      const success = manager.updateAgentStatus('test-agent', 'busy');
      const agent = manager.getAgent('test-agent');
      
      expect(success).toBe(true);
      expect(agent?.status).toBe('busy');
    });
    
    test('should fail to update non-existent agent', () => {
      const success = manager.updateAgentStatus('non-existent', 'busy');
      
      expect(success).toBe(false);
    });
  });
  
  describe('agent removal', () => {
    test('should remove existing agent', () => {
      manager.createAgent('test-agent');
      const success = manager.removeAgent('test-agent');
      const agent = manager.getAgent('test-agent');
      
      expect(success).toBe(true);
      expect(agent).toBeUndefined();
    });
    
    test('should fail to remove non-existent agent', () => {
      const success = manager.removeAgent('non-existent');
      
      expect(success).toBe(false);
    });
  });
});
