# CLAUDE.md
This file provides guidance to Claude Code (claude.ai/code) and developers when working with code in this repository.

## Table of Contents
- [SwissKnife Overview](#swissknife---cli-interface-for-ai-models)
- [Quick Start for New Developers](#quick-start-for-new-developers)
- [Build Commands](#build-commands)
- [Development Environment](#development-environment)
- [Project Structure](#project-structure)
- [Key Components for Junior Developers](#key-components-for-junior-developers)
- [Code Style Guidelines](#code-style-guidelines)
- [Documentation Standards](#documentation-standards)
- [Integration Architecture](#integration-architecture)
- [Common Issues and Solutions](#common-issues-and-solutions)
- [Testing Guidelines](#testing-guidelines)
- [Environment Variables](#environment-variables)
- [Debugging Tips](#debugging-tips)
- [Contributing](#contributing)

## SwissKnife - CLI Interface for AI Models

SwissKnife is a command-line interface tool that provides access to various AI models including Lilypad, OpenAI, Mistral, and others. It allows users to interact with these models through a unified interface for tasks like code assistance, content generation, and more.

The project is undergoing a major integration of several components:
- **Core SwissKnife**: TypeScript/React CLI interface
- **TypeScript Implementations**: Clean room TypeScript implementations of AI interaction capabilities (see [docs/CLEAN_ROOM_IMPLEMENTATION.md](docs/CLEAN_ROOM_IMPLEMENTATION.md))
- **IPFS Accelerate**: ML acceleration framework for running neural networks within the CLI tool
- **SwissKnife Legacy**: Previous implementation with TaskNet functionality

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
- TypeScript lint: `npm run lint` or `pnpm run lint`
- Clean build: `npm run clean && npm run build` or `pnpm run clean && pnpm run build`

## Development Environment

### Development Guidelines
- **Test-First Development**: All new features must first be developed in the test/ folder
- **Feature Isolation**: Do not modify code outside of test/ until fully debugged
- **API Exposure**: All functionality should be exposed via FastAPI endpoints
- **Performance Focus**: Use memory-mapped structures and Arrow C Data Interface for low-latency IPC
- **Code Analysis**: Maintain an abstract syntax tree (AST) of the project to identify and prevent code duplication
- **DRY Principle**: Use the AST to enforce Don't Repeat Yourself by detecting similar code structures
- **Cross-Component Integration**: When working with functionality from different source components (Goose, IPFS Accelerate, etc.), use the integration bridges in `src/integration/`

### Testing Strategy

The project follows a comprehensive testing approach to ensure reliability and maintainability:

#### Test Organization
- **Unit Tests**: Located in the `test/` directory with file naming pattern `test_*.js` or `*.test.js`
- **Integration Tests**: Also in `test/` but focused on component interactions in `integration/` subdirectory
- **Performance Tests**: Specialized tests for measuring throughput and latency in `performance/` subdirectory

#### Test Improvements
- **Mock Integration**: Arrow C Data Interface mocking for cluster state helpers
- **Role-Based Architecture**: Improved fixtures for master/worker/leecher node testing
- **Gateway Compatibility**: Enhanced testing with proper filesystem interface mocking
- **LibP2P Integration**: Fixed tests to work without external dependencies
- **Parameter Validation**: Corrected constructor argument handling in tests
- **Interface Focus**: Made tests more resilient to implementation changes by focusing on behaviors rather than implementation details

#### Test Patterns
1. **Fixture-Based Testing**: Use jest fixtures for test setup and teardown
2. **Mocking IPFS Daemon**: Use subprocess mocking to avoid actual daemon dependency
3. **Property-Based Testing**: Use testing-library for edge case discovery
4. **Snapshot Testing**: For configuration and schema verification
5. **Parallelized Test Execution**: For faster feedback cycles
6. **Native Module Patching**: Special handling for Rust/native modules
7. **Logging Suppression**: Context managers to control test output noise

#### Cross-Component Testing Strategy
For testing cross-component functionality:

1. **Bridge Testing**: Test the TypeScript-to-Rust bridges thoroughly
2. **Environment Detection**: Test environment detection and capability detection
3. **Mock Component Interfaces**: Create mocks for each component interface
4. **Isolated Component Tests**: Test each component in isolation before integration testing
5. **Full Integration Tests**: Test the fully integrated components with real data

### Code Style Guidelines
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
    - `acceleration/` - Neural network acceleration services (from ipfs_accelerate_js) for CLI tool
    - `storage/` - Storage services including IPFS integration
    - `task/` - Task execution services (from swissknife_old)
  - `utils/` - Utility functions and helpers
    - `config.ts` - Configuration management and API key handling
    - `sessionState.ts` - Session state management
    - `environment.ts` - Environment detection utilities
    - `native-loader.ts` - Native module loading utilities
  - `tools/` - Tool implementations for different functionality
  - `commands/` - Command implementations
    - `model.tsx` - Model selection command
    - `config.tsx` - Configuration management command
    - `acceleration.tsx` - Hardware acceleration commands
    - `task.tsx` - Task management commands
  - `integration/` - Cross-component integration
    - `typescript-implementations/` - Clean room TypeScript implementations
    - `ipfs-accelerate/` - Neural network acceleration integration for CLI
    - `tasknet/` - TaskNet functionality integration
  - `clean-implementations/` - Clean room TypeScript implementations (see docs/CLEAN_ROOM_IMPLEMENTATION.md)
- `docs/` - Developer documentation
  - `GETTING_STARTED.md` - Guide for new developers
  - `CONTRIBUTING.md` - Contribution guidelines
  - `API_KEY_MANAGEMENT.md` - API key management guide
  - `CODE_ARCHITECTURE.md` - Code architecture guide
  - `INTEGRATION.md` - Detailed integration architecture
- `test/` - Test files and utilities
  - `api_key_persistence.test.js` - Tests for API key persistence
  - `model_selector.test.js` - Tests for model selection
  - `integration/` - Integration tests
  - `performance/` - Performance tests
- `lilypad-docs/` - Documentation for Lilypad integration
- `rust/` - Rust code for native modules
  - `goose-bridge/` - Bridge between TypeScript and Goose
- `native-modules/` - Compiled native modules

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

### Integration Architecture
1. **Component Source**: Each component is tagged with its source (`current`, `goose`, `ipfs_accelerate`, `swissknife_old`)
2. **Cross-Component Bridges**: Components in `src/integration/` provide bridges between different source components
3. **Environment Detection**: `src/utils/environment.ts` detects the current environment and capabilities
4. **Native Module Loading**: `src/utils/native-loader.ts` handles loading native modules
5. **Storage Abstraction**: `src/services/storage/virtual-fs.ts` provides a unified storage interface
6. **Task Management**: `src/services/task/task-manager.ts` provides task execution capabilities

## Integration Architecture

The SwissKnife project integrates several components into a unified architecture:

### 1. Core Components
- **Node.js Application**: Main CLI interface built with TypeScript/React
- **Clean Room Implementations**: Performance-critical components implemented in TypeScript using clean room methodology
- **Node.js ML Acceleration**: Neural network acceleration for CLI
- **TaskNet Functionality**: Task execution from swissknife_old

### 2. Integration Strategy
- **Clean TypeScript Implementations**: Direct implementation of all functionality in TypeScript
- **Environment Detection**: Runtime detection of capabilities
- **Unified API**: Common API for all functionality
- **Layered Architecture**: CLI UI → Commands → Services → Integrations → TypeScript Implementations

### 3. Cross-Component Communication
- **MCP Protocol**: Model Context Protocol for AI interaction
- **Event System**: Event-driven communication between components
- **Worker Architecture**: Task execution via worker pools
- **Storage Abstraction**: Virtual filesystem for unified storage

### 4. Development Workflow for Integrated Components
1. Write tests in the `test/` directory
2. Implement the component in the appropriate subdirectory of `src/`
3. Create integration bridge if needed
4. Register with the appropriate registry system
5. Add documentation

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

### Cross-Component Issues

#### Clean Implementation Loading
Issues may occur when loading clean room implementations in different environments.

**Solution:**
- Use the module loader utilities that handle proper imports
- Implement fallbacks for different environments
- Add comprehensive error handling for module loading

#### Environment Detection
Browser-specific features may fail in Node.js environments.

**Solution:**
- Always use the `environment.ts` utilities to detect capabilities
- Implement fallbacks for browser-specific features
- Use feature detection rather than environment detection when possible

#### Configuration Migration
Migrating from TOML to JSON configuration may cause issues.

**Solution:**
- Use the configuration migration utilities in `src/utils/config-migration.ts`
- Validate configuration after migration
- Provide fallbacks for missing configuration values

## Testing Guidelines
1. Use Jest for testing all components and utilities
2. Mock external dependencies like API calls and config functions
3. Test edge cases, especially for API key handling
4. Structure tests with descriptive names in describe/test blocks
5. Include integration tests that verify complete workflows
6. Follow existing patterns in `test/` directory for consistency
7. Test cross-component functionality with specialized tests in `test/integration/`

## Environment Variables
- `ANURA_API_KEY` - API key for Lilypad
- `OPENAI_API_KEY` - API key for OpenAI
- `MISTRAL_API_KEY` - API key for Mistral
- `SMALL_MODEL_API_KEY` - Anthropic API key for small model
- `LARGE_MODEL_API_KEY` - Anthropic API key for large model
- `LOG_LEVEL` - Logging level for all components
- `ENABLE_HARDWARE_ACCELERATION` - Enable hardware acceleration in browsers
- `USE_OPTIMIZED_IMPLEMENTATIONS` - Prefer optimized TypeScript implementations

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
5. For implementation module issues, check loading status:
   ```javascript
   console.log('Clean implementation loaded:', isImplementationModuleLoaded('ai_agent'));
   ```
6. For environment detection issues, log capabilities:
   ```javascript
   console.log('Environment:', getEnvironmentCapabilities());
   ```

## Contributing
See the `docs/CONTRIBUTING.md` file for detailed contribution guidelines.