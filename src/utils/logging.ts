// src/utils/logging.ts
export class LogManager {
 private static instance: LogManager;

 private constructor() {}

 static getInstance(): LogManager {
 if (!LogManager.instance) {
 LogManager.instance = new LogManager();
 }
 return LogManager.instance;
 }

 debug(message: string): void {
 console.debug(`DEBUG: ${message}`);
 }

 info(message: string): void {
 console.info(`INFO: ${message}`);
 }

 warn(message: string): void {
 console.warn(`WARN: ${message}`);
 }

 error(message: string, error?: any): void {
 if (error) {
 console.error(`ERROR: ${message}`, error);
 } else {
 console.error(`ERROR: ${message}`);
 }
 }
}
