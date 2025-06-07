/**
 * Test fixtures and data generators for SwissKnife testing
 */
/**
 * Generates test model definitions
 */
export declare function generateModelFixtures(): {
    providers: ({
        id: string;
        name: string;
        baseURL: string;
        envVar: string;
        defaultModel: string;
        models: ({
            id: string;
            name: string;
            provider: string;
            maxTokens: number;
            pricePerToken: number;
            capabilities: {
                streaming: boolean;
                images?: undefined;
            };
            source: string;
        } | {
            id: string;
            name: string;
            provider: string;
            maxTokens: number;
            pricePerToken: number;
            capabilities: {
                streaming: boolean;
                images: boolean;
            };
            source: string;
        })[];
    } | {
        id: string;
        name: string;
        baseURL: string;
        envVar: string;
        defaultModel: string;
        models: {
            id: string;
            name: string;
            provider: string;
            maxTokens: number;
            pricePerToken: number;
            capabilities: {
                streaming: boolean;
                images: boolean;
                vectors: boolean;
            };
            source: string;
        }[];
    })[];
};
/**
 * Generates test command definitions
 */
export declare function generateCommandFixtures(): {
    commands: ({
        id: string;
        name: string;
        description: string;
        options: ({
            name: string;
            alias: string;
            type: string;
            description: string;
            required: boolean;
            default: string;
        } | {
            name: string;
            type: string;
            description: string;
            required: boolean;
            default: boolean;
            alias?: undefined;
        })[];
        category: string;
        examples: string[];
        handler: () => Promise<number>;
    } | {
        id: string;
        name: string;
        description: string;
        options: {
            name: string;
            type: string;
            description: string;
            required: boolean;
        }[];
        category: string;
        examples: string[];
        handler: () => Promise<number>;
    })[];
};
/**
 * Generates test task definitions
 */
export declare function generateTaskFixtures(): {
    taskDefinitions: ({
        type: string;
        description: string;
        schema: {
            type: string;
            properties: {
                input: {
                    type: string;
                };
                config: {
                    type: string;
                    properties: {
                        flag: {
                            type: string;
                        };
                    };
                };
                model?: undefined;
                prompt?: undefined;
                options?: undefined;
            };
            required: string[];
        };
    } | {
        type: string;
        description: string;
        schema: {
            type: string;
            properties: {
                model: {
                    type: string;
                };
                prompt: {
                    type: string;
                };
                options: {
                    type: string;
                    properties: {
                        temperature: {
                            type: string;
                        };
                        maxTokens: {
                            type: string;
                        };
                    };
                };
                input?: undefined;
                config?: undefined;
            };
            required: string[];
        };
    })[];
    tasks: ({
        id: string;
        type: string;
        data: {
            input: string;
            config: {
                flag: boolean;
            };
            model?: undefined;
            prompt?: undefined;
            options?: undefined;
        };
        priority: string;
        status: string;
        submittedAt: number;
        timeoutMs: number;
        startedAt?: undefined;
    } | {
        id: string;
        type: string;
        data: {
            model: string;
            prompt: string;
            options: {
                temperature: number;
                maxTokens: number;
            };
            input?: undefined;
            config?: undefined;
        };
        priority: string;
        status: string;
        submittedAt: number;
        startedAt: number;
        timeoutMs: number;
    })[];
};
/**
 * Generates test configuration
 */
export declare function generateConfigFixtures(): {
    config: {
        apiKeys: {
            'test-provider-1': string[];
            'test-provider-2': string[];
        };
        models: {
            default: string;
            history: string[];
        };
        storage: {
            backend: string;
            basePath: string;
        };
        worker: {
            poolSize: number;
            maxConcurrent: number;
            taskTimeout: number;
        };
        task: {
            defaultTimeout: number;
            maxRetries: number;
        };
    };
};
/**
 * Generates test graph of thought data
 */
export declare function generateGraphFixtures(): {
    nodes: ({
        id: string;
        content: string;
        type: string;
        dependencies: never[];
        priority: number;
        status: string;
        metadata: {
            createdAt: number;
            completedAt: number;
            confidence: number;
            executionTimeMs: number;
        };
        storage: {
            instructionsCid: string;
            dataCid: string;
            resultCid: string;
        };
        result?: undefined;
    } | {
        id: string;
        content: string;
        type: string;
        dependencies: string[];
        priority: number;
        status: string;
        result: {
            frameworks: string[];
            requirements?: undefined;
        };
        metadata: {
            createdAt: number;
            completedAt: number;
            confidence: number;
            executionTimeMs: number;
        };
        storage: {
            instructionsCid: string;
            dataCid: string;
            resultCid: string;
        };
    } | {
        id: string;
        content: string;
        type: string;
        dependencies: string[];
        priority: number;
        status: string;
        result: {
            requirements: string[];
            frameworks?: undefined;
        };
        metadata: {
            createdAt: number;
            completedAt: number;
            confidence: number;
            executionTimeMs: number;
        };
        storage: {
            instructionsCid: string;
            dataCid: string;
            resultCid: string;
        };
    })[];
};
/**
 * Generates mock prompts and completions for model testing
 */
export declare function generatePromptFixtures(): {
    prompts: {
        text: string;
        expectedCompletion: string;
        tokens: {
            prompt: number;
            completion: number;
            total: number;
        };
    }[];
};
