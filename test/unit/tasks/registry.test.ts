import { TaskRegistry, TaskDefinition } from '../../../src/tasks/registry';
import { expect } from 'chai';
import { JSONSchemaType } from 'ajv';

describe('Task Registry', () => {
  let registry: TaskRegistry;
  
  beforeEach(() => {
    // Reset the singleton for testing
    (TaskRegistry as any).instance = null;
    registry = TaskRegistry.getInstance();
  });
  
  it('should register and retrieve task definitions', () => {
    // Create a simple task definition
    const taskDefinition: TaskDefinition = {
      type: 'test-task',
      description: 'A test task',
      handler: async (data) => data
    };
    
    // Register the task definition
    registry.registerTaskDefinition(taskDefinition);
    
    // Retrieve the task definition
    const retrievedDefinition = registry.getTaskDefinition('test-task');
    
    // Verify it matches
    expect(retrievedDefinition).to.deep.equal(taskDefinition);
  });
  
  it('should retrieve all task definitions', () => {
    // Create multiple task definitions
    const taskDefinition1: TaskDefinition = {
      type: 'test-task-1',
      description: 'Test task 1',
      handler: async (data) => data
    };
    
    const taskDefinition2: TaskDefinition = {
      type: 'test-task-2',
      description: 'Test task 2',
      handler: async (data) => data
    };
    
    // Register both task definitions
    registry.registerTaskDefinition(taskDefinition1);
    registry.registerTaskDefinition(taskDefinition2);
    
    // Get all task definitions
    const allDefinitions = registry.getAllTaskDefinitions();
    
    // Verify the result
    expect(allDefinitions).to.have.lengthOf(2);
    expect(allDefinitions).to.deep.include(taskDefinition1);
    expect(allDefinitions).to.deep.include(taskDefinition2);
  });
  
  it('should handle task definitions with categories', () => {
    // Create task definitions with categories
    const taskDefinition1: TaskDefinition = {
      type: 'cat1-task',
      description: 'Category 1 task',
      category: 'category1',
      handler: async (data) => data
    };
    
    const taskDefinition2: TaskDefinition = {
      type: 'cat1-task-2',
      description: 'Another category 1 task',
      category: 'category1',
      handler: async (data) => data
    };
    
    const taskDefinition3: TaskDefinition = {
      type: 'cat2-task',
      description: 'Category 2 task',
      category: 'category2',
      handler: async (data) => data
    };
    
    // Register all task definitions
    registry.registerTaskDefinition(taskDefinition1);
    registry.registerTaskDefinition(taskDefinition2);
    registry.registerTaskDefinition(taskDefinition3);
    
    // Get task definitions by category
    const category1Tasks = registry.getTaskDefinitionsByCategory('category1');
    const category2Tasks = registry.getTaskDefinitionsByCategory('category2');
    
    // Verify results
    expect(category1Tasks).to.have.lengthOf(2);
    expect(category1Tasks).to.deep.include(taskDefinition1);
    expect(category1Tasks).to.deep.include(taskDefinition2);
    
    expect(category2Tasks).to.have.lengthOf(1);
    expect(category2Tasks).to.deep.include(taskDefinition3);
    
    // Get all categories
    const allCategories = registry.getAllCategories();
    expect(allCategories).to.have.lengthOf(2);
    expect(allCategories).to.include('category1');
    expect(allCategories).to.include('category2');
  });
  
  it('should throw for invalid task definitions', () => {
    // Task definition without type
    const invalidDefinition = {
      description: 'Invalid task'
    } as TaskDefinition;
    
    // Should throw when registering
    expect(() => registry.registerTaskDefinition(invalidDefinition)).to.throw('must have a type');
  });
  
  it('should validate task data', () => {
    // Create a task definition with a schema
    interface TestTaskData {
      name: string;
      value: number;
      optional?: string;
    }
    
    const schema: JSONSchemaType<TestTaskData> = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        value: { type: 'number', minimum: 0 },
        optional: { type: 'string', nullable: true }
      },
      required: ['name', 'value'],
      additionalProperties: false
    };
    
    const taskDefinition: TaskDefinition = {
      type: 'schema-task',
      description: 'Task with schema',
      schema
    };
    
    // Register the task definition
    registry.registerTaskDefinition(taskDefinition);
    
    // For Phase 1, we're assuming all data is valid
    const validationResult = registry.validateTaskData('schema-task', { name: 'test', value: 42 });
    expect(validationResult.valid).to.be.true;
    expect(validationResult.errors).to.be.empty;
  });
  
  it('should check if a task type is registered', () => {
    // Create a task definition
    const taskDefinition: TaskDefinition = {
      type: 'test-task',
      description: 'A test task'
    };
    
    // Task type should not exist initially
    expect(registry.hasTaskDefinition('test-task')).to.be.false;
    
    // Register the task definition
    registry.registerTaskDefinition(taskDefinition);
    
    // Task type should now exist
    expect(registry.hasTaskDefinition('test-task')).to.be.true;
    
    // Unknown task type should not exist
    expect(registry.hasTaskDefinition('unknown-task')).to.be.false;
  });
  
  it('should throw when validating data for unknown task type', () => {
    expect(() => registry.validateTaskData('unknown-task', {})).to.throw('Task definition not found');
  });
});