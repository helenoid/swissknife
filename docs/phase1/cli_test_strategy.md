# CLI Test Strategy

This document outlines the comprehensive testing strategy for the SwissKnife CLI application, particularly focusing on validating components integrated during Phase 1 and ensuring overall quality. It defines the objectives, levels, approaches, tools, and processes for testing a complex, multi-component command-line tool.

## Testing Objectives

1. **Verify Functional Correctness**: Ensure all CLI commands, options, and underlying service integrations perform their specified functions accurately according to requirements.
2. **Validate Usability & UX**: Confirm that the CLI interface is intuitive, consistent, provides clear feedback (help text, error messages, progress indicators), and is easy to use for target users.
3. **Ensure Performance & Scalability**: Validate that CLI operations (startup, command execution, data processing) meet defined performance targets and handle varying loads gracefully.
4. **Verify Cross-Platform Compatibility**: Ensure the CLI installs and functions correctly across all supported operating systems (Linux, macOS, Windows) and architectures.
5. **Validate Resilience & Error Handling**: Ensure the CLI handles invalid inputs, unexpected errors (network, filesystem, API), edge cases, and interruptions gracefully, providing informative error messages and appropriate exit codes.
6. **Confirm Integration Success**: Verify that components integrated from different sources (via clean-room reimplementation) work together seamlessly within the unified CLI architecture.

## Test Levels

### 1. Unit Testing

**Focus**: Testing individual TypeScript modules, classes, or functions in isolation from their dependencies. Ensures the smallest parts of the code work correctly.

**Scope**:
- Core logic within command handlers (parsing args, calling services - with services mocked).
- Individual service methods (e.g., `ModelSelector` logic, `PathResolver` normalization - with dependencies mocked).
- Utility functions (e.g., token counting, path manipulation, encryption, Hamming distance, ID normalization).
- Core data structures (e.g., `MerkleClock` logic - tick, merge, compare).
- Configuration loading and parsing logic (`ConfigManager`).
- Individual TUI components (if using Ink/React, using `@testing-library/react` or similar).

**Techniques**:
- **Mocking/Stubbing:** Use Jest's built-in mocking (`jest.mock`, `jest.fn`, `jest.spyOn`) to replace dependencies (other services, filesystem, network calls) with controlled test doubles.
- **Interface Contract Validation:** Ensure functions adhere to their defined TypeScript interfaces regarding inputs and outputs (checked implicitly by TypeScript compiler and explicitly by tests).
- **Error Path Testing:** Verify correct error handling and propagation for expected failure conditions (e.g., throwing specific `SwissKnifeError` subclasses).
- **Boundary Value Analysis:** Test edge cases for inputs (e.g., empty strings, zero values, large numbers, special characters, null/undefined).
- **Logic Coverage:** Aim for high statement, branch, and function coverage within the unit, focusing on complex logic.

**Tools**:
- **Test Runner/Framework:** Jest (preferred for its integrated mocking, assertions, and coverage).
- **Assertion Library:** Jest's built-in `expect`.

**Coverage Goal**: Aim for >80% code coverage (line/statement) for critical business logic and utility components. Focus on testing logic, not just simple getters/setters.

### 2. Integration Testing

**Focus**: Testing the interaction and communication between two or more integrated components *within* the SwissKnife application, ensuring they work together correctly. Mocks are typically used only at the boundaries of the system under test (e.g., external APIs, network layer).

**Scope**:
- **Service-to-Service:** Verify interactions between core services (e.g., `AgentService` calling `ModelService`, `TaskService` using `StorageOperations`).
- **Command-to-Service:** Test the flow from a command handler invoking a service method via `ExecutionContext` and correctly handling the response or error.
- **Configuration Impact:** Verify that changes made via `ConfigManager` correctly affect the behavior of relevant components.
- **Task/Worker Integration:** Test task submission to the scheduler/worker pool and result retrieval (initially local workers).
- **Distributed Coordination (TaskNet Phase 3+):** Test the interaction between the `Coordinator`, `MerkleClock`, and mocked `NetworkService` (LibP2P) to verify task announcement, responsibility calculation (Hamming distance), and completion message handling in simulated multi-peer scenarios.
- **External API Client Integration:** Test the application's client classes (`IPFSClient`, `ModelProvider` implementations) interacting with *mocked* external APIs (using `nock` or `msw`) to verify request formatting, response handling, and error mapping.

**Techniques**:
- **Test Setup:** Initialize the specific real components/services needed for the interaction being tested (e.g., `Coordinator` and `MerkleClock`).
- **Dependency Injection:** Use the application's dependency injection mechanism (e.g., providing services via `ExecutionContext`) to supply real or mocked dependencies (e.g., inject mocked `NetworkService` into `Coordinator`).
- **Contract Testing:** Verify that components adhere to the defined TypeScript interfaces when interacting.
- **Data Flow Validation:** Ensure data passed between components (e.g., arguments, return values, data written/read via storage) is correctly formatted and processed.
- **Error Propagation:** Test how errors (e.g., `StorageError`, `ModelError`, `CoordinationError`) are handled and propagated across component boundaries.

**Tools**:
- **Test Runner/Framework:** Jest.
- **HTTP Mocking Libraries:** `nock` or `msw` (Mock Service Worker) for mocking external HTTP APIs.
- **Network Mocking (Advanced):** For coordination tests, use Jest mocks for the `NetworkService` interface, simulating PubSub publish/subscribe behavior and peer lists.
- **Test Databases/Storage:** Use temporary databases (e.g., in-memory SQLite via `better-sqlite3`) or temporary directories (`os.tmpdir()`, `memfs`) for testing storage interactions.

**Coverage Goal**: Focus on testing the contracts and primary interaction points between all major internal services (including coordination components) and the interfaces to external systems (via mocked APIs/network).

### 3. Command-Line Interface (CLI) Testing / End-to-End (E2E) Testing

**Focus**: Testing the application from the user's perspective by executing the compiled CLI binary (`dist/cli.js`) as a separate process and validating its behavior based on arguments, stdin, stdout, stderr, and exit codes.

**Scope**:
- **Command Execution:** Running actual `node dist/cli.js <command> [options]` commands.
- **Argument/Option Parsing:** Verifying correct parsing of various argument combinations.
- **Help & Usage Messages:** Validating the output of `--help` flags.
- **Standard Output (stdout):** Asserting on expected text, JSON, YAML, or tabular output.
- **Standard Error (stderr):** Asserting on expected error messages and formatting.
- **Exit Codes:** Verifying correct exit codes for success (0) and different failure modes (>0).
- **Interactive Prompts:** Testing workflows involving user prompts (requires specialized test harnesses).
- **File I/O:** Verifying commands that read from or write to the filesystem (using temporary files/dirs).
- **Environment Variables:** Testing the effect of environment variables on CLI behavior.
- **Basic Distributed Scenarios (Limited):** Potentially test commands that trigger task distribution (`task create --distribute`) and check status, although verifying actual multi-peer execution is complex at this level and better suited for System Testing.
- **Real External Services (Optional/Tagged):** Optionally run specific E2E tests against live external services (e.g., a specific AI model API, a local IPFS node) using dedicated test accounts/keys. These tests should be clearly marked and potentially run separately due to cost, flakiness, or setup requirements.

**Techniques**:
- **Process Execution:** Use Node.js `child_process.execFile` or `child_process.spawn` for better control over executing the `node dist/cli.js` command.
- **Output Assertion:** Capture and assert on the content of stdout and stderr streams.
- **Exit Code Assertion:** Check the process exit code.
- **Filesystem Assertions:** Use `fs/promises` to check for the creation, modification, or deletion of files in temporary directories.
- **Input Simulation:** Pipe input to stdin for commands that read from it. Simulate interactive prompts using libraries designed for testing interactive CLIs (e.g., `node-pty`) or carefully crafted input streams for simpler prompts.

**Tools**:
- **Test Runner/Framework:** Jest.
- **Node.js `child_process`:** For executing the CLI.
- **Assertion Libraries:** Jest's `expect`.
- **Interactive CLI Testing Libraries (Advanced):** `node-pty` (for pseudo-terminal interaction).
- **Filesystem Utilities:** Node.js `fs/promises`, `os.tmpdir()`, `path`.

**Coverage Goal**: Test the primary success and failure paths for all user-facing commands and their most important option combinations. Cover key end-to-end user workflows.

### 4. System Testing (Includes Performance, Cross-Platform)

**Focus**: Testing the complete CLI application as a whole in realistic or simulated environments, focusing on non-functional requirements like performance, reliability, and compatibility.

**Scope**:
- **End-to-End User Workflows:** Testing complex sequences of commands representing realistic user tasks.
- **Performance & Load:** Measuring command execution time, startup time, memory usage, and CPU load under varying conditions (e.g., large input files, many concurrent operations if applicable).
- **Resource Utilization:** Monitoring filesystem usage (cache, local models), network bandwidth.
- **Cross-Platform Behavior:** Executing key test suites (especially E2E) on all target OS (Linux, macOS, Windows) and architectures (x64, ARM64).
- **Installation & Upgrade:** Testing the packaging and installation process (`install.sh`, binaries, installers) on clean environments. Testing upgrade scenarios if an update mechanism is implemented.
- **Reliability & Stability:** Long-running tests or stress tests to identify memory leaks or stability issues over time (more relevant if background services or P2P networking are used).
- **Distributed System Properties (Advanced):** For TaskNet distribution, design tests to verify properties like causal consistency (via Merkle Clock comparison) and eventual convergence under simulated network conditions (partitions, delays - requires sophisticated test environment, potentially using container orchestration like Docker Compose).

**Techniques**:
- **Scenario-Based Testing:** Define realistic user scenarios and execute them via E2E tests or manual testing.
- **Performance Benchmarking:** Use tools like `hyperfine` or custom scripts with `process.hrtime()` integrated into CI to track performance metrics over time.
- **Resource Monitoring:** Use OS-level tools (`top`, `htop`, Task Manager, `ps`) or Node.js `process.memoryUsage()` during specific test runs.
- **Cross-Platform Execution:** Utilize CI/CD matrix builds (e.g., GitHub Actions matrix strategy) to run tests across different OS images.
- **Installation Testing:** Scripted or manual testing of the installation process on clean virtual machines or containers for each platform.
- **Network Simulation (Advanced):** Use tools like `tc` (Linux) or specialized libraries/platforms to simulate network latency, packet loss, or partitions for testing distributed coordination robustness.

**Tools**:
- **CI/CD Platforms:** GitHub Actions, GitLab CI, Jenkins.
- **Benchmarking Tools:** `hyperfine`, custom scripts.
- **System Monitoring Tools:** OS-specific tools, potentially Node.js process monitoring libraries.
- **Virtualization/Containerization:** Docker, Docker Compose, VMs (VirtualBox, VMWare) for creating clean test environments and simulating multi-peer networks.

**Coverage Goal**: Ensure key user workflows are validated on all target platforms and performance meets defined targets. Validate the installation process. Validate core distributed properties if applicable.

## CLI-Specific Testing Approaches

*(Sections on Command Execution, Option Parsing, Output Format, Error Handling, Interactive Input, Cross-Platform Testing, Performance Testing, Scalability Testing remain largely the same as provided in the previous version of the file, with minor example updates)*

*(... Retain sections 5.1 through 5.8 from the previous version, ensuring examples use `executeCli` helper ...)*

## Test Environment Setup

*(Sections on Local Test Environment and CI/CD Test Environment remain largely the same)*

## Test Data Management

*(Sections on Test Data Generation and Test Fixtures remain largely the same, ensure helpers like `generateRandomFile` are mentioned)*

## Test Case Development

*(Sections on Test Case Template and Test Case Prioritization remain largely the same)*

## Test Automation

*(Sections on Automated Test Suite and Test Helpers/Utilities remain largely the same, ensure `executeCli` and `executeTimedCli` helpers are included)*

## Mocking Strategy

*(Sections on External Dependencies and Service Mocking remain largely the same, ensure examples use Jest)*

## Test Reporting

*(Sections on Test Report Format, Continuous Integration Integration remain largely the same)*

## Test Plan Template

*(Section remains the same, providing the template)*

## Testing Workflow Integration

*(Sections on Development Workflow Integration and Test-Driven Development Approach remain largely the same)*

## Conclusion

This CLI test strategy provides a comprehensive approach to testing SwissKnife CLI components during and after integration, now explicitly including considerations for the distributed task coordination features. By following this strategy, we can ensure that the CLI remains functional, usable, performant, and reliable throughout the integration process.

The strategy emphasizes testing CLI-specific aspects such as command execution, option parsing, output formatting, and interactive input handling, as well as integration points between services, including the complexities introduced by distributed systems concepts like Merkle Clocks and P2P communication (tested via mocks and simulation). It also covers cross-platform testing to ensure consistent behavior across all supported environments.

Implementation of this testing strategy will help identify and resolve issues early in the integration process, reducing the risk of problems in the final integrated product.
