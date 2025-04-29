/**
 * Test Configuration for Fluid Design System for Elementor
 *
 * This file contains all the configuration settings for the test scripts.
 * Edit this file to match your local environment or set environment variables.
 */
export default {
  // WordPress configuration
  wordpress: {
    // Path to your local WordPress installation
    path: process.env.WP_PATH || '/Users/art/Local Sites/fluid-ds/app/public',

    // Plugin information
    plugin: {
      slug: process.env.PLUGIN_SLUG || 'fluid-design-system-for-elementor',
      path: process.env.PLUGIN_PATH || 'wp-content/plugins/fluid-design-system-for-elementor',
      zipFile: process.env.ZIP_FILE || 'dist/fluid-design-system-for-elementor.zip'
    },

    // Database credentials
    database: {
      host: process.env.DB_HOST || 'localhost',
      socket:
        process.env.DB_SOCKET ||
        '/Users/art/Library/Application Support/Local/run/wNlVYAQFQ/mysql/mysqld.sock',
      name: process.env.DB_NAME || 'local',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root'
    }
  },

  // Test configuration
  tests: {
    // Temporary directory for ZIP extraction
    tempDir: process.env.TEMP_DIR || '/tmp/plugin-test',

    // Temporary file for plugin check results
    pluginCheckResultFile: process.env.PLUGIN_CHECK_RESULT_FILE || '/tmp/plugin-check-results.json'
  }
}
