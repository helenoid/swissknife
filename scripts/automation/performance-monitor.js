#!/usr/bin/env node

/**
 * SwissKnife Documentation Performance Monitor
 * Tracks performance metrics for documentation generation and automation
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DocumentationPerformanceMonitor {
  constructor() {
    this.metricsFile = path.join(__dirname, '../../docs/automation/performance-metrics.json');
    this.reportFile = path.join(__dirname, '../../docs/automation/performance-report.md');
    this.startTime = Date.now();
    this.metrics = {
      timestamp: new Date().toISOString(),
      documentation: {
        totalApps: 0,
        generationTime: 0,
        averageAppTime: 0,
        filesGenerated: 0,
        totalSize: 0
      },
      screenshots: {
        totalScreenshots: 0,
        captureTime: 0,
        averageScreenshotTime: 0,
        totalImageSize: 0,
        failedCaptures: 0
      },
      dependencies: {
        analysisTime: 0,
        totalDependencies: 0,
        sharedServices: 0,
        priorityMatrix: {}
      },
      performance: {
        memoryUsage: process.memoryUsage(),
        cpuTime: process.cpuUsage(),
        nodeVersion: process.version,
        platform: process.platform
      }
    };
  }

  async startDocumentationGeneration() {
    console.log('📊 Starting performance monitoring for documentation generation...');
    this.documentationStartTime = Date.now();
  }

  async endDocumentationGeneration(applicationsCount, filesGenerated) {
    const endTime = Date.now();
    const generationTime = endTime - this.documentationStartTime;
    
    this.metrics.documentation.totalApps = applicationsCount;
    this.metrics.documentation.generationTime = generationTime;
    this.metrics.documentation.averageAppTime = generationTime / applicationsCount;
    this.metrics.documentation.filesGenerated = filesGenerated;
    
    // Calculate total size of generated files
    try {
      const docsDir = path.join(__dirname, '../../docs/applications');
      const files = await fs.readdir(docsDir);
      let totalSize = 0;
      
      for (const file of files) {
        if (file.endsWith('.md')) {
          const stats = await fs.stat(path.join(docsDir, file));
          totalSize += stats.size;
        }
      }
      
      this.metrics.documentation.totalSize = totalSize;
    } catch (error) {
      console.warn('⚠️ Could not calculate documentation size:', error.message);
    }
    
    console.log(`✅ Documentation generation completed in ${generationTime}ms`);
  }

  async startScreenshotCapture() {
    this.screenshotStartTime = Date.now();
    console.log('📷 Starting screenshot capture monitoring...');
  }

  async recordScreenshotCapture(success, imageSize = 0) {
    if (success) {
      this.metrics.screenshots.totalScreenshots++;
      this.metrics.screenshots.totalImageSize += imageSize;
    } else {
      this.metrics.screenshots.failedCaptures++;
    }
  }

  async endScreenshotCapture() {
    const endTime = Date.now();
    const captureTime = endTime - this.screenshotStartTime;
    
    this.metrics.screenshots.captureTime = captureTime;
    this.metrics.screenshots.averageScreenshotTime = 
      this.metrics.screenshots.totalScreenshots > 0 
        ? captureTime / this.metrics.screenshots.totalScreenshots 
        : 0;
    
    console.log(`📷 Screenshot capture completed in ${captureTime}ms`);
  }

  async analyzeDependencies(applications) {
    const startTime = Date.now();
    console.log('🔍 Analyzing backend dependencies...');
    
    const dependencyMap = new Map();
    const sharedServices = new Set();
    
    applications.forEach(app => {
      app.backendDependencies.forEach(dep => {
        if (!dependencyMap.has(dep)) {
          dependencyMap.set(dep, []);
        }
        dependencyMap.get(dep).push(app);
        
        if (dependencyMap.get(dep).length > 1) {
          sharedServices.add(dep);
        }
      });
    });
    
    // Calculate priority matrix
    const priorityMatrix = {
      high: 0,    // 3+ applications
      medium: 0,  // 2 applications  
      low: 0      // 1 application
    };
    
    dependencyMap.forEach((apps, dependency) => {
      if (apps.length >= 3) priorityMatrix.high++;
      else if (apps.length === 2) priorityMatrix.medium++;
      else priorityMatrix.low++;
    });
    
    const analysisTime = Date.now() - startTime;
    
    this.metrics.dependencies.analysisTime = analysisTime;
    this.metrics.dependencies.totalDependencies = dependencyMap.size;
    this.metrics.dependencies.sharedServices = sharedServices.size;
    this.metrics.dependencies.priorityMatrix = priorityMatrix;
    
    console.log(`🔍 Dependency analysis completed in ${analysisTime}ms`);
  }

  async recordSystemMetrics() {
    this.metrics.performance.memoryUsage = process.memoryUsage();
    this.metrics.performance.cpuTime = process.cpuUsage();
    
    // Get system information if available
    try {
      const os = await import('os');
      this.metrics.performance.totalMemory = os.totalmem();
      this.metrics.performance.freeMemory = os.freemem();
      this.metrics.performance.cpuCount = os.cpus().length;
      this.metrics.performance.loadAverage = os.loadavg();
    } catch (error) {
      console.warn('⚠️ Could not collect system metrics:', error.message);
    }
  }

  async saveMetrics() {
    try {
      await fs.mkdir(path.dirname(this.metricsFile), { recursive: true });
      
      // Load existing metrics for historical data
      let historicalMetrics = [];
      try {
        const existing = await fs.readFile(this.metricsFile, 'utf8');
        historicalMetrics = JSON.parse(existing);
      } catch (error) {
        // File doesn't exist yet, start fresh
      }
      
      // Add current metrics to history
      historicalMetrics.push(this.metrics);
      
      // Keep only last 100 runs
      if (historicalMetrics.length > 100) {
        historicalMetrics = historicalMetrics.slice(-100);
      }
      
      await fs.writeFile(this.metricsFile, JSON.stringify(historicalMetrics, null, 2));
      console.log(`📊 Performance metrics saved to ${this.metricsFile}`);
      
      // Generate performance report
      await this.generatePerformanceReport(historicalMetrics);
      
    } catch (error) {
      console.error('❌ Failed to save metrics:', error);
    }
  }

  async generatePerformanceReport(historicalMetrics) {
    const latestMetrics = historicalMetrics[historicalMetrics.length - 1];
    const previousMetrics = historicalMetrics.length > 1 ? historicalMetrics[historicalMetrics.length - 2] : null;
    
    // Calculate trends
    const calculateTrend = (current, previous) => {
      if (!previous) return 'N/A';
      const change = ((current - previous) / previous) * 100;
      const arrow = change > 0 ? '📈' : change < 0 ? '📉' : '➡️';
      return `${arrow} ${Math.abs(change).toFixed(1)}%`;
    };

    const report = `# SwissKnife Documentation Performance Report

**Generated**: ${new Date().toISOString()}
**Total Runs Analyzed**: ${historicalMetrics.length}

## 📊 Latest Performance Summary

### Documentation Generation
| Metric | Value | Trend |
|--------|--------|-------|
| **Total Applications** | ${latestMetrics.documentation.totalApps} | ${previousMetrics ? calculateTrend(latestMetrics.documentation.totalApps, previousMetrics.documentation.totalApps) : 'N/A'} |
| **Generation Time** | ${latestMetrics.documentation.generationTime}ms | ${previousMetrics ? calculateTrend(latestMetrics.documentation.generationTime, previousMetrics.documentation.generationTime) : 'N/A'} |
| **Avg Time/App** | ${latestMetrics.documentation.averageAppTime.toFixed(1)}ms | ${previousMetrics ? calculateTrend(latestMetrics.documentation.averageAppTime, previousMetrics.documentation.averageAppTime) : 'N/A'} |
| **Files Generated** | ${latestMetrics.documentation.filesGenerated} | ${previousMetrics ? calculateTrend(latestMetrics.documentation.filesGenerated, previousMetrics.documentation.filesGenerated) : 'N/A'} |
| **Total Size** | ${(latestMetrics.documentation.totalSize / 1024).toFixed(1)} KB | ${previousMetrics ? calculateTrend(latestMetrics.documentation.totalSize, previousMetrics.documentation.totalSize) : 'N/A'} |

### Screenshot Capture
| Metric | Value | Trend |
|--------|--------|-------|
| **Total Screenshots** | ${latestMetrics.screenshots.totalScreenshots} | ${previousMetrics ? calculateTrend(latestMetrics.screenshots.totalScreenshots, previousMetrics.screenshots.totalScreenshots) : 'N/A'} |
| **Capture Time** | ${latestMetrics.screenshots.captureTime}ms | ${previousMetrics ? calculateTrend(latestMetrics.screenshots.captureTime, previousMetrics.screenshots.captureTime) : 'N/A'} |
| **Avg Time/Screenshot** | ${latestMetrics.screenshots.averageScreenshotTime.toFixed(1)}ms | ${previousMetrics ? calculateTrend(latestMetrics.screenshots.averageScreenshotTime, previousMetrics.screenshots.averageScreenshotTime) : 'N/A'} |
| **Failed Captures** | ${latestMetrics.screenshots.failedCaptures} | ${previousMetrics ? calculateTrend(latestMetrics.screenshots.failedCaptures, previousMetrics.screenshots.failedCaptures) : 'N/A'} |
| **Total Image Size** | ${(latestMetrics.screenshots.totalImageSize / 1024).toFixed(1)} KB | ${previousMetrics ? calculateTrend(latestMetrics.screenshots.totalImageSize, previousMetrics.screenshots.totalImageSize) : 'N/A'} |

### Dependency Analysis
| Metric | Value | Trend |
|--------|--------|-------|
| **Analysis Time** | ${latestMetrics.dependencies.analysisTime}ms | ${previousMetrics ? calculateTrend(latestMetrics.dependencies.analysisTime, previousMetrics.dependencies.analysisTime) : 'N/A'} |
| **Total Dependencies** | ${latestMetrics.dependencies.totalDependencies} | ${previousMetrics ? calculateTrend(latestMetrics.dependencies.totalDependencies, previousMetrics.dependencies.totalDependencies) : 'N/A'} |
| **Shared Services** | ${latestMetrics.dependencies.sharedServices} | ${previousMetrics ? calculateTrend(latestMetrics.dependencies.sharedServices, previousMetrics.dependencies.sharedServices) : 'N/A'} |
| **High Priority Deps** | ${latestMetrics.dependencies.priorityMatrix.high} | ${previousMetrics ? calculateTrend(latestMetrics.dependencies.priorityMatrix.high, previousMetrics.dependencies.priorityMatrix.high) : 'N/A'} |
| **Medium Priority Deps** | ${latestMetrics.dependencies.priorityMatrix.medium} | ${previousMetrics ? calculateTrend(latestMetrics.dependencies.priorityMatrix.medium, previousMetrics.dependencies.priorityMatrix.medium) : 'N/A'} |
| **Low Priority Deps** | ${latestMetrics.dependencies.priorityMatrix.low} | ${previousMetrics ? calculateTrend(latestMetrics.dependencies.priorityMatrix.low, previousMetrics.dependencies.priorityMatrix.low) : 'N/A'} |

## 📈 Historical Performance Trends

### Performance Over Time (Last 10 runs)
${this.generateHistoricalChart(historicalMetrics.slice(-10))}

### Performance Benchmarks
- **🎯 Target Generation Time**: < 5000ms (${latestMetrics.documentation.generationTime < 5000 ? '✅ PASS' : '❌ FAIL'})
- **🎯 Target Memory Usage**: < 100MB (${latestMetrics.performance.memoryUsage.heapUsed / 1024 / 1024 < 100 ? '✅ PASS' : '❌ FAIL'})
- **🎯 Target Avg App Time**: < 200ms (${latestMetrics.documentation.averageAppTime < 200 ? '✅ PASS' : '❌ FAIL'})
- **🎯 Target Failed Captures**: 0 (${latestMetrics.screenshots.failedCaptures === 0 ? '✅ PASS' : '❌ FAIL'})

## 🔧 Performance Optimization Recommendations

${this.generateOptimizationRecommendations(latestMetrics, previousMetrics)}

## 📊 Quality Metrics

### Documentation Quality Score
${this.calculateQualityScore(latestMetrics)}

---
*Report generated automatically by SwissKnife Documentation Performance Monitor*
*Metrics collected: ${latestMetrics.timestamp}*
`;

    await fs.writeFile(this.reportFile, report);
    console.log(`📊 Performance report generated: ${this.reportFile}`);
  }

  generateHistoricalChart(metrics) {
    if (metrics.length < 2) return 'Insufficient data for trends';
    
    const chart = metrics.map((metric, index) => {
      const genTime = metric.documentation.generationTime;
      const memUsage = Math.round(metric.performance.memoryUsage.heapUsed / 1024 / 1024);
      const timestamp = new Date(metric.timestamp).toLocaleDateString();
      return `${index + 1}. **${timestamp}** - Gen: ${genTime}ms, Mem: ${memUsage}MB`;
    }).join('\n');
    
    return chart;
  }

  generateOptimizationRecommendations(current, previous) {
    const recommendations = [];
    
    if (current.documentation.generationTime > 5000) {
      recommendations.push('🐌 **Slow Documentation Generation**: Consider parallel processing or template optimization');
    }
    
    if (current.performance.memoryUsage.heapUsed / 1024 / 1024 > 100) {
      recommendations.push('🐘 **High Memory Usage**: Implement streaming or reduce in-memory data structures');
    }
    
    if (current.screenshots.failedCaptures > 0) {
      recommendations.push('📷 **Screenshot Failures**: Check browser automation stability and selector reliability');
    }
    
    if (previous && current.documentation.generationTime > previous.documentation.generationTime * 1.2) {
      recommendations.push('📈 **Performance Regression**: Generation time increased by >20% since last run');
    }
    
    if (current.dependencies.sharedServices < current.dependencies.totalDependencies * 0.3) {
      recommendations.push('🔗 **Low Service Sharing**: Consider consolidating similar backend dependencies');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('✅ **Performance Optimal**: All metrics within acceptable ranges');
    }
    
    return recommendations.map(rec => `- ${rec}`).join('\n');
  }

  calculateQualityScore(metrics) {
    let score = 100;
    
    // Deduct points for performance issues
    if (metrics.documentation.generationTime > 5000) score -= 20;
    if (metrics.performance.memoryUsage.heapUsed / 1024 / 1024 > 100) score -= 15;
    if (metrics.screenshots.failedCaptures > 0) score -= (metrics.screenshots.failedCaptures * 10);
    if (metrics.documentation.averageAppTime > 200) score -= 10;
    
    // Add points for good performance
    if (metrics.documentation.generationTime < 2000) score += 5;
    if (metrics.screenshots.failedCaptures === 0) score += 10;
    
    const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';
    const emoji = score >= 90 ? '🏆' : score >= 80 ? '✅' : score >= 70 ? '⚠️' : '❌';
    
    return `**Overall Score: ${score}/100 (${grade})** ${emoji}`;
  }
}

export { DocumentationPerformanceMonitor };

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const monitor = new DocumentationPerformanceMonitor();
  
  // Example usage
  await monitor.startDocumentationGeneration();
  
  // Simulate documentation generation
  setTimeout(async () => {
    await monitor.endDocumentationGeneration(27, 30);
    await monitor.analyzeDependencies([]);
    await monitor.recordSystemMetrics();
    await monitor.saveMetrics();
  }, 1000);
}