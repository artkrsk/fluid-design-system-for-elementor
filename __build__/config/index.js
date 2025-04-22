import { loadConfig, validateConfig } from './loader.js'

/**
 * Get config value by path with dot notation
 * @param {Object} config - Configuration object
 * @param {string} path - Dot notation path
 * @param {any} defaultValue - Default value if path not found
 * @returns {any} Config value or default
 */
export function getConfigValue(config, path, defaultValue) {
  if (!path) return config

  const parts = path.split('.')
  let current = config

  for (const part of parts) {
    if (current === undefined || current === null) {
      return defaultValue
    }
    current = current[part]
  }

  return current === undefined ? defaultValue : current
}

/**
 * Check if a feature is enabled in the configuration
 * @param {Object} config - Configuration object
 * @param {string} feature - Feature path in dot notation
 * @returns {boolean} Whether the feature is enabled
 */
export function isFeatureEnabled(config, feature) {
  return getConfigValue(config, `${feature}.enabled`, false) === true
}

/**
 * Get environment from configuration
 * @param {Object} config - Configuration object
 * @returns {string} Current environment
 */
export function getEnvironment(config) {
  return config.currentEnvironment || 'development'
}

/**
 * Check if running in development mode
 * @param {Object} config - Configuration object
 * @returns {boolean} Whether in development mode
 */
export function isDevelopment(config) {
  return getEnvironment(config) === 'development'
}

/**
 * Check if running in production mode
 * @param {Object} config - Configuration object
 * @returns {boolean} Whether in production mode
 */
export function isProduction(config) {
  return getEnvironment(config) === 'production'
}

export { loadConfig, validateConfig }

export default {
  loadConfig,
  validateConfig,
  getConfigValue,
  isFeatureEnabled,
  getEnvironment,
  isDevelopment,
  isProduction
}
