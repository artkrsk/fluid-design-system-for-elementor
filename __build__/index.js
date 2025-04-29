#!/usr/bin/env node
import process from 'process'
import { logger, LogLevel } from './logger/index.js'
import { Builder } from './core/builder.js'

// Set default log level based on environment or NODE_ENV
const envLogLevel =
  process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'info')
logger.level =
  {
    silent: LogLevel.SILENT,
    error: LogLevel.ERROR,
    warn: LogLevel.WARN,
    info: LogLevel.INFO,
    debug: LogLevel.DEBUG,
    trace: LogLevel.TRACE
  }[envLogLevel.toLowerCase()] || LogLevel.INFO

// Create builder instance
const builder = new Builder()

// Main function to run the CLI
async function main() {
  const args = process.argv.slice(2)
  const command = args[0] || 'build'

  try {
    if (command === 'dev') {
      await builder.dev()
    } else if (command === 'build') {
      await builder.build()
    } else {
      logger.error(`Unknown command: ${command}`)
      logger.info('Available commands: build, dev')
      process.exit(1)
    }
  } catch (error) {
    logger.error(`Failed to run ${command}:`, error)
    process.exit(1)
  }
}

// Run main function if this file is executed directly
if (import.meta.url.startsWith('file:')) {
  const scriptPath = process.argv[1] || ''
  const scriptUrl = `file://${scriptPath}`

  // Check if this is the main module, considering symlinks
  if (import.meta.url === scriptUrl || import.meta.url.endsWith(scriptPath)) {
    main().catch((error) => {
      console.error('Fatal error:', error)
      process.exit(1)
    })
  }
}

// Placeholder to check file existence

export default builder
