#!/usr/bin/env node

/**
 * SwissKnife Documentation Dashboard Generator
 * Creates an interactive HTML dashboard for real-time documentation monitoring
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DashboardGenerator {
  constructor() {
    this.docsDir = path.join(__dirname, '../../docs');
    this.dashboardPath = path.join(this.docsDir, 'automation', 'dashboard.html');
    this.dataPath = path.join(this.docsDir, 'automation', 'dashboard-data.json');
  }

  async generateDashboard() {
    console.log('📊 Generating interactive documentation dashboard...');
    
    // Collect all analytics data
    const dashboardData = await this.collectDashboardData();
    
    // Generate HTML dashboard
    const htmlContent = this.generateDashboardHTML(dashboardData);
    
    // Save dashboard files
    await fs.writeFile(this.dashboardPath, htmlContent);
    await fs.writeFile(this.dataPath, JSON.stringify(dashboardData, null, 2));
    
    console.log(`📊 Dashboard generated: ${this.dashboardPath}`);
    console.log(`📊 Dashboard data: ${this.dataPath}`);
    
    return {
      dashboardPath: this.dashboardPath,
      dataPath: this.dataPath,
      data: dashboardData
    };
  }

  async collectDashboardData() {
    const data = {
      timestamp: new Date().toISOString(),
      summary: {},
      analytics: {},
      performance: {},
      linkValidation: {},
      screenshots: {},
      trends: []
    };

    try {
      // Load analytics data
      const analyticsFile = path.join(this.docsDir, 'automation', 'analytics-data.json');
      const analyticsContent = await fs.readFile(analyticsFile, 'utf-8');
      const analytics = JSON.parse(analyticsContent);
      data.analytics = analytics[analytics.length - 1] || {};

      // Load performance data
      const performanceFile = path.join(this.docsDir, 'automation', 'performance-metrics.json');
      const performanceContent = await fs.readFile(performanceFile, 'utf-8');
      const performance = JSON.parse(performanceContent);
      data.performance = performance[performance.length - 1] || {};

      // Load link validation data
      const linkValidationFile = path.join(this.docsDir, 'automation', 'link-validation-data.json');
      const linkContent = await fs.readFile(linkValidationFile, 'utf-8');
      data.linkValidation = JSON.parse(linkContent);

      // Load screenshot data
      const screenshotFile = path.join(this.docsDir, 'automation', 'screenshot-data.json');
      const screenshotContent = await fs.readFile(screenshotFile, 'utf-8');
      data.screenshots = JSON.parse(screenshotContent);

      // Calculate summary
      data.summary = this.calculateSummary(data);

      // Calculate trends (last 10 runs)
      data.trends = analytics.slice(-10).map(entry => ({
        timestamp: entry.timestamp,
        qualityScore: entry.quality?.overallScore || 0,
        totalFiles: entry.content?.totalFiles || 0,
        brokenLinks: entry.content?.brokenReferences || 0
      }));

    } catch (error) {
      console.warn(`⚠️ Could not load some dashboard data: ${error.message}`);
    }

    return data;
  }

  calculateSummary(data) {
    const analytics = data.analytics;
    const performance = data.performance;
    
    return {
      qualityScore: analytics.quality?.overallScore || 0,
      qualityGrade: this.getQualityGrade(analytics.quality?.overallScore || 0),
      totalFiles: analytics.content?.totalFiles || 0,
      brokenLinks: data.linkValidation.summary?.brokenLinks || 0,
      missingScreenshots: data.screenshots.summary?.totalMissing || 0,
      generationTime: performance.documentation?.generationTime || 0,
      lastUpdate: analytics.timestamp || new Date().toISOString(),
      status: this.calculateOverallStatus(data)
    };
  }

  getQualityGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  calculateOverallStatus(data) {
    const qualityScore = data.analytics.quality?.overallScore || 0;
    const brokenLinks = data.linkValidation.summary?.brokenLinks || 0;
    const missingScreenshots = data.screenshots.summary?.totalMissing || 0;

    if (qualityScore >= 90 && brokenLinks === 0 && missingScreenshots === 0) {
      return 'excellent';
    } else if (qualityScore >= 70 && brokenLinks <= 10 && missingScreenshots <= 5) {
      return 'good';
    } else if (qualityScore >= 50) {
      return 'needs-improvement';
    } else {
      return 'critical';
    }
  }

  generateDashboardHTML(data) {
    const { summary, analytics, performance, linkValidation, screenshots, trends } = data;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SwissKnife Documentation Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            line-height: 1.6;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            background: linear-gradient(45deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .header p {
            color: #666;
            font-size: 1.1em;
        }
        
        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 25px;
            margin-bottom: 30px;
        }
        
        .card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }
        
        .card h3 {
            font-size: 1.3em;
            margin-bottom: 20px;
            color: #333;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .metric {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 10px;
            margin-bottom: 10px;
        }
        
        .metric:last-child {
            margin-bottom: 0;
        }
        
        .metric-label {
            font-weight: 500;
            color: #666;
        }
        
        .metric-value {
            font-weight: bold;
            font-size: 1.1em;
        }
        
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-left: 10px;
        }
        
        .status-excellent { background-color: #28a745; }
        .status-good { background-color: #17a2b8; }
        .status-needs-improvement { background-color: #ffc107; }
        .status-critical { background-color: #dc3545; }
        
        .quality-score {
            text-align: center;
            padding: 30px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border-radius: 15px;
            margin-bottom: 20px;
        }
        
        .quality-score h2 {
            font-size: 3em;
            margin-bottom: 10px;
        }
        
        .quality-grade {
            font-size: 1.5em;
            opacity: 0.9;
        }
        
        .chart-container {
            position: relative;
            height: 300px;
            margin: 20px 0;
        }
        
        .progress-bar {
            width: 100%;
            height: 20px;
            background-color: #e9ecef;
            border-radius: 10px;
            overflow: hidden;
            margin: 10px 0;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #28a745, #20c997);
            transition: width 0.5s ease;
            border-radius: 10px;
        }
        
        .recommendations {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 10px;
            padding: 20px;
            margin-top: 20px;
        }
        
        .recommendation-item {
            padding: 10px;
            margin: 5px 0;
            border-left: 4px solid #ffc107;
            background: rgba(255, 193, 7, 0.1);
            border-radius: 5px;
        }
        
        .timestamp {
            color: #666;
            font-size: 0.9em;
            text-align: center;
            margin-top: 30px;
            padding: 20px;
            background: rgba(255, 255, 255, 0.5);
            border-radius: 10px;
        }
        
        .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 25px;
        }
        
        @media (max-width: 768px) {
            .grid-2 {
                grid-template-columns: 1fr;
            }
            
            .header h1 {
                font-size: 2em;
            }
            
            .quality-score h2 {
                font-size: 2.5em;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 SwissKnife Documentation Dashboard</h1>
            <p>Comprehensive real-time monitoring and analytics for SwissKnife's documentation system</p>
        </div>

        <!-- Quality Overview -->
        <div class="quality-score">
            <h2>${summary.qualityScore}/100</h2>
            <div class="quality-grade">Grade ${summary.qualityGrade} - ${this.getStatusText(summary.status)}</div>
        </div>

        <!-- Main Dashboard Grid -->
        <div class="dashboard-grid">
            <!-- Content Overview -->
            <div class="card">
                <h3>📚 Content Overview</h3>
                <div class="metric">
                    <span class="metric-label">Total Files</span>
                    <span class="metric-value">${analytics.content?.totalFiles || 0}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Total Words</span>
                    <span class="metric-value">${(analytics.content?.totalWords || 0).toLocaleString()}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Average Length</span>
                    <span class="metric-value">${analytics.content?.averageLength || 0} words</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Duplicate Content</span>
                    <span class="metric-value" style="color: ${(analytics.content?.duplicateContent || 0) === 0 ? '#28a745' : '#dc3545'}">${analytics.content?.duplicateContent || 0}</span>
                </div>
            </div>

            <!-- Quality Metrics -->
            <div class="card">
                <h3>🎯 Quality Metrics</h3>
                <div class="metric">
                    <span class="metric-label">Completeness</span>
                    <span class="metric-value">${analytics.quality?.completeness || 0}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${analytics.quality?.completeness || 0}%"></div>
                </div>
                <div class="metric">
                    <span class="metric-label">Consistency</span>
                    <span class="metric-value">${analytics.quality?.consistency || 0}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${analytics.quality?.consistency || 0}%"></div>
                </div>
                <div class="metric">
                    <span class="metric-label">Accuracy</span>
                    <span class="metric-value">${analytics.quality?.accuracy || 0}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${analytics.quality?.accuracy || 0}%"></div>
                </div>
            </div>

            <!-- Link Validation -->
            <div class="card">
                <h3>🔗 Link Validation</h3>
                <div class="metric">
                    <span class="metric-label">Total Links</span>
                    <span class="metric-value">${linkValidation.summary?.totalLinks || 0}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Broken Links</span>
                    <span class="metric-value" style="color: ${(linkValidation.summary?.brokenLinks || 0) === 0 ? '#28a745' : '#dc3545'}">${linkValidation.summary?.brokenLinks || 0}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Repair Suggestions</span>
                    <span class="metric-value">${linkValidation.summary?.repairSuggestions || 0}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Validation Status</span>
                    <span class="metric-value" style="color: ${linkValidation.summary?.validationStatus === 'PASS' ? '#28a745' : '#dc3545'}">${linkValidation.summary?.validationStatus || 'Unknown'}</span>
                </div>
            </div>

            <!-- Screenshot Management -->
            <div class="card">
                <h3>📸 Screenshot Coverage</h3>
                <div class="metric">
                    <span class="metric-label">Total References</span>
                    <span class="metric-value">${screenshots.summary?.totalReferences || 0}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Missing Screenshots</span>
                    <span class="metric-value" style="color: ${(screenshots.summary?.totalMissing || 0) === 0 ? '#28a745' : '#dc3545'}">${screenshots.summary?.totalMissing || 0}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Available Screenshots</span>
                    <span class="metric-value">${screenshots.summary?.availableScreenshots || 0}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Coverage</span>
                    <span class="metric-value">${this.calculateCoverage(screenshots)}%</span>
                </div>
            </div>

            <!-- Performance Metrics -->
            <div class="card">
                <h3>⚡ Performance</h3>
                <div class="metric">
                    <span class="metric-label">Generation Time</span>
                    <span class="metric-value">${performance.documentation?.generationTime || 0}ms</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Memory Usage</span>
                    <span class="metric-value">${Math.round((performance.performance?.memoryUsage?.heapUsed || 0) / 1024 / 1024)}MB</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Dependencies</span>
                    <span class="metric-value">${performance.dependencies?.totalDependencies || 0}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Performance Grade</span>
                    <span class="metric-value">${this.calculatePerformanceGrade(performance)}</span>
                </div>
            </div>

            <!-- System Status -->
            <div class="card">
                <h3>🎮 System Status</h3>
                <div class="metric">
                    <span class="metric-label">Overall Status</span>
                    <span class="metric-value">
                        ${this.getStatusText(summary.status)}
                        <span class="status-indicator status-${summary.status}"></span>
                    </span>
                </div>
                <div class="metric">
                    <span class="metric-label">Last Update</span>
                    <span class="metric-value">${new Date(summary.lastUpdate).toLocaleString()}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Applications</span>
                    <span class="metric-value">27 documented</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Auto-repairs</span>
                    <span class="metric-value">${linkValidation.summary?.repairSuggestions || 0} applied</span>
                </div>
            </div>
        </div>

        <!-- Quality Trend Chart -->
        <div class="card">
            <h3>📈 Quality Trends</h3>
            <div class="chart-container">
                <canvas id="qualityTrendChart"></canvas>
            </div>
        </div>

        <!-- Recommendations -->
        ${this.generateRecommendationsHTML(linkValidation, screenshots, analytics)}

        <div class="timestamp">
            Dashboard generated on ${new Date(data.timestamp).toLocaleString()}<br>
            Auto-refresh available via CI/CD pipeline
        </div>
    </div>

    <script>
        // Quality Trend Chart
        const ctx = document.getElementById('qualityTrendChart').getContext('2d');
        const trendData = ${JSON.stringify(trends)};
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: trendData.map(d => new Date(d.timestamp).toLocaleDateString()),
                datasets: [{
                    label: 'Quality Score',
                    data: trendData.map(d => d.qualityScore),
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });

        // Auto-refresh every 5 minutes
        setTimeout(() => {
            location.reload();
        }, 300000);
    </script>
</body>
</html>`;
  }

  calculateCoverage(screenshots) {
    const total = screenshots.summary?.totalReferences || 0;
    const missing = screenshots.summary?.totalMissing || 0;
    if (total === 0) return 100;
    return Math.round(((total - missing) / total) * 100);
  }

  calculatePerformanceGrade(performance) {
    const genTime = performance.documentation?.generationTime || 0;
    const memUsage = (performance.performance?.memoryUsage?.heapUsed || 0) / 1024 / 1024;
    
    if (genTime < 1000 && memUsage < 50) return 'A';
    if (genTime < 5000 && memUsage < 100) return 'B';
    if (genTime < 10000 && memUsage < 200) return 'C';
    return 'D';
  }

  getStatusText(status) {
    const statusMap = {
      'excellent': 'Excellent',
      'good': 'Good',
      'needs-improvement': 'Needs Improvement',
      'critical': 'Critical'
    };
    return statusMap[status] || 'Unknown';
  }

  generateRecommendationsHTML(linkValidation, screenshots, analytics) {
    const recommendations = [];

    if (linkValidation.summary?.brokenLinks > 0) {
      recommendations.push(`Fix ${linkValidation.summary.brokenLinks} broken links for improved accuracy`);
    }

    if (screenshots.summary?.totalMissing > 0) {
      recommendations.push(`Generate ${screenshots.summary.totalMissing} missing screenshots`);
    }

    if ((analytics.quality?.completeness || 0) < 90) {
      recommendations.push('Expand documentation content for better completeness');
    }

    if (recommendations.length === 0) {
      recommendations.push('Documentation quality is excellent! Continue monitoring for any regressions.');
    }

    return `
        <div class="recommendations">
            <h3>🎯 Recommendations</h3>
            ${recommendations.map(rec => `<div class="recommendation-item">${rec}</div>`).join('')}
        </div>`;
  }
}

// Main execution
async function main() {
  const generator = new DashboardGenerator();
  
  try {
    const result = await generator.generateDashboard();
    
    console.log('\n📊 Dashboard Generation Results:');
    console.log(`Dashboard Path: ${result.dashboardPath}`);
    console.log(`Data Path: ${result.dataPath}`);
    console.log(`Quality Score: ${result.data.summary.qualityScore}/100`);
    console.log(`Status: ${result.data.summary.status}`);
    
    console.log('\n✅ Interactive dashboard generated successfully!');
    console.log('📊 Open dashboard: docs/automation/dashboard.html');
    
    return result;
  } catch (error) {
    console.error('❌ Dashboard generation failed:', error);
    process.exit(1);
  }
}

// Export for use in other scripts
export { DashboardGenerator };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}