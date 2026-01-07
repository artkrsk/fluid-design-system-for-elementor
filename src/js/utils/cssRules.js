/**
 * CSS Rule Utilities
 * Pure functions for parsing and formatting CSS rules.
 * Extracted for testability with Vitest.
 */

/**
 * Parses CSS text into an array of rule strings
 * @param {string} cssText - Raw CSS text from style element
 * @returns {string[]} Array of trimmed CSS rules (without closing braces)
 */
export function parseRulesFromText(cssText) {
  return cssText
    .split('}')
    .map((rule) => rule.trim())
    .filter((rule) => rule.length > 0)
}

/**
 * Formats CSS rules for stylesheet insertion
 * @param {string[]} rules - Array of CSS rules
 * @returns {string} Formatted CSS text with closing braces
 */
export function formatRulesForStylesheet(rules) {
  return rules.map((rule) => (rule.endsWith('}') ? rule : `${rule}}`)).join('')
}

/**
 * Filters rules that contain a specific CSS variable
 * @param {string[]} rules - Array of CSS rules
 * @param {string} cssVarName - CSS variable name to filter by
 * @returns {string[]} Rules that do not contain the variable
 */
export function filterRulesByVariable(rules, cssVarName) {
  return rules.filter((rule) => !rule.includes(cssVarName))
}

/**
 * Creates a CSS rule string for setting a CSS variable
 * @param {string} cssVarName - CSS variable name
 * @param {string} value - Value to set
 * @returns {string} CSS rule string
 */
export function createVariableRule(cssVarName, value) {
  return `:root { ${cssVarName}: ${value}; }`
}

/**
 * Creates a CSS rule string for unsetting a CSS variable
 * @param {string} cssVarName - CSS variable name
 * @returns {string} CSS rule string with unset !important
 */
export function createUnsetRule(cssVarName) {
  return `:root { ${cssVarName}: unset !important; }`
}
