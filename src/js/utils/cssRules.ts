/**
 * CSS Rule Utilities
 * Pure functions for parsing and formatting CSS rules.
 * Extracted for testability with Vitest.
 */

/** Parses CSS text into an array of rule strings */
export function parseRulesFromText(cssText: string): string[] {
  return cssText
    .split('}')
    .map((rule) => rule.trim())
    .filter((rule) => rule.length > 0)
}

/** Formats CSS rules for stylesheet insertion */
export function formatRulesForStylesheet(rules: string[]): string {
  return rules.map((rule) => (rule.endsWith('}') ? rule : `${rule}}`)).join('')
}

/** Filters rules that contain a specific CSS variable */
export function filterRulesByVariable(rules: string[], cssVarName: string): string[] {
  return rules.filter((rule) => !rule.includes(cssVarName))
}

/** Creates a CSS rule string for setting a CSS variable */
export function createVariableRule(cssVarName: string, value: string): string {
  return `:root { ${cssVarName}: ${value}; }`
}

/** Creates a CSS rule string for unsetting a CSS variable */
export function createUnsetRule(cssVarName: string): string {
  return `:root { ${cssVarName}: unset !important; }`
}
