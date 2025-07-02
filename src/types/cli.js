/**
 * Defines the structure for a command-line option.
 * @typedef {Object} CommandOption
 * @property {string} name - The option name (e.g., 'verbose')
 * @property {string} [alias] - Short alias for the option (e.g., 'v')
 * @property {'string' | 'boolean' | 'number'} type - The data type for this option
 * @property {string} description - Description of the option
 * @property {boolean} [required] - Whether this option is required
 * @property {string|boolean|number} [default] - Default value for the option
 */

/**
 * Represents the context passed to command handlers during execution.
 * @typedef {Object} ExecutionContext
 * @property {Object} args - The parsed command-line arguments
 * @property {Object} options - Global options and configuration
 * @property {AbortController} abortController - For cancelling operations
 */

/**
 * Defines the structure for a command.
 * @typedef {Object} Command
 * @property {string} name - The command name
 * @property {string} description - Description of what the command does
 * @property {CommandOption[]} [options] - Command-specific options
 * @property {function(ExecutionContext): Promise<number>} handler - The command's execution logic
 * @property {Command[]} [subcommands] - Optional nested commands
 * @property {string[]} [aliases] - Alternative names for the command
 * @property {string[]} [examples] - Usage examples
 * @property {boolean} [isEnabled] - Whether the command is available (defaults to true)
 * @property {boolean} [isHidden] - Whether to hide from help listings (defaults to false)
 */

export { CommandOption, ExecutionContext, Command };
