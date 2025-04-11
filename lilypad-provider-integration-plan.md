# Lilypad Provider Integration Plan

This document outlines the steps to add Lilypad's Anura API as a new LLM provider to the swissknife application.

## Overview

The swissknife application currently supports multiple LLM providers including:
- OpenAI
- Anthropic
- Mistral
- DeepSeek
- xAI (Grok)
- Groq
- Gemini (Google)
- Ollama
- Azure OpenAI

We will add Lilypad as a new provider, enabling access to its models through the Anura API, which offers an OpenAI-compatible interface.

## Implementation Steps

### 1. Add Lilypad to Provider Constants

First, update the providers list in `src/constants/models.ts`:

```typescript
export const providers = {
  // existing providers...
  "lilypad": {
    "name": "Lilypad",
    "baseURL": "https://anura-testnet.lilypad.tech/api/v1"
  },
  // other providers...
}
```

### 2. Add Lilypad Models to Models Object

Add Lilypad's available models to the models object in `src/constants/models.ts`:

```typescript
export default {
  // existing providers and models...
  "lilypad": [
    {
      "model": "llama3.1:8b",
      "max_tokens": 8192,
      "max_input_tokens": 8192,
      "max_output_tokens": 8192,
      "input_cost_per_token": 0.0000001,
      "output_cost_per_token": 0.0000001,
      "provider": "lilypad",
      "mode": "chat",
      "supports_function_calling": true,
      "supports_tool_choice": true
    },
    {
      "model": "qwen2.5:7b",
      "max_tokens": 8192,
      "max_input_tokens": 8192, 
      "max_output_tokens": 8192,
      "input_cost_per_token": 0.0000001,
      "output_cost_per_token": 0.0000001,
      "provider": "lilypad",
      "mode": "chat",
      "supports_function_calling": true,
      "supports_tool_choice": true
    },
    {
      "model": "qwen2.5-coder:7b",
      "max_tokens": 8192,
      "max_input_tokens": 8192,
      "max_output_tokens": 8192,
      "input_cost_per_token": 0.0000001,
      "output_cost_per_token": 0.0000001,
      "provider": "lilypad",
      "mode": "chat",
      "supports_function_calling": true,
      "supports_tool_choice": true
    },
    {
      "model": "phi4-mini:3.8b",
      "max_tokens": 8192,
      "max_input_tokens": 8192,
      "max_output_tokens": 8192,
      "input_cost_per_token": 0.0000001,
      "output_cost_per_token": 0.0000001,
      "provider": "lilypad",
      "mode": "chat",
      "supports_function_calling": true,
      "supports_tool_choice": true
    },
    {
      "model": "mistral:7b",
      "max_tokens": 8192,
      "max_input_tokens": 8192,
      "max_output_tokens": 8192,
      "input_cost_per_token": 0.0000001,
      "output_cost_per_token": 0.0000001,
      "provider": "lilypad",
      "mode": "chat",
      "supports_function_calling": true,
      "supports_tool_choice": true
    },
    {
      "model": "llama2:7b",
      "max_tokens": 8192,
      "max_input_tokens": 8192,
      "max_output_tokens": 8192,
      "input_cost_per_token": 0.0000001,
      "output_cost_per_token": 0.0000001,
      "provider": "lilypad",
      "mode": "chat",
      "supports_function_calling": false,
      "supports_tool_choice": false
    },
    {
      "model": "deepseek-r1:7b",
      "max_tokens": 8192,
      "max_input_tokens": 8192,
      "max_output_tokens": 8192,
      "input_cost_per_token": 0.0000001,
      "output_cost_per_token": 0.0000001,
      "provider": "lilypad",
      "mode": "chat",
      "supports_function_calling": false,
      "supports_tool_choice": false
    },
    {
      "model": "sdxl-turbo",
      "max_tokens": 0,
      "max_input_tokens": 0,
      "max_output_tokens": 0,
      "input_cost_per_token": 0,
      "output_cost_per_token": 0,
      "provider": "lilypad",
      "mode": "image",
      "supports_function_calling": false,
      "supports_tool_choice": false
    }
  ],
}
```

### 3. Add Lilypad to Provider Type in Config.ts

Update the `ProviderType` type definition in `src/utils/config.ts`:

```typescript
export type ProviderType =
  | 'anthropic'
  | 'openai'
  | 'mistral'
  | 'deepseek'
  | 'xai'
  | 'groq'
  | 'gemini'
  | 'ollama'
  | 'azure'
  | 'lilypad'  // Added Lilypad
  | 'custom'
```

### 4. Update ModelSelector to Handle Lilypad-specific Configuration

The existing `ModelSelector.tsx` component already supports different providers with their specific configurations. Since Lilypad uses the OpenAI-compatible API interface, we should only need minimal changes:

1. Lilypad will use the API key pattern similar to OpenAI
2. We should add environment variable support for `LILYPAD_API_KEY`

Here's the updated code for handling environment variables in `ModelSelector.tsx`:

```typescript
useEffect(() => {
  if(!apiKeyEdited && selectedProvider) {
    if(process.env[selectedProvider.toUpperCase() + '_API_KEY']) {
      setApiKey(process.env[selectedProvider.toUpperCase() + '_API_KEY'] as string)
    } else if(selectedProvider === 'lilypad' && process.env.ANURA_API_KEY) {
      // Also check for ANURA_API_KEY which is Lilypad's official env var name
      setApiKey(process.env.ANURA_API_KEY as string)
    } else {
      setApiKey('')
    }
  }
}, [selectedProvider, apiKey, apiKeyEdited])
```

### 5. Add Lilypad Integration to fetchModels Function in ModelSelector.tsx

While the current ModelSelector can already handle fetching models from Lilypad due to its OpenAI-compatible API, we should add specific error handling for Lilypad:

```typescript
async function fetchModels() {
  // ...existing code...
  
  try {
    // ...existing code...
    
    // For all other providers, use the OpenAI client
    const baseURL = providers[selectedProvider]?.baseURL
    
    const openai = new OpenAI({
      apiKey: apiKey || 'dummy-key-for-ollama', // Ollama doesn't need a real key
      baseURL: baseURL,
      dangerouslyAllowBrowser: true
    })
    
    // Fetch the models
    const response = await openai.models.list()
    
    // Transform the response into our ModelInfo format
    const fetchedModels = [] 
    for (const model of response.data) {
      const modelInfo = models[selectedProvider as keyof typeof models]?.find(m => m.model === model.id)
      fetchedModels.push({
        model: model.id,
        provider: selectedProvider,
        max_tokens: modelInfo?.max_output_tokens,
        supports_vision: modelInfo?.supports_vision || false,
        supports_function_calling: modelInfo?.supports_function_calling || false,
        supports_reasoning_effort: modelInfo?.supports_reasoning_effort || false
      })
    }
    
    setAvailableModels(fetchedModels)
    
    // Navigate to model selection screen if models were loaded successfully
    navigateTo('model')
    
    return fetchedModels
  } catch (error) {
    // Properly display the error to the user
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    // Add specific error handling for Lilypad
    if (selectedProvider === 'lilypad' && (errorMessage.includes('401') || errorMessage.includes('unauthorized'))) {
      setModelLoadError('Invalid API key for Lilypad. Get an API key from https://anura.lilypad.tech/');
    } else {
      setModelLoadError(`Failed to load models: ${errorMessage}`);
    }
    
    // ...existing error handling code...
  }
}
```

### 6. Add API Key Instructions for Lilypad

When users select Lilypad, provide clear instructions for obtaining an API key:

```typescript
// In the API Key Input Screen section
if (currentScreen === 'apiKey') {
  // ...existing code...
  
  // Add Lilypad-specific instructions
  const keyInstructions = selectedProvider === 'lilypad' 
    ? 'Get an API key from https://anura.lilypad.tech/' 
    : 'This key will be stored locally and used to access the API.';
  
  return (
    // ...existing code...
    <Text color={theme.secondaryText}>
      {keyInstructions}
      <Newline />
      Your key is never sent to our servers.
    </Text>
    // ...rest of the component...
  )
}
```

### 7. Update Service Integration

While existing code should work with Lilypad due to its OpenAI compatibility, we should ensure the appropriate environment variables are handled in the configuration utility functions.

Update `getActiveApiKey` in `config.ts` to properly check for Lilypad API keys:

```typescript
export function getActiveApiKey(config: GlobalConfig, type: 'small' | 'large', roundRobin: boolean = true): string | undefined {
  // ...existing code...
  
  // If using Lilypad and no key found, check ANURA_API_KEY as fallback
  if (config.primaryProvider === 'lilypad' && (!keyArray || keyArray.length === 0)) {
    const anuraKey = process.env.ANURA_API_KEY;
    if (anuraKey) {
      return anuraKey;
    }
  }
  
  // ...rest of function...
}
```

## Implementation Status

All planned changes have been successfully implemented:

1. ✅ Added Lilypad to the providers list in `models.ts`
2. ✅ Added Lilypad models to the models object in `models.ts`
3. ✅ Updated the ProviderType in `config.ts` to include Lilypad
4. ✅ Enhanced ModelSelector to handle environment variables properly (including ANURA_API_KEY)
5. ✅ Added Lilypad-specific error handling in the fetchModels function
6. ✅ Added helpful API key instructions for Lilypad users
7. ✅ Updated getActiveApiKey function to handle Lilypad API keys

## Testing Plan

1. Test provider selection in the UI:
   - Verify Lilypad appears in the provider list
   - Confirm selection navigates to API key input

2. Test API key handling:
   - Verify API key input works
   - Test environment variable support (`LILYPAD_API_KEY` and `ANURA_API_KEY`)

3. Test model fetching:
   - Verify models are correctly fetched from Lilypad
   - Confirm error handling works for invalid API keys

4. Test chat functionality:
   - Verify chat completions work with Lilypad models
   - Test tool use capabilities where supported

5. Test image generation:
   - Verify image generation works with `sdxl-turbo` model

## Future Enhancements

1. Add support for Lilypad's Web Search API
2. Implement direct integration with the text inference API once available
3. Add advanced configuration options for job monitoring
4. Improve error handling for Lilypad-specific error codes and messages

## Resources

- Lilypad API Documentation: `https://docs.lilypad.tech/lilypad/developer-resources/inference-api`
- Anura API Dashboard: `https://anura.lilypad.tech/`