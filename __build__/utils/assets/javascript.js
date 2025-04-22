import { build } from 'esbuild'
import fs from 'fs-extra'
import path from 'path'
import chokidar from 'chokidar'
import debounce from 'debounce'
import { logger } from '../../logger/index.js'
import { generateBanner, wrapAsUmd } from '../common/banner.js'
import { getPackageMetadata } from '../common/version.js'
import { getLibraryDir, getOutputFilePath } from '../common/paths.js'
import { isDevelopment } from '../../config/index.js'

/**
 * Compile JavaScript files
 * @param {Object} config - Project configuration
 * @returns {Promise<void>}
 */
export async function compileJavaScript(config) {
  logger.info('Compiling JavaScript...')

  const isDev = isDevelopment(config)
  const formats = isDev ? ['iife'] : config.build.formats

  try {
    const packageMetadata = await getPackageMetadata(config)

    for (const format of formats) {
      logger.debug(`Building ${format} format...`)

      const outputFile = getOutputFilePath(config, format)
      const outputDir = path.dirname(outputFile)

      // Ensure output directory exists
      await fs.ensureDir(outputDir)

      // Create build configuration
      const buildConfig = {
        entryPoints: [config.entry],
        outfile: outputFile,
        bundle: true,
        minify: !isDev,
        sourcemap: isDev,
        target: config.build.target,
        format,
        globalName: format === 'iife' ? config.build.umd.name : undefined,
        external: Object.keys(config.build.externals || {}),
        banner: {
          js: generateBanner(packageMetadata)
        }
      }

      // Add global definitions for IIFE build
      if (format === 'iife' && config.build.umd?.globals) {
        buildConfig.globalName = config.build.umd.name
        buildConfig.define = Object.entries(config.build.umd.globals).reduce(
          (acc, [key, value]) => {
            acc[key] = JSON.stringify(value)
            return acc
          },
          {}
        )
      }

      // Build the JavaScript
      await build(buildConfig)

      // For IIFE builds, wrap the output in a UMD wrapper
      if (format === 'iife') {
        await wrapJsAsUmd(outputFile, config, packageMetadata)
      }

      logger.success(`JavaScript ${format} build completed: ${outputFile}`)

      // Copy to PHP libraries if it's an IIFE build
      if (format === 'iife') {
        await copyUmdToLibrary(outputFile, config, isDev)
      }
    }

    logger.success('JavaScript compilation completed')
  } catch (error) {
    logger.error('JavaScript compilation failed:', error)
    throw error
  }
}

/**
 * Wrap JavaScript file as UMD
 * @param {string} outputFile - Path to the output file
 * @param {Object} config - Project configuration
 * @param {Object} packageMetadata - Package metadata for banner
 * @returns {Promise<void>}
 */
async function wrapJsAsUmd(outputFile, config, packageMetadata) {
  const content = await fs.readFile(outputFile, 'utf8')
  const wrappedContent = wrapAsUmd(
    content,
    config.build.umd.name,
    config.build.externals,
    packageMetadata
  )
  await fs.writeFile(outputFile, wrappedContent)
}

/**
 * Copy UMD build to library directory
 * @param {string} outputFile - Path to the output file
 * @param {Object} config - Project configuration
 * @param {boolean} isDev - Whether this is a development build
 * @returns {Promise<void>}
 */
async function copyUmdToLibrary(outputFile, config, isDev) {
  // Get library directory
  const libraryDir = getLibraryDir(config, isDev)
  await fs.ensureDir(libraryDir)

  // Copy main file
  await fs.copyFile(outputFile, path.join(libraryDir, path.basename(outputFile)))

  // Copy sourcemap if in development mode
  if (isDev) {
    await fs.copyFile(
      `${outputFile}.map`,
      path.join(libraryDir, `${path.basename(outputFile)}.map`)
    )
  }

  logger.debug(`Copied UMD build to PHP libraries`)
}

/**
 * Watch JavaScript files for changes
 * @param {Object} config - Project configuration
 * @param {Object} liveReloadServer - Live reload server instance
 * @returns {Object} - Watcher instance
 */
export async function watchJavaScript(config, liveReloadServer) {
  const jsDir = path.resolve(config.paths.js)

  logger.info(`Watching JavaScript files in ${path.relative(process.cwd(), jsDir)}`)

  // Create debounced build function
  const debouncedBuild = debounce(async (filePath) => {
    logger.info(`JavaScript file changed: ${path.relative(process.cwd(), filePath)}`)

    try {
      await compileJavaScript(config)

      // Notify live reload server
      if (liveReloadServer) {
        const iifeFile = getOutputFilePath(config, 'iife')
        liveReloadServer.notifyChange(iifeFile)
      }
    } catch (error) {
      logger.error('Failed to rebuild JavaScript files:', error)
    }
  }, 300)

  // Setup watcher
  const watcher = chokidar.watch(jsDir, {
    ignored: config.watch.ignored || ['**/node_modules/**', '**/dist/**'],
    persistent: true,
    ignoreInitial: true
  })

  watcher.on('change', debouncedBuild)
  watcher.on('error', (error) => {
    logger.error(`JavaScript watcher error:`, error)
  })

  return watcher
}

export default {
  compileJavaScript,
  watchJavaScript
}
