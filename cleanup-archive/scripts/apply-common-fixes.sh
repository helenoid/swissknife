#!/bin/bash
# Common test failure fixes for SwissKnife
# This script applies common fixes to JS and TS files in the codebase

# Basic setup
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== SwissKnife Common Test Fixes =====${NC}"
echo "Applying common fixes to make tests work..."

# 1. Add missing .js extensions in import statements
echo -e "${YELLOW}Adding missing .js extensions to imports...${NC}"
find ./src ./test -type f -name "*.js" -o -name "*.ts" -o -name "*.tsx" | xargs grep -l "from '[^']*'" | while read -r file; do
  # Skip files in node_modules and dist
  if [[ "$file" == *"node_modules"* ]] || [[ "$file" == *"dist"* ]]; then
    continue
  fi
  
  echo "Fixing imports in $file"
  # This sed command adds .js to imports that don't have a file extension and don't point to node_modules
  sed -i -E "s/from ['\"]([^'\"@][^'\"]*[^'\"\.][^'\"]*)['\"]/from '\1.js'/g" "$file"
  # This one handles imports starting with './' or '../'
  sed -i -E "s/from ['\"](\.\/[^'\"]*[^'\"\.][^'\"]*)['\"]/from '\1.js'/g" "$file"
  sed -i -E "s/from ['\"](\.\.\/[^'\"]*[^'\"\.][^'\"]*)['\"]/from '\1.js'/g" "$file"
done

# 2. Fix TypeScript/JavaScript compatibility issues
echo -e "${YELLOW}Creating alternate implementation of problematic files...${NC}"

# Fix FibonacciHeap.js issues with const assignment
FIBONACCI_HEAP_FILE="./src/tasks/scheduler/fibonacci-heap.js"
if [ -f "$FIBONACCI_HEAP_FILE" ]; then
  echo "Fixing FibonacciHeap implementation to avoid const assignment issues"
  sed -i 's/const other = degreeArray\[degree\];/let other = degreeArray[degree];/' "$FIBONACCI_HEAP_FILE"
  sed -i 's/\[current, other\] = \[other, current\];/let temp = current; current = other; other = temp;/' "$FIBONACCI_HEAP_FILE"
fi

# Fix DAG.js to add missing methods
DAG_FILE="./src/tasks/graph/dag.js"
if [ -f "$DAG_FILE" ]; then
  echo "Adding missing accessor methods to DAG implementation"
  
  # Check if methods already exist
  if ! grep -q "getNode" "$DAG_FILE"; then
    # Find the right place to insert the methods - after the constructor section
    LINE_NUM=$(grep -n "addNode" "$DAG_FILE" | head -n 1 | cut -d':' -f1)
    if [ -n "$LINE_NUM" ]; then
      # Insert getNode method
      sed -i "${LINE_NUM}i\\
  /**\\
   * Gets a node by its ID.\\
   * @param {string} nodeId - ID of the node to get.\\
   * @returns {Object|undefined} The node data, or undefined if not found.\\
   */\\
  getNode(nodeId) {\\
    const node = this.nodes.get(nodeId);\\
    return node ? node.data : undefined;\\
  }\\
\\
  /**\\
   * Gets the successors of a node.\\
   * @param {string} nodeId - ID of the node.\\
   * @returns {Set<string>|undefined} Set of successor node IDs, or undefined if the node doesn't exist.\\
   */\\
  getSuccessors(nodeId) {\\
    const node = this.nodes.get(nodeId);\\
    return node ? node.successors : undefined;\\
  }\\
\\
  /**\\
   * Gets the predecessors of a node.\\
   * @param {string} nodeId - ID of the node.\\
   * @returns {Set<string>|undefined} Set of predecessor node IDs, or undefined if the node doesn't exist.\\
   */\\
  getPredecessors(nodeId) {\\
    const node = this.nodes.get(nodeId);\\
    return node ? node.predecessors : undefined;\\
  }\\
" "$DAG_FILE"
    fi
  fi
fi

# 3. Update Test files to handle special ES Module import
echo -e "${YELLOW}Fixing test imports to use .js extensions...${NC}"
find ./test -type f -name "*.test.js" -o -name "*.test.ts" -o -name "*.test.tsx" | while read -r file; do
  echo "Fixing imports in $file"
  
  # Replace imports lacking .js extension
  sed -i -E 's/from "\.\.\/(.*)"/from "\.\.\/$1.js"/g' "$file"
  sed -i -E "s/from '\.\.\/(.*)'/from '\.\.\/$1.js'/g" "$file"
  
  # Fix paths with more than one level up
  sed -i -E 's/from "\.\.\/\.\.\/(.*)"/from "\.\.\/\.\.\/$1.js"/g' "$file"
  sed -i -E "s/from '\.\.\/\.\.\/(.*)'/from '\.\.\/$1.js'/g" "$file"
  
  # Fix paths with src in them 
  sed -i -E 's/from "(\.\.\/)*src\/(.*)"/from "$1src\/$2.js"/g' "$file"
  sed -i -E "s/from '(\.\.\/)*src\/(.*)'/from '$1src\/$2.js'/g" "$file"
done

# 4. Apply fix for expect() references in test files
echo -e "${YELLOW}Fixing expect() usage in tests...${NC}"
find ./test -type f -name "*.test.js" -o -name "*.test.ts" -o -name "*.test.tsx" | xargs grep -l "expect" | while read -r file; do
  # Ensure expect is properly imported
  if ! grep -q "import { expect } from " "$file"; then
    echo "Adding proper expect import in $file"
    sed -i '1s/^/import { expect } from "chai";\n/' "$file"
  fi
done

echo -e "${GREEN}Common fixes applied successfully!${NC}"
echo "Now run your tests with the unified configuration:"
echo "npx jest --config=jest.unified.config.cjs test/unit/tasks/fibonacci-heap.test.ts"
