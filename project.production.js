/**
 * Production-specific configuration overrides for `@arts/fluid-design-system`
 * @param {Object} baseConfig - The base configuration object
 * @returns {Object} - Modified configuration for production
 */
export default function (baseConfig) {
  // Create a deep copy to avoid modifying the original
  const config = JSON.parse(JSON.stringify(baseConfig))

  // Set environment
  config.currentEnvironment = 'production'

  // Production-specific settings
  config.build.sourcemap = false
  config.build.minify = true

  // Configure Sass for production
  config.sass.options.sourceMap = false
  config.sass.options.outputStyle = 'compressed'

  // Disable live reload for production
  config.liveReload.enabled = false

  // Disable debugging
  config.wordpress.debug = false
  config.wordpressPlugin.debug = false

  return config
}
