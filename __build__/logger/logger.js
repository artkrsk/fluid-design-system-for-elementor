import chalk from 'chalk'

/**
 * Log levels enum
 */
export const LogLevel = {
  SILENT: 0,
  ERROR: 1,
  WARN: 2,
  INFO: 3,
  DEBUG: 4,
  TRACE: 5
}

/**
 * Simple logger with color support
 */
class Logger {
  constructor(options = {}) {
    this.level = options.level || LogLevel.INFO
    this.timestamps = options.timestamps !== false
    this.useColors = options.colors !== false
    this.useLocalTime = options.useLocalTime !== false
  }

  /**
   * Format a log message with optional timestamp
   * @param {string} level The log level label
   * @param {string} message The message to log
   * @param {string} [context] Optional context label
   * @returns {string} Formatted log message
   */
  format(level, message, context) {
    const timestamp = this.timestamps ? this.getTimestamp() : ''
    const contextStr = context ? `[${context}] ` : ''
    return `${timestamp}${level} ${contextStr}${message}`
  }

  /**
   * Get a human-readable timestamp
   * @returns {string} Formatted timestamp
   */
  getTimestamp() {
    const now = new Date()

    // Format as YYYY-MM-DD HH:MM:SS in local timezone
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')

    return `[${year}-${month}-${day} ${hours}:${minutes}:${seconds}] `
  }

  /**
   * Log an error message
   * @param {string} message The message to log
   * @param {Error|string} [error] Optional error object or message
   */
  error(message, error) {
    if (this.level < LogLevel.ERROR) return

    const errorMsg = this.format('ERROR', message)
    console.error(this.useColors ? chalk.red.bold(errorMsg) : errorMsg)

    if (error) {
      if (error instanceof Error) {
        console.error(
          this.useColors ? chalk.red(error.stack || error.message) : error.stack || error.message
        )
      } else {
        console.error(this.useColors ? chalk.red(error) : error)
      }
    }
  }

  /**
   * Log a warning message
   * @param {string} message The message to log
   * @param {string} [context] Optional context label
   */
  warn(message, context) {
    if (this.level < LogLevel.WARN) return

    const warnMsg = this.format('WARN', message, context)
    console.warn(this.useColors ? chalk.yellow(warnMsg) : warnMsg)
  }

  /**
   * Log an info message
   * @param {string} message The message to log
   * @param {string} [context] Optional context label
   */
  info(message, context) {
    if (this.level < LogLevel.INFO) return

    const infoMsg = this.format('INFO', message, context)
    console.info(this.useColors ? chalk.blue(infoMsg) : infoMsg)
  }

  /**
   * Log a success message
   * @param {string} message The message to log
   * @param {string} [context] Optional context label
   */
  success(message, context) {
    if (this.level < LogLevel.INFO) return

    const successMsg = this.format('SUCCESS', message, context)
    console.info(this.useColors ? chalk.green.bold(successMsg) : successMsg)
  }

  /**
   * Log a debug message
   * @param {string} message The message to log
   * @param {string} [context] Optional context label
   */
  debug(message, context) {
    if (this.level < LogLevel.DEBUG) return

    const debugMsg = this.format('DEBUG', message, context)
    console.debug(this.useColors ? chalk.cyan(debugMsg) : debugMsg)
  }

  /**
   * Log a trace message
   * @param {string} message The message to log
   * @param {string} [context] Optional context label
   */
  trace(message, context) {
    if (this.level < LogLevel.TRACE) return

    const traceMsg = this.format('TRACE', message, context)
    console.debug(this.useColors ? chalk.gray(traceMsg) : traceMsg)
  }

  /**
   * Run a function within a grouped log context
   * @param {string} label The group label
   * @param {Function} fn The function to run
   * @returns {Promise<any>} Result of the function
   */
  async group(label, fn) {
    if (this.level < LogLevel.INFO) {
      return await fn()
    }

    console.group(this.useColors ? chalk.magenta.bold(label) : label)
    try {
      const result = await fn()
      console.groupEnd()
      return result
    } catch (error) {
      console.groupEnd()
      throw error
    }
  }
}

// Create and export default logger instance
export const logger = new Logger({
  useLocalTime: true
})

// Export the Logger class for custom instantiation
export { Logger }
