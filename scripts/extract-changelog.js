#!/usr/bin/env node
/**
 * Extract changelog from readme.txt for a specific version
 *
 * Usage:
 *   node scripts/extract-changelog.js [version]
 *   node scripts/extract-changelog.js 2.1.0
 *   node scripts/extract-changelog.js latest
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

const readmePath = resolve('src/wordpress-plugin/readme.txt')
const version = process.argv[2] || 'latest'

try {
  const readme = readFileSync(readmePath, 'utf8')

  // Find changelog section
  const changelogMatch = readme.match(/== Changelog ==([\s\S]+?)(?:==|$)/)
  if (!changelogMatch) {
    console.error('No changelog section found in readme.txt')
    process.exit(1)
  }

  const changelogSection = changelogMatch[1]

  // Extract entries
  const entries = changelogSection.split(/(?=^= [\d.]+)/m).filter(e => e.trim())

  if (version === 'latest') {
    // Return the first entry (latest version)
    if (entries.length > 0) {
      console.log(entries[0].trim())
    } else {
      console.error('No changelog entries found')
      process.exit(1)
    }
  } else {
    // Find specific version
    const versionEntry = entries.find(e => e.includes(`= ${version} =`))
    if (versionEntry) {
      console.log(versionEntry.trim())
    } else {
      console.error(`Version ${version} not found in changelog`)
      process.exit(1)
    }
  }
} catch (error) {
  console.error('Error reading changelog:', error.message)
  process.exit(1)
}
