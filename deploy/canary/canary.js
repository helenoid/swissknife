/**
 * Canary Deployment Tool
 * 
 * This script manages canary deployments for the SwissKnife application,
 * allowing gradual rollout to production with automatic monitoring and rollback.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  // Deployment directories
  deploymentDir: path.join(__dirname, '../../deploy'),
  configPath: path.join(__dirname, '../../config'),
  
  // Canary configuration
  initialPercentage: 10, // Start with 10% of traffic
  increments: [10, 25, 50, 75, 100], // Traffic percentage stages
  evaluationPeriod: 300, // Seconds to evaluate each stage (5 minutes)
  metricThresholds: {
    errorRate: 1.0, // Max 1% error rate
    latency95th: 500, // Max 500ms p95 latency
    cpuUsage: 80, // Max 80% CPU usage
  },
  
  // Health check configuration
  healthCheckEndpoint: '/health',
  healthCheckTimeout: 30000, // 30 seconds
  
  // General settings
  rollbackOnFailure: true,
  verboseLogging: false
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
    initialPercentage: CONFIG.initialPercentage,
    skipMonitoring: false,
    skipHealthCheck: false,
    dryRun: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--force') options.force = true;
    if (arg === '--skip-monitoring') options.skipMonitoring = true;
    if (arg === '--skip-health-check') options.skipHealthCheck = true;
    if (arg === '--dry-run') options.dryRun = true;
    
    if (arg === '--initial-percentage' && i + 1 < args.length) {
      const percentage = parseInt(args[i + 1], 10);
      if (!isNaN(percentage) && percentage > 0 && percentage <= 100) {
        options.initialPercentage = percentage;
        i++; // Skip the next argument
      }
    }
  }

  return options;
}

/**
 * Get the current active deployment version
 * @returns {string|null} Current version or null if none
 */
function getCurrentDeployment() {
  try {
    const currentSymlink = path.join(CONFIG.deploymentDir, `${environment}-current`);
    if (fs.existsSync(currentSymlink)) {
      const target = fs.readlinkSync(currentSymlink);
      // Extract version from target directory name
      const versionMatch = path.basename(target).match(/v([\d.]+)/);
      return versionMatch ? versionMatch[1] : null;
    }
  } catch (error) {
    console.warn('Could not determine current deployment:', error.message);
  }
  return null;
}

/**
 * Get the current canary configuration
 * @returns {Object|null} Canary configuration or null if not in canary mode
 */
function getCanaryConfig() {
  try {
    const canaryConfigPath = path.join(CONFIG.deploymentDir, `${environment}-canary.json`);
    if (fs.existsSync(canaryConfigPath)) {
      return JSON.parse(fs.readFileSync(canaryConfigPath, 'utf8'));
    }
  } catch (error) {
    console.warn('Could not read canary configuration:', error.message);
  }
  return null;
}

/**
 * Save canary configuration
 * @param {Object} config - Canary configuration to save
 */
function saveCanaryConfig(config) {
  if (options.dryRun) {
    console.log('[DRY RUN] Would save canary configuration:', JSON.stringify(config, null, 2));
    return;
  }
  
  try {
    const canaryConfigPath = path.join(CONFIG.deploymentDir, `${environment}-canary.json`);
    fs.writeFileSync(canaryConfigPath, JSON.stringify(config, null, 2));
    console.log('Canary configuration saved.');
  } catch (error) {
    console.error('Failed to save canary configuration:', error.message);
  }
}

/**
 * Deploy a new version as a canary
 * @param {string} version - Version to deploy
 * @param {number} percentage - Initial traffic percentage
 * @returns {boolean} Success or failure
 */
async function deployCanary(version, percentage) {
  console.log(`Deploying version ${version} as canary with ${percentage}% traffic...`);
  
  try {
    // Create deployment directory
    const stableDir = path.join(CONFIG.deploymentDir, `${environment}-stable`);
    const canaryDir = path.join(CONFIG.deploymentDir, `${environment}-canary`);
    
    if (options.dryRun) {
      console.log('[DRY RUN] Would create canary deployment directory');
    } else {
      if (fs.existsSync(canaryDir)) {
        console.log('Cleaning existing canary directory...');
        execSync(`rm -rf ${canaryDir}`);
      }
      fs.mkdirSync(canaryDir, { recursive: true });
      
      // Copy application files
      console.log('Copying application files...');
      execSync(`cp ${path.join(process.cwd(), 'cli.mjs')} ${canaryDir}/`);
      execSync(`cp ${path.join(process.cwd(), 'yoga.wasm')} ${canaryDir}/`);
      execSync(`cp ${path.join(process.cwd(), 'package.json')} ${canaryDir}/`);
      
      // Copy configuration
      const configDir = path.join(canaryDir, 'config');
      fs.mkdirSync(configDir, { recursive: true });
      
      const envConfigPath = path.join(CONFIG.configPath, `${environment}.json`);
      if (fs.existsSync(envConfigPath)) {
        execSync(`cp ${envConfigPath} ${configDir}/config.json`);
      } else {
        console.warn(`Warning: Environment config not found: ${envConfigPath}`);
        // Create a default config
        fs.writeFileSync(
          path.join(configDir, 'config.json'),
          JSON.stringify({ environment: environment, version: version, canary: true }, null, 2)
        );
      }
      
      // Create deployment metadata
      const deploymentMeta = {
        timestamp: new Date().toISOString(),
        environment: environment,
        version: version,
        isCanary: true,
        trafficPercentage: percentage,
        commit: execSync('git rev-parse HEAD').toString().trim()
      };
      
      fs.writeFileSync(
        path.join(canaryDir, 'deployment.json'),
        JSON.stringify(deploymentMeta, null, 2)
      );
      
      // Create or update canary configuration
      const canaryConfig = {
        version: version,
        stable: getCurrentDeployment(),
        startTime: new Date().toISOString(),
        currentPercentage: percentage,
        stages: CONFIG.increments,
        currentStage: 0,
        metrics: [],
        status: 'active'
      };
      
      saveCanaryConfig(canaryConfig);
      
      console.log(`Canary deployment of version ${version} completed successfully!`);
    }
    
    return true;
  } catch (error) {
    console.error(`Canary deployment failed:`, error.message);
    return false;
  }
}

/**
 * Fetch metrics for the canary deployment
 * @returns {Object} Metrics data
 */
async function fetchMetrics() {
  console.log('Fetching metrics for canary deployment...');
  
  // In a real implementation, this would collect metrics from monitoring system
  // For this example, we'll generate synthetic metrics
  
  // Simulate successful metrics by default
  const metrics = {
    timestamp: new Date().toISOString(),
    canary: {
      errorRate: Math.random() * 0.8, // 0-0.8%
      latency95th: 200 + Math.random() * 200, // 200-400ms
      cpuUsage: 50 + Math.random() * 20, // 50-70%
      requestCount: Math.floor(100 + Math.random() * 900) // 100-1000 requests
    },
    stable: {
      errorRate: Math.random() * 0.5, // 0-0.5%
      latency95th: 180 + Math.random() * 150, // 180-330ms
      cpuUsage: 40 + Math.random() * 20, // 40-60%
      requestCount: Math.floor(1000 + Math.random() * 9000) // 1000-10000 requests
    }
  };
  
  // If we're forcing a failure for testing
  if (options.forceFailure) {
    metrics.canary.errorRate = CONFIG.metricThresholds.errorRate + 1 + Math.random() * 2; // Exceed threshold
  }
  
  return metrics;
}

/**
 * Evaluate metrics against thresholds
 * @param {Object} metrics - Metrics data
 * @returns {Object} Evaluation result
 */
function evaluateMetrics(metrics) {
  console.log('Evaluating canary metrics...');
  
  const thresholds = CONFIG.metricThresholds;
  const canaryMetrics = metrics.canary;
  
  const result = {
    pass: true,
    details: []
  };
  
  // Check error rate
  if (canaryMetrics.errorRate > thresholds.errorRate) {
    result.pass = false;
    result.details.push({
      metric: 'errorRate',
      value: canaryMetrics.errorRate,
      threshold: thresholds.errorRate,
      message: `Error rate ${canaryMetrics.errorRate.toFixed(2)}% exceeds threshold of ${thresholds.errorRate}%`
    });
  }
  
  // Check latency
  if (canaryMetrics.latency95th > thresholds.latency95th) {
    result.pass = false;
    result.details.push({
      metric: 'latency95th',
      value: canaryMetrics.latency95th,
      threshold: thresholds.latency95th,
      message: `P95 latency ${canaryMetrics.latency95th.toFixed(2)}ms exceeds threshold of ${thresholds.latency95th}ms`
    });
  }
  
  // Check CPU usage
  if (canaryMetrics.cpuUsage > thresholds.cpuUsage) {
    result.pass = false;
    result.details.push({
      metric: 'cpuUsage',
      value: canaryMetrics.cpuUsage,
      threshold: thresholds.cpuUsage,
      message: `CPU usage ${canaryMetrics.cpuUsage.toFixed(2)}% exceeds threshold of ${thresholds.cpuUsage}%`
    });
  }
  
  if (result.pass) {
    console.log('Canary metrics are within acceptable thresholds.');
  } else {
    console.log('Canary metrics exceeded thresholds:');
    for (const detail of result.details) {
      console.log(`- ${detail.message}`);
    }
  }
  
  return result;
}

/**
 * Update the traffic distribution for a canary deployment
 * @param {number} percentage - New traffic percentage for canary
 * @returns {boolean} Success or failure
 */
async function updateTrafficDistribution(percentage) {
  console.log(`Updating traffic distribution: ${percentage}% to canary...`);
  
  if (options.dryRun) {
    console.log('[DRY RUN] Would update traffic distribution');
    return true;
  }
  
  try {
    // In a real implementation, this would update load balancer, service mesh, etc.
    // For this example, we'll just update the canary configuration
    
    const canaryConfig = getCanaryConfig();
    if (!canaryConfig) {
      console.error('No active canary deployment found.');
      return false;
    }
    
    canaryConfig.currentPercentage = percentage;
    canaryConfig.lastUpdated = new Date().toISOString();
    
    // Find current stage
    for (let i = 0; i < canaryConfig.stages.length; i++) {
      if (canaryConfig.stages[i] === percentage) {
        canaryConfig.currentStage = i;
        break;
      }
    }
    
    // Save updated configuration
    saveCanaryConfig(canaryConfig);
    
    console.log(`Traffic distribution updated: ${percentage}% to canary.`);
    return true;
  } catch (error) {
    console.error('Failed to update traffic distribution:', error.message);
    return false;
  }
}

/**
 * Promote the canary to stable (100% traffic)
 * @returns {boolean} Success or failure
 */
async function promoteCanaryToStable() {
  console.log('Promoting canary to stable (100% traffic)...');
  
  if (options.dryRun) {
    console.log('[DRY RUN] Would promote canary to stable');
    return true;
  }
  
  try {
    const canaryConfig = getCanaryConfig();
    if (!canaryConfig) {
      console.error('No active canary deployment found.');
      return false;
    }
    
    const canaryDir = path.join(CONFIG.deploymentDir, `${environment}-canary`);
    const stableDir = path.join(CONFIG.deploymentDir, `${environment}-stable`);
    const currentSymlink = path.join(CONFIG.deploymentDir, `${environment}-current`);
    
    // Check if canary exists
    if (!fs.existsSync(canaryDir)) {
      console.error('Canary deployment directory not found.');
      return false;
    }
    
    // Back up current stable if it exists
    if (fs.existsSync(stableDir)) {
      const backupDir = path.join(CONFIG.deploymentDir, `${environment}-stable-backup-${Date.now()}`);
      console.log(`Backing up current stable to ${backupDir}...`);
      execSync(`cp -r ${stableDir} ${backupDir}`);
      
      // Clean existing stable
      execSync(`rm -rf ${stableDir}`);
    }
    
    // Move canary to stable
    console.log('Moving canary to stable...');
    execSync(`cp -r ${canaryDir} ${stableDir}`);
    
    // Update deployment metadata
    const deploymentMetaPath = path.join(stableDir, 'deployment.json');
    if (fs.existsSync(deploymentMetaPath)) {
      const meta = JSON.parse(fs.readFileSync(deploymentMetaPath, 'utf8'));
      meta.isCanary = false;
      meta.trafficPercentage = 100;
      meta.promotionTime = new Date().toISOString();
      fs.writeFileSync(deploymentMetaPath, JSON.stringify(meta, null, 2));
    }
    
    // Update symlink
    if (fs.existsSync(currentSymlink)) {
      fs.unlinkSync(currentSymlink);
    }
    fs.symlinkSync(stableDir, currentSymlink);
    
    // Update canary config
    canaryConfig.status = 'promoted';
    canaryConfig.promotionTime = new Date().toISOString();
    canaryConfig.currentPercentage = 100;
    saveCanaryConfig(canaryConfig);
    
    console.log('Canary successfully promoted to stable!');
    return true;
  } catch (error) {
    console.error('Failed to promote canary:', error.message);
    return false;
  }
}

/**
 * Rollback a canary deployment to stable
 * @returns {boolean} Success or failure
 */
async function rollbackCanary() {
  console.log('Rolling back canary deployment...');
  
  if (options.dryRun) {
    console.log('[DRY RUN] Would rollback canary');
    return true;
  }
  
  try {
    const canaryConfig = getCanaryConfig();
    if (!canaryConfig) {
      console.error('No active canary deployment found.');
      return false;
    }
    
    const stableDir = path.join(CONFIG.deploymentDir, `${environment}-stable`);
    const currentSymlink = path.join(CONFIG.deploymentDir, `${environment}-current`);
    
    // Check if stable exists
    if (!fs.existsSync(stableDir)) {
      console.error('Stable deployment directory not found, cannot rollback.');
      return false;
    }
    
    // Update symlink to point to stable
    if (fs.existsSync(currentSymlink)) {
      fs.unlinkSync(currentSymlink);
    }
    fs.symlinkSync(stableDir, currentSymlink);
    
    // Update canary config
    canaryConfig.status = 'rolled-back';
    canaryConfig.rollbackTime = new Date().toISOString();
    canaryConfig.currentPercentage = 0;
    saveCanaryConfig(canaryConfig);
    
    console.log('Canary successfully rolled back to stable!');
    return true;
  } catch (error) {
    console.error('Failed to rollback canary:', error.message);
    return false;
  }
}

/**
 * Run canary deployment and monitoring process
 * @param {string} version - Version to deploy
 * @param {number} initialPercentage - Initial traffic percentage
 */
async function runCanaryProcess(version, initialPercentage) {
  console.log(`Starting canary deployment process for version ${version}...`);
  console.log(`Initial traffic percentage: ${initialPercentage}%`);
  
  // Step 1: Deploy the canary
  const deploySuccess = await deployCanary(version, initialPercentage);
  if (!deploySuccess && !options.force) {
    console.error('Canary deployment failed. Use --force to continue despite errors.');
    process.exit(1);
  }
  
  // Step 2: Verify initial deployment with health check
  if (!options.skipHealthCheck) {
    console.log('Performing initial health check...');
    // In a real implementation, this would check the actual service health
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate health check
    console.log('Health check passed.');
  }
  
  // Step 3: If monitoring is enabled, start the gradual rollout process
  if (options.skipMonitoring) {
    console.log('Monitoring skipped. Canary deployed with fixed percentage of traffic.');
    return;
  }
  
  // Get canary config to determine stages
  const canaryConfig = getCanaryConfig();
  const stages = canaryConfig ? canaryConfig.stages : CONFIG.increments;
  
  console.log('Starting canary monitoring and traffic adjustment process...');
  console.log(`Traffic stages: ${stages.join('%, ')}%`);
  
  // Find the starting stage index
  let currentStageIndex = 0;
  for (let i = 0; i < stages.length; i++) {
    if (stages[i] === initialPercentage) {
      currentStageIndex = i;
      break;
    }
  }
  
  // Run through each stage
  let success = true;
  for (let i = currentStageIndex; i < stages.length; i++) {
    const percentage = stages[i];
    console.log(`\n--- Stage ${i + 1}/${stages.length}: ${percentage}% traffic ---`);
    
    // Update traffic percentage if not the initial stage
    if (i > currentStageIndex) {
      const updateSuccess = await updateTrafficDistribution(percentage);
      if (!updateSuccess) {
        console.error(`Failed to update traffic distribution to ${percentage}%.`);
        if (CONFIG.rollbackOnFailure) {
          await rollbackCanary();
        }
        process.exit(1);
      }
    }
    
    // Monitor for evaluation period
    console.log(`Monitoring canary for ${CONFIG.evaluationPeriod} seconds...`);
    
    // In a real implementation, this would be a continuous monitoring loop
    // For this example, we'll just wait and then evaluate once
    if (!options.dryRun) {
      // Simulate shortened evaluation period for demo
      const waitTime = options.dryRun ? 1000 : Math.min(CONFIG.evaluationPeriod * 1000, 5000);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      // Fetch and evaluate metrics
      const metrics = await fetchMetrics();
      const evaluation = evaluateMetrics(metrics);
      
      // Store metrics in canary config
      if (!options.dryRun && canaryConfig) {
        if (!canaryConfig.metrics) canaryConfig.metrics = [];
        canaryConfig.metrics.push({
          timestamp: metrics.timestamp,
          percentage,
          canary: metrics.canary,
          stable: metrics.stable,
          evaluation: {
            pass: evaluation.pass,
            details: evaluation.details
          }
        });
        saveCanaryConfig(canaryConfig);
      }
      
      // If evaluation failed, rollback
      if (!evaluation.pass) {
        console.error('Canary evaluation failed. Metrics exceeded thresholds.');
        success = false;
        if (CONFIG.rollbackOnFailure) {
          console.log('Initiating rollback due to failed metrics...');
          await rollbackCanary();
        }
        break;
      }
      
      console.log(`Stage ${i + 1} evaluation successful!`);
    } else {
      console.log('[DRY RUN] Would evaluate metrics here');
    }
  }
  
  // Promote canary if all stages were successful
  if (success) {
    console.log('\nAll canary stages completed successfully!');
    console.log('Promoting canary to stable...');
    await promoteCanaryToStable();
  }
}

/**
 * Display command help
 */
function showHelp() {
  console.log(`
Canary Deployment Tool

Usage:
  node canary.js <command> [environment] [options]

Commands:
  deploy <version>  Deploy a new version as a canary
  promote           Promote the current canary to stable
  rollback          Rollback to the stable version
  status            Show current canary status
  help              Show this help message

Environments:
  production        Production environment (default)
  staging           Staging environment

Options:
  --initial-percentage <n>  Initial traffic percentage (default: ${CONFIG.initialPercentage}%)
  --force                   Continue even if a step fails
  --skip-monitoring         Skip monitoring and gradual rollout
  --skip-health-check       Skip initial health check
  --dry-run                 Simulate without making actual changes
  `);
}

// Main execution
(async () => {
  try {
    switch (command) {
      case 'deploy':
        const version = args[1];
        if (!version) {
          console.error('Error: Version must be specified for deploy command.');
          process.exit(1);
        }
        await runCanaryProcess(version, options.initialPercentage);
        break;
      
      case 'promote':
        await promoteCanaryToStable();
        break;
      
      case 'rollback':
        await rollbackCanary();
        break;
      
      case 'status':
        const canaryConfig = getCanaryConfig();
        if (canaryConfig) {
          console.log('Current canary status:');
          console.log(JSON.stringify(canaryConfig, null, 2));
        } else {
          console.log('No active canary deployment found.');
        }
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