import fs from 'fs-extra'
import path from 'path'
import wpPot from 'wp-pot'
import chokidar from 'chokidar'
import debounce from 'debounce'
import { logger } from '../../logger/index.js'
import { isFeatureEnabled } from '../../config/index.js'

/**
 * Generate POT file for translations
 * @param {Object} config - Project configuration
 * @returns {Promise<void>}
 */
export async function generatePot(config) {
  if (!isFeatureEnabled(config, 'i18n')) {
    logger.info('Translation generation is disabled, skipping')
    return
  }

  logger.info('Generating translation files...')

  try {
    // Ensure the output directory exists
    await fs.ensureDir(path.dirname(config.i18n.dest))

    // Check if the file exists to compare content later
    const fileExists = await fs.pathExists(config.i18n.dest)
    let oldContent = ''
    if (fileExists) {
      oldContent = await fs.readFile(config.i18n.dest, 'utf8')
    }

    // Generate POT file using wp-pot
    wpPot({
      destFile: config.i18n.dest,
      domain: config.i18n.domain,
      package: config.i18n.package || config.name,
      bugReport: config.i18n.bugReport,
      lastTranslator: config.i18n.lastTranslator,
      team: config.i18n.team,
      relativeTo: config.i18n.relativeTo,
      src: config.i18n.src
    })

    // Read the new content
    const newContent = await fs.readFile(config.i18n.dest, 'utf8')

    // If the file is new or content has changed (excluding POT-Creation-Date),
    // then update the POT-Creation-Date
    const oldContentNormalized = oldContent.replace(
      /("POT-Creation-Date: )(.*)(")/,
      '"POT-Creation-Date: PLACEHOLDER"'
    )
    const newContentNormalized = newContent.replace(
      /("POT-Creation-Date: )(.*)(")/,
      '"POT-Creation-Date: PLACEHOLDER"'
    )

    if (!fileExists || oldContentNormalized !== newContentNormalized) {
      // Only update the date if actual content has changed
      await updatePotDate(config.i18n.dest)
      logger.success(`Translation content changed, updated POT file date: ${config.i18n.dest}`)
    } else {
      // Restore the old file with its original date if only the date changed
      await fs.writeFile(config.i18n.dest, oldContent)
      logger.success(
        `No translation changes detected, preserved existing POT file: ${config.i18n.dest}`
      )
    }

    logger.success(`Translation files generated successfully: ${config.i18n.dest}`)
  } catch (error) {
    logger.error('Failed to generate translation files:', error)
    throw error
  }
}

/**
 * Update POT file creation date to current date
 * @param {string} potFile - Path to the POT file
 * @returns {Promise<void>}
 */
export async function updatePotDate(potFile) {
  try {
    if (await fs.pathExists(potFile)) {
      let content = await fs.readFile(potFile, 'utf8')

      // Update POT-Creation-Date with current date
      const currentDate = new Date().toISOString()
      content = content.replace(/("POT-Creation-Date: )(.*)(")/, `$1${currentDate}$3`)

      await fs.writeFile(potFile, content)
    }
  } catch (error) {
    logger.warn(`Failed to update POT file date: ${error.message}`)
  }
}

/**
 * Watch PHP files for translation changes
 * @param {Object} config - Project configuration
 * @returns {Object} - Watcher instance
 */
export async function watchPhpForTranslations(config) {
  if (!isFeatureEnabled(config, 'i18n')) {
    logger.info('Translation generation is disabled, not watching')
    return null
  }

  const phpPatterns = Array.isArray(config.i18n.src) ? config.i18n.src : [config.i18n.src]

  logger.info('Watching PHP files for translations...')

  // Create debounced build function
  const debouncedGenerate = debounce(async (filePath) => {
    logger.info(`PHP file changed: ${path.relative(process.cwd(), filePath)}`)

    try {
      await generatePot(config)
    } catch (error) {
      logger.error('Failed to regenerate translations:', error)
    }
  }, 500)

  // Setup watcher
  const watcher = chokidar.watch(phpPatterns, {
    persistent: true,
    ignoreInitial: true
  })

  watcher.on('change', debouncedGenerate)
  watcher.on('error', (error) => {
    logger.error(`PHP watcher error:`, error)
  })

  return watcher
}

export default {
  generatePot,
  updatePotDate,
  watchPhpForTranslations
}
