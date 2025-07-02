#!/bin/bash
# debug-environment.sh
# Simple environment debugging script

echo "=== Environment Debug ==="
echo "Current directory: $(pwd)"
echo "Node version: $(node --version 2>&1 || echo 'Node not found')"
echo "NPM version: $(npm --version 2>&1 || echo 'NPM not found')"
echo "Jest available: $(which jest || echo 'Jest not found')"
echo "NPX available: $(which npx || echo 'NPX not found')"

echo "=== File System Check ==="
echo "SwissKnife directory exists: $(ls -d /home/barberb/swissknife 2>/dev/null || echo 'Directory not found')"
echo "Package.json exists: $(ls /home/barberb/swissknife/package.json 2>/dev/null || echo 'Not found')"
echo "Jest config exists: $(ls /home/barberb/swissknife/jest-fixed.config.cjs 2>/dev/null || echo 'Not found')"

echo "=== Test Directory Structure ==="
echo "Test directory: $(ls -la /home/barberb/swissknife/test/ 2>/dev/null | head -5 || echo 'Test directory not found')"

echo "=== Simple Command Test ==="
echo "Current time: $(date)"
echo "Basic ls: $(ls | head -3)"

echo "=== Checking for hanging processes ==="
ps aux | grep node | head -5
ps aux | grep jest | head -5

echo "=== Environment variables ==="
echo "PATH: $PATH"
echo "NODE_PATH: $NODE_PATH"
echo "=== End Debug ==="
