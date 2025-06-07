// src/utils/readline.ts
import * as readline from 'readline';

interface ReadlineOptions {
  historySize?: number;
}

export function createReadlineInterface(options: ReadlineOptions = {}) {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    historySize: options.historySize || 1000,
  });
}
