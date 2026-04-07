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

/** Applies insertRule override to the preview iframe */
export function applyStyleguideCompat(): void {
  const iframe = window.elementor?.$preview?.[0] as HTMLIFrameElement | undefined
  const previewWindow = iframe?.contentWindow

  if (!previewWindow || (previewWindow as any).__fluidCSSPatched) {
    return
  }

  const proto = (previewWindow as any).CSSStyleSheet.prototype as CSSStyleSheet
  const OriginalInsertRule = proto.insertRule

  proto.insertRule = function (rule: string, index?: number): number {
    return OriginalInsertRule.call(this, sanitizeFluidCSS(rule), index)
  }
  ;(previewWindow as any).__fluidCSSPatched = true
}
