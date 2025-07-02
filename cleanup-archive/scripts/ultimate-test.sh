#!/bin/bash
# Ultimate test pattern verification
# This will create minimal tests with ultimate simplicity

mkdir -p test_verify

# Create the absolute minimal test
cat > test_verify/minimal.test.js << 'EOF'
test('minimal test', () => {
  expect(1 + 1).toBe(2);
});
EOF

# Run with absolute minimal config
npx jest test_verify/minimal.test.js
