# Contributing to SwissKnife

Thank you for your interest in contributing to the SwissKnife project! This document provides guidelines for contributors to ensure a smooth collaboration process.

## Getting Started

1.  Make sure you've read the [Getting Started guide](./GETTING_STARTED.md) to set up your development environment and understand the basics.
2.  Familiarize yourself with the domain-driven organization and project structure outlined in the [Unified Architecture](./UNIFIED_ARCHITECTURE.md) and [Project Structure](./PROJECT_STRUCTURE.md) documents.
3.  Review the [Developer Guide](./DEVELOPER_GUIDE.md) for details on the daily workflow, testing, and CI/CD processes.

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

Follow these guidelines when implementing changes:

- **Domain Boundaries**: Respect the established domain boundaries (`src/ai/`, `src/tasks/`, `src/storage/`, etc.). Use well-defined interfaces (often in `src/types/`) for cross-domain communication, typically facilitated via services accessed through the `ExecutionContext`.
- **Type Safety**: Utilize TypeScript's features (interfaces, types, generics, strict null checks) to ensure code correctness and maintainability.
- **Code Style**: Adhere to the project's code style, enforced by Prettier and ESLint. Run `pnpm run format` before committing.
- **Clean Room Principle**: If implementing features inspired by other projects, focus on the requirements and behavior, writing new TypeScript code rather than directly translating.
- **Asynchronous Code**: Use `async/await` for all I/O operations.
- **Error Handling**: Implement proper error handling using `try/catch` and potentially custom error classes.
- **Configuration**: Access configuration values via the `ConfigurationManager`.
- **Logging**: Use the shared `logger` for debugging and informational messages.

### 3. Testing Your Changes

Comprehensive testing is required. Before submitting a pull request, ensure:

- **New tests** are added for new features or bug fixes, placed in the corresponding `test/unit`, `test/integration`, or `test/e2e` directory.
- **All tests pass**: Run the full test suite.
- **Code is formatted and linted**:

```bash
# Format code
pnpm run format

# Check formatting (runs in CI)
pnpm run format:check

# Run linter (runs in CI)
pnpm run lint

# Check types (runs in CI)
pnpm run typecheck

# Run all tests (unit, integration, e2e)
pnpm test

# Optionally run specific test types
# pnpm test:unit
# pnpm test:integration
# pnpm test:e2e
```
Refer to the [Testing Strategy](#testing-strategy) section in the [Developer Guide](./DEVELOPER_GUIDE.md) for more details.

## Domain-Based Contributions

### AI Domain Contributions (`src/ai/`)

- **Agent (`agent/`)**: Modifications should maintain the core message processing loop and state management. Ensure interactions with `ThinkingManager` and `ToolExecutor` are correct.
- **Tools (`tools/`)**:
    - New tools must implement the `Tool` interface, including a Zod `inputSchema` for validation.
    - Place implementations in `tools/implementations/`.
    - Register new tools appropriately (e.g., within the `Agent` or a central registry).
    - Ensure tools use the provided `ToolExecutionContext` for accessing services like storage or config.
- **Models (`models/`)**:
    - Adding a new provider requires implementing the `ModelProvider` interface and handling its specific API interactions and authentication (via `ConfigurationManager`).
    - Update the `ModelRegistry` to load and manage the new provider/models.
- **Thinking (`thinking/`)**: Contributions to GoT or other reasoning strategies should integrate with the `ThinkingManager` and `Agent` workflow.

### Task Domain Contributions (`src/tasks/`)

- **Task Lifecycle (`manager.ts`)**: Ensure tasks transition through states correctly (`Pending`, `Scheduled`, `InProgress`, `CompletedSuccess`, `CompletedFailure`).
- **Scheduler (`scheduler/`)**: Changes to the `FibonacciHeap` must maintain its performance characteristics. Modifications to `priority.ts` should consider all relevant factors.
- **Graph-of-Thought (`graph/`)**: New node types or processors should integrate with the `GoTEngine` and `TaskManager`. Ensure graph persistence logic is correct.
- **Decomposition/Synthesis (`decomposition/`, `synthesis/`)**: New strategies should implement the respective interfaces and handle subtask creation/result aggregation correctly.
- **Coordination (`coordination/`)**: Changes to Merkle Clocks or Hamming Distance require careful testing in simulated distributed environments.

### Storage Domain Contributions (`src/storage/`)

- **VFS Core (`operations.ts`, `registry.ts`, `path-resolver.ts`)**: Changes here impact all storage operations. Ensure path resolution is secure and cross-platform compatible. Maintain the abstraction provided by `StorageOperations`.
- **Backends (`backends/`)**:
    - New backends must implement the `StorageBackend` interface, including streaming methods.
    - `FilesystemBackend`: Ensure correct use of Node.js `fs` and `path` modules for security and compatibility.
    - `IPFSBackend`: Use the `IPFSClient` for communication. Ensure the `MappingStore` logic is robust, especially for directory operations.
- **IPFS Client (`ipfs/`)**: Modifications should correctly interact with the target IPFS HTTP API (e.g., Kubo, IPFS Kit MCP Server). Handle network errors and timeouts.
- **Caching (`cache.ts`)**: Implement cache strategies suitable for Node.js (filesystem, memory). Ensure proper invalidation.

### CLI Domain Contributions (`src/cli/`, `src/commands/`, `src/components/`)

- **Command System (`cli/`)**: Changes to parsing, execution, or context should maintain consistency. Use libraries like `yargs` or `commander` effectively if integrated.
- **Commands (`commands/`)**:
    - New commands should be registered correctly.
    - Use the `ExecutionContext` to access services (Agent, Storage, etc.).
    - Use the `OutputFormatter` for all user-facing messages, tables, progress indicators, and errors.
    - Implement argument parsing and validation using the chosen library/framework.
- **UI Components (`components/`)**: New Ink/React components should be reusable and follow existing styling patterns. Ensure they handle different terminal sizes and interactions gracefully.

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

## API-Based Integration (IPFS Client)

When working with the client for the external IPFS Kit MCP Server (or other IPFS nodes):

1. **Client Usage**: Interact via the `IPFSClient` class within the Storage domain (`src/storage/ipfs/`).
2. **Error Handling**: Implement robust handling for network errors, timeouts, and API-specific errors returned by the server. Use retry logic where appropriate.
3. **Authentication**: Ensure the client correctly retrieves and uses necessary credentials (API keys/tokens) from the `ConfigurationManager`.
4. **Data Handling**: Use CIDs for content addressing. Handle data serialization (e.g., JSON for IPLD nodes) and streaming correctly.

## Pull Request Process

1. **Fork & Branch**: Fork the repository and create a descriptive feature branch from `main` (e.g., `feature/add-s3-storage-backend`).
2. **Develop**: Implement your changes, adhering to code style and guidelines.
3. **Test**: Write and run relevant unit, integration, and/or E2E tests. Ensure all tests pass (`pnpm test`).
4. **Format & Lint**: Run `pnpm run format` and `pnpm run lint`. Fix any issues.
5. **Type Check**: Run `pnpm run typecheck`. Fix any TypeScript errors.
6. **Build**: Ensure the project builds successfully (`bun run build`).
7. **Document**: Update relevant documentation (`docs/`, READMEs, TSDoc).
8. **Commit**: Use conventional commit messages (see [Developer Guide](./DEVELOPER_GUIDE.md#commit-messages)).
9. **Push**: Push your feature branch to your fork.
10. **Submit PR**: Create a pull request against the main repository's `main` branch. Fill out the PR template clearly, explaining the changes and linking any related issues.

## Code Review Process

Pull requests are reviewed based on:

1. **Correctness**: Does the code implement the feature or fix the bug correctly?
2. **Architecture & Design**: Does it align with the project's domain-driven architecture and principles?
3. **Code Quality**: Is the code clean, readable, maintainable, and does it follow style guidelines?
4. **Testing**: Is the code adequately tested (unit, integration, E2E)? Do tests pass?
5. **Documentation**: Are code comments (TSDoc), READMEs, and `docs/` files updated appropriately?
6. **Performance**: Are there any obvious performance implications?
7. **Security**: Are there any potential security vulnerabilities introduced?

## Documentation Guidelines

Maintain high-quality documentation:

1. **Code Comments**: Use TSDoc comments (`/** ... */`) for exported functions, classes, interfaces, types, and complex internal logic. Explain *why*, not just *what*.
2. **Markdown Files**: Update existing files or add new ones in the `docs/` directory for significant features, architectural changes, or user guides. Keep documentation consistent with the code.
3. **READMEs**: Update the main `README.md` or relevant subdirectory READMEs if necessary.
4. **TypeScript Types**: Use clear and descriptive names for types and interfaces. They serve as implicit documentation.

## Best Practices

### Configuration Management

- Use the `ConfigManager` singleton for all configuration
- Provide sensible defaults for optional configuration
- Document required configuration settings

### Error Handling

- Use `try/catch` for operations that can fail (I/O, network requests).
- Throw specific, custom errors (extending `Error` or a base `SwissKnifeError`) where possible, providing context.
- Provide user-friendly messages for errors surfaced to the CLI. Log detailed errors internally.

### Testing

- Follow the structure outlined in the [Testing Strategy](#testing-strategy) section of the [Developer Guide](./DEVELOPER_GUIDE.md).
- Aim for high unit test coverage for logic within components.
- Write integration tests to verify interactions between components.
- Add E2E tests for critical user workflows.
- Use Jest's mocking capabilities effectively.

## Questions?

If you have questions about contributing, please:

1. Check existing documentation in the `docs/` directory
2. Review code for similar patterns
3. Look at the architecture diagrams for guidance

Thank you for contributing to SwissKnife!
