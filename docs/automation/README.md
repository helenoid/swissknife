# SwissKnife GUI Screenshot Automation & Documentation System

This directory contains the automated screenshot capture and documentation generation system for SwissKnife's 27 virtual desktop applications.

## Overview

The automation system provides:
- **Automatic Screenshot Capture**: Playwright-based screenshots of all applications
- **Documentation Generation**: Markdown files with embedded screenshots and metadata
- **CI/CD Integration**: Automated updates on code changes
- **Visual Regression Detection**: Screenshot comparison for UI changes
- **Backend Dependency Mapping**: Automatic mapping of frontend-backend dependencies

## Architecture

```
automation/
├── playwright/
│   ├── desktop-applications-documentation.test.ts  # Main screenshot capture test
│   └── screenshot-comparison.test.ts                # Visual regression testing
├── scripts/
│   ├── generate-docs.js                            # Documentation generator
│   ├── update-screenshots.js                       # Screenshot update automation
│   └── deploy-docs.js                              # Documentation deployment
├── configs/
│   ├── playwright.config.ts                        # Playwright configuration
│   └── applications.json                           # Application metadata
└── workflows/
    ├── screenshot-automation.yml                    # GitHub Actions workflow
    └── documentation-update.yml                     # Documentation CI/CD
```

## Screenshot Automation

### Playwright Test Suite

The main automation is implemented in `test/e2e/desktop-applications-documentation.test.ts`:

```typescript
// Automatically captures screenshots of all 27 applications
test.describe('Desktop Applications Documentation', () => {
  // 1. Desktop overview screenshot
  test('should take desktop overview screenshot', async () => {
    await page.screenshot({ 
      path: 'docs/screenshots/desktop-overview.png',
      fullPage: true 
    });
  });

  // 2. Individual application screenshots
  for (const app of applications) {
    test(`should document ${app.name} application`, async () => {
      // Open application
      await page.click(app.selector);
      
      // Take screenshot
      await page.screenshot({ 
        path: `docs/screenshots/${app.name}-window.png` 
      });
      
      // Generate documentation
      generateAppDocumentation(app);
    });
  }
  
  // 3. Generate master documentation
  test('should generate master documentation index', async () => {
    // Creates README.md, backend-dependencies.md, features-matrix.md
  });
});
```

### Application Metadata

Each application is defined with comprehensive metadata:

```typescript
interface Application {
  name: string;                    // Application identifier
  selector: string;                // DOM selector for clicking
  title: string;                   // Display title
  description: string;             // Detailed description
  backendDependencies: string[];   // Required backend services
  features: string[];              // Key features list
  icon: string;                    // Emoji icon
}
```

### Screenshot Capture Process

1. **Desktop Launch**: Start SwissKnife desktop environment
2. **Application Discovery**: Automatically detect all available applications
3. **Individual Capture**: Open each application and capture screenshots
4. **Documentation Generation**: Create markdown files with embedded screenshots
5. **Cleanup**: Close applications and reset desktop state

## Documentation Generation

### Automated Documentation Files

The system generates several comprehensive documentation files:

#### 1. Application Catalog (`docs/applications/README.md`)
- Complete overview of all 27 applications
- Embedded screenshots for each application
- Feature descriptions and use cases
- Backend dependency information

#### 2. Backend Dependencies (`docs/applications/backend-dependencies.md`)
- Comprehensive frontend-to-backend dependency mapping
- Implementation priority matrix
- Parallel development strategy
- Mock implementation checklist

#### 3. Features Matrix (`docs/applications/features-matrix.md`)
- Feature comparison across all applications
- Development priorities by feature
- Shared service identification

#### 4. Individual Application Documentation
- Detailed documentation for each application
- Screenshots and feature descriptions
- Backend dependencies and integration points
- Development considerations

### Documentation Templates

Applications are documented using standardized templates:

```markdown
# ${app.title}

![${app.name} Icon](../screenshots/${app.name}-icon.png)

## Description
${app.description}

## Screenshots
- **Application Window**: ![Window](../screenshots/${app.name}-window.png)

## Features
${app.features.map(feature => `- ${feature}`).join('\n')}

## Backend Dependencies
${app.backendDependencies.map(dep => `- **${dep}**: Core dependency`).join('\n')}

## Parallel Development Strategy
[Generated development recommendations]
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Screenshot Automation
on:
  push:
    paths:
      - 'web/**'
      - 'src/**'
  schedule:
    - cron: '0 0 * * 0'  # Weekly updates

jobs:
  update-screenshots:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm install --legacy-peer-deps
        
      - name: Install Playwright browsers
        run: npx playwright install
        
      - name: Start desktop application
        run: npm run desktop &
        
      - name: Run screenshot automation
        run: npx playwright test test/e2e/desktop-applications-documentation.test.ts
        
      - name: Commit updated documentation
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add docs/
          git commit -m "📸 Update application screenshots and documentation" || exit 0
          git push
```

### Manual Triggers

```bash
# Update all screenshots and documentation
npm run docs:update-screenshots

# Generate documentation only
npm run docs:generate

# Run visual regression tests
npm run test:visual-regression
```

## Visual Regression Detection

### Screenshot Comparison

The system includes visual regression testing:

```typescript
test('should detect UI changes', async () => {
  // Take current screenshot
  const currentScreenshot = await page.screenshot();
  
  // Compare with baseline
  const baselineScreenshot = fs.readFileSync('baseline-screenshot.png');
  
  // Calculate difference
  const diff = pixelmatch(currentScreenshot, baselineScreenshot);
  
  // Report changes
  if (diff > threshold) {
    console.log(`UI change detected: ${diff} pixels different`);
    // Update baseline or fail test based on configuration
  }
});
```

### Change Detection Workflow

1. **Baseline Establishment**: Initial screenshot set as baseline
2. **Automated Comparison**: New screenshots compared to baseline
3. **Change Reporting**: Visual differences highlighted and reported
4. **Review Process**: Manual review for intentional vs. unintentional changes
5. **Baseline Update**: Approved changes update the baseline

## Configuration

### Playwright Configuration

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './test/e2e',
  use: {
    baseURL: 'http://localhost:3001',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  webServer: {
    command: 'npm run desktop',
    url: 'http://localhost:3001',
    reuseExistingServer: true
  }
});
```

### Application Configuration

```json
// configs/applications.json
{
  "applications": [
    {
      "name": "terminal",
      "selector": "[data-app=\"terminal\"]",
      "title": "SwissKnife Terminal",
      "description": "AI-powered terminal with P2P collaboration",
      "backendDependencies": ["CLI engine", "AI providers", "P2P networking"],
      "features": ["AI assistance", "P2P task sharing", "Collaborative sessions"],
      "icon": "🖥️"
    }
    // ... 26 more applications
  ]
}
```

## Usage

### Running Screenshot Automation

```bash
# Start the desktop application
npm run desktop

# Run the complete documentation automation
npx playwright test test/e2e/desktop-applications-documentation.test.ts

# Or use the convenience script
npm run automation:screenshots
```

### Updating Documentation

```bash
# Regenerate all documentation
npm run docs:generate

# Update specific application documentation
npm run docs:update-app calculator

# Deploy documentation to GitHub Pages
npm run docs:deploy
```

### Development Workflow

1. **Make UI Changes**: Modify application interfaces
2. **Run Automation**: Execute screenshot capture automation
3. **Review Changes**: Compare new screenshots with previous versions
4. **Update Documentation**: Regenerate documentation with new screenshots
5. **Commit Changes**: Include both code and documentation updates

## Benefits

### For Development Teams

1. **Always Up-to-Date**: Documentation automatically reflects current UI state
2. **Visual Change Tracking**: Immediate detection of unintended UI changes
3. **Parallel Development**: Clear backend dependencies enable parallel work
4. **Comprehensive Coverage**: All 27 applications documented consistently

### For Project Management

1. **Progress Visualization**: Screenshots show development progress
2. **Feature Documentation**: Automatic feature cataloging and comparison
3. **Dependency Mapping**: Clear understanding of frontend-backend relationships
4. **Quality Assurance**: Automated visual regression detection

### For New Developers

1. **Complete Overview**: Comprehensive application catalog with visuals
2. **Clear Dependencies**: Understanding of backend requirements
3. **Development Guides**: Parallel development strategies and best practices
4. **Current State**: Always current screenshots and documentation

## Troubleshooting

### Common Issues

#### Desktop Application Won't Start
```bash
# Check if port is available
lsof -i :3001

# Kill existing processes
pkill -f "vite.*3001"

# Restart desktop
npm run desktop
```

#### Playwright Browser Issues
```bash
# Reinstall Playwright browsers
npx playwright install --force

# Clear cache
rm -rf ~/.cache/ms-playwright
npx playwright install
```

#### Screenshot Timing Issues
```typescript
// Add wait conditions
await page.waitForSelector('.desktop-ready');
await page.waitForTimeout(2000);
await page.screenshot();
```

### Performance Optimization

1. **Parallel Execution**: Run tests in parallel where possible
2. **Screenshot Optimization**: Use appropriate image formats and compression
3. **Selective Updates**: Only update changed applications
4. **Caching**: Cache stable screenshots to reduce execution time

---

*This automation system ensures that SwissKnife's documentation remains current and comprehensive, supporting parallel frontend and backend development through clear visual documentation and dependency mapping.*