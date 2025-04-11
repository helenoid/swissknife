#!/usr/bin/env bash
set -e

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check for help flag
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
  echo -e "${BLUE}Swiss Knife Installer Help${NC}"
  echo -e "${BLUE}=======================${NC}"
  echo -e "This script installs the Swiss Knife tool globally."
  echo -e ""
  echo -e "Usage: ./install.sh [options]"
  echo -e ""
  echo -e "Options:"
  echo -e "  -h, --help    Show this help message and exit"
  echo -e ""
  echo -e "The script will:"
  echo -e "  1. Check Node.js version (requires v18+)"
  echo -e "  2. Install Bun if not already installed"
  echo -e "  3. Install dependencies"
  echo -e "  4. Build the project"
  echo -e "  5. Install the tool globally"
  echo -e "  6. Create both 'kode' and 'swissknife' commands"
  echo -e ""
  exit 0
fi

echo -e "${BLUE}Swiss Knife Installer${NC}"
echo -e "${BLUE}===================${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed. Please install Node.js 18 or higher.${NC}"
    exit 1
fi

# Check node version
NODE_VERSION=$(node -v | cut -d 'v' -f 2)
NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d '.' -f 1)

if [ $NODE_MAJOR_VERSION -lt 18 ]; then
    echo -e "${RED}Error: Node.js version 18 or higher is required. You have version $NODE_VERSION.${NC}"
    exit 1
fi

# Check if Bun is installed
if ! command -v bun &> /dev/null; then
    echo -e "${YELLOW}Warning: Bun is not installed. Installing Bun...${NC}"
    npm install -g bun
fi

# Install dependencies
echo -e "${BLUE}Installing dependencies...${NC}"
npm install --legacy-peer-deps

# Build the project
echo -e "${BLUE}Building the project...${NC}"
bun run build

# Install globally
echo -e "${BLUE}Installing globally...${NC}"
npm install -g . --force

# Verify installation
echo -e "${BLUE}Verifying installation...${NC}"
which swissknife &>/dev/null && SWISSKNIFE_INSTALLED=true || SWISSKNIFE_INSTALLED=false
which kode &>/dev/null && KODE_INSTALLED=true || KODE_INSTALLED=false

if [ "$SWISSKNIFE_INSTALLED" = true ] && [ "$KODE_INSTALLED" = true ]; then
    echo -e "${GREEN}Installation successful!${NC}"
    echo -e "${GREEN}You can now run the tool with either 'swissknife' or 'kode' command.${NC}"
else
    echo -e "${RED}Installation failed. The commands 'swissknife' and/or 'kode' are not available in your PATH.${NC}"
    exit 1
fi

echo -e "\n${BLUE}Usage:${NC}"
echo -e "  ${GREEN}kode${NC} - Start the Swiss Knife CLI"
echo -e "  ${GREEN}swissknife${NC} - Alternative command for the CLI"
echo -e "\nFor more information, see the README.md file."