# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) and developers when working with code in this repository.

## SwissKnife - CLI Interface for AI Models

SwissKnife is a command-line interface tool that provides access to various AI models including Lilypad, OpenAI, Mistral, and others. It allows users to interact with these models through a unified interface for tasks like code assistance, content generation, and more.

## Quick Start for New Developers

1. **Setup Environment**:
   - Clone the repository
   - Install dependencies: `npm install` or `pnpm install`
   - Run development mode: `npm run dev` or `pnpm run dev`

2. **Configure Models**:
   - Set API keys via environment variables (e.g., `ANURA_API_KEY` for Lilypad)
   - Or use the `/model` command in the app to configure models and save API keys

3. **Documentation**:
   - See `docs/` directory for detailed developer guides
   - Run tests with: `npm test` or `pnpm test`

## Build Commands
- Development: `npm run dev` or `pnpm run dev`
- Production build: `npm run build` or `pnpm run build` 
- Formatting: `npm run format` or `pnpm run format`
- Format check: `npm run format:check` or `pnpm run format:check`
- Testing: `npm test` (runs tests in the `test/` directory)

## Project Structure
- `src/` - Main source code
  - `components/` - React components used in the CLI interface
    - `CustomSelect/` - Custom select component for model selection
    - `ModelSelector.tsx` - Component for model selection and configuration
    - `messages/` - Message display components
    - `permissions/` - Permission request components
  - `constants/` - Configuration constants and model definitions
    - `models.ts` - Model definitions for all providers 
    - `product.ts` - Product configuration and constants
  - `services/` - API service integrations (Claude, OpenAI, etc.)
    - `claude.ts` - Anthropic Claude API client
    - `openai.ts` - OpenAI API client
    - `mcpClient.ts` - MCP client for server communication
  - `utils/` - Utility functions and helpers
    - `config.ts` - Configuration management and API key handling
    - `sessionState.ts` - Session state management
  - `tools/` - Tool implementations for different functionality
    - Various tool implementations for the CLI interface
  - `commands/` - Command implementations
    - `model.tsx` - Model selection command
    - `config.tsx` - Configuration management command
- `docs/` - Developer documentation
  - `GETTING_STARTED.md` - Guide for new developers
  - `CONTRIBUTING.md` - Contribution guidelines
  - `API_KEY_MANAGEMENT.md` - API key management guide
  - `CODE_ARCHITECTURE.md` - Code architecture guide
- `test/` - Test files and utilities
  - `api_key_persistence.test.js` - Tests for API key persistence
  - `model_selector.test.js` - Tests for model selection
- `lilypad-docs/` - Documentation for Lilypad integration

## Key Components for Junior Developers

### API Key Management Flow
1. Keys are stored in both global config and session state
2. `getActiveApiKey()` is the central function for key retrieval with this logic:
   - First checks config file for stored keys
   - Rotates through keys when round-robin is enabled
   - Falls back to environment variables if no keys in config
   - Automatically adds environment variable keys to config
   - Handles failed keys tracked in session state
3. When implementing features that use API keys:
   - Always use `getActiveApiKey()` rather than direct access
   - Use `addApiKey()` to add new keys to configuration
   - Reset session indices when changing providers with `setSessionState()`

### Model Configuration System
1. Models are defined in `src/constants/models.ts` with these key properties:
   - `id`: Unique identifier for the model
   - `name`: Display name for the model
   - `maxTokens`: Maximum tokens the model can handle
   - `pricePerToken`: Cost in USD per token
   - `capabilities`: Features the model supports (e.g., `images`, `streaming`)
2. Providers are defined in the same file with:
   - Base URLs and API endpoints
   - Available models list
   - Authentication methods
3. When adding a new model provider:
   - Add models to the appropriate provider's array
   - Update the provider object with required details
   - Implement API client in `src/services/` directory
   - Add environment variable for API key

### Model Selection Workflow
1. `ModelSelector.tsx` manages the entire selection process:
   - Provider selection → API key input → Model selection → Parameters → Confirmation
2. Each step is managed by a screen navigation stack
3. API key verification happens during the fetch models step
4. The final configuration is saved to global config via `saveGlobalConfig()`

## Code Style Guidelines
- **TypeScript**: Use TypeScript throughout the codebase
- **Modules**: ES modules with import/export statements
- **Indentation**: 2 spaces
- **Strings**: Single quotes
- **Semicolons**: Required
- **File names**: PascalCase for components, camelCase for utilities
- **Component naming**: React components use PascalCase
- **Functions/variables**: camelCase for functions, variables, and methods
- **Types/interfaces**: PascalCase for type definitions
- **Hooks**: Custom hooks prefixed with `use`
- **Error handling**: Use try/catch with specific error messages
- **React components**: Functional components with hooks

## Documentation Standards
- Use JSDoc-style comments for functions explaining purpose and parameters
- Document complex logic with inline comments
- Create markdown documentation in the `docs/` directory for detailed guides
- Add tests in the `test/` directory that demonstrate component functionality

## Common Issues and Solutions

### API Key Persistence
When switching models or restarting the application, API keys (particularly for Lilypad) might not be properly retained. This is due to the interaction between persistent configuration and session state.

**Solution:**
1. API keys are stored in:
   - Config file via `getGlobalConfig` and `saveGlobalConfig` functions
   - Session state for temporary values like current key index
   - Environment variables as fallback (e.g., `ANURA_API_KEY` for Lilypad)
   
2. When adding functionality that uses API keys:
   - Check both the config and environment variables
   - Add environment variable values to the config when found
   - Use `addApiKey` to add keys to the appropriate array in config
   - Reset session state indices when changing providers or models

### Round-Robin API Key Selection
SwissKnife uses a round-robin approach to rotate through available API keys to prevent rate limiting.

**Implementation:**
1. Each model size has a current index tracked in session state
2. When `getActiveApiKey()` is called with `roundRobin=true`:
   - It increments the current index
   - Returns the key at the new index
   - Wraps around to the beginning if it exceeds the array length
3. Failed keys are tracked in session state and skipped during selection

### URL Consistency
For Lilypad API endpoints, always use `https://anura-testnet.lilypad.tech/` in both code and user instructions.

### Model Configuration
Model definitions are in `src/constants/models.ts`. When adding new models:
1. Add model details to the appropriate provider's array
2. Include all standard fields (tokens, pricing, capabilities)
3. Update the provider object if adding a new provider

## Testing Guidelines
1. Use Jest for testing all components and utilities
2. Mock external dependencies like API calls and config functions
3. Test edge cases, especially for API key handling
4. Structure tests with descriptive names in describe/test blocks
5. Include integration tests that verify complete workflows
6. Follow existing patterns in `test/` directory for consistency

## Environment Variables
- `ANURA_API_KEY` - API key for Lilypad
- `OPENAI_API_KEY` - API key for OpenAI
- `MISTRAL_API_KEY` - API key for Mistral
- `SMALL_MODEL_API_KEY` - Anthropic API key for small model
- `LARGE_MODEL_API_KEY` - Anthropic API key for large model

## Debugging Tips
1. Use `console.log()` for basic debugging (removed in production)
2. For API key issues, check both config and session state:
   ```javascript
   console.log('Config:', getGlobalConfig());
   console.log('Session state:', getSessionState());
   ```
3. For model selection issues, trace the navigation stack:
   ```javascript
   console.log('Current screen:', this.state.currentScreen);
   console.log('Stack:', this.state.screenStack);
   ```
4. For API errors, log the complete error response:
   ```javascript
   try {
     // API call
   } catch (error) {
     console.error('Full error:', error);
   }
   ```

## Contributing
See the `docs/CONTRIBUTING.md` file for detailed contribution guidelines.