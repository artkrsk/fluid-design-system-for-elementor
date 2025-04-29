# WordPress Plugin Testing Suite

This directory contains scripts to test the Fluid Design System for Elementor WordPress plugin.

## Prerequisites

- Local by Flywheel installed for WordPress testing
- jq (JSON processor) for parsing results
- Node.js for running the build process
- MySQL client (required for database connection tests)

## Quick Start

```bash
# Run all tests with setup
npm run test -- --setup

# Run with a fresh build
npm run test -- --rebuild
```

## Setup

Run the setup script to verify your environment:

```bash
bash __tests__/setup-environment.sh
```

This will:

1. Check for required tools (jq, MySQL client)
2. Locate WP-CLI from Local's installation
3. Test WordPress connectivity
4. Configure your PATH for MySQL client tools

## Running Tests

To run all tests:

```bash
npm run test
```

Or with specific options:

```bash
# Run setup first
npm run test -- --setup

# Rebuild the plugin before testing
npm run test -- --rebuild

# Both setup and rebuild
npm run test -- --setup --rebuild

# Run with debug output
npm run test -- --setup --debug
```

## Available Tests

1. **ZIP Structure Validation**

   - Verifies the plugin ZIP has all required files
   - Checks for essential directories and components

2. **Plugin Activation**

   - Tests database connection to Local's MySQL
   - Verifies plugin can be installed
   - Checks PHP syntax validity

3. **Plugin Checker**
   - Validates essential plugin files
   - Provides a summary report of plugin quality

## Troubleshooting

### Local Site Not Running

If tests fail with database connection errors:

1. Open the Local app
2. Start your "fluid-ds" site
3. Wait for it to fully start (green status)
4. Run the tests again with:
   ```bash
   npm run test -- --setup --debug
   ```

### MySQL Client Missing

If you see errors about MySQL client tools:

```
MySQL client tools missing or incomplete
```

Install the MySQL client tools:

**On macOS:**

```bash
brew install mysql-client
echo 'export PATH="/opt/homebrew/opt/mysql-client/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### WP-CLI Not Found

The tests use WP-CLI from Local's installation. If it's not found:

1. Run `bash __tests__/setup-environment.sh --debug` to detect issues
2. Check that Local is properly installed
3. If needed, manually install WP-CLI: https://wp-cli.org/#installing

### Manual WP-CLI Testing

To manually run WP-CLI commands with Local:

```bash
# Example: check WordPress version
./__tests__/wp-local.sh core version
```

## Directory Structure

```
__tests__/
├── config.js             # Configuration variables
├── load-config.sh        # Loads config values into shell
├── run-all-tests.sh      # Main test runner
├── setup-environment.sh  # Environment setup script
├── validate-zip.sh       # ZIP structure validation
├── test-activation.sh    # Plugin activation test
├── run-plugin-check.sh   # Plugin quality checker
└── wp-local.sh           # WP-CLI wrapper for Local
```

## Configuration

Edit `config.js` to customize:

- WordPress installation path
- Database credentials
- Plugin details
- Test directories

## Recent Improvements

The testing system includes these features:

1. **Reliable Database Connection** - Direct MySQL connection instead of WP-CLI
2. **Automatic PATH Management** - Detects and uses MySQL client tools
3. **Graceful Fallbacks** - Tests run even if some tools are missing
4. **Detailed Diagnostics** - `--debug` flag for troubleshooting
5. **Centralized Configuration** - All settings in one place
6. **Error Isolation** - Each test runs in its own context
