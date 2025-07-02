import chalk from 'chalk';
import ora from 'ora';
import readline from 'readline';
import { createInterface } from 'readline';

export class CLIUXEnhancer {
  public static formatSuccess(message: string): void {
    console.log(chalk.green(`✔ ${message}`));
  }

  public static formatError(message: string): void {
    console.error(chalk.red(`✖ ${message}`));
  }

  public static formatInfo(message: string): void {
    console.log(chalk.blue(`ℹ ${message}`));
  }

  public static formatWarning(message: string): void {
    console.warn(chalk.yellow(`⚠ ${message}`));
  }

  public static formatHeader(message: string): void {
    console.log(chalk.bold.cyan(`\n${message}`));
    console.log(chalk.cyan('='.repeat(message.length)));
  }

  public static showSpinner(message: string): any {
    const spinner = ora(message).start();
    return spinner;
  }

  public static stopSpinner(spinner: any, success: boolean, message: string): void {
    if (success) {
      spinner.succeed(message);
    } else {
      spinner.fail(message);
    }
  }

  /**
   * Display a progress bar
   * @param current Current progress value
   * @param total Total progress value
   * @param message Optional message to display
   */
  public static showProgress(current: number, total: number, message?: string): void {
    const width = 30;
    const percent = Math.min(Math.round((current / total) * 100), 100);
    const filledWidth = Math.round((current / total) * width);
    const emptyWidth = width - filledWidth;
    
    const filled = '█'.repeat(filledWidth);
    const empty = '░'.repeat(emptyWidth);
    const bar = `${filled}${empty}`;
    
    const output = message 
      ? `${chalk.cyan(bar)} ${percent}% | ${message}`
      : `${chalk.cyan(bar)} ${percent}%`;
    
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(output);
  }

  /**
   * Prompt the user for input
   * @param question Question to ask
   * @returns Promise resolving to user's answer
   */
  public static async prompt(question: string): Promise<string> {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question(chalk.cyan(`${question} `), (answer: string) => {
        rl.close();
        resolve(answer);
      });
    });
  }

  /**
   * Format an object as a table
   * @param data Array of objects to display
   */
  public static formatTable<T extends object>(data: T[]): void {
    if (data.length === 0) {
      console.log('No data to display');
      return;
    }

    const keys = Object.keys(data[0]) as (keyof T)[];
    const columnWidths: Record<string, number> = {};
    
    // Calculate column widths
    keys.forEach(key => {
      columnWidths[key as string] = String(key).length;
      data.forEach(row => {
        const cellValue = String(row[key]);
        columnWidths[key as string] = Math.max(columnWidths[key as string], cellValue.length);
      });
    });
    
    // Print header
    let header = '';
    let separator = '';
    keys.forEach(key => {
      const keyStr = String(key);
      header += chalk.bold(keyStr.padEnd(columnWidths[key as string] + 2));
      separator += '-'.repeat(columnWidths[key as string]) + '--';
    });
    console.log(header);
    console.log(separator);
    
    // Print rows
    data.forEach(row => {
      let line = '';
      keys.forEach(key => {
        const cellValue = String(row[key]);
        line += cellValue.padEnd(columnWidths[key as string] + 2);
      });
      console.log(line);
    });
  }
}
