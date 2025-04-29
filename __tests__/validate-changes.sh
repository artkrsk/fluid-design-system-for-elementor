#!/bin/bash
# Validate the testing system changes
# This script quickly checks if all components of the testing system are functioning correctly

# Set script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== Testing System Validation =====${NC}"
echo "Checking if all testing components are available and functional..."
echo

# Check if all required files exist
echo -e "${BLUE}Checking required files:${NC}"
FILES=(
  "config.js"
  "load-config.sh" 
  "run-all-tests.sh"
  "setup-environment.sh"
  "validate-zip.sh"
  "test-activation.sh"
  "run-plugin-check.sh"
  "wp-local.sh"
)

ALL_FILES_EXIST=true
for file in "${FILES[@]}"; do
  if [ -f "$SCRIPT_DIR/$file" ]; then
    echo -e "${GREEN}✓ $file${NC}"
  else
    echo -e "${RED}✗ $file - MISSING${NC}"
    ALL_FILES_EXIST=false
  fi
done

if [ "$ALL_FILES_EXIST" = false ]; then
  echo -e "${RED}Some required files are missing!${NC}"
  exit 1
fi

echo -e "\n${BLUE}Checking script permissions:${NC}"
for file in "${FILES[@]}"; do
  if [[ "$file" == *".sh" ]] && [ -f "$SCRIPT_DIR/$file" ]; then
    if [ -x "$SCRIPT_DIR/$file" ]; then
      echo -e "${GREEN}✓ $file is executable${NC}"
    else
      echo -e "${YELLOW}! Making $file executable${NC}"
      chmod +x "$SCRIPT_DIR/$file"
    fi
  fi
done

# Check if package.json has the test scripts
echo -e "\n${BLUE}Checking package.json scripts:${NC}"
if [ -f "$PROJECT_ROOT/package.json" ]; then
  if grep -q "\"test\":" "$PROJECT_ROOT/package.json"; then
    echo -e "${GREEN}✓ test script found${NC}"
  else
    echo -e "${RED}✗ test script missing${NC}"
  fi
  
  if grep -q "\"test:setup\":" "$PROJECT_ROOT/package.json"; then
    echo -e "${GREEN}✓ test:setup script found${NC}"
  else
    echo -e "${YELLOW}! test:setup script missing${NC}"
  fi
else
  echo -e "${RED}✗ package.json not found${NC}"
fi

# Check MySQL client availability
echo -e "\n${BLUE}Checking MySQL client:${NC}"
if command -v mysql &> /dev/null; then
  echo -e "${GREEN}✓ mysql command available${NC}"
  mysql --version
else
  echo -e "${YELLOW}! mysql command not found${NC}"
  echo "Run: brew install mysql-client"
  echo "And add it to your PATH: export PATH=\"/opt/homebrew/opt/mysql-client/bin:\$PATH\""
fi

# Check jq availability
echo -e "\n${BLUE}Checking jq:${NC}"
if command -v jq &> /dev/null; then
  echo -e "${GREEN}✓ jq command available${NC}"
  jq --version
else
  echo -e "${YELLOW}! jq command not found${NC}"
  echo "Run: brew install jq"
fi

# Check WP-CLI availability
echo -e "\n${BLUE}Checking WP-CLI wrapper:${NC}"
if [ -f "$SCRIPT_DIR/wp-local.sh" ] && [ -x "$SCRIPT_DIR/wp-local.sh" ]; then
  echo -e "${GREEN}✓ wp-local.sh is available and executable${NC}"
else
  echo -e "${RED}✗ wp-local.sh is not available or not executable${NC}"
fi

# Check build output
echo -e "\n${BLUE}Checking plugin build:${NC}"
source "$SCRIPT_DIR/load-config.sh" &> /dev/null
if [ -f "$PROJECT_ROOT/$ZIP_FILE" ]; then
  echo -e "${GREEN}✓ Plugin ZIP file exists: $ZIP_FILE${NC}"
  echo "Size: $(du -h "$PROJECT_ROOT/$ZIP_FILE" | cut -f1)"
else
  echo -e "${YELLOW}! Plugin ZIP file not found${NC}"
  echo "Run: npm run build to create it"
fi

echo -e "\n${BLUE}===== Validation Complete =====${NC}"
echo -e "To run the complete test suite:"
echo -e "  ${GREEN}npm run test:full${NC}"
echo
echo -e "To setup only:"
echo -e "  ${GREEN}npm run test:setup${NC}"
echo
echo -e "To see debug output:"
echo -e "  ${GREEN}npm run test:debug${NC}" 
