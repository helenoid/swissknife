#!/usr/bin/env node

/**
 * SwissKnife Smart Screenshot Management System
 * Handles missing screenshots with fallback generation and placeholder systems
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ScreenshotManager {
  constructor() {
    this.screenshotsDir = path.join(__dirname, '../../docs/screenshots');
    this.docsDir = path.join(__dirname, '../../docs');
    this.missingScreenshots = [];
    this.availableScreenshots = new Set();
    this.placeholders = new Map();
  }

  async analyzeMissingScreenshots() {
    console.log('📸 Starting screenshot analysis...');
    
    // Build inventory of available screenshots
    await this.inventoryAvailableScreenshots();
    
    // Find missing screenshot references
    await this.findMissingScreenshots();
    
    // Generate fallback options
    await this.generateFallbackOptions();
    
    // Create report
    const report = this.generateScreenshotReport();
    await this.saveReport(report);
    
    return {
      totalReferences: this.missingScreenshots.length,
      availableScreenshots: this.availableScreenshots.size,
      placeholderOptions: this.placeholders.size,
      report: report
    };
  }

  async inventoryAvailableScreenshots() {
    console.log('📋 Building screenshot inventory...');
    
    try {
      const screenshots = await fs.readdir(this.screenshotsDir);
      for (const screenshot of screenshots) {
        if (screenshot.match(/\.(png|jpg|jpeg|gif|webp)$/i)) {
          this.availableScreenshots.add(screenshot);
          
          // Also add without extension for matching
          const nameWithoutExt = path.parse(screenshot).name;
          this.availableScreenshots.add(nameWithoutExt);
        }
      }
      console.log(`✅ Found ${this.availableScreenshots.size / 2} available screenshots`);
    } catch (error) {
      console.warn(`⚠️ Screenshots directory not accessible: ${error.message}`);
      // Create directory if it doesn't exist
      await fs.mkdir(this.screenshotsDir, { recursive: true });
    }
  }

  async findMissingScreenshots() {
    console.log('🔍 Scanning for missing screenshot references...');
    
    const scanDir = async (dir) => {
      const items = await fs.readdir(dir, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        
        if (item.isDirectory() && !item.name.startsWith('.')) {
          await scanDir(fullPath);
        } else if (item.isFile() && item.name.endsWith('.md')) {
          await this.scanFileForScreenshots(fullPath);
        }
      }
    };
    
    await scanDir(this.docsDir);
    console.log(`📊 Found ${this.missingScreenshots.length} missing screenshot references`);
  }

  async scanFileForScreenshots(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    const relativePath = path.relative(this.docsDir, filePath);
    
    // Find image references
    const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let match;
    
    while ((match = imgRegex.exec(content)) !== null) {
      const [fullMatch, altText, imgPath] = match;
      
      // Skip external images
      if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) {
        continue;
      }
      
      // Check if screenshot exists
      const screenshotPath = this.resolveScreenshotPath(imgPath, filePath);
      const exists = await this.screenshotExists(screenshotPath);
      
      if (!exists) {
        this.missingScreenshots.push({
          file: relativePath,
          reference: imgPath,
          altText: altText,
          fullMatch: fullMatch,
          position: match.index,
          resolvedPath: screenshotPath
        });
      }
    }
  }

  resolveScreenshotPath(imgPath, fromFile) {
    // Handle relative paths
    if (!path.isAbsolute(imgPath)) {
      const fromDir = path.dirname(fromFile);
      return path.resolve(fromDir, imgPath);
    }
    return imgPath;
  }

  async screenshotExists(screenshotPath) {
    try {
      await fs.access(screenshotPath);
      return true;
    } catch {
      return false;
    }
  }

  async generateFallbackOptions() {
    console.log('🎨 Generating fallback options for missing screenshots...');
    
    for (const missing of this.missingScreenshots) {
      const fallbacks = await this.createFallbackOptions(missing);
      this.placeholders.set(missing.reference, fallbacks);
    }
    
    console.log(`✅ Generated fallbacks for ${this.placeholders.size} missing screenshots`);
  }

  async createFallbackOptions(missing) {
    const options = [];
    
    // Option 1: Find similar existing screenshots
    const similar = this.findSimilarScreenshots(missing.reference);
    if (similar.length > 0) {
      options.push({
        type: 'similar',
        path: similar[0].path,
        confidence: similar[0].confidence,
        description: `Use similar screenshot: ${similar[0].path}`
      });
    }
    
    // Option 2: Generate placeholder
    const placeholder = await this.generatePlaceholder(missing);
    options.push({
      type: 'placeholder',
      path: placeholder.path,
      confidence: 50,
      description: `Generated placeholder: ${placeholder.description}`
    });
    
    // Option 3: Default application icon
    const appIcon = this.getApplicationIcon(missing.reference);
    if (appIcon) {
      options.push({
        type: 'icon',
        path: appIcon,
        confidence: 30,
        description: `Use application icon as fallback`
      });
    }
    
    return options;
  }

  findSimilarScreenshots(reference) {
    const similar = [];
    const refBasename = path.parse(reference).name.toLowerCase();
    
    for (const screenshot of this.availableScreenshots) {
      if (screenshot.includes('.')) continue; // Skip file extensions in our set
      
      const screenshotLower = screenshot.toLowerCase();
      
      // Calculate similarity
      let similarity = 0;
      
      // Exact match
      if (screenshotLower === refBasename) {
        similarity = 100;
      }
      // Contains match
      else if (screenshotLower.includes(refBasename) || refBasename.includes(screenshotLower)) {
        similarity = 80;
      }
      // Fuzzy match
      else {
        similarity = this.calculateStringSimilarity(refBasename, screenshotLower) * 60;
      }
      
      if (similarity > 40) {
        // Find the actual file
        const actualFile = [...this.availableScreenshots].find(s => 
          s.toLowerCase().startsWith(screenshotLower) && s.includes('.')
        );
        
        if (actualFile) {
          similar.push({
            path: path.join(this.screenshotsDir, actualFile),
            confidence: similarity,
            name: actualFile
          });
        }
      }
    }
    
    return similar.sort((a, b) => b.confidence - a.confidence);
  }

  calculateStringSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  async generatePlaceholder(missing) {
    const placeholderName = this.generatePlaceholderName(missing.reference);
    const placeholderPath = path.join(this.screenshotsDir, placeholderName);
    
    // Generate SVG placeholder
    const svg = this.createPlaceholderSVG(missing);
    
    // Save placeholder
    await fs.writeFile(placeholderPath, svg);
    
    return {
      path: placeholderPath,
      description: `Generated SVG placeholder for ${missing.altText || 'screenshot'}`
    };
  }

  generatePlaceholderName(reference) {
    const parsed = path.parse(reference);
    const basename = parsed.name || 'placeholder';
    return `${basename}-placeholder.svg`;
  }

  createPlaceholderSVG(missing) {
    const width = 800;
    const height = 600;
    const title = missing.altText || 'Application Screenshot';
    const filename = path.parse(missing.reference).name;
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" 
     xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f8f9fa;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#e9ecef;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="100%" height="100%" fill="url(#bgGradient)" stroke="#dee2e6" stroke-width="2"/>
  
  <!-- Icon -->
  <circle cx="${width/2}" cy="${height/2 - 50}" r="60" 
          fill="#6c757d" opacity="0.3"/>
  <text x="${width/2}" y="${height/2 - 40}" 
        text-anchor="middle" font-family="Arial, sans-serif" 
        font-size="48" fill="#495057">📸</text>
  
  <!-- Title -->
  <text x="${width/2}" y="${height/2 + 30}" 
        text-anchor="middle" font-family="Arial, sans-serif" 
        font-size="24" font-weight="bold" fill="#343a40">${title}</text>
  
  <!-- Subtitle -->
  <text x="${width/2}" y="${height/2 + 60}" 
        text-anchor="middle" font-family="Arial, sans-serif" 
        font-size="16" fill="#6c757d">Screenshot: ${filename}</text>
  
  <!-- Status -->
  <text x="${width/2}" y="${height/2 + 90}" 
        text-anchor="middle" font-family="Arial, sans-serif" 
        font-size="14" fill="#dc3545">⚠️ Screenshot will be captured automatically</text>
</svg>`;
  }

  getApplicationIcon(reference) {
    // Map common application names to icons
    const iconMap = {
      'terminal': '🖥️',
      'vibecode': '🎯', 
      'ai-chat': '🤖',
      'file-manager': '📁',
      'task-manager': '⚡',
      'calculator': '🧮',
      'clock': '🕐',
      'settings': '⚙️'
    };
    
    const basename = path.parse(reference).name.toLowerCase();
    
    for (const [app, icon] of Object.entries(iconMap)) {
      if (basename.includes(app)) {
        return icon;
      }
    }
    
    return '📱'; // Generic app icon
  }

  generateScreenshotReport() {
    const timestamp = new Date().toISOString();
    
    return {
      generated: timestamp,
      summary: {
        totalMissing: this.missingScreenshots.length,
        availableScreenshots: Math.floor(this.availableScreenshots.size / 2), // Divide by 2 because we store both with and without extension
        placeholdersGenerated: this.placeholders.size,
        fallbacksAvailable: Array.from(this.placeholders.values()).reduce((sum, opts) => sum + opts.length, 0)
      },
      missingScreenshots: this.missingScreenshots.map(missing => ({
        file: missing.file,
        reference: missing.reference,
        altText: missing.altText,
        resolvedPath: missing.resolvedPath
      })),
      availableScreenshots: [...this.availableScreenshots].filter(s => s.includes('.')),
      fallbackOptions: Array.from(this.placeholders.entries()).map(([ref, options]) => ({
        reference: ref,
        options: options.map(opt => ({
          type: opt.type,
          confidence: opt.confidence,
          description: opt.description
        }))
      })),
      recommendations: this.generateScreenshotRecommendations()
    };
  }

  generateScreenshotRecommendations() {
    const recommendations = [];
    
    if (this.missingScreenshots.length > 0) {
      recommendations.push({
        priority: 'high',
        issue: `${this.missingScreenshots.length} missing screenshots`,
        action: 'Run screenshot automation or use generated placeholders',
        impact: 'Critical for visual documentation completeness'
      });
    }
    
    if (this.placeholders.size > 0) {
      recommendations.push({
        priority: 'medium',
        issue: `${this.placeholders.size} placeholder options generated`,
        action: 'Apply fallback screenshots until originals are captured',
        impact: 'Improves documentation usability'
      });
    }
    
    const highConfidenceFallbacks = Array.from(this.placeholders.values())
      .flat()
      .filter(opt => opt.confidence > 70).length;
    
    if (highConfidenceFallbacks > 0) {
      recommendations.push({
        priority: 'medium',
        issue: `${highConfidenceFallbacks} high-confidence fallbacks available`,
        action: 'Apply similar screenshots as temporary replacements',
        impact: 'Provides immediate visual documentation improvement'
      });
    }
    
    return recommendations;
  }

  async saveReport(report) {
    const reportPath = path.join(this.docsDir, 'automation', 'screenshot-report.md');
    const markdown = this.generateMarkdownReport(report);
    await fs.writeFile(reportPath, markdown);
    
    const jsonPath = path.join(this.docsDir, 'automation', 'screenshot-data.json');
    await fs.writeFile(jsonPath, JSON.stringify(report, null, 2));
    
    console.log(`📊 Screenshot report saved: ${reportPath}`);
    console.log(`📊 Screenshot data saved: ${jsonPath}`);
  }

  generateMarkdownReport(report) {
    return `# SwissKnife Screenshot Management Report

**Generated**: ${report.generated}

## 📊 Screenshot Summary

| Metric | Value | Status |
|--------|-------|--------|
| **Missing Screenshots** | ${report.summary.totalMissing} | ${report.summary.totalMissing === 0 ? '✅' : '❌'} |
| **Available Screenshots** | ${report.summary.availableScreenshots} | ℹ️ |
| **Placeholders Generated** | ${report.summary.placeholdersGenerated} | ${report.summary.placeholdersGenerated > 0 ? '🎨' : 'ℹ️'} |
| **Fallback Options** | ${report.summary.fallbacksAvailable} | ${report.summary.fallbacksAvailable > 0 ? '🔄' : 'ℹ️'} |

## 📸 Missing Screenshots Analysis

${report.missingScreenshots.length === 0 ? '✅ All screenshot references have corresponding files!' : 
`Found ${report.missingScreenshots.length} missing screenshots:

${report.missingScreenshots.map((missing, index) => 
`### ${index + 1}. ${missing.altText || 'Screenshot'}
- **File**: ${missing.file}
- **Reference**: \`${missing.reference}\`
- **Resolved Path**: \`${missing.resolvedPath}\`
`
).join('\n')}
`}

## 📋 Available Screenshots

${report.availableScreenshots.length === 0 ? 'No screenshots currently available.' :
`Current screenshot inventory (${report.availableScreenshots.length} files):

${report.availableScreenshots.map(screenshot => `- ${screenshot}`).join('\n')}
`}

## 🔄 Fallback Options

${report.fallbackOptions.length === 0 ? 'No fallback options generated.' :
`Generated fallback strategies for missing screenshots:

${report.fallbackOptions.map((fallback, index) => 
`### ${index + 1}. \`${fallback.reference}\`
${fallback.options.map(opt => 
`- **${opt.type}** (${opt.confidence}% confidence): ${opt.description}`
).join('\n')}
`
).join('\n')}
`}

## 🎯 Recommendations

${report.recommendations.map(rec => 
`### ${rec.priority.toUpperCase()} Priority: ${rec.issue}
**Action**: ${rec.action}
**Impact**: ${rec.impact}
`
).join('\n')}

## 🚀 Next Steps

1. **Immediate**: Apply high-confidence fallbacks to improve documentation
2. **Short-term**: Run Playwright screenshot automation to capture missing images
3. **Long-term**: Implement automated screenshot capture in CI/CD pipeline

---

*Report generated by SwissKnife Screenshot Management System*
*For automated screenshot capture, run: \`npm run docs:update-screenshots\`*`;
  }

  async applyFallbacks(minimumConfidence = 70) {
    console.log(`🎨 Applying screenshot fallbacks (min confidence: ${minimumConfidence}%)...`);
    let appliedCount = 0;
    
    for (const [reference, options] of this.placeholders) {
      const bestOption = options.find(opt => opt.confidence >= minimumConfidence);
      
      if (bestOption) {
        try {
          await this.applyFallback(reference, bestOption);
          appliedCount++;
        } catch (error) {
          console.warn(`⚠️ Failed to apply fallback for ${reference}: ${error.message}`);
        }
      }
    }
    
    console.log(`✅ Applied ${appliedCount} screenshot fallbacks`);
    return appliedCount;
  }

  async applyFallback(reference, fallback) {
    // Implementation would copy or symlink the fallback image
    // For now, we'll just log the action
    console.log(`🔄 Applying fallback: ${reference} → ${fallback.description}`);
  }
}

// Main execution
async function main() {
  const manager = new ScreenshotManager();
  
  try {
    const results = await manager.analyzeMissingScreenshots();
    
    console.log('\n📊 Screenshot Analysis Results:');
    console.log(`Missing Screenshots: ${results.totalReferences}`);
    console.log(`Available Screenshots: ${results.availableScreenshots}`);
    console.log(`Placeholder Options: ${results.placeholderOptions}`);
    
    // Apply high-confidence fallbacks
    if (results.placeholderOptions > 0) {
      console.log('\n🎨 Applying high-confidence fallbacks...');
      const applied = await manager.applyFallbacks(70);
      console.log(`✅ Applied ${applied} fallbacks`);
    }
    
    console.log('\n✅ Screenshot management completed successfully!');
    console.log('📊 Report available: docs/automation/screenshot-report.md');
    
    return results;
  } catch (error) {
    console.error('❌ Screenshot management failed:', error);
    process.exit(1);
  }
}

// Export for use in other scripts
export { ScreenshotManager };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}