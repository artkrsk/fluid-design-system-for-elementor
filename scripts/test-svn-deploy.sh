#!/bin/bash
# Test script for WordPress.org SVN deployment
# This script simulates the GitHub Actions workflow for deploying to WordPress SVN
# but does NOT actually commit to the SVN repository

set -e

echo "=== Testing WordPress.org SVN deployment ==="
echo "This script will simulate the deployment process without actually committing to the SVN repository."

# Check for required tools
if ! command -v svn >/dev/null 2>&1; then
    echo "Warning: SVN is not installed. Will continue in simulation mode only."
    SVN_INSTALLED=false
else
    SVN_INSTALLED=true
fi

command -v unzip >/dev/null 2>&1 || { echo "Error: unzip is required but not installed. Aborting."; exit 1; }

# Get the current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Build the plugin if it doesn't exist
if [ ! -f "$PROJECT_ROOT/dist/fluid-design-system-for-elementor.zip" ]; then
    echo "Plugin ZIP not found. Building the plugin..."
    cd "$PROJECT_ROOT"
    npm run build
fi

# Get the current version
VERSION=$(grep -m 1 "Version:" "$PROJECT_ROOT/src/wordpress-plugin/fluid-design-system-for-elementor.php" | awk '{print $3}')
echo "Plugin version: $VERSION"

# Create a temporary directory
TMP_DIR="/tmp/svn-test-$(date +%s)"
mkdir -p "$TMP_DIR"
echo "Created temporary directory: $TMP_DIR"

# Extract the plugin
echo "Extracting plugin..."
mkdir -p "$TMP_DIR/plugin"
unzip -q "$PROJECT_ROOT/dist/fluid-design-system-for-elementor.zip" -d "$TMP_DIR/plugin"

# Create SVN structure
echo "Creating SVN structure..."
mkdir -p "$TMP_DIR/svn/trunk"
mkdir -p "$TMP_DIR/svn/assets"
mkdir -p "$TMP_DIR/svn/tags/$VERSION"

# Copy plugin to trunk
echo "Copying files to trunk..."
cp -R "$TMP_DIR/plugin/fluid-design-system-for-elementor/"* "$TMP_DIR/svn/trunk/"

# Copy trunk to tag
echo "Copying files to tag/$VERSION..."
cp -R "$TMP_DIR/svn/trunk/"* "$TMP_DIR/svn/tags/$VERSION/"

# Copy assets
if [ -d "$PROJECT_ROOT/__assets__" ]; then
    echo "Copying assets..."
    cp -R "$PROJECT_ROOT/__assets__/"* "$TMP_DIR/svn/assets/"
    # Remove any hidden files
    find "$TMP_DIR/svn/assets" -name ".DS_Store" -delete
    find "$TMP_DIR/svn/assets" -name ".*" -delete
fi

echo "=== SVN Structure created ==="
echo "Here's what would be sent to WordPress.org:"
echo
echo "TRUNK DIRECTORY:"
ls -la "$TMP_DIR/svn/trunk" | head -n 20
echo
echo "TAG DIRECTORY (version $VERSION):"
ls -la "$TMP_DIR/svn/tags/$VERSION" | head -n 20
echo
echo "ASSETS DIRECTORY:"
ls -la "$TMP_DIR/svn/assets" | head -n 20

echo
echo "Files have been prepared in: $TMP_DIR/svn"
echo "To view the complete structure: ls -la $TMP_DIR/svn"
echo

if [ "$SVN_INSTALLED" = false ]; then
    echo "Note: Since SVN is not installed, this was only a simulation."
    echo "To fully test, please install SVN and run this script again."
    echo
    echo "On macOS, you can install SVN using Homebrew: brew install subversion"
    echo "On Ubuntu/Debian: sudo apt-get install subversion"
    echo "On Windows: Download from https://tortoisesvn.net/"
else
    echo "If everything looks correct, the GitHub workflow should work properly."
    # If SVN is installed, we could add more SVN-specific tests here
fi

echo "Remember: This was just a test, no files were actually committed to WordPress.org SVN."
echo "=== Test completed ===" 
