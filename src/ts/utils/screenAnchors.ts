import { PREVIEW } from '../constants'

/** Reads a unitless numeric CSS custom property from an element's computed style */
function readNumericVar(el: Element | null, name: string): number | null {
  if (!el) {
    return null
  }

  const raw = getComputedStyle(el).getPropertyValue(name).trim()
  const parsed = parseFloat(raw)

  return Number.isFinite(parsed) ? parsed : null
}

/**
 * Resolves the min/max screen anchor widths (px) used to preview a fluid value.
 * Per-preset overrides on the selected option take precedence over the global anchors.
 */
export function resolveAnchorWidths(
  selectEl: HTMLSelectElement | null,
  previewDoc: Document | null
): { min: number; max: number } {
  const root = previewDoc?.documentElement ?? null

  let min = readNumericVar(root, PREVIEW.VAR_MIN_SCREEN_VALUE) ?? PREVIEW.DEFAULT_MIN_WIDTH
  let max = readNumericVar(root, PREVIEW.VAR_MAX_SCREEN_VALUE) ?? PREVIEW.DEFAULT_MAX_WIDTH

  const option = selectEl?.selectedOptions?.[0] ?? null
  if (option) {
    const overrideMin = parseFloat(option.getAttribute('data-min-screen-width-size') ?? '')
    const overrideMax = parseFloat(option.getAttribute('data-max-screen-width-size') ?? '')

    if (Number.isFinite(overrideMin)) {
      min = overrideMin
    }
    if (Number.isFinite(overrideMax)) {
      max = overrideMax
    }
  }

  return { min, max }
}
