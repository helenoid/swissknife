/**
 * Performance Monitoring System
 * 
 * This module provides performance monitoring for the SwissKnife application,
 * collecting metrics, tracking historical data, and providing comparison tools
 * for deployment validation.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  // Monitoring storage
  metricsDir: path.join(__dirname, 'metrics'),
  historyLimit: 100, // Keep last 100 metric snapshots
  
  // Metric collection
  collectionInterval: 60, // Seconds between collections
  retentionPeriod: 30, // Days to keep metrics
  
  // Alert thresholds
  thresholds: {
    cpu: {
      warning: 70, // 70% CPU usage
      critical: 90  // 90% CPU usage
    },
    memory: {
      warning: 80,  // 80% memory usage
      critical: 95   // 95% memory usage
    },
    responseTime: {
      warning: 500,  // 500ms response time
      critical: 1000  // 1000ms response time
    },
    errorRate: {
      warning: 1.0,  // 1% error rate
      critical: 5.0   // 5% error rate
    },
    throughput: {
      warning: 1000,  // 1000 requests per minute
      critical: 5000   // 5000 requests per minute
    }
  },
  
  // Comparison settings
  comparisonConfig: {
    minSamples: 5, // Minimum samples to consider valid comparison
    maxDegradation: {
      cpu: 15,        // Allow up to 15% more CPU usage
      memory: 20,     // Allow up to 20% more memory usage
      responseTime: 25, // Allow up to 25% slower response times
      errorRate: 0.5,  // Allow up to 0.5% higher error rate
    }
  }
};

// Ensure metrics directory exists
if (!fs.existsSync(CONFIG.metricsDir)) {
  fs.mkdirSync(CONFIG.metricsDir, { recursive: true });
}

/**
 * Collect system metrics
 * @returns {Object} System metrics
 */
function collectSystemMetrics() {
  try {
    const cpus = os.cpus();
    const cpuUsage = calculateCpuUsage(cpus);
    
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const memoryUsage = ((totalMemory - freeMemory) / totalMemory) * 100;
    
    const loadAvg = os.loadavg();
    
    return {
      timestamp: new Date().toISOString(),
      cpu: {
        usage: cpuUsage,
        loadAvg: loadAvg,
        cores: cpus.length
      },
      memory: {
        total: totalMemory,
        free: freeMemory,
        usage: memoryUsage
      },
      uptime: os.uptime()
    };
  } catch (error) {
    console.error('Error collecting system metrics:', error);
    return {
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
}

/**
 * Calculate CPU usage percentage
 * @param {Array} cpus - CPU info from os.cpus()
 * @returns {number} CPU usage percentage
 */
function calculateCpuUsage(cpus) {
  // In a real implementation, this would track CPU usage over time
  // For this example, we'll return a random value to simulate CPU load
  return Math.min(95, Math.max(5, 30 + Math.random() * 40));
}

/**
 * Collect application metrics
 * @param {Object} options - Collection options
 * @returns {Object} Application metrics
 */
function collectApplicationMetrics(options = {}) {
  const { environment = 'production', target = 'current' } = options;
  
  try {
    // In a real implementation, this would collect metrics from the application
    // For this example, we'll generate synthetic metrics
    
    // Generate a somewhat realistic error rate, usually low but can spike
    const errorRate = Math.random() > 0.9 
      ? Math.random() * 8 // Occasional spike
      : Math.random() * 1.2; // Usually under 1.2%
    
    // Response time tends to follow a log-normal distribution
    const baseResponseTime = 120; // 120ms base
    const variability = Math.exp(Math.random() * 0.8); // Log-normal factor
    const p50ResponseTime = baseResponseTime * variability;
    const p95ResponseTime = p50ResponseTime * (1.5 + Math.random() * 0.5);
    const p99ResponseTime = p95ResponseTime * (1.3 + Math.random() * 0.8);
    
    // Throughput - requests per second
    const throughput = Math.floor(10 + Math.random() * 90);
    
    return {
      timestamp: new Date().toISOString(),
      environment,
      target,
      errorRate,
      responseTime: {
        p50: p50ResponseTime,
        p95: p95ResponseTime,
        p99: p99ResponseTime
      },
      throughput,
      activeUsers: Math.floor(throughput * (2 + Math.random() * 8)), // Rough estimate
      requestCount: Math.floor(throughput * 60), // Per minute
      status: errorRate > CONFIG.thresholds.errorRate.critical ? 'critical' :
              errorRate > CONFIG.thresholds.errorRate.warning ? 'warning' : 'healthy'
    };
  } catch (error) {
    console.error('Error collecting application metrics:', error);
    return {
      timestamp: new Date().toISOString(),
      environment,
      target,
      error: error.message
    };
  }
}

/**
 * Store metrics in metrics store
 * @param {Object} metrics - Metrics to store
 * @param {Object} options - Storage options
 * @returns {boolean} Success status
 */
function storeMetrics(metrics, options = {}) {
  const { environment = 'production', target = 'current' } = options;
  
  try {
    // Create environment and target directories if needed
    const envDir = path.join(CONFIG.metricsDir, environment);
    if (!fs.existsSync(envDir)) {
      fs.mkdirSync(envDir, { recursive: true });
    }
    
    const targetDir = path.join(envDir, target);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Generate filename based on timestamp
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = `metrics-${timestamp}.json`;
    const filePath = path.join(targetDir, filename);
    
    // Write metrics to file
    fs.writeFileSync(filePath, JSON.stringify(metrics, null, 2));
    
    // Update the latest.json file
    fs.writeFileSync(
      path.join(targetDir, 'latest.json'),
      JSON.stringify(metrics, null, 2)
    );
    
    // Maintain history limit by removing old files
    const files = fs.readdirSync(targetDir)
      .filter(file => file.startsWith('metrics-') && file.endsWith('.json'))
      .sort();
    
    if (files.length > CONFIG.historyLimit) {
      const filesToRemove = files.slice(0, files.length - CONFIG.historyLimit);
      for (const file of filesToRemove) {
        fs.unlinkSync(path.join(targetDir, file));
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error storing metrics:', error);
    return false;
  }
}

/**
 * Get the latest metrics for a target
 * @param {Object} options - Options 
 * @returns {Object|null} Latest metrics or null if not found
 */
function getLatestMetrics(options = {}) {
  const { environment = 'production', target = 'current' } = options;
  
  try {
    const latestPath = path.join(CONFIG.metricsDir, environment, target, 'latest.json');
    if (fs.existsSync(latestPath)) {
      return JSON.parse(fs.readFileSync(latestPath, 'utf8'));
    }
  } catch (error) {
    console.error('Error getting latest metrics:', error);
  }
  
  return null;
}

/**
 * Get historical metrics for a target
 * @param {Object} options - Options
 * @returns {Array} Array of metrics objects
 */
function getHistoricalMetrics(options = {}) {
  const { 
    environment = 'production', 
    target = 'current',
    limit = CONFIG.historyLimit
  } = options;
  
  try {
    const targetDir = path.join(CONFIG.metricsDir, environment, target);
    if (!fs.existsSync(targetDir)) {
      return [];
    }
    
    const files = fs.readdirSync(targetDir)
      .filter(file => file.startsWith('metrics-') && file.endsWith('.json'))
      .sort()
      .slice(-limit);
    
    return files.map(file => {
      try {
        return JSON.parse(fs.readFileSync(path.join(targetDir, file), 'utf8'));
      } catch (e) {
        console.warn(`Error reading metrics file ${file}:`, e);
        return null;
      }
    }).filter(Boolean);
  } catch (error) {
    console.error('Error getting historical metrics:', error);
    return [];
  }
}

/**
 * Compare metrics between two targets
 * @param {Object} options - Comparison options
 * @returns {Object} Comparison results
 */
function compareMetrics(options = {}) {
  const {
    environment = 'production',
    baseTarget = 'stable',
    compareTarget = 'canary',
    limit = CONFIG.comparisonConfig.minSamples
  } = options;
  
  try {
    // Get historical metrics for both targets
    const baseMetrics = getHistoricalMetrics({
      environment,
      target: baseTarget,
      limit
    });
    
    const compareMetrics = getHistoricalMetrics({
      environment,
      target: compareTarget,
      limit
    });
    
    // Check if we have enough data
    if (baseMetrics.length < CONFIG.comparisonConfig.minSamples) {
      return {
        valid: false,
        reason: `Not enough samples for base target (${baseTarget}): ${baseMetrics.length} < ${CONFIG.comparisonConfig.minSamples}`
      };
    }
    
    if (compareMetrics.length < CONFIG.comparisonConfig.minSamples) {
      return {
        valid: false,
        reason: `Not enough samples for compare target (${compareTarget}): ${compareMetrics.length} < ${CONFIG.comparisonConfig.minSamples}`
      };
    }
    
    // Calculate averages for base metrics
    const baseAvg = calculateAverages(baseMetrics);
    
    // Calculate averages for compare metrics
    const compareAvg = calculateAverages(compareMetrics);
    
    // Calculate comparison results
    const comparison = {
      timestamp: new Date().toISOString(),
      valid: true,
      baseTarget,
      compareTarget,
      sampleCounts: {
        base: baseMetrics.length,
        compare: compareMetrics.length
      },
      metrics: {}
    };
    
    // Compare error rates
    comparison.metrics.errorRate = compareMetricValues(
      baseAvg.errorRate,
      compareAvg.errorRate,
      'errorRate',
      CONFIG.comparisonConfig.maxDegradation.errorRate
    );
    
    // Compare response times
    comparison.metrics.responseTime = {
      p50: compareMetricValues(
        baseAvg.responseTime.p50,
        compareAvg.responseTime.p50,
        'responseTime',
        CONFIG.comparisonConfig.maxDegradation.responseTime
      ),
      p95: compareMetricValues(
        baseAvg.responseTime.p95,
        compareAvg.responseTime.p95,
        'responseTime',
        CONFIG.comparisonConfig.maxDegradation.responseTime
      ),
      p99: compareMetricValues(
        baseAvg.responseTime.p99,
        compareAvg.responseTime.p99,
        'responseTime',
        CONFIG.comparisonConfig.maxDegradation.responseTime
      )
    };
    
    // Compare throughput
    comparison.metrics.throughput = {
      value: compareAvg.throughput,
      baseline: baseAvg.throughput,
      change: calculatePercentageChange(baseAvg.throughput, compareAvg.throughput),
      evaluation: 'neutral' // Throughput can go up or down depending on load
    };
    
    // Overall evaluation
    comparison.passed = !Object.values(comparison.metrics)
      .some(metric => {
        // Handle nested metrics like responseTime
        if (metric.evaluation) {
          return metric.evaluation === 'degraded';
        }
        
        // Handle nested structures
        if (typeof metric === 'object') {
          return Object.values(metric).some(m => m.evaluation === 'degraded');
        }
        
        return false;
      });
    
    return comparison;
  } catch (error) {
    console.error('Error comparing metrics:', error);
    return {
      valid: false,
      reason: `Error comparing metrics: ${error.message}`
    };
  }
}

/**
 * Calculate average metrics from a set of metrics
 * @param {Array} metrics - Array of metrics objects
 * @returns {Object} Average metrics
 */
function calculateAverages(metrics) {
  const sum = {
    errorRate: 0,
    responseTime: {
      p50: 0,
      p95: 0,
      p99: 0
    },
    throughput: 0,
    requestCount: 0
  };
  
  for (const metric of metrics) {
    sum.errorRate += metric.errorRate || 0;
    sum.responseTime.p50 += metric.responseTime?.p50 || 0;
    sum.responseTime.p95 += metric.responseTime?.p95 || 0;
    sum.responseTime.p99 += metric.responseTime?.p99 || 0;
    sum.throughput += metric.throughput || 0;
    sum.requestCount += metric.requestCount || 0;
  }
  
  const count = metrics.length;
  
  return {
    errorRate: sum.errorRate / count,
    responseTime: {
      p50: sum.responseTime.p50 / count,
      p95: sum.responseTime.p95 / count,
      p99: sum.responseTime.p99 / count
    },
    throughput: sum.throughput / count,
    requestCount: sum.requestCount / count
  };
}

/**
 * Compare metric values and evaluate the change
 * @param {number} baseline - Baseline value
 * @param {number} current - Current value
 * @param {string} metricType - Type of metric
 * @param {number} maxDegradation - Maximum allowed degradation percentage
 * @returns {Object} Comparison result
 */
function compareMetricValues(baseline, current, metricType, maxDegradation) {
  const percentChange = calculatePercentageChange(baseline, current);
  
  let evaluation = 'neutral';
  
  // For metrics where lower is better (error rate, response time)
  if (metricType === 'errorRate' || metricType === 'responseTime') {
    if (current > baseline) {
      // Degradation
      evaluation = percentChange > maxDegradation ? 'degraded' : 'acceptable';
    } else {
      // Improvement
      evaluation = 'improved';
    }
  }
  // For metrics where higher is better (throughput in some cases)
  else if (metricType === 'throughput') {
    if (current < baseline) {
      // Degradation
      const absDegradation = Math.abs(percentChange);
      evaluation = absDegradation > maxDegradation ? 'degraded' : 'acceptable';
    } else {
      // Improvement
      evaluation = 'improved';
    }
  }
  
  return {
    value: current,
    baseline,
    change: percentChange,
    evaluation
  };
}

/**
 * Calculate percentage change between two values
 * @param {number} baseline - Baseline value
 * @param {number} current - Current value
 * @returns {number} Percentage change
 */
function calculatePercentageChange(baseline, current) {
  if (baseline === 0) return current === 0 ? 0 : 100;
  return ((current - baseline) / baseline) * 100;
}

/**
 * Run a metrics collection and store the results
 * @param {Object} options - Collection options
 * @returns {Object} Collected metrics
 */
function runMetricsCollection(options = {}) {
  console.log(`Collecting metrics for ${options.environment || 'production'}/${options.target || 'current'}...`);
  
  // Collect system metrics
  const systemMetrics = collectSystemMetrics();
  
  // Collect application metrics
  const appMetrics = collectApplicationMetrics(options);
  
  // Combine metrics
  const fullMetrics = {
    ...appMetrics,
    system: systemMetrics
  };
  
  // Store metrics
  const stored = storeMetrics(fullMetrics, options);
  if (stored) {
    console.log('Metrics stored successfully.');
  }
  
  return fullMetrics;
}

/**
 * Run a metrics comparison between two targets
 * @param {Object} options - Comparison options
 * @returns {Object} Comparison results
 */
function runMetricsComparison(options = {}) {
  console.log(`Comparing metrics: ${options.baseTarget || 'stable'} vs ${options.compareTarget || 'canary'}...`);
  
  const comparison = compareMetrics(options);
  
  if (!comparison.valid) {
    console.log(`Comparison invalid: ${comparison.reason}`);
    return comparison;
  }
  
  console.log('Comparison results:');
  console.log(`- Error Rate: ${comparison.metrics.errorRate.change.toFixed(2)}% (${comparison.metrics.errorRate.evaluation})`);
  console.log(`- Response Time (p95): ${comparison.metrics.responseTime.p95.change.toFixed(2)}% (${comparison.metrics.responseTime.p95.evaluation})`);
  console.log(`- Throughput: ${comparison.metrics.throughput.change.toFixed(2)}% (${comparison.metrics.throughput.evaluation})`);
  console.log(`- Overall: ${comparison.passed ? 'PASSED' : 'FAILED'}`);
  
  return comparison;
}

/**
 * Start continuous monitoring
 * @param {Object} options - Monitoring options
 */
function startContinuousMonitoring(options = {}) {
  console.log(`Starting continuous monitoring for ${options.environment || 'production'}/${options.target || 'current'}...`);
  console.log(`Collection interval: ${CONFIG.collectionInterval} seconds`);
  
  // Run initial collection
  runMetricsCollection(options);
  
  // Set interval for continuous collection
  const intervalId = setInterval(() => {
    runMetricsCollection(options);
  }, CONFIG.collectionInterval * 1000);
  
  // Return function to stop monitoring
  return () => {
    console.log('Stopping continuous monitoring...');
    clearInterval(intervalId);
  };
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];
const environment = args[1] || 'production';
const target = args[2] || 'current';

// Command handler
(async () => {
  try {
    switch (command) {
      case 'collect':
        // Collect and store metrics
        runMetricsCollection({ environment, target });
        break;
        
      case 'monitor':
        // Start continuous monitoring
        startContinuousMonitoring({ environment, target });
        // Keep process running
        process.stdin.resume();
        break;
        
      case 'compare':
        // Compare metrics between targets
        const baseTarget = args[2] || 'stable';
        const compareTarget = args[3] || 'canary';
        runMetricsComparison({
          environment,
          baseTarget,
          compareTarget
        });
        break;
        
      case 'latest':
        // Show latest metrics
        const latestMetrics = getLatestMetrics({ environment, target });
        if (latestMetrics) {
          console.log(JSON.stringify(latestMetrics, null, 2));
        } else {
          console.log(`No metrics found for ${environment}/${target}`);
        }
        break;
        
      default:
        console.log(`
Performance Monitoring System

Usage:
  node monitoring.js <command> [environment] [target]

Commands:
  collect [env] [target]          Collect and store metrics
  monitor [env] [target]          Start continuous monitoring
  compare [env] [base] [compare]  Compare metrics between targets
  latest [env] [target]           Show latest metrics

Examples:
  node monitoring.js collect production canary
  node monitoring.js monitor staging blue
  node monitoring.js compare production stable canary
  node monitoring.js latest production green
        `);
        break;
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();

// Export functions for use in other modules
module.exports = {
  collectSystemMetrics,
  collectApplicationMetrics,
  getLatestMetrics,
  getHistoricalMetrics,
  compareMetrics,
  runMetricsCollection,
  runMetricsComparison,
  startContinuousMonitoring
};