/**
 * Patches CSSStyleSheet.prototype.insertRule in the preview iframe
 * to strip the leaked "fluid" unit from styled-components CSS.
 * Same regex logic as PHP optimize_fluid_css_post_parse().
 */

const FLUID_UNIT_PATTERN = /(\))\s*fluid(?=[\s;}\]]|$)/g

/** Strips leaked "fluid" unit suffix from CSS rule text */
export function sanitizeFluidCSS(css: string): string {
  if (!css.includes('fluid')) {
    return css
  }

  return css.replace(FLUID_UNIT_PATTERN, '$1')
}

/** Preview iframe window with our one-time patch flag */
interface PatchableWindow extends Window {
  __fluidCSSPatched?: boolean
  CSSStyleSheet: typeof CSSStyleSheet
}

/** Applies insertRule override to the preview iframe */
export function applyStyleguideCompat(): void {
  const iframe = window.elementor?.$preview?.[0] as HTMLIFrameElement | undefined
  const previewWindow = iframe?.contentWindow as PatchableWindow | null | undefined

  if (!previewWindow || previewWindow.__fluidCSSPatched) {
    return
  }

  const proto = previewWindow.CSSStyleSheet.prototype
  const OriginalInsertRule = proto.insertRule

  proto.insertRule = function (rule: string, index?: number): number {
    return OriginalInsertRule.call(this, sanitizeFluidCSS(rule), index)
  }
  previewWindow.__fluidCSSPatched = true
}
