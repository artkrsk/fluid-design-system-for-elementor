/**
 * Generates dynamic UMD banner for builds based on project externals
 * @param {string} globalName - The global variable name for the library
 * @param {Object} externals - Map of external package names to global variable names
 * @returns {string} The UMD wrapper opening code
 */
export function generateUmdBanner(globalName, externals = {}) {
  // Get external package names as an array
  const externalPackages = Object.keys(externals)

  // If no externals, generate a simpler UMD wrapper
  if (externalPackages.length === 0) {
    return (
      '(function(root, factory) {' +
      "if (typeof define === 'function' && define.amd) {" +
      'define([], factory);' +
      "} else if (typeof module === 'object' && module.exports) {" +
      'module.exports = factory();' +
      '} else {' +
      'root.' +
      globalName +
      ' = factory();' +
      '}' +
      "}(typeof self !== 'undefined' ? self : this, function() {"
    )
  }

  // Generate parts for the UMD pattern
  const commonJsRequires = externalPackages.map((pkg) => `require('${pkg}')`).join(', ')
  const amdDeps = JSON.stringify(externalPackages)
  const globalAccess = externalPackages.map((pkg) => `root.${externals[pkg]}`).join(', ')
  const factoryParams = Object.values(externals).join(', ')

  return (
    '(function(root, factory) {' +
    "if (typeof define === 'function' && define.amd) {" +
    'define(' +
    amdDeps +
    ', factory);' +
    "} else if (typeof module === 'object' && module.exports) {" +
    'module.exports = factory(' +
    commonJsRequires +
    ');' +
    '} else {' +
    'root.' +
    globalName +
    ' = factory(' +
    globalAccess +
    ');' +
    '}' +
    "}(typeof self !== 'undefined' ? self : this, function(" +
    factoryParams +
    ') {'
  )
}

/**
 * Generate UMD footer (closing part)
 * @param {string} globalName - The global variable name for the library
 * @returns {string} The UMD wrapper closing code
 */
export function generateUmdFooter(globalName) {
  return 'return ' + globalName + ';' + '}));'
}

/**
 * Generate a banner for compiled files
 * @param {Object} options - Banner options
 * @param {string} options.name - Project name
 * @param {string} options.version - Project version
 * @param {string} [options.author] - Project author
 * @param {string} [options.license] - Project license
 * @param {string} [options.homepage] - Project homepage
 * @param {string} [options.copyright] - Project copyright
 * @param {string} [options.repository] - Project repository
 * @returns {string} - Banner text
 */
export function generateBanner(options = {}) {
  const name = options.name || 'Unknown Project'
  const version = options.version || '0.0.0'
  const date = new Date().toISOString().split('T')[0]
  const author = options.author || ''
  const license = options.license || ''
  const homepage = options.homepage || ''
  const repository = options.repository || ''
  const year = new Date().getFullYear()

  let banner = `/*!
 * ${name} v${version}
`

  // Use current year only for copyright
  banner += ` * Copyright © ${year}\n`

  if (author) {
    banner += ` * Author: ${author}\n`
  }

  if (license) {
    banner += ` * License: ${license}\n`
  }

  if (homepage) {
    banner += ` * Website: ${homepage}\n`
  }

  if (repository) {
    banner += ` * Repository: ${repository}\n`
  }

  banner += ` * Generated on: ${date}\n`
  banner += ' */\n'

  return banner
}

/**
 * Generate a package banner with version information
 * @param {Object} packageInfo - Package information (name, version, etc.)
 * @returns {string} The banner text
 */
export function generatePackageBanner(packageInfo) {
  const { name, version, author, license, homepage, repository } = packageInfo
  const date = new Date().toISOString().split('T')[0]
  const year = new Date().getFullYear()
  const authorStr = typeof author === 'string' ? author : author?.name

  const lines = [`/*!`, ` * ${name} v${version}`]

  // Use current year only for copyright
  lines.push(` * Copyright © ${year}`)

  if (authorStr) {
    lines.push(` * Author: ${authorStr}`)
  }

  if (license) {
    lines.push(` * License: ${license}`)
  }

  if (homepage) {
    lines.push(` * Website: ${homepage}`)
  }

  if (repository) {
    lines.push(` * Repository: ${repository}`)
  }

  lines.push(` * Generated on: ${date}`)
  lines.push(` */`)

  return lines.join('\n')
}

/**
 * Generate a complete UMD wrapper for a specific module
 * @param {string} content - The module content to wrap
 * @param {string} globalName - The global variable name for the library
 * @param {Object} externals - Map of external package names to global variable names
 * @param {Object} packageInfo - Package information for the banner
 * @returns {string} The wrapped module content
 */
export function wrapAsUmd(content, globalName, externals = {}, packageInfo = null) {
  const banner = packageInfo ? generatePackageBanner(packageInfo) + '\n' : ''
  const umdBanner = generateUmdBanner(globalName, externals)
  const umdFooter = generateUmdFooter(globalName)

  // Remove any existing banner in the content to prevent duplication
  const bannerPattern = /\/\*[!*][\s\S]*?\*\/\s*/
  const cleanContent = content.replace(bannerPattern, '')

  return banner + umdBanner + cleanContent + umdFooter
}

export default {
  generateUmdBanner,
  generateUmdFooter,
  generateBanner,
  generatePackageBanner,
  wrapAsUmd
}
