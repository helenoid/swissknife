# Test Archival Strategy for SwissKnife Project

## Analysis Summary
Based on systematic review of 317 active tests and archived backups, the following patterns were identified:

### Key Findings

1. **50 Duplicate Test Files**: Tests exist both as active files and archived backups
2. **Assertion Pattern Migration**: Archived versions use Chai assertions, active versions use Jest
3. **Import/Mock Issues**: Several tests have unresolved module imports causing failures
4. **Test Redundancy**: Multiple minimal/diagnostic test variations with overlapping functionality

### Archival Categories

#### Category A: Clear Superseded Tests (Safe to Archive)
These are old versions that have been clearly replaced by newer implementations:

**Minimal Test Variations:**
- `test/minimal.test.js` → Has modern Jest assertions
- `test/archived/backup-files/bak/minimal.test.js.bak` → Uses old Chai assertions
- **Action**: Keep active version, archive is already properly stored

**Basic Copy Tests:**
- `test/basic-working.test.js` → Modern, functional version
- `test/archived/debugging-artifacts/basic-copy.test.js` → Old version
- **Action**: The archived version is already properly placed

**Assertion Pattern Migrations:**
- `test/diagnostic-simple.test.js` → Uses Jest + proper mocks
- `test/archived/backup-files/bak/diagnostic-simple.test.js.bak` → Uses Chai assertions
- **Action**: Archived version is superseded

#### Category B: Failed/Broken Tests (Needs Investigation)
Tests that are currently failing due to import or configuration issues:

**Import Issues:**
- `test/unit/utils/events/event-bus.test.js` → EventBus import errors
- `test/integration/phase5.test.js` → TaskManager not defined
- `test/unit/commands/help-generator.test.js` → CommandRegistry not defined

**Action Required:** Fix imports or archive if truly obsolete

#### Category C: Test Variations (Needs Consolidation)
Multiple tests covering similar functionality:

**Command Registry Tests:**
- `test/command-registry-simplified.test.js`
- `test/command-registry-simplified_assertion_fixed.test.js`
- `test/command-registry-minimal.test.js`
- `test/command-registry-core.test.js`
- `test/unit/command-registry.test.js`

**Diagnostic Tests:**
- `test/diagnostic-simple.test.js`
- `test/diagnostic-enhanced.test.js`
- `test/diagnostic-basic.test.js`
- `test/diagnostic-tool.test.js`
- `test/diagnostic.test.js`

**Action Required:** Identify the most comprehensive test and archive redundant ones

### Recommended Actions

#### Phase 1: Fix Critical Import Issues
1. Fix EventBus import in `test/unit/utils/events/event-bus.test.js`
2. Fix TaskManager import in `test/integration/phase5.test.js`
3. Fix CommandRegistry import in `test/unit/commands/help-generator.test.js`

#### Phase 2: Consolidate Redundant Tests
1. **Command Registry Tests**: Keep `test/unit/command-registry.test.js` (most comprehensive)
2. **Diagnostic Tests**: Keep `test/diagnostic-enhanced.test.js` (most feature-complete)
3. **Move redundant tests** to archive with clear naming

#### Phase 3: Verify Test Coverage
1. Run test coverage analysis to ensure no functionality is lost
2. Compare test coverage before/after archival
3. Document any unique test cases that need preservation

### Archive Structure
Continue using the existing structure:
```
test/archived/backup-files/
├── bak/           # Superseded test versions
├── deps-bak/      # Dependency-related test backups
├── helper-bak/    # Test helper backups
├── import-bak/    # Import-related test backups
└── mock-bak/      # Mock-related test backups
```

### Success Metrics
- Reduce active test count from 317 to ~250-280 
- Achieve >95% test pass rate
- Maintain or improve test coverage
- Clear documentation of archived tests
