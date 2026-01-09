#!/usr/bin/env node
/**
 * Sync changelog from readme.txt to CHANGELOG.md
 *
 * Converts WordPress readme.txt changelog format to Keep a Changelog format
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const readmePath = resolve('src/wordpress-plugin/readme.txt')
const changelogPath = resolve('CHANGELOG.md')

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
  const entries = changelogSection
    .split(/(?=^= [\d.]+)/m)
    .filter(e => e.trim())
    .map(entry => {
      const lines = entry.trim().split('\n')
      const versionLine = lines[0]
      const changes = lines.slice(1).filter(l => l.trim().startsWith('*'))

      // Extract version
      const versionMatch = versionLine.match(/= ([\d.]+) =/)
      if (!versionMatch) return null

      const version = versionMatch[1]

      // Keep changes as-is (no categorization)
      const changesList = changes.map(change => change.replace(/^\*\s*/, '').trim())

      return { version, changes: changesList }
    })
    .filter(Boolean)

  // Build CHANGELOG.md content (simple format)
  let changelog = `# Changelog\n\n`

  entries.forEach(({ version, changes }) => {
    changelog += `## ${version}\n\n`
    changes.forEach(item => changelog += `* ${item}\n`)
    changelog += '\n'
  })

  writeFileSync(changelogPath, changelog.trim() + '\n')
  console.log(`✅ Synced changelog from readme.txt to CHANGELOG.md`)
  console.log(`   ${entries.length} versions processed`)
} catch (error) {
  console.error('Error syncing changelog:', error.message)
  process.exit(1)
}
