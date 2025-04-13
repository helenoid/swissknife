# Lilypad Technical Reference Guide

This document provides technical details for developers implementing the Lilypad provider integration in swissknife.

## Quick Implementation Checklist

- [ ] Add Lilypad to provider constants in `src/constants/models.ts`
- [ ] Add Lilypad models to models object in `src/constants/models.ts`
- [ ] Update `ProviderType` in `src/utils/config.ts`
- [ ] Add Lilypad-specific environment variable handling to `ModelSelector.tsx`
- [ ] Add Lilypad-specific error handling to `fetchModels` function
- [ ] Update API key configuration in `config.ts`
- [ ] Add helpful API key instructions for Lilypad users

## API Endpoints Reference

| Endpoint | Path | Method | Description |
|----------|------|--------|-------------|
| Base URL | `https://anura-testnet.lilypad.tech/api/v1` | - | Base URL for all API calls |
| Chat Completions | `/chat/completions` | POST | Create chat completions |
| Image Generation | `/images/generations` | POST | Generate images from prompts |
| Models | `/models` | GET | List available models |

## API Key Configuration

### Environment Variables

The integration should check for API keys in the following order:
1. User-provided key in the UI
2. `LILYPAD_API_KEY` environment variable
3. `ANURA_API_KEY` environment variable (Lilypad's official env var name)

### Implementation Example

```typescript
// In ModelSelector.tsx
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

// In config.ts
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

## Model Configuration

Add the following models to the models object in `src/constants/models.ts`:

```typescript
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
]
```

## Error Handling

Add specific error handling for Lilypad in the `fetchModels` function:

```typescript
try {
  // Existing code...
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error)
  
  // Add specific error handling for Lilypad
  if (selectedProvider === 'lilypad' && (errorMessage.includes('401') || errorMessage.includes('unauthorized'))) {
    setModelLoadError('Invalid API key for Lilypad. Get an API key from https://anura.lilypad.tech/');
  } else {
    setModelLoadError(`Failed to load models: ${errorMessage}`);
  }
  
  // Existing error handling code...
}
```

## UI Customizations

Add Lilypad-specific instructions to the API key input screen:

```typescript
// In the API Key Input Screen section
if (currentScreen === 'apiKey') {
  // Existing code...
  
  // Add Lilypad-specific instructions
  const keyInstructions = selectedProvider === 'lilypad' 
    ? 'Get an API key from https://anura.lilypad.tech/' 
    : 'This key will be stored locally and used to access the API.';
  
  return (
    // Existing JSX...
    <Text color={theme.secondaryText}>
      {keyInstructions}
      <Newline />
      Your key is never sent to our servers.
    </Text>
    // Rest of the component...
  )
}
```

## Testing Guidance

### Manual Testing Steps

1. Provider selection:
   - Navigate to provider selection screen
   - Verify Lilypad appears in the list
   - Select Lilypad

2. API key handling:
   - Enter a valid API key
   - Verify it's accepted
   - Try an invalid key and verify error handling

3. Model fetching:
   - With a valid key, verify models are fetched
   - Check that model properties match expected values

4. Chat functionality:
   - Select a chat model (e.g., llama3.1:8b)
   - Test basic chat completion
   - For supported models, test function calling

5. Image generation:
   - Select sdxl-turbo model
   - Test basic image generation
   - Verify image is rendered correctly

### Common Issues

1. **401 Unauthorized**: Check API key validity and formatting
2. **Timeout errors**: Lilypad models may take longer to load
3. **Model not found**: Verify model ID matches exactly what Lilypad expects

## Resources

- [Lilypad API Documentation](https://docs.lilypad.tech/lilypad/developer-resources/inference-api)
- [Anura API Dashboard](https://anura.lilypad.tech/)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference) (for compatibility reference)
