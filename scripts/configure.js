/**
 * Environment Configuration Script
 * 
 * This script configures the application for a specific environment.
 * It sets up environment-specific settings for deployment.
 */

const fs = require('fs');
const path = require('path');

// Get environment from command line argument
const environment = process.argv[2];
if (!environment || !['staging', 'production'].includes(environment)) {
  console.error('Please specify a valid environment: staging or production');
  process.exit(1);
}

console.log(`Configuring for ${environment} environment...`);

// Configuration paths
const CONFIG_DIR = path.join(process.cwd(), 'config');
const ENV_CONFIG_PATH = path.join(CONFIG_DIR, `${environment}.json`);
const OUTPUT_CONFIG_PATH = path.join(CONFIG_DIR, 'current.json');

// Create config directory if it doesn't exist
if (!fs.existsSync(CONFIG_DIR)) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

// If environment config doesn't exist, create default
if (!fs.existsSync(ENV_CONFIG_PATH)) {
  console.log(`Creating default ${environment} configuration...`);
  
  // Default configs
  const configs = {
    staging: {
      apiUrl: process.env.STAGING_API_URL || 'https://api.staging.example.com',
      debug: true,
      featureFlags: {
        enableExperimentalFeatures: true,
        verboseLogging: true
      },
      models: {
        defaultModel: 'gpt-4-turbo'
      }
    },
    production: {
      apiUrl: process.env.PRODUCTION_API_URL || 'https://api.example.com',
      debug: false,
      featureFlags: {
        enableExperimentalFeatures: false,
        verboseLogging: false
      },
      models: {
        defaultModel: 'gpt-4-turbo'
      }
    }
  };
  
  fs.writeFileSync(ENV_CONFIG_PATH, JSON.stringify(configs[environment], null, 2));
  console.log(`Created default ${environment} configuration`);
}

// Read environment config
try {
  const envConfig = require(ENV_CONFIG_PATH);
  
  // Override with environment variables if present
  if (environment === 'staging' && process.env.STAGING_API_URL) {
    envConfig.apiUrl = process.env.STAGING_API_URL;
  } else if (environment === 'production' && process.env.PRODUCTION_API_URL) {
    envConfig.apiUrl = process.env.PRODUCTION_API_URL;
  }
  
  // Write current config file
  fs.writeFileSync(OUTPUT_CONFIG_PATH, JSON.stringify(envConfig, null, 2));
  console.log(`Configuration updated for ${environment} environment`);
  
  // Create .env file with environment-specific settings
  const envVars = [
    `NODE_ENV=${environment}`,
    `API_URL=${envConfig.apiUrl}`,
    `DEBUG=${envConfig.debug}`,
  ];
  
  // Add API keys from environment variables if present
  if (environment === 'staging' && process.env.STAGING_API_KEY) {
    envVars.push(`API_KEY=${process.env.STAGING_API_KEY}`);
  } else if (environment === 'production' && process.env.PRODUCTION_API_KEY) {
    envVars.push(`API_KEY=${process.env.PRODUCTION_API_KEY}`);
  }
  
  fs.writeFileSync('.env', envVars.join('\n'));
  console.log('Created .env file with environment variables');
  
} catch (error) {
  console.error(`Error configuring for ${environment}:`, error);
  process.exit(1);
}