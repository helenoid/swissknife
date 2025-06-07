#!/bin/bash
# final-test-fixes.sh - Final fixes for failing tests

# Make sure we're in the right directory
cd /home/barberb/swissknife

echo "Fixing ModelSelector.tsx import paths..."
# Fix ModelSelector.tsx import paths
sed -i 's/\.js\.js\.js/\.js/g' src/components/ModelSelector.tsx
sed -i 's/\.js\.js/\.js/g' src/components/ModelSelector.tsx

echo "Fixing model_selector.test.tsx import paths..."
# Fix model_selector.test.tsx imports
sed -i 's/import React from '\''react\.js'\''/import React from '\''react'\''/g' test/model_selector.test.tsx
sed -i 's/import { ModelSelector } from '\''\.\.\/\.js'\''/import { ModelSelector } from '\''\.\.\/src\/components\/ModelSelector\.js'\''/g' test/model_selector.test.tsx
sed -i 's/import { getGlobalConfig, saveGlobalConfig, addApiKey } from '\''\.\.\/\.js'\''/import { getGlobalConfig, saveGlobalConfig, addApiKey } from '\''\.\.\/src\/utils\/config\.js'\''/g' test/model_selector.test.tsx
sed -i 's/import { getSessionState, setSessionState } from '\''\.\.\/\.js'\''/import { getSessionState, setSessionState } from '\''\.\.\/src\/utils\/sessionState\.js'\''/g' test/model_selector.test.tsx

echo "Fixing registry.test.ts..."
# Fix registry.test.ts file
sed -i 's/expect(retrievedModel)\.toBeDefined\(\)/expect(retrievedModel)\.toBeDefined\(\)/g' test/unit/models/registry.test.ts
sed -i 's/expect(retrievedModel\.id)\.to\.equal/expect(retrievedModel?.id)\.to\.equal/g' test/unit/models/registry.test.ts
sed -i 's/expect(retrievedModel)\.to\.be\.undefined/expect(retrievedModel)\.toBeUndefined()/g' test/unit/models/registry.test.ts

echo "Fixing simple-storage.test.js..."
# Fix simple-storage.test.js imports
sed -i 's/import { FileStorage } from '\''\.\.\/\.js'\''/import { FileStorage } from '\''\.\.\/src\/storage\/local\/file-storage\.js'\''/g' test/simple-storage.test.js
sed -i 's/\.js\.js\.js\.js\.js/\.js/g' test/simple-storage.test.js

# Run target tests
echo "Running ModelSelector test..."
NODE_OPTIONS=--experimental-vm-modules npx jest test/model_selector.test.tsx --detectOpenHandles

echo "Running registry.test.ts..."
NODE_OPTIONS=--experimental-vm-modules npx jest test/unit/models/registry.test.ts --detectOpenHandles

echo "Running simple-storage.test.js..."
NODE_OPTIONS=--experimental-vm-modules npx jest test/simple-storage.test.js --detectOpenHandles
