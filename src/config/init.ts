import { ConfigurationManager } from './manager.js';
import { registerConfigurationSchemas } from './schemas.js';

async function main(): Promise<void> {
  try {
    const configManager = ConfigurationManager.getInstance();
    await configManager.initialize();
    registerConfigurationSchemas();
    console.log('Configuration initialized');
  } catch (error) {
    console.error('Failed to initialize configuration:', error);
    process.exit(1);
  }
}

main();
