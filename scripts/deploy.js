/**
 * Deployment Script
 * 
 * This script deploys the application to a specific environment.
 * It handles the deployment process for staging and production.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get environment from command line argument
const environment = process.argv[2];
if (!environment || !['staging', 'production'].includes(environment)) {
  console.error('Please specify a valid environment: staging or production');
  process.exit(1);
}

console.log(`Deploying to ${environment} environment...`);

// Ensure we're configured for the right environment
try {
  execSync(`node ${path.join(__dirname, 'configure.js')} ${environment}`, {
    stdio: 'inherit'
  });
} catch (error) {
  console.error('Failed to configure environment:', error.message);
  process.exit(1);
}

// Deployment constants
const DEPLOY_TOKEN = environment === 'staging' 
  ? process.env.STAGING_DEPLOY_TOKEN 
  : process.env.PRODUCTION_DEPLOY_TOKEN;

if (!DEPLOY_TOKEN) {
  console.error(`Missing ${environment.toUpperCase()}_DEPLOY_TOKEN environment variable`);
  process.exit(1);
}

// Check if build exists
const CLI_PATH = path.resolve(__dirname, '../cli.mjs');
if (!fs.existsSync(CLI_PATH)) {
  console.error('Build not found! Run npm run build first.');
  process.exit(1);
}

// Deployment functions for different environments
const deploymentFunctions = {
  staging: async () => {
    console.log('📦 Deploying to staging environment...');
    
    try {
      // Prepare deployment package
      console.log('Creating deployment package...');
      const packageDir = path.join(__dirname, '../deploy-package');
      if (fs.existsSync(packageDir)) {
        execSync(`rm -rf ${packageDir}`);
      }
      fs.mkdirSync(packageDir, { recursive: true });
      
      // Copy necessary files
      execSync(`cp ${path.join(__dirname, '../cli.mjs')} ${packageDir}/`);
      execSync(`cp ${path.join(__dirname, '../yoga.wasm')} ${packageDir}/`);
      execSync(`cp ${path.join(__dirname, '../config/current.json')} ${packageDir}/config.json`);
      execSync(`cp ${path.join(__dirname, '../package.json')} ${packageDir}/`);
      execSync(`cp ${path.join(__dirname, '../.env')} ${packageDir}/`);
      
      // Create version file
      let version = 'dev';
      try {
        const packageJson = require('../package.json');
        version = packageJson.version;
      } catch (error) {
        console.warn('Could not determine version from package.json');
      }
      fs.writeFileSync(path.join(packageDir, 'version.txt'), version);
      
      // Simulate uploading to staging server
      console.log(`Would upload to staging server with token: ${DEPLOY_TOKEN.substr(0, 3)}...`);
      console.log('In a real deployment, this would use scp, aws s3 cp, or similar');
      
      console.log('Simulating deployment to staging server...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate deployment time
      
      console.log('✅ Deployment to staging completed successfully!');
      console.log(`Version ${version} deployed to staging environment`);
      return true;
    } catch (error) {
      console.error('❌ Staging deployment failed:', error.message);
      return false;
    }
  },
  
  production: async () => {
    console.log('🚀 Deploying to PRODUCTION environment...');
    
    // Ask for confirmation when running locally (not in CI)
    if (!process.env.CI) {
      console.log('\n⚠️  WARNING: You are about to deploy to PRODUCTION! ⚠️');
      console.log('Press Ctrl+C to cancel or wait 5 seconds to continue...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    try {
      // Prepare deployment package
      console.log('Creating production deployment package...');
      const packageDir = path.join(__dirname, '../deploy-package');
      if (fs.existsSync(packageDir)) {
        execSync(`rm -rf ${packageDir}`);
      }
      fs.mkdirSync(packageDir, { recursive: true });
      
      // Copy necessary files
      execSync(`cp ${path.join(__dirname, '../cli.mjs')} ${packageDir}/`);
      execSync(`cp ${path.join(__dirname, '../yoga.wasm')} ${packageDir}/`);
      execSync(`cp ${path.join(__dirname, '../config/current.json')} ${packageDir}/config.json`);
      execSync(`cp ${path.join(__dirname, '../package.json')} ${packageDir}/`);
      execSync(`cp ${path.join(__dirname, '../.env')} ${packageDir}/`);
      
      // Create version file
      let version = 'dev';
      try {
        const packageJson = require('../package.json');
        version = packageJson.version;
      } catch (error) {
        console.warn('Could not determine version from package.json');
      }
      fs.writeFileSync(path.join(packageDir, 'version.txt'), version);
      
      // Simulate uploading to production server
      console.log(`Would upload to production server with token: ${DEPLOY_TOKEN.substr(0, 3)}...`);
      console.log('In a real deployment, this would use scp, aws s3 cp, or similar');
      
      console.log('Simulating deployment to production server...');
      await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate deployment time
      
      console.log('Simulating CDN cache invalidation...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate cache invalidation
      
      console.log('✅ Deployment to production completed successfully!');
      console.log(`Version ${version} deployed to production environment`);
      return true;
    } catch (error) {
      console.error('❌ Production deployment failed:', error.message);
      return false;
    }
  }
};

// Run the deployment
(async () => {
  const deployFunction = deploymentFunctions[environment];
  if (!deployFunction) {
    console.error(`Deployment function not found for environment: ${environment}`);
    process.exit(1);
  }
  
  const success = await deployFunction();
  
  if (!success) {
    console.error(`Deployment to ${environment} failed`);
    process.exit(1);
  }
})();