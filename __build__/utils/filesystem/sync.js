import fs from 'fs-extra'
import path from 'path'
import chokidar from 'chokidar'
import debounce from 'debounce'
import { logger } from '../../logger/index.js'
import { getPluginDestPath } from '../common/paths.js'
import { isFeatureEnabled, isDevelopment } from '../../config/index.js'

/**
 * Sync files to target directories
 * @param {Object} config - Project configuration
 * @param {boolean} [isDev=null] - Whether this is a development build (auto-detected if null)
 * @returns {Promise<void>}
 */
export async function syncFiles(config, isDev = null) {
  logger.info('Syncing files to target directories...')

  // If isDev is not provided, detect from config
  if (isDev === null) {
    isDev = isDevelopment(config)
  }

  try {
    const tasks = []

    // Sync PHP files
    if (isFeatureEnabled(config, 'wordpress')) {
      tasks.push(syncPhpFiles(config, isDev))
    }

    // Sync WordPress plugin files
    if (isFeatureEnabled(config, 'wordpressPlugin')) {
      tasks.push(syncWordPressPluginFiles(config, isDev))
    }

    // Sync vendor files
    if (config.wordpressPlugin?.vendor?.watch) {
      tasks.push(syncVendorFiles(config, isDev))
    }

    // Sync composer files
    tasks.push(syncComposerFiles(config, isDev))

    await Promise.all(tasks)
    logger.success('Files synced successfully')
  } catch (error) {
    logger.error('Failed to sync files:', error)
    throw error
  }
}

/**
 * Sync PHP files to target directories
 * @param {Object} config - Project configuration
 * @param {boolean} isDev - Whether this is a development build
 * @returns {Promise<void>}
 */
async function syncPhpFiles(config, isDev) {
  const source = config.paths.php
  const targets = config.wordpress.targets || []

  if (isDev && config.wordpressPlugin?.target) {
    // Add WordPress plugin target in dev mode
    targets.push(path.join(config.wordpressPlugin.target, 'src/php'))
  } else if (!isDev) {
    // Add dist target in production mode - ensure correct subdirectory structure
    targets.push(path.join(config.paths.dist, `${config.wordpressPlugin.packageName}/src/php`))
  }

  logger.debug(`Syncing PHP files from ${source} to ${targets.length} targets`)

  for (const target of targets) {
    // Skip if target is a subdirectory of source
    if (target.startsWith(source)) {
      logger.debug(`Skipping PHP sync to subdirectory: ${target}`)
      continue
    }

    await fs.ensureDir(target)
    await fs.copy(source, target, {
      overwrite: true,
      preserveTimestamps: true,
      filter: (src) => {
        // Skip hidden files and directories (like .DS_Store)
        const basename = path.basename(src)
        if (basename.startsWith('.')) {
          return false
        }
        return true
      }
    })
    logger.debug(`Synced PHP files to ${target}`)
  }
}

/**
 * Sync WordPress plugin files to target directories
 * @param {Object} config - Project configuration
 * @param {boolean} isDev - Whether this is a development build
 * @returns {Promise<void>}
 */
async function syncWordPressPluginFiles(config, isDev) {
  const source = config.paths.wordpress.plugin
  const pluginDest = getPluginDestPath(config, isDev)

  logger.debug(`Syncing WordPress plugin files from ${source} to ${pluginDest}`)

  await fs.ensureDir(pluginDest)
  await fs.copy(source, pluginDest, {
    overwrite: true,
    preserveTimestamps: true,
    filter: (src) => {
      // Skip vendor directory which will be handled separately
      if (src.includes('/vendor/') || src.endsWith('/vendor')) {
        return false
      }

      // Skip hidden files and directories (like .DS_Store)
      const basename = path.basename(src)
      if (basename.startsWith('.')) {
        return false
      }

      return true
    }
  })

  logger.debug(`Synced WordPress plugin files to ${pluginDest}`)
}

/**
 * Sync vendor files to target directories
 * @param {Object} config - Project configuration
 * @param {boolean} isDev - Whether this is a development build
 * @returns {Promise<void>}
 */
async function syncVendorFiles(config, isDev) {
  const source = config.wordpressPlugin?.vendor?.source || './vendor'
  const pluginDest = getPluginDestPath(config, isDev)
  const vendorTarget = config.wordpressPlugin?.vendor?.target || 'vendor'
  const targetDir = path.join(pluginDest, vendorTarget)

  // Skip if vendor directory doesn't exist
  if (!(await fs.pathExists(source))) {
    logger.debug(`Vendor directory not found: ${source}, skipping sync`)
    return
  }

  logger.debug(`Syncing vendor files from ${source} to ${targetDir}`)

  // Delete target vendor directories if configured
  if (config.wordpressPlugin?.vendor?.delete) {
    if (await fs.pathExists(targetDir)) {
      await fs.emptyDir(targetDir)
      logger.debug(`Cleaned vendor directory: ${targetDir}`)
    }
  }

  // Copy vendor files
  await fs.ensureDir(targetDir)
  await fs.copy(source, targetDir, {
    overwrite: true,
    preserveTimestamps: true,
    filter: (src) => {
      // Skip node_modules and git directories
      if (src.includes('node_modules') || src.includes('.git')) {
        return false
      }

      // Skip hidden files and directories (like .DS_Store)
      const basename = path.basename(src)
      if (basename.startsWith('.')) {
        return false
      }

      return true
    }
  })

  logger.debug(`Synced vendor files to ${targetDir}`)
}

/**
 * Sync composer files to target directories
 * @param {Object} config - Project configuration
 * @param {boolean} isDev - Whether this is a development build
 * @returns {Promise<void>}
 */
async function syncComposerFiles(config, isDev) {
  const composerFiles = config.wordpressPlugin?.sourceFiles?.composer || [
    'composer.json',
    'composer.lock'
  ]
  const pluginDest = getPluginDestPath(config, isDev)

  logger.debug(`Syncing composer files to ${pluginDest}`)

  for (const fileName of composerFiles) {
    const source = path.join(process.cwd(), fileName)

    // Skip if file doesn't exist
    if (!(await fs.pathExists(source))) {
      logger.debug(`Composer file not found: ${fileName}, skipping sync`)
      continue
    }

    const targetFile = path.join(pluginDest, fileName)
    await fs.ensureDir(path.dirname(targetFile))
    await fs.copyFile(source, targetFile)
    logger.debug(`Synced ${fileName} to ${pluginDest}`)
  }
}

/**
 * Watch for file changes and sync them
 * @param {Object} config - Project configuration
 * @param {Object} liveReloadServer - Live reload server instance
 * @returns {Object} - Watcher instance
 */
export async function watchForFileChanges(config, liveReloadServer) {
  // Define directories to watch
  const watchPaths = [config.paths.php, config.paths.wordpress.plugin]

  // Add vendor directory if configured
  if (config.wordpressPlugin?.vendor?.watch) {
    watchPaths.push(config.wordpressPlugin.vendor.source)
  }

  logger.info(`Watching for file changes in ${watchPaths.length} directories`)

  // Create debounced sync function for PHP files
  const debouncedSyncPhp = debounce(async (filePath) => {
    logger.info(`PHP file changed: ${path.relative(process.cwd(), filePath)}`)

    try {
      await syncPhpFiles(config, true)

      // Notify live reload server
      if (liveReloadServer) {
        liveReloadServer.notifyChange(filePath)
      }
    } catch (error) {
      logger.error('Failed to sync PHP files:', error)
    }
  }, 300)

  // Create debounced sync function for WordPress plugin files
  const debouncedSyncPlugin = debounce(async (filePath) => {
    logger.info(`WordPress plugin file changed: ${path.relative(process.cwd(), filePath)}`)

    try {
      await syncWordPressPluginFiles(config, true)

      // Notify live reload server
      if (liveReloadServer) {
        liveReloadServer.notifyChange(filePath)
      }
    } catch (error) {
      logger.error('Failed to sync WordPress plugin files:', error)
    }
  }, 300)

  // Create debounced sync function for vendor files
  const debouncedSyncVendor = debounce(async (filePath) => {
    logger.info(`Vendor file changed: ${path.relative(process.cwd(), filePath)}`)

    try {
      await syncVendorFiles(config, true)
    } catch (error) {
      logger.error('Failed to sync vendor files:', error)
    }
  }, 1000) // Longer debounce for vendor changes

  // Setup watchers
  const phpWatcher = chokidar.watch(config.paths.php, {
    ignored: config.watch.ignored || ['**/node_modules/**', '**/dist/**', '**/.*', '**/.*/**'],
    persistent: true,
    ignoreInitial: true
  })

  const pluginWatcher = chokidar.watch(config.paths.wordpress.plugin, {
    ignored: config.watch.ignored || [
      '**/node_modules/**',
      '**/dist/**',
      '**/vendor/**',
      '**/.*',
      '**/.*/**'
    ],
    persistent: true,
    ignoreInitial: true
  })

  // Setup event handlers
  phpWatcher
    .on('add', debouncedSyncPhp)
    .on('change', debouncedSyncPhp)
    .on('unlink', debouncedSyncPhp)
    .on('error', (error) => {
      logger.error(`PHP watcher error:`, error)
    })

  pluginWatcher
    .on('add', debouncedSyncPlugin)
    .on('change', debouncedSyncPlugin)
    .on('unlink', debouncedSyncPlugin)
    .on('error', (error) => {
      logger.error(`WordPress plugin watcher error:`, error)
    })

  // Setup vendor watcher if enabled
  let vendorWatcher = null
  if (config.wordpressPlugin?.vendor?.watch) {
    const vendorDir = config.wordpressPlugin.vendor.source

    vendorWatcher = chokidar.watch(vendorDir, {
      ignored: ['**/node_modules/**', '**/.git/**', '**/.*', '**/.*/**'],
      persistent: true,
      ignoreInitial: true
    })

    vendorWatcher
      .on('add', debouncedSyncVendor)
      .on('change', debouncedSyncVendor)
      .on('unlink', debouncedSyncVendor)
      .on('error', (error) => {
        logger.error(`Vendor watcher error:`, error)
      })
  }

  // Return a composite watcher with a close method
  return {
    close: () => {
      phpWatcher.close()
      pluginWatcher.close()
      if (vendorWatcher) vendorWatcher.close()
    }
  }
}

export default {
  syncFiles,
  watchForFileChanges
}
