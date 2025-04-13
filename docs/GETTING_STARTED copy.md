# Getting Started with SwissKnife

This guide helps new developers get started with the SwissKnife project, a CLI interface for interacting with various AI models.

## Project Overview

SwissKnife is a command-line interface built with TypeScript and React (using Ink for terminal UI). It provides a unified interface to interact with various AI models including:

- Lilypad
- OpenAI (GPT models)
- Anthropic (Claude models)
- Mistral
- Groq
- And more

The application is designed to allow users to select models, input API keys, and interact with the models through a user-friendly terminal interface.

## Prerequisites

- Node.js (v16 or higher)
- npm or pnpm
- Basic knowledge of TypeScript and React
- Access to API keys for the models you want to use

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd swissknife
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   # or
   pnpm run dev
   ```

## Configuration

There are two main ways to configure the application:

1. **Environment Variables**: Set API keys directly in your environment:
   ```bash
   export ANURA_API_KEY=your_lilypad_api_key
   export OPENAI_API_KEY=your_openai_api_key
   # etc.
   ```

2. **In-App Configuration**: Use the `/model` command in the app to select providers and enter API keys. The application will save these in a configuration file.

## Understanding the Codebase

Here's a brief overview of key parts of the codebase:

### Model Selection and Configuration

- `src/components/ModelSelector.tsx` - UI for selecting and configuring models
- `src/constants/models.ts` - Model definitions and provider information
- `src/utils/config.ts` - Configuration management and API key handling
- `src/utils/sessionState.ts` - In-memory session state management

### Core Files

- `src/entrypoints/cli.tsx` - Main entry point for the CLI application
- `src/services/` - API service integrations for different providers
- `src/tools/` - Tool implementations for different functionality
- `src/utils/` - Common utility functions

## Making Changes

When making changes to the codebase, follow these guidelines:

1. **Code Style**: Follow the TypeScript and React coding standards outlined in CLAUDE.md
2. **Testing**: Add tests for new functionality in the `test/` directory
3. **Documentation**: Update relevant documentation in the `docs/` directory
4. **Environment Variables**: Handle environment variables consistently and add them to the config

## Common Development Tasks

### Adding a New Model

1. Update `src/constants/models.ts` with the new model details
2. Add any necessary API client code in `src/services/`
3. Update model selection UI in `ModelSelector.tsx` if needed
4. Handle API key configuration in `config.ts`

### Fixing API Key Issues

If you need to fix API key handling:

1. Ensure environment variables are checked first in `getActiveApiKey()`
2. Add fallback mechanisms when keys are not found
3. Save keys to config when found in environment
4. Reset session state indices when changing providers

### Running Tests

Run the tests using:
```bash
npm test
# or
pnpm test
```

## Troubleshooting

### API Key Not Persisting

Check the following:

1. Ensure `saveGlobalConfig()` is being called with the updated config
2. Verify session state indices are being reset when changing providers
3. Check if the API key is being correctly added to the config arrays
4. Use `addApiKey()` helper function to add keys to the config

### URL Inconsistencies

Always use `https://anura-testnet.lilypad.tech/` for Lilypad API endpoints and user instructions.

## Need Help?

- Check the existing documentation in the `docs/` directory
- Look at the tests in the `test/` directory for examples
- Review existing code patterns for similar functionality

## Junior Developer Guide: Building a New Feature

This section walks through building a simple feature from scratch, demonstrating the patterns and practices used in SwissKnife.

### Example: Adding a Model Parameter Control

Let's add a feature that allows users to set a "temperature" parameter for applicable models.

#### Step 1: Update Configuration Type

First, add the new parameter to the `GlobalConfig` interface in `src/utils/config.ts`:

```typescript
export interface GlobalConfig {
  // Existing properties...
  
  // Add the new parameter
  temperature?: number;
}
```

#### Step 2: Add UI Component

Create a temperature selector screen in `ModelSelector.tsx`:

```typescript
renderTemperatureScreen() {
  return (
    <Box flexDirection="column">
      <Text>Select Temperature (0.0-1.0)</Text>
      <Text>Higher values make output more random, lower values make it more deterministic</Text>
      <TextInput 
        value={this.state.temperature || '0.7'} 
        onChange={this.handleTemperatureChange}
        onSubmit={this.handleTemperatureSubmit}
      />
      <Text>Press Enter to confirm or Escape to go back</Text>
    </Box>
  );
}

handleTemperatureChange = (value: string) => {
  // Parse and validate temperature
  const temp = parseFloat(value);
  if (!isNaN(temp) && temp >= 0 && temp <= 1) {
    this.setState({ temperature: value });
  }
}

handleTemperatureSubmit = () => {
  // Save temperature and go to next screen
  const temp = parseFloat(this.state.temperature || '0.7');
  
  // Update configuration
  const config = getGlobalConfig();
  config.temperature = temp;
  saveGlobalConfig(config);
  
  // Go to next screen
  this.navigateTo('confirmation');
}
```

#### Step 3: Add to Navigation Flow

Update the navigation flow to include the new screen:

```typescript
handleModelParamsSubmit = () => {
  // After handling other parameters...
  
  // Check if the selected model supports temperature
  const model = this.getSelectedModel();
  if (model && model.capabilities.temperature) {
    this.navigateTo('temperature');
  } else {
    // Skip temperature screen for unsupported models
    this.navigateTo('confirmation');
  }
}
```

#### Step 4: Update Model Definitions

Update model capabilities in `src/constants/models.ts` to indicate which models support temperature:

```typescript
export interface ModelCapabilities {
  streaming?: boolean;
  images?: boolean;
  temperature?: boolean; // Add the capability flag
}

// Update model definitions
export const providers = {
  openai: {
    // ...
    models: [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        maxTokens: 8192,
        pricePerToken: 0.00001,
        capabilities: {
          streaming: true,
          temperature: true, // Mark as supporting temperature
        },
      },
      // ...
    ],
  },
  // ...
};
```

#### Step 5: Update Service Integration

Modify the API service to use the temperature parameter:

```typescript
// In src/services/openai.ts
export async function callOpenAI({
  prompt,
  apiKey,
  modelName,
  maxTokens,
  temperature, // Add temperature parameter
  callbacks,
}: OpenAIParams): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelName,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: temperature || 0.7, // Use temperature with fallback
    }),
  });
  
  // Process response...
}
```

#### Step 6: Add Tests

Create tests for the new feature:

```javascript
// In test/model_selector.test.js or a new test file
test('temperature setting is saved to configuration', () => {
  // Setup test
  const component = new ModelSelector({ onDone: jest.fn() });
  component.setState({
    selectedProvider: 'openai',
    selectedModel: 'gpt-4o',
    temperature: '0.8',
  });
  
  // Mock configuration functions
  const mockConfig = {};
  getGlobalConfig.mockReturnValue(mockConfig);
  
  // Call the method
  component.handleTemperatureSubmit();
  
  // Verify temperature was saved
  expect(saveGlobalConfig).toHaveBeenCalled();
  expect(mockConfig.temperature).toBe(0.8);
});
```

#### Step 7: Update Documentation

Finally, document the new feature:

1. Update `docs/CODE_ARCHITECTURE.md` to mention the temperature parameter
2. Add the parameter to any relevant examples in the documentation
3. Include information about the feature in user documentation

### Putting It All Together

This example demonstrates the key patterns used in SwissKnife:

1. **Configuration Management**: Adding to the GlobalConfig interface
2. **UI Components**: Creating screen components in React/Ink
3. **Navigation Flow**: Handling screen transitions
4. **API Integration**: Passing parameters to external APIs
5. **Testing**: Verifying changes work as expected

By following these patterns, you can confidently add new features while maintaining consistency with the existing codebase.

## Conclusion

This guide provides a starting point for new developers working on the SwissKnife project. Remember to follow the established patterns and coding standards, and don't hesitate to look at existing code for examples of how to implement new features.

For more detailed information, refer to:
- `docs/API_KEY_MANAGEMENT.md` for API key handling
- `docs/CODE_ARCHITECTURE.md` for architecture details
- `docs/CONTRIBUTING.md` for contribution guidelines
- `test/README.md` for testing guidelines