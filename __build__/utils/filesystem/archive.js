import fs from 'fs-extra'
import path from 'path'
import archiver from 'archiver'
import { logger } from '../../logger/index.js'
import { isFeatureEnabled } from '../../config/index.js'
import { shouldCreateDistFolder } from '../common/paths.js'

/**
 * Create a ZIP archive of the WordPress plugin
 * @param {Object} config - Project configuration
 * @returns {Promise<void>}
 */
export async function createZipArchive(config) {
  if (!isFeatureEnabled(config, 'wordpressPlugin')) {
    logger.info('WordPress plugin packaging is disabled, skipping ZIP creation')
    return
  }

  if (!shouldCreateDistFolder(config)) {
    logger.info('Dist folder creation is disabled, skipping ZIP creation')
    return
  }

  logger.info('Creating WordPress plugin ZIP archive...')

  const outputDir = config.paths.dist
  const pluginDir = path.join(outputDir, config.wordpressPlugin.packageName)
  const outputZip = path.join(outputDir, config.wordpressPlugin.zipOutputName)

  // Ensure the plugin directory exists
  if (!(await fs.pathExists(pluginDir))) {
    throw new Error(`Plugin directory not found: ${pluginDir}`)
  }

  try {
    // Create output stream
    const output = fs.createWriteStream(outputZip)
    const archive = archiver('zip', {
      zlib: { level: 9 } // Highest compression level
    })

    // Set up pipeline
    archive.pipe(output)

    // Add files from the plugin directory to the archive root
    archive.directory(pluginDir, config.wordpressPlugin.packageName, (entry) => {
      // Skip hidden files and directories (like .DS_Store)
      if (entry.name.split('/').some((part) => part.startsWith('.'))) {
        return false
      }
      return entry
    })

    // Set up promise for completion
    const archivePromise = new Promise((resolve, reject) => {
      output.on('close', () => {
        const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2)
        logger.success(`ZIP archive created: ${outputZip} (${sizeInMB} MB)`)
        resolve()
      })

      archive.on('error', (err) => {
        reject(err)
      })
    })

    // Finalize the archive
    await archive.finalize()

    // Wait for completion
    await archivePromise

    return outputZip
  } catch (error) {
    logger.error('Failed to create ZIP archive:', error)
    throw error
  }
}

export default {
  createZipArchive
}
