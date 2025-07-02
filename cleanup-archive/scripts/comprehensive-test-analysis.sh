#!/bin/bash
# SwissKnife Comprehensive Test Analysis
# This script performs a detailed analysis of test failures across all modules

# Configuration
OUTPUT_DIR="test-analysis-$(date +%Y%m%d_%H%M%S)"
CONFIGS=(
  "jest.hybrid.config.cjs"
  "jest.minimal.config.cjs"
)
DEFAULT_CONFIG="jest.hybrid.config.cjs"

# Create output directories
mkdir -p "$OUTPUT_DIR/logs"
mkdir -p "$OUTPUT_DIR/diagnostics"
mkdir -p "$OUTPUT_DIR/fixes"

echo "===== SWISSKNIFE COMPREHENSIVE TEST ANALYSIS ====="
echo "Started at $(date)" | tee "$OUTPUT_DIR/start_time.txt"
echo "Results directory: $OUTPUT_DIR"

# Define error categories
declare -A ERROR_CATEGORIES=(
  ["SyntaxError"]="syntax"
  ["ReferenceError"]="reference"
  ["TypeError"]="type"
  ["ImportError"]="import"
  ["Cannot find module"]="module"
  ["ERR_REQUIRE_ESM"]="esm"
  ["ERR_MODULE_NOT_FOUND"]="module"
  ["is not a function"]="type"
  ["is not defined"]="reference"
  ["Invalid hook call"]="react"
  ["No tests found"]="config"
  ["Jest encountered an unexpected token"]="babel"
  ["Timeout"]="timeout"
)

# Function to categorize an error
categorize_error() {
  local error_log="$1"
  local category="unknown"
  
  for key in "${!ERROR_CATEGORIES[@]}"; do
    if grep -q "$key" "$error_log"; then
      category="${ERROR_CATEGORIES[$key]}"
      break
    fi
  done
  
  echo "$category"
}

# Function to analyze a single test file
analyze_test() {
  local test_file="$1"
  local config_file="$2"
  local base_name=$(basename "$test_file")
  local log_file="$OUTPUT_DIR/logs/${base_name}.log"
  
  echo "Analyzing: $test_file (config: $config_file)"
  
  # Run the test
  JEST_WORKER_ID=1 npx jest --config="$config_file" "$test_file" > "$log_file" 2>&1
  local exit_code=$?
  
  if [ $exit_code -eq 0 ]; then
    echo "  ✅ PASSED: $test_file"
    echo "$test_file" >> "$OUTPUT_DIR/passed.txt"
    return 0
  else
    echo "  ❌ FAILED: $test_file"
    echo "$test_file" >> "$OUTPUT_DIR/failed.txt"
    
    # Categorize the error
    local category=$(categorize_error "$log_file")
    echo "$test_file" >> "$OUTPUT_DIR/category_${category}.txt"
    echo "  Error category: $category"
    
    # Extract key error message
    local error_msg=$(grep -A 3 -B 1 "Error:" "$log_file" | head -n 5 | tr '\n' ' ' | sed 's/  */ /g')
    echo "  $error_msg"
    
    # Attempt to fix common issues
    if [ -f "test-fixer.cjs" ]; then
      echo "  🔧 Attempting automatic fix..."
      node test-fixer.cjs "$test_file"
      
      # Re-run the test to see if the fix worked
      JEST_WORKER_ID=1 npx jest --config="$config_file" "$test_file" > "${log_file}.fixed" 2>&1
      local new_exit_code=$?
      
      if [ $new_exit_code -eq 0 ]; then
        echo "  ✅ FIX SUCCESSFUL: $test_file"
        echo "$test_file" >> "$OUTPUT_DIR/fixed.txt"
        
        # Save the fix details
        diff -u "${test_file}.bak" "$test_file" > "$OUTPUT_DIR/fixes/$(basename "$test_file").patch" 2>/dev/null
        
        return 0
      else
        echo "  ❌ FIX FAILED: Further analysis needed"
        
        # Compare the original error with the post-fix error
        local new_category=$(categorize_error "${log_file}.fixed")
        
        if [ "$new_category" != "$category" ]; then
          echo "  ⚠️ Error category changed: $category → $new_category"
          echo "$test_file:$category:$new_category" >> "$OUTPUT_DIR/category_changed.txt"
        fi
      fi
    else
      echo "  ⚠️ test-fixer.cjs not found, skipping automatic fixes"
    fi
    
    # Create enhanced diagnostic test
    create_diagnostic_test "$test_file" "$category"
    
    return 1
  fi
}

# Function to create an enhanced diagnostic test
create_diagnostic_test() {
  local test_file="$1"
  local error_category="$2"
  local base_name=$(basename "$test_file" .test.js)
  local dir_name=$(dirname "$test_file")
  local diag_file="$dir_name/diag-${base_name}.test.js"
  
  echo "  📝 Creating enhanced diagnostic test: $diag_file"
  
  # Extract the module path being tested
  local module_path=${test_file#test/unit/}
  module_path=${module_path%.test.js}
  module_path="src/${module_path}"
  
  # Copy the diagnostic test to output dir for reference
  cp -f "$diag_file" "$OUTPUT_DIR/diagnostics/" 2>/dev/null || true
  
  # Create a specialized diagnostic test based on the error category
  case "$error_category" in
    "module" | "import")
      # Create a specialized test for import/module issues
      cat > "$diag_file" << EOL
/**
 * Advanced Import/Module Diagnostic Test for ${base_name}
 */
const { describe, it, test, expect, beforeEach, afterEach, jest } = require('@jest/globals');
const path = require('path');
const fs = require('fs');

describe('Import/Module Diagnostic for ${base_name}', () => {
  it('should analyze module dependencies', () => {
    // Check the module exists
    const modulePath = path.join(process.cwd(), '${module_path}.js');
    console.log('Checking module path:', modulePath);
    
    try {
      if (fs.existsSync(modulePath)) {
        console.log('✓ Module exists');
        
        // Analyze the file content for imports
        const content = fs.readFileSync(modulePath, 'utf8');
        
        // Extract imports
        const importMatches = content.match(/import[^;]+from\s+['"]([^'"]+)['"]/g) || [];
        const requireMatches = content.match(/require\s*\(['"]([^'"]+)['"]\)/g) || [];
        
        console.log('ES Module imports:');
        importMatches.forEach(match => console.log('  - ' + match.trim()));
        
        console.log('CommonJS requires:');
        requireMatches.forEach(match => console.log('  - ' + match.trim()));
        
        // Check the imported modules
        const dependencies = [
          ...(importMatches.map(m => m.match(/from\s+['"]([^'"]+)['"]/)[1])),
          ...(requireMatches.map(m => m.match(/require\s*\(['"]([^'"]+)['"]\)/)[1]))
        ];
        
        console.log('Checking dependencies:');
        dependencies.forEach(dep => {
          if (dep.startsWith('.')) {
            // Relative import
            const depPath = path.resolve(path.dirname(modulePath), dep);
            try {
              const resolvedPath = require.resolve(depPath);
              console.log(\`  ✓ \${dep} -> \${resolvedPath}\`);
            } catch (e) {
              console.log(\`  ✗ \${dep} (Failed: \${e.message})\`);
            }
          } else {
            // Package import
            try {
              const resolvedPath = require.resolve(dep);
              console.log(\`  ✓ \${dep} -> \${resolvedPath}\`);
            } catch (e) {
              console.log(\`  ✗ \${dep} (Failed: \${e.message})\`);
            }
          }
        });
      } else {
        console.log('✗ Module does not exist at path:', modulePath);
      }
    } catch (error) {
      console.error('Error analyzing module:', error);
    }
    
    // Don't fail the diagnostic test
    expect(true).toBeTruthy();
  });
});
EOL
      ;;
      
    "type" | "reference")
      # Create a specialized test for type/reference errors
      cat > "$diag_file" << EOL
/**
 * Advanced Type/Reference Diagnostic Test for ${base_name}
 */
const { describe, it, test, expect, beforeEach, afterEach, jest } = require('@jest/globals');
const path = require('path');
const fs = require('fs');

describe('Type/Reference Diagnostic for ${base_name}', () => {
  it('should analyze module exports and structure', () => {
    const modulePath = path.join(process.cwd(), '${module_path}.js');
    console.log('Checking module path:', modulePath);
    
    try {
      if (fs.existsSync(modulePath)) {
        console.log('✓ Module exists');
        
        // Try requiring the module safely
        try {
          const moduleObj = require(modulePath);
          console.log('Module loaded successfully');
          console.log('Module type:', typeof moduleObj);
          
          if (moduleObj) {
            if (typeof moduleObj === 'function') {
              console.log('Module is a function');
              console.log('Function name:', moduleObj.name);
              console.log('Prototype methods:', Object.getOwnPropertyNames(moduleObj.prototype || {}));
            } else if (typeof moduleObj === 'object') {
              console.log('Module is an object');
              console.log('Keys:', Object.keys(moduleObj));
              console.log('Properties with types:');
              
              for (const key in moduleObj) {
                try {
                  console.log(\`  - \${key}: \${typeof moduleObj[key]}\`);
                } catch (e) {
                  console.log(\`  - \${key}: <error accessing>\`);
                }
              }
            }
            
            // Check for default export
            if (moduleObj.default) {
              console.log('Has default export');
              console.log('Default export type:', typeof moduleObj.default);
            }
          } else {
            console.log('Module exports null or undefined');
          }
        } catch (e) {
          console.log('Error loading module:', e.message);
          
          // Try a more basic analysis using file content
          const content = fs.readFileSync(modulePath, 'utf8');
          
          // Check export pattern
          const exportMatches = content.match(/export\s+(const|function|class|default|{)[^;]+/g) || [];
          console.log('ES Module exports:');
          exportMatches.forEach(match => console.log('  - ' + match.trim()));
          
          const commonjsExports = content.match(/module\.exports\s*=[^;]+/g) || [];
          console.log('CommonJS exports:');
          commonjsExports.forEach(match => console.log('  - ' + match.trim()));
        }
      } else {
        console.log('✗ Module does not exist at path:', modulePath);
      }
    } catch (error) {
      console.error('Error analyzing module:', error);
    }
    
    // Don't fail the diagnostic test
    expect(true).toBeTruthy();
  });
});
EOL
      ;;
      
    "syntax" | "babel")
      # Create a specialized test for syntax errors
      cat > "$diag_file" << EOL
/**
 * Advanced Syntax Diagnostic Test for ${base_name}
 */
const { describe, it, test, expect, beforeEach, afterEach, jest } = require('@jest/globals');
const path = require('path');
const fs = require('fs');

describe('Syntax Diagnostic for ${base_name}', () => {
  it('should analyze syntax issues', () => {
    const modulePath = path.join(process.cwd(), '${module_path}.js');
    console.log('Checking module path:', modulePath);
    
    try {
      if (fs.existsSync(modulePath)) {
        console.log('✓ Module exists');
        
        // Read the file content for analysis
        const content = fs.readFileSync(modulePath, 'utf8');
        
        // Check for common syntax issues
        console.log('Analyzing syntax patterns:');
        
        // Check for ES module vs CommonJS mixed usage
        const hasImport = /import\s+.*from/.test(content);
        const hasExport = /export\s+(default|const|let|function|class)/.test(content);
        const hasRequire = /require\s*\(/.test(content);
        const hasModuleExports = /module\.exports\s*=/.test(content);
        
        console.log('ES Module syntax:');
        console.log('  - Has import statements:', hasImport);
        console.log('  - Has export statements:', hasExport);
        console.log('CommonJS syntax:');
        console.log('  - Has require statements:', hasRequire);
        console.log('  - Has module.exports:', hasModuleExports);
        
        if (hasImport && hasRequire) {
          console.log('⚠️ Warning: Mixed import/require usage detected');
        }
        
        if (hasExport && hasModuleExports) {
          console.log('⚠️ Warning: Mixed export/module.exports usage detected');
        }
        
        // Check for unclosed strings, brackets, etc.
        const openParens = (content.match(/\(/g) || []).length;
        const closeParens = (content.match(/\)/g) || []).length;
        const openBraces = (content.match(/{/g) || []).length;
        const closeBraces = (content.match(/}/g) || []).length;
        const openBrackets = (content.match(/\[/g) || []).length;
        const closeBrackets = (content.match(/\]/g) || []).length;
        
        console.log('Bracket analysis:');
        console.log('  - Parentheses: Open:', openParens, 'Close:', closeParens, 'Balanced:', openParens === closeParens);
        console.log('  - Braces: Open:', openBraces, 'Close:', closeBraces, 'Balanced:', openBraces === closeBraces);
        console.log('  - Brackets: Open:', openBrackets, 'Close:', closeBrackets, 'Balanced:', openBrackets === closeBrackets);
      } else {
        console.log('✗ Module does not exist at path:', modulePath);
      }
    } catch (error) {
      console.error('Error analyzing module:', error);
    }
    
    // Don't fail the diagnostic test
    expect(true).toBeTruthy();
  });
});
EOL
      ;;
      
    *)
      # Create a generic diagnostic test
      cat > "$diag_file" << EOL
/**
 * Generic Diagnostic Test for ${base_name}
 */
const { describe, it, test, expect, beforeEach, afterEach, jest } = require('@jest/globals');
const path = require('path');
const fs = require('fs');

describe('Generic Diagnostic for ${base_name}', () => {
  it('should check basic module functionality', () => {
    const modulePath = path.join(process.cwd(), '${module_path}.js');
    console.log('Checking module path:', modulePath);
    
    try {
      if (fs.existsSync(modulePath)) {
        console.log('✓ Module exists');
        
        // Basic file info
        const stats = fs.statSync(modulePath);
        console.log('File size:', stats.size, 'bytes');
        console.log('Last modified:', stats.mtime);
        
        // Try a basic mock implementation
        try {
          jest.mock('${module_path}.js', () => ({
            default: {},
            someFunction: jest.fn(),
            someClass: jest.fn().mockImplementation(() => ({
              method: jest.fn()
            }))
          }), { virtual: true });
          console.log('✓ Basic mock implementation successful');
        } catch (e) {
          console.log('✗ Basic mock implementation failed:', e.message);
        }
        
        // Try a simplified version of the test
        try {
          const testFilePath = '${test_file}';
          if (fs.existsSync(testFilePath)) {
            console.log('Original test file exists');
            const testContent = fs.readFileSync(testFilePath, 'utf8');
            
            // Extract describe/it blocks to understand test intent
            const describeMatch = testContent.match(/describe\s*\(['"](.*?)['"]/);
            if (describeMatch) {
              console.log('Test describes:', describeMatch[1]);
            }
            
            const itMatches = testContent.match(/it\s*\(['"](.*?)['"]/g) || [];
            console.log('Test cases:');
            itMatches.forEach(match => {
              const caseMatch = match.match(/it\s*\(['"](.*?)['"]/);
              if (caseMatch) {
                console.log('  -', caseMatch[1]);
              }
            });
          }
        } catch (e) {
          console.log('Error analyzing test file:', e.message);
        }
      } else {
        console.log('✗ Module does not exist at path:', modulePath);
      }
    } catch (error) {
      console.error('Error in diagnostic test:', error);
    }
    
    // Don't fail the diagnostic test
    expect(true).toBeTruthy();
  });
});
EOL
      ;;
  esac
  
  # Run the diagnostic test
  echo "  🔍 Running diagnostic test..."
  JEST_WORKER_ID=1 npx jest --config="jest.minimal.config.cjs" "$diag_file" > "$OUTPUT_DIR/diagnostics/$(basename "$diag_file").log" 2>&1
  
  # Extract diagnostics summary
  echo "  📊 Diagnostic Results:"
  grep -v "PASS\|◀\|▶\|at\|npm ERR\|node_modules" "$OUTPUT_DIR/diagnostics/$(basename "$diag_file").log" | grep -v "^$" | head -n 20 | sed 's/^/    /'
}

# Function to analyze failed tests by category
analyze_failures() {
  echo -e "\n===== FAILURE ANALYSIS ====="
  
  # Count failures by category
  for category in "${ERROR_CATEGORIES[@]}"; do
    local count=$([ -f "$OUTPUT_DIR/category_${category}.txt" ] && wc -l < "$OUTPUT_DIR/category_${category}.txt" || echo 0)
    if [ "$count" -gt 0 ]; then
      echo "Category: $category - $count failures"
    fi
  done
  
  # Generate recommended fixes for each category
  echo -e "\n===== RECOMMENDED FIXES ====="
  
  # Module/Import errors
  if [ -f "$OUTPUT_DIR/category_module.txt" ] || [ -f "$OUTPUT_DIR/category_import.txt" ]; then
    echo "For module/import errors:"
    echo "  1. Ensure all imports have .js extensions for ES modules"
    echo "  2. Fix paths to point to the correct locations"
    echo "  3. Add moduleNameMapper in Jest config for external modules"
    echo "  4. Create mock implementations for missing modules"
  fi
  
  # Syntax/Babel errors
  if [ -f "$OUTPUT_DIR/category_syntax.txt" ] || [ -f "$OUTPUT_DIR/category_babel.txt" ]; then
    echo "For syntax/babel errors:"
    echo "  1. Check for ES modules vs CommonJS syntax mismatches"
    echo "  2. Ensure correct babel presets in jest.config.js"
    echo "  3. Fix the syntax errors identified in logs"
  fi
  
  # Type/Reference errors
  if [ -f "$OUTPUT_DIR/category_type.txt" ] || [ -f "$OUTPUT_DIR/category_reference.txt" ]; then
    echo "  1. Add missing mock implementations"
    echo "  2. Fix incorrect function/method signatures"
    echo "  3. Update test-helper.js with needed dependencies"
  fi
}

# Function to generate a detailed test report
generate_report() {
  echo "Generating comprehensive test report..."
  
  # Calculate totals
  local total_tests=$(find test/unit -name "*.test.js" | wc -l)
  local passed_tests=$([ -f "$OUTPUT_DIR/passed.txt" ] && wc -l < "$OUTPUT_DIR/passed.txt" || echo 0)
  local failed_tests=$([ -f "$OUTPUT_DIR/failed.txt" ] && wc -l < "$OUTPUT_DIR/failed.txt" || echo 0)
  local fixed_tests=$([ -f "$OUTPUT_DIR/fixed.txt" ] && wc -l < "$OUTPUT_DIR/fixed.txt" || echo 0)
  
  # Create report file
  cat > "$OUTPUT_DIR/comprehensive-report.md" << EOL
# SwissKnife Comprehensive Test Analysis Report
Generated at $(date)

## Summary
- Total tests: $total_tests
- Passed tests: $passed_tests
- Failed tests: $failed_tests
- Successfully fixed: $fixed_tests
- Success rate: $(( (passed_tests + fixed_tests) * 100 / total_tests ))%

## Failure Analysis by Category
| Category | Count | Description |
|----------|-------|-------------|
EOL

  # Add category details
  for category in "${ERROR_CATEGORIES[@]}"; do
    local count=$([ -f "$OUTPUT_DIR/category_${category}.txt" ] && wc -l < "$OUTPUT_DIR/category_${category}.txt" || echo 0)
    local description=""
    
    case "$category" in
      "module") description="Module resolution issues (imports, requires)" ;;
      "import") description="Import/export syntax problems" ;;
      "syntax") description="JavaScript syntax errors" ;;
      "babel") description="Babel transformation issues" ;;
      "type") description="Type errors (undefined is not a function, etc.)" ;;
      "reference") description="Reference errors (variable not defined)" ;;
      "esm") description="ES Module compatibility issues" ;;
      "config") description="Configuration problems (no tests found)" ;;
      "timeout") description="Tests timing out" ;;
      "react") description="React-related errors" ;;
      *) description="Other issues" ;;
    esac
    
    if [ "$count" -gt 0 ]; then
      echo "| $category | $count | $description |" >> "$OUTPUT_DIR/comprehensive-report.md"
    fi
  done
  
  # Add recommendation section
  cat >> "$OUTPUT_DIR/comprehensive-report.md" << EOL

## Recommendations

Based on the analysis, here are the recommended next steps:

### Module Resolution Issues
EOL

  if [ -f "$OUTPUT_DIR/category_module.txt" ] || [ -f "$OUTPUT_DIR/category_import.txt" ]; then
    cat >> "$OUTPUT_DIR/comprehensive-report.md" << EOL
- Update import statements to include proper file extensions (especially .js)
- Create mock implementations for external dependencies
- Add moduleNameMapper entries for problematic modules
- Use jest.mock() for complex dependencies
EOL
  else
    echo "- No module resolution issues found" >> "$OUTPUT_DIR/comprehensive-report.md"
  fi
  
  cat >> "$OUTPUT_DIR/comprehensive-report.md" << EOL

### Syntax and Transformation Issues
EOL

  if [ -f "$OUTPUT_DIR/category_syntax.txt" ] || [ -f "$OUTPUT_DIR/category_babel.txt" ]; then
    cat >> "$OUTPUT_DIR/comprehensive-report.md" << EOL
- Fix mixed usage of ES Module and CommonJS syntax
- Update babel configuration to handle all file types correctly
- Check for proper extensionsToTreatAsEsm in Jest config
EOL
  else
    echo "- No syntax or transformation issues found" >> "$OUTPUT_DIR/comprehensive-report.md"
  fi
  
  cat >> "$OUTPUT_DIR/comprehensive-report.md" << EOL

### Type and Reference Errors
EOL

  if [ -f "$OUTPUT_DIR/category_type.txt" ] || [ -f "$OUTPUT_DIR/category_reference.txt" ]; then
    cat >> "$OUTPUT_DIR/comprehensive-report.md" << EOL
- Create proper mock objects with all required methods
- Add test helpers to set up test environment correctly
- Fix function signatures to match expected types
EOL
  else
    echo "- No type or reference errors found" >> "$OUTPUT_DIR/comprehensive-report.md"
  fi
  
  cat >> "$OUTPUT_DIR/comprehensive-report.md" << EOL

## Next Steps

1. Fix the most common error categories first
2. Run tests on a module-by-module basis
3. Create dedicated test helpers for each module
4. Update the Jest configuration as needed
5. Consider splitting tests into ESM and CommonJS groups

## Failing Tests Details

The following tests are still failing:
EOL

  if [ -f "$OUTPUT_DIR/failed.txt" ]; then
    local count=0
    while IFS= read -r test && [ $count -lt 20 ]; do
      local category="unknown"
      for cat in "${ERROR_CATEGORIES[@]}"; do
        if grep -q "$test" "$OUTPUT_DIR/category_${cat}.txt" 2>/dev/null; then
          category="$cat"
          break
        fi
      done
      
      local error_msg=$(grep -A 1 -B 0 "Error:" "$OUTPUT_DIR/logs/$(basename "$test").log" | head -n 2 | tr '\n' ' ' | sed 's/  */ /g')
      echo "- \`$test\` ($category): $error_msg" >> "$OUTPUT_DIR/comprehensive-report.md"
      count=$((count + 1))
    done < "$OUTPUT_DIR/failed.txt"
    
    if [ "$(wc -l < "$OUTPUT_DIR/failed.txt")" -gt 20 ]; then
      echo "- ... and $(( $(wc -l < "$OUTPUT_DIR/failed.txt") - 20 )) more" >> "$OUTPUT_DIR/comprehensive-report.md"
    fi
  else
    echo "None! All tests are passing." >> "$OUTPUT_DIR/comprehensive-report.md"
  fi
  
  echo "Report generated at $OUTPUT_DIR/comprehensive-report.md"
}

# Function to identify all test files
find_all_tests() {
  echo "Finding all test files..."
  find test -name "*.test.js" | sort > "$OUTPUT_DIR/all_tests.txt"
  echo "Found $(wc -l < "$OUTPUT_DIR/all_tests.txt") test files"
}

# Main execution

# Step 1: Find all test files
find_all_tests

# Step 2: Sample a subset of tests first to get an overview
echo -e "\n===== TESTING SAMPLE SUBSET OF TESTS ====="
head -n 10 "$OUTPUT_DIR/all_tests.txt" > "$OUTPUT_DIR/sample_tests.txt"
while IFS= read -r test; do
  analyze_test "$test" "$DEFAULT_CONFIG"
done < "$OUTPUT_DIR/sample_tests.txt"

# Step 3: Analyze failures and provide diagnostics
analyze_failures

# Step 4: Ask user if they want to continue with all tests
read -p "Would you like to analyze all tests? This may take a while. (y/N) " answer
if [[ "$answer" =~ ^[Yy]$ ]]; then
  echo -e "\n===== ANALYZING ALL REMAINING TESTS ====="
  # Skip the first 10 we already tested
  tail -n +11 "$OUTPUT_DIR/all_tests.txt" > "$OUTPUT_DIR/remaining_tests.txt"
  while IFS= read -r test; do
    analyze_test "$test" "$DEFAULT_CONFIG"
  done < "$OUTPUT_DIR/remaining_tests.txt"
  
  # Re-analyze failures with all data
  analyze_failures
fi

# Step 5: Generate a comprehensive report
generate_report

echo -e "\n===== Test analysis complete ====="
echo "Started:  $(cat $OUTPUT_DIR/start_time.txt 2>/dev/null || echo "unknown")"
echo "Finished: $(date)"
echo "Results directory: $OUTPUT_DIR"
echo "Comprehensive report: $OUTPUT_DIR/comprehensive-report.md"
