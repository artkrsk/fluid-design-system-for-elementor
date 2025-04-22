import fs from 'fs-extra'
import path from 'path'

/**
 * Get the project version from package.json
 * @returns {Promise<string>} The project version
 */
export async function getPackageVersion() {
  try {
    const packageData = await fs.readJson(path.join(process.cwd(), 'package.json'))
    return packageData.version || '0.0.0'
  } catch (error) {
    console.error('Error reading package.json:', error)
    return '0.0.0'
  }
}

/**
 * Get the project version from composer.json
 * @returns {Promise<string>} The project version
 */
export async function getComposerVersion() {
  try {
    const composerData = await fs.readJson(path.join(process.cwd(), 'composer.json'))
    return composerData.version || '0.0.0'
  } catch (error) {
    console.error('Error reading composer.json:', error)
    return '0.0.0'
  }
}

/**
 * Get the project version from the preferred source
 * @param {string} [preferred='composer'] - Preferred source ('composer' or 'package')
 * @returns {Promise<string>} The project version
 */
export async function getProjectVersion(preferred = 'composer') {
  return preferred === 'composer'
    ? await getComposerVersion().catch(() => getPackageVersion())
    : await getPackageVersion().catch(() => getComposerVersion())
}

/**
 * Get package metadata including version for banners
 * @param {Object} config - Project configuration
 * @returns {Promise<Object>} Package metadata
 */
export async function getPackageMetadata(config) {
  const version = await getProjectVersion()
  return {
    name: config.name,
    version,
    license: config.license,
    author: config.author,
    homepage: config.homepage,
    repository: config.repository
  }
}

export default {
  getPackageVersion,
  getComposerVersion,
  getProjectVersion,
  getPackageMetadata
}
