import path from 'path'
import { fileURLToPath } from 'url'
import process from 'process'
import { logger } from '../logger/index.js'
import { loadConfig as loadProjectConfig, validateConfig } from '../config/index.js'

// Core utilities
import { compileJavaScript, watchJavaScript } from '../utils/assets/javascript.js'
import { compileSass, watchSass } from '../utils/assets/sass.js'
import { cleanDirectories } from '../utils/filesystem/clean.js'
import { syncFiles, watchForFileChanges } from '../utils/filesystem/sync.js'
import { createZipArchive } from '../utils/filesystem/archive.js'
import { updatePluginMeta, watchComposerJson } from '../utils/wordpress/plugin-meta.js'
import { generatePot, watchPhpForTranslations } from '../utils/wordpress/i18n.js'
import { startLiveReloadServer } from '../utils/common/live-reload.js'

/**
 * Main Builder class for the Fluid Design System
 */
export class Builder {
  constructor() {
    const __dirname = path.dirname(fileURLToPath(import.meta.url))
    const PROJECT_ROOT = path.resolve(__dirname, '../..')

    this.config = null
    this.logger = logger
    this.paths = {
      project: PROJECT_ROOT,
      build: path.resolve(__dirname, '..')
    }
    this.liveReloadServer = null
    this.watchers = {}
  }

  /**
   * Load project configuration based on environment
   * @param {string} env - Environment ('development' or 'production')
   * @returns {Promise<Object>} Merged configuration object
   */
  async loadConfig(env = process.env.NODE_ENV || 'development') {
    try {
      // Load configuration
      this.config = await loadProjectConfig(this.paths.project, env)

      // Validate configuration
      validateConfig(this.config)

      return this.config
    } catch (error) {
      logger.error('Failed to load configuration:', error)
      throw error
    }
  }

  /**
   * Run the build process for production
   */
  async build() {
    try {
      if (!this.config) {
        await this.loadConfig('production')
      }

      logger.info('Building for production...')

      // Clean directories
      await cleanDirectories(this.config)

      // Update plugin metadata based on composer.json
      await updatePluginMeta(this.config)

      // Compile JavaScript
      await compileJavaScript(this.config)

      // Compile Sass
      await compileSass(this.config)

      // Generate POT file
      await generatePot(this.config)

      // Sync files to target directories
      await syncFiles(this.config, false)

      // Create ZIP archive
      await createZipArchive(this.config)

      logger.success('Build completed successfully')
    } catch (error) {
      logger.error('Build failed:', error)
      throw error
    }
  }

  /**
   * Start development mode with file watching
   */
  async dev() {
    try {
      if (!this.config) {
        await this.loadConfig('development')
      }

      logger.info('Starting development mode...')

      // Clean directories
      await cleanDirectories(this.config)

      // Update plugin metadata based on composer.json
      await updatePluginMeta(this.config)

      // Initial builds
      await compileJavaScript(this.config)
      await compileSass(this.config)
      await generatePot(this.config)

      // Start live reload server if enabled
      this.liveReloadServer = await startLiveReloadServer(this.config)

      // Initial sync of files
      await syncFiles(this.config, true)

      // Set up watchers
      this.watchers.js = await watchJavaScript(this.config, this.liveReloadServer)
      this.watchers.sass = await watchSass(this.config, this.liveReloadServer)
      this.watchers.php = await watchPhpForTranslations(this.config)
      this.watchers.composer = await watchComposerJson(this.config)
      this.watchers.files = await watchForFileChanges(this.config, this.liveReloadServer)

      logger.success('Development mode started')
      logger.info('Press Ctrl+C to stop')

      // Handle graceful shutdown
      process.on('SIGINT', () => {
        this.shutdown()
        process.exit(0)
      })
    } catch (error) {
      logger.error('Development mode failed to start:', error)
      throw error
    }
  }

  /**
   * Shut down all running services
   */
  shutdown() {
    logger.info('Shutting down...')

    // Close all watchers
    Object.keys(this.watchers).forEach((key) => {
      if (this.watchers[key] && typeof this.watchers[key].close === 'function') {
        this.watchers[key].close()
        this.watchers[key] = null
      }
    })

    // Close live reload server if running
    if (this.liveReloadServer) {
      this.liveReloadServer.close()
      this.liveReloadServer = null
    }

    logger.info('Shutdown complete')
  }
}

export default Builder
