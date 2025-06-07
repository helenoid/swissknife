#!/bin/bash
# Create a backup and baseline for the project before making further changes

# Set up colors
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
RESET="\033[0m"

echo -e "${BLUE}SwissKnife Project Backup & Baseline${RESET}"
echo "================================="

# Create backup directory with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backup-$TIMESTAMP"
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}Creating backup of critical files...${RESET}"

# Backup key configuration files
cp package.json "$BACKUP_DIR/"
cp jest*.config.* "$BACKUP_DIR/" 2>/dev/null || true
cp babel*.config.* "$BACKUP_DIR/" 2>/dev/null || true
cp tsconfig*.json "$BACKUP_DIR/" 2>/dev/null || true

# Backup test files
mkdir -p "$BACKUP_DIR/test"
cp -r test/* "$BACKUP_DIR/test/" 2>/dev/null || true

echo -e "${GREEN}Backup created at: $BACKUP_DIR${RESET}"

# Create baseline metrics
echo -e "\n${YELLOW}Creating project baseline...${RESET}"

# Log Node.js and npm versions
echo "Node.js version: $(node -v)" > "$BACKUP_DIR/baseline.txt"
echo "npm version: $(npm -v)" >> "$BACKUP_DIR/baseline.txt"

# Count files by type
echo -e "\nFile counts:" >> "$BACKUP_DIR/baseline.txt"
echo "TypeScript files: $(find . -name "*.ts" | wc -l)" >> "$BACKUP_DIR/baseline.txt"
echo "JavaScript files: $(find . -name "*.js" | wc -l)" >> "$BACKUP_DIR/baseline.txt"
echo "Test files: $(find . -name "*.test.*" | wc -l)" >> "$BACKUP_DIR/baseline.txt"
echo "Config files: $(find . -name "*.config.*" | wc -l)" >> "$BACKUP_DIR/baseline.txt"

# Log package.json information
echo -e "\nPackage information:" >> "$BACKUP_DIR/baseline.txt"
echo "Type: $(node -e "console.log(require('./package.json').type || 'commonjs')")" >> "$BACKUP_DIR/baseline.txt"
echo "Main: $(node -e "console.log(require('./package.json').main || 'N/A')")" >> "$BACKUP_DIR/baseline.txt"
echo "Test script: $(node -e "console.log(require('./package.json').scripts.test || 'N/A')")" >> "$BACKUP_DIR/baseline.txt"

# List installed Jest-related packages
echo -e "\nInstalled Jest-related packages:" >> "$BACKUP_DIR/baseline.txt"
npm list | grep jest >> "$BACKUP_DIR/baseline.txt" || echo "No Jest packages found" >> "$BACKUP_DIR/baseline.txt"

# Try running the default test command
echo -e "\n${YELLOW}Running default test command...${RESET}"
npm test > "$BACKUP_DIR/default_test_output.txt" 2>&1

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Default test command succeeded!${RESET}"
else
  echo -e "${RED}❌ Default test command failed.${RESET}"
fi

echo -e "${GREEN}Baseline created at: $BACKUP_DIR/baseline.txt${RESET}"
echo -e "Default test output: $BACKUP_DIR/default_test_output.txt"

# Create a snapshot of key source files related to tests
echo -e "\n${YELLOW}Creating source code snapshot...${RESET}"
mkdir -p "$BACKUP_DIR/src"

# Backup key model files for registry tests
mkdir -p "$BACKUP_DIR/src/ai/models"
cp src/ai/models/registry.* "$BACKUP_DIR/src/ai/models/" 2>/dev/null || true
cp src/ai/models/model.* "$BACKUP_DIR/src/ai/models/" 2>/dev/null || true

# Backup storage files
mkdir -p "$BACKUP_DIR/src/storage"
cp -r src/storage/* "$BACKUP_DIR/src/storage/" 2>/dev/null || true

# Backup command files for help-generator tests
mkdir -p "$BACKUP_DIR/src/commands"
cp src/commands/help-generator.* "$BACKUP_DIR/src/commands/" 2>/dev/null || true
cp src/commands/registry.* "$BACKUP_DIR/src/commands/" 2>/dev/null || true

echo -e "${GREEN}Source code snapshot created.${RESET}"

echo -e "\n${BLUE}Backup and baseline complete!${RESET}"
echo -e "You can now make modifications with a safe rollback point."
echo -e "To restore the backup: cp -r $BACKUP_DIR/* ./"
