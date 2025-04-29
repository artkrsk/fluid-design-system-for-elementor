import * as sassCompiler from 'sass'
import fs from 'fs-extra'
import path from 'path'
import chokidar from 'chokidar'
import debounce from 'debounce'
import { logger } from '../../logger/index.js'
import { generateBanner } from '../common/banner.js'
import { getPackageMetadata } from '../common/version.js'
import { getLibraryDir, getDirectCssOutputPath, shouldCreateDistFolder } from '../common/paths.js'
import { isFeatureEnabled, isDevelopment } from '../../config/index.js'

/**
 * Compile Sass files
 * @param {Object} config - Project configuration
 * @returns {Promise<void>}
 */
export async function compileSass(config) {
  if (!isFeatureEnabled(config, 'sass')) {
    logger.info('🚫 Sass compilation is disabled, skipping')
    return
  }

  logger.info('🎨 Compiling Sass files...')

  try {
    const isDev = isDevelopment(config)
    const shouldCreateDist = shouldCreateDistFolder(config)
    const packageMetadata = await getPackageMetadata(config)

    // Get file contents with banner
    const result = sassCompiler.compile(config.sass.entry, {
      ...config.sass.options,
      sourceMap: isDev
    })

    // Add banner
    const banner = generateBanner(packageMetadata)
    const cssContent = `${banner}\n${result.css}`

    // Write to direct library path
    const directOutputPath = getDirectCssOutputPath(config)
    await fs.ensureDir(path.dirname(directOutputPath))
    await fs.writeFile(directOutputPath, cssContent)
    logger.success(`✅ Sass compiled successfully: ${directOutputPath}`)

    // Write source map if in development mode
    if (isDev && result.sourceMap) {
      const sourceMapFile = `${directOutputPath}.map`
      await fs.writeFile(sourceMapFile, JSON.stringify(result.sourceMap))
      logger.debug(`📝 Source map generated: ${sourceMapFile}`)
    }

    // Write to dist folder only if explicitly enabled
    if (shouldCreateDist) {
      logger.debug('📂 Also writing CSS to dist folder')

      // Ensure the output directory exists
      const outputFile = config.sass.output
      await fs.ensureDir(path.dirname(outputFile))
      await fs.writeFile(outputFile, cssContent)
      logger.success(`✅ Sass compiled to dist: ${outputFile}`)

      // Write source map if in development mode
      if (isDev && result.sourceMap) {
        const sourceMapFile = `${outputFile}.map`
        await fs.writeFile(sourceMapFile, JSON.stringify(result.sourceMap))
        logger.debug(`📝 Source map generated: ${sourceMapFile}`)
      }

      // Copy to PHP libraries if not already in the right place
      await copyCssToLibrary(outputFile, cssContent, config, isDev, result.sourceMap)
    }

    // Always copy to the production library directory if we're in production mode
    if (!isDev && !directOutputPath.includes(config.paths.dist)) {
      const libraryDir = getLibraryDir(config, isDev)
      const targetFile = path.join(libraryDir, path.basename(config.sass.output))

      await fs.ensureDir(libraryDir)
      logger.debug(`📂 Ensuring CSS is copied to production library dir: ${libraryDir}`)
      await fs.writeFile(targetFile, cssContent)
      logger.success(`✅ CSS copied to production library location: ${targetFile}`)
    }
  } catch (error) {
    logger.error('❌ Sass compilation failed:', error)
    throw error
  }
}

/**
 * Copy compiled CSS to library directory
 * @param {string} outputFile - Path to the output file
 * @param {string} cssContent - CSS content
 * @param {Object} config - Project configuration
 * @param {boolean} isDev - Whether this is a development build
 * @param {Object} sourceMap - Source map object
 * @returns {Promise<void>}
 */
async function copyCssToLibrary(outputFile, cssContent, config, isDev, sourceMap) {
  // Get library directory - avoid copying if already direct
  const directPath = getDirectCssOutputPath(config)
  const libraryDir = getLibraryDir(config, isDev)
  const targetFile = path.join(libraryDir, path.basename(outputFile))

  // Skip if we already wrote to the target path
  if (directPath === targetFile) {
    return
  }

  // Ensure the directory exists
  await fs.ensureDir(libraryDir)

  // Copy main CSS file
  await fs.writeFile(targetFile, cssContent)

  // Copy sourcemap if in development mode
  if (isDev && sourceMap) {
    await fs.writeFile(
      path.join(libraryDir, `${path.basename(outputFile)}.map`),
      JSON.stringify(sourceMap)
    )
  }

  logger.debug(`📂 Copied compiled CSS to PHP libraries`)
}

/**
 * Watch Sass files for changes
 * @param {Object} config - Project configuration
 * @param {Object} liveReloadServer - Live reload server instance
 * @returns {Object} - Watcher instance
 */
export async function watchSass(config, liveReloadServer) {
  if (!isFeatureEnabled(config, 'sass')) {
    logger.info('🚫 Sass compilation is disabled, not watching')
    return null
  }

  const sassDir = path.resolve(config.paths.styles)

  logger.info(`👀 Watching Sass files in ${path.relative(process.cwd(), sassDir)}`)

  // Create debounced build function
  const debouncedBuild = debounce(async (filePath) => {
    logger.info(`🔄 Sass file changed: ${path.relative(process.cwd(), filePath)}`)

    try {
      await compileSass(config)

      // Notify live reload server
      if (liveReloadServer) {
        // Use direct path for notification
        const cssFile = getDirectCssOutputPath(config)
        liveReloadServer.notifyChange(cssFile)
      }
    } catch (error) {
      logger.error('❌ Failed to rebuild Sass files:', error)
    }
  }, 300)

  // Setup watcher
  const watcher = chokidar.watch(sassDir, {
    ignored: config.watch.ignored || ['**/node_modules/**', '**/dist/**'],
    persistent: true,
    ignoreInitial: true
  })

  watcher.on('change', debouncedBuild)
  watcher.on('error', (error) => {
    logger.error(`❌ Sass watcher error:`, error)
  })

  return watcher
}

export default {
  compileSass,
  watchSass
}
