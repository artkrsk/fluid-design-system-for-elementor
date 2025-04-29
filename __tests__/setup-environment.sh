#!/bin/bash
# Setup the testing environment by installing necessary tools
#
# This script:
# 1. Ensures jq is installed for parsing JSON
# 2. Ensures MySQL client tools are available
# 3. Checks Local for WP-CLI and configures paths
# 4. Verifies database connectivity
# 5. Prepares the environment for testing

# Set script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Process command line arguments
DEBUG=0
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --debug) DEBUG=1 ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

# Export debug flag
export DEBUG

# Color output helpers
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print success messages
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to print warning messages
warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

# Function to print error messages
error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to print info messages
info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# Function to print debug messages
debug() {
    if [ "$DEBUG" -eq 1 ]; then
        echo -e "${BLUE}DEBUG: $1${NC}"
    fi
}

# Check and save original PATH
ORIGINAL_PATH=$PATH

# Add MySQL client tools to PATH if installed
if [ -d "/opt/homebrew/opt/mysql-client/bin" ]; then
    export PATH="/opt/homebrew/opt/mysql-client/bin:$PATH"
    debug "Added MySQL client tools to PATH: /opt/homebrew/opt/mysql-client/bin"
fi

# Check for dotenv file and load if it exists
if [ -f "$PROJECT_ROOT/.env.test" ]; then
    debug "Loading environment variables from .env.test"
    # Source the file to get environment variables
    source "$PROJECT_ROOT/.env.test"
elif [ -f "$PROJECT_ROOT/.env" ]; then
    debug "Loading environment variables from .env"
    source "$PROJECT_ROOT/.env"
fi

info "Setting up testing environment..."

# Check for jq
if ! command -v jq &> /dev/null; then
    warning "jq not found. Attempting to install..."
    
    # Check OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            info "Installing jq via Homebrew..."
            brew install jq
        else
            warning "Homebrew not found. Please install Homebrew first:"
            echo "https://brew.sh/"
            echo "Then run: brew install jq"
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command -v apt-get &> /dev/null; then
            info "Installing jq via apt..."
            sudo apt-get update
            sudo apt-get install -y jq
        elif command -v yum &> /dev/null; then
            info "Installing jq via yum..."
            sudo yum install -y jq
        else
            warning "Unable to determine package manager. Please install jq manually:"
            echo "https://stedolan.github.io/jq/download/"
        fi
    else
        warning "Unsupported OS. Please install jq manually:"
        echo "https://stedolan.github.io/jq/download/"
    fi
else
    success "jq is already installed"
fi

# Check for MySQL client tools
if ! command -v mysql &> /dev/null || ! command -v mysqlcheck &> /dev/null; then
    warning "MySQL client tools missing or incomplete. Checking installation..."
    
    # Check if already installed but not in PATH
    if [ -f "/opt/homebrew/opt/mysql-client/bin/mysql" ] && [ -f "/opt/homebrew/opt/mysql-client/bin/mysqlcheck" ]; then
        info "MySQL client tools are installed but not in PATH."
        info "Adding to PATH for this session."
        export PATH="/opt/homebrew/opt/mysql-client/bin:$PATH"
        echo "Consider adding this line to your .zshrc or .bash_profile:"
        echo "export PATH=\"/opt/homebrew/opt/mysql-client/bin:\$PATH\""
    else
        warning "MySQL client tools not found. Attempting to install..."
        if [[ "$OSTYPE" == "darwin"* ]] && command -v brew &> /dev/null; then
            info "Installing MySQL client tools via Homebrew..."
            brew install mysql-client
            export PATH="/opt/homebrew/opt/mysql-client/bin:$PATH"
        else
            warning "Please install MySQL client tools manually:"
            echo "On macOS: brew install mysql-client"
            echo "On Linux: sudo apt-get install mysql-client"
        fi
    fi
fi

# Verify MySQL client tools
if command -v mysql &> /dev/null && command -v mysqlcheck &> /dev/null; then
    success "MySQL client tools are installed"
    
    if [ "$DEBUG" -eq 1 ]; then
        mysql --version
    fi
else
    warning "MySQL client tools are still missing. Some tests may fail."
fi

# Load config (after installing jq since load-config.sh checks for it)
source "$SCRIPT_DIR/load-config.sh"

info "WordPress path: $WP_PATH"

# Check WP_PATH exists
if [ ! -d "$WP_PATH" ]; then
    warning "WordPress directory not found: $WP_PATH"
    info "Update path in __tests__/config.js or set WP_PATH environment variable"
fi

# Check for Local's WP-CLI
LOCAL_BUNDLED_WP_CLI="/Applications/Local.app/Contents/Resources/extraResources/bin/wp-cli/posix/wp"
if [ -f "$LOCAL_BUNDLED_WP_CLI" ]; then
    success "Local's bundled WP-CLI found at: $LOCAL_BUNDLED_WP_CLI"
    chmod +x "$LOCAL_BUNDLED_WP_CLI" 2>/dev/null
else
    warning "Local's bundled WP-CLI not found at expected location"
fi

if [ -f "$WP_CLI_PATH" ]; then
    success "Using WP-CLI from: $WP_CLI_PATH"
    chmod +x "$WP_CLI_PATH" 2>/dev/null
    
    # Test if WordPress is running
    info "Testing WordPress connection..."
    if [ "$DEBUG" -eq 1 ]; then
        debug "Running with DEBUG=1 for detailed output"
        debug "Testing: $SCRIPT_DIR/wp-local.sh db check"
        "$SCRIPT_DIR/wp-local.sh" db check
    else
        "$SCRIPT_DIR/wp-local.sh" db check &>/dev/null
    fi
    
    if [ $? -eq 0 ]; then
        success "WordPress is running correctly"
        
        # Check WordPress version
        WP_VERSION=$("$SCRIPT_DIR/wp-local.sh" core version 2>/dev/null)
        info "WordPress version: $WP_VERSION"
        
        # Test MySQL connection directly
        info "Testing MySQL connection..."
        if command -v mysql &> /dev/null; then
            mysql -u$DB_USER -p$DB_PASSWORD -h$DB_HOST $DB_NAME -e "SELECT 'MySQL connection successful'" &>/dev/null
            
            if [ $? -eq 0 ]; then
                success "MySQL connection successful using host"
            else
                warning "MySQL connection failed using host"
                info "Trying socket connection..."
                
                if [ -n "$DB_SOCKET" ] && [ -e "$DB_SOCKET" ]; then
                    mysql -u$DB_USER -p$DB_PASSWORD --socket=$DB_SOCKET $DB_NAME -e "SELECT 'MySQL connection successful'" &>/dev/null
                    
                    if [ $? -eq 0 ]; then
                        success "MySQL socket connection successful"
                    else
                        warning "MySQL socket connection failed"
                    fi
                fi
            fi
        else
            warning "MySQL client not found, skipping direct connection test"
        fi
    else
        warning "WordPress connection test failed"
        info "Please ensure your Local site is running"
        echo "-----------------------------------------------------"
        echo "1. Open the Local app"
        echo "2. Start the 'fluid-ds' site"
        echo "3. Wait for the site to fully start (green status)"
        echo "4. Run this script again with --debug for more information:"
        echo "   bash __tests__/setup-environment.sh --debug"
        echo "-----------------------------------------------------"
    fi
else
    warning "WP-CLI not found at: $WP_CLI_PATH"
    
    if command -v wp &> /dev/null; then
        success "System-wide WP-CLI is available as fallback"
    else
        warning "System-wide WP-CLI not found"
        info "Please install WP-CLI: https://wp-cli.org/#installing"
    fi
fi

# Check if plugin build exists
if [ ! -f "$PROJECT_ROOT/$ZIP_FILE" ]; then
    warning "Plugin ZIP file not found at: $PROJECT_ROOT/$ZIP_FILE"
    info "Run 'npm run build' to create the plugin ZIP file"
else
    success "Plugin ZIP file found: $ZIP_FILE"
    
    # Get file size
    if [ "$DEBUG" -eq 1 ]; then
        if command -v du &> /dev/null; then
            debug "Plugin ZIP size: $(du -h "$PROJECT_ROOT/$ZIP_FILE" | cut -f1)"
        fi
    fi
fi

info "Environment setup complete!" 
