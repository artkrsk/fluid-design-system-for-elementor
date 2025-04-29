#!/bin/bash
# Validate the structure of the WordPress plugin ZIP file

# Load configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/load-config.sh"

echo "Validating plugin ZIP..."
if [ ! -f "$PROJECT_ROOT/$ZIP_FILE" ]; then
  echo "❌ ZIP file not found! Run 'npm run build' first"
  exit 1
fi

# Extract and check essential files
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"
echo "Extracting ZIP file: $PROJECT_ROOT/$ZIP_FILE to $TEMP_DIR"
unzip -q "$PROJECT_ROOT/$ZIP_FILE" -d "$TEMP_DIR"

# Check for essential directories
PLUGIN_DIR="$TEMP_DIR/$PLUGIN_SLUG"
echo "Checking plugin structure in: $PLUGIN_DIR"

# List the contents for debugging
echo "--- Plugin directory structure ---"
find "$PLUGIN_DIR" -type d -maxdepth 2 | sort

# Check vendor directory specifically
echo "--- Checking for vendor files ---"
find "$PLUGIN_DIR" -path "*/vendor/*" -name "autoload.php" | sort

# Define critical directories and files that must exist
CRITICAL_ITEMS=(
  "src/php"
  "vendor/autoload.php"
  "fluid-design-system-for-elementor.php"
  "readme.txt"
  "languages"
)

for item in "${CRITICAL_ITEMS[@]}"; do
  if [ ! -e "$PLUGIN_DIR/$item" ]; then
    echo "❌ Critical component missing: $item"
    
    # Add extra diagnostic information for missing component
    component_dir=$(dirname "$PLUGIN_DIR/$item")
    if [ -d "$component_dir" ]; then
      echo "Parent directory exists. Contents of $component_dir:"
      ls -la "$component_dir"
    else
      echo "Parent directory doesn't exist: $component_dir"
      
      # Special handling for vendor/autoload.php
      if [ "$item" = "vendor/autoload.php" ]; then
        echo "Searching for autoload.php anywhere in the ZIP..."
        find "$TEMP_DIR" -name "autoload.php"
        
        echo "Searching for any vendor directory..."
        find "$TEMP_DIR" -type d -name "vendor"
      fi
    fi
    
    exit 1
  else
    echo "✓ Found: $item"
  fi
done

# Check for the library files specifically
LIBRARY_DIR="$PLUGIN_DIR/src/php/libraries/arts-fluid-design-system"
if [ ! -d "$LIBRARY_DIR" ]; then
  echo "❌ Library directory missing: src/php/libraries/arts-fluid-design-system"
  exit 1
fi

LIBRARY_FILES=(
  "index.css"
  "index.umd.js"
)

for file in "${LIBRARY_FILES[@]}"; do
  if [ ! -f "$LIBRARY_DIR/$file" ]; then
    echo "❌ Library file missing: $file"
    exit 1
  else
    echo "✓ Found library file: $file"
  fi
done

echo "✅ ZIP structure validated successfully" 
