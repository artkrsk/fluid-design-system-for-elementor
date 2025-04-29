import browserSync from 'browser-sync'
import { logger } from '../../logger/index.js'
import { isFeatureEnabled } from '../../config/index.js'

/**
 * Start live reload server
 * @param {Object} config - Project configuration
 * @returns {Object} - Live reload server instance
 */
export async function startLiveReloadServer(config) {
  if (!isFeatureEnabled(config, 'liveReload')) {
    logger.info('🚫 Live reload is disabled, skipping')
    return null
  }

  logger.info('🔄 Starting live reload server...')

  try {
    // Completely silence Browser-Sync console output by redirecting its logging
    // Save original console methods
    const originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug
    }

    // Create a browser-sync instance
    const bs = browserSync.create()

    // Temporarily silence console during initialization
    const silenceConsole = () => {
      console.log = () => {}
      console.info = () => {}
      console.warn = () => {}
      console.debug = () => {}
      // Keep error for important issues
      console.error = (...args) => {
        if (args.length > 0 && typeof args[0] === 'string' && args[0].includes('Browsersync')) {
          // Still log browser-sync errors to our logger
          logger.error('❌ Browser-sync error: ' + args.join(' '))
        }
      }
    }

    // Restore console to original state
    const restoreConsole = () => {
      console.log = originalConsole.log
      console.info = originalConsole.info
      console.warn = originalConsole.warn
      console.error = originalConsole.error
      console.debug = originalConsole.debug
    }

    // Configure browser-sync with minimum possible logging
    const bsConfig = {
      // Completely silence browser-sync logging
      logLevel: 'silent',
      logPrefix: false,
      port: config.liveReload.port || 3000,
      host: config.liveReload.host || 'localhost',
      https: config.liveReload.https || false,

      // Disable all notifications
      notify: false,

      reloadDebounce: config.liveReload.reloadDebounce || 500,
      reloadThrottle: config.liveReload.reloadThrottle || 1000,
      injectChanges: config.liveReload.injectChanges !== false,
      ghostMode: config.liveReload.ghostMode || {
        clicks: false,
        forms: false,
        scroll: false
      },

      // Disable UI
      ui: false,
      open: false,

      // Hide all output
      logSnippet: false,
      logConnections: false,
      logFileChanges: false,

      // Debug mode off
      debug: false,

      // Silence middleware logging
      middleware: [],

      // Other options to minimize output
      online: true,
      tunnel: false
    }

    // Override snippet option if specified in config
    if (config.liveReload.snippet === false) {
      bsConfig.snippet = false
    }

    // Add custom notify styles if configured (but still keep notifications off by default)
    if (config.liveReload.notify === true) {
      bsConfig.notify = config.liveReload.notify.styles || true
    }

    // Log protocol being used to our own logger
    const protocol = bsConfig.https ? 'https' : 'http'
    logger.debug(`📡 Using ${protocol} protocol for live reload`)

    // Silence console, initialize browser-sync, then restore console
    silenceConsole()

    // Wrap initialization in a promise to ensure we restore console
    await new Promise((resolve) => {
      bs.init(bsConfig, () => {
        // Success callback - restore console, then log success
        restoreConsole()
        logger.success(
          `✅ Live reload server started at ${protocol}://${config.liveReload.host}:${config.liveReload.port}`
        )
        resolve()
      })

      // Safety timeout to restore console even if browser-sync fails to initialize
      setTimeout(() => {
        restoreConsole()
        resolve()
      }, 2000)
    })

    // Create a wrapper for the browser-sync instance
    return {
      /**
       * Notify browser-sync of file changes
       * @param {string} filePath - Path to the changed file
       */
      notifyChange: (filePath) => {
        logger.debug(`🔄 Live reloading: ${filePath}`)

        // Silence console, reload, then restore
        silenceConsole()

        // Determine reload method based on file extension
        const ext = filePath.split('.').pop().toLowerCase()

        if (['css', 'sass', 'scss'].includes(ext)) {
          // Inject CSS changes without full page reload
          bs.reload('*.css')
        } else {
          // Full page reload for other file types
          bs.reload()
        }

        restoreConsole()
      },

      /**
       * Close the browser-sync instance
       */
      close: () => {
        if (bs && bs.active) {
          silenceConsole()
          bs.exit()
          restoreConsole()
          logger.info('🔄 Live reload server stopped')
        }
      }
    }
  } catch (error) {
    logger.error('❌ Failed to start live reload server:', error)
    return null
  }
}

export default {
  startLiveReloadServer
}
