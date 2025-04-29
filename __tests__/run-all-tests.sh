#!/bin/bash
# Master script that runs all tests in sequence

# Set script directory and make it the working directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# Process command line arguments
SETUP=0
REBUILD=0
DEBUG=0
SKIP_TESTS=""

print_usage() {
  echo "Usage: $0 [options]"
  echo "Options:"
  echo "  --setup            Run environment setup first"
  echo "  --rebuild          Rebuild the plugin before testing"
  echo "  --debug            Show detailed debug output"
  echo "  --skip=<test>      Skip specific test (validate-zip, activation, plugin-check)"
  echo "Example:"
  echo "  $0 --setup --rebuild --debug"
  exit 1
}

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --setup) SETUP=1 ;;
        --rebuild) REBUILD=1 ;;
        --debug) DEBUG=1 ;;
        --skip=*) SKIP_TESTS="${1#*=}" ;;
        --help) print_usage ;;
        *) echo "Unknown parameter: $1"; print_usage ;;
    esac
    shift
done

# Export debug flag
export DEBUG

# Run setup if requested
if [ "$SETUP" -eq 1 ]; then
    if [ "$DEBUG" -eq 1 ]; then
        bash "$SCRIPT_DIR/setup-environment.sh" --debug
    else
        bash "$SCRIPT_DIR/setup-environment.sh"
    fi
fi

# Load configuration
source "$SCRIPT_DIR/load-config.sh"

# Enable error handling
set -e

# Color output helpers
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print section headers
print_header() {
    echo -e "\n${YELLOW}=== $1 ===${NC}\n"
}

# Function to print info messages
print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# Function to run a test script
run_test() {
    local script="$1"
    local description="$2"
    local skip_key="$3"
    
    # Check if test should be skipped
    if [[ "$SKIP_TESTS" == *"$skip_key"* ]]; then
        echo -e "\n${BLUE}ℹ️ Skipping: $description${NC}"
        return 0
    fi
    
    print_header "$description"
    
    if [ "$DEBUG" -eq 1 ]; then
        bash "$SCRIPT_DIR/$script" --debug
    else
        bash "$SCRIPT_DIR/$script"
    fi
    
    local result=$?
    if [ $result -eq 0 ]; then
        echo -e "\n${GREEN}✓ Test passed${NC}"
    else
        echo -e "\n${RED}✗ Test failed${NC}"
        exit 1
    fi
    
    return $result
}

# Main testing flow
print_header "Starting test suite for $PLUGIN_SLUG"

# Print test configuration
if [ "$DEBUG" -eq 1 ]; then
    echo "Test configuration:"
    echo "- WordPress Path: $WP_PATH"
    echo "- Plugin: $PLUGIN_SLUG"
    echo "- ZIP File: $ZIP_FILE"
    echo "- WP-CLI Path: $WP_CLI_PATH"
    echo "- Database: $DB_NAME (user: $DB_USER)"
    echo
fi

# Check if we need to build the plugin
if [ ! -f "$PROJECT_ROOT/$ZIP_FILE" ] || [ "$REBUILD" -eq 1 ]; then
    print_header "Building plugin"
    
    if [ ! -f "package.json" ]; then
        echo -e "${RED}❌ package.json not found. Cannot build plugin.${NC}"
        exit 1
    fi
    
    print_info "Running build command: npm run build"
    npm run build
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Build failed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Build completed successfully${NC}"
    echo -e "ZIP file created at: ${BLUE}$PROJECT_ROOT/$ZIP_FILE${NC}"
fi

# Run all test scripts
run_test "validate-zip.sh" "Validating plugin ZIP structure" "validate-zip"
run_test "test-activation.sh" "Testing plugin activation" "activation"
run_test "run-plugin-check.sh" "Running WordPress plugin checker" "plugin-check"

# All tests passed
echo -e "\n${GREEN}=== All tests passed successfully! ===${NC}"
echo -e "${BLUE}Tested plugin: $PLUGIN_SLUG${NC}" 
