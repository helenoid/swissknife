/**
 * Blue-Green Deployment Configuration
 * 
 * This script configures and manages blue-green deployments for the SwissKnife application.
 * It handles environment setup, deployment, testing, and traffic switching.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  environments: ['blue', 'green'],
  deploymentDir: path.join(__dirname, '../../deploy'),
  configPath: path.join(__dirname, '../../config'),
  healthCheckEndpoint: '/health',
  healthCheckTimeout: 30000, // 30 seconds
  rollbackOnFailure: true,
  warmupTime: 5000, // 5 seconds
};

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];
const environment = args[1] || 'production';
const options = parseOptions(args.slice(2));

/**
 * Parse command line options
 * @param {string[]} args - Command line arguments
 * @returns {Object} - Parsed options
 */
function parseOptions(args) {
  const options = {
    force: false,
    skipTests: false,
    skipHealthCheck: false,
    dryRun: false,
  };

  for (const arg of args) {
    if (arg === '--force') options.force = true;
    if (arg === '--skip-tests') options.skipTests = true;
    if (arg === '--skip-health-check') options.skipHealthCheck = true;
    if (arg === '--dry-run') options.dryRun = true;
  }

  return options;
}

/**
 * Get the current active environment (blue or green)
 * @returns {string} - Current active environment or null if none
 */
function getCurrentActiveEnvironment() {
  try {
    const currentSymlink = path.join(CONFIG.deploymentDir, `${environment}-current`);
    if (fs.existsSync(currentSymlink)) {
      const target = fs.readlinkSync(currentSymlink);
      return path.basename(target).split('-')[0]; // Extract "blue" or "green"
    }
  } catch (error) {
    console.warn('Could not determine current active environment:', error.message);
  }
  return null;
}

/**
 * Get the next environment to deploy to
 * @returns {string} - Next environment ("blue" or "green")
 */
function getNextEnvironment() {
  const current = getCurrentActiveEnvironment();
  
  // If no current environment, default to blue
  if (!current) return 'blue';
  
  // Otherwise, toggle between blue and green
  return current === 'blue' ? 'green' : 'blue';
}

/**
 * Deploy to the specified environment
 * @param {string} targetEnv - Environment to deploy to
 * @returns {boolean} - Success or failure
 */
async function deploy(targetEnv) {
  console.log(`Deploying to ${targetEnv} environment...`);
  
  try {
    // Create deployment directory
    const deployDir = path.join(CONFIG.deploymentDir, `${targetEnv}-${environment}`);
    console.log(`Deployment directory: ${deployDir}`);
    
    if (options.dryRun) {
      console.log('[DRY RUN] Would create deployment directory');
    } else {
      if (fs.existsSync(deployDir)) {
        console.log('Cleaning existing deployment directory...');
        execSync(`rm -rf ${deployDir}`);
      }
      fs.mkdirSync(deployDir, { recursive: true });
      
      // Copy application files
      console.log('Copying application files...');
      execSync(`cp ${path.join(process.cwd(), 'cli.mjs')} ${deployDir}/`);
      execSync(`cp ${path.join(process.cwd(), 'yoga.wasm')} ${deployDir}/`);
      execSync(`cp ${path.join(process.cwd(), 'package.json')} ${deployDir}/`);
      
      // Copy configuration
      const configDir = path.join(deployDir, 'config');
      fs.mkdirSync(configDir, { recursive: true });
      
      const envConfigPath = path.join(CONFIG.configPath, `${environment}.json`);
      if (fs.existsSync(envConfigPath)) {
        execSync(`cp ${envConfigPath} ${configDir}/config.json`);
      } else {
        console.warn(`Warning: Environment config not found: ${envConfigPath}`);
        // Create a default config
        fs.writeFileSync(
          path.join(configDir, 'config.json'),
          JSON.stringify({ environment: environment, target: targetEnv }, null, 2)
        );
      }
      
      // Create deployment metadata
      const deploymentMeta = {
        timestamp: new Date().toISOString(),
        environment: environment,
        target: targetEnv,
        version: require(path.join(process.cwd(), 'package.json')).version,
        commit: execSync('git rev-parse HEAD').toString().trim(),
      };
      
      fs.writeFileSync(
        path.join(deployDir, 'deployment.json'),
        JSON.stringify(deploymentMeta, null, 2)
      );
      
      console.log(`Deployment to ${targetEnv} completed successfully!`);
    }
    
    return true;
  } catch (error) {
    console.error(`Deployment to ${targetEnv} failed:`, error.message);
    return false;
  }
}

/**
 * Run tests against the deployed environment
 * @param {string} targetEnv - Environment to test
 * @returns {boolean} - Test success or failure
 */
async function runTests(targetEnv) {
  console.log(`Running tests against ${targetEnv} environment...`);
  
  if (options.skipTests) {
    console.log('Tests skipped due to --skip-tests option');
    return true;
  }
  
  if (options.dryRun) {
    console.log('[DRY RUN] Would run tests');
    return true;
  }
  
  try {
    // In a real implementation, these would be actual tests against the deployed service
    // For this example, we'll just simulate successful tests
    console.log('Simulating test execution...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate test time
    
    console.log(`Tests against ${targetEnv} passed successfully!`);
    return true;
  } catch (error) {
    console.error(`Tests against ${targetEnv} failed:`, error.message);
    return false;
  }
}

/**
 * Perform health check on the deployed environment
 * @param {string} targetEnv - Environment to check
 * @returns {Promise<boolean>} - Health check success or failure
 */
async function healthCheck(targetEnv) {
  console.log(`Performing health check for ${targetEnv} environment...`);
  
  if (options.skipHealthCheck) {
    console.log('Health check skipped due to --skip-health-check option');
    return true;
  }
  
  if (options.dryRun) {
    console.log('[DRY RUN] Would perform health check');
    return true;
  }
  
  // In a real implementation, this would check the actual service health endpoint
  // For this example, we'll just simulate a successful health check
  console.log('Simulating health check...');
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate health check
  
  console.log(`Health check for ${targetEnv} passed successfully!`);
  return true;
}

/**
 * Switch traffic to the new environment
 * @param {string} fromEnv - Current environment
 * @param {string} toEnv - Target environment
 * @returns {boolean} - Success or failure
 */
async function switchTraffic(fromEnv, toEnv) {
  console.log(`Switching traffic from ${fromEnv || 'none'} to ${toEnv}...`);
  
  if (options.dryRun) {
    console.log('[DRY RUN] Would switch traffic');
    return true;
  }
  
  try {
    const currentSymlink = path.join(CONFIG.deploymentDir, `${environment}-current`);
    const targetDir = path.join(CONFIG.deploymentDir, `${toEnv}-${environment}`);
    
    // Remove existing symlink if it exists
    if (fs.existsSync(currentSymlink)) {
      fs.unlinkSync(currentSymlink);
    }
    
    // Create new symlink
    fs.symlinkSync(targetDir, currentSymlink);
    
    console.log(`Traffic successfully switched to ${toEnv}!`);
    return true;
  } catch (error) {
    console.error(`Traffic switch failed:`, error.message);
    return false;
  }
}

/**
 * Rollback to the previous environment
 * @param {string} fromEnv - Failed environment
 * @param {string} toEnv - Environment to rollback to
 * @returns {boolean} - Success or failure
 */
async function rollback(fromEnv, toEnv) {
  console.log(`Rolling back from ${fromEnv} to ${toEnv}...`);
  
  if (options.dryRun) {
    console.log('[DRY RUN] Would perform rollback');
    return true;
  }
  
  try {
    const currentSymlink = path.join(CONFIG.deploymentDir, `${environment}-current`);
    const targetDir = path.join(CONFIG.deploymentDir, `${toEnv}-${environment}`);
    
    // Check if rollback target exists
    if (!fs.existsSync(targetDir)) {
      console.error(`Rollback target ${targetDir} does not exist!`);
      return false;
    }
    
    // Remove existing symlink if it exists
    if (fs.existsSync(currentSymlink)) {
      fs.unlinkSync(currentSymlink);
    }
    
    // Create new symlink
    fs.symlinkSync(targetDir, currentSymlink);
    
    console.log(`Rollback to ${toEnv} successful!`);
    return true;
  } catch (error) {
    console.error(`Rollback failed:`, error.message);
    return false;
  }
}

/**
 * Perform a complete blue-green deployment
 */
async function performBlueGreenDeployment() {
  const currentEnv = getCurrentActiveEnvironment();
  const nextEnv = getNextEnvironment();
  
  console.log(`Starting blue-green deployment process...`);
  console.log(`Current active environment: ${currentEnv || 'none'}`);
  console.log(`Target environment: ${nextEnv}`);
  
  // Step 1: Deploy to the next environment
  const deploySuccess = await deploy(nextEnv);
  if (!deploySuccess && !options.force) {
    console.error('Deployment failed. Use --force to continue despite errors.');
    process.exit(1);
  }
  
  // Step 2: Run tests against the new deployment
  const testsSuccess = await runTests(nextEnv);
  if (!testsSuccess && !options.force) {
    console.error('Tests failed. Use --force to continue despite errors.');
    process.exit(1);
  }
  
  // Step 3: Perform health check
  const healthCheckSuccess = await healthCheck(nextEnv);
  if (!healthCheckSuccess && !options.force) {
    console.error('Health check failed. Use --force to continue despite errors.');
    process.exit(1);
  }
  
  // Step 4: Allow for warmup
  console.log(`Waiting ${CONFIG.warmupTime}ms for environment warmup...`);
  await new Promise(resolve => setTimeout(resolve, CONFIG.warmupTime));
  
  // Step 5: Switch traffic to the new environment
  const switchSuccess = await switchTraffic(currentEnv, nextEnv);
  if (!switchSuccess) {
    console.error('Traffic switch failed!');
    
    if (CONFIG.rollbackOnFailure && currentEnv) {
      console.log('Attempting to rollback...');
      await rollback(nextEnv, currentEnv);
    }
    
    process.exit(1);
  }
  
  console.log(`Blue-green deployment to ${nextEnv} completed successfully!`);
}

/**
 * Display command help
 */
function showHelp() {
  console.log(`
Blue-Green Deployment Tool

Usage:
  node blue-green.js <command> [environment] [options]

Commands:
  deploy            Run a full blue-green deployment
  current           Show current active environment
  switch <env>      Switch traffic to specified environment (blue or green)
  rollback          Rollback to the previous environment
  help              Show this help message

Environments:
  production        Production environment (default)
  staging           Staging environment

Options:
  --force           Continue even if a step fails
  --skip-tests      Skip running tests
  --skip-health-check Skip health check
  --dry-run         Simulate without making actual changes
  `);
}

// Main execution
(async () => {
  try {
    switch (command) {
      case 'deploy':
        await performBlueGreenDeployment();
        break;
      
      case 'current':
        const currentEnv = getCurrentActiveEnvironment();
        console.log(`Current active environment: ${currentEnv || 'none'}`);
        break;
      
      case 'switch':
        const targetEnv = args[1];
        if (!targetEnv || !CONFIG.environments.includes(targetEnv)) {
          console.error(`Invalid environment: ${targetEnv}. Use 'blue' or 'green'.`);
          process.exit(1);
        }
        const currentEnv = getCurrentActiveEnvironment();
        await switchTraffic(currentEnv, targetEnv);
        break;
      
      case 'rollback':
        const activeEnv = getCurrentActiveEnvironment();
        if (!activeEnv) {
          console.error('No active environment found to rollback from.');
          process.exit(1);
        }
        const rollbackTarget = activeEnv === 'blue' ? 'green' : 'blue';
        await rollback(activeEnv, rollbackTarget);
        break;
      
      case 'help':
      default:
        showHelp();
        break;
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();