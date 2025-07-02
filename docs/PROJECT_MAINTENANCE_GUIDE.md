# SwissKnife Project Maintenance Guide

## 🎯 Overview

This guide ensures the SwissKnife project maintains its clean, organized structure and prevents the accumulation of temporary files, backup files, and diagnostic scripts that can clutter the workspace.

## 🧹 Regular Maintenance Tasks

### Daily/Weekly Maintenance
```bash
# Run the automated maintenance script
./cleanup-archive/scripts/project-maintenance.sh

# Check for new files in root directory
ls -1 | grep -v -E '^(node_modules|\.git|\.github|\.vscode|cleanup-archive|test|src|docs|coverage|dist|archived|benchmark|benchmarks|deploy|goose|ipfs_accelerate_js|lilypad-docs|logs|scripts|solution_tests|types)$'
```

### Test Directory Hygiene
```bash
# Check for new backup files
find test -name "*.bak" -not -path "*/archived/*"

# Archive new backup files if found
find test -name "*.bak" -not -path "*/archived/*" -exec mv {} test/archived/backup-files/bak/ \;

# Verify test functionality
npm test test/unit/minimal.test.js
```

### Before Commits
```bash
# Ensure no temporary files are staged
git status | grep -E '\.(bak|tmp|log)$'

# Run tests to ensure nothing is broken
npm test
```

## 📁 File Organization Rules

### Root Directory - KEEP ONLY:
- **Configuration**: `package.json`, `tsconfig.json`, `jest.config.cjs`
- **Entry points**: `cli.mjs`
- **Documentation**: `README.md`, `CHANGELOG.md`
- **Container**: `Dockerfile`, `docker-compose.yml`
- **CI/CD**: `.github/`, `codecov.yml`, `sonar-project.properties`
- **Development**: `.eslintrc.js`, `.prettierrc`, `.gitignore`

### Automatic Archival Categories:
1. **Scripts** → `cleanup-archive/scripts/`
   - `*-diagnostic*.js`, `validate-*.mjs`, `verify-*.js`
   - `standalone-*.js`, `build-*.js`, `debug-*.mjs`

2. **Configs** → `cleanup-archive/configs/`
   - `jest-*.config.js`, `babel.config.*.js`
   - Alternative configuration files

3. **Logs** → `cleanup-archive/logs/`
   - `*.log`, `junit.xml`, `isolate-*.log`
   - Test run logs and diagnostic outputs

4. **Temporary** → `cleanup-archive/temp-files/`
   - `*.bak`, `*.backup`, `*.tmp`
   - `temp-*.js`, `*.zip`

5. **Analysis** → `cleanup-archive/analysis/`
   - `*-analysis-*.txt`, `*-diagnostic*.json`
   - Performance and diagnostic reports

## 🧪 Test Management

### Active Test Directory Structure
```
test/
├── unit/           # Unit tests
├── integration/    # Integration tests
├── e2e/           # End-to-end tests
├── archived/      # Historical test files
│   ├── superseded/     # Files replaced by newer versions
│   └── backup-files/   # Original backup files
└── setup-jest.js  # Test configuration
```

### Test Archival Process
1. **Identify superseded tests**: Compare backup files with active versions
2. **Check for Chai vs Jest patterns**: Archive older Chai-based tests
3. **Size and date comparison**: Archive when active version is clearly newer
4. **Manual review**: Ambiguous cases require human judgment

### Test File Naming
- **Active tests**: `*.test.js`, `*.test.ts`
- **Backup files**: `*.test.js.bak`
- **Archived**: Move to appropriate archive subdirectory

## 🚫 Prevention Strategies

### Updated .gitignore
The `.gitignore` file now includes patterns to prevent committing:
- Diagnostic files (`*-diagnostic*.js`, `*-diagnostic*.py`)
- Backup files (`*.bak`, `*.backup`, `*.tmp`)
- Alternative Jest configs (except main `jest.config.cjs`)
- Analysis outputs (`*-analysis-*.txt`)
- Temporary scripts (`temp-*.js`, `systematic-*.js`)

### Development Best Practices
1. **Use temporary directories**: Create files in `temp/` or similar, not root
2. **Name diagnostic scripts clearly**: Use patterns that trigger .gitignore
3. **Clean up after experiments**: Remove or archive experimental files
4. **Use proper test directories**: Don't create test files in root
5. **Regular maintenance**: Run maintenance script weekly

## 🔧 Troubleshooting

### If Root Directory Gets Cluttered Again
```bash
# Quick cleanup
find . -maxdepth 1 -name "*.bak" -exec mv {} cleanup-archive/temp-files/ \;
find . -maxdepth 1 -name "*-diagnostic*" -exec mv {} cleanup-archive/analysis/ \;
find . -maxdepth 1 -name "jest-*.config.js" -exec mv {} cleanup-archive/configs/ \;
```

### If Tests Stop Working
```bash
# Check Jest config exists
ls -la jest.config.cjs

# Restore if missing
cp cleanup-archive/scripts/jest.config.cjs .

# Verify test setup
npm test test/unit/minimal.test.js
```

### If Archive Gets Too Large
```bash
# Compress old archives periodically
cd cleanup-archive
tar -czf archived-$(date +%Y%m%d).tar.gz temp-files/old-*
rm -rf temp-files/old-*
```

## 📊 Health Metrics

Monitor these metrics to ensure project health:

### Acceptable Ranges
- **Root files**: < 20 (excluding standard directories)
- **Active tests**: 50-100 test files
- **Archive size**: Monitor growth, compress when needed
- **Test pass rate**: > 95% for core functionality

### Warning Signs
- **Root clutter**: > 30 files in root directory
- **Test backup accumulation**: > 50 new .bak files
- **Large log files**: > 10MB log files in root
- **Broken tests**: Any core tests failing

## 🎯 Success Criteria

A well-maintained SwissKnife project should have:
- ✅ Clean root directory with only essential files
- ✅ Organized archive structure
- ✅ Working test infrastructure
- ✅ No accumulation of temporary files
- ✅ Fast development workflows
- ✅ Easy navigation and file discovery

---

**Remember**: The goal is sustainable development with minimal maintenance overhead. The automated tools and processes described here should make project hygiene effortless.
