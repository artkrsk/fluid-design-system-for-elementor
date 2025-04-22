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
  }

  /**
   * Format a log message with optional timestamp
   * @param {string} level The log level label
   * @param {string} message The message to log
   * @param {string} [context] Optional context label
   * @returns {string} Formatted log message
   */
  format(level, message, context) {
    const timestamp = this.timestamps ? `[${new Date().toISOString()}] ` : ''
    const contextStr = context ? `[${context}] ` : ''
    return `${timestamp}${level} ${contextStr}${message}`
  }

  /**
   * Log an error message
   * @param {string} message The message to log
   * @param {Error|string} [error] Optional error object or message
   */
  error(message, error) {
    if (this.level < LogLevel.ERROR) return

    const errorMsg = this.format('ERROR', message)
    console.error(this.useColors ? chalk.red(errorMsg) : errorMsg)

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
    console.info(this.useColors ? chalk.green(successMsg) : successMsg)
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

    console.group(this.useColors ? chalk.magenta(label) : label)
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
export const logger = new Logger()

// Export the Logger class for custom instantiation
export { Logger }
