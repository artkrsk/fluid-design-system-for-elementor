#!/bin/bash
# Load configuration values from config.js

# Set script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Extract values using Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install it first."
    exit 1
fi

# Function to get a configuration value
get_config_value() {
    local path="$1"
    node -e "
        import('file://${SCRIPT_DIR}/config.js')
            .then(module => {
                const config = module.default;
                const value = ${path};
                console.log(value);
            })
            .catch(error => {
                console.error('Error loading config:', error);
                process.exit(1);
            });
    "
}

# WordPress path
WP_PATH=$(get_config_value "config.wordpress.path")
PLUGIN_SLUG=$(get_config_value "config.wordpress.plugin.slug")
PLUGIN_PATH=$(get_config_value "config.wordpress.plugin.path")
ZIP_FILE=$(get_config_value "config.wordpress.plugin.zipFile")
TEMP_DIR=$(get_config_value "config.tests.tempDir")
PLUGIN_CHECK_RESULT_FILE=$(get_config_value "config.tests.pluginCheckResultFile")

# Database credentials
DB_HOST=$(get_config_value "config.wordpress.database.host")
DB_SOCKET=$(get_config_value "config.wordpress.database.socket")
DB_NAME=$(get_config_value "config.wordpress.database.name")
DB_USER=$(get_config_value "config.wordpress.database.user")
DB_PASSWORD=$(get_config_value "config.wordpress.database.password")

# Set WP-CLI path for Local
# First try Local's bundled WP-CLI
LOCAL_WP_CLI="/Applications/Local.app/Contents/Resources/extraResources/bin/wp-cli/posix/wp"
if [ -f "$LOCAL_WP_CLI" ]; then
    WP_CLI_PATH="$LOCAL_WP_CLI"
    # Use php.ini path for Local installation to prevent DB connection errors
    PHP_INI_PATH="$WP_PATH/../../conf/php/php.ini"
    export PHP_INI_PATH
elif command -v wp &> /dev/null; then
    # Fall back to system wp if available
    WP_CLI_PATH="wp"
else
    echo "⚠️ No WP-CLI found. Some tests will be skipped."
    WP_CLI_PATH="wp"  # Set a default, will fail gracefully in scripts
fi

# Export the values for use in other scripts
export WP_PATH
export PLUGIN_SLUG
export PLUGIN_PATH
export ZIP_FILE
export TEMP_DIR
export PLUGIN_CHECK_RESULT_FILE
export PROJECT_ROOT
export WP_CLI_PATH
export DB_HOST
export DB_SOCKET
export DB_NAME
export DB_USER
export DB_PASSWORD

# Debug output if requested
if [ "$DEBUG" = "1" ]; then
    echo "Configuration loaded:"
    echo "WP_PATH: $WP_PATH"
    echo "PLUGIN_SLUG: $PLUGIN_SLUG"
    echo "PLUGIN_PATH: $PLUGIN_PATH"
    echo "ZIP_FILE: $ZIP_FILE"
    echo "TEMP_DIR: $TEMP_DIR"
    echo "PLUGIN_CHECK_RESULT_FILE: $PLUGIN_CHECK_RESULT_FILE"
    echo "PROJECT_ROOT: $PROJECT_ROOT"
    echo "WP_CLI_PATH: $WP_CLI_PATH"
    echo "DB_HOST: $DB_HOST"
    echo "DB_SOCKET: $DB_SOCKET"
    echo "DB_NAME: $DB_NAME"
    echo "DB_USER: $DB_USER"
    echo "DB_PASSWORD: $DB_PASSWORD"
    if [ -n "$PHP_INI_PATH" ]; then
        echo "PHP_INI_PATH: $PHP_INI_PATH"
    fi
fi 
