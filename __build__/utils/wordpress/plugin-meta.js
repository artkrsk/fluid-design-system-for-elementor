import fs from 'fs-extra'
import path from 'path'
import chokidar from 'chokidar'
import debounce from 'debounce'
import { logger } from '../../logger/index.js'
import { getPluginMainFile, getPluginPath, getPluginDestPath } from '../common/paths.js'

/**
 * WordPress plugin file header fields and their regex patterns
 */
const PLUGIN_HEADER_FIELDS = {
  'Plugin Name': 'Plugin Name:',
  'Plugin URI': 'Plugin URI:',
  Description: 'Description:',
  Version: 'Version:',
  Author: 'Author:',
  'Author URI': 'Author URI:',
  'Text Domain': 'Text Domain:',
  'Domain Path': 'Domain Path:',
  License: 'License:',
  'License URI': 'License URI:',
  'Requires at least': 'Requires at least:',
  'Requires PHP': 'Requires PHP:',
  'Tested up to': 'Tested up to:',
  'WC requires at least': 'WC requires at least:',
  'WC tested up to': 'WC tested up to:',
  'Elementor tested up to': 'Elementor tested up to:',
  'Elementor Pro tested up to': 'Elementor Pro tested up to:'
}

/**
 * Update WordPress plugin metadata based on composer.json
 * @param {Object} config - Project configuration
 * @returns {Promise<void>}
 */
export async function updatePluginMeta(config) {
  logger.info('Updating plugin metadata...')

  try {
    // Use project root from config or fall back to current working directory
    const projectRoot = config._absoluteProjectRoot || process.cwd()

    // Read composer.json, package.json
    const composerFile = path.join(projectRoot, 'composer.json')
    const packageFile = path.join(projectRoot, 'package.json')

    if (!(await fs.pathExists(composerFile))) {
      logger.warn('composer.json not found, skipping plugin metadata update')
      return
    }

    // Read files
    const composerData = await fs.readJson(composerFile)
    const packageData = await fs.readJson(packageFile)

    // Get plugin metadata
    const metaData = extractPluginMetadata(composerData, packageData)

    // Get plugin main file
    const pluginFile = getPluginMainFile(config)

    // Update plugin main file
    if (await fs.pathExists(pluginFile)) {
      await updatePluginFileHeader(pluginFile, metaData)
      logger.success('Updated plugin main file')
    } else {
      logger.warn(`Plugin main file not found: ${pluginFile}`)
    }

    // Update readme.txt
    const readmeFile = getPluginPath(config, 'readme.txt')
    if (await fs.pathExists(readmeFile)) {
      await updateReadmeFile(readmeFile, metaData)
      logger.success('Updated readme.txt')
    } else {
      logger.warn(`Plugin readme file not found: ${readmeFile}`)
    }

    logger.success('Plugin metadata updated successfully')
  } catch (error) {
    logger.error('Failed to update plugin metadata:', error)
    throw error
  }
}

/**
 * Extract plugin metadata from composer.json and package.json
 * @param {Object} composerData - Composer.json data
 * @param {Object} packageData - Package.json data
 * @returns {Object} - Merged plugin metadata
 */
function extractPluginMetadata(composerData, packageData) {
  // Start with basic metadata from package.json
  const metadata = {
    'Plugin Name': packageData.name || '',
    Description: packageData.description || '',
    Version: packageData.version || '1.0.0',
    Author: packageData.author || '',
    'Author URI': typeof packageData.author === 'object' ? packageData.author.url : '',
    License: packageData.license || '',
    'Text Domain': ''
  }

  // Override with composer.json data
  if (composerData.name) {
    const nameParts = composerData.name.split('/')
    if (nameParts.length > 1) {
      metadata['Plugin Name'] = nameParts[1]
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase())
    } else {
      metadata['Plugin Name'] = nameParts[0]
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase())
    }
  }
  if (composerData.description) metadata['Description'] = composerData.description
  if (composerData.version) metadata['Version'] = composerData.version
  if (composerData.homepage) metadata['Plugin URI'] = composerData.homepage
  if (composerData.authors && composerData.authors.length > 0) {
    metadata['Author'] = composerData.authors[0].name || ''
    metadata['Author URI'] = composerData.authors[0].homepage || ''
  }
  if (composerData.license) metadata['License'] = composerData.license

  // Get text domain from project config or infer from name
  metadata['Text Domain'] = metadata['Plugin Name'].toLowerCase().replace(/\s+/g, '-')

  // WordPress-specific fields take absolute priority if defined in composer.json
  if (composerData.wordpress) {
    for (const [key, value] of Object.entries(composerData.wordpress)) {
      metadata[key] = value
    }
  }

  // Even more specific - plugin headers directly defined get highest priority
  if (composerData.plugin && typeof composerData.plugin === 'object') {
    for (const [key, value] of Object.entries(composerData.plugin)) {
      metadata[key] = value
    }
  }

  return metadata
}

/**
 * Update plugin file header using parsed metadata
 * @param {string} filePath - Path to plugin file
 * @param {Object} metaData - Plugin metadata
 * @returns {Promise<void>}
 */
async function updatePluginFileHeader(filePath, metaData) {
  try {
    const fileContent = await fs.readFile(filePath, 'utf8')

    // Find the header block
    const headerPattern = /\/\*\*[\s\S]*?\*\//
    const headerMatch = fileContent.match(headerPattern)

    if (!headerMatch) {
      logger.warn(`Could not find plugin header block in ${filePath}`)
      return
    }

    const headerBlock = headerMatch[0]
    let updatedHeader = headerBlock

    // Update each field in the header
    for (const [field, fieldPrefix] of Object.entries(PLUGIN_HEADER_FIELDS)) {
      if (metaData[field] !== undefined) {
        const fieldPattern = new RegExp(`${fieldPrefix}\\s*(.*?)\\s*\\n`, 'i')
        const fieldExists = fieldPattern.test(updatedHeader)

        if (fieldExists) {
          // Update existing field
          updatedHeader = updatedHeader.replace(fieldPattern, `${fieldPrefix} ${metaData[field]}\n`)
        } else if (metaData[field]) {
          // Add new field at the end of the header
          updatedHeader = updatedHeader.replace(/\*\//, `* ${fieldPrefix} ${metaData[field]}\n */`)
        }
      }
    }

    // Replace the header in the file
    const updatedContent = fileContent.replace(headerPattern, updatedHeader)

    await fs.writeFile(filePath, updatedContent)
  } catch (error) {
    logger.error(`Failed to update plugin file header: ${error.message}`)
    throw error
  }
}

/**
 * Update readme.txt file
 * @param {string} filePath - Path to readme.txt
 * @param {Object} metaData - Plugin metadata
 * @returns {Promise<void>}
 */
async function updateReadmeFile(filePath, metaData) {
  try {
    let content = await fs.readFile(filePath, 'utf8')

    // Update plugin name in title
    if (metaData['Plugin Name']) {
      const titlePattern = /^=== .* ===$/m
      if (titlePattern.test(content)) {
        content = content.replace(titlePattern, `=== ${metaData['Plugin Name']} ===`)
      }
    }

    // Update version in Stable tag
    if (metaData['Version']) {
      const stableTagPattern = /^Stable tag:.*$/m
      if (stableTagPattern.test(content)) {
        content = content.replace(stableTagPattern, `Stable tag: ${metaData['Version']}`)
      }
    }

    // Update other fields
    const fieldMappings = {
      'Requires at least': 'Requires at least',
      'Tested up to': 'Tested up to',
      'Requires PHP': 'Requires PHP',
      License: 'license',
      'License URI': 'License URI',
      'Text Domain': 'Text Domain'
    }

    for (const [pluginField, readmeField] of Object.entries(fieldMappings)) {
      if (metaData[pluginField]) {
        const fieldPattern = new RegExp(`^${readmeField}:.*$`, 'im')
        if (fieldPattern.test(content)) {
          content = content.replace(fieldPattern, `${readmeField}: ${metaData[pluginField]}`)
        }
      }
    }

    // Update description if it exists in a specific format
    if (metaData['Description']) {
      const descPattern = /^Description:.*$/m
      if (descPattern.test(content)) {
        content = content.replace(descPattern, `Description: ${metaData['Description']}`)
      }
    }

    await fs.writeFile(filePath, content)
  } catch (error) {
    logger.error(`Failed to update readme.txt: ${error.message}`)
    throw error
  }
}

/**
 * Watch composer.json for changes
 * @param {Object} config - Project configuration
 * @returns {Object} - Watcher instance
 */
export async function watchComposerJson(config) {
  // Use project root from config or fall back to current working directory
  const projectRoot = config._absoluteProjectRoot || process.cwd()
  const composerFile = path.join(projectRoot, 'composer.json')
  const composerLockFile = path.join(projectRoot, 'composer.lock')

  logger.info('Watching composer files for changes...')

  // Create debounced update function
  const debouncedUpdate = debounce(async (filePath) => {
    logger.info(`Composer file changed: ${path.relative(projectRoot, filePath)}`)

    try {
      await updatePluginMeta(config)

      // Copy composer files to WordPress plugin target
      if (config.wordpressPlugin?.target) {
        const pluginDest = getPluginDestPath(config, true)

        await fs.copy(composerFile, path.join(pluginDest, 'composer.json'))

        if (await fs.pathExists(composerLockFile)) {
          await fs.copy(composerLockFile, path.join(pluginDest, 'composer.lock'))
        }

        logger.success('Synced composer files to plugin target')
      }
    } catch (error) {
      logger.error('Failed to process composer file changes:', error)
    }
  }, 300)

  // Setup watcher
  const watcher = chokidar.watch([composerFile, composerLockFile], {
    persistent: true,
    ignoreInitial: true
  })

  watcher.on('change', debouncedUpdate)
  watcher.on('error', (error) => {
    logger.error(`Composer file watcher error:`, error)
  })

  return watcher
}

export default {
  updatePluginMeta,
  watchComposerJson
}
