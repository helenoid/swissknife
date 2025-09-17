/**
 * Shared Commands Module
 * 
 * Exports the unified command system that works across CLI, web, and desktop environments
 */

export * from './base.js';
export * from './interpreter.js';
export * from './builtin.js';

export { sharedCommandRegistry } from './base.js';
export { flexibleCommandInterpreter } from './interpreter.js';