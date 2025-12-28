import { STYLES } from '../constants'

export class CSSManager {
  constructor() {
    this.styleElement = null
    this.styleElementId = STYLES.STYLE_ID
  }

  /**
   * Create or get the style element in the Elementor preview frame
   * @returns {HTMLElement|null} Style element or null if unavailable
   */
  createOrGetStyleElement() {
    try {
      if (!window.elementor?.$preview?.[0]?.contentDocument) {
        return null
      }

      if (this.styleElement) {
        return this.styleElement
      }

      const previewDocument = window.elementor.$preview[0].contentDocument
      let styleEl = previewDocument.getElementById(this.styleElementId)

      if (styleEl instanceof HTMLElement) {
        this.styleElement = styleEl
        return this.styleElement
      }

      styleEl = previewDocument.createElement('style')
      styleEl.id = this.styleElementId
      previewDocument.head.appendChild(styleEl)
      this.styleElement = styleEl
      return this.styleElement
    } catch {
      return null
    }
  }

  /**
   * Get current CSS rules from the style element
   * @returns {string[]} Array of CSS rules
   */
  getCurrentRules() {
    const styleEl = this.createOrGetStyleElement()
    if (!styleEl) return []

    return styleEl.textContent
      .split('}')
      .map((rule) => rule.trim())
      .filter((rule) => rule.length > 0)
  }

  /**
   * Set CSS rules in the style element
   * @param {string[]} rules - Array of CSS rules to set
   */
  setRules(rules) {
    const styleEl = this.createOrGetStyleElement()
    if (!styleEl) return

    styleEl.textContent = rules.map((rule) => (rule.endsWith('}') ? rule : `${rule}}`)).join('')
  }

  /**
   * Unset a CSS variable by adding a rule to the style element
   * @param {string} id - The ID to build the CSS variable name
   * @returns {boolean} Success status
   */
  unsetCssVariable(id) {
    const styleEl = this.createOrGetStyleElement()
    if (!styleEl) return false

    const cssVarName = `${STYLES.VAR_PREFIX}${id}`
    const unsetRule = `:root { ${cssVarName}: unset !important; }`

    const currentRules = this.getCurrentRules()
    currentRules.push(unsetRule)
    this.setRules(currentRules)

    return true
  }

  /**
   * Restore a CSS variable by removing unset rules
   * @param {string} id - The ID to restore CSS variable for
   * @returns {boolean} Success status
   */
  restoreCssVariable(id) {
    const styleEl = this.createOrGetStyleElement()
    if (!styleEl) return false

    const cssVarName = `${STYLES.VAR_PREFIX}${id}`
    const currentRules = this.getCurrentRules()
    const filteredRules = currentRules.filter((rule) => !rule.includes(cssVarName))
    this.setRules(filteredRules)

    return true
  }

  /**
   * Set a CSS variable with clamp formula in preview
   * @param {string} id - The preset ID
   * @param {string} clampFormula - The clamp CSS formula
   * @returns {boolean} Success status
   */
  setCssVariable(id, clampFormula) {
    const styleEl = this.createOrGetStyleElement()
    if (!styleEl) return false

    const cssVarName = `${STYLES.VAR_PREFIX}${id}`
    const cssRule = `:root { ${cssVarName}: ${clampFormula}; }`

    const currentRules = this.getCurrentRules()

    // Remove any existing rules for this variable
    const filteredRules = currentRules.filter((rule) => !rule.includes(cssVarName))

    // Add the new rule
    filteredRules.push(cssRule)
    this.setRules(filteredRules)

    return true
  }
}

// Create a singleton instance
const cssManager = new CSSManager()

// Export the instance
export default cssManager
