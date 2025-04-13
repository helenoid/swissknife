/**
 * CLI test runner utility for executing and testing CLI commands
 */
const path = require('path');
const { execFile } = require('child_process');
const { wait } = require('./test-helpers');

/**
 * Class for running and testing CLI commands
 */
class CLIRunner {
  /**
   * Create a new CLI runner
   * @param {Object} options - Options
   * @param {string} options.cliPath - Path to the CLI executable
   * @param {string} options.workingDir - Working directory for command execution
   * @param {Object} options.env - Environment variables to set
   */
  constructor(options = {}) {
    this.cliPath = options.cliPath || path.resolve(__dirname, '../../cli.mjs');
    this.workingDir = options.workingDir || process.cwd();
    this.env = {
      ...process.env,
      NODE_ENV: 'test',
      ...options.env
    };
    
    // Track command history
    this.commandHistory = [];
  }
  
  /**
   * Run a CLI command
   * @param {string|string[]} args - Command arguments
   * @param {Object} options - Execution options
   * @param {number} options.timeout - Command timeout in milliseconds
   * @param {string} options.stdin - Standard input to provide
   * @returns {Promise<Object>} - Result object with stdout, stderr, and exitCode
   */
  run(args, options = {}) {
    const argArray = Array.isArray(args) ? args : args.split(/\s+/);
    const timeout = options.timeout || 10000;
    
    // Add to command history
    this.commandHistory.push(argArray);
    
    return new Promise((resolve, reject) => {
      // Setup timeout
      const timeoutId = setTimeout(() => {
        if (childProcess) {
          childProcess.kill();
          reject(new Error(`Command timed out after ${timeout}ms: ${argArray.join(' ')}`));
        }
      }, timeout);
      
      // Execute command
      const childProcess = execFile(
        'node', 
        [this.cliPath, ...argArray], 
        {
          cwd: this.workingDir,
          env: this.env,
          timeout,
          encoding: 'utf8'
        },
        (error, stdout, stderr) => {
          clearTimeout(timeoutId);
          
          resolve({
            stdout: stdout.toString(),
            stderr: stderr.toString(),
            exitCode: error ? error.code || 1 : 0,
            error: error || null
          });
        }
      );
      
      // Provide stdin if specified
      if (options.stdin) {
        childProcess.stdin.write(options.stdin);
        childProcess.stdin.end();
      }
    });
  }
  
  /**
   * Run a series of commands in sequence
   * @param {Array<string|string[]>} commands - Array of commands to run
   * @param {Object} options - Execution options
   * @returns {Promise<Array<Object>>} - Array of results
   */
  async runSequence(commands, options = {}) {
    const results = [];
    
    for (const command of commands) {
      const result = await this.run(command, options);
      results.push(result);
      
      // If a command fails and stopOnError is true, stop sequence
      if (result.exitCode !== 0 && options.stopOnError) {
        break;
      }
      
      // Wait between commands if specified
      if (options.delay) {
        await wait(options.delay);
      }
    }
    
    return results;
  }
  
  /**
   * Run a command and ensure it succeeds
   * @param {string|string[]} args - Command arguments
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} - Command result
   * @throws {Error} - If command fails
   */
  async runExpectSuccess(args, options = {}) {
    const result = await this.run(args, options);
    
    if (result.exitCode !== 0) {
      throw new Error(
        `Command failed with exit code ${result.exitCode}\n` +
        `Command: ${Array.isArray(args) ? args.join(' ') : args}\n` +
        `stderr: ${result.stderr}\n` +
        `stdout: ${result.stdout}`
      );
    }
    
    return result;
  }
  
  /**
   * Run a command and ensure it fails
   * @param {string|string[]} args - Command arguments
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} - Command result
   * @throws {Error} - If command succeeds
   */
  async runExpectFailure(args, options = {}) {
    const result = await this.run(args, options);
    
    if (result.exitCode === 0) {
      throw new Error(
        `Command succeeded but was expected to fail\n` +
        `Command: ${Array.isArray(args) ? args.join(' ') : args}\n` +
        `stdout: ${result.stdout}`
      );
    }
    
    return result;
  }
  
  /**
   * Get command history
   * @returns {Array<string[]>} - Command history
   */
  getHistory() {
    return [...this.commandHistory];
  }
  
  /**
   * Clear command history
   */
  clearHistory() {
    this.commandHistory = [];
  }
}

module.exports = { CLIRunner };