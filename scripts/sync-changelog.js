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

      // Extract version and date if available
      const versionMatch = versionLine.match(/= ([\d.]+) =/)
      if (!versionMatch) return null

      const version = versionMatch[1]

      // Parse changes by type
      const categorized = {
        added: [],
        fixed: [],
        improved: [],
        updated: [],
        removed: [],
        deprecated: [],
        security: []
      }

      changes.forEach(change => {
        const text = change.replace(/^\*\s*/, '').trim()
        const match = text.match(/^(added|fixed|improved|updated|removed|deprecated|security):\s*(.+)$/i)

        if (match) {
          const type = match[1].toLowerCase()
          const description = match[2]

          // Map to Keep a Changelog categories
          if (type === 'added') categorized.added.push(description)
          else if (type === 'fixed') categorized.fixed.push(description)
          else if (type === 'improved' || type === 'updated') categorized.improved.push(description)
          else if (type === 'removed') categorized.removed.push(description)
          else if (type === 'deprecated') categorized.deprecated.push(description)
          else if (type === 'security') categorized.security.push(description)
        } else {
          // No category prefix, put in improved
          categorized.improved.push(text)
        }
      })

      return { version, categorized }
    })
    .filter(Boolean)

  // Build CHANGELOG.md content
  let changelog = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

`

  entries.forEach(({ version, categorized }) => {
    changelog += `\n## [${version}]\n\n`

    if (categorized.added.length) {
      changelog += `### Added\n\n`
      categorized.added.forEach(item => changelog += `- ${item}\n`)
      changelog += '\n'
    }

    if (categorized.improved.length) {
      changelog += `### Changed\n\n`
      categorized.improved.forEach(item => changelog += `- ${item}\n`)
      changelog += '\n'
    }

    if (categorized.fixed.length) {
      changelog += `### Fixed\n\n`
      categorized.fixed.forEach(item => changelog += `- ${item}\n`)
      changelog += '\n'
    }

    if (categorized.removed.length) {
      changelog += `### Removed\n\n`
      categorized.removed.forEach(item => changelog += `- ${item}\n`)
      changelog += '\n'
    }

    if (categorized.deprecated.length) {
      changelog += `### Deprecated\n\n`
      categorized.deprecated.forEach(item => changelog += `- ${item}\n`)
      changelog += '\n'
    }

    if (categorized.security.length) {
      changelog += `### Security\n\n`
      categorized.security.forEach(item => changelog += `- ${item}\n`)
      changelog += '\n'
    }
  })

  writeFileSync(changelogPath, changelog.trim() + '\n')
  console.log(`✅ Synced changelog from readme.txt to CHANGELOG.md`)
  console.log(`   ${entries.length} versions processed`)
} catch (error) {
  console.error('Error syncing changelog:', error.message)
  process.exit(1)
}
