import { STYLES } from '../constants'
import {
  parseRulesFromText,
  formatRulesForStylesheet,
  filterRulesByVariable,
  createVariableRule,
  createUnsetRule
} from '../utils/cssRules'

export class CSSManager {
  private styleElement: HTMLElement | null = null
  private styleElementId: string = STYLES.STYLE_ID

  /** Create or get the style element in the Elementor preview frame */
  createOrGetStyleElement(): HTMLElement | null {
    try {
      const iframe = window.elementor?.$preview?.[0] as HTMLIFrameElement | undefined
      if (!iframe?.contentDocument) {
        return null
      }

      if (this.styleElement) {
        return this.styleElement
      }

      const previewDocument = iframe.contentDocument
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

  /** Get current CSS rules from the style element */
  getCurrentRules(): string[] {
    const styleEl = this.createOrGetStyleElement()
    if (!styleEl) { return [] }

    return parseRulesFromText(styleEl.textContent ?? '')
  }

  /** Set CSS rules in the style element */
  setRules(rules: string[]): void {
    const styleEl = this.createOrGetStyleElement()
    if (!styleEl) { return }

    styleEl.textContent = formatRulesForStylesheet(rules)
  }

  /** Unset a CSS variable by adding a rule to the style element */
  unsetCssVariable(id: string): boolean {
    const styleEl = this.createOrGetStyleElement()
    if (!styleEl) { return false }

    const cssVarName = `${STYLES.VAR_PREFIX}${id}`
    const currentRules = this.getCurrentRules()
    currentRules.push(createUnsetRule(cssVarName))
    this.setRules(currentRules)

    return true
  }

  /** Restore a CSS variable by removing unset rules */
  restoreCssVariable(id: string): boolean {
    const styleEl = this.createOrGetStyleElement()
    if (!styleEl) { return false }

    const cssVarName = `${STYLES.VAR_PREFIX}${id}`
    const filteredRules = filterRulesByVariable(this.getCurrentRules(), cssVarName)
    this.setRules(filteredRules)

    return true
  }

  /** Set a CSS variable with clamp formula in preview */
  setCssVariable(id: string, clampFormula: string): boolean {
    const styleEl = this.createOrGetStyleElement()
    if (!styleEl) { return false }

    const cssVarName = `${STYLES.VAR_PREFIX}${id}`

    // Remove any existing rules for this variable and add the new one
    const filteredRules = filterRulesByVariable(this.getCurrentRules(), cssVarName)
    filteredRules.push(createVariableRule(cssVarName, clampFormula))
    this.setRules(filteredRules)

    return true
  }
}

// Create a singleton instance
const cssManager = new CSSManager()

// Export the instance
export default cssManager
