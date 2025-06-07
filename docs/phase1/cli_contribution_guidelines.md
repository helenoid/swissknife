# CLI Contribution Guidelines

Welcome to the SwissKnife CLI project! This document establishes the guidelines for contributing code, documentation, and feedback. Following these standards helps ensure consistency, quality, and maintainability across the project.

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
4. Read the [Code of Conduct](CODE_OF_CONDUCT.md) (Assuming one exists, link if available)

### First-time Setup

1. Fork the repository on GitHub.
2. Clone your fork locally: `git clone https://github.com/<your-username>/swissknife.git`
3. Navigate into the cloned directory: `cd swissknife`
4. Add the main project repository as the `upstream` remote: `git remote add upstream https://github.com/organization/swissknife.git`
5. **Install dependencies using `pnpm` (the preferred package manager):** `pnpm install`
6. Verify your setup by running the tests: `pnpm test`

```bash
# Example setup steps
git clone https://github.com/<your-username>/swissknife.git
cd swissknife
git remote add upstream https://github.com/organization/swissknife.git
pnpm install # Installs dependencies
pnpm test    # Runs the test suite
```

## Code Style and Standards

### TypeScript Guidelines

- Use TypeScript for all new code.
- Follow the settings defined in `tsconfig.json`.
- Always define explicit return types for functions, unless trivially inferred.
- Prefer `interface` over `type` aliases for defining object shapes, but use `type` for unions, intersections, or simple aliases.
- Use `readonly` modifiers for properties that should not be reassigned after initialization, promoting immutability where practical.
- Avoid using the `any` type. Use `unknown` for values where the type is truly unknown at compile time and perform runtime checks, or define specific types/interfaces.
- Leverage TypeScript's utility types (e.g., `Partial<T>`, `Required<T>`, `Pick<T>`, `Readonly<T>`) to create new types based on existing ones.
- Use `async/await` for all asynchronous operations (I/O, promises) instead of raw `.then()`/`.catch()` chains for better readability and error handling.

```typescript
// Good Example
interface UserOptions {
  readonly id: string;
  name: string;
  email?: string;
}

async function processUser(user: UserOptions): Promise<Result<User>> { // Explicit return type
  try {
    const updatedUser = await someAsyncOperation(user);
    // ...
    return { success: true, data: updatedUser };
  } catch (error) {
    // Handle error
    return { success: false, error: error as Error };
  }
}

// Avoid Example
function processUser(user: any): any { // Avoid 'any'
  // Implementation using .then() might be less clear
}
```

### Naming Conventions

| Item | Convention | Example |
|------|------------|---------|
| Files | Kebab-case | `file-reader.ts`, `cli-helper.ts` |
| Classes | PascalCase | `FileReader`, `StorageService` |
| Interfaces | PascalCase | `FileReaderOptions`, `StorageBackend` |
| Types | PascalCase | `FileContent`, `UserId` |
| Functions | camelCase | `readFile`, `parseArguments` |
| Variables/Constants | camelCase | `fileContent`, `maxRetries` |
| Global Constants | UPPER_SNAKE_CASE | `MAX_FILE_SIZE`, `DEFAULT_TIMEOUT` |
| Enums | PascalCase | `FileType`, `LogLevel` |
| Enum members | PascalCase | `FileType.TextFile`, `LogLevel.Debug` |
| React Components (Ink) | PascalCase | `FileViewer`, `ProgressBar` |

### File Organization

- Aim for one class, interface, or logical group of functions per file.
- Group related functionality into clearly named directories.
- Follow the project's established directory structure (adapt as needed):

```
src/
├── agent/          # AI Agent core, tools, memory, thinking
│   ├── tools/      # Specific tool implementations
│   └── ...
├── cli/            # CLI specific logic: command registration, parsing, formatting, context
│   ├── commands/   # Definitions for each CLI command/subcommand group
│   └── ...
├── config/         # Configuration loading and management (`ConfigurationManager`)
├── ipfs/           # IPFS Kit Client implementation (`IPFSKitClient`)
├── ml/             # ML Engine, model loading, inference (`MLEngine`)
├── models/         # Model registry, providers, selector (`ModelRegistry`, `ModelProvider`)
├── storage/        # Storage service (VFS), backends (`StorageOperations`, `StorageBackend`)
├── tasks/          # TaskNet: scheduler, executor, workers, coordination, GoT
│   ├── workers/    # Worker pool implementation
│   └── ...
├── services/       # Background services (if any, managed by `ServiceRegistry`)
├── auth/           # Authentication and authorization logic (`KeyManager`, `UcanService`)
├── types/          # Shared TypeScript interfaces and types (non-component specific)
├── utils/          # General utility functions (e.g., path manipulation, error helpers)
├── constants/      # Shared constants (e.g., default values, error codes)
└── cli.ts          # Main CLI entry point script
```

### Code Formatting

- **Use ESLint and Prettier:** These tools are configured (`.eslintrc.js`, `.prettierrc`) to enforce style and catch potential errors.
- **Format Before Commit:** Run `pnpm format` and `pnpm lint --fix` before committing, or configure your editor to format/lint on save. Husky and lint-staged are set up to run these automatically on staged files during `git commit`.
- **Editor Integration:** Configure your editor (VS Code recommended) to use the project's ESLint and Prettier configurations for real-time feedback and auto-formatting.
- **Rule Disabling:** Avoid disabling linting rules inline (`// eslint-disable-next-line`). If a rule is problematic, discuss changing the project configuration with the team.

**Key Formatting Rules (enforced by Prettier/ESLint):**
- Indentation: 2 spaces
- Quotes: Single quotes for strings (unless containing single quotes)
- Semicolons: Required at the end of statements
- Line Length: ~100 characters (soft limit, Prettier may exceed slightly)
- Trailing Commas: Yes for multi-line objects, arrays, etc. (`es5` setting)

## Development Workflow

### Feature Development

1. Create a new branch from `develop` (or `main` if `develop` isn't used) for your feature:
   ```bash
   git checkout develop
   git pull upstream develop
   git checkout -b feature/your-feature-name # Use descriptive names
   ```
2. Implement your changes with frequent, small, atomic commits.
3. Write unit and integration tests alongside your code (TDD preferred).
4. Update relevant documentation (code comments, Markdown docs) as you go.
5. Run linting and tests locally before pushing:
   ```bash
   pnpm lint
   pnpm test
   ```
6. Push your branch to your fork and create a pull request against the upstream `develop` branch.

### Bug Fixes

1. Create a new branch from `develop` (or `main`) for your bug fix:
   ```bash
   git checkout develop
   git pull upstream develop
   git checkout -b fix/issue-description-or-number
   ```
2. Implement the fix.
3. **Add or update tests** to specifically cover the bug scenario and verify the fix. Ensure the test fails without the fix and passes with it.
4. Push your branch and create a pull request.
5. Reference the issue number being fixed in the pull request description (e.g., "Fixes #123").

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body providing more context]

[optional footer(s) e.g., BREAKING CHANGE:, Fixes #123]
```

**Common Types:**
- `feat`: A new feature for the user.
- `fix`: A bug fix for the user.
- `docs`: Changes to documentation only.
- `style`: Code style changes (formatting, whitespace, etc. - no logic change).
- `refactor`: Code changes that neither fix a bug nor add a feature.
- `perf`: Code changes that improve performance.
- `test`: Adding missing tests or correcting existing tests.
- `build`: Changes affecting the build system or external dependencies.
- `ci`: Changes to CI configuration files and scripts.
- `chore`: Other changes that don't modify src or test files (e.g., updating dependencies).

**Scope:** An optional noun describing the section of the codebase affected (e.g., `agent`, `storage`, `cli`, `deps`).

**Examples:**
```
feat(agent): add support for Claude 3 models
fix(storage): prevent path traversal in filesystem backend
docs(readme): update installation instructions for Windows
style(cli): apply prettier formatting to command files
refactor(models): extract provider logic into base class
perf(tasks): optimize scheduler consolidation step
test(agent): add unit tests for tool validation logic
chore(deps): update axios to latest version
```

## Pull Request Process

### PR Creation

1. Create a pull request from your feature/bugfix branch to the upstream `develop` branch.
2. Use the provided PR template in the repository (if available).
3. Write a clear, concise title summarizing the change.
4. Provide a detailed description explaining *what* the PR does and *why* it's needed. Include:
    - Link to the related issue(s).
    - Summary of changes made.
    - Any relevant context, design decisions, or trade-offs.
    - Instructions for testing or verification, if necessary.
5. Assign appropriate reviewers (refer to project guidelines or CODEOWNERS).
6. Add relevant labels (e.g., `bug`, `feature`, `documentation`, `needs-review`).

### PR Requirements

All PRs must meet these criteria before merging:
- **Pass CI Checks:** All automated checks (linting, type checking, tests, build) must pass.
- **Adequate Test Coverage:** Meet or exceed the project's minimum test coverage requirements (e.g., 80%). New code should ideally have higher coverage. Overall coverage should not decrease.
- **Updated Documentation:** Include necessary updates to code comments (TSDoc), command help text, and Markdown documentation.
- **Adherence to Standards:** Follow the code style, naming conventions, and commit message guidelines outlined here.
- **Review Approval:** Have at least one approving review from a designated maintainer or team member.

### PR Review Process

1. Reviewers will evaluate the PR based on the requirements above, focusing on:
   - **Correctness:** Does the code work as intended? Does it fix the bug or implement the feature correctly?
   - **Design & Architecture:** Does the code fit well within the existing architecture? Is it maintainable and extensible?
   - **Readability:** Is the code clear, concise, and easy to understand?
   - **Testing:** Are the tests sufficient, correct, and testing the right things?
   - **Documentation:** Is the accompanying documentation accurate and sufficient?
   - **Security & Performance:** Are there any obvious security vulnerabilities or performance regressions?
2. Address all review comments constructively. Push updates to the same branch.
3. Request re-review after addressing feedback. Use GitHub's "re-request review" feature.
4. Once approved and CI is green, a maintainer will merge the PR (typically using squash merge or rebase merge, depending on project policy).

### PR Size Guidelines

- **Keep PRs Focused:** Each PR should ideally address a single, well-defined issue or feature. Avoid bundling unrelated changes.
- **Keep PRs Small:** Aim for reasonably sized PRs (< 500 lines of change is a good guideline, but not a strict rule) to facilitate easier and faster reviews.
- **Split Large Changes:** Break down large features or refactors into smaller, logical, independently mergeable PRs. Use feature flags if needed to merge incomplete larger features safely.
- **Draft PRs:** Use GitHub's "Draft Pull Request" feature for work in progress or to solicit early feedback on large changes or architectural decisions before they are ready for formal review.

## Testing Requirements

Refer to the [CLI Test Strategy](cli_test_strategy.md) for detailed approaches.

### Test Coverage Requirements

- Minimum **80%** code coverage (line coverage preferred) required for new code contributions.
- Critical components (core services, security-sensitive areas) should aim for **90%+** coverage.
- Pull requests **must not decrease** the overall project code coverage percentage.

### Test Types

| Test Type | Required? | Focus / Coverage | Notes |
|-----------|-----------|------------------|-------|
| Unit Tests | **Yes** | Isolate and test individual functions, classes, methods, logic branches, edge cases. Mock dependencies heavily. | Aim for high coverage (>80%) of core logic. Fast execution. |
| Integration Tests | **Yes** | Test interaction between 2+ *internal* components (e.g., Command handler calling Agent Service, Agent Service using Model Registry). Use mocks for *external* dependencies (APIs, filesystem). | Focus on component contracts and data flow within the application boundary. |
| E2E Tests | **Yes (for CLI)** | Test the compiled CLI application as a black box from the user's perspective (command execution, args, output, exit codes). Interact with real external services where feasible (using test accounts/endpoints). | Cover critical user workflows and command variations. Slower, more brittle, but highest confidence. |

### Unit Test Guidelines

- Place unit tests in a corresponding `__tests__` directory or alongside the source file with a `.test.ts` (or `.spec.ts`) suffix (e.g., `src/utils/parser.ts` -> `src/utils/__tests__/parser.test.ts`).
- Use Jest's `describe`/`it`/`expect` pattern for structuring tests.
- Mock all external dependencies (other services, network calls, filesystem) using `jest.fn()`, `jest.spyOn()`, or manual mocks (`__mocks__` directory).
- Test public methods/functions thoroughly, including valid inputs, invalid inputs, edge cases, and error conditions.
- Keep unit tests fast and focused on a single unit of code.

Example unit test:
```typescript
// src/utils/__tests__/option-parser.test.ts
import { parseOptions } from '../option-parser'; // Function under test

describe('parseOptions', () => {
  it('should parse valid options correctly', () => {
    const args = ['--name', 'test', '--count', '5'];
    const optionDefs = [/* ... define options ... */];
    const result = parseOptions(args, optionDefs);
    expect(result).toEqual({ name: 'test', count: 5 });
  });

  it('should throw an error for missing required options', () => {
    const args = ['--count', '5']; // Missing required 'name'
    const optionDefs = [/* ... define options with 'name' required ... */];
    expect(() => parseOptions(args, optionDefs)).toThrow(/Missing required option: name/);
  });

  // ... more tests for types, defaults, errors etc. ...
});
```

### Integration Test Guidelines

- Place integration tests in a top-level `test/integration/` directory, organized by feature or component interaction.
- Use Jest as the test runner.
- Instantiate real instances of the components being tested together.
- Mock dependencies *external* to the group of components under test (e.g., mock network requests if testing Agent+ModelRegistry interaction).
- Focus on verifying the contract and data flow between the integrated components.
- Use helper functions for setting up common test environments or data.

Example integration test:
```typescript
// test/integration/agent-storage.test.ts
import { AgentService } from '../../src/agent/agent.service';
import { StorageService } from '../../src/storage/storage.service';
import { FilesystemBackend } from '../../src/storage/backends/filesystem';
// ... other imports

describe('AgentService and StorageService Integration', () => {
  let agentService: AgentService;
  let storageService: StorageService;
  let tempDir: string;

  beforeEach(async () => {
    // Setup: Create temp dir, instantiate real services
    tempDir = await setupTempDirectory();
    const fsBackend = new FilesystemBackend(tempDir);
    const storageRegistry = new StorageRegistry(); // Assume setup
    storageRegistry.registerBackend(fsBackend);
    storageRegistry.mount('/local', fsBackend.id);
    storageService = new StorageService(/* ... dependencies ... */);
    // Mock ModelService if needed for AgentService
    const modelServiceMock = /* ... create mock ... */;
    agentService = new AgentService(modelServiceMock, storageService /* Inject real storage */);
  });

  afterEach(async () => {
    await cleanupTempDirectory(tempDir);
  });

  it('should allow agent to save output to storage via a tool', async () => {
    // Arrange: Register a mock 'saveFile' tool that uses storageService
    const saveFileTool = { /* ... tool definition using storageService.writeFile ... */ };
    agentService.registerTool(saveFileTool);
    // Mock agent's model interaction to call the saveFile tool

    // Act: Process a message that triggers the tool
    await agentService.processMessage('Save "hello" to /local/output.txt');

    // Assert: Check if the file was actually written by StorageService
    const content = await storageService.readFile('/local/output.txt');
    expect(content.toString()).toBe('hello');
  });
});
```

### CLI Testing Guidelines (E2E)

- Place E2E tests in `test/e2e/`.
- Use the `executeCommand` helper (or similar) based on `child_process` to run the compiled CLI.
- Test the full command-line interface behavior, including:
    - Correct execution for valid arguments/options.
    - Correct error messages and exit codes for invalid input.
    - Parsing of different option syntaxes.
    - Default value handling.
    - Output formatting (text, JSON, YAML) via `--output` flags.
    - Reading from stdin / Writing to stdout.
    - Filesystem side effects (creating/modifying files).
- Keep E2E tests focused on user workflows and validating the CLI contract. Avoid testing internal implementation details here.

## Documentation Requirements

### Code Documentation

- **Use TSDoc:** Document all exported/public classes, interfaces, functions, types, and significant internal logic using TSDoc comments (`/** ... */`). This enables auto-generation of API documentation.
- **Clarity:** Explain the *purpose* and *usage* of the code element, not just *what* it does.
- **Parameters & Return Values:** Clearly document all parameters (`@param`) and return values (`@returns`), including their types, purpose, and any constraints or default values.
- **Exceptions:** Document potential errors or exceptions thrown (`@throws {ErrorType} Description of when it's thrown.`).
- **Examples:** Include concise usage examples (`@example`) where helpful, especially for complex functions or classes.

Example:
```typescript
/**
 * Reads a file from the specified virtual path using the configured storage backend.
 * Supports reading from different backends like local filesystem or IPFS based on mounts.
 *
 * @param virtualPath - The virtual path to the file (e.g., '/local/data.txt', '/ipfs/Qm...').
 * @param encoding - Optional encoding to decode the buffer (e.g., 'utf8'). If omitted, returns a Buffer.
 * @returns The file content as a string (if encoding provided) or Buffer.
 * @throws {StorageError} If the path is invalid or not found.
 * @throws {PermissionError} If read access is denied.
 * @example
 * ```typescript
 * const storage = context.getService<StorageOperations>('storage');
 * const content = await storage.readFile('/local/my-file.txt', 'utf8');
 * console.log(content);
 * ```
 */
export async function readFile(
  virtualPath: string,
  encoding?: BufferEncoding
): Promise<string | Buffer> {
  // Implementation using StorageOperations service...
}
```

### Command Documentation

All commands must include:
1. **In-CLI Help Text:** Accurate and comprehensive help generated via the CLI framework (`commander`/`yargs`) using `.description()`, `.option()`, `.argument()`, `.addHelpText()`. This is the primary source of truth.
2. **Markdown Documentation (`docs/commands/`):** Consider auto-generating baseline Markdown documentation from the command definitions. Enhance this with:
    - More detailed explanations of concepts.
    - Practical, real-world usage examples.
    - Explanations of different output formats.
    - Notes on common pitfalls or advanced usage.
3. **Parameter Descriptions:** Clearly explain each argument and option in the help text and Markdown docs.
4. **Output Format Documentation:** Describe the structure of JSON/YAML output if supported.

Example command documentation (using `commander`):
```typescript
// src/cli/commands/storage/read.ts
import { Command } from 'commander';
import { ExecutionContext } from '../../context';
// ... other imports

export function registerStorageReadCommand(program: Command): void {
  program
    .command('read <virtualPath>')
    .description('Read a file from the virtual filesystem and display its contents.')
    .option('-e, --encoding <encoding>', 'Specify file encoding (e.g., utf8)', 'utf8')
    .option('-o, --output <file>', 'Write output to a local file instead of stdout')
    // .option('--json', 'Output metadata as JSON (if applicable)') // Example
    .action(async (virtualPath: string, options: { encoding: BufferEncoding, output?: string }) => {
      // Access context and services
      // const context = getExecutionContext(); // Assuming a factory or global access method
      // const storage = context.getService<StorageOperations>('storage');
      // const formatter = context.formatter;
      try {
        const contentBuffer = await storage.readFile(virtualPath);
        const content = contentBuffer.toString(options.encoding);

        if (options.output) {
          await fs.promises.writeFile(options.output, content);
          formatter.success(`File content written to ${options.output}`);
        } else {
          process.stdout.write(content); // Write directly for raw file content
        }
        process.exitCode = 0;
      } catch (error) {
        // formatter.error(error); // Use central error handler
        console.error("Read command failed:", error);
        process.exitCode = 1;
      }
    })
    .addHelpText('after', `
Examples:
  $ swissknife storage read /local/my-document.txt
  $ swissknife storage read /ipfs/QmSomeHash/data.json --encoding utf8
  $ swissknife storage read /local/image.png --output ./downloaded_image.png
  `);
}
```

### README Updates

- Keep the main `README.md` concise but informative.
- Include:
    - Project overview and goals.
    - Quick start / Installation instructions.
    - Link to the main command reference or user guide in `docs/`.
    - Contribution guidelines summary and link.
    - License information.
- Avoid duplicating extensive command documentation in the README; link to the dedicated docs instead.

## CLI-Specific Guidelines

### Command Design Principles

1. **Consistency:** Use consistent naming (`noun-verb` or `noun verb`), argument order, option flags, and output structure across all commands. Follow POSIX guidelines where applicable.
2. **Discoverability:** Ensure commands and options are easily discoverable via `-h`/`--help`. Provide clear descriptions and examples. Implement shell autocompletion.
3. **Feedback:** Provide immediate and clear feedback for user actions: confirmations for destructive operations (unless `--force`), progress indicators for long tasks, informative success/error messages.
4. **Composability:** Design commands to work well together in shell pipelines where appropriate (e.g., reading from stdin, writing primary output like IDs or JSON to stdout, using stderr for messages).
5. **Robustness:** Handle errors gracefully (invalid input, network issues, file errors). Provide informative error messages and appropriate exit codes.
6. **Progressive Disclosure:** Keep the default command usage simple. Hide advanced or less common options unless requested (e.g., via `--verbose` or specific subcommands).

### Command Implementation Pattern

```typescript
// src/cli/commands/my-feature/my-command.ts
import { Command } from 'commander';
import { ExecutionContext } from '../../context';
// Import necessary services (e.g., MyFeatureService)

interface MyCommandOptions {
  // Define parsed option types
  optionValue: string;
  verbose: boolean;
}

// 1. Define the action function (receives parsed args/options)
async function myCommandAction(
  requiredArg: string,
  options: MyCommandOptions,
  command: Command // Commander passes the command instance
): Promise<void> {
  // 2. Get ExecutionContext (method depends on framework setup)
  const context = getExecutionContext(command); // Example factory
  const { formatter, logger } = context;
  const myFeatureService = context.getService<MyFeatureService>('myFeature');

  logger.debug(`Executing my-command with arg: ${requiredArg}, options: %o`, options);

  try {
    const spinner = formatter.spinner('Performing operation...').start();
    // 3. Call underlying service logic
    const result = await myFeatureService.performAction(requiredArg, options.optionValue);
    spinner.succeed('Operation completed.');

    // 4. Format and display results using OutputFormatter
    formatter.data(result); // Handles text/JSON/YAML based on global flags

    process.exitCode = 0;
  } catch (error) {
    // 5. Handle errors via central formatter
    formatter.error(error as Error);
    process.exitCode = 1; // Or specific code from error
  }
}

// 6. Define command registration function
export function registerMyCommand(program: Command): void {
  program
    .command('my-command <required-arg>')
    .description('Description of my command')
    .option('-o, --option <value>', 'Description of option', 'default-value')
    .option('-v, --verbose', 'Enable verbose output', false)
    .action(myCommandAction); // Register the action function
}
```

### Output Formatting

- **Use `OutputFormatter`:** All user-facing output (info, success, warnings, errors, tables, progress) should go through the central `OutputFormatter` service available on the `ExecutionContext`.
- **Structured Output:** Support `--output json` (and potentially `--output yaml`) for commands that produce structured data, allowing easy parsing by scripts. Ensure the JSON/YAML output is well-formed and contains the relevant data.
- **Readability:** Use colors (`chalk`) and formatting (tables, lists) appropriately via the `OutputFormatter` to enhance readability for human users in the default text mode.
- **Color Conventions:** Use standard conventions (e.g., green for success, yellow for warnings, red for errors). Ensure colors can be disabled via `NO_COLOR` environment variable (handled by `chalk` automatically if used correctly).
- **Progress:** Use spinners (`ora`) for indeterminate waits and progress bars (`cli-progress`) for operations with measurable progress (e.g., file transfers, batch processing). Access these via the `OutputFormatter`.
- **Consistency:** Strive for consistent output structure and messaging across similar commands.

Example output handling (within command action):
```typescript
// Using OutputFormatter from ExecutionContext
const { formatter } = context;

if (/* operation successful */) {
  formatter.success('Item created successfully.');
  // Output structured data respecting --output flag
  formatter.data({ id: 'item-123', name: 'New Item' });
} else {
  // Error handled by central catch block calling formatter.error()
  throw new Error('Failed to create item.');
}

// Example table output
const items = [{ id: '1', name: 'A' }, { id: '2', name: 'B' }];
formatter.table(items, [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }]);
```

### Error Handling

- **Use Custom Errors:** Throw specific `SwissKnifeError` subclasses (e.g., `StorageError`, `ModelError`, `ValidationError`) from services and command logic where appropriate, including relevant context and error codes.
- **Centralized Handling:** Let the main `CommandExecutor` catch errors from command actions.
- **Use `OutputFormatter.error()`:** The central error handler should call `formatter.error(error)` to ensure consistent, user-friendly display.
- **User-Friendly Messages:** The `formatter.error` method should translate error codes or types into messages understandable by users, suggesting potential causes or next steps.
- **Verbose Output:** Include stack traces and additional context (like `error.cause`, `error.context`) in the `formatter.error` output only when the `--verbose` flag is active.
- **Exit Codes:** Use distinct, non-zero exit codes for different error categories to aid scripting. Set `process.exitCode` rather than calling `process.exit()` directly to allow graceful shutdown.

Example error handling (centralized):
```typescript
// In CommandExecutor or main error handler
} catch (error) {
  context.formatter.error(error as Error); // formatter handles display logic
  process.exitCode = process.exitCode ?? 1; // Ensure non-zero exit code
}

// In OutputFormatter.error()
error(error: Error | string, defaultExitCode: number = 1): void {
  // ... (logic as shown in previous example) ...
  process.exitCode = process.exitCode && process.exitCode !== 0 ? process.exitCode : defaultExitCode;
}
```

## Performance Considerations

### General Performance Guidelines

- **Minimize Startup Time:** Avoid heavy synchronous operations or large `require`/`import` statements at the top level. Use dynamic `import()` and lazy initialization (see `cli_dev_environment.md`).
- **Use Streams:** Process large files or network responses using Node.js Streams to avoid loading everything into memory.
- **Efficient Algorithms:** Choose appropriate algorithms and data structures, especially for frequently executed code paths.
- **Asynchronous Operations:** Leverage non-blocking I/O (`async/await`) correctly. Use `Promise.all` for concurrent independent operations where appropriate.
- **Progress Reporting:** For operations longer than a few seconds, provide feedback using spinners or progress bars via the `OutputFormatter`.

### Performance Testing

- **Benchmarking:** Include benchmark tests (e.g., using `process.hrtime()` or libraries like `benny`) for critical operations as part of the test suite.
- **Profiling:** Use Node.js built-in profiler (`node --prof`) or Chrome DevTools for Node.js during development to identify CPU and memory bottlenecks.
- **Load Testing:** Test commands with large datasets or high concurrency (if applicable) to understand scaling behavior.
- **Baseline:** Establish performance baselines early and monitor for regressions in CI.

Example performance test:
```typescript
// Using Jest and a helper
import { executeTimedCommand } from '../helpers/cli-helper';
import { generateLargeFile } from '../helpers/data-helper';

describe('File Processing Performance', () => {
  const testFilePath = './large-test-file.tmp';
  const fileSizeMB = 100; // 100 MB

  beforeAll(async () => {
    await generateLargeFile(testFilePath, fileSizeMB * 1024 * 1024);
  });

  afterAll(async () => {
    await fs.promises.unlink(testFilePath);
  });

  it(`should process ${fileSizeMB}MB file within acceptable time`, async () => {
    const MAX_DURATION_MS = 10000; // 10 seconds
    const { exitCode, duration } = await executeTimedCommand(
      `process-file ${testFilePath}` // Assuming hypothetical command
    );

    expect(exitCode).toBe(0);
    console.log(`Processing ${fileSizeMB}MB took ${duration.toFixed(0)}ms`);
    expect(duration).toBeLessThan(MAX_DURATION_MS);
  });
});
```

### Resource Usage Guidelines

- **Streaming:** Prioritize streaming over buffering for large data.
- **Memory Leaks:** Use heap snapshots and memory profiling during development to identify and fix leaks.
- **Resource Release:** Ensure resources like file handles, network connections, or worker threads are properly closed or terminated when no longer needed (e.g., in `finally` blocks or using `using` declarations if available).
- **Configuration:** Consider adding configuration options for resource limits (e.g., cache size, max concurrent workers) if applicable.

## Security Guidelines

### Input Validation

- **Use Libraries:** Employ robust validation libraries like `zod` or validation features within the CLI framework (`commander`/`yargs`) to validate types, formats, ranges, and choices for all command arguments and options.
- **Sanitize Paths:** Never trust user-provided file paths directly. Normalize and resolve paths using `path.resolve` and ensure they are within expected boundaries to prevent path traversal vulnerabilities. Deny paths containing `..`.
- **Sanitize External Input:** Treat data read from files, network responses, or environment variables as potentially untrusted. Validate and sanitize before use, especially if used in shell commands or database queries.
- **Allowlisting:** Prefer validating against a list of allowed values/formats (allowlist) rather than trying to block known bad inputs (denylist).

### Secure Coding Practices

- **Dependency Audits:** Regularly run `pnpm audit` and address reported vulnerabilities, especially high/critical ones. Keep dependencies reasonably up-to-date.
- **Avoid Shell Execution:** Minimize direct execution of shell commands based on user input (`child_process.exec`). If necessary, use `child_process.spawn` with explicit arguments and avoid shell metacharacters. Sanitize all inputs passed to shell commands rigorously.
- **Secure Randomness:** Use Node.js `crypto.randomBytes` or `crypto.randomUUID` for generating cryptographically secure random numbers or IDs, not `Math.random()`.
- **Least Privilege:** Ensure processes and file operations run with the minimum necessary permissions. Avoid requiring root/administrator privileges unless absolutely essential.
- **Error Handling:** Do not leak sensitive information (e.g., full paths, API keys, internal system details) in error messages presented to the user. Log detailed errors internally.

### Credential Management

- **No Hardcoding:** Never commit API keys, passwords, or other secrets directly into the source code.
- **Secure Storage:** Use OS keychain integration (via `keytar`) as the preferred method for storing sensitive credentials.
- **Environment Variables:** Support providing credentials via environment variables as a common alternative (e.g., `OPENAI_API_KEY`). Document supported variables clearly.
- **Encrypted Files (Fallback):** If keychain is unavailable/undesirable, consider storing credentials in an encrypted file using strong encryption (e.g., AES-256-GCM) with a key derived from a user password via PBKDF2/scrypt. This adds complexity around password management.
- **Abstraction:** Use a `CredentialManager` service to abstract the specific storage mechanism.

## Accessibility Guidelines

### Terminal Accessibility

- **Semantic Output:** Ensure text output is clear and understandable without relying solely on color or complex formatting. Use standard streams (stdout, stderr) appropriately.
- **Color Contrast:** Use color combinations with sufficient contrast. Test with different terminal themes.
- **Color Disabling:** Respect the `NO_COLOR` environment variable (handled by libraries like `chalk`). Consider a `--no-color` flag.
- **Keyboard Navigation:** Ensure interactive prompts (`inquirer`) are navigable using standard keyboard controls.
- **Screen Reader Compatibility:** While challenging to fully test, favor standard text output and simple prompts over complex TUI layouts (`blessed`, complex `Ink` apps) which can be difficult for screen readers.

### Internationalization (i18n)

- **Externalize Strings:** Store all user-facing strings (messages, prompts, help text) in locale files (e.g., JSON) rather than hardcoding them. Use a library like `i18next` for loading and managing translations.
- **Locale Formatting:** Use locale-aware methods for formatting dates, times, and numbers (e.g., `Intl` object).
- **Design for Expansion:** UI elements and output formatting should accommodate potentially longer text in different languages.
- **Character Encoding:** Use UTF-8 consistently for all file I/O and network communication.

## Community Guidelines

### Communication Channels

- **GitHub Issues:** Primary channel for bug reports and specific feature requests.
- **GitHub Discussions:** For general questions, ideas, usage help, and broader discussions.
- **Pull Requests:** For submitting code and documentation contributions.
- **Project Documentation (`/docs`):** Authoritative source for user guides, developer info, and architecture.

### Issue Reporting

When reporting issues via GitHub Issues:
1. **Check Existing Issues:** Search first to see if the issue has already been reported.
2. **Use Template:** Fill out the provided Bug Report template completely.
3. **Clear Title:** Write a concise and descriptive title.
4. **Steps to Reproduce:** Provide clear, minimal steps to reliably reproduce the bug.
5. **Expected vs. Actual:** Clearly describe what should have happened and what actually happened.
6. **Environment Details:** Include OS, Node.js version, SwissKnife version, and any relevant configuration.
7. **Logs/Screenshots:** Attach relevant console output, error messages, or screenshots.

### Feature Requests

When requesting features via GitHub Issues:
1. **Check Existing Issues/Discussions:** Search first to see if the feature has been discussed.
2. **Use Template:** Fill out the provided Feature Request template.
3. **Problem Statement:** Clearly describe the problem or use case the feature would solve. Why is it needed?
4. **Proposed Solution (Optional):** Suggest how the feature might work or be implemented.
5. **Benefits:** Explain the advantages of adding this feature.
6. **Alternatives (Optional):** Mention any current workarounds or alternative solutions considered.

### Community Conduct

All contributors and participants are expected to:
1. **Follow the Code of Conduct:** Adhere strictly to the project's Code of Conduct.
2. **Be Respectful:** Treat everyone with respect, kindness, and empathy. Avoid personal attacks, harassment, and exclusionary behavior.
3. **Be Constructive:** Provide feedback constructively. Focus on the code and ideas, not the person. Explain the reasoning behind suggestions.
4. **Be Open:** Be open to different perspectives and solutions. Engage in discussions with a collaborative mindset.
5. **Support Others:** Help fellow contributors, especially newcomers, navigate the project and guidelines.

## Conclusion

Following these contribution guidelines helps maintain a high-quality, consistent, and maintainable codebase for the SwissKnife CLI. We appreciate your contributions and look forward to your involvement in the project.

For questions about these guidelines, please open an issue or start a discussion in the project repository.

</final_file_content>

IMPORTANT: For any future changes to this file, use the final_file_content shown above as your reference. This content reflects the current state of the file, including any auto-formatting (e.g., if you used single quotes but the formatter converted them to double quotes). Always base your SEARCH/REPLACE operations on this final version to ensure accuracy.<environment_details>
# VSCode Visible Files
docs/phase1/cli_contribution_guidelines.md

# VSCode Open Tabs
docs/phase3/graph_of_thought.md
docs/phase3/fibonacci_heap_scheduler.md
docs/phase3/merkle_clock_coordination.md
docs/phase3/task_decomposition_synthesis.md
docs/phase4/command_system.md
docs/phase4/ai_agent_commands.md
docs/phase4/ipfs_kit_commands.md
docs/phase4/task_system_commands.md
docs/phase4/cross_component_integration.md
docs/phase5/performance_optimization.md
docs/phase5/testing_documentation_ux.md
docs/phase5/release_preparation.md
docs/phase1/cli_integration_strategy.md
docs/phase1/component_inventory.md
docs/phase1/cli_architecture.md
docs/phase1/analysis/command_system_analysis.md
docs/phase1/analysis/model_system_analysis.md
docs/phase1/analysis/storage_system_analysis.md
docs/phase1/component_mapping.md
docs/phase1/api_specifications.md
docs/phase1/technical_challenges.md
docs/phase1/risk_assessment.md
docs/phase1/cli_test_strategy.md
docs/phase1/test_plan_template.md
docs/phase1/cli_integration_roadmap.md
docs/phase1/implementation_timeline.md
docs/phase1/cli_documentation_standards.md
docs/phase1/cli_dev_environment.md
docs/phase1/cli_contribution_guidelines.md

# Current Time
4/13/2025, 2:10:00 PM (America/Los_Angeles, UTC-7:00)

# Context Window Usage
600,013 / 1,000K tokens used (60%)

# Current Mode
ACT MODE
</environment_details>
