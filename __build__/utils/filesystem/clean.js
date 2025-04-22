import fs from 'fs-extra'
import path from 'path'
import { logger } from '../../logger/index.js'
import { getLibraryDir, getPluginDestPath } from '../common/paths.js'
import { isDevelopment } from '../../config/index.js'

/**
 * Clean specified directories based on configuration
 * @param {Object} config - Project configuration
 * @returns {Promise<void>}
 */
export async function cleanDirectories(config) {
  const isDev = isDevelopment(config)

  // Start with base paths to clean
  const cleanPaths = [
    // WordPress plugin languages directory
    path.join(config.paths.wordpress.languages)
  ]

  // Add dist directory in production mode
  if (!isDev) {
    cleanPaths.push(config.paths.dist)
  }

  // Add target directories from WordPress config
  if (config.wordpress?.targets && config.wordpress.targets.length) {
    cleanPaths.push(...config.wordpress.targets)
  }

  // Add WordPress plugin target if configured (for dev mode)
  if (isDev && config.wordpressPlugin?.target) {
    cleanPaths.push(config.wordpressPlugin.target)
  }

  logger.info('Cleaning directories...')

  for (const dirPath of cleanPaths) {
    try {
      await cleanDirectory(dirPath)
    } catch (error) {
      logger.warn(`Failed to clean directory ${dirPath}: ${error.message}`)
    }
  }

  // Ensure necessary subdirectories exist
  await ensurePluginDirectories(config)

  logger.success('Directories cleaned successfully')
}

/**
 * Ensure plugin directories exist with proper structure
 * @param {Object} config - Project configuration
 * @returns {Promise<void>}
 */
async function ensurePluginDirectories(config) {
  // Get library directory based on environment
  const libraryDir = getLibraryDir(config)
  await fs.ensureDir(libraryDir)

  // Ensure WordPress plugin directory exists if target is set
  if (config.wordpressPlugin?.target) {
    const pluginDir = getPluginDestPath(config)
    await fs.ensureDir(pluginDir)
  }
}

/**
 * Clean a specific directory
 * @param {string} dirPath - Directory path to clean
 * @returns {Promise<void>}
 */
export async function cleanDirectory(dirPath) {
  try {
    if (await fs.pathExists(dirPath)) {
      await fs.emptyDir(dirPath)
      logger.debug(`Cleaned directory: ${dirPath}`)
    } else {
      await fs.ensureDir(dirPath)
      logger.debug(`Created directory: ${dirPath}`)
    }
  } catch (error) {
    logger.warn(`Failed to clean directory ${dirPath}: ${error.message}`)
    throw error
  }
}

export default {
  cleanDirectories,
  cleanDirectory
}
