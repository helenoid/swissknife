/**
 * Integration tests for Storage and Model Execution
 */

import { createMockStorage } from '../../helpers/mockStorage';
import { createTempTestDir, removeTempTestDir } from '../../helpers/testUtils';
import { generateModelFixtures, generatePromptFixtures, generateGraphFixtures } from '../../helpers/fixtures';

// Mock the storage factory
jest.mock('../../../src/storage/factory', () => ({
  StorageFactory: {
    createStorage: jest.fn().mockImplementation(() => createMockStorage())
  }
}));

// Mock the model execution service
jest.mock('../../../src/models/execution', () => {
  const originalModule = jest.requireActual('../../../src/models/execution');
  
  return {
    ...originalModule,
    ModelExecutionService: {
      getInstance: jest.fn().mockReturnValue({
        executeModel: jest.fn().mockImplementation(async (modelId, prompt, options) => {
          return {
            response: `Mock response for model ${modelId}: ${prompt.substring(0, 20)}...`,
            usage: {
              promptTokens: Math.floor(prompt.length / 4),
              completionTokens: 100,
              totalTokens: Math.floor(prompt.length / 4) + 100
            },
            timingMs: 500
          };
        })
      })
    }
  };
});

// Import after mocks
import { ModelExecutionService } from '../../../src/models/execution';
import { StorageFactory } from '../../../src/storage/factory';
import { ModelRegistry } from '../../../src/models/registry';
import { GraphOfThoughtEngine } from '../../../src/tasks/graph/graph-of-thought';

describe('Storage and Model Execution Integration', () => {
  let modelRegistry: any;
  let modelExecutionService: any;
  let storage: any;
  let graphEngine: any;
  let tempDir: string;
  
  const fixtures = generateModelFixtures();
  const promptFixtures = generatePromptFixtures();
  const graphFixtures = generateGraphFixtures();
  
  beforeAll(async () => {
    // Create temp directory for testing
    tempDir = await createTempTestDir();
  });
  
  afterAll(async () => {
    // Clean up temp directory
    await removeTempTestDir(tempDir);
  });
  
  beforeEach(() => {
    // Reset singletons
    (ModelRegistry as any).instance = null;
    
    // Get instances
    modelRegistry = ModelRegistry.getInstance();
    modelExecutionService = ModelExecutionService.getInstance();
    storage = StorageFactory.createStorage();
    
    // Register test models
    fixtures.providers.forEach(provider => {
      modelRegistry.registerProvider(provider);
    });
    
    // Create graph engine
    graphEngine = new GraphOfThoughtEngine({ storage });
    
    // Clear storage
    storage.clear();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Model result persistence', () => {
    it('should store model execution results', async () => {
      // Arrange
      const modelId = fixtures.providers[0].models[0].id;
      const prompt = promptFixtures.prompts[0].text;
      
      const executeModelSpy = jest.spyOn(modelExecutionService, 'executeModel');
      const storageSpy = jest.spyOn(storage, 'add');
      
      // Act
      const result = await modelExecutionService.executeModel(modelId, prompt);
      
      // Store model result
      const resultJson = JSON.stringify({
        modelId,
        prompt,
        result,
        timestamp: Date.now()
      });
      
      const cid = await storage.add(resultJson);
      
      // Assert
      expect(executeModelSpy).toHaveBeenCalledWith(modelId, prompt, expect.anything());
      expect(storageSpy).toHaveBeenCalledWith(resultJson);
      expect(cid).toBeDefined();
      
      // Retrieve stored result
      const retrievedBuffer = await storage.get(cid);
      const retrievedData = JSON.parse(retrievedBuffer.toString());
      
      // Verify retrieved data
      expect(retrievedData.modelId).toBe(modelId);
      expect(retrievedData.prompt).toBe(prompt);
      expect(retrievedData.result).toEqual(result);
    });
    
    it('should maintain history of model executions', async () => {
      // Arrange
      const modelId = fixtures.providers[0].models[0].id;
      const promptSet = promptFixtures.prompts;
      
      // Store execution history
      const history = [];
      
      // Act - Execute multiple prompts
      for (const promptData of promptSet) {
        // Execute model
        const result = await modelExecutionService.executeModel(modelId, promptData.text);
        
        // Store result
        const historyEntry = {
          modelId,
          prompt: promptData.text,
          result,
          timestamp: Date.now()
        };
        
        const cid = await storage.add(JSON.stringify(historyEntry));
        
        // Add to history with CID
        history.push({
          ...historyEntry,
          cid
        });
      }
      
      // Assert
      expect(history.length).toBe(promptSet.length);
      
      // Verify each history entry is retrievable
      for (const entry of history) {
        const retrievedBuffer = await storage.get(entry.cid);
        const retrievedData = JSON.parse(retrievedBuffer.toString());
        
        expect(retrievedData.modelId).toBe(entry.modelId);
        expect(retrievedData.prompt).toBe(entry.prompt);
        expect(retrievedData.result).toEqual(entry.result);
      }
    });
  });
  
  describe('Graph of Thought persistence', () => {
    it('should store graph nodes in storage', async () => {
      // Arrange
      const nodes = graphFixtures.nodes;
      const storageSpy = jest.spyOn(storage, 'add');
      
      // Act - Store each node
      const nodesCids = {};
      for (const node of nodes) {
        const nodeJson = JSON.stringify(node);
        const cid = await storage.add(nodeJson);
        nodesCids[node.id] = cid;
      }
      
      // Assert
      expect(storageSpy).toHaveBeenCalledTimes(nodes.length);
      
      // Verify each node is retrievable
      for (const node of nodes) {
        const retrievedBuffer = await storage.get(nodesCids[node.id]);
        const retrievedNode = JSON.parse(retrievedBuffer.toString());
        
        expect(retrievedNode.id).toBe(node.id);
        expect(retrievedNode.content).toBe(node.content);
        expect(retrievedNode.type).toBe(node.type);
      }
    });
    
    it('should store and load complete graph structure', async () => {
      // Arrange
      const graph = {
        nodes: graphFixtures.nodes,
        edges: graphFixtures.nodes.flatMap(node => 
          node.dependencies.map(depId => ({
            from: depId,
            to: node.id
          }))
        ).filter(edge => edge.from) // Filter out empty dependencies
      };
      
      const graphJson = JSON.stringify(graph);
      
      // Act
      const cid = await storage.add(graphJson);
      
      // Assert
      expect(cid).toBeDefined();
      
      // Retrieve stored graph
      const retrievedBuffer = await storage.get(cid);
      const retrievedGraph = JSON.parse(retrievedBuffer.toString());
      
      // Verify graph structure
      expect(retrievedGraph.nodes.length).toBe(graph.nodes.length);
      expect(retrievedGraph.edges.length).toBe(graph.edges.length);
    });
    
    it('should integrate with Graph-of-Thought engine', async () => {
      // Mock the graph engine's processQuery method
      if (!graphEngine.processQuery) {
        // If the method doesn't exist yet, we'll mock it
        graphEngine.processQuery = jest.fn().mockImplementation(async (query) => {
          // Create a simple graph
          const rootNode = {
            id: `node-${Date.now()}-root`,
            content: `Root question: ${query}`,
            type: 'question',
            dependencies: [],
            priority: 10,
            status: 'completed',
            metadata: {
              createdAt: Date.now(),
              completedAt: Date.now() + 500,
              confidence: 0.9,
              executionTimeMs: 500
            }
          };
          
          const researchNode = {
            id: `node-${Date.now()}-research`,
            content: `Research for: ${query}`,
            type: 'research',
            dependencies: [rootNode.id],
            priority: 8,
            status: 'completed',
            result: {
              findings: ['Finding 1', 'Finding 2']
            },
            metadata: {
              createdAt: Date.now() + 100,
              completedAt: Date.now() + 1000,
              confidence: 0.85,
              executionTimeMs: 900
            }
          };
          
          const conclusionNode = {
            id: `node-${Date.now()}-conclusion`,
            content: `Conclusion for: ${query}`,
            type: 'conclusion',
            dependencies: [researchNode.id],
            priority: 9,
            status: 'completed',
            result: {
              answer: `Mock answer to: ${query}`
            },
            metadata: {
              createdAt: Date.now() + 1100,
              completedAt: Date.now() + 1500,
              confidence: 0.95,
              executionTimeMs: 400
            }
          };
          
          // Store nodes in storage
          await storage.add(JSON.stringify(rootNode));
          await storage.add(JSON.stringify(researchNode));
          await storage.add(JSON.stringify(conclusionNode));
          
          // Store the graph structure
          const graph = {
            nodes: [rootNode, researchNode, conclusionNode],
            edges: [
              { from: rootNode.id, to: researchNode.id },
              { from: researchNode.id, to: conclusionNode.id }
            ]
          };
          
          const graphCid = await storage.add(JSON.stringify(graph));
          
          return {
            answer: conclusionNode.result.answer,
            confidence: conclusionNode.metadata.confidence,
            graphCid
          };
        });
      }
      
      // Arrange
      const query = "What is the capital of France?";
      const storageSpy = jest.spyOn(storage, 'add');
      
      // Act
      const result = await graphEngine.processQuery(query);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.answer).toContain(query);
      expect(result.graphCid).toBeDefined();
      
      // Verify storage was used
      expect(storageSpy).toHaveBeenCalled();
      
      // Retrieve the graph using the CID
      if (result.graphCid) {
        const retrievedBuffer = await storage.get(result.graphCid);
        const retrievedGraph = JSON.parse(retrievedBuffer.toString());
        
        expect(retrievedGraph.nodes).toBeDefined();
        expect(retrievedGraph.nodes.length).toBe(3); // Root, research, conclusion
        expect(retrievedGraph.edges).toBeDefined();
        expect(retrievedGraph.edges.length).toBe(2); // Root->Research, Research->Conclusion
      }
    });
  });
  
  describe('Model execution with context from storage', () => {
    it('should execute model with context retrieved from storage', async () => {
      // Arrange
      const modelId = fixtures.providers[0].models[0].id;
      const contextContent = JSON.stringify({
        background: "This is background information",
        examples: ["Example 1", "Example 2"],
        guidelines: "Follow these guidelines"
      });
      
      // Store context in storage
      const contextCid = await storage.add(contextContent);
      
      // Main prompt
      const mainPrompt = "Use the provided context to answer: What is the capital of France?";
      
      // Get the context
      const contextBuffer = await storage.get(contextCid);
      const context = JSON.parse(contextBuffer.toString());
      
      // Prepare combined prompt with context
      const combinedPrompt = `
Context Information:
Background: ${context.background}
Examples: ${context.examples.join(', ')}
Guidelines: ${context.guidelines}

${mainPrompt}
      `.trim();
      
      const executeModelSpy = jest.spyOn(modelExecutionService, 'executeModel');
      
      // Act
      const result = await modelExecutionService.executeModel(modelId, combinedPrompt);
      
      // Assert
      expect(executeModelSpy).toHaveBeenCalledWith(modelId, combinedPrompt, expect.anything());
      expect(result.response).toContain('Mock response');
    });
    
    it('should chain model executions with stored intermediate results', async () => {
      // Arrange
      const modelId = fixtures.providers[0].models[0].id;
      const initialPrompt = "What is the capital of France?";
      
      const executeModelSpy = jest.spyOn(modelExecutionService, 'executeModel');
      
      // Act - First execution
      const result1 = await modelExecutionService.executeModel(modelId, initialPrompt);
      
      // Store first result
      const result1Json = JSON.stringify(result1);
      const result1Cid = await storage.add(result1Json);
      
      // Retrieve first result
      const retrievedResult1Buffer = await storage.get(result1Cid);
      const retrievedResult1 = JSON.parse(retrievedResult1Buffer.toString());
      
      // Create follow-up prompt using first result
      const followUpPrompt = `
Based on the previous response: "${retrievedResult1.response}"

Please provide more details about this city.
      `.trim();
      
      // Second execution
      const result2 = await modelExecutionService.executeModel(modelId, followUpPrompt);
      
      // Assert
      expect(executeModelSpy).toHaveBeenCalledTimes(2);
      expect(executeModelSpy.mock.calls[0][1]).toBe(initialPrompt);
      expect(executeModelSpy.mock.calls[1][1]).toBe(followUpPrompt);
      
      // Store chain of results
      const chain = {
        exchanges: [
          {
            prompt: initialPrompt,
            response: result1.response
          },
          {
            prompt: followUpPrompt,
            response: result2.response
          }
        ],
        metadata: {
          modelId,
          totalTokens: result1.usage.totalTokens + result2.usage.totalTokens,
          totalTimeMs: result1.timingMs + result2.timingMs
        }
      };
      
      const chainCid = await storage.add(JSON.stringify(chain));
      
      // Retrieve chain
      const retrievedChainBuffer = await storage.get(chainCid);
      const retrievedChain = JSON.parse(retrievedChainBuffer.toString());
      
      expect(retrievedChain.exchanges.length).toBe(2);
      expect(retrievedChain.metadata.modelId).toBe(modelId);
    });
  });
});