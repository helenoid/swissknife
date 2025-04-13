# CLI Contribution Guidelines

This document establishes contribution guidelines for the SwissKnife CLI project. It outlines the standards, processes, and best practices for contributing to the codebase to ensure consistency, quality, and maintainability.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Code Style and Standards](#code-style-and-standards)
3. [Development Workflow](#development-workflow)
4. [Pull Request Process](#pull-request-process)
5. [Testing Requirements](#testing-requirements)
6. [Documentation Requirements](#documentation-requirements)
7. [CLI-Specific Guidelines](#cli-specific-guidelines)
8. [Performance Considerations](#performance-considerations)
9. [Security Guidelines](#security-guidelines)
10. [Accessibility Guidelines](#accessibility-guidelines)
11. [Community Guidelines](#community-guidelines)

## Getting Started

### Prerequisites

Before contributing to the SwissKnife CLI project, ensure you have:

1. Reviewed the [CLI Development Environment](cli_dev_environment.md) document
2. Set up your development environment according to specifications
3. Familiarized yourself with the [CLI Architecture](cli_architecture.md)
4. Read the [Code of Conduct](CODE_OF_CONDUCT.md)

### First-time Setup

1. Fork the repository
2. Clone your fork locally
3. Add the upstream repository as a remote
4. Install dependencies with `pnpm install`
5. Run tests with `pnpm test` to verify your setup

```bash
# Example setup
git clone https://github.com/yourusername/swissknife.git
cd swissknife
git remote add upstream https://github.com/organization/swissknife.git
pnpm install
pnpm test
```

## Code Style and Standards

### TypeScript Guidelines

- Use TypeScript for all new code
- Always define explicit return types for functions
- Prefer interfaces over type aliases for object types
- Use readonly modifiers where appropriate
- Avoid `any` type; use `unknown` when type is truly unknown
- Leverage TypeScript's utility types (e.g., `Partial<T>`, `Required<T>`, `Pick<T>`)

```typescript
// Good
interface UserOptions {
  readonly id: string;
  name: string;
  email?: string;
}

function processUser(user: UserOptions): Result<User> {
  // Implementation
}

// Avoid
function processUser(user: any): any {
  // Implementation
}
```

### Naming Conventions

| Item | Convention | Example |
|------|------------|---------|
| Files | Kebab-case | `file-reader.ts` |
| Classes | PascalCase | `FileReader` |
| Interfaces | PascalCase | `FileReaderOptions` |
| Types | PascalCase | `FileContent` |
| Functions | camelCase | `readFile()` |
| Variables | camelCase | `fileContent` |
| Constants | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |
| Enums | PascalCase | `FileType` |
| Enum members | PascalCase | `FileType.TextFile` |
| React Components | PascalCase | `FileViewer` |

### File Organization

- One class or primary export per file
- Group related functionality in directories
- Follow the project's established directory structure:

```
src/
├── commands/       # CLI commands
├── tools/          # Tool implementations
├── models/         # Data models
├── services/       # Service implementations
├── utils/          # Utility functions
├── types/          # TypeScript type definitions
├── constants/      # Constants and enums
├── config/         # Configuration handling
└── cli.ts          # Main entry point
```

### Code Formatting

- Use ESLint and Prettier for code formatting
- Run `pnpm lint` before committing
- Configure your editor to use the project's ESLint and Prettier settings
- Do not disable linting rules without team discussion

The project uses these formatting rules:
- 2 spaces for indentation
- Single quotes for strings
- Semicolons required
- 100 character line length limit
- Trailing commas in multi-line objects and arrays

## Development Workflow

### Feature Development

1. Create a new branch from `develop` for your feature:
   ```bash
   git checkout develop
   git pull upstream develop
   git checkout -b feature/your-feature-name
   ```

2. Implement your changes with frequent commits
3. Write tests for your changes
4. Update documentation as needed
5. Run linting and tests locally before pushing:
   ```bash
   pnpm lint
   pnpm test
   ```

6. Push your branch and create a pull request

### Bug Fixes

1. Create a new branch from `develop` for your bug fix:
   ```bash
   git checkout develop
   git pull upstream develop
   git checkout -b bugfix/issue-description
   ```

2. Implement the fix
3. Add or update tests to verify the fix
4. Push your branch and create a pull request
5. Reference the issue number in the pull request description

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring without functionality changes
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Build process, tooling changes

Examples:
```
feat(command): add --verbose flag to list command

fix(storage): handle empty path in file reader

docs: update README with new installation instructions
```

## Pull Request Process

### PR Creation

1. Create a pull request against the `develop` branch
2. Use the provided PR template
3. Include a clear title and description
4. Link to related issues using GitHub keywords (e.g., "Fixes #123")
5. Assign appropriate reviewers
6. Add relevant labels

### PR Requirements

All PRs must:
- Pass all CI checks
- Have adequate test coverage (minimum 80%)
- Include updated documentation
- Follow code style guidelines
- Have at least one approving review before merging

### PR Review Process

1. Reviewers will evaluate:
   - Code correctness
   - Test coverage
   - Documentation completeness
   - Performance implications
   - Security considerations
   - Adherence to project standards

2. Address all review comments
3. Request re-review after addressing feedback
4. Maintainers will merge approved PRs

### PR Size Guidelines

- Keep PRs focused and reasonably sized (<500 lines of change when possible)
- Split large changes into multiple PRs when appropriate
- Consider submitting draft PRs for early feedback on large changes

## Testing Requirements

### Test Coverage Requirements

- Minimum 80% code coverage required for new code
- 100% coverage encouraged for critical components
- No decrease in overall coverage percentage

### Test Types

| Test Type | Required | Coverage |
|-----------|----------|----------|
| Unit Tests | Yes | All functions, classes, and utilities |
| Integration Tests | Yes | Command implementations |
| E2E Tests | For new commands | Basic functionality |

### Unit Test Guidelines

- Place unit tests in the appropriate directory under `test/unit/`
- Name test files with `.test.ts` or `.spec.ts` suffix
- Use Jest's describe/it pattern for organization
- Mock external dependencies
- Test both success and failure scenarios

Example unit test:
```typescript
import { parseOptions } from '../../../src/utils/option-parser';

describe('parseOptions', () => {
  it('should parse valid options', () => {
    const result = parseOptions(['--option', 'value']);
    expect(result).toEqual({ option: 'value' });
  });

  it('should handle missing values', () => {
    expect(() => parseOptions(['--option'])).toThrow();
  });
});
```

### Integration Test Guidelines

- Place integration tests in the appropriate directory under `test/integration/`
- Test interaction between components
- Minimize external dependencies; use controlled test environments

Example integration test:
```typescript
import { executeCommand } from '../../../src/commands';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../helpers';

describe('List Command Integration', () => {
  beforeEach(async () => {
    await setupTestEnvironment();
  });

  afterEach(async () => {
    await cleanupTestEnvironment();
  });

  it('should list files in directory', async () => {
    const result = await executeCommand(['list', '--format', 'json']);
    expect(result).toHaveProperty('files');
    expect(Array.isArray(result.files)).toBe(true);
  });
});
```

### CLI Testing Guidelines

- Test command-line interface behavior
- Verify options parsing
- Check output formatting
- Test error handling
- Verify exit codes

## Documentation Requirements

### Code Documentation

- Document all public APIs, classes, and functions
- Use JSDoc format for TypeScript documentation
- Include parameter and return type descriptions
- Document exceptions and error conditions

Example:
```typescript
/**
 * Reads a file from the specified path.
 * 
 * @param path - The path to the file
 * @param options - Reading options
 * @returns The file content as string or Buffer based on options
 * @throws {FileNotFoundError} If the file doesn't exist
 * @throws {AccessError} If permission is denied
 */
export async function readFile(
  path: string, 
  options?: ReadOptions
): Promise<string | Buffer> {
  // Implementation
}
```

### Command Documentation

All commands must include:
1. Command help text (`--help` output)
2. Examples in documentation
3. Parameter descriptions
4. Output format documentation

Example command documentation:
```typescript
program
  .command('read')
  .description('Read a file and display its contents')
  .argument('<file>', 'Path to the file to read')
  .option('-f, --format <format>', 'Output format (text, json)', 'text')
  .option('-n, --lines <number>', 'Number of lines to read', '10')
  .addHelpText('after', `
Examples:
  $ swissknife read data.txt                  # Display first 10 lines in text format
  $ swissknife read data.txt --format json    # Display in JSON format
  $ swissknife read data.txt --lines 20       # Display first 20 lines
  `)
  .action(readCommand);
```

### README Updates

- Update the main README.md when adding new features
- Keep the command list in README up-to-date
- Update installation instructions as needed
- Update requirements if they change

## CLI-Specific Guidelines

### Command Design Principles

1. **Consistency**: Follow established command patterns
2. **Discoverability**: Make commands and options discoverable through help
3. **Feedback**: Provide clear feedback for actions
4. **Progressive Disclosure**: Simple interface with advanced options
5. **Robustness**: Handle errors gracefully

### Command Implementation Pattern

```typescript
// Command definition
export default function registerCommand(program: Command): void {
  program
    .command('command-name')
    .description('Command description')
    .argument('<required-arg>', 'Description of required argument')
    .option('-o, --option [value]', 'Description of option', 'default')
    .action(async (arg, options) => {
      try {
        // Implementation
        const result = await executeCommand(arg, options);
        displayResult(result, options);
      } catch (error) {
        handleError(error, options);
      }
    });
}

// Separate implementation for testability
export async function executeCommand(arg: string, options: any): Promise<Result> {
  // Implementation
}

// UI handling separate from logic
function displayResult(result: Result, options: any): void {
  // Format and display based on options
}

// Error handling
function handleError(error: Error, options: any): void {
  // Handle different error types
}
```

### Output Formatting

- Support multiple output formats (text, JSON)
- Use colors for enhanced readability (but ensure they can be disabled)
- Provide progress indicators for long-running operations
- Follow consistent output patterns across commands

Example output handling:
```typescript
function formatOutput(data: any, format: string): string {
  switch (format) {
    case 'json':
      return JSON.stringify(data, null, 2);
    case 'yaml':
      return yaml.dump(data);
    case 'text':
    default:
      return formatTextOutput(data);
  }
}
```

### Error Handling

- Use specific error classes for different error types
- Provide clear error messages with actionable information
- Include error codes for machine-readable output
- Support verbose error output with `--verbose` flag

Example error handling:
```typescript
try {
  // Command implementation
} catch (error) {
  if (error instanceof FileNotFoundError) {
    console.error(chalk.red(`File not found: ${error.path}`));
    console.error('Please check the file path and try again.');
    process.exit(1);
  } else if (error instanceof PermissionError) {
    console.error(chalk.red(`Permission denied: ${error.message}`));
    console.error(`Run with elevated privileges or check file permissions.`);
    process.exit(2);
  } else {
    console.error(chalk.red(`Error: ${error.message}`));
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(9);
  }
}
```

## Performance Considerations

### General Performance Guidelines

- Minimize startup time for CLI commands
- Use lazy loading for infrequently used components
- Implement streaming for large data operations
- Add progress reporting for long-running operations
- Consider resource usage on target systems

### Performance Testing

- Include performance tests for critical operations
- Establish baselines for command execution time
- Test with large data sets where appropriate
- Monitor memory usage during operations

Example performance test:
```typescript
test('should process large files efficiently', async () => {
  const testFile = generateLargeTestFile(10 * 1024 * 1024); // 10MB
  
  const startTime = process.hrtime.bigint();
  await processFile(testFile);
  const endTime = process.hrtime.bigint();
  
  const durationMs = Number(endTime - startTime) / 1_000_000;
  expect(durationMs).toBeLessThan(1000); // Should complete in under 1 second
});
```

### Resource Usage Guidelines

- Prefer streaming over loading entire files into memory
- Implement graceful degradation for resource-constrained environments
- Add configuration options for memory and CPU usage limits
- Release resources promptly when no longer needed

## Security Guidelines

### Input Validation

- Validate all command input parameters
- Sanitize file paths and external input
- Implement strict type checking
- Use allowlists rather than denylists when possible

### Secure Coding Practices

- Keep dependencies up-to-date with `pnpm audit`
- Avoid shell injection vulnerabilities
- Use secure random number generation
- Follow the principle of least privilege
- Implement proper error handling without leaking sensitive information

### Credential Management

- Never hardcode credentials
- Use environment variables or secure credential storage
- Support keychain integration where appropriate
- Implement proper encryption for stored credentials
- Provide clear documentation for credential management

## Accessibility Guidelines

### Terminal Accessibility

- Support screen readers through clear text output
- Provide non-color alternatives for colorized output
- Ensure commands work with keyboard navigation
- Document keyboard shortcuts clearly
- Test with assistive technologies

### Internationalization (i18n)

- Use external string resources for user-facing messages
- Support locale-aware formatting for dates, numbers, etc.
- Design for translation from the beginning
- Test with non-ASCII characters

## Community Guidelines

### Communication Channels

- GitHub Issues: Bug reports, feature requests
- Pull Requests: Code contributions
- Discussions: General questions and discussions
- Project Documentation: User and developer guides

### Issue Reporting

When reporting issues:
1. Use the issue template
2. Include steps to reproduce
3. Describe expected vs. actual behavior
4. Include environment details
5. Attach logs if available

### Feature Requests

When requesting features:
1. Use the feature request template
2. Describe the problem the feature would solve
3. Suggest an implementation approach if possible
4. Explain use cases and benefits

### Community Conduct

All contributors are expected to:
1. Follow the Code of Conduct
2. Be respectful and constructive in communications
3. Support new contributors
4. Focus on the merits of ideas rather than individuals
5. Accept and provide feedback professionally

## Conclusion

Following these contribution guidelines helps maintain a high-quality, consistent, and maintainable codebase for the SwissKnife CLI. We appreciate your contributions and look forward to your involvement in the project.

For questions about these guidelines, please open an issue or start a discussion in the project repository.