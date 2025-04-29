import fs from 'fs-extra'
import path from 'path'
import wpPot from 'wp-pot'
import chokidar from 'chokidar'
import debounce from 'debounce'
import crypto from 'crypto'
import { logger } from '../../logger/index.js'
import { isFeatureEnabled } from '../../config/index.js'

/**
 * Generate POT file for translations
 * @param {Object} config - Project configuration
 * @returns {Promise<void>}
 */
export async function generatePot(config) {
  if (!isFeatureEnabled(config, 'i18n')) {
    logger.info('🚫 Translation generation is disabled, skipping')
    return
  }

  logger.info('🌐 Generating translation files...')

  try {
    // Ensure the output directory exists but don't create empty subdirectories
    const langDir = path.dirname(config.i18n.dest)
    await fs.ensureDir(langDir)

    // Check if existing POT file exists
    const fileExists = await fs.pathExists(config.i18n.dest)

    // Create a temporary file for the new POT content
    const tempPotFile = `${config.i18n.dest}.tmp`

    // Generate POT file using wp-pot to the temporary file
    wpPot({
      destFile: tempPotFile,
      domain: config.i18n.domain,
      package: config.i18n.package || config.name,
      bugReport: config.i18n.bugReport,
      lastTranslator: config.i18n.lastTranslator,
      team: config.i18n.team,
      relativeTo: config.i18n.relativeTo,
      src: config.i18n.src
    })

    // Check if temporary file was created
    if (!(await fs.pathExists(tempPotFile))) {
      logger.warn(`⚠️ Failed to generate temporary POT file: ${tempPotFile}`)
      return
    }

    // Read file contents for hashing
    let oldContent = ''
    if (fileExists) {
      oldContent = await fs.readFile(config.i18n.dest, 'utf8')
    }

    const newContent = await fs.readFile(tempPotFile, 'utf8')

    // Calculate hashes for comparison
    const oldHash = calculateTranslationHash(oldContent)
    const newHash = calculateTranslationHash(newContent)

    // Check if actual translations have changed
    const hasChanged = !fileExists || oldHash !== newHash

    if (hasChanged) {
      // If content changed, keep the new file and update its creation date
      await fs.move(tempPotFile, config.i18n.dest, { overwrite: true })
      await updatePotDate(config.i18n.dest)
      logger.success(`✅ Translation content changed, updated POT file: ${config.i18n.dest}`)
    } else {
      // No changes, remove the temporary file
      await fs.remove(tempPotFile)
      logger.success(
        `✅ No translation changes detected, preserved existing POT file: ${config.i18n.dest}`
      )
    }

    logger.success(`🎉 Translation files processed successfully: ${config.i18n.dest}`)
  } catch (error) {
    logger.error('❌ Failed to generate translation files:', error)
    throw error
  }
}

/**
 * Calculate a hash of just the actual translation strings (msgid/msgstr pairs)
 * This ignores all header metadata, dates, and file information
 * @param {string} potContent - The content of a POT file
 * @returns {string} A hash representing just the translatable strings
 */
function calculateTranslationHash(potContent) {
  if (!potContent) return ''

  // Regular expression to match msgid blocks, handling multiline and escaped quotes
  const regex = /#:.+?\nmsgid\s+"(.+?)"\nmsgstr\s+(.+?)(?=\n\n|\n#:|$)/gs

  // Extract all translation entries
  const translations = []
  let match

  while ((match = regex.exec(potContent)) !== null) {
    const msgid = match[1].trim()

    // Skip empty msgid strings or headers
    if (msgid !== '' && msgid !== '""') {
      translations.push({
        msgid: msgid
      })
    }
  }

  // Sort translations by msgid for consistent order
  translations.sort((a, b) => a.msgid.localeCompare(b.msgid))

  // Convert to a stable string representation (just msgids in order)
  const translationString = translations.map((t) => t.msgid).join('|')

  // Generate hash
  return crypto.createHash('md5').update(translationString).digest('hex')
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
    logger.warn(`⚠️ Failed to update POT file date: ${error.message}`)
  }
}

/**
 * Watch PHP files for translation changes
 * @param {Object} config - Project configuration
 * @returns {Object} - Watcher instance
 */
export async function watchPhpForTranslations(config) {
  if (!isFeatureEnabled(config, 'i18n')) {
    logger.info('🚫 Translation generation is disabled, not watching')
    return null
  }

  const phpPatterns = Array.isArray(config.i18n.src) ? config.i18n.src : [config.i18n.src]

  logger.info('👀 Watching PHP files for translations...')

  // Create debounced build function
  const debouncedGenerate = debounce(async (filePath) => {
    logger.info(`🔄 PHP file changed: ${path.relative(process.cwd(), filePath)}`)

    try {
      await generatePot(config)
    } catch (error) {
      logger.error('❌ Failed to regenerate translations:', error)
    }
  }, 500)

  // Setup watcher
  const watcher = chokidar.watch(phpPatterns, {
    persistent: true,
    ignoreInitial: true
  })

  watcher.on('change', debouncedGenerate)
  watcher.on('error', (error) => {
    logger.error(`❌ PHP watcher error:`, error)
  })

  return watcher
}

export default {
  generatePot,
  updatePotDate,
  watchPhpForTranslations
}
