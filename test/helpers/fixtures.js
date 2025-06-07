/**
 * Test fixtures and data generators for SwissKnife testing
 */
/**
 * Generates test model definitions
 */
export function generateModelFixtures() {
    return {
        providers: [
            {
                id: 'test-provider-1',
                name: 'Test Provider 1',
                baseURL: 'https://api.test-provider-1.com',
                envVar: 'TEST_PROVIDER_1_API_KEY',
                defaultModel: 'test-model-1',
                models: [
                    {
                        id: 'test-model-1',
                        name: 'Test Model 1',
                        provider: 'test-provider-1',
                        maxTokens: 4096,
                        pricePerToken: 0.000002,
                        capabilities: {
                            streaming: true
                        },
                        source: 'current'
                    },
                    {
                        id: 'test-model-2',
                        name: 'Test Model 2',
                        provider: 'test-provider-1',
                        maxTokens: 8192,
                        pricePerToken: 0.00003,
                        capabilities: {
                            streaming: true,
                            images: true
                        },
                        source: 'current'
                    }
                ]
            },
            {
                id: 'test-provider-2',
                name: 'Test Provider 2',
                baseURL: 'https://api.test-provider-2.com',
                envVar: 'TEST_PROVIDER_2_API_KEY',
                defaultModel: 'test-model-3',
                models: [
                    {
                        id: 'test-model-3',
                        name: 'Test Model 3',
                        provider: 'test-provider-2',
                        maxTokens: 16384,
                        pricePerToken: 0.00005,
                        capabilities: {
                            streaming: true,
                            images: true,
                            vectors: true
                        },
                        source: 'goose'
                    }
                ]
            }
        ]
    };
}
/**
 * Generates test command definitions
 */
export function generateCommandFixtures() {
    return {
        commands: [
            {
                id: 'test',
                name: 'test',
                description: 'Test command for testing',
                options: [
                    {
                        name: 'option1',
                        alias: 'o',
                        type: 'string',
                        description: 'Test option 1',
                        required: false,
                        default: 'default-value'
                    },
                    {
                        name: 'flag1',
                        type: 'boolean',
                        description: 'Test flag 1',
                        required: false,
                        default: false
                    }
                ],
                category: 'test',
                examples: [
                    'swissknife test',
                    'swissknife test --option1 value'
                ],
                handler: async () => 0
            },
            {
                id: 'test:subcommand',
                name: 'subcommand',
                description: 'Test subcommand',
                options: [
                    {
                        name: 'suboption1',
                        type: 'string',
                        description: 'Test suboption 1',
                        required: true
                    }
                ],
                category: 'test',
                examples: [
                    'swissknife test subcommand --suboption1 value'
                ],
                handler: async () => 0
            }
        ]
    };
}
/**
 * Generates test task definitions
 */
export function generateTaskFixtures() {
    return {
        taskDefinitions: [
            {
                type: 'test-task',
                description: 'Test task for testing',
                schema: {
                    type: 'object',
                    properties: {
                        input: { type: 'string' },
                        config: {
                            type: 'object',
                            properties: {
                                flag: { type: 'boolean' }
                            }
                        }
                    },
                    required: ['input']
                }
            },
            {
                type: 'model-task',
                description: 'Model execution task',
                schema: {
                    type: 'object',
                    properties: {
                        model: { type: 'string' },
                        prompt: { type: 'string' },
                        options: {
                            type: 'object',
                            properties: {
                                temperature: { type: 'number' },
                                maxTokens: { type: 'number' }
                            }
                        }
                    },
                    required: ['model', 'prompt']
                }
            }
        ],
        tasks: [
            {
                id: 'task-1',
                type: 'test-task',
                data: {
                    input: 'test input',
                    config: {
                        flag: true
                    }
                },
                priority: 'high',
                status: 'pending',
                submittedAt: Date.now() - 1000,
                timeoutMs: 30000
            },
            {
                id: 'task-2',
                type: 'model-task',
                data: {
                    model: 'test-model-1',
                    prompt: 'Hello, world!',
                    options: {
                        temperature: 0.7,
                        maxTokens: 100
                    }
                },
                priority: 'medium',
                status: 'running',
                submittedAt: Date.now() - 2000,
                startedAt: Date.now() - 1000,
                timeoutMs: 60000
            }
        ]
    };
}
/**
 * Generates test configuration
 */
export function generateConfigFixtures() {
    return {
        config: {
            apiKeys: {
                'test-provider-1': ['test-api-key-1'],
                'test-provider-2': ['test-api-key-2']
            },
            models: {
                default: 'test-model-1',
                history: ['test-model-1', 'test-model-2']
            },
            storage: {
                backend: 'local',
                basePath: '/tmp/swissknife-test'
            },
            worker: {
                poolSize: 2,
                maxConcurrent: 4,
                taskTimeout: 30000
            },
            task: {
                defaultTimeout: 60000,
                maxRetries: 3
            }
        }
    };
}
/**
 * Generates test graph of thought data
 */
export function generateGraphFixtures() {
    return {
        nodes: [
            {
                id: 'node-1',
                content: 'Root question: How to implement a testing framework?',
                type: 'question',
                dependencies: [],
                priority: 10,
                status: 'completed',
                metadata: {
                    createdAt: Date.now() - 5000,
                    completedAt: Date.now() - 4500,
                    confidence: 0.9,
                    executionTimeMs: 500
                },
                storage: {
                    instructionsCid: 'instructions-cid-1',
                    dataCid: 'data-cid-1',
                    resultCid: 'result-cid-1'
                }
            },
            {
                id: 'node-2',
                content: 'What testing frameworks are available for TypeScript?',
                type: 'research',
                dependencies: ['node-1'],
                priority: 8,
                status: 'completed',
                result: {
                    frameworks: ['Jest', 'Mocha', 'Jasmine', 'AVA']
                },
                metadata: {
                    createdAt: Date.now() - 4500,
                    completedAt: Date.now() - 4000,
                    confidence: 0.95,
                    executionTimeMs: 500
                },
                storage: {
                    instructionsCid: 'instructions-cid-2',
                    dataCid: 'data-cid-2',
                    resultCid: 'result-cid-2'
                }
            },
            {
                id: 'node-3',
                content: 'What are the requirements for our testing framework?',
                type: 'decomposition',
                dependencies: ['node-1'],
                priority: 9,
                status: 'completed',
                result: {
                    requirements: [
                        'Support for unit testing',
                        'Support for integration testing',
                        'Support for end-to-end testing',
                        'Support for mocking dependencies',
                        'Support for code coverage'
                    ]
                },
                metadata: {
                    createdAt: Date.now() - 4500,
                    completedAt: Date.now() - 4000,
                    confidence: 0.9,
                    executionTimeMs: 500
                },
                storage: {
                    instructionsCid: 'instructions-cid-3',
                    dataCid: 'data-cid-3',
                    resultCid: 'result-cid-3'
                }
            }
        ]
    };
}
/**
 * Generates mock prompts and completions for model testing
 */
export function generatePromptFixtures() {
    return {
        prompts: [
            {
                text: 'What is the capital of France?',
                expectedCompletion: 'The capital of France is Paris.',
                tokens: {
                    prompt: 8,
                    completion: 7,
                    total: 15
                }
            },
            {
                text: 'Write a function to calculate the factorial of a number in JavaScript.',
                expectedCompletion: `function factorial(n) {
  if (n === 0 || n === 1) {
    return 1;
  }
  return n * factorial(n - 1);
}`,
                tokens: {
                    prompt: 15,
                    completion: 50,
                    total: 65
                }
            },
            {
                text: 'Explain how a testing framework works.',
                expectedCompletion: 'A testing framework provides tools and utilities for writing and executing tests for your code. It typically includes functionality for defining test cases, assertions for validating results, mocking capabilities for isolating components, and reporting features to analyze test results.',
                tokens: {
                    prompt: 7,
                    completion: 35,
                    total: 42
                }
            }
        ]
    };
}
//# sourceMappingURL=fixtures.js.map