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

  /** Gets/creates preview frame style element */
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

  /** Gets current CSS rules */
  getCurrentRules(): string[] {
    const styleEl = this.createOrGetStyleElement()
    if (!styleEl) { return [] }

    return parseRulesFromText(styleEl.textContent ?? '')
  }

  /** Sets CSS rules */
  setRules(rules: string[]): void {
    const styleEl = this.createOrGetStyleElement()
    if (!styleEl) { return }

    styleEl.textContent = formatRulesForStylesheet(rules)
  }

  /** Unsets CSS variable by adding unset rule */
  unsetCssVariable(id: string): boolean {
    const styleEl = this.createOrGetStyleElement()
    if (!styleEl) { return false }

    const cssVarName = `${STYLES.VAR_PREFIX}${id}`
    const currentRules = this.getCurrentRules()
    currentRules.push(createUnsetRule(cssVarName))
    this.setRules(currentRules)

    return true
  }

  /** Restores CSS variable by removing unset rules */
  restoreCssVariable(id: string): boolean {
    const styleEl = this.createOrGetStyleElement()
    if (!styleEl) { return false }

    const cssVarName = `${STYLES.VAR_PREFIX}${id}`
    const filteredRules = filterRulesByVariable(this.getCurrentRules(), cssVarName)
    this.setRules(filteredRules)

    return true
  }

  /** Sets CSS variable with clamp formula */
  setCssVariable(id: string, clampFormula: string): boolean {
    const styleEl = this.createOrGetStyleElement()
    if (!styleEl) { return false }

    const cssVarName = `${STYLES.VAR_PREFIX}${id}`
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
