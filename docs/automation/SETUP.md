# SwissKnife Documentation Automation Setup

This guide explains how to set up and use the automated screenshot and documentation system for SwissKnife's virtual desktop applications.

## Quick Start

### 1. Install Dependencies
```bash
# Install project dependencies
npm install --legacy-peer-deps

# Install Playwright browsers
npx playwright install
```

### 2. Run Desktop Application
```bash
# Start the SwissKnife desktop in the background
npm run desktop
```

### 3. Run Documentation Automation
```bash
# Capture screenshots and generate documentation
npm run docs:update-screenshots

# Alternative: Run only documentation generation
npm run docs:generate
```

## Manual Screenshot Capture

### Using the Built-in Automation Script
```bash
# Run the complete automation (screenshots + docs)
node scripts/automation/update-screenshots.js

# Or use the npm script
npm run automation:screenshots
```

### Using Playwright Directly
```bash
# Run the Playwright test suite
npx playwright test test/e2e/desktop-applications-documentation.test.ts

# Run with specific browser
npx playwright test test/e2e/desktop-applications-documentation.test.ts --project=chromium
```

## GitHub Actions Integration

The repository includes automated CI/CD workflows:

### Automatic Triggers
- **Code Changes**: Runs when `web/` or `src/` files are modified
- **Weekly Updates**: Scheduled every Sunday at 2 AM UTC
- **Manual Trigger**: Can be triggered manually from GitHub Actions

### Manual Workflow Dispatch
1. Go to **Actions** tab in GitHub
2. Select **SwissKnife Documentation Automation**
3. Click **Run workflow**
4. Optionally enable **Force update all screenshots**

## Configuration

### Application Definitions
Applications are defined in `scripts/automation/update-screenshots.js`:

```javascript
const APPLICATIONS = [
  {
    name: 'terminal',
    selector: '[data-app="terminal"]',
    title: 'SwissKnife Terminal',
    description: 'AI-powered terminal with P2P collaboration',
    backendDependencies: ['CLI engine', 'AI providers'],
    features: ['AI assistance', 'P2P task sharing'],
    icon: '🖥️',
    registeredApp: true
  }
  // ... more applications
];
```

### Playwright Configuration
The system uses the project's `playwright.config.ts`:

```typescript
export default defineConfig({
  testDir: './test/e2e',
  use: {
    baseURL: 'http://localhost:3001',
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: 'npm run desktop',
    url: 'http://localhost:3001',
    reuseExistingServer: true
  }
});
```

## Output Structure

The automation generates the following files:

```
docs/
├── applications/
│   ├── README.md                    # Main application catalog
│   ├── backend-dependencies.md     # Frontend-backend mapping
│   ├── features-matrix.md          # Feature comparison matrix
│   ├── terminal.md                 # Individual app docs
│   ├── vibecode.md
│   └── ...
├── screenshots/
│   ├── desktop-overview.png        # Full desktop screenshot
│   ├── terminal-icon.png          # Application icons
│   ├── terminal-window.png        # Application windows
│   └── ...
└── automation/
    ├── README.md                   # This automation guide
    └── SETUP.md                    # Setup instructions
```

## Adding New Applications

### 1. Register Application in Desktop
Ensure your application is registered in the desktop system:

```javascript
// In web/main.ts or similar
const REGISTERED_APPS = [
  'terminal',
  'vibecode',
  'your-new-app'  // Add here
];
```

### 2. Add to Automation Script
Update `scripts/automation/update-screenshots.js`:

```javascript
const APPLICATIONS = [
  // ... existing apps
  {
    name: 'your-new-app',
    selector: '[data-app="your-new-app"]',
    title: 'Your New Application',
    description: 'Description of your application',
    backendDependencies: ['service1', 'service2'],
    features: ['feature1', 'feature2'],
    icon: '🎨',
    registeredApp: true
  }
];
```

### 3. Test the Integration
```bash
# Run automation to verify new app is captured
npm run docs:update-screenshots
```

## Troubleshooting

### Common Issues

#### Desktop Won't Start
```bash
# Check if port 3001 is in use
lsof -i :3001

# Kill existing processes
pkill -f "vite.*3001"

# Restart desktop
npm run desktop
```

#### Playwright Errors
```bash
# Reinstall browsers
npx playwright install --force

# Check browser installation
npx playwright doctor
```

#### Application Not Found
1. Verify application is registered in the desktop system
2. Check the CSS selector is correct
3. Ensure application appears on the desktop UI
4. Add appropriate wait conditions if needed

#### Screenshots Not Updating
1. Check if desktop is running properly
2. Verify Playwright can access the application
3. Look for console errors in the application
4. Ensure sufficient wait time for application loading

### Debug Mode

Enable debug output:

```bash
# Run with debug logging
DEBUG=* npm run docs:update-screenshots

# Playwright debug mode
PWDEBUG=1 npx playwright test test/e2e/desktop-applications-documentation.test.ts
```

### Headful Mode (for debugging)
```bash
# Run Playwright in headed mode to see what's happening
npx playwright test test/e2e/desktop-applications-documentation.test.ts --headed
```

## Performance Optimization

### Selective Updates
Only update changed applications by modifying the script to compare timestamps or file hashes.

### Parallel Execution
Run tests in parallel for faster execution:

```bash
npx playwright test --workers=4
```

### Screenshot Optimization
- Use appropriate image formats (PNG for screenshots)
- Consider compression for large images
- Implement incremental updates

## Integration with Development Workflow

### Pre-commit Hooks
Add to `.husky/pre-commit` or similar:

```bash
#!/bin/sh
# Update documentation if UI files changed
if git diff --cached --name-only | grep -q "^web/"
then
  npm run docs:update-screenshots
  git add docs/
fi
```

### CI/CD Pipeline Integration
The GitHub Actions workflow automatically:
1. Detects changes to UI code
2. Captures new screenshots
3. Updates documentation
4. Commits changes back to the repository
5. Creates PR comments with summary

## Best Practices

### Documentation Maintenance
1. **Regular Updates**: Schedule weekly automated runs
2. **Change Validation**: Review screenshot diffs before merging
3. **Consistent Naming**: Use standardized file naming conventions
4. **Version Control**: Track changes in documentation over time

### Performance Considerations
1. **Efficient Selectors**: Use specific, fast CSS selectors
2. **Appropriate Waits**: Wait for content to load fully
3. **Resource Management**: Clean up processes after testing
4. **Parallel Processing**: Run independent tests in parallel

### Quality Assurance
1. **Visual Regression**: Compare new screenshots with baselines
2. **Cross-browser Testing**: Test on multiple browser engines
3. **Error Handling**: Gracefully handle failed applications
4. **Comprehensive Coverage**: Ensure all applications are documented

---

*For additional help, refer to the main [Automation README](README.md) or check the GitHub Actions logs for detailed error messages.*