#!/usr/bin/env node

/**
 * SwissKnife Enhanced Documentation Analytics & Quality System
 * Advanced analytics with integrated link validation and screenshot management
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { LinkValidator } from './link-validator.js';
import { ScreenshotManager } from './screenshot-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DocumentationAnalytics {
  constructor() {
    this.analyticsFile = path.join(__dirname, '../../docs/automation/analytics-data.json');
    this.changeLogFile = path.join(__dirname, '../../docs/automation/change-log.md');
    this.qualityReportFile = path.join(__dirname, '../../docs/automation/quality-report.md');
    
    // Enhanced analytics components
    this.linkValidator = new LinkValidator();
    this.screenshotManager = new ScreenshotManager();
    
    this.analytics = {
      timestamp: new Date().toISOString(),
      quality: {
        overallScore: 0,
        completeness: 0,
        consistency: 0,
        accuracy: 0,
        maintainability: 0
      },
      content: {
        totalWords: 0,
        totalFiles: 0,
        averageLength: 0,
        duplicateContent: 0,
        brokenReferences: 0
      },
      structure: {
        crossReferences: 0,
        orphanedFiles: 0,
        missingScreenshots: 0,
        inconsistentFormatting: 0
      },
      changes: {
        filesModified: 0,
        contentChanges: 0,
        structureChanges: 0,
        newFiles: 0,
        deletedFiles: 0
      },
      // Enhanced analytics
      linkValidation: {
        totalLinks: 0,
        brokenLinks: 0,
        repairedLinks: 0,
        validationStatus: 'pending'
      },
      screenshots: {
        totalReferences: 0,
        missingScreenshots: 0,
        availableScreenshots: 0,
        placeholdersGenerated: 0
      }
    };
  }

  async loadPreviousAnalytics() {
    try {
      const data = await fs.readFile(this.analyticsFile, 'utf8');
      const analytics = JSON.parse(data);
      this.previousState = analytics.length > 0 ? analytics[analytics.length - 1] : null;
    } catch (error) {
      console.log('📊 No previous analytics data found, starting fresh');
    }
  }

  async analyzeDocumentation() {
    console.log('📊 Starting comprehensive documentation analysis...');
    
    await this.loadPreviousAnalytics();
    
    const docsDir = path.join(__dirname, '../../docs/applications');
    
    // Enhanced analysis with integrated components
    console.log('🔗 Running link validation...');
    const linkResults = await this.linkValidator.validateAllLinks();
    this.analytics.linkValidation = {
      totalLinks: linkResults.totalLinks,
      brokenLinks: linkResults.brokenLinks,
      repairedLinks: linkResults.repairedLinks,
      validationStatus: linkResults.brokenLinks === 0 ? 'PASS' : 'FAIL'
    };
    
    console.log('📸 Running screenshot analysis...');
    const screenshotResults = await this.screenshotManager.analyzeMissingScreenshots();
    this.analytics.screenshots = {
      totalReferences: screenshotResults.totalReferences,
      missingScreenshots: screenshotResults.totalReferences,
      availableScreenshots: screenshotResults.availableScreenshots,
      placeholdersGenerated: screenshotResults.placeholderOptions
    };
    
    // Original analysis methods
    await this.analyzeContentQuality(docsDir);
    await this.analyzeStructure(docsDir);
    await this.trackChanges(docsDir);
    
    // Enhanced quality calculation
    this.calculateEnhancedQualityScore();
    
    console.log('📊 Documentation analysis completed');
    return this.analytics;
  }

  async analyzeContentQuality(docsDir) {
    console.log('📝 Analyzing content quality...');
    
    const files = await fs.readdir(docsDir);
    const markdownFiles = files.filter(f => f.endsWith('.md'));
    
    let totalWords = 0;
    let duplicateContent = [];
    let contentHashes = new Map();
    
    for (const file of markdownFiles) {
      const filepath = path.join(docsDir, file);
      const content = await fs.readFile(filepath, 'utf8');
      
      // Word count
      const words = content.split(/\s+/).length;
      totalWords += words;
      
      // Check for duplicate content (by hash)
      const contentHash = crypto.createHash('md5').update(content).digest('hex');
      if (contentHashes.has(contentHash)) {
        duplicateContent.push({ file, duplicate: contentHashes.get(contentHash) });
      }
      contentHashes.set(contentHash, file);
      
      // Analyze file completeness
      await this.analyzeFileCompleteness(file, content);
    }
    
    this.analytics.content.totalFiles = markdownFiles.length;
    this.analytics.content.totalWords = totalWords;
    this.analytics.content.averageLength = Math.round(totalWords / markdownFiles.length);
    this.analytics.content.duplicateContent = duplicateContent.length;
  }

  async analyzeFileCompleteness(filename, content) {
    const requiredSections = [
      'Overview', 'Features', 'Backend Dependencies', 'Development Guide', 
      'Integration Points', 'Performance Considerations'
    ];
    
    let completenessScore = 0;
    
    requiredSections.forEach(section => {
      if (content.toLowerCase().includes(section.toLowerCase())) {
        completenessScore += 1;
      }
    });
    
    // Check for metadata
    if (content.includes('**Metadata**')) completenessScore += 1;
    if (content.includes('**Generated**')) completenessScore += 1;
    
    const completenessPercentage = (completenessScore / (requiredSections.length + 2)) * 100;
    
    if (!this.fileCompleteness) this.fileCompleteness = [];
    this.fileCompleteness.push({
      file: filename,
      score: completenessPercentage,
      missingSections: requiredSections.filter(section => 
        !content.toLowerCase().includes(section.toLowerCase())
      )
    });
  }

  async analyzeStructure(docsDir) {
    console.log('🔗 Analyzing documentation structure...');
    
    const files = await fs.readdir(docsDir);
    const markdownFiles = files.filter(f => f.endsWith('.md'));
    
    let crossReferences = 0;
    let brokenReferences = 0;
    let missingScreenshots = 0;
    
    const allFiles = new Set(markdownFiles.map(f => f.replace('.md', '')));
    
    for (const file of markdownFiles) {
      const filepath = path.join(docsDir, file);
      const content = await fs.readFile(filepath, 'utf8');
      
      // Count cross-references
      const linkMatches = content.match(/\[([^\]]+)\]\(([^)]+)\.md\)/g) || [];
      crossReferences += linkMatches.length;
      
      // Check for broken internal references
      linkMatches.forEach(link => {
        const match = link.match(/\[([^\]]+)\]\(([^)]+)\.md\)/);
        if (match) {
          const linkedFile = match[2];
          if (!allFiles.has(linkedFile)) {
            brokenReferences++;
          }
        }
      });
      
      // Check for missing screenshots
      const screenshotRefs = content.match(/!\[([^\]]*)\]\(\.\.\/screenshots\/([^)]+)\)/g) || [];
      for (const ref of screenshotRefs) {
        const match = ref.match(/!\[([^\]]*)\]\(\.\.\/screenshots\/([^)]+)\)/);
        if (match) {
          const screenshotPath = path.join(__dirname, '../../docs/screenshots', match[2]);
          try {
            await fs.access(screenshotPath);
          } catch {
            missingScreenshots++;
          }
        }
      }
    }
    
    this.analytics.structure.crossReferences = crossReferences;
    this.analytics.content.brokenReferences = brokenReferences;
    this.analytics.structure.missingScreenshots = missingScreenshots;
    
    // Find orphaned files (files not referenced by others)
    const referencedFiles = new Set();
    for (const file of markdownFiles) {
      const filepath = path.join(docsDir, file);
      const content = await fs.readFile(filepath, 'utf8');
      const linkMatches = content.match(/\[([^\]]+)\]\(([^)]+)\.md\)/g) || [];
      linkMatches.forEach(link => {
        const match = link.match(/\[([^\]]+)\]\(([^)]+)\.md\)/);
        if (match) {
          referencedFiles.add(match[2] + '.md');
        }
      });
    }
    
    const orphanedFiles = markdownFiles.filter(file => 
      !referencedFiles.has(file) && file !== 'README.md'
    );
    
    this.analytics.structure.orphanedFiles = orphanedFiles.length;
  }

  async trackChanges(docsDir) {
    console.log('📈 Tracking documentation changes...');
    
    if (!this.previousState) {
      console.log('📈 No previous state found, marking all as new');
      this.analytics.changes.newFiles = this.analytics.content.totalFiles;
      return;
    }
    
    // Calculate changes since last run
    const currentFiles = await fs.readdir(docsDir);
    const currentMarkdownFiles = currentFiles.filter(f => f.endsWith('.md'));
    
    // Compare file count
    const previousFileCount = this.previousState.content?.totalFiles || 0;
    this.analytics.changes.newFiles = Math.max(0, currentMarkdownFiles.length - previousFileCount);
    this.analytics.changes.deletedFiles = Math.max(0, previousFileCount - currentMarkdownFiles.length);
    
    // Compare content metrics
    const previousWords = this.previousState.content?.totalWords || 0;
    const wordsDiff = this.analytics.content.totalWords - previousWords;
    this.analytics.changes.contentChanges = Math.abs(wordsDiff);
    
    // Compare structure metrics
    const previousCrossRefs = this.previousState.structure?.crossReferences || 0;
    const crossRefsDiff = this.analytics.structure.crossReferences - previousCrossRefs;
    this.analytics.changes.structureChanges = Math.abs(crossRefsDiff);
  }

  calculateQualityScore() {
    console.log('🎯 Calculating overall quality score...');
    
    // Completeness (40% weight)
    const avgCompleteness = this.fileCompleteness ? 
      this.fileCompleteness.reduce((sum, f) => sum + f.score, 0) / this.fileCompleteness.length : 0;
    this.analytics.quality.completeness = Math.round(avgCompleteness);
    
    // Consistency (25% weight)
    const consistencyPenalties = 
      (this.analytics.content.duplicateContent * 5) +
      (this.analytics.structure.inconsistentFormatting * 3);
    this.analytics.quality.consistency = Math.max(0, 100 - consistencyPenalties);
    
    // Accuracy (20% weight)  
    const accuracyPenalties = 
      (this.analytics.content.brokenReferences * 10) +
      (this.analytics.structure.missingScreenshots * 5);
    this.analytics.quality.accuracy = Math.max(0, 100 - accuracyPenalties);
    
    // Maintainability (15% weight)
    const maintainabilityBonus = 
      (this.analytics.structure.crossReferences * 2) +
      (this.analytics.content.totalFiles * 1);
    const maintainabilityPenalty = this.analytics.structure.orphanedFiles * 5;
    this.analytics.quality.maintainability = Math.min(100, Math.max(0, 
      50 + maintainabilityBonus - maintainabilityPenalty
    ));
    
    // Overall score (weighted average)
    this.analytics.quality.overallScore = Math.round(
      (this.analytics.quality.completeness * 0.40) +
      (this.analytics.quality.consistency * 0.25) +
      (this.analytics.quality.accuracy * 0.20) +
      (this.analytics.quality.maintainability * 0.15)
    );
  }

  calculateEnhancedQualityScore() {
    console.log('🎯 Calculating enhanced quality score with link validation and screenshots...');
    
    // Completeness (40% weight)
    const avgCompleteness = this.fileCompleteness ? 
      this.fileCompleteness.reduce((sum, f) => sum + f.score, 0) / this.fileCompleteness.length : 0;
    this.analytics.quality.completeness = Math.round(avgCompleteness);
    
    // Consistency (25% weight)
    const consistencyPenalties = 
      (this.analytics.content.duplicateContent * 5) +
      (this.analytics.structure.inconsistentFormatting * 3);
    this.analytics.quality.consistency = Math.max(0, 100 - consistencyPenalties);
    
    // Enhanced Accuracy (20% weight) - now includes link validation
    const totalBrokenItems = 
      this.analytics.linkValidation.brokenLinks + 
      this.analytics.screenshots.missingScreenshots;
    
    // More sophisticated accuracy calculation
    let accuracyScore = 100;
    
    // Penalty for broken links (critical for navigation)
    accuracyScore -= (this.analytics.linkValidation.brokenLinks * 2);
    
    // Penalty for missing screenshots (affects visual completeness)  
    accuracyScore -= (this.analytics.screenshots.missingScreenshots * 1);
    
    // Bonus for repairs applied
    accuracyScore += Math.min(10, this.analytics.linkValidation.repairedLinks * 2);
    
    this.analytics.quality.accuracy = Math.max(0, Math.min(100, accuracyScore));
    
    // Enhanced Maintainability (15% weight)
    const maintainabilityBonus = 
      (this.analytics.structure.crossReferences * 2) +
      (this.analytics.content.totalFiles * 1) +
      (this.analytics.screenshots.availableScreenshots * 0.5);
    const maintainabilityPenalty = 
      (this.analytics.structure.orphanedFiles * 5) +
      (this.analytics.linkValidation.brokenLinks * 1);
    
    this.analytics.quality.maintainability = Math.min(100, Math.max(0, 
      50 + maintainabilityBonus - maintainabilityPenalty
    ));
    
    // Overall score (weighted average)
    this.analytics.quality.overallScore = Math.round(
      (this.analytics.quality.completeness * 0.40) +
      (this.analytics.quality.consistency * 0.25) +
      (this.analytics.quality.accuracy * 0.20) +
      (this.analytics.quality.maintainability * 0.15)
    );
    
    console.log(`🎯 Enhanced quality score calculated: ${this.analytics.quality.overallScore}/100`);
  }

  async generateQualityReport() {
    const timestamp = new Date().toISOString();
    const prevScore = this.previousState?.quality?.overallScore || 0;
    const scoreTrend = this.analytics.quality.overallScore - prevScore;
    const trendEmoji = scoreTrend > 0 ? '📈' : scoreTrend < 0 ? '📉' : '➡️';
    const trendText = scoreTrend !== 0 ? `${trendEmoji} ${scoreTrend > 0 ? '+' : ''}${scoreTrend} points` : '➡️ No change';
    
    const qualityGrade = this.analytics.quality.overallScore >= 90 ? 'A' : 
                        this.analytics.quality.overallScore >= 80 ? 'B' :
                        this.analytics.quality.overallScore >= 70 ? 'C' :
                        this.analytics.quality.overallScore >= 60 ? 'D' : 'F';
    
    const gradeEmoji = qualityGrade === 'A' ? '🏆' : qualityGrade === 'B' ? '✅' : 
                      qualityGrade === 'C' ? '⚠️' : '❌';

    const report = `# SwissKnife Documentation Quality Report

**Generated**: ${timestamp}
**Previous Analysis**: ${this.previousState?.timestamp || 'N/A'}

## 📊 Overall Quality Score

### ${gradeEmoji} **${this.analytics.quality.overallScore}/100 (Grade ${qualityGrade})**
**Trend**: ${trendText}

---

## 📈 Quality Metrics Breakdown

| Metric | Score | Weight | Contribution |
|--------|-------|--------|--------------|
| **📝 Completeness** | ${this.analytics.quality.completeness}/100 | 40% | ${Math.round(this.analytics.quality.completeness * 0.4)} points |
| **🎯 Consistency** | ${this.analytics.quality.consistency}/100 | 25% | ${Math.round(this.analytics.quality.consistency * 0.25)} points |
| **✅ Accuracy** | ${this.analytics.quality.accuracy}/100 | 20% | ${Math.round(this.analytics.quality.accuracy * 0.2)} points |
| **🔧 Maintainability** | ${this.analytics.quality.maintainability}/100 | 15% | ${Math.round(this.analytics.quality.maintainability * 0.15)} points |

## 📊 Content Analysis

### Content Statistics
| Metric | Value | Benchmark |
|--------|-------|-----------|
| **Total Files** | ${this.analytics.content.totalFiles} | ${this.analytics.content.totalFiles >= 25 ? '✅ Good' : '⚠️ Below target'} |
| **Total Words** | ${this.analytics.content.totalWords.toLocaleString()} | ${this.analytics.content.totalWords >= 50000 ? '✅ Comprehensive' : '⚠️ Needs expansion'} |
| **Avg Length** | ${this.analytics.content.averageLength} words/file | ${this.analytics.content.averageLength >= 1500 ? '✅ Detailed' : '⚠️ Too brief'} |
| **Duplicate Content** | ${this.analytics.content.duplicateContent} instances | ${this.analytics.content.duplicateContent === 0 ? '✅ None found' : '❌ Needs cleanup'} |
| **Broken References** | ${this.analytics.content.brokenReferences} | ${this.analytics.content.brokenReferences === 0 ? '✅ All valid' : '❌ Fix needed'} |

### Content Quality Issues
${this.analytics.content.duplicateContent > 0 ? 
`- ❌ **Duplicate Content**: ${this.analytics.content.duplicateContent} files have duplicate content` : 
'- ✅ **No Duplicate Content**: All files have unique content'}

${this.analytics.content.brokenReferences > 0 ? 
`- ❌ **Broken References**: ${this.analytics.content.brokenReferences} broken internal links found` : 
'- ✅ **Valid References**: All internal links are working'}

## 🔗 Enhanced Link Validation Analysis

### Link Validation Results  
| Metric | Value | Status |
|--------|-------|--------|
| **Total Links Checked** | ${this.analytics.linkValidation.totalLinks} | ℹ️ Analysis complete |
| **Broken Links Found** | ${this.analytics.linkValidation.brokenLinks} | ${this.analytics.linkValidation.brokenLinks === 0 ? '✅ All links valid' : '❌ Needs attention'} |
| **Auto-Repaired Links** | ${this.analytics.linkValidation.repairedLinks} | ${this.analytics.linkValidation.repairedLinks > 0 ? '🔧 Repairs applied' : 'ℹ️ No repairs needed'} |
| **Validation Status** | ${this.analytics.linkValidation.validationStatus} | ${this.analytics.linkValidation.validationStatus === 'PASS' ? '✅ PASSED' : '❌ FAILED'} |

${this.analytics.linkValidation.brokenLinks > 0 ? 
`### 🚨 Link Issues Detected
- **Broken Links**: ${this.analytics.linkValidation.brokenLinks} links need attention
- **Auto-Repairs**: ${this.analytics.linkValidation.repairedLinks} links were automatically fixed
- **Manual Review**: ${this.analytics.linkValidation.brokenLinks - this.analytics.linkValidation.repairedLinks} links require manual intervention
- **Report Available**: Check \`docs/automation/link-validation-report.md\` for details` :
'✅ **All Links Valid**: No broken links detected in documentation'}

## 📸 Screenshot Coverage Analysis

### Screenshot Management Status
| Metric | Value | Status |  
|--------|-------|--------|
| **Total Image References** | ${this.analytics.screenshots.totalReferences} | ℹ️ References scanned |
| **Missing Screenshots** | ${this.analytics.screenshots.missingScreenshots} | ${this.analytics.screenshots.missingScreenshots === 0 ? '✅ Complete' : '❌ Missing files'} |
| **Available Screenshots** | ${this.analytics.screenshots.availableScreenshots} | ${this.analytics.screenshots.availableScreenshots > 0 ? '✅ Available' : '⚠️ No screenshots'} |
| **Fallback Options** | ${this.analytics.screenshots.placeholdersGenerated} | ${this.analytics.screenshots.placeholdersGenerated > 0 ? '🎨 Generated' : 'ℹ️ Not needed'} |

${this.analytics.screenshots.missingScreenshots > 0 ?
`### 📸 Screenshot Issues
- **Missing Images**: ${this.analytics.screenshots.missingScreenshots} screenshot references without files
- **Coverage Gap**: ${Math.round((this.analytics.screenshots.missingScreenshots / Math.max(1, this.analytics.screenshots.totalReferences)) * 100)}% of images are missing
- **Fallback Strategy**: ${this.analytics.screenshots.placeholdersGenerated} placeholder options available
- **Action Required**: Run \`npm run docs:update-screenshots\` to capture missing images` :
'✅ **Complete Coverage**: All screenshot references have corresponding image files'}

## 🏗️ Structure Analysis

### Structure Metrics
| Metric | Value | Assessment |
|--------|-------|------------|
| **Cross References** | ${this.analytics.structure.crossReferences} | ${this.analytics.structure.crossReferences >= 20 ? '✅ Well connected' : '⚠️ Needs more links'} |
| **Missing Screenshots** | ${this.analytics.structure.missingScreenshots} | ${this.analytics.structure.missingScreenshots === 0 ? '✅ All present' : '❌ Missing images'} |
| **Orphaned Files** | ${this.analytics.structure.orphanedFiles} | ${this.analytics.structure.orphanedFiles === 0 ? '✅ All connected' : '⚠️ Unreferenced files'} |

### File Completeness Analysis
${this.fileCompleteness ? this.fileCompleteness
  .sort((a, b) => a.score - b.score)
  .slice(0, 5)
  .map(file => `- **${file.file}**: ${Math.round(file.score)}% complete ${file.score >= 80 ? '✅' : file.score >= 60 ? '⚠️' : '❌'}`)
  .join('\n') : 'No completeness data available'}

## 📈 Change Tracking

### Recent Changes
| Change Type | Count | Impact |
|-------------|-------|--------|
| **New Files** | ${this.analytics.changes.newFiles} | ${this.analytics.changes.newFiles > 0 ? '📈 Documentation expansion' : '➡️ No new files'} |
| **Deleted Files** | ${this.analytics.changes.deletedFiles} | ${this.analytics.changes.deletedFiles > 0 ? '📉 Content reduction' : '➡️ No deletions'} |
| **Content Changes** | ${this.analytics.changes.contentChanges} words | ${this.analytics.changes.contentChanges > 1000 ? '📝 Major updates' : this.analytics.changes.contentChanges > 0 ? '📝 Minor updates' : '➡️ No changes'} |
| **Structure Changes** | ${this.analytics.changes.structureChanges} references | ${this.analytics.changes.structureChanges > 5 ? '🔗 Significant restructuring' : this.analytics.changes.structureChanges > 0 ? '🔗 Minor adjustments' : '➡️ No changes'} |

## 🎯 Quality Improvement Recommendations

### High Priority Issues
${this.generateRecommendations().high.map(rec => `- 🔴 ${rec}`).join('\n') || '- ✅ No high priority issues found'}

### Medium Priority Improvements  
${this.generateRecommendations().medium.map(rec => `- 🟡 ${rec}`).join('\n') || '- ✅ No medium priority improvements needed'}

### Low Priority Enhancements
${this.generateRecommendations().low.map(rec => `- 🟢 ${rec}`).join('\n') || '- ✅ Documentation quality is optimal'}

## 📊 Historical Quality Trends

${this.previousState ? this.generateTrendAnalysis() : 'Insufficient historical data for trend analysis (first run)'}

## 🏆 Quality Benchmarks

### Targets vs Current Performance
- **📝 Completeness Target**: 90% ➜ ${this.analytics.quality.completeness}% ${this.analytics.quality.completeness >= 90 ? '✅ ACHIEVED' : '❌ BELOW TARGET'}
- **🎯 Consistency Target**: 95% ➜ ${this.analytics.quality.consistency}% ${this.analytics.quality.consistency >= 95 ? '✅ ACHIEVED' : '❌ BELOW TARGET'}
- **✅ Accuracy Target**: 98% ➜ ${this.analytics.quality.accuracy}% ${this.analytics.quality.accuracy >= 98 ? '✅ ACHIEVED' : '❌ BELOW TARGET'}
- **🔧 Maintainability Target**: 85% ➜ ${this.analytics.quality.maintainability}% ${this.analytics.quality.maintainability >= 85 ? '✅ ACHIEVED' : '❌ BELOW TARGET'}

---

**Next Analysis**: Scheduled for next documentation generation run  
**Report Generated By**: SwissKnife Documentation Analytics System  
**Data Collection**: ${timestamp}
`;

    await fs.writeFile(this.qualityReportFile, report);
    console.log(`📊 Quality report generated: ${this.qualityReportFile}`);
  }

  generateRecommendations() {
    const recommendations = { high: [], medium: [], low: [] };
    
    // High priority (critical issues)
    if (this.analytics.content.brokenReferences > 0) {
      recommendations.high.push(`Fix ${this.analytics.content.brokenReferences} broken internal references`);
    }
    if (this.analytics.structure.missingScreenshots > 5) {
      recommendations.high.push(`Add ${this.analytics.structure.missingScreenshots} missing screenshots`);
    }
    if (this.analytics.quality.completeness < 60) {
      recommendations.high.push('Improve documentation completeness (missing critical sections)');
    }
    
    // Medium priority (important improvements)
    if (this.analytics.content.duplicateContent > 0) {
      recommendations.medium.push(`Remove ${this.analytics.content.duplicateContent} instances of duplicate content`);
    }
    if (this.analytics.structure.orphanedFiles > 0) {
      recommendations.medium.push(`Add references to ${this.analytics.structure.orphanedFiles} orphaned files`);
    }
    if (this.analytics.structure.crossReferences < 20) {
      recommendations.medium.push('Add more cross-references between related documentation');
    }
    if (this.analytics.content.averageLength < 1000) {
      recommendations.medium.push('Expand documentation with more detailed content');
    }
    
    // Low priority (enhancements)
    if (this.analytics.quality.maintainability < 85) {
      recommendations.low.push('Improve documentation maintainability with better structure');
    }
    if (this.analytics.structure.crossReferences < 50) {
      recommendations.low.push('Add more comprehensive cross-referencing system');
    }
    
    return recommendations;
  }

  generateTrendAnalysis() {
    const qualityTrend = this.analytics.quality.overallScore - (this.previousState?.quality?.overallScore || 0);
    const contentTrend = this.analytics.content.totalWords - (this.previousState?.content?.totalWords || 0);
    
    return `### Quality Trend Analysis
- **Overall Quality**: ${qualityTrend > 0 ? '📈 Improving' : qualityTrend < 0 ? '📉 Declining' : '➡️ Stable'} (${qualityTrend > 0 ? '+' : ''}${qualityTrend} points)
- **Content Growth**: ${contentTrend > 0 ? '📈 Expanding' : contentTrend < 0 ? '📉 Reducing' : '➡️ Stable'} (${contentTrend > 0 ? '+' : ''}${contentTrend} words)
- **Structure**: ${this.analytics.structure.crossReferences > (this.previousState?.structure?.crossReferences || 0) ? '📈 Better connected' : '➡️ Similar connectivity'}`;
  }

  async saveAnalytics() {
    try {
      await fs.mkdir(path.dirname(this.analyticsFile), { recursive: true });
      
      // Load existing analytics
      let historicalAnalytics = [];
      try {
        const existing = await fs.readFile(this.analyticsFile, 'utf8');
        historicalAnalytics = JSON.parse(existing);
      } catch (error) {
        // File doesn't exist, start fresh
      }
      
      // Add current analytics
      historicalAnalytics.push(this.analytics);
      
      // Keep only last 50 analyses
      if (historicalAnalytics.length > 50) {
        historicalAnalytics = historicalAnalytics.slice(-50);
      }
      
      await fs.writeFile(this.analyticsFile, JSON.stringify(historicalAnalytics, null, 2));
      console.log(`📊 Analytics data saved: ${this.analyticsFile}`);
      
    } catch (error) {
      console.error('❌ Failed to save analytics:', error);
    }
  }
}

export { DocumentationAnalytics };

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const analytics = new DocumentationAnalytics();
  
  try {
    await analytics.analyzeDocumentation();
    await analytics.generateQualityReport();
    await analytics.saveAnalytics();
    
    console.log('📊 Documentation analytics completed successfully!');
    console.log(`📊 Quality Score: ${analytics.analytics.quality.overallScore}/100`);
    console.log(`📊 Quality Report: ${analytics.qualityReportFile}`);
    
  } catch (error) {
    console.error('❌ Analytics failed:', error);
    process.exit(1);
  }
}