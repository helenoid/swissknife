import { z } from 'zod'; // Using Zod for schema validation
import fs from 'fs';
import path from 'path';
import os from 'os';
import { logger } from '../utils/logger.js'; // Use .js extension

// Define the configuration schema using Zod
const ConfigSchema = z.object({
  storage: z.object({
    provider: z.enum(['local', 'ipfs']).default('ipfs'),
    mcp: z.object({
      baseUrl: z.string().url().default('http://localhost:5001'),
      authType: z.enum(['apiKey', 'token']).optional(),
      authValue: z.string().optional(),
    }).optional(),
    localPath: z.string().optional(),
  }).default({ provider: 'ipfs' }), 
  ai: z.object({
    defaultModel: z.string().optional(),
    models: z.object({
      providers: z.record(z.string(), z.object({ apiKey: z.string().optional() })).optional(),
    }).optional(),
  }).default({}), 
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  newSection: z.object({ deep: z.object({ key: z.string() }) }).optional(), // Added for testing set
}).default({}); 

export type Config = z.infer<typeof ConfigSchema>;

export class ConfigManager {
  private static instance: ConfigManager;
  private config: Config;
  private readonly configPath: string;
  private readonly defaultConfig: Config;

  private constructor() {
    const configDir = process.env.SWISSKNIFE_CONFIG_DIR || path.join(os.homedir(), '.config', 'swissknife');
    this.configPath = process.env.SWISSKNIFE_CONFIG_FILE || path.join(configDir, 'config.json');
    this.defaultConfig = ConfigSchema.parse({}); 
    this.config = this.loadConfig();
    logger.info(`Configuration loaded from: ${this.configPath}`);
    logger.debug('Loaded config:', JSON.stringify(this.config, null, 2)); 
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private loadConfig(): Config {
    try {
      if (fs.existsSync(this.configPath)) {
        logger.debug(`Config file found at ${this.configPath}`);
        const rawConfigJson = fs.readFileSync(this.configPath, 'utf-8');
        const rawConfig = JSON.parse(rawConfigJson);
        const parsedConfig = ConfigSchema.parse(rawConfig);
        logger.debug('Successfully parsed config file.');
        return parsedConfig;
      } else {
         logger.warn(`Config file not found at ${this.configPath}. Using default configuration.`);
         this.saveConfig(this.defaultConfig); 
         return this.defaultConfig;
      }
    } catch (error: any) {
      logger.error(`Error loading or parsing config file at ${this.configPath}. Using default configuration.`, error);
      return this.defaultConfig;
    }
  }

  saveConfig(configToSave: Config = this.config): void {
    try {
      const configDir = path.dirname(this.configPath);
      if (!fs.existsSync(configDir)) {
        logger.info(`Creating config directory: ${configDir}`);
        fs.mkdirSync(configDir, { recursive: true });
      }
      logger.debug(`Saving configuration to ${this.configPath}`);
      fs.writeFileSync(this.configPath, JSON.stringify(configToSave, null, 2));
      logger.info(`Configuration saved successfully.`);
    } catch (error: any) {
      logger.error(`Error saving config file to ${this.configPath}:`, error);
    }
  }
  
  /**
   * Gets a configuration value using a dot-separated key path.
   * Returns the default value if the key path is not found or the value is undefined.
   * 
   * @param key The dot-separated key (e.g., 'storage.provider').
   * @param defaultValue Optional default value if the key is not found.
   * @returns The configuration value or the default value.
   */
   get<T = any>(key: string, defaultValue?: T): T { // Update signature to accept defaultValue
    const keys = key.split('.');
    let current: any = this.config;
    for (const k of keys) { // Changed loop variable name
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return defaultValue as T; // Return default if path doesn't exist
      }
    }
    // Return current value or default if current value is undefined
    return (current === undefined ? defaultValue : current) as T; 
  }

  /**
   * Sets a configuration value using a dot-separated key path.
   */
  set(path: string, value: any): void {
     const keys = path.split('.');
     let current: any = this.config;
     
     for (let i = 0; i < keys.length - 1; i++) {
       const key = keys[i];
       if (current[key] === undefined || typeof current[key] !== 'object') {
         current[key] = {}; 
       }
       current = current[key];
     }
     
     const finalKey = keys[keys.length - 1];
     current[finalKey] = value;

     try {
        ConfigSchema.parse(this.config); 
        this.saveConfig(); 
     } catch (validationError) {
        logger.error(`Failed to set config key "${path}" due to validation error. Reverting change.`, validationError);
        this.config = this.loadConfig(); 
     }
  }

  /**
   * Returns a deep clone of the current configuration object.
   */
  getFullConfig(): Config {
    return JSON.parse(JSON.stringify(this.config)); 
  }
}
