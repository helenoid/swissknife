/**
 * Unit tests for CLIUXEnhancer
 */
import chalk from 'chalk';
import ora from 'ora';
import readline from 'readline';
// Mock dependencies
jest.mock('chalk', () => ({
    green: jest.fn((text) => `GREEN:${text}`),
    red: jest.fn((text) => `RED:${text}`),
    blue: jest.fn((text) => `BLUE:${text}`),
    yellow: jest.fn((text) => `YELLOW:${text}`),
    bold: {
        cyan: jest.fn((text) => `BOLD_CYAN:${text}`)
    },
    cyan: jest.fn((text) => `CYAN:${text}`)
}));
jest.mock('ora', () => jest.fn(() => ({
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn(),
    fail: jest.fn()
})));
jest.mock('readline', () => ({
    clearLine: jest.fn(),
    cursorTo: jest.fn(),
    createInterface: jest.fn(() => ({
        question: jest.fn((q, cb) => cb('mock answer')),
        close: jest.fn()
    }))
}));
describe('CLIUXEnhancer', () => {
    let consoleLogSpy;
    let consoleErrorSpy;
    let consoleWarnSpy;
    let stdoutSpy;
    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        // Spy on console methods to prevent output during tests
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
        stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation();
    });
    afterEach(() => {
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
        consoleWarnSpy.mockRestore();
        stdoutSpy.mockRestore();
    });
    describe('formatSuccess', () => {
        it('should format success message with green color', () => {
            // Act
            CLIUXEnhancer.formatSuccess('Success message');
            // Assert
            expect(chalk.green).toHaveBeenCalledWith('✔ Success message');
            expect(consoleLogSpy).toHaveBeenCalled();
        });
    });
    describe('formatError', () => {
        it('should format error message with red color', () => {
            // Act
            CLIUXEnhancer.formatError('Error message');
            // Assert
            expect(chalk.red).toHaveBeenCalledWith('✖ Error message');
            expect(consoleErrorSpy).toHaveBeenCalled();
        });
    });
    describe('formatInfo', () => {
        it('should format info message with blue color', () => {
            // Act
            CLIUXEnhancer.formatInfo('Info message');
            // Assert
            expect(chalk.blue).toHaveBeenCalledWith('ℹ Info message');
            expect(consoleLogSpy).toHaveBeenCalled();
        });
    });
    describe('formatWarning', () => {
        it('should format warning message with yellow color', () => {
            // Act
            CLIUXEnhancer.formatWarning('Warning message');
            // Assert
            expect(chalk.yellow).toHaveBeenCalledWith('⚠ Warning message');
            expect(consoleWarnSpy).toHaveBeenCalled();
        });
    });
    describe('formatHeader', () => {
        it('should format header with bold cyan color and underline', () => {
            // Act
            CLIUXEnhancer.formatHeader('Header');
            // Assert
            expect(chalk.bold.cyan).toHaveBeenCalledWith('\nHeader');
            expect(chalk.cyan).toHaveBeenCalledWith('======');
            expect(consoleLogSpy).toHaveBeenCalledTimes(2);
        });
    });
    describe('showSpinner', () => {
        it('should create and start a spinner with the given message', () => {
            // Act
            const spinner = CLIUXEnhancer.showSpinner('Loading...');
            // Assert
            expect(ora).toHaveBeenCalledWith('Loading...');
            expect(spinner.start).toHaveBeenCalled();
        });
    });
    describe('stopSpinner', () => {
        it('should call succeed on the spinner when successful', () => {
            // Arrange
            const spinner = CLIUXEnhancer.showSpinner('Loading...');
            // Act
            CLIUXEnhancer.stopSpinner(spinner, true, 'Completed');
            // Assert
            expect(spinner.succeed).toHaveBeenCalledWith('Completed');
        });
        it('should call fail on the spinner when unsuccessful', () => {
            // Arrange
            const spinner = CLIUXEnhancer.showSpinner('Loading...');
            // Act
            CLIUXEnhancer.stopSpinner(spinner, false, 'Failed');
            // Assert
            expect(spinner.fail).toHaveBeenCalledWith('Failed');
        });
    });
    describe('showProgress', () => {
        it('should display a progress bar with percentage', () => {
            // Act
            CLIUXEnhancer.showProgress(50, 100);
            // Assert
            expect(readline.clearLine).toHaveBeenCalled();
            expect(readline.cursorTo).toHaveBeenCalled();
            expect(process.stdout.write).toHaveBeenCalled();
            expect(chalk.cyan).toHaveBeenCalled();
        });
        it('should include a message when provided', () => {
            // Act
            CLIUXEnhancer.showProgress(50, 100, 'Processing...');
            // Assert
            expect(process.stdout.write).toHaveBeenCalledWith(expect.stringContaining('Processing...'));
        });
    });
    describe('prompt', () => {
        it('should create readline interface and return user input', async () => {
            // Act
            const result = await CLIUXEnhancer.prompt('Enter value:');
            // Assert
            expect(readline.createInterface).toHaveBeenCalled();
            expect(result).toBe('mock answer');
        });
    });
    describe('formatTable', () => {
        it('should format object data as a table', () => {
            // Arrange
            const data = [
                { id: 1, name: 'Item 1' },
                { id: 2, name: 'Item 2' }
            ];
            // Act
            CLIUXEnhancer.formatTable(data);
            // Assert
            expect(consoleLogSpy).toHaveBeenCalledTimes(4); // Header + separator + 2 rows
        });
        it('should handle empty data array', () => {
            // Act
            CLIUXEnhancer.formatTable([]);
            // Assert
            expect(consoleLogSpy).toHaveBeenCalledWith('No data to display');
        });
    });
});
//# sourceMappingURL=cli-ux-enhancer.test.js.map