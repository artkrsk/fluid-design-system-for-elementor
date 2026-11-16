import { FORMULA } from '../constants'
import type { TParsedClamp } from '../types'

/** Generates clamp() formula for fluid values (same string as PHP CSSVariables::get_clamp_formula()) */
export function generateClampFormula(
  minSize: number | string,
  minUnit: string,
  maxSize: number | string,
  maxUnit: string
): string {
  const minValue = `${minSize}${minUnit}`
  const maxValue = `${maxSize}${maxUnit}`

  // Unitless screen widths (set globally in :root)
  const minScreen = `var(${FORMULA.VAR_MIN_SCREEN_VALUE})`
  const screenDiff = `var(${FORMULA.VAR_SCREEN_DIFF})`

  const typed = `var(${FORMULA.VAR_TYPED}, 0)`
  const vw = `var(${FORMULA.VAR_VW}, 0)`
  const px = `var(${FORMULA.VAR_PX}, 1)`

  // Legacy term: unitless diff × px progress (engines without typed arithmetic, right for px only).
  // Typed term: unit-carrying diff × unitless progress. The switch vars pick one; see CSSVariables.php.
  const legacyTerm = `((${maxSize} - ${minSize}) * ((100vw - ${minScreen} * 1px) / ${screenDiff}) * (1 - ${typed}))`
  const typedTerm = `((${maxValue} - ${minValue}) * ((${vw} - ${minScreen} * ${px}) / (${screenDiff} * ${px})) * ${typed})`

  const preferredValue = `calc((${minValue}) + ${legacyTerm} + ${typedTerm})`

  // Use CSS min()/max() to handle both normal and inverted cases
  const lowerBound = `min(${minValue}, ${maxValue})`
  const upperBound = `max(${minValue}, ${maxValue})`

  return `clamp(${lowerBound}, ${preferredValue}, ${upperBound})`
}

/** Checks if value is inline clamp (not preset reference) */
export function isInlineClampValue(value: string): boolean {
  return typeof value === 'string' && value.startsWith('clamp(')
}

/** Parses clamp formula to extract min/max values */
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
  const firstValue = match[1]!.trim()
  const secondValue = match[2]!.trim()

  // Parse value and unit from strings like "20px" or "1.5rem"
  const parseValueUnit = (str: string): { size: string; unit: string } | null => {
    const valueMatch = str.match(/^(-?[\d.]+)(.+)$/)
    if (valueMatch) {
      return { size: valueMatch[1]!, unit: valueMatch[2]! }
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
    const calcBase = calcMatch[1]!.trim()
    if (calcBase === firstValue) {
      return {
        minSize: first.size,
        minUnit: first.unit,
        maxSize: second.size,
        maxUnit: second.unit
      }
    } else {
      return {
        minSize: second.size,
        minUnit: second.unit,
        maxSize: first.size,
        maxUnit: first.unit
      }
    }
  }

  // Fallback: assume first is min, second is max
  return {
    minSize: first.size,
    minUnit: first.unit,
    maxSize: second.size,
    maxUnit: second.unit
  }
}
