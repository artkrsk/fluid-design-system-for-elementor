import fs from 'fs-extra'
import path from 'path'
import chokidar from 'chokidar'
import debounce from 'debounce'
import { logger } from '../../logger/index.js'
import { getPluginDestPath, shouldCreateDistFolder } from '../common/paths.js'
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

    // Sync PHP files only if we have targets
    if (
      isFeatureEnabled(config, 'wordpress') &&
      ((config.wordpress.targets && config.wordpress.targets.length) ||
        (isDev && config.wordpressPlugin?.target) ||
        (!isDev && shouldCreateDistFolder(config))) // Always sync PHP files in production if dist folder is enabled
    ) {
      tasks.push(syncPhpFiles(config, isDev))
    }

    // Sync WordPress plugin files only if enabled and we're creating dist or have a target
    if (
      isFeatureEnabled(config, 'wordpressPlugin') &&
      (shouldCreateDistFolder(config) || (isDev && config.wordpressPlugin?.target))
    ) {
      tasks.push(syncWordPressPluginFiles(config, isDev))
    }

    // Always sync vendor files for production builds
    if (!isDev && shouldCreateDistFolder(config)) {
      logger.info(
        'Production build: Force syncing vendor files to ensure they are included in the ZIP'
      )
      tasks.push(syncVendorFiles(config, isDev))
    }
    // Otherwise, sync based on configuration
    else if (
      config.wordpressPlugin?.vendor?.watch &&
      (shouldCreateDistFolder(config) || (isDev && config.wordpressPlugin?.target))
    ) {
      tasks.push(syncVendorFiles(config, isDev))
    }

    // Sync composer files if needed
    if (shouldCreateDistFolder(config) || (isDev && config.wordpressPlugin?.target)) {
      tasks.push(syncComposerFiles(config, isDev))
    }

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
  } else if (!isDev && shouldCreateDistFolder(config)) {
    // Add dist target in production mode - ensure correct subdirectory structure
    targets.push(path.join(config.paths.dist, `${config.wordpressPlugin.packageName}/src/php`))
  }

  // Skip if no targets defined
  if (targets.length === 0) {
    logger.debug(`No PHP sync targets defined, skipping`)
    return
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

  // Skip if no source
  if (!(await fs.pathExists(source))) {
    logger.debug(`WordPress plugin source not found: ${source}, skipping sync`)
    return
  }

  const pluginDest = getPluginDestPath(config, isDev)

  // Skip if using dist but createDistFolder is false and not in dev mode
  if (!isDev && !shouldCreateDistFolder(config)) {
    logger.debug(`Dist folder creation is disabled, skipping WordPress plugin sync`)
    return
  }

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
  const isProductionBuild = !isDev && shouldCreateDistFolder(config)
  const backupPath = './vendor_dev_backup'

  // For production builds, backup vendor and reinstall without dev dependencies
  if (isProductionBuild && (await fs.pathExists(source))) {
    logger.info('Production build: backing up vendor directory...')
    await fs.move(source, backupPath, { overwrite: true })
  }

  try {
    // Check if vendor directory exists, install if not
    if (!(await fs.pathExists(source))) {
    logger.warn(`Vendor directory not found: ${source}, running composer install...`)

    try {
      // Use the project root from config or fall back to current working directory
      const projectRoot = config._absoluteProjectRoot || process.cwd()

      // Run composer install if composer.json exists
      if (await fs.pathExists(path.join(projectRoot, 'composer.json'))) {
        const { execSync } = await import('child_process')
        const cmd = 'composer install --no-dev --no-scripts --optimize-autoloader'

        logger.info(`Running: ${cmd}`)
        execSync(cmd, { cwd: projectRoot, stdio: 'inherit' })

        // Verify vendor directory exists after composer install
        if (!(await fs.pathExists(source))) {
          logger.error(`Composer install completed but vendor directory still not found: ${source}`)
          throw new Error('Vendor directory not created after composer install')
        }

        logger.success('Composer dependencies installed successfully')
      } else {
        logger.error('composer.json not found, cannot install vendor dependencies')
        throw new Error('composer.json not found, cannot proceed with vendor sync')
      }
    } catch (error) {
      logger.error(`Failed to install composer dependencies: ${error.message}`)
      throw error
    }
  }

  // Always sync vendor files during builds regardless of settings
  // This ensures vendor directory is included in the ZIP
  const pluginDest = getPluginDestPath(config, isDev)
  const vendorTarget = config.wordpressPlugin?.vendor?.target || 'vendor'
  const targetDir = path.join(pluginDest, vendorTarget)

  logger.info(`Syncing vendor files from ${source} to ${targetDir}`)

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

  logger.success(`Synced vendor files to ${targetDir}`)

  // Verify the autoload.php file exists in the target
  const autoloadPath = path.join(targetDir, 'autoload.php')
  if (!(await fs.pathExists(autoloadPath))) {
    logger.error(`autoload.php not found in synced vendor directory: ${autoloadPath}`)
    logger.info(`Current vendor directory contents:`)
    const vendorFiles = await fs.readdir(targetDir)
    logger.info(vendorFiles.join(', '))

    if (await fs.pathExists(path.join(source, 'autoload.php'))) {
      logger.info(`autoload.php exists in source but wasn't copied. Force copying...`)
      await fs.copyFile(path.join(source, 'autoload.php'), autoloadPath)

      if (await fs.pathExists(autoloadPath)) {
        logger.success(`autoload.php successfully force copied to ${autoloadPath}`)
      } else {
        logger.error(`Failed to force copy autoload.php to ${autoloadPath}`)
      }
    } else {
      logger.error(`autoload.php not found in source: ${path.join(source, 'autoload.php')}`)
    }
  } else {
    logger.success(`Verified autoload.php exists in target: ${autoloadPath}`)
  }
  } finally {
    // Restore development vendor for production builds
    if (isProductionBuild && (await fs.pathExists(backupPath))) {
      if (await fs.pathExists(source)) {
        await fs.remove(source)
      }
      await fs.move(backupPath, source)
      logger.info('Development vendor restored')
    }
  }
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

  // Skip if using dist but createDistFolder is false and not in dev mode
  if (!isDev && !shouldCreateDistFolder(config)) {
    logger.debug(`Dist folder creation is disabled, skipping composer files sync`)
    return
  }

  const pluginDest = getPluginDestPath(config, isDev)
  // Use the project root from config or fall back to current working directory
  const projectRoot = config._absoluteProjectRoot || process.cwd()

  logger.debug(`Syncing composer files to ${pluginDest}`)

  for (const fileName of composerFiles) {
    const source = path.join(projectRoot, fileName)

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
  const watchPaths = []

  // Watch PHP files if we have targets
  if (config.wordpress.targets && config.wordpress.targets.length) {
    watchPaths.push(config.paths.php)
  }

  // Watch WordPress plugin files if we have a target
  if (config.wordpressPlugin?.target) {
    watchPaths.push(config.paths.wordpress.plugin)
  }

  // Add vendor directory if configured
  if (config.wordpressPlugin?.vendor?.watch && config.wordpressPlugin?.target) {
    watchPaths.push(config.wordpressPlugin.vendor.source)
  }

  // Skip if no watch paths
  if (watchPaths.length === 0) {
    logger.info(`No watch paths defined, skipping file watching`)
    return { close: () => {} }
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

  // Create watchers based on configured paths
  const watchers = []

  // Setup PHP watcher if needed
  if (watchPaths.includes(config.paths.php)) {
    const phpWatcher = chokidar.watch(config.paths.php, {
      ignored: config.watch.ignored || ['**/node_modules/**', '**/dist/**', '**/.*', '**/.*/**'],
      persistent: true,
      ignoreInitial: true
    })

    phpWatcher
      .on('add', debouncedSyncPhp)
      .on('change', debouncedSyncPhp)
      .on('unlink', debouncedSyncPhp)
      .on('error', (error) => {
        logger.error(`PHP watcher error:`, error)
      })

    watchers.push(phpWatcher)
  }

  // Setup plugin watcher if needed
  if (watchPaths.includes(config.paths.wordpress.plugin)) {
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

    pluginWatcher
      .on('add', debouncedSyncPlugin)
      .on('change', debouncedSyncPlugin)
      .on('unlink', debouncedSyncPlugin)
      .on('error', (error) => {
        logger.error(`WordPress plugin watcher error:`, error)
      })

    watchers.push(pluginWatcher)
  }

  // Setup vendor watcher if enabled
  if (
    config.wordpressPlugin?.vendor?.watch &&
    watchPaths.includes(config.wordpressPlugin.vendor.source)
  ) {
    const vendorDir = config.wordpressPlugin.vendor.source

    const vendorWatcher = chokidar.watch(vendorDir, {
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

    watchers.push(vendorWatcher)
  }

  // Return a composite watcher with a close method
  return {
    close: () => {
      watchers.forEach((watcher) => {
        if (watcher && typeof watcher.close === 'function') {
          watcher.close()
        }
      })
    }
  }
}

export default {
  syncFiles,
  watchForFileChanges
}
