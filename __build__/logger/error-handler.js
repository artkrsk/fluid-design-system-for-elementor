import { logger } from './logger.js'

/**
 * Wraps a function with error handling
 * @param {Function} fn - The function to wrap
 * @param {string} [context] - Optional context for error logging
 * @returns {Function} The wrapped function
 */
export function withErrorHandling(fn, context) {
  return async (...args) => {
    try {
      return await fn(...args)
    } catch (error) {
      logger.error(`Error in ${context || 'operation'}:`, error)
      throw error
    }
  }
}

/**
 * Custom build error class for specific build failures
 */
export class BuildError extends Error {
  constructor(message, details) {
    super(message)
    this.name = 'BuildError'
    this.details = details
  }
}

/**
 * Handle build error with formatted output
 * @param {Error} error - The error to handle
 * @param {string} [phase] - Optional build phase for context
 */
export function handleBuildError(error, phase) {
  const phaseStr = phase ? ` during ${phase}` : ''

  if (error instanceof BuildError) {
    logger.error(`Build failed${phaseStr}: ${error.message}`)
    if (error.details) {
      logger.error('Error details:', error.details)
    }
  } else {
    logger.error(`Unexpected error${phaseStr}:`, error)
  }
}
