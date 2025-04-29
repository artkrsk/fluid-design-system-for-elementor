#!/bin/bash
# Thoroughly inspect the ZIP file structure for debugging

# Load configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/load-config.sh"

echo "==== Inspecting ZIP file structure ===="
if [ ! -f "$PROJECT_ROOT/$ZIP_FILE" ]; then
  echo "❌ ZIP file not found! Run 'npm run build' first"
  exit 1
fi

# Create a temporary directory for extraction
INSPECT_DIR="/tmp/zip-inspect"
rm -rf "$INSPECT_DIR"
mkdir -p "$INSPECT_DIR"

echo "Extracting ZIP to: $INSPECT_DIR"
unzip -q "$PROJECT_ROOT/$ZIP_FILE" -d "$INSPECT_DIR"

# Display ZIP contents
echo -e "\n=== ZIP file contents ==="
unzip -l "$PROJECT_ROOT/$ZIP_FILE" | head -n 15
echo "... (truncated)"

# Display first level directories
echo -e "\n=== First level directories ==="
find "$INSPECT_DIR" -maxdepth 1 -type d | sort

# Check the plugin directory
PLUGIN_DIR="$INSPECT_DIR/$PLUGIN_SLUG"
if [ ! -d "$PLUGIN_DIR" ]; then
  echo "❌ Plugin directory not found in ZIP!"
  exit 1
fi

echo -e "\n=== Plugin directory structure ==="
find "$PLUGIN_DIR" -maxdepth 2 -type d | sort

# Check specifically for vendor directory
echo -e "\n=== Vendor directory status ==="
if [ -d "$PLUGIN_DIR/vendor" ]; then
  echo "✅ Vendor directory exists"
  echo "Vendor contents:"
  ls -la "$PLUGIN_DIR/vendor"
  
  if [ -f "$PLUGIN_DIR/vendor/autoload.php" ]; then
    echo "✅ vendor/autoload.php exists"
    head -n 5 "$PLUGIN_DIR/vendor/autoload.php"
  else
    echo "❌ vendor/autoload.php NOT FOUND"
    echo "Searching for autoload.php anywhere in the plugin directory..."
    find "$PLUGIN_DIR" -name "autoload.php"
  fi
else
  echo "❌ Vendor directory NOT FOUND"
  
  echo "Searching for vendor directory in the ZIP..."
  find "$INSPECT_DIR" -type d -name "vendor"
  
  echo "Searching for autoload.php in the ZIP..."
  find "$INSPECT_DIR" -name "autoload.php"
fi

# Check composer files
echo -e "\n=== Composer files status ==="
if [ -f "$PLUGIN_DIR/composer.json" ]; then
  echo "✅ composer.json exists"
else
  echo "❌ composer.json NOT FOUND"
fi

if [ -f "$PLUGIN_DIR/composer.lock" ]; then
  echo "✅ composer.lock exists"
else
  echo "❌ composer.lock NOT FOUND"
fi

# Run the critical files check
echo -e "\n=== Critical files check ==="
CRITICAL_ITEMS=(
  "src/php"
  "vendor/autoload.php"
  "fluid-design-system-for-elementor.php"
  "readme.txt"
  "languages"
)

for item in "${CRITICAL_ITEMS[@]}"; do
  if [ -e "$PLUGIN_DIR/$item" ]; then
    echo "✅ Found: $item"
  else
    echo "❌ Missing: $item"
  fi
done

echo -e "\n=== Inspection complete ===" 
