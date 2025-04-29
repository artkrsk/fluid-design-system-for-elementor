#!/bin/bash
# WP-CLI wrapper for Local by Flywheel

# Set script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load configuration
source "$SCRIPT_DIR/load-config.sh"

# For debugging
if [ "$DEBUG" = "1" ]; then
    echo "WP-CLI Path: $WP_CLI_PATH"
    echo "WordPress Path: $WP_PATH"
    echo "DB Socket: $DB_SOCKET"
    echo "DB Name: $DB_NAME"
    echo "DB User: $DB_USER"
    echo "DB Password: $DB_PASSWORD"
fi

# Use WP_CLI_PATH from configuration
if [ ! -f "$WP_CLI_PATH" ] && ! command -v "$WP_CLI_PATH" &> /dev/null; then
    echo "Error: WP-CLI not found at $WP_CLI_PATH"
    exit 1
fi

# Check if WordPress directory exists
if [ ! -d "$WP_PATH" ]; then
    echo "Error: WordPress directory not found at $WP_PATH"
    exit 1
fi

# Handle db check command specially
if [[ "$*" == "db check" ]]; then
    echo "Running custom database check..."
    
    # Direct MySQL connection check
    if command -v mysql &> /dev/null; then
        echo "Checking database connection using mysql client..."
        
        if [ -n "$DB_SOCKET" ] && [ -e "$DB_SOCKET" ]; then
            mysql -u"$DB_USER" -p"$DB_PASSWORD" --socket="$DB_SOCKET" "$DB_NAME" -e "SELECT 1" &>/dev/null
        else
            mysql -u"$DB_USER" -p"$DB_PASSWORD" -h"$DB_HOST" "$DB_NAME" -e "SELECT 1" &>/dev/null
        fi
        
        if [ $? -eq 0 ]; then
            echo "✅ Database connection verified"
            exit 0
        else
            echo "❌ Database connection failed"
            exit 1
        fi
    fi
    
    # If mysqlcheck is available, run it directly with proper arguments
    if command -v mysqlcheck &> /dev/null; then
        echo "Checking database tables using mysqlcheck..."
        
        if [ -n "$DB_SOCKET" ] && [ -e "$DB_SOCKET" ]; then
            mysqlcheck --socket="$DB_SOCKET" -u"$DB_USER" -p"$DB_PASSWORD" --check "$DB_NAME" &>/dev/null
        else
            mysqlcheck -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" --check "$DB_NAME" &>/dev/null
        fi
        
        if [ $? -eq 0 ]; then
            echo "✅ Database tables verified"
            exit 0
        else
            echo "❌ Database tables check failed"
            exit 1
        fi
    else
        echo "⚠️ Neither mysql nor mysqlcheck available. Cannot verify database."
        exit 1
    fi
fi

# Create temporary WP-CLI config
TMP_CONFIG=$(mktemp)
cat > "$TMP_CONFIG" << EOF
path: $WP_PATH
url: http://localhost
core download:
  locale: en_US
core config:
  dbhost: $DB_SOCKET
  dbname: $DB_NAME
  dbuser: $DB_USER
  dbpass: $DB_PASSWORD
EOF

echo "Using temporary WP-CLI config: $TMP_CONFIG"

# Change to WordPress directory to ensure correct context
cd "$WP_PATH"

# Set PHP configuration if available
if [ -n "$PHP_INI_PATH" ] && [ -f "$PHP_INI_PATH" ]; then
    echo "Using PHP configuration: $PHP_INI_PATH"
    # Execute WP-CLI with PHP configuration and config file
    php -c "$PHP_INI_PATH" "$WP_CLI_PATH" --config="$TMP_CONFIG" "$@"
    RESULT=$?
else
    # Execute WP-CLI normally with config file
    "$WP_CLI_PATH" --config="$TMP_CONFIG" "$@"
    RESULT=$?
fi

# Clean up
rm -f "$TMP_CONFIG"

# Return to original directory
cd - > /dev/null

exit $RESULT 
