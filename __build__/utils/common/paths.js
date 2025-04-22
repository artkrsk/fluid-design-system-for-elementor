import path from 'path'

/**
 * Path utility functions for the build system
 */

/**
 * Get the library directory path based on environment
 * @param {Object} config - Project configuration
 * @param {boolean} isDev - Whether this is a development build
 * @returns {string} The path to the library directory
 */
export function getLibraryDir(config, isDev = config.currentEnvironment === 'development') {
  if (isDev && config.wordpressPlugin.target) {
    // In development, use the WordPress plugin target directory
    return path.join(config.wordpressPlugin.target, config.paths.library.assets)
  } else {
    // In production, use the dist directory with correct plugin structure
    return path.join(
      config.paths.dist,
      config.wordpressPlugin.packageName,
      config.paths.library.assets
    )
  }
}

/**
 * Get plugin path
 * @param {Object} config - Project configuration
 * @param {string} [subpath] - Subpath within the plugin
 * @returns {string} The path to the plugin file or directory
 */
export function getPluginPath(config, subpath = '') {
  return path.join(config.paths.wordpress.plugin, subpath)
}

/**
 * Get the plugin main file path
 * @param {Object} config - Project configuration
 * @returns {string} The path to the plugin main file
 */
export function getPluginMainFile(config) {
  const pluginFileName = `${config.wordpressPlugin.packageName}.php`
  return getPluginPath(config, pluginFileName)
}

/**
 * Get the distributable path
 * @param {Object} config - Project configuration
 * @param {string} [subpath] - Subpath within the dist directory
 * @returns {string} The path to the dist directory or file
 */
export function getDistPath(config, subpath = '') {
  return path.join(config.paths.dist, subpath)
}

/**
 * Get the WordPress plugin destination path based on environment
 * @param {Object} config - Project configuration
 * @param {boolean} isDev - Whether this is a development build
 * @returns {string} The path to the plugin destination
 */
export function getPluginDestPath(config, isDev = config.currentEnvironment === 'development') {
  if (isDev && config.wordpressPlugin.target) {
    return config.wordpressPlugin.target
  } else {
    return path.join(config.paths.dist, config.wordpressPlugin.packageName)
  }
}

/**
 * Get output file path for a specific format
 * @param {Object} config - Project configuration
 * @param {string} format - Build format ('cjs', 'iife', etc.)
 * @returns {string} The path to the output file
 */
export function getOutputFilePath(config, format) {
  // Use .umd.js suffix for IIFE builds to maintain compatibility
  const outputFileName = format === 'iife' ? 'index.umd.js' : config.build.output[format]
  return getDistPath(config, outputFileName)
}

export default {
  getLibraryDir,
  getPluginPath,
  getPluginMainFile,
  getDistPath,
  getPluginDestPath,
  getOutputFilePath
}
