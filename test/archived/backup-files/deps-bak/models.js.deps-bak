/**
 * Model fixtures for tests
 * 
 * Sample data for testing model-related functionality
 */

// Sample model definitions
export const sampleModels = {
  // Basic models
  basic: [
    {
      id: 'test-model-1',
      provider: 'test-provider',
      type: 'chat',
      capabilities: ['chat', 'completion'],
      contextWindow: 4096
    },
    {
      id: 'test-model-2',
      provider: 'test-provider',
      type: 'embedding',
      capabilities: ['embedding'],
      dimensions: 1536
    }
  ],
  
  // Models with different capabilities
  capabilities: [
    {
      id: 'capable-model-1',
      provider: 'advanced-provider',
      type: 'chat',
      capabilities: ['chat', 'completion', 'function-calling', 'streaming'],
      contextWindow: 16384
    },
    {
      id: 'limited-model-1',
      provider: 'basic-provider',
      type: 'chat',
      capabilities: ['chat'],
      contextWindow: 2048
    }
  ]
};

// Sample provider definitions
export const sampleProviders = {
  // Basic providers
  basic: [
    {
      id: 'test-provider',
      name: 'Test Provider',
      baseUrl: 'https://api.example.com',
      models: ['test-model-1', 'test-model-2']
    },
    {
      id: 'advanced-provider',
      name: 'Advanced Provider',
      baseUrl: 'https://api.advanced-example.com',
      models: ['capable-model-1']
    }
  ]
};

// Sample model responses
export const sampleResponses = {
  // Chat responses
  chat: [
    {
      modelId: 'test-model-1',
      prompt: 'Hello, how are you?',
      response: {
        content: "I'm fine, thank you for asking! How can I help you today?",
        role: 'assistant',
        usage: {
          prompt_tokens: 10,
          completion_tokens: 15,
          total_tokens: 25
        }
      }
    },
    {
      modelId: 'capable-model-1',
      prompt: 'Tell me about graph theory',
      response: {
        content: "Graph theory is a field of mathematics that studies relationships between objects. It uses structures called graphs, which consist of vertices (nodes) connected by edges. This field has numerous applications in computer science, network analysis, and many other areas.",
        role: 'assistant',
        usage: {
          prompt_tokens: 7,
          completion_tokens: 48,
          total_tokens: 55
        }
      }
    }
  ],
  
  // Embedding responses
  embedding: [
    {
      modelId: 'test-model-2',
      input: 'Sample text for embedding',
      response: {
        embedding: new Array(1536).fill(0).map(() => Math.random() * 2 - 1),
        usage: {
          prompt_tokens: 5,
          total_tokens: 5
        }
      }
    }
  ],
  
  // Function calling responses
  functionCalling: [
    {
      modelId: 'capable-model-1',
      prompt: 'What\'s the weather in New York?',
      functions: [
        {
          name: 'get_weather',
          description: 'Get weather information for a location',
          parameters: {
            type: 'object',
            properties: {
              location: {
                type: 'string',
                description: 'The city and state'
              }
            },
            required: ['location']
          }
        }
      ],
      response: {
        function_call: {
          name: 'get_weather',
          arguments: JSON.stringify({ location: 'New York, NY' })
        },
        role: 'assistant',
        usage: {
          prompt_tokens: 25,
          completion_tokens: 15,
          total_tokens: 40
        }
      }
    }
  ]
};

/**
 * Generate model fixtures with customizable properties
 * 
 * @param {Object} options Customization options for fixtures
 * @returns {Object} Generated fixtures
 */
export function generateModelFixtures(options = {}) {
  // Merge default models with any custom models
  const models = [...sampleModels.basic];
  if (options.models) {
    models.push(...options.models);
  }
  
  // Merge default providers with any custom providers
  const providers = [...sampleProviders.basic];
  if (options.providers) {
    providers.push(...options.providers);
  }
  
  return {
    models,
    providers,
    responses: sampleResponses
  };
}