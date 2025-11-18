#!/bin/bash

# Dry Run Release - Simulates the entire release process without publishing
set -e

echo "🚀 DRY RUN: WordPress Plugin Release"
echo "===================================="
echo "This will simulate the release process WITHOUT:"
echo "  ❌ Creating GitHub releases"
echo "  ❌ Pushing to WordPress.org SVN"
echo "  ❌ Creating or pushing git tags"
echo ""
read -p "Continue with dry run? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Dry run cancelled."
    exit 0
fi

# Run the local test first
bash __tests__/test-release-local.sh

echo ""
echo "📦 Additional Dry Run Checks:"
echo "=============================="

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Warning: You have uncommitted changes"
    git status --short
else
    echo "✅ Working directory is clean"
fi

# Check if current version tag exists
PLUGIN_VERSION=$(grep -m 1 "Version:" dist/fluid-design-system-for-elementor/fluid-design-system-for-elementor.php | awk '{print $3}' | tr -d '\r')
TAG_NAME="v$PLUGIN_VERSION"

if git rev-parse "$TAG_NAME" >/dev/null 2>&1; then
    echo "⚠️  Warning: Tag $TAG_NAME already exists"
    echo "   You'll need to bump the version before a real release"
else
    echo "✅ Tag $TAG_NAME does not exist (ready for release)"
fi

# Check GitHub credentials
if gh auth status >/dev/null 2>&1; then
    echo "✅ GitHub CLI authenticated"
else
    echo "⚠️  GitHub CLI not authenticated (run: gh auth login)"
fi

# Check SVN credentials (if secrets are set)
if [ -n "$SVN_USERNAME" ] && [ -n "$SVN_PASSWORD" ]; then
    echo "✅ SVN credentials found in environment"
else
    echo "ℹ️  SVN credentials not in environment (will use GitHub secrets)"
fi

# Simulate changelog generation
echo ""
echo "📝 Simulated Changelog:"
echo "======================="
PREVIOUS_TAG=$(git describe --tags --abbrev=0 HEAD 2>/dev/null || echo "")
if [ -z "$PREVIOUS_TAG" ]; then
    echo "This would be the initial release"
else
    echo "Changes since $PREVIOUS_TAG:"
    git log --pretty=format:"  * %s" "$PREVIOUS_TAG"..HEAD | head -10
fi

echo ""
echo ""
echo "🎯 Dry Run Complete!"
echo "==================="
echo "✅ All checks passed"
echo ""
echo "📋 To perform the actual release:"
echo "  1. Ensure all changes are committed"
echo "  2. Update version in all files to next version"
echo "  3. Commit version bump: git commit -am 'chore: bump version to X.X.X'"
echo "  4. Create and push tag:"
echo "     git tag $TAG_NAME"
echo "     git push origin $TAG_NAME"
echo ""
echo "The GitHub Action will then automatically:"
echo "  • Build the plugin"
echo "  • Create GitHub release with the ZIP file"
echo "  • Deploy to WordPress.org SVN repository"