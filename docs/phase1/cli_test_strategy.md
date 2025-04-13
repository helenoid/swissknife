# CLI Test Strategy

This document outlines the comprehensive testing strategy for the SwissKnife CLI application, particularly focusing on validating components integrated during Phase 1 and ensuring overall quality. It defines the objectives, levels, approaches, tools, and processes for testing a complex, multi-component command-line tool.

## Testing Objectives

1. **Verify Functional Correctness**: Ensure all CLI commands, options, and underlying service integrations perform their specified functions accurately.
2. **Validate Usability & UX**: Confirm that the CLI interface is intuitive, consistent, provides clear feedback (help text, error messages, progress indicators), and is easy to use for target users.
3. **Ensure Performance & Scalability**: Validate that CLI operations (startup, command execution, data processing) meet defined performance targets and handle varying loads gracefully.
4. **Verify Cross-Platform Compatibility**: Ensure the CLI installs and functions correctly across all supported operating systems (Linux, macOS, Windows) and architectures.
5. **Validate Resilience & Error Handling**: Ensure the CLI handles invalid inputs, unexpected errors (network, filesystem, API), edge cases, and interruptions gracefully, providing informative error messages.
6. **Confirm Integration Success**: Verify that components integrated from different sources work together seamlessly within the CLI architecture.

## Test Levels

### 1. Unit Testing

**Focus**: Testing individual TypeScript modules, classes, or functions in isolation from their dependencies.

**Scope**:
- Core logic within command handlers (parsing args, calling services - with services mocked).
- Individual service methods (e.g., `ModelSelector` logic, `PathResolver` normalization - with dependencies mocked).
- Utility functions (e.g., token counting, path manipulation).
- Configuration loading and parsing logic.
- Individual TUI components (if using Ink/React, using appropriate testing libraries).

**Techniques**:
- **Mocking/Stubbing:** Use frameworks like Jest's built-in mocking or Sinon.js to replace dependencies (other services, filesystem, network calls) with controlled test doubles.
- **Interface Contract Validation:** Ensure functions adhere to their defined TypeScript interfaces regarding inputs and outputs.
- **Error Path Testing:** Verify correct error handling and propagation for expected failure conditions.
- **Boundary Value Analysis:** Test edge cases for inputs (e.g., empty strings, zero values, large numbers, special characters).
- **Logic Coverage:** Aim for high statement, branch, and function coverage within the unit.

**Tools**:
- **Test Runner/Framework:** Jest (preferred for its integrated mocking, assertions, and coverage) or Mocha.
- **Assertion Library:** Chai (if using Mocha) or Jest's built-in `expect`.
- **Mocking/Spying Library:** Sinon.js (if using Mocha) or Jest's built-in mocking features.

**Coverage Goal**: Aim for >80% code coverage (line/statement) for critical business logic and utility components. Focus on testing logic, not just simple getters/setters.

### 2. Integration Testing

**Focus**: Testing the interaction and communication between two or more integrated components within the SwissKnife application, ensuring they work together correctly.

**Scope**:
- **Service-to-Service:** Verify interactions between core services (e.g., Agent service calling Model service, Task service using Storage service).
- **Command-to-Service:** Test the flow from a command handler invoking a service method and correctly handling the response or error.
- **Configuration Impact:** Verify that changes in configuration correctly affect the behavior of relevant components.
- **Task/Worker Integration:** Test task submission to the scheduler/worker pool and result retrieval (initially local workers).
- **External API Integration:** Test interactions with actual external services (like OpenAI API, Anthropic API, IPFS Kit MCP Server API) using dedicated test accounts/endpoints or carefully controlled live interactions. Use mocks for external APIs only when necessary or for specific error condition testing.

**Techniques**:
- **Test Setup:** Initialize multiple real components needed for the interaction (e.g., instantiate `CommandRegistry`, `CommandExecutor`, `AgentService`, `MockModelProvider`).
- **Dependency Injection:** Use the application's dependency injection mechanism (e.g., via `ExecutionContext`) to provide real or mocked dependencies as needed for the test scope.
- **Contract Testing:** Verify that components adhere to the defined TypeScript interfaces when interacting.
- **Data Flow Validation:** Ensure data passed between components is correctly formatted and processed.
- **Error Propagation:** Test how errors are handled and propagated across component boundaries.

**Tools**:
- **Test Runner/Framework:** Jest or Mocha.
- **HTTP Request Libraries:** `axios` or `node-fetch` for testing API integrations if not using a dedicated client library.
- **Mock Servers (Optional):** Tools like `nock` or `msw` can mock external HTTP APIs for controlled testing of network interactions.
- **Test Databases/Storage:** Use temporary databases (e.g., in-memory SQLite) or temporary directories for testing storage interactions.

**Coverage Goal**: Focus on testing the contracts and primary interaction points between all major internal services and key external integrations (like IPFS Kit Client).

### 3. Command-Line Interface (CLI) Testing / End-to-End (E2E) Testing

**Focus**: Testing the application from the user's perspective by executing the compiled CLI binary (`swissknife`) as a separate process and validating its behavior based on arguments, stdin, stdout, stderr, and exit codes.

**Scope**:
- **Command Execution:** Running actual `swissknife <command> [options]` commands.
- **Argument/Option Parsing:** Verifying correct parsing of various argument combinations.
- **Help & Usage Messages:** Validating the output of `--help` flags.
- **Standard Output (stdout):** Asserting on expected text, JSON, YAML, or tabular output.
- **Standard Error (stderr):** Asserting on expected error messages and formatting.
- **Exit Codes:** Verifying correct exit codes for success (0) and different failure modes (>0).
- **Interactive Prompts:** Testing workflows involving user prompts (requires specialized test harnesses).
- **File I/O:** Verifying commands that read from or write to the filesystem.
- **Environment Variables:** Testing the effect of environment variables on CLI behavior.

**Techniques**:
- **Process Execution:** Use Node.js `child_process.exec` or `child_process.spawn` to run the `swissknife` command.
- **Output Assertion:** Capture and assert on the content of stdout and stderr streams.
- **Exit Code Assertion:** Check the process exit code.
- **Filesystem Assertions:** Check for the creation, modification, or deletion of files by commands.
- **Input Simulation:** Pipe input to stdin for commands that read from it. Simulate interactive prompts using libraries designed for testing interactive CLIs (e.g., `node-pty` or custom solutions).

**Tools**:
- **Test Runner/Framework:** Jest or Mocha.
- **Node.js `child_process`:** For executing the CLI.
- **Assertion Libraries:** Chai, Jest's `expect`.
- **Interactive CLI Testing Libraries (Advanced):** `node-pty` (for pseudo-terminal interaction).
- **Shell Scripting (Alternative):** Simple E2E tests can sometimes be written using shell scripts and standard assertion tools (`grep`, `diff`).

**Coverage Goal**: Test the primary success and failure paths for all user-facing commands and their most important option combinations. Cover key end-to-end user workflows.

### 4. System Testing (Includes Performance, Cross-Platform)

**Focus**: Testing the complete CLI application as a whole in realistic or simulated environments, focusing on non-functional requirements like performance, reliability, and compatibility.

**Scope**:
- **End-to-End User Workflows:** Testing complex sequences of commands representing realistic user tasks.
- **Performance & Load:** Measuring command execution time, startup time, memory usage, and CPU load under varying conditions (e.g., large input files, many concurrent operations if applicable).
- **Resource Utilization:** Monitoring filesystem usage (cache, local models), network bandwidth.
- **Cross-Platform Behavior:** Executing key test suites (especially E2E) on all target OS (Linux, macOS, Windows) and architectures (x64, ARM64).
- **Installation & Upgrade:** Testing the packaging and installation process (`install.sh`, binaries, installers) on clean environments. Testing upgrade scenarios if an update mechanism is implemented.
- **Reliability & Stability:** Long-running tests or stress tests to identify memory leaks or stability issues over time (more relevant if background services are used).

**Techniques**:
- **Scenario-Based Testing:** Define realistic user scenarios and execute them via E2E tests or manual testing.
- **Performance Benchmarking:** Use tools like `hyperfine` or custom scripts with `process.hrtime()` integrated into CI to track performance metrics over time.
- **Resource Monitoring:** Use OS-level tools (`top`, `htop`, Task Manager, `ps`) or Node.js `process.memoryUsage()` during specific test runs.
- **Cross-Platform Execution:** Utilize CI/CD matrix builds (e.g., GitHub Actions matrix strategy) to run tests across different OS images.
- **Installation Testing:** Scripted or manual testing of the installation process on clean virtual machines or containers for each platform.

**Tools**:
- **CI/CD Platforms:** GitHub Actions, GitLab CI, Jenkins.
- **Benchmarking Tools:** `hyperfine`, custom scripts.
- **System Monitoring Tools:** OS-specific tools, potentially Node.js process monitoring libraries.
- **Virtualization/Containerization:** Docker, VMs (VirtualBox, VMWare) for creating clean test environments.

**Coverage Goal**: Ensure key user workflows are validated on all target platforms and performance meets defined targets. Validate the installation process.

## CLI-Specific Testing Approaches

### Command Execution Testing

**Purpose**: Verify the fundamental behavior of a command: does it run, produce the expected output/error, and exit with the correct status code given specific inputs? This is often done at the E2E level.

**Methodology**:
1. **Arrange:** Prepare any necessary preconditions (e.g., create input files, set environment variables, configure mock servers).
2. **Act:** Execute the CLI command as a separate process using `child_process.spawn` or `child_process.exec`. Capture `stdout`, `stderr`, and the `exitCode`.
3. **Assert:**
    - Check the `exitCode` (0 for success, non-zero for expected errors).
    - Assert that `stdout` contains expected output patterns (using string matching, regex, or parsing structured output like JSON).
    - Assert that `stderr` contains expected error messages (for failure cases) or is empty (for success cases).
    - Check for expected side effects (e.g., file creation/modification).
4. **Cleanup:** Remove any temporary files or revert state changes made during the test.

**Example Test Case (using a helper function `executeCommand`)**:

```typescript
// Assumes executeCommand helper exists (see Test Helpers section)
describe('sample command E2E', () => {
  it('should execute successfully with valid input', async () => {
    // Arrange: (e.g., ensure config is set)
    await executeCommand('swissknife config set api.key testkey');

    // Act: Run the command
    const { stdout, stderr, exitCode } = await executeCommand(
      'swissknife sample --input test --verbose'
    );

    // Assert:
    expect(exitCode).toBe(0); // Success exit code
    expect(stdout).toContain('Processing input: test');
    expect(stdout).toContain('Verbose mode enabled');
    expect(stderr).toBe(''); // No errors expected on stderr
  });

  it('should return error with invalid input', async () => {
    // Act: Run command expected to fail
    const { stdout, stderr, exitCode } = await executeCommand(
      'swissknife sample --input ""' // Assuming empty input is invalid
    );

    // Assert:
    expect(exitCode).toBeGreaterThan(0); // Non-zero exit code for failure
    expect(stderr).toContain('Error: Input cannot be empty'); // Check stderr for error message
    expect(stdout).toBe(''); // No output expected on stdout for this error
  });
});
```
    
    expect(exitCode).to.equal(0);
    expect(stdout).to.include('Processing test input');
    expect(stderr).to.be.empty;
  });
  
  it('should return error with invalid input', async () => {
    const { stdout, stderr, exitCode } = await executeCommand(
      'swissknife sample --input ""'
    );
    
    expect(exitCode).to.equal(1);
    expect(stderr).to.include('Input cannot be empty');
  });
});
```

### Option Parsing Testing

**Purpose**: Ensure the CLI framework (`yargs`, `commander`) correctly parses different option syntaxes, applies defaults, validates types, and handles required/optional flags as defined in the `Command` interface. Often tested at the E2E level.

**Methodology**:
1. **Syntax Variations:** Test different ways of specifying options:
    - Long form: `--verbose`, `--count 5`, `--count=5`
    - Short aliases: `-v`, `-c 5` (if defined)
    - Boolean flags: `--verbose`, `--no-verbose`
    - Array options: `--item a --item b` or `--item a,b`
2. **Default Values:** Execute the command without providing an option that has a default value and verify the default is used.
3. **Type Validation:** Provide options with incorrect types (e.g., text for a number option) and verify the CLI exits with an appropriate validation error.
4. **Required Options:** Execute the command without a required option and verify it exits with an error indicating the missing option.
5. **Invalid Options:** Provide an option not defined for the command and verify it exits with an "unknown option" error.
6. **Positional Arguments:** Test parsing and validation of required/optional positional arguments.

**Example Test Case (E2E)**:

```typescript
describe('sample command option parsing E2E', () => {
  it('should accept long form options', async () => {
    // Act
    const { stdout, exitCode } = await executeCommand(
      'swissknife sample --input test --verbose --count 5'
    );

    // Assert
    
    expect(exitCode).toBe(0);
    // Check if the command handler received the correct parsed values
    // (This might require inspecting logs or specific output designed for testing)
    // Or, if output reflects options:
    expect(stdout).toContain('Executing with verbose=true, count=5');
  });

  it('should accept short form options', async () => {
    // Act
    const { stdout, exitCode } = await executeCommand(
      'swissknife sample --input test -v -c 5'
    );

    // Assert
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Executing with verbose=true, count=5');
  });

  it('should use default values when options omitted', async () => {
    // Act
    const { stdout, exitCode } = await executeCommand(
      'swissknife sample --input test' // Assuming --verbose defaults false, --count defaults 1
    );

    // Assert
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Executing with verbose=false, count=1');
  });

  it('should error on missing required option', async () => {
      // Act (assuming --input is required)
      const { stderr, exitCode } = await executeCommand('swissknife sample');

      // Assert
      expect(exitCode).toBeGreaterThan(0);
      expect(stderr).toMatch(/Missing required argument: input/i);
  });

   it('should error on invalid option type', async () => {
      // Act (assuming --count expects a number)
      const { stderr, exitCode } = await executeCommand('swissknife sample --input test --count=abc');

      // Assert
      expect(exitCode).toBeGreaterThan(0);
      expect(stderr).toMatch(/Invalid argument: count must be a number/i);
  });
});
```

### Output Format Testing

**Purpose**: Verify that the `OutputFormatter` service and commands using it produce correctly structured, readable, and styled output for different scenarios (text, tables, JSON, YAML, errors, progress).

**Methodology**:
1. **Standard Output:** Execute commands and assert that `stdout` matches expected text, including formatting (e.g., table structure, colors via ANSI codes if not disabled).
2. **Structured Output:** Execute commands with `--output json` or `--output yaml` flags and validate that `stdout` contains correctly formatted and valid JSON/YAML representing the expected data.
3. **Error Output:** Trigger known errors and assert that `stderr` contains the expected user-friendly error message and that `stdout` is empty. Check verbose mode (`--verbose`) includes stack traces on `stderr`.
4. **Progress Indicators:** For commands involving long operations, test that spinners or progress bars are displayed correctly (this might require more advanced E2E testing with pseudo-terminals or visual inspection).
5. **Consistency:** Compare the output format of similar information across different commands (e.g., listing resources).

**Example Test Case (E2E)**:

```typescript
describe('output formatting E2E', () => {
  // Assume 'swissknife list-items' outputs a list of objects
  const command = 'swissknife list-items';

  it('should format table output correctly by default', async () => {
    // Act
    const { stdout, exitCode } = await executeCommand(command);

    // Assert
    expect(exitCode).toBe(0);
    // Use regex for flexible matching of table structure
    expect(stdout).toMatch(/ID\s+Name\s+Status/); // Check headers
    expect(stdout).toMatch(/item-\d+\s+Item \d+\s+Active/); // Check row content pattern
    // Check for presence of colors (ANSI codes) unless NO_COLOR is set
    if (!process.env.NO_COLOR) {
        expect(stdout).toContain('\u001b['); // Basic check for ANSI codes
    }
  });

  it('should format JSON output correctly with --output json', async () => {
    // Act
    const { stdout, exitCode } = await executeCommand(`${command} --output json`);

    // Assert
    expect(exitCode).toBe(0);
    let jsonData;
    try {
      jsonData = JSON.parse(stdout);
    } catch (e) {
      throw new Error(`Failed to parse JSON output: ${e.message}\nOutput:\n${stdout}`);
    }
    expect(jsonData).toBeInstanceOf(Array);
    expect(jsonData.length).toBeGreaterThan(0);
    expect(jsonData[0]).toHaveProperty('id');
    expect(jsonData[0]).toHaveProperty('name');
    expect(jsonData[0]).toHaveProperty('status');
  });

  // Add similar test for --output yaml if implemented
});
```

### Error Handling Testing

**Purpose**: Ensure that when errors occur (invalid user input, service failures, network issues, file system errors), the CLI exits with a non-zero status code and prints a clear, informative error message to `stderr`.

**Methodology**:
1. **Input Validation Errors:** Provide invalid arguments/options (wrong type, missing required, invalid choice) and verify specific error messages and non-zero exit codes.
2. **Runtime Errors:** Mock service dependencies to throw specific errors (e.g., `NetworkError`, `AuthenticationError`, `FileNotFoundError` from storage) and verify the CLI catches them, prints a user-friendly message to `stderr`, and exits appropriately.
3. **Edge Cases:** Test edge cases like empty files, zero values, timeouts, etc.
4. **Error Message Clarity:** Manually review error messages for clarity, accuracy, and helpfulness (e.g., suggesting possible causes or solutions).
5. **Exit Codes:** Verify that different error categories map to distinct, documented exit codes if needed for scripting.
6. **Verbose Mode:** Check that running with `--verbose` provides additional details (like stack traces) on `stderr` without affecting `stdout`.

**Example Test Case (E2E)**:

```typescript
describe('error handling E2E', () => {
  it('should handle file not found gracefully', async () => {
    // Act: Try to process a non-existent file
    const { stdout, stderr, exitCode } = await executeCommand(
      'swissknife storage read /nonexistent/file.txt' // Assuming 'storage read' command
    );

    // Assert
    expect(exitCode).toBeGreaterThan(0); // Expect failure
    expect(stderr).toMatch(/Error: File not found/i); // Check for specific error type/message
    expect(stderr).toContain('/nonexistent/file.txt'); // Check context is included
    // Optionally check for suggestions:
    // expect(stderr).toContain('Please check the path and ensure the file exists.');
    expect(stdout).toBe(''); // No standard output expected on error
  });

  it('should handle API key error', async () => {
      // Arrange: Ensure API key is invalid or missing
      await executeCommand('swissknife config set api.openai.key invalid-key');

      // Act: Try to use a command requiring the API key
      const { stdout, stderr, exitCode } = await executeCommand(
          'swissknife agent execute "Test prompt"'
      );

      // Assert
      expect(exitCode).toBeGreaterThan(0);
      expect(stderr).toMatch(/Error: Invalid API Key/i); // Or similar specific error
      expect(stderr).toContain('Please check your OpenAI API key configuration using `swissknife config get api.openai.key`');
      expect(stdout).toBe('');
  });
});
```

### Interactive Input Testing

**Purpose**: Validate commands that use interactive prompts (e.g., confirmations, selections) behave correctly based on simulated user input. This requires more advanced testing techniques.

**Methodology**:
1. **Identify Interactive Commands:** List commands using libraries like `inquirer`.
2. **Simulate Input:** Use tools that allow interaction with a child process's stdio streams or pseudo-terminals (`node-pty`). Send simulated keystrokes (e.g., 'y', 'n', arrow keys, Enter) in response to expected prompts.
3. **Validate Output & State:** Assert that the command's output reflects the simulated input and that the expected action was taken (or not taken).
4. **Test Input Validation:** Provide invalid input to prompts and verify error handling/re-prompting.
5. **Test Defaults:** Test accepting default prompt values by sending only 'Enter'.
6. **Test Interruption:** Attempt to simulate Ctrl+C during a prompt (difficult, may require `node-pty`).

**Example Test Case (Conceptual - using a hypothetical `executeInteractive` helper)**:

```typescript
// Assumes executeInteractive helper using e.g., node-pty
describe('interactive delete command E2E', () => {
  beforeEach(() => {
    // Setup: Ensure an item exists to delete
    createTestItem('item-123');
  });

  it('should delete item after user confirms with "y"', async () => {
    const interactions = [
      { prompt: /Are you sure.*delete 'item-123'/, input: 'y\n' } // Respond 'y' + Enter
    ];
    const { stdout, exitCode } = await executeInteractive(
      'swissknife delete item-123 --interactive',
      interactions
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Item 'item-123' deleted successfully.");
    // Assert: Verify item is actually deleted
    expect(itemExists('item-123')).toBe(false);
  });

  it('should cancel deletion if user confirms with "n"', async () => {
     const interactions = [
      { prompt: /Are you sure.*delete 'item-123'/, input: 'n\n' } // Respond 'n' + Enter
    ];
    const { stdout, exitCode } = await executeInteractive(
      'swissknife delete item-123 --interactive',
      interactions
    );

    expect(exitCode).toBe(0); // Command likely exits successfully after cancellation
    expect(stdout).toContain('Operation cancelled.');
    // Assert: Verify item still exists
    expect(itemExists('item-123')).toBe(true);
  });
});
```
*Note: Implementing `executeInteractive` is non-trivial.*

### Cross-Platform Testing

**Purpose**: Verify that the CLI installs, runs, and behaves consistently across the target operating systems (Linux, macOS x64/ARM64, Windows x64).

**Methodology**:
1. **CI Matrix:** Configure the CI/CD pipeline (e.g., GitHub Actions) to run the full test suite (unit, integration, E2E) on virtual machines or containers for each target platform.
2. **Platform-Specific E2E Tests:** Write specific E2E tests that target known platform differences, such as:
    - File path manipulation (using `path.join`, creating paths with spaces or special characters).
    - Execution of external commands (if any).
    - Interaction with OS-specific features (like keychain via `keytar`).
    - Installation script (`install.sh`) behavior.
3. **Manual Testing:** Perform targeted manual testing on each platform for features difficult to automate (e.g., complex TUI interactions, specific terminal emulator compatibility).
4. **Installation Testing:** Test the installation process (binary download, `install.sh`, platform-specific installers) on clean environments for each OS.

**Test Matrix Example (Focus Areas)**:

| Feature Area | Linux | macOS (x64/ARM) | Windows | Notes |
|--------------|-------|-----------------|---------|-------|
| Core Commands | ✓ | ✓ | ✓ | Basic functionality |
| Filesystem Ops | ✓ | ✓ | ✓ | Path separators, permissions |
| Native Modules | ✓ | ✓ | ✓ | Installation, loading (e.g., ONNX, keytar) |
| TUI Rendering | ✓ | ✓ | ✓ | Colors, spinners, tables (test different terminals) |
| Installation | ✓ | ✓ | ✓ | Script, binary placement, PATH |
| Shell Completion | ✓ | ✓ | ✓ | Bash, Zsh, Fish, PowerShell |

**Example Test Case (Conceptual - Platform Check within Test)**:

```typescript
import path from 'path';
import os from 'os';

describe('cross-platform path handling E2E', () => {
  const testDir = 'temp Test Dir';
  const testFile = 'file name with spaces.txt';
  const fullDirPath = path.join(os.tmpdir(), testDir); // Use OS-specific join
  const fullFilePath = path.join(fullDirPath, testFile);

  beforeAll(async () => {
    // Create test directory and file using OS-specific paths
    await fs.mkdir(fullDirPath, { recursive: true });
    await fs.writeFile(fullFilePath, 'test content');
  });

  afterAll(async () => {
    await fs.rm(fullDirPath, { recursive: true, force: true });
  });

  it('should list file with spaces using virtual path', async () => {
    // Use POSIX-style virtual path for the command argument
    const virtualDirPath = `/local-test/${testDir}`; // Assuming /local-test is mounted to tmpdir
    await executeCommand(`swissknife storage mount /local-test filesystem --path ${os.tmpdir()}`);

    const { stdout, exitCode } = await executeCommand(
      `swissknife file list "${virtualDirPath}"` // Quote path for shell
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain(testFile);

    await executeCommand(`swissknife storage unmount /local-test`);
  });
});
```

## Performance Testing

### Command Performance Benchmarking

**Purpose**: Measure and validate the performance (speed, resource usage) of critical CLI operations against defined targets or previous baselines.

**Methodology**:
1. **Identify Critical Operations:** Select key commands or workflows where performance is important (e.g., startup, `agent execute`, `ipfs add` large file, `task create` complex).
2. **Define Metrics & Targets:** Specify metrics (e.g., wall-clock time, peak memory usage, CPU %) and acceptable targets or thresholds for regression.
3. **Measure Execution Time:** Use `process.hrtime()` or benchmarking tools (`hyperfine`) to accurately measure command execution time under controlled conditions. Run multiple iterations to get stable averages.
4. **Monitor Resources:** Use OS tools or libraries like `pidusage` to monitor CPU and memory consumption during test execution.
5. **Vary Inputs:** Test performance with different input sizes (small, medium, large files/prompts) to understand scaling characteristics.
6. **Track Over Time:** Integrate benchmark tests into CI to track performance trends and detect regressions automatically.

**Metrics to Measure**:
- **Startup Time:** Time from invoking `swissknife` to readiness for parsing arguments.
- **Command Execution Time:** Wall-clock time from command invocation to exit.
- **Peak Memory Usage:** Maximum resident set size (RSS) during command execution.
- **CPU Utilization:** Average or peak CPU percentage during execution.
- **Disk I/O:** Bytes read/written (if relevant and measurable).
- **Network I/O:** Bytes sent/received (if relevant and measurable).

**Example Test Case (using a timed helper)**:

```typescript
// Assumes executeTimedCommand helper exists
describe('performance benchmarking', () => {
  const LARGE_FILE = 'large-test-file.bin'; // Assume this file exists
  const MAX_DURATION_MS = 5000; // 5 seconds

  it(`ipfs add large file should complete within ${MAX_DURATION_MS}ms`, async () => {
    // Act
    const { exitCode, duration } = await executeTimedCommand(
      `swissknife ipfs add ${LARGE_FILE}`
    );

    // Assert
    expect(exitCode).toBe(0);
    console.log(`ipfs add duration: ${duration.toFixed(2)} ms`);
    expect(duration).toBeLessThan(MAX_DURATION_MS);

    // TODO: Add assertions for memory/CPU usage if monitoring is implemented
  });

  // Add benchmarks for other critical commands...
});
```

### Scalability Testing

**Purpose**: Understand how the CLI's performance and resource usage change as input size, data volume, or concurrent requests (if applicable) increase.

**Methodology**:
1. **Vary Input Size:** Run performance benchmarks with systematically increasing input data sizes (e.g., file sizes for `ipfs add`, prompt lengths for `agent execute`, number of items for `task list`).
2. **Measure Scaling:** Plot execution time and resource usage against input size. Analyze if scaling is linear, sub-linear, logarithmic, or worse (e.g., quadratic, exponential).
3. **Identify Bottlenecks:** Determine which parts of the system become bottlenecks under load (e.g., CPU-bound computation, I/O limitations, network latency). Use profiling tools during load tests.
4. **Concurrency Testing (If Applicable):** If the CLI supports concurrent operations (e.g., via background services or parallel task execution), test how performance degrades as concurrency increases.

**Example Test Case (Conceptual - focusing on time scaling)**:

```typescript
describe('scalability testing - file processing time', () => {
  const testSizesKB = [1, 10, 100, 1000, 10000]; // 1KB to 10MB
  const results: { sizeKB: number; durationMs: number }[] = [];

  beforeAll(() => {
    // Generate test files for all sizes
    testSizesKB.forEach(size => generateTestFile(`test-${size}KB.dat`, size * 1024));
  });

  afterAll(() => {
    // Cleanup test files
    testSizesKB.forEach(size => fs.unlinkSync(`test-${size}KB.dat`));
    // Log results for analysis
    console.table(results);
    // TODO: Add assertions about scaling factor (e.g., expect roughly linear scaling)
  });

  test.each(testSizesKB)('should process %sKB input', async (sizeKB) => {
    const filename = `test-${sizeKB}KB.dat`;
    const { exitCode, duration } = await executeTimedCommand(
      `swissknife process --file ${filename}` // Assuming 'process' command
    );
    expect(exitCode).toBe(0);
    results.push({ sizeKB, durationMs: duration });
  });
});
```

## Test Environment Setup

### Local Test Environment

**Components**:
- Local Node.js installation
- Test data generators
- Mock services for external dependencies
- Test configuration profiles
- Terminal emulator for CLI interaction

**Setup Process**:
1. Install test dependencies
2. Generate test data sets
3. Configure mock services
4. Set up test configuration profiles
5. Initialize test database/storage if needed

### CI/CD Test Environment

**Components**:
- Automated test runners (GitHub Actions, Jenkins, etc.)
- Cross-platform test matrix
- Test coverage reporting
- Performance metrics collection
- Artifact storage for test results

**Pipeline Configuration**:
1. Trigger tests on pull request and merge
2. Run unit and integration tests on all platforms
3. Generate and publish test coverage reports
4. Perform performance benchmarking on select platforms
5. Archive test results and logs

## Test Data Management

### Test Data Generation

**Approach**:
- **Programmatic Generation:** Generate synthetic test data (text files, JSON, images, etc.) on-the-fly during test setup using helper functions. This allows easy scaling and customization.
- **Realistic Data:** Where possible, use data samples that resemble real user data in structure and complexity.
- **Edge Cases:** Include empty files, very large files, files with special characters, malformed JSON/YAML, etc.
- **Fixtures:** For small, static data sets (e.g., sample configuration snippets, expected JSON outputs), store them as fixture files (e.g., in a `test/fixtures` directory) under version control.
- **Data Cleaning:** Ensure test cleanup routines reliably remove generated test data.

**Example Generator Helper**:

```typescript
import fs from 'fs/promises';
import crypto from 'crypto';

/** Generates a test file with pseudo-random content. */
async function generateRandomFile(filePath: string, sizeBytes: number): Promise<void> {
  const buffer = crypto.randomBytes(sizeBytes);
  await fs.writeFile(filePath, buffer);
}

/** Generates a JSON file. */
async function generateJsonFile(filePath: string, data: any): Promise<void> {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}
```

### Test Fixtures

**Types**:
- Command test fixtures
- Configuration fixtures
- Input data fixtures
- Expected output fixtures
- Mock service responses

**Management Approach**:
- Store small fixtures in version control
- Generate larger fixtures during test setup
- Use fixture factories for parameterized test data
- Cleanup fixtures after tests complete

## Test Case Development

### Test Case Template

```typescript
/**
 * Test case for [command/feature]
 * 
 * Purpose: [What this test verifies]
 * 
 * Preconditions:
 * - [Condition 1]
 * - [Condition 2]
 * 
 * Steps:
 * 1. [Step 1]
 * 2. [Step 2]
 * 3. [Step 3]
 * 
 * Expected Outcome:
 * - [Expected result 1]
 * - [Expected result 2]
 */
it('should [expected behavior]', async () => {
  // Arrange
  // ...

  // Act
  // ...

  // Assert
  // ...
});
```

### Test Case Prioritization

Prioritize test cases based on:

1. **Critical Path**: Core functionality that must work
2. **Risk Areas**: Features with high complexity or many dependencies
3. **Frequently Used**: Commands and features used most often
4. **Recent Changes**: Areas with recent modifications
5. **Previous Issues**: Areas with history of defects

## Test Automation

### Automated Test Suite

**Components**:
- Unit test suite
- Integration test suite
- CLI command test suite
- Performance test suite
- Cross-platform test suite

**Execution Approach**:
- Fast unit tests run on every build
- Integration tests run on pull request
- Performance tests run nightly
- Full cross-platform tests run weekly and before releases

### Test Helpers and Utilities

**Command Execution Helper (Improved)**:

```typescript
import { exec, ExecOptions } from 'child_process';

/**
 * Executes a CLI command as a child process and captures its output.
 * Uses exec, suitable for commands expected to finish relatively quickly.
 * For long-running commands or streaming output, consider using spawn.
 */
async function executeCommand(
    command: string,
    options: ExecOptions = {}
): Promise<{ stdout: string; stderr: string; exitCode: number; error?: Error }> {
    // Ensure the actual CLI entry point is used (e.g., 'node dist/cli.js')
    const fullCommand = `node ${require.resolve('../../dist/cli.js')} ${command}`;

    return new Promise((resolve) => {
        exec(fullCommand, { ...options, encoding: 'utf-8' }, (error, stdout, stderr) => {
            resolve({
                stdout: stdout.toString(),
                stderr: stderr.toString(),
                exitCode: error?.code ?? 0,
                error: error || undefined,
            });
        });
    });
}

/**
 * Executes a command and simulates interactive stdin input.
 * NOTE: This is a simplified example; robust interactive testing often requires pseudo-terminals (e.g., node-pty).
 */
async function executeCommandWithInput(
    command: string,
    inputs: string[], // Array of strings to send, separated by newline
    options: ExecOptions = {}
): Promise<{ stdout: string; stderr: string; exitCode: number; error?: Error }> {
    const fullCommand = `node ${require.resolve('../../dist/cli.js')} ${command}`;

    return new Promise((resolve) => {
        const child = exec(fullCommand, { ...options, encoding: 'utf-8' }, (error, stdout, stderr) => {
             resolve({
                stdout: stdout.toString(),
                stderr: stderr.toString(),
                exitCode: error?.code ?? 0,
                error: error || undefined,
            });
        });

        if (child.stdin) {
            child.stdin.write(inputs.join('\n') + '\n');
            child.stdin.end();
        } else {
             console.warn("Child process stdin is not available for input simulation.");
        }
    });
}

/**
 * Executes a command and measures its execution duration.
 */
async function executeTimedCommand(
    command: string,
    options: ExecOptions = {}
): Promise<{ stdout: string; stderr: string; exitCode: number; duration: number; error?: Error }> {
    const start = process.hrtime.bigint();
    const result = await executeCommand(command, options);
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6; // Convert nanoseconds to milliseconds

    return {
        ...result,
        duration: durationMs,
    };
}
```

## Mocking Strategy

### External Dependencies

**Approach**:
- **Filesystem:** Use libraries like `memfs` or `mock-fs` to create an in-memory filesystem, isolating tests from the actual disk and allowing controlled setup/assertions.
- **HTTP APIs:** Use libraries like `nock` or `msw` (Mock Service Worker, can work in Node.js) to intercept outgoing HTTP requests (e.g., to OpenAI, IPFS Kit Server) and return predefined mock responses. This allows testing API client logic and error handling without actual network calls.
- **Time:** Use Jest's timer mocks or libraries like `sinon` to manipulate `setTimeout`, `setInterval`, and `Date` for testing time-dependent logic or timeouts.
- **System Resources:** Mocking CPU/memory is difficult. Focus on testing logic that *uses* information about resources (which can be mocked) rather than mocking the resources themselves.

**Example Filesystem Mock (using `memfs`)**:

```typescript
import { vol, fs } from 'memfs';

// Before tests or specific describe block:
beforeEach(() => {
  // Reset the virtual filesystem before each test
  vol.reset();
  // Optionally populate with initial files/directories
  vol.fromJSON({
    '/home/user/.config/swissknife/config.json': '{}',
    '/data/input.txt': 'Initial content',
  }, '/');
});

// Example test using the mocked fs:
it('should read from the virtual filesystem', async () => {
  // Use the imported 'fs' which now points to memfs
  const content = await fs.promises.readFile('/data/input.txt', 'utf8');
  expect(content).toBe('Initial content');
});

it('should write to the virtual filesystem', async () => {
  await fs.promises.writeFile('/data/output.txt', 'New data');
  const exists = await fs.promises.stat('/data/output.txt').then(() => true).catch(() => false);
  expect(exists).toBe(true);
});
```

### Service Mocking

**Approach**:
- **Jest Mocks:** Use `jest.fn()` or `jest.spyOn()` to mock specific methods of service classes or entire modules. Configure mock implementations or return values.
- **Manual Mocks:** Create mock classes that implement the service interface (e.g., `MockModelProvider implements ModelProvider`) with simplified logic or configurable responses/errors.
- **Dependency Injection:** Inject mock service instances into the components under test (e.g., pass a `MockModelProvider` to `ModelExecutor` constructor in tests).

**Example Service Mock (using Jest)**:

```typescript
// Assume AgentService depends on ModelService
import { AgentService } from '../src/agent/agent.service';
import { ModelService } from '../src/models/model.service';

// Mock the ModelService module
jest.mock('../src/models/model.service');

// Create a typed mock instance
const MockedModelService = ModelService as jest.MockedClass<typeof ModelService>;

describe('AgentService', () => {
  let agentService: AgentService;
  let modelServiceMock: jest.Mocked<ModelService>;

  beforeEach(() => {
    // Reset mocks and create instances before each test
    MockedModelService.mockClear();
    // You might need to mock the constructor or provide mock methods
    modelServiceMock = new MockedModelService() as jest.Mocked<ModelService>;
    // Mock specific methods
    modelServiceMock.generateCompletion = jest.fn();

    // Inject the mock service
    agentService = new AgentService(modelServiceMock);
  });

  it('should call modelService.generateCompletion', async () => {
    // Arrange
    const mockResponse = { message: { role: 'assistant', content: 'Mocked response' }, usage: {}, cost: 0 };
    modelServiceMock.generateCompletion.mockResolvedValue(mockResponse);

    // Act
    const result = await agentService.processMessage('Test prompt');

    // Assert
    expect(modelServiceMock.generateCompletion).toHaveBeenCalledTimes(1);
    expect(modelServiceMock.generateCompletion).toHaveBeenCalledWith(
        expect.any(String), // modelId
        expect.arrayContaining([expect.objectContaining({ role: 'user', content: 'Test prompt' })]), // messages
        expect.any(Object) // options
    );
    expect(result.content).toBe('Mocked response');
  });

  it('should handle errors from modelService', async () => {
     // Arrange
     const mockError = new Error('Model API failed');
     modelServiceMock.generateCompletion.mockRejectedValue(mockError);

     // Act & Assert
     await expect(agentService.processMessage('Test prompt')).rejects.toThrow(mockError);
     expect(modelServiceMock.generateCompletion).toHaveBeenCalledTimes(1);
  });
});
```
  
## Test Reporting

### Test Report Format

**Components**:
- **Summary:** Total tests run, passed, failed, skipped, duration.
- **Detailed Results:** List of test suites and individual test cases with pass/fail status.
- **Failure Details:** For failed tests, include the error message, stack trace, and potentially diffs for assertion failures.
- **Performance Metrics:** Output from benchmark tests (average duration, max duration, resource usage if captured).
- **Test Coverage:** Summary report (overall percentage) and detailed report (per file/function coverage), often generated in HTML format (e.g., by Jest's coverage reporters).
- **Environment Information:** OS, Node.js version, CPU/RAM (useful for diagnosing performance/compatibility issues).

**Example Report Snippet (Text Summary)**:

```
 PASS  test/command.test.ts (5.123 s)
 PASS  test/storage.test.ts (8.456 s)
 FAIL  test/agent.test.ts (3.789 s)
  ● AgentService › should handle API errors

    expect(received).toThrow(expected)

    Expected constructor: Error
    Expected message: "API Request Failed"

    Received function did not throw

      at Object.<anonymous> (test/agent.test.ts:105:12)

-----------------|---------|----------|---------|---------|-------------------
File             | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-----------------|---------|----------|---------|---------|-------------------
All files        |   85.67 |    78.12 |   82.45 |   85.33 |
 src/agent       |   90.11 |    85.00 |   88.88 |   90.00 |
  agent.service.ts |   88.23 |    80.00 |   85.71 |   87.50 | 105-110
 src/storage     |   92.50 |    90.00 |   91.66 |   92.11 |
  ...            |     ... |      ... |     ... |     ... |
-----------------|---------|----------|---------|---------|-------------------
Test Suites: 1 failed, 2 passed, 3 total
Tests:       1 failed, 58 passed, 59 total
Snapshots:   0 total
Time:        17.368 s
```

### Continuous Integration Integration

**Approach**:
- **JUnit/XUnit Reports:** Configure test runners (Jest, Mocha) to output results in standard XML formats (JUnit/XUnit) which most CI/CD platforms can parse.
- **HTML Coverage Reports:** Configure coverage tools to generate HTML reports, which can be archived as build artifacts in the CI/CD system.
- **CI/CD Integration:** Configure the CI/CD platform (e.g., GitHub Actions) to:
    - Display test summaries directly in the build logs and PR checks.
    - Parse XML reports to show detailed test results in the CI/CD UI.
    - Fail builds if tests fail or coverage drops below a threshold.
    - Archive HTML coverage reports and detailed test logs for later inspection.
    - Potentially use tools/actions to comment on PRs with coverage changes or performance regressions.
    - Generate coverage badges (e.g., via Codecov, Coveralls) for display in the README.

## Test Plan Template

### Component Test Plan Template

```markdown
# Test Plan: [Component Name]

## Overview
Brief description of the component and testing approach.

## Test Scope
- [Feature/functionality covered]
- [Specific aspects to focus on]
- [Out of scope items]

## Test Types
- Unit Testing: [specific approaches]
- Integration Testing: [specific approaches]
- CLI Testing: [specific approaches]
- Performance Testing: [specific approaches]

## Test Environment
- [Required environment setup]
- [Dependencies and mocks]
- [Test data requirements]

## Test Cases
1. [Test Case 1]
   - Preconditions: [conditions]
   - Steps: [steps]
   - Expected Results: [results]

2. [Test Case 2]
   - Preconditions: [conditions]
   - Steps: [steps]
   - Expected Results: [results]

## Risks and Mitigations
- [Risk 1]: [Mitigation approach]
- [Risk 2]: [Mitigation approach]

## Success Criteria
- [Criteria 1]
- [Criteria 2]
```

## Testing Workflow Integration

### Development Workflow Integration

**Process**:
1. Developer writes component code and unit tests
2. Tests run automatically on pre-commit
3. Pull request triggers full test suite
4. Code review includes test review
5. Merge requires passing tests and coverage thresholds

### Test-Driven Development Approach

**Process**:
1. Write test for CLI command or component
2. Verify test fails (red)
3. Implement functionality to pass test (green)
4. Refactor code while maintaining passing tests
5. Add edge case and performance tests
6. Repeat for next feature

## Conclusion

This CLI test strategy provides a comprehensive approach to testing SwissKnife CLI components during and after integration. By following this strategy, we can ensure that the CLI remains functional, usable, and performant throughout the integration process.

The strategy emphasizes testing CLI-specific aspects such as command execution, option parsing, output formatting, and interactive input handling. It also covers cross-platform testing to ensure consistent behavior across all supported environments.

Implementation of this testing strategy will help identify and resolve issues early in the integration process, reducing the risk of problems in the final integrated product.
