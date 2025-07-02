import { expect } from '@jest/globals';
describe('Task Registry', () => {
    let registry;
    beforeEach(() => {
        // Reset the singleton for testing
        TaskRegistry.instance = null;
        registry = TaskRegistry.getInstance();
    });
    it('should register and retrieve task definitions', () => {
        // Create a simple task definition
        const taskDefinition = {
            type: 'test-task',
            description: 'A test task',
            handler: async (data) => data
        };
        // Register the task definition
        registry.registerTask(taskDefinition);
        // Retrieve the task definition
        const retrievedDefinition = registry.getTask('test-task');
        // Verify it matches
        expect(retrievedDefinition).toEqual(taskDefinition);
    });
    it('should retrieve all task definitions', () => {
        // Create multiple task definitions
        const taskDefinition1 = {
            type: 'test-task-1',
            description: 'Test task 1',
            handler: async (data) => data
        };
        const taskDefinition2 = {
            type: 'test-task-2',
            description: 'Test task 2',
            handler: async (data) => data
        };
        // Register both task definitions
        registry.registerTask(taskDefinition1);
        registry.registerTask(taskDefinition2);
        // Get all task definitions
        const allDefinitions = registry.getAllTaskDefinitions();
        // Verify the result
        expect(allDefinitions).toHaveLength(2);
        expect(allDefinitions).toEqual(expect.arrayContaining([taskDefinition1, taskDefinition2]));
    });
    it('should handle task definitions with categories', () => {
        // Create task definitions with categories
        const taskDefinition1 = {
            type: 'cat1-task',
            description: 'Category 1 task',
            category: 'category1',
            handler: async (data) => data
        };
        const taskDefinition2 = {
            type: 'cat1-task-2',
            description: 'Another category 1 task',
            category: 'category1',
            handler: async (data) => data
        };
        const taskDefinition3 = {
            type: 'cat2-task',
            description: 'Category 2 task',
            category: 'category2',
            handler: async (data) => data
        };
        // Register all task definitions
        registry.registerTask(taskDefinition1);
        registry.registerTask(taskDefinition2);
        registry.registerTask(taskDefinition3);
        // Get task definitions by category
        const category1Tasks = registry.getTaskDefinitionsByCategory('category1');
        const category2Tasks = registry.getTaskDefinitionsByCategory('category2');
        // Verify results
        expect(category1Tasks).toHaveLength(2);
        expect(category1Tasks).toEqual(expect.arrayContaining([taskDefinition1, taskDefinition2]));
        expect(category2Tasks).toHaveLength(1);
        expect(category2Tasks).toEqual(expect.arrayContaining([taskDefinition3]));
        expect(registry.getAllCategories()).toHaveLength(2);
        expect(registry.getAllCategories()).toEqual(expect.arrayContaining(['category1', 'category2']));
    });
    it('should throw for invalid task definitions', () => {
        // Task definition without type
        const invalidDefinition = {
            description: 'Invalid task'
        };
        // Should throw when registering
        expect(() => registry.registerTask(invalidDefinition)).toThrow('must have a type');
    });
    it('should validate task data', () => {
        const schema = {
            type: 'object',
            properties: {
                name: { type: 'string' },
                value: { type: 'number', minimum: 0 },
                optional: { type: 'string', nullable: true }
            },
            required: ['name', 'value'],
            additionalProperties: false
        };
        const taskDefinition = {
            type: 'schema-task',
            description: 'Task with schema',
            schema
        };
        // Register the task definition
        registry.registerTask(taskDefinition);
        // For Phase 1, we're assuming all data is valid
        const validationResult = registry.validateTaskData('schema-task', { name: 'test', value: 42 });
        expect(validationResult.valid).toBe(true);
        expect(validationResult.errors).toEqual([]);
    });
    it('should check if a task type is registered', () => {
        // Create a task definition
        const taskDefinition = {
            type: 'test-task',
            description: 'A test task'
        };
        // Task type should not exist initially
        expect(registry.hasTask('test-task')).toBe(false);
        // Register the task definition
        registry.registerTask(taskDefinition);
        // Task type should now exist
        expect(registry.hasTask('test-task')).toBe(true);
        // Unknown task type should not exist
        expect(registry.hasTask('unknown-task')).toBe(false);
    });
    it('should throw when validating data for unknown task type', () => {
        expect(() => registry.validateTaskData('unknown-task', {})).toThrow('Task not found');
    });
});
//# sourceMappingURL=registry.test.js.map