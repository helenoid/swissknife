#!/usr/bin/env node

/**
 * SwissKnife Link Validation and Repair System
 * Automatically detects and fixes broken internal references in documentation
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class LinkValidator {
  constructor() {
    this.docsDir = path.join(__dirname, '../../docs');
    this.brokenLinks = [];
    this.validFiles = new Set();
    this.linkMap = new Map();
    this.repairs = [];
  }

  async validateAllLinks() {
    console.log('🔍 Starting comprehensive link validation...');
    
    // First, build a map of all valid files
    await this.buildValidFileMap();
    
    // Then validate all links in documentation
    await this.scanDocumentationFiles();
    
    // Attempt to repair broken links
    await this.repairBrokenLinks();
    
    // Generate report
    const report = this.generateValidationReport();
    await this.saveReport(report);
    
    return {
      totalLinks: this.linkMap.size,
      brokenLinks: this.brokenLinks.length,
      repairedLinks: this.repairs.length,
      report: report
    };
  }

  async buildValidFileMap() {
    console.log('📋 Building valid file map...');
    
    const scanDirectory = async (dir, relativePath = '') => {
      const items = await fs.readdir(dir, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        const relPath = path.join(relativePath, item.name);
        
        if (item.isDirectory()) {
          await scanDirectory(fullPath, relPath);
        } else if (item.isFile()) {
          // Store both with and without extension for flexibility
          this.validFiles.add(relPath);
          this.validFiles.add(relPath.replace(/\.[^/.]+$/, "")); // without extension
          
          // Also store basename for quick lookup
          const basename = path.basename(relPath, path.extname(relPath));
          this.validFiles.add(basename);
        }
      }
    };
    
    await scanDirectory(this.docsDir);
    console.log(`✅ Found ${this.validFiles.size} valid file references`);
  }

  async scanDocumentationFiles() {
    console.log('🔗 Scanning documentation for links...');
    
    const scanDir = async (dir) => {
      const items = await fs.readdir(dir, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        
        if (item.isDirectory() && !item.name.startsWith('.')) {
          await scanDir(fullPath);
        } else if (item.isFile() && item.name.endsWith('.md')) {
          await this.validateLinksInFile(fullPath);
        }
      }
    };
    
    await scanDir(this.docsDir);
  }

  async validateLinksInFile(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    const relativePath = path.relative(this.docsDir, filePath);
    
    // Find all markdown links [text](link)
    const linkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
    let match;
    
    while ((match = linkRegex.exec(content)) !== null) {
      const [fullMatch, linkText, linkTarget] = match;
      
      // Skip external links (http/https)
      if (linkTarget.startsWith('http://') || linkTarget.startsWith('https://')) {
        continue;
      }
      
      // Skip anchors and fragments
      if (linkTarget.startsWith('#')) {
        continue;
      }
      
      const linkInfo = {
        file: relativePath,
        text: linkText,
        target: linkTarget,
        fullMatch: fullMatch,
        position: match.index
      };
      
      this.linkMap.set(`${relativePath}:${match.index}`, linkInfo);
      
      // Validate the link
      if (!await this.isValidLink(linkTarget, filePath)) {
        this.brokenLinks.push(linkInfo);
      }
    }
    
    // Also check for screenshot references
    const imgRegex = /!\[[^\]]*\]\(([^)]+)\)/g;
    while ((match = imgRegex.exec(content)) !== null) {
      const [fullMatch, imgTarget] = match;
      
      if (!imgTarget.startsWith('http')) {
        const linkInfo = {
          file: relativePath,
          text: 'Screenshot',
          target: imgTarget,
          fullMatch: fullMatch,
          position: match.index,
          type: 'image'
        };
        
        this.linkMap.set(`${relativePath}:img:${match.index}`, linkInfo);
        
        if (!await this.isValidLink(imgTarget, filePath)) {
          this.brokenLinks.push(linkInfo);
        }
      }
    }
  }

  async isValidLink(target, fromFile) {
    // Remove fragment identifier
    const cleanTarget = target.split('#')[0];
    
    if (!cleanTarget) return true; // Just a fragment
    
    // Resolve relative path
    const fromDir = path.dirname(fromFile);
    const targetPath = path.resolve(fromDir, cleanTarget);
    
    try {
      await fs.access(targetPath);
      return true;
    } catch {
      // Try alternative paths
      const alternatives = this.generateAlternativePaths(cleanTarget);
      for (const alt of alternatives) {
        const altPath = path.resolve(fromDir, alt);
        try {
          await fs.access(altPath);
          return true;
        } catch {
          continue;
        }
      }
      return false;
    }
  }

  generateAlternativePaths(target) {
    const alternatives = [];
    const basename = path.basename(target, path.extname(target));
    
    // Common alternative paths
    alternatives.push(
      `${basename}.md`,
      `${target}.md`,
      `applications/${basename}.md`,
      `applications/${target}`,
      `screenshots/${basename}.png`,
      `screenshots/${basename}-window.png`,
      `screenshots/${basename}-icon.png`,
      `automation/${basename}.md`,
      `../applications/${basename}.md`,
      `../screenshots/${basename}.png`
    );
    
    return alternatives;
  }

  async repairBrokenLinks() {
    console.log(`🔧 Attempting to repair ${this.brokenLinks.length} broken links...`);
    
    for (const brokenLink of this.brokenLinks) {
      const repair = await this.findRepairSuggestion(brokenLink);
      if (repair) {
        this.repairs.push({
          original: brokenLink,
          suggestion: repair
        });
      }
    }
    
    console.log(`✅ Generated ${this.repairs.length} repair suggestions`);
  }

  async findRepairSuggestion(brokenLink) {
    const { target } = brokenLink;
    const basename = path.basename(target, path.extname(target));
    
    // Search for similar files
    const candidates = [];
    
    for (const validFile of this.validFiles) {
      const validBasename = path.basename(validFile, path.extname(validFile));
      
      // Exact match
      if (validBasename === basename) {
        candidates.push({ file: validFile, score: 100 });
      }
      // Partial match
      else if (validBasename.includes(basename) || basename.includes(validBasename)) {
        candidates.push({ file: validFile, score: 75 });
      }
      // Similar name (simple similarity)
      else if (this.calculateSimilarity(validBasename, basename) > 0.7) {
        candidates.push({ file: validFile, score: 50 });
      }
    }
    
    // Sort by score and return best match
    candidates.sort((a, b) => b.score - a.score);
    
    if (candidates.length > 0) {
      const best = candidates[0];
      
      // Generate proper relative path
      const fromDir = path.dirname(path.join(this.docsDir, brokenLink.file));
      const targetFile = this.findActualFilePath(best.file);
      
      if (targetFile) {
        const relativePath = path.relative(fromDir, targetFile);
        return {
          newTarget: relativePath.replace(/\\/g, '/'), // Convert to forward slashes
          confidence: best.score,
          reason: `Found similar file: ${best.file}`
        };
      }
    }
    
    return null;
  }

  findActualFilePath(validFile) {
    // Try to find the actual file path
    const possiblePaths = [
      path.join(this.docsDir, validFile),
      path.join(this.docsDir, 'applications', validFile),
      path.join(this.docsDir, 'screenshots', validFile),
      path.join(this.docsDir, 'automation', validFile)
    ];
    
    for (const possiblePath of possiblePaths) {
      try {
        if (fs.access(possiblePath)) {
          return possiblePath;
        }
      } catch {
        continue;
      }
    }
    
    return null;
  }

  calculateSimilarity(str1, str2) {
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

  generateValidationReport() {
    const timestamp = new Date().toISOString();
    
    return {
      generated: timestamp,
      summary: {
        totalFiles: this.linkMap.size,
        brokenLinks: this.brokenLinks.length,
        repairSuggestions: this.repairs.length,
        validationStatus: this.brokenLinks.length === 0 ? 'PASS' : 'FAIL'
      },
      brokenLinks: this.brokenLinks.map(link => ({
        file: link.file,
        target: link.target,
        text: link.text,
        type: link.type || 'link',
        position: link.position
      })),
      repairs: this.repairs.map(repair => ({
        file: repair.original.file,
        originalTarget: repair.original.target,
        suggestedTarget: repair.suggestion.newTarget,
        confidence: repair.suggestion.confidence,
        reason: repair.suggestion.reason
      })),
      recommendations: this.generateRecommendations()
    };
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.brokenLinks.length > 0) {
      recommendations.push({
        priority: 'high',
        issue: `${this.brokenLinks.length} broken links found`,
        action: 'Fix broken internal references using repair suggestions',
        impact: 'Critical for documentation accuracy score'
      });
    }
    
    const imageLinks = this.brokenLinks.filter(link => link.type === 'image');
    if (imageLinks.length > 0) {
      recommendations.push({
        priority: 'high',
        issue: `${imageLinks.length} missing images`,
        action: 'Generate missing screenshots or update image references',
        impact: 'Required for complete visual documentation'
      });
    }
    
    if (this.repairs.length > 0) {
      recommendations.push({
        priority: 'medium',
        issue: `${this.repairs.length} automatic repairs available`,
        action: 'Apply suggested link repairs',
        impact: 'Improves documentation accuracy and navigation'
      });
    }
    
    return recommendations;
  }

  async saveReport(report) {
    const reportPath = path.join(this.docsDir, 'automation', 'link-validation-report.md');
    
    const markdown = this.generateMarkdownReport(report);
    await fs.writeFile(reportPath, markdown);
    
    const jsonPath = path.join(this.docsDir, 'automation', 'link-validation-data.json');
    await fs.writeFile(jsonPath, JSON.stringify(report, null, 2));
    
    console.log(`📊 Link validation report saved: ${reportPath}`);
    console.log(`📊 Link validation data saved: ${jsonPath}`);
  }

  generateMarkdownReport(report) {
    return `# SwissKnife Link Validation Report

**Generated**: ${report.generated}

## 📊 Validation Summary

| Metric | Value | Status |
|--------|-------|--------|
| **Total Links** | ${report.summary.totalFiles} | ℹ️ |
| **Broken Links** | ${report.summary.brokenLinks} | ${report.summary.brokenLinks === 0 ? '✅' : '❌'} |
| **Repair Suggestions** | ${report.summary.repairSuggestions} | ${report.summary.repairSuggestions > 0 ? '🔧' : 'ℹ️'} |
| **Validation Status** | ${report.summary.validationStatus} | ${report.summary.validationStatus === 'PASS' ? '✅' : '❌'} |

## 🔗 Broken Links Analysis

${report.brokenLinks.length === 0 ? '✅ No broken links found!' : 
`Found ${report.brokenLinks.length} broken links:

${report.brokenLinks.map(link => 
`- **${link.file}**: \`${link.target}\` (${link.type || 'link'})
  - Text: "${link.text}"
  - Position: ${link.position}`
).join('\n')}
`}

## 🔧 Repair Suggestions

${report.repairs.length === 0 ? 'No automatic repairs available.' :
`${report.repairs.length} automatic repair suggestions:

${report.repairs.map((repair, index) => 
`### Repair ${index + 1}
- **File**: ${repair.file}
- **Original**: \`${repair.originalTarget}\`
- **Suggested**: \`${repair.suggestedTarget}\`
- **Confidence**: ${repair.confidence}%
- **Reason**: ${repair.reason}
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

---

*Report generated by SwissKnife Link Validation System*
*Next validation scheduled for next documentation update*`;
  }

  async applyRepairs() {
    console.log(`🔧 Applying ${this.repairs.length} link repairs...`);
    let appliedCount = 0;
    
    for (const repair of this.repairs) {
      if (repair.suggestion.confidence >= 75) {
        try {
          await this.applyRepair(repair);
          appliedCount++;
        } catch (error) {
          console.warn(`⚠️ Failed to apply repair for ${repair.original.file}: ${error.message}`);
        }
      }
    }
    
    console.log(`✅ Applied ${appliedCount} link repairs`);
    return appliedCount;
  }

  async applyRepair(repair) {
    const filePath = path.join(this.docsDir, repair.original.file);
    const content = await fs.readFile(filePath, 'utf-8');
    
    const updatedContent = content.replace(
      repair.original.fullMatch,
      repair.original.fullMatch.replace(repair.original.target, repair.suggestion.newTarget)
    );
    
    await fs.writeFile(filePath, updatedContent);
    console.log(`✅ Repaired link in ${repair.original.file}: ${repair.original.target} → ${repair.suggestion.newTarget}`);
  }
}

// Main execution
async function main() {
  const validator = new LinkValidator();
  
  try {
    const results = await validator.validateAllLinks();
    
    console.log('\n📊 Link Validation Results:');
    console.log(`Total Links: ${results.totalLinks}`);
    console.log(`Broken Links: ${results.brokenLinks}`);
    console.log(`Repair Suggestions: ${results.repairedLinks}`);
    
    // Apply high-confidence repairs
    if (results.repairedLinks > 0) {
      console.log('\n🔧 Applying automatic repairs...');
      const applied = await validator.applyRepairs();
      console.log(`✅ Applied ${applied} automatic repairs`);
    }
    
    console.log('\n✅ Link validation completed successfully!');
    console.log('📊 Report available: docs/automation/link-validation-report.md');
    
    return results;
  } catch (error) {
    console.error('❌ Link validation failed:', error);
    process.exit(1);
  }
}

// Export for use in other scripts
export { LinkValidator };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}