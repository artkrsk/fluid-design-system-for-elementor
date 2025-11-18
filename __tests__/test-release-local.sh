#!/bin/bash

# Test Release Process Locally
# This simulates the GitHub Actions workflow without publishing

set -e

echo "🧪 Testing WordPress Plugin Release Process Locally"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Detect Plugin Metadata
echo -e "\n${YELLOW}Step 1: Detecting Plugin Metadata${NC}"

# Source the detection script from the release action repo
RELEASE_ACTION_PATH="/Users/art/Projects/Framework/packages/wordpress-plugin-release-action"
if [ ! -d "$RELEASE_ACTION_PATH" ]; then
    echo -e "${RED}❌ Release action repository not found at: $RELEASE_ACTION_PATH${NC}"
    exit 1
fi

source "$RELEASE_ACTION_PATH/scripts/detect-plugin.sh"

# Detect plugin info
MAIN_FILE=$(detect_main_plugin_file)
PLUGIN_SLUG=$(detect_plugin_slug "$MAIN_FILE")
PLUGIN_VERSION=$(extract_plugin_version "$MAIN_FILE")
PLUGIN_NAME=$(extract_plugin_name "$MAIN_FILE")

echo -e "${GREEN}✅ Plugin Name: $PLUGIN_NAME${NC}"
echo -e "${GREEN}✅ Plugin Slug: $PLUGIN_SLUG${NC}"
echo -e "${GREEN}✅ Main File: $MAIN_FILE${NC}"
echo -e "${GREEN}✅ Version: $PLUGIN_VERSION${NC}"

# 2. Version Validation
echo -e "\n${YELLOW}Step 2: Validating Version Consistency${NC}"

# Check package.json version
if [ -f "package.json" ]; then
    PACKAGE_VERSION=$(node -p "require('./package.json').version")
    echo "Package.json version: $PACKAGE_VERSION"

    if [ "$PLUGIN_VERSION" != "$PACKAGE_VERSION" ]; then
        echo -e "${RED}❌ Version mismatch: Plugin ($PLUGIN_VERSION) != package.json ($PACKAGE_VERSION)${NC}"
        exit 1
    fi
fi

# Check readme.txt version
if [ -f "src/wordpress-plugin/readme.txt" ]; then
    README_VERSION=$(grep "Stable tag:" src/wordpress-plugin/readme.txt | awk '{print $3}' | tr -d '\r')
    echo "Readme.txt version: $README_VERSION"

    if [ "$PLUGIN_VERSION" != "$README_VERSION" ]; then
        echo -e "${RED}❌ Version mismatch: Plugin ($PLUGIN_VERSION) != readme.txt ($README_VERSION)${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ All versions match: $PLUGIN_VERSION${NC}"

# 3. Build Process
echo -e "\n${YELLOW}Step 3: Running Build Process${NC}"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Run build
echo "Running build command..."
npm run build

# 4. Verify ZIP File
echo -e "\n${YELLOW}Step 4: Verifying ZIP File${NC}"

ZIP_PATH="dist/${PLUGIN_SLUG}.zip"
if [ ! -f "$ZIP_PATH" ]; then
    echo -e "${RED}❌ ZIP file not found at: $ZIP_PATH${NC}"
    echo "Contents of dist/:"
    ls -la dist/ 2>/dev/null || echo "dist/ directory not found"
    exit 1
fi

echo -e "${GREEN}✅ ZIP file found at: $ZIP_PATH${NC}"

# Check ZIP contents
echo "ZIP file contents summary:"
unzip -l "$ZIP_PATH" | head -20
echo "..."
echo "Total files in ZIP: $(unzip -l "$ZIP_PATH" | grep -c "^[[:space:]]*[0-9]")"

# Check for vendor directory
if unzip -l "$ZIP_PATH" | grep -q "vendor/autoload.php"; then
    echo -e "${GREEN}✅ vendor/autoload.php found in ZIP${NC}"
else
    echo -e "${YELLOW}⚠️  vendor/autoload.php not found in ZIP (may be expected if no Composer dependencies)${NC}"
fi

# 5. Run custom validation if exists
if [ -f "__tests__/validate-zip.sh" ]; then
    echo -e "\n${YELLOW}Step 5: Running Custom ZIP Validation${NC}"
    export ZIP_PATH
    export PLUGIN_SLUG
    bash __tests__/validate-zip.sh
else
    echo -e "\n${YELLOW}Step 5: No custom validation script found (optional)${NC}"
fi

# 6. Simulate WordPress.org structure check
echo -e "\n${YELLOW}Step 6: Simulating WordPress.org Structure Check${NC}"

# Extract ZIP to temp directory
TEMP_DIR="/tmp/test-release-$$"
mkdir -p "$TEMP_DIR"
unzip -q "$ZIP_PATH" -d "$TEMP_DIR"

# Check expected structure
if [ -d "$TEMP_DIR/$PLUGIN_SLUG" ]; then
    echo -e "${GREEN}✅ Plugin properly nested in $PLUGIN_SLUG/ directory${NC}"

    # Check for main plugin file
    if [ -f "$TEMP_DIR/$PLUGIN_SLUG/$(basename $MAIN_FILE)" ]; then
        echo -e "${GREEN}✅ Main plugin file found in correct location${NC}"
    else
        echo -e "${RED}❌ Main plugin file not found in expected location${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Plugin files at root level (checking if this is intended)${NC}"

    # Check if main file exists at root
    if [ -f "$TEMP_DIR/$(basename $MAIN_FILE)" ]; then
        echo -e "${GREEN}✅ Main plugin file found at root (flat structure)${NC}"
    fi
fi

# Clean up
rm -rf "$TEMP_DIR"

# 7. Summary
echo -e "\n${YELLOW}============================================${NC}"
echo -e "${GREEN}✅ Local Release Test Completed Successfully!${NC}"
echo -e "${YELLOW}============================================${NC}"
echo ""
echo "The release process would:"
echo "1. ✅ Build the plugin successfully"
echo "2. ✅ Create a valid ZIP file at: $ZIP_PATH"
echo "3. ✅ Pass version validation"
echo "4. ⏸️  Create GitHub release (skipped in test)"
echo "5. ⏸️  Deploy to WordPress.org (skipped in test)"
echo ""
echo -e "${YELLOW}To test with act:${NC}"
echo "  act -W .github/workflows/test-release.yml workflow_dispatch"
echo ""
echo -e "${YELLOW}To do a real release:${NC}"
echo "  git tag v$PLUGIN_VERSION"
echo "  git push origin v$PLUGIN_VERSION"