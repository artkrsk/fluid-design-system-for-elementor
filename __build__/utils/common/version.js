import fs from 'fs-extra'
import path from 'path'

/**
 * Get the project version from package.json
 * @param {Object} [config] - Project configuration
 * @returns {Promise<string>} The project version
 */
export async function getPackageVersion(config) {
  try {
    // Use project root from config if available, otherwise use current working directory
    const projectRoot = config?._absoluteProjectRoot || process.cwd()
    const packageData = await fs.readJson(path.join(projectRoot, 'package.json'))
    return packageData.version || '0.0.0'
  } catch (error) {
    console.error('Error reading package.json:', error)
    return '0.0.0'
  }
}

/**
 * Get the project version from composer.json
 * @param {Object} [config] - Project configuration
 * @returns {Promise<string>} The project version
 */
export async function getComposerVersion(config) {
  try {
    // Use project root from config if available, otherwise use current working directory
    const projectRoot = config?._absoluteProjectRoot || process.cwd()
    const composerData = await fs.readJson(path.join(projectRoot, 'composer.json'))
    return composerData.version || '0.0.0'
  } catch (error) {
    console.error('Error reading composer.json:', error)
    return '0.0.0'
  }
}

/**
 * Get the project version from the preferred source
 * @param {string} [preferred='composer'] - Preferred source ('composer' or 'package')
 * @param {Object} [config] - Project configuration
 * @returns {Promise<string>} The project version
 */
export async function getProjectVersion(preferred = 'composer', config) {
  return preferred === 'composer'
    ? await getComposerVersion(config).catch(() => getPackageVersion(config))
    : await getPackageVersion(config).catch(() => getComposerVersion(config))
}

/**
 * Get package metadata including version for banners
 * @param {Object} config - Project configuration
 * @returns {Promise<Object>} Package metadata
 */
export async function getPackageMetadata(config) {
  const version = await getProjectVersion('composer', config)
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
