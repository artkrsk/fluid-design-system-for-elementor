import path from 'path'
import process from 'process'

/**
 * Path utility functions for the build system
 */

/**
 * Resolve a path that might be relative to the project root
 * @param {Object} config - Project configuration
 * @param {string} relativePath - Path that may be relative
 * @returns {string} Absolute path
 */
export function resolveProjectPath(config, relativePath) {
  if (path.isAbsolute(relativePath)) {
    return relativePath
  }

  // Use the stored absolute project root if available
  const projectRoot = config._absoluteProjectRoot || process.cwd()
  return path.resolve(projectRoot, relativePath)
}

/**
 * Get the library directory path based on environment
 * @param {Object} config - Project configuration
 * @param {boolean} isDev - Whether this is a development build
 * @returns {string} The path to the library directory
 */
export function getLibraryDir(config, isDev = config.currentEnvironment === 'development') {
  if (isDev && config.wordpressPlugin.target) {
    // In development, use the WordPress plugin target directory
    return path.join(
      resolveProjectPath(config, config.wordpressPlugin.target),
      config.paths.library.assets
    )
  } else {
    // If direct library path is available, use it
    if (config.paths.library.directPath) {
      return resolveProjectPath(config, config.paths.library.directPath)
    }

    // In production, use the dist directory with correct plugin structure
    return path.join(
      resolveProjectPath(config, config.paths.dist),
      config.wordpressPlugin.packageName,
      config.paths.library.assets
    )
  }
}

/**
 * Get direct library path for assets
 * @param {Object} config - Project configuration
 * @returns {string|null} The direct library path or null if not configured
 */
export function getDirectLibraryPath(config) {
  return path.resolve(
    resolveProjectPath(config, config.paths.php),
    config.paths.library.base,
    config.paths.library.name
  )
}

/**
 * Get plugin path
 * @param {Object} config - Project configuration
 * @param {string} [subpath] - Subpath within the plugin
 * @returns {string} The path to the plugin file or directory
 */
export function getPluginPath(config, subpath = '') {
  return path.join(resolveProjectPath(config, config.paths.wordpress.plugin), subpath)
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
  return path.join(resolveProjectPath(config, config.paths.dist), subpath)
}

/**
 * Should create dist folder based on config
 * @param {Object} config - Project configuration
 * @returns {boolean} Whether to create the dist folder
 */
export function shouldCreateDistFolder(config) {
  return config.build.createDistFolder !== false
}

/**
 * Get the WordPress plugin destination path based on environment
 * @param {Object} config - Project configuration
 * @param {boolean} isDev - Whether this is a development build
 * @returns {string} The path to the plugin destination
 */
export function getPluginDestPath(config, isDev = config.currentEnvironment === 'development') {
  if (isDev && config.wordpressPlugin.target) {
    return resolveProjectPath(config, config.wordpressPlugin.target)
  } else {
    return path.join(
      resolveProjectPath(config, config.paths.dist),
      config.wordpressPlugin.packageName
    )
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

/**
 * Get direct library output path for JS
 * @param {Object} config - Project configuration
 * @returns {string|null} Direct output path or null
 */
export function getDirectJsOutputPath(config) {
  const libraryDir = getDirectLibraryPath(config)
  return path.join(libraryDir, 'index.umd.js')
}

/**
 * Get direct library output path for CSS
 * @param {Object} config - Project configuration
 * @returns {string|null} Direct output path or null
 */
export function getDirectCssOutputPath(config) {
  if (config.sass.libraryOutput) {
    return resolveProjectPath(config, config.sass.libraryOutput)
  }

  const libraryDir = getDirectLibraryPath(config)
  return path.join(libraryDir, 'index.css')
}

export default {
  resolveProjectPath,
  getLibraryDir,
  getPluginPath,
  getPluginMainFile,
  getDistPath,
  getPluginDestPath,
  getOutputFilePath,
  getDirectLibraryPath,
  getDirectJsOutputPath,
  getDirectCssOutputPath,
  shouldCreateDistFolder
}
