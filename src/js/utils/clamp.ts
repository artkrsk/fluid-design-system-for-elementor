import type { TParsedClamp } from '../types'

/** CSS variable names (must match PHP CSSVariables.php) */
const CSS_VAR_MIN_SCREEN = '--arts-fluid-min-screen'
const CSS_VAR_SCREEN_DIFF = '--arts-fluid-screen-diff'

/** Generates a CSS clamp() formula for inline fluid values */
export function generateClampFormula(
  minSize: number | string,
  minUnit: string,
  maxSize: number | string,
  maxUnit: string
): string {
  const minValue = `${minSize}${minUnit}`
  const maxValue = `${maxSize}${maxUnit}`

  // Calculate the difference between max and min values
  const valueDiff = `(${maxSize} - ${minSize})`

  // Use CSS variables for screen widths (set globally in :root)
  const minScreen = `var(${CSS_VAR_MIN_SCREEN})`
  const screenDiff = `var(${CSS_VAR_SCREEN_DIFF})`

  // Viewport-relative calculation
  const viewportCalc = `(100vw - ${minScreen})`

  // Scaling factor: (max - min) * ((100vw - minScreen) / screenDiff)
  const scalingFactor = `(${valueDiff} * (${viewportCalc} / ${screenDiff}))`

  // Preferred value: min + scaling
  const preferredValue = `calc((${minValue}) + (${scalingFactor}))`

  // Use CSS min()/max() to handle both normal and inverted cases
  const lowerBound = `min(${minValue}, ${maxValue})`
  const upperBound = `max(${minValue}, ${maxValue})`

  return `clamp(${lowerBound}, ${preferredValue}, ${upperBound})`
}

/** Checks if a value is a custom inline clamp formula (not a preset reference) */
export function isInlineClampValue(value: string): boolean {
  return typeof value === 'string' && value.startsWith('clamp(')
}

/** Parses an inline clamp formula to extract min/max values */
export function parseClampFormula(clampFormula: string): TParsedClamp | null {
  if (!isInlineClampValue(clampFormula)) {
    return null
  }

  // Extract values from clamp(min(...), calc(...), max(...))
  // Pattern: min(VALUEunit, VALUEunit) or max(VALUEunit, VALUEunit)
  const minMaxPattern = /min\(([^,]+),\s*([^)]+)\)/
  const match = clampFormula.match(minMaxPattern)

  if (!match) {
    return null
  }

  // Parse first value (could be min or max depending on values)
  const firstValue = match[1].trim()
  const secondValue = match[2].trim()

  // Parse value and unit from strings like "20px" or "1.5rem"
  const parseValueUnit = (str: string): { size: string; unit: string } | null => {
    const valueMatch = str.match(/^(-?[\d.]+)(.+)$/)
    if (valueMatch) {
      return { size: valueMatch[1], unit: valueMatch[2] }
    }
    return null
  }

  const first = parseValueUnit(firstValue)
  const second = parseValueUnit(secondValue)

  if (!first || !second) {
    return null
  }

  // Determine which is min and which is max based on calc expression
  // The calc uses minSize as the base, so first value in min() that matches calc base is minSize
  const calcPattern = /calc\(\(([^)]+)\)/
  const calcMatch = clampFormula.match(calcPattern)

  if (calcMatch) {
    const calcBase = calcMatch[1].trim()
    if (calcBase === firstValue) {
      return { minSize: first.size, minUnit: first.unit, maxSize: second.size, maxUnit: second.unit }
    } else {
      return { minSize: second.size, minUnit: second.unit, maxSize: first.size, maxUnit: first.unit }
    }
  }

  // Fallback: assume first is min, second is max
  return { minSize: first.size, minUnit: first.unit, maxSize: second.size, maxUnit: second.unit }
}
