# Contributing to SwissKnife

Thank you for your interest in contributing to the SwissKnife project! This document provides guidelines for contributors to ensure a smooth collaboration process.

## Getting Started

1. Make sure you've read the [Getting Started guide](./GETTING_STARTED.md) to understand our unified TypeScript architecture.
2. Familiarize yourself with the domain-driven organization and project structure as outlined in the [UNIFIED_ARCHITECTURE.md](./UNIFIED_ARCHITECTURE.md) file.

## Development Workflow

### 1. Setting Up Your Environment

Make sure your development environment is properly set up:

```bash
# Install dependencies
npm install  # or pnpm install

# Run the development server
npm run dev  # or pnpm run dev
```

### 2. Writing Code

When writing code for SwissKnife, follow these guidelines:

- **Domain Boundaries**: Respect domain boundaries and use well-defined interfaces for cross-domain communication.
- **Type Safety**: Use TypeScript with proper type annotations and leverage the type system for safety.
- **Code Organization**: 
  - Place code in the appropriate domain directory.
  - Follow the domain structure outlined in the architecture documentation.
  - Use consistent naming conventions across domains.

### 3. Testing Your Changes

Always test your changes before submitting a pull request:

```bash
# Run the linter
npm run lint

# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Format code
npm run format
```

## Domain-Based Contributions

### AI Domain Contributions

When contributing to the AI domain (`src/ai/`):

1. **Agent System**: 
   - Follow the existing agent implementation patterns
   - Ensure proper tool execution handling
   - Maintain conversation history management

2. **Tool System**:
   - Implement the `Tool` interface for new tools
   - Handle parameter validation properly
   - Document the tool's purpose and parameters

3. **Model System**:
   - Implement the `ModelProvider` interface for new providers
   - Handle API keys securely
   - Implement proper error handling

### Task Domain Contributions

When contributing to the task domain (`src/tasks/`):

1. **Graph-of-Thought**:
   - Follow the existing graph implementation patterns
   - Ensure proper dependency management
   - Respect the node type system

2. **Fibonacci Heap Scheduler**:
   - Maintain heap property invariants
   - Ensure proper priority calculations
   - Handle edge cases correctly

### Storage Domain Contributions

When contributing to the storage domain (`src/storage/`):

1. **IPFS Integration**:
   - Use the MCPClient for all IPFS operations
   - Handle API errors gracefully
   - Implement proper caching where appropriate

2. **Cache System**:
   - Follow the tiered cache pattern
   - Implement proper invalidation strategies
   - Handle cache misses gracefully

### CLI Domain Contributions

When contributing to the CLI domain (`src/cli/`):

1. **Command System**:
   - Register commands through the command registry
   - Implement consistent error handling
   - Provide helpful usage information

2. **UI Components**:
   - Use React/Ink for terminal UI components
   - Maintain consistent UI patterns
   - Ensure accessibility with keyboard navigation

## Cross-Domain Integration

When your contribution spans multiple domains:

1. **Interface Definitions**:
   - Define clear interfaces in the appropriate `types/` directory
   - Document the purpose and usage of each interface
   - Ensure type safety across domain boundaries

2. **Service Composition**:
   - Create proper composition of services from different domains
   - Use dependency injection where appropriate
   - Maintain single responsibility principle

## API-Based Integration

When working with the IPFS Kit MCP Server:

1. **Client Implementation**:
   - Use the MCPClient class for all operations
   - Handle authentication properly
   - Implement error handling and retries

2. **Data Handling**:
   - Use CIDs consistently for content references
   - Implement proper serialization/deserialization
   - Handle binary data correctly

## Pull Request Process

1. **Fork the Repository**: Create your own fork of the repository.
2. **Create a Branch**: Work on a feature branch named according to what you're implementing.
3. **Write Code**: Implement your changes following the domain-driven organization.
4. **Test**: Make sure all tests pass and add new tests for new functionality.
5. **Document**: Update or add documentation as needed.
6. **Submit PR**: Create a pull request with a clear description of your changes.

## Code Review Process

Pull requests will be reviewed for:

1. **Domain Compliance**: Does the code follow our domain-driven organization?
2. **Type Safety**: Does it properly leverage TypeScript's type system?
3. **Functionality**: Does it work as expected?
4. **Tests**: Are there appropriate unit and integration tests?
5. **Documentation**: Is the code and functionality well-documented?

## Documentation

Good documentation is essential:

1. **Code Comments**: Use JSDoc-style comments for functions and complex logic.
2. **Markdown Files**: Update or add markdown files in the `docs/` directory for major features.
3. **TypeScript Types**: Ensure proper type definitions that serve as documentation.

## Best Practices

### Configuration Management

- Use the `ConfigManager` singleton for all configuration
- Provide sensible defaults for optional configuration
- Document required configuration settings

### Error Handling

- Implement proper error handling for all async operations
- Provide meaningful error messages
- Use typed error objects where appropriate

### Testing

- Write unit tests for individual components
- Write integration tests for cross-domain functionality
- Use mock objects appropriately for external dependencies

## Questions?

If you have questions about contributing, please:

1. Check existing documentation in the `docs/` directory
2. Review code for similar patterns
3. Look at the architecture diagrams for guidance

Thank you for contributing to SwissKnife!