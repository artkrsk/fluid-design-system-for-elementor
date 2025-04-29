import fs from 'fs-extra'
import path from 'path'
import { logger } from '../logger/index.js'
import { handleBuildError } from '../logger/error-handler.js'

/**
 * Default environment fallbacks
 */
const DEFAULT_ENV = process.env.NODE_ENV || 'development'
const CONFIG_FILENAME = 'project.config.js'

/**
 * Load project configuration based on environment
 * @param {string} projectRoot - Path to the project root
 * @param {string} [env=DEFAULT_ENV] - Environment name ('development' or 'production')
 * @returns {Promise<Object>} Merged configuration object
 */
export async function loadConfig(projectRoot, env = DEFAULT_ENV) {
  try {
    logger.info(`Loading configuration for ${env} environment...`)

    // Ensure we have absolute paths
    const absoluteProjectRoot = path.isAbsolute(projectRoot)
      ? projectRoot
      : path.resolve(process.cwd(), projectRoot)

    // Load base configuration
    const configPath = path.join(absoluteProjectRoot, CONFIG_FILENAME)
    if (!(await fs.pathExists(configPath))) {
      throw new Error(`Configuration file not found: ${configPath}`)
    }

    // Use file:// URL format for dynamic imports to ensure they work with symlinks
    const configFileUrl = new URL(`file://${configPath}`).href
    const baseConfig = (await import(configFileUrl)).default

    // Load environment-specific configuration
    const envConfigPath = path.join(absoluteProjectRoot, `project.${env}.js`)
    if (!(await fs.pathExists(envConfigPath))) {
      throw new Error(`Environment configuration not found: ${envConfigPath}`)
    }

    const envConfigFileUrl = new URL(`file://${envConfigPath}`).href
    const envConfig = (await import(envConfigFileUrl)).default

    // Apply environment config to base config
    const mergedConfig = envConfig(baseConfig)

    // Set environment in config
    mergedConfig.currentEnvironment = env

    // Store the absolute project root in the config for reference
    mergedConfig._absoluteProjectRoot = absoluteProjectRoot

    logger.success(`Loaded configuration for ${env} environment`)
    return mergedConfig
  } catch (error) {
    handleBuildError(error, 'configuration loading')
    throw error
  }
}

/**
 * Validate required configuration values
 * @param {Object} config - Configuration object to validate
 * @returns {boolean} True if valid, throws Error if invalid
 */
export function validateConfig(config) {
  // Essential configurations that must be present
  const requiredFields = [
    'name',
    'entry',
    'paths.dist',
    'paths.php',
    'paths.styles',
    'paths.js',
    'paths.wordpress.plugin',
    'paths.library.assets',
    'wordpressPlugin.packageName'
  ]

  for (const field of requiredFields) {
    const parts = field.split('.')
    let value = config

    for (const part of parts) {
      value = value?.[part]
      if (value === undefined) {
        throw new Error(`Missing required configuration: ${field}`)
      }
    }
  }

  return true
}

export default {
  loadConfig,
  validateConfig
}
