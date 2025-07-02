# Phased Code Cleanup Plan

This document outlines a systematic approach to reorganizing the SwissKnife project's root directory into appropriate subfolders while maintaining imports and package integrity.

## 🎯 Current State Analysis

The root directory currently contains **430+ files**, with many categories that need organization:

### File Categories Identified:
1. **Test Scripts & Runners** (~150 files): Various test execution and fixing scripts
2. **Jest Configurations** (~50 files): Multiple Jest config variations
3. **Documentation Reports** (~30 files): Test reports, progress updates, session reports
4. **Debug & Diagnostic Scripts** (~40 files): Debugging and analysis tools
5. **Archive & Cleanup Scripts** (~20 files): File management and archival scripts
6. **Build & Config Files** (~15 files): Build configurations, Docker, package files
7. **Core Project Files** (~10 files): Essential project files (README, package.json, etc.)

## 🏗️ Phased Cleanup Strategy

### Phase 1: Create Organizational Structure (SAFE)
**Goal**: Create target directories without moving files yet
**Risk Level**: None - Only creates folders

### Phase 2: Archive Legacy Test Infrastructure (HIGH IMPACT)
**Goal**: Move superseded test files to archive
**Risk Level**: Low - Moves unused files to archive

### Phase 3: Consolidate Active Configurations (MEDIUM IMPACT)
**Goal**: Organize active configurations and remove duplicates
**Risk Level**: Medium - Affects active configurations

### Phase 4: Reorganize Scripts and Tools (MEDIUM IMPACT)
**Goal**: Move scripts to appropriate tool directories
**Risk Level**: Medium - May affect automated processes

### Phase 5: Clean Documentation and Reports (LOW IMPACT)
**Goal**: Organize documentation and archive old reports
**Risk Level**: Low - Documentation cleanup

### Phase 6: Final Validation and Cleanup (LOW IMPACT)
**Goal**: Verify everything works and remove empty directories
**Risk Level**: Low - Final verification

## 📁 Target Directory Structure

```
swissknife/
├── .github/                    # GitHub configurations
├── .vscode/                    # VS Code configurations
├── archived/                   # Existing archived content
├── build-tools/               # NEW: Build and deployment tools
│   ├── configs/               # Build configurations
│   ├── docker/                # Docker files
│   └── scripts/               # Build scripts
├── cleanup-archive/           # Existing cleanup archive
├── docs/                      # Documentation (existing)
│   ├── reports/               # NEW: Generated reports and summaries
│   └── legacy/                # NEW: Archived documentation
├── scripts/                   # Existing scripts directory
│   ├── test-tools/            # NEW: Test execution and fixing scripts
│   ├── diagnostics/           # NEW: Debug and diagnostic tools
│   ├── maintenance/           # NEW: Cleanup and maintenance scripts
│   └── archive/               # NEW: Legacy scripts
├── src/                       # Source code (existing)
├── test/                      # Test files (existing)
├── config/                    # NEW: Configuration files
│   ├── jest/                  # Jest configurations
│   ├── typescript/            # TypeScript configurations
│   └── archive/               # Archived configurations
├── tools/                     # NEW: Development tools
│   ├── validators/            # Validation scripts
│   ├── generators/            # Code generation tools
│   └── analyzers/             # Analysis tools
├── logs/                      # Existing logs directory
├── coverage/                  # Existing coverage directory
├── dist/                      # Build output (existing)
├── node_modules/              # Dependencies (existing)
└── [core files]              # package.json, README.md, etc.
```

## 📋 Detailed File Organization Plan

### Phase 1: Create Directory Structure
```bash
# Create new organizational directories
mkdir -p build-tools/{configs,docker,scripts}
mkdir -p docs/{reports,legacy}
mkdir -p scripts/{test-tools,diagnostics,maintenance,archive}
mkdir -p config/{jest,typescript,archive}
mkdir -p tools/{validators,generators,analyzers}
```

### Phase 2: Archive Legacy Test Infrastructure

#### Test Scripts to Archive (Moving to `scripts/archive/`)
- All `*-test-runner*.sh` files (except the most recent)
- All `fix-*-test*.sh` files (except actively used ones)
- All `run-*-tests*.sh` files (except core ones)
- Legacy diagnostic scripts
- Superseded test utilities

#### Jest Configurations to Archive (Moving to `config/archive/`)
- All duplicate jest config files (keeping only active ones)
- Legacy configuration variations
- Experimental configurations that are no longer needed

### Phase 3: Consolidate Active Configurations

#### Active Jest Configs (Moving to `config/jest/`)
- `jest.config.cjs` → `config/jest/jest.config.cjs`
- `jest.hybrid.config.cjs` → `config/jest/jest.hybrid.config.cjs`
- `babel.config.cjs` → `config/jest/babel.config.cjs`

#### TypeScript Configs (Moving to `config/typescript/`)
- `tsconfig.json` → `config/typescript/tsconfig.json`
- `tsconfig.test.json` → `config/typescript/tsconfig.test.json`
- `tsconfig.jest.json` → `config/typescript/tsconfig.jest.json`

### Phase 4: Reorganize Scripts and Tools

#### Active Test Tools (Moving to `scripts/test-tools/`)
- `validate-fixes.cjs`
- `tsx-test-runner.cjs`
- `direct-test-runner-v2.cjs`
- Key test execution scripts

#### Diagnostic Tools (Moving to `scripts/diagnostics/`)
- Debug scripts
- Analysis tools
- Validation utilities

#### Build Tools (Moving to `build-tools/`)
- `Dockerfile` → `build-tools/docker/Dockerfile`
- `docker-compose.yml` → `build-tools/docker/docker-compose.yml`
- Deploy scripts → `build-tools/scripts/`

### Phase 5: Clean Documentation and Reports

#### Reports to Archive (Moving to `docs/reports/`)
- All `*-REPORT.md` files
- All `*-SUMMARY.md` files
- Session reports and progress updates

#### Legacy Documentation (Moving to `docs/legacy/`)
- Archived documentation files
- Superseded guides and strategies

### Phase 6: Update Import Paths

After moving configuration files, update references in:
- `package.json` scripts
- GitHub Actions workflows
- VS Code configurations
- Documentation references

## 🔧 Implementation Scripts

### Phase 1 Implementation Script
```bash
#!/bin/bash
# phase1-create-structure.sh

echo "Phase 1: Creating organizational directory structure..."

# Create main organizational directories
mkdir -p build-tools/{configs,docker,scripts}
mkdir -p docs/{reports,legacy}
mkdir -p scripts/{test-tools,diagnostics,maintenance,archive}
mkdir -p config/{jest,typescript,archive}
mkdir -p tools/{validators,generators,analyzers}

echo "✅ Phase 1 complete: Directory structure created"
```

### Phase 2 Implementation Script
```bash
#!/bin/bash
# phase2-archive-legacy-tests.sh

echo "Phase 2: Archiving legacy test infrastructure..."

# Archive legacy test runners
mv *-test-runner*.sh scripts/archive/ 2>/dev/null || true
mv fix-*-test*.sh scripts/archive/ 2>/dev/null || true
mv run-*-tests*.sh scripts/archive/ 2>/dev/null || true

# Archive duplicate jest configs (keep only essential ones)
mv jest-*.config.* config/archive/ 2>/dev/null || true
mv jest.*.config.* config/archive/ 2>/dev/null || true

echo "✅ Phase 2 complete: Legacy files archived"
```

## 🚨 Safety Measures

### Backup Strategy
1. **Create full backup** before starting cleanup
2. **Commit current state** to git
3. **Test package integrity** after each phase
4. **Validate imports** after configuration moves

### Rollback Plan
1. Keep backup of original structure
2. Use git to revert changes if needed
3. Maintain list of moved files for quick restoration

### Validation Checklist
- [ ] Package builds successfully
- [ ] Tests run with new configuration paths
- [ ] All imports resolve correctly
- [ ] Documentation links work
- [ ] Scripts execute properly

## 📊 Expected Benefits

### Immediate Benefits
- **Reduced root directory clutter**: From 430+ to ~30 core files
- **Improved navigation**: Logical organization of files
- **Better maintainability**: Clear separation of concerns

### Long-term Benefits
- **Easier onboarding**: New developers can understand structure quickly
- **Improved automation**: Scripts and tools are logically organized
- **Better documentation**: Reports and guides are properly categorized
- **Simplified maintenance**: Related files are grouped together

## 🎮 Execution Strategy

### Recommended Approach
1. **Execute phases sequentially** - Don't skip ahead
2. **Test after each phase** - Verify nothing breaks
3. **Update documentation** - Keep references current
4. **Communicate changes** - Inform team of new structure

### Risk Mitigation
- Start with low-risk phases (directory creation)
- Test thoroughly before proceeding to next phase
- Keep detailed logs of all moves and changes
- Maintain rollback capability throughout process

This phased approach ensures a systematic, safe reorganization of the project structure while maintaining full functionality and improving long-term maintainability.
