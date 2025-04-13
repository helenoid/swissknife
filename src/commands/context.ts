/**
 * Command Execution Context
 * 
 * Provides a context for command execution, including access to shared resources
 * and services needed during command execution.
 */

import { ConfigurationManager } from './config/manager';
import { LogManager } from './utils/logging/manager';
import { ModelRegistry } from './models/registry';
import { ServiceRegistry } from './services/registry';

export interface ExecutionContext {
  config: ConfigurationManager;
  logger: LogManager;
  models: ModelRegistry;
  services: ServiceRegistry;
  interactive: boolean;
  cwd: string;
  env: Record<string, string>;
  args: Record<string, any>;
}

/**
 * Create a new execution context with the given arguments and interactivity flag
 */
export function createExecutionContext(
  args: Record<string, any> = {},
  interactive = true
): ExecutionContext {
  return {
    config: ConfigurationManager.getInstance(),
    logger: LogManager.getInstance(),
    models: ModelRegistry.getInstance(),
    services: ServiceRegistry.getInstance(),
    interactive,
    cwd: process.cwd(),
    env: process.env as Record<string, string>,
    args
  };
}