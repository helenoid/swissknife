// Mock common dependencies
jest.mock("chalk", () => ({ default: (str) => str, red: (str) => str, green: (str) => str, blue: (str) => str }));
jest.mock("nanoid", () => ({ nanoid: () => "test-id" }));
jest.mock("fs", () => ({ promises: { readFile: jest.fn(), writeFile: jest.fn(), mkdir: jest.fn() } }));
/**
 * End-to-End Tests for CLI Task System Integration
 *
 * These tests verify the functionality of the `task` command suite
 * by executing the compiled CLI as a child process. They cover
 * task creation, status checking, execution, cancellation, results,
 * listing, filtering, and potentially more advanced workflows like
 * dependencies and chaining.
 *
 * Note: These tests assume the existence of task types like 'simple-task'
 * and 'error-task' registered within the application for testing purposes.
 */
import * as path from 'path';
import * as childProcess from 'child_process';
import * as util from 'util';
import * as fs from 'fs/promises';
const { createTempTestDir, removeTempTestDir, waitFor, mockEnv } = require('@test-helpers/testUtils.js');
// Promisify exec for async/await usage
const exec = util.promisify(childProcess.exec);
// --- Test Setup ---
describe('CLI Task System Integration (E2E)', () => {
    let tempDir;
    let configPath;
    let dataDir;
    let logsDir;
    let restoreEnv;
    const cliEntryPoint = path.resolve(__dirname, '../../../dist/cli.mjs'); // Assuming build output
    beforeAll(async () => {
        // 1. Create temporary directories for isolated test environment
        tempDir = await createTempTestDir('cli-task-e2e');
        dataDir = path.join(tempDir, 'data');
        logsDir = path.join(tempDir, 'logs');
        configPath = path.join(tempDir, 'config.json');
        await fs.mkdir(dataDir, { recursive: true });
        await fs.mkdir(logsDir, { recursive: true });
        // 2. Write a basic configuration file pointing to temp dirs
        const config = {
            storage: {
                // Assuming a simple local storage setup for tests if needed by tasks
                mounts: { "/local": { backendId: "local-data" } },
                backends: {
                    "local-data": { type: "filesystem", baseDir: dataDir }
                }
            },
            tasks: {
                logPath: logsDir,
                defaultTimeout: 30000,
                // Worker config might be needed if tasks use workers
                workers: {
                    poolSize: 1, // Keep low for predictable testing
                }
            },
            // Add other necessary minimal config (e.g., logging level)
            logging: { level: 'warn' } // Keep logs quieter for tests unless debugging
        };
        await fs.writeFile(configPath, JSON.stringify(config, null, 2));
        // 3. Mock environment variables to point to the test config
        restoreEnv = mockEnv({
            'SWISSKNIFE_CONFIG_PATH': configPath,
            'SWISSKNIFE_DATA_DIR': dataDir, // Example if app uses data dir env
            // 'SWISSKNIFE_DEV_MODE': 'true' // If needed for specific test behavior
        });
        console.log(`E2E Task Tests: Using temp directory ${tempDir}`);
    });
    afterAll(async () => {
        // Clean up temp directory
        await removeTempTestDir(tempDir);
        // Restore original environment variables
        restoreEnv();
        console.log(`E2E Task Tests: Cleaned up temp directory ${tempDir}`);
    });
    // --- Helper Functions ---
    /**
     * Executes a SwissKnife CLI command.
     * @param command The command string (e.g., 'task list --status pending')
     * @returns Promise<{ stdout: string; stderr: string; exitCode: number }>
     */
    async function runCommand(command) {
        const commandToRun = `node ${cliEntryPoint} ${command}`;
        try {
            const { stdout, stderr } = await exec(commandToRun, { cwd: tempDir }); // Run with tempDir as cwd if needed
            return { stdout: stdout.trim(), stderr: stderr.trim(), exitCode: 0 };
        }
        catch (error) {
            // exec throws an error for non-zero exit codes
            return {
                stdout: error.stdout?.toString().trim() || '',
                stderr: error.stderr?.toString().trim() || '',
                exitCode: error.code || 1,
            };
        }
    }
    /**
     * Extracts a task ID from CLI output (adjust regex as needed).
     * @param output The stdout string from runCommand.
     * @returns The extracted task ID or null.
     */
    function extractTaskId(output) {
        // Example regex, adjust based on actual "task create" output format
        const match = output.match(/Task created: (\S+)/i) || output.match(/Task ID: (\S+)/i);
        return match ? match[1] : null;
    }
    // --- Test Suites ---
    describe('Task Creation and Management', () => {
        it('should create a task successfully with valid arguments', async () => {
            // Arrange
            const taskType = 'simple-task'; // Assumes this type is registered
            const taskDesc = '"Test Task Creation"'; // Quote if description has spaces
            const inputData = '"test input data"';
            const priority = '10'; // Assuming numerical priority
            // Act
            const result = await runCommand(`task create ${taskType} ${taskDesc} --input ${inputData} --priority ${priority}`);
            // Assert
            expect(result.stderr).toBe(''); // No errors expected
            expect(result.exitCode).toBe(0);
            expect(result.stdout).toMatch(/Task created: \S+/i); // Check for creation message and ID
            const taskId = extractTaskId(result.stdout);
            expect(taskId).toBeTruthy();
            // Verify task exists with correct initial status (usually Pending or Ready)
            const statusResult = await runCommand(`task status ${taskId}`);
            expect(statusResult.stderr).toBe('');
            expect(statusResult.exitCode).toBe(0);
            expect(statusResult.stdout).toContain(`ID: ${taskId}`);
            expect(statusResult.stdout).toContain(`Type: ${taskType}`);
            expect(statusResult.stdout).toMatch(/Status: (Pending|Ready)/i); // Initial status
        });
        it('should fail to create a task with missing required arguments', async () => {
            // Arrange
            const taskType = 'simple-task'; // Assume this type requires input
            // Act
            const result = await runCommand(`task create ${taskType}`); // Missing input/description
            // Assert
            expect(result.exitCode).not.toBe(0); // Expect failure
            expect(result.stderr).toMatch(/error: missing required argument|option/i); // Check for specific error
        });
        it('should allow cancelling a pending task', async () => {
            // Arrange: Create a task that won't run immediately (e.g., high priority or delayed)
            const createResult = await runCommand('task create simple-task "Task To Cancel" --input "cancel data" --priority 100');
            const taskId = extractTaskId(createResult.stdout);
            expect(taskId).toBeTruthy();
            // Verify it's pending/ready initially
            const initialStatus = await runCommand(`task status ${taskId}`);
            expect(initialStatus.stdout).toMatch(/Status: (Pending|Ready)/i);
            // Act: Cancel the task
            const cancelResult = await runCommand(`task cancel ${taskId}`);
            // Assert: Check cancellation command output
            expect(cancelResult.stderr).toBe('');
            expect(cancelResult.exitCode).toBe(0);
            expect(cancelResult.stdout).toMatch(/Task .* cancelled/i);
            // Verify final status is Cancelled
            const finalStatusResult = await runCommand(`task status ${taskId}`);
            expect(finalStatusResult.exitCode).toBe(0);
            expect(finalStatusResult.stdout).toMatch(/Status: Cancelled/i);
        });
    });
    describe('Task Execution', () => {
        // Note: These tests depend heavily on how 'task execute' is implemented
        // and whether mock task types ('simple-task', 'error-task') exist and behave as expected.
        // The original test had 'task execute', which might not be the final design.
        // Assuming tasks run automatically when scheduled and ready.
        it('should execute a simple task and reach "Succeeded" status', async () => {
            // Arrange: Create a task expected to succeed quickly
            const createResult = await runCommand('task create simple-task "Successful Task" --input "success data"');
            const taskId = extractTaskId(createResult.stdout);
            expect(taskId).toBeTruthy();
            // Act: Poll status until completion or timeout
            let finalStatus = '';
            const success = await waitFor(async () => {
                const statusResult = await runCommand(`task status ${taskId}`);
                if (statusResult.stdout.includes('Succeeded')) {
                    finalStatus = 'Succeeded';
                    return true;
                }
                if (statusResult.stdout.includes('Failed')) {
                    finalStatus = 'Failed';
                    return true; // Exit loop if failed unexpectedly
                }
                return false;
            }, { timeout: 15000, interval: 500 }); // Adjust timeout/interval as needed
            // Assert
            expect(success).toBe(true); // Check if waitFor completed successfully
            expect(finalStatus).toBe('Succeeded');
        }, 20000); // Increase Jest timeout for this test
        it('should handle task execution errors and reach "Failed" status', async () => {
            // Arrange: Create a task designed to fail (assuming 'error-task' type exists)
            const createResult = await runCommand('task create error-task "Failing Task" --input "fail data"');
            const taskId = extractTaskId(createResult.stdout);
            expect(taskId).toBeTruthy();
            // Act: Poll status until completion or timeout
            let finalStatus = '';
            const finished = await waitFor(async () => {
                const statusResult = await runCommand(`task status ${taskId}`);
                if (statusResult.stdout.includes('Succeeded') || statusResult.stdout.includes('Failed')) {
                    finalStatus = statusResult.stdout.includes('Succeeded') ? 'Succeeded' : 'Failed';
                    return true;
                }
                return false;
            }, { timeout: 15000, interval: 500 });
            // Assert
            expect(finished).toBe(true);
            expect(finalStatus).toBe('Failed');
            // Optionally check for error details
            const statusDetails = await runCommand(`task status ${taskId} --details`);
            expect(statusDetails.stdout).toMatch(/Error: .*Intentional failure/i); // Check if error message is included
        }, 20000); // Increase Jest timeout
    });
    describe('Task Results and Output', () => {
        // Assuming a 'task result <id>' command exists to fetch results
        it('should retrieve results for a completed task', async () => {
            // Arrange: Create and wait for a task to complete
            const input = "data for result task";
            const createResult = await runCommand(`task create simple-task "Result Task" --input "${input}"`);
            const taskId = extractTaskId(createResult.stdout);
            expect(taskId).toBeTruthy();
            await waitFor(async () => (await runCommand(`task status ${taskId}`)).stdout.includes('Succeeded'), { timeout: 15000 });
            // Act: Get results
            const resultCmd = await runCommand(`task result ${taskId}`); // Assuming this command exists
            // Assert
            expect(resultCmd.stderr).toBe('');
            expect(resultCmd.exitCode).toBe(0);
            // Check if the output contains expected result data (depends on 'simple-task' implementation)
            expect(resultCmd.stdout).toContain(`Result for task ${taskId}`);
            expect(resultCmd.stdout).toContain(input); // Assuming simple task echoes input
        }, 20000);
        it('should support JSON output formatting for task status and results', async () => {
            // Arrange: Create and wait for a task
            const createResult = await runCommand('task create simple-task "JSON Task" --input "json data"');
            const taskId = extractTaskId(createResult.stdout);
            expect(taskId).toBeTruthy();
            await waitFor(async () => (await runCommand(`task status ${taskId}`)).stdout.includes('Succeeded'), { timeout: 15000 });
            // Act: Get status and results as JSON
            const statusJsonResult = await runCommand(`task status ${taskId} --output json`);
            const resultJsonResult = await runCommand(`task result ${taskId} --output json`); // Assuming this command exists
            // Assert: Status JSON
            expect(statusJsonResult.stderr).toBe('');
            expect(statusJsonResult.exitCode).toBe(0);
            let statusData;
            try {
                statusData = JSON.parse(statusJsonResult.stdout);
                expect(statusData).toHaveProperty('id', taskId);
                expect(statusData).toHaveProperty('status', 'Succeeded');
                expect(statusData).toHaveProperty('type', 'simple-task');
            }
            catch (e) {
                fail(`Status output is not valid JSON: ${statusJsonResult.stdout}`);
            }
            // Assert: Result JSON
            expect(resultJsonResult.stderr).toBe('');
            expect(resultJsonResult.exitCode).toBe(0);
            let resultData;
            try {
                resultData = JSON.parse(resultJsonResult.stdout);
                expect(resultData).toBeDefined();
                // Add more specific checks based on expected result structure
                expect(resultData).toHaveProperty('data');
            }
            catch (e) {
                fail(`Result output is not valid JSON: ${resultJsonResult.stdout}`);
            }
        }, 20000);
    });
    describe('Task Listing and Filtering', () => {
        // Setup: Create a diverse set of tasks before running these tests
        beforeAll(async () => {
            console.log("Setting up tasks for listing tests...");
            const commands = [
                'task create simple-task "Pending Task A" --input pA --priority 10',
                'task create simple-task "Pending Task B" --input pB --priority 50',
                'task create other-task "Other Pending" --input oP',
                // Create and complete a task
                `task create simple-task "Completed Task" --input c --priority 1 && task status $(swissknife task list --limit 1 --output json | jq -r '.[0].id') --watch`,
                // Create and cancel a task
                `task create simple-task "Cancelled Task" --input x && swissknife task cancel $(swissknife task list --limit 1 --output json | jq -r '.[0].id')`
            ];
            // Run sequentially to avoid race conditions in ID extraction if needed
            for (const cmd of commands) {
                await runCommand(cmd);
                await new Promise(res => setTimeout(res, 100)); // Small delay
            }
            console.log("Finished setting up tasks for listing tests.");
        }, 30000); // Longer timeout for setup
        it('should list all tasks by default', async () => {
            // Act
            const result = await runCommand('task list');
            // Assert
            expect(result.stderr).toBe('');
            expect(result.exitCode).toBe(0);
            expect(result.stdout).toContain('Pending Task A');
            expect(result.stdout).toContain('Pending Task B');
            expect(result.stdout).toContain('Other Pending');
            // Note: Depending on execution speed, these might not appear if --all isn't default
            // expect(result.stdout).toContain('Completed Task');
            // expect(result.stdout).toContain('Cancelled Task');
        });
        it('should list all tasks including finished ones with --all', async () => {
            // Act
            const result = await runCommand('task list --all');
            // Assert
            expect(result.stderr).toBe('');
            expect(result.exitCode).toBe(0);
            expect(result.stdout).toContain('Pending Task A');
            expect(result.stdout).toContain('Completed Task');
            expect(result.stdout).toContain('Cancelled Task');
        });
        it('should filter tasks by status', async () => {
            // Act
            const pendingResult = await runCommand('task list --status Pending --all'); // Use --all to ensure capture
            const completedResult = await runCommand('task list --status Succeeded --all');
            const cancelledResult = await runCommand('task list --status Cancelled --all');
            // Assert
            expect(pendingResult.stdout).toMatch(/Pending Task A|Pending Task B|Other Pending/);
            expect(pendingResult.stdout).not.toContain('Completed Task');
            expect(pendingResult.stdout).not.toContain('Cancelled Task');
            expect(completedResult.stdout).toContain('Completed Task');
            expect(completedResult.stdout).not.toContain('Pending Task');
            expect(cancelledResult.stdout).toContain('Cancelled Task');
            expect(cancelledResult.stdout).not.toContain('Pending Task');
        });
        it('should filter tasks by type', async () => {
            // Act
            const simpleResult = await runCommand('task list --type simple-task --all');
            const otherResult = await runCommand('task list --type other-task --all');
            // Assert
            expect(simpleResult.stdout).toContain('Pending Task A');
            expect(simpleResult.stdout).toContain('Completed Task');
            expect(simpleResult.stdout).not.toContain('Other Pending');
            expect(otherResult.stdout).toContain('Other Pending');
            expect(otherResult.stdout).not.toContain('Pending Task A');
        });
        // Note: Filtering by priority might be less reliable if priorities change dynamically
        it('should filter tasks by priority (if supported)', async () => {
            // Act
            const highResult = await runCommand('task list --priority 10 --all'); // Assuming 10 is high
            // Assert
            expect(highResult.stdout).toContain('Pending Task A');
            expect(highResult.stdout).not.toContain('Pending Task B');
        });
        it('should support combined filters (status and type)', async () => {
            // Act
            const combinedResult = await runCommand('task list --status Pending --type simple-task --all');
            // Assert
            expect(combinedResult.stdout).toContain('Pending Task A');
            expect(combinedResult.stdout).toContain('Pending Task B');
            expect(combinedResult.stdout).not.toContain('Other Pending');
            expect(combinedResult.stdout).not.toContain('Completed Task');
            expect(combinedResult.stdout).not.toContain('Cancelled Task');
        });
    });
    // --- Advanced Workflow Tests (Dependencies, Chaining) ---
    // These depend on specific command implementations existing
    describe('Task Dependencies', () => {
        it('should prevent a dependent task from running until dependencies are met', async () => {
            // Arrange: Create parent and child tasks
            const parentResult = await runCommand('task create simple-task "ParentDep" --input p');
            const parentId = extractTaskId(parentResult.stdout);
            expect(parentId).toBeTruthy();
            const childResult = await runCommand(`task create simple-task "ChildDep" --input c --dependency ${parentId}`);
            const childId = extractTaskId(childResult.stdout);
            expect(childId).toBeTruthy();
            // Act & Assert 1: Check child is Pending/Ready but not Succeeded yet
            const initialChildStatus = await runCommand(`task status ${childId}`);
            expect(initialChildStatus.stdout).toMatch(/Status: (Pending|Ready)/i);
            expect(initialChildStatus.stdout).not.toContain('Succeeded');
            // Act 2: Wait for parent to complete
            await waitFor(async () => (await runCommand(`task status ${parentId}`)).stdout.includes('Succeeded'), { timeout: 15000 });
            // Act 3: Wait for child to complete
            let finalChildStatus = '';
            const childCompleted = await waitFor(async () => {
                const statusResult = await runCommand(`task status ${childId}`);
                if (statusResult.stdout.includes('Succeeded') || statusResult.stdout.includes('Failed')) {
                    finalChildStatus = statusResult.stdout.includes('Succeeded') ? 'Succeeded' : 'Failed';
                    return true;
                }
                return false;
            }, { timeout: 15000 });
            // Assert 3: Child should now succeed
            expect(childCompleted).toBe(true);
            expect(finalChildStatus).toBe('Succeeded');
        }, 35000); // Longer timeout for multi-step test
    });
    // Add tests for 'task chain', 'task batch', 'task graph' etc. if implemented
});
//# sourceMappingURL=cli-task-integration.test.js.map
