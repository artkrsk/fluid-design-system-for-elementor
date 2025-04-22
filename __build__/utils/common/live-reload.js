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
    logger.info('Live reload is disabled, skipping')
    return null
  }

  logger.info('Starting live reload server...')

  try {
    // Create browser-sync instance
    const bs = browserSync.create()

    // Configure browser-sync
    const bsConfig = {
      logLevel: config.liveReload.logLevel || 'silent',
      logPrefix: 'LiveReload',
      port: config.liveReload.port || 3000,
      host: config.liveReload.host || 'localhost',
      https: config.liveReload.https || false,
      notify: config.liveReload.notify !== false,
      reloadDebounce: config.liveReload.reloadDebounce || 500,
      reloadThrottle: config.liveReload.reloadThrottle || 1000,
      injectChanges: config.liveReload.injectChanges !== false,
      ghostMode: config.liveReload.ghostMode || {
        clicks: false,
        forms: false,
        scroll: false
      },
      ui: false,
      open: config.liveReload.open || false,
      snippet: config.liveReload.snippet !== false
    }

    // Log protocol being used
    const protocol = bsConfig.https ? 'https' : 'http'
    logger.debug(`Using ${protocol} protocol for live reload`)

    // Add custom notify styles if configured
    if (config.liveReload.notify && config.liveReload.notify.styles) {
      bsConfig.notify = {
        styles: config.liveReload.notify.styles
      }
    }

    // Initialize browser-sync
    bs.init(bsConfig, () => {
      logger.success(
        `Live reload server started at ${protocol}://${config.liveReload.host}:${config.liveReload.port}`
      )
    })

    // Create a wrapper for the browser-sync instance
    return {
      /**
       * Notify browser-sync of file changes
       * @param {string} filePath - Path to the changed file
       */
      notifyChange: (filePath) => {
        logger.debug(`Notifying live reload server of change: ${filePath}`)

        // Determine reload method based on file extension
        const ext = filePath.split('.').pop().toLowerCase()

        if (['css', 'sass', 'scss'].includes(ext)) {
          // Inject CSS changes without full page reload
          bs.reload('*.css')
        } else {
          // Full page reload for other file types
          bs.reload()
        }
      },

      /**
       * Close the browser-sync instance
       */
      close: () => {
        if (bs && bs.active) {
          bs.exit()
          logger.info('Live reload server stopped')
        }
      }
    }
  } catch (error) {
    logger.error('Failed to start live reload server:', error)
    return null
  }
}

export default {
  startLiveReloadServer
}
