import { createElement } from './dom'
import { parseClampFormula } from './clamp'
import { ValueFormatter } from './formatters'
import { getInheritedPresetSync, isFluidPreset } from './presetLookup'
import { CUSTOM_FLUID_VALUE } from '../constants'
import type { IFluidPreset, ICustomPreset, IInheritanceData } from '../interfaces'

/** Sets multiple attributes on an element */
function setElementAttributes(
  element: HTMLElement,
  attributes: Record<string, string | boolean | undefined | null>
): void {
  Object.entries(attributes).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      element.setAttribute(key, String(value))
    }
  })
}

/** Creates base option element with value and selected state */
function createBaseOption(
  value: string,
  currentValue: string,
  attributes: Record<string, string | boolean | undefined> = {}
): HTMLOptionElement {
  const optionEl = createElement('option') as HTMLOptionElement
  optionEl.value = value
  if (currentValue === value) {
    optionEl.setAttribute('selected', 'selected')
  }
  setElementAttributes(optionEl, attributes)
  return optionEl
}

/** Creates option element for fluid preset */
export function createPresetOption(preset: IFluidPreset, currentValue: string): HTMLOptionElement {
  const {
    id,
    value,
    title,
    min_size,
    min_unit,
    max_size,
    max_unit,
    min_screen_width_size,
    max_screen_width_size,
    min_screen_width_unit,
    max_screen_width_unit,
    editable = false
  } = preset

  const optionEl = createBaseOption(value, currentValue, {
    'data-id': id,
    'data-title': title,
    'data-min-size': min_size,
    'data-min-unit': min_unit,
    'data-max-size': max_size,
    'data-max-unit': max_unit,
    'data-min-screen-width-size': min_screen_width_size,
    'data-max-screen-width-size': max_screen_width_size,
    'data-min-screen-width-unit': min_screen_width_unit,
    'data-max-screen-width-unit': max_screen_width_unit,
    'data-editable': editable ? 'true' : 'false'
  })

  optionEl.textContent = `${ValueFormatter.formatSizeRange(min_size, min_unit, max_size, max_unit)} ${title}`
  return optionEl
}

/** Creates option element for custom preset */
export function createCustomPresetOption(preset: ICustomPreset, currentValue: string): HTMLOptionElement {
  const { id, value, title, display_value } = preset

  const optionEl = createBaseOption(value, currentValue, {
    'data-id': id,
    'data-title': title
  })

  if (display_value === true) {
    optionEl.setAttribute('data-display-value', value)
    optionEl.textContent = `${value} ${title}`
  } else if (typeof display_value === 'string') {
    optionEl.setAttribute('data-display-value', display_value)
    optionEl.textContent = `${display_value} ${title}`
  } else {
    optionEl.textContent = title
  }

  return optionEl
}

/** Handles mixed units inheritance display */
function handleMixedUnitsInheritance(
  optionEl: HTMLOptionElement,
  inheritanceData: IInheritanceData & { name?: string }
): void {
  const { inheritedSize, sourceUnit, inheritedFrom, inheritedVia, inheritedDevice, name } = inheritanceData

  optionEl.setAttribute('data-mixed-units', 'true')
  optionEl.setAttribute('data-inherited-title', name ?? '')

  if (inheritedFrom) { optionEl.setAttribute('data-inherited-from', inheritedFrom) }
  if (inheritedVia) { optionEl.setAttribute('data-inherited-via', inheritedVia) }
  if (inheritedDevice) { optionEl.setAttribute('data-inherited-device', inheritedDevice) }

  const displayValue =
    sourceUnit === 'custom' ? inheritedSize : inheritedSize ? `${inheritedSize}${sourceUnit}` : ''
  if (sourceUnit === 'custom') { optionEl.setAttribute('data-custom-value', 'true') }

  optionEl.setAttribute('data-title', displayValue ?? '')
  if (displayValue) {
    optionEl.setAttribute('data-value-display', displayValue)
  }
  optionEl.setAttribute('data-inherited-value', 'true')
  optionEl.textContent = displayValue ?? ''
}

/** Handles complex preset inheritance display */
function handleComplexPresetInheritance(optionEl: HTMLOptionElement, preset: IFluidPreset): HTMLOptionElement {
  const {
    value,
    min_size,
    min_unit,
    max_size,
    max_unit,
    min_screen_width_size,
    max_screen_width_size,
    min_screen_width_unit,
    max_screen_width_unit,
    title
  } = preset

  optionEl.setAttribute('data-inherited-preset', 'true')
  optionEl.setAttribute('data-value-display', value)
  setElementAttributes(optionEl, {
    'data-min-size': min_size,
    'data-min-unit': min_unit,
    'data-max-size': max_size,
    'data-max-unit': max_unit,
    'data-min-screen-width-size': min_screen_width_size,
    'data-min-screen-width-unit': min_screen_width_unit,
    'data-max-screen-width-size': max_screen_width_size,
    'data-max-screen-width-unit': max_screen_width_unit
  })

  optionEl.textContent = `${ValueFormatter.formatSizeRange(min_size, min_unit, max_size, max_unit)} ${title}`
  return optionEl
}

/** Handles fluid unit inheritance display */
function handleFluidInheritance(
  optionEl: HTMLOptionElement,
  inheritanceData: IInheritanceData & { name?: string }
): void {
  const { inheritedSize, inheritedFrom, inheritedVia, inheritedDevice, name } = inheritanceData
  const inheritedPreset = getInheritedPresetSync(inheritedSize)

  optionEl.setAttribute('data-inherited-title', name ?? '')
  if (inheritedFrom) { optionEl.setAttribute('data-inherited-from', inheritedFrom) }
  if (inheritedVia) { optionEl.setAttribute('data-inherited-via', inheritedVia) }
  if (inheritedDevice) { optionEl.setAttribute('data-inherited-device', inheritedDevice) }

  if (inheritedPreset) {
    if (inheritedPreset.isComplex) {
      handleComplexPresetInheritance(optionEl, inheritedPreset)
    } else {
      optionEl.setAttribute('data-inherited-value', 'true')
      optionEl.setAttribute('data-value-display', inheritedSize ?? '')
      optionEl.textContent = inheritedPreset.name
    }
  } else if (inheritedSize && inheritedSize !== CUSTOM_FLUID_VALUE) {
    const parsed = parseClampFormula(inheritedSize)
    if (parsed) {
      optionEl.setAttribute('data-inherited-value', 'true')
      setElementAttributes(optionEl, {
        'data-min-size': parsed.minSize,
        'data-min-unit': parsed.minUnit,
        'data-max-size': parsed.maxSize,
        'data-max-unit': parsed.maxUnit
      })

      const displayValue = ValueFormatter.formatSizeRange(
        parsed.minSize,
        parsed.minUnit,
        parsed.maxSize,
        parsed.maxUnit
      )
      optionEl.setAttribute('data-title', displayValue)
      optionEl.setAttribute('data-value-display', displayValue)
      optionEl.textContent = displayValue
    } else {
      optionEl.setAttribute('data-inherited-value', 'true')
      const displayValue = inheritedSize || name || ''
      optionEl.setAttribute('data-title', displayValue)
      optionEl.setAttribute('data-value-display', displayValue)
      optionEl.textContent = displayValue
    }
  }
}

/** Handles standard unit inheritance display */
function handleStandardInheritance(
  optionEl: HTMLOptionElement,
  data: { inheritedSize: string | null; sourceUnit: string | null; name: string }
): HTMLOptionElement {
  const { inheritedSize, sourceUnit, name } = data
  const valueText =
    inheritedSize !== null && sourceUnit !== null ? `${inheritedSize}${sourceUnit}` : name

  setElementAttributes(optionEl, {
    'data-inherited-value': 'true',
    'data-title': valueText,
    'data-value-display': valueText
  })
  optionEl.textContent = valueText
  return optionEl
}

/** Handles inherit option with all inheritance types */
export function handleInheritOption(
  optionEl: HTMLOptionElement,
  currentValue: string,
  inheritanceData: IInheritanceData,
  name: string
): HTMLOptionElement {
  const { inheritedSize, inheritedUnit, sourceUnit } = inheritanceData

  if (currentValue === '') {
    optionEl.classList.add('e-select-placeholder')
  }

  optionEl.classList.add('option-inherit')

  if (inheritedSize !== null) {
    const hasMixedUnits = sourceUnit && sourceUnit !== 'fluid'

    if (hasMixedUnits) {
      handleMixedUnitsInheritance(optionEl, { ...inheritanceData, name })
    } else if (inheritedUnit === 'fluid' && inheritedSize !== null) {
      handleFluidInheritance(optionEl, { ...inheritanceData, name })
    } else {
      handleStandardInheritance(optionEl, { inheritedSize, sourceUnit, name })
    }
  } else {
    optionEl.textContent = name
  }

  return optionEl
}

/** Creates simple option (inherit or named value) */
export function createSimpleOption(
  value: string,
  name: string,
  currentValue: string,
  inheritanceData: IInheritanceData
): HTMLOptionElement {
  const optionEl = createBaseOption(value, currentValue)

  if (value === '') {
    handleInheritOption(optionEl, currentValue, inheritanceData, name)
  } else {
    optionEl.textContent = name
  }

  return optionEl
}

/** Creates the "Custom value..." option for inline fluid values */
export function createCustomValueOption(currentValue: string): HTMLOptionElement {
  const isCustomSelected =
    currentValue === CUSTOM_FLUID_VALUE || (currentValue && currentValue.startsWith('clamp('))

  const optionEl = createElement('option', null, {
    value: CUSTOM_FLUID_VALUE,
    'data-is-custom-fluid': 'true'
  }) as HTMLOptionElement

  if (isCustomSelected) {
    optionEl.setAttribute('selected', 'selected')
  }

  optionEl.textContent = window.ArtsFluidDSStrings?.customValue ?? ''
  return optionEl
}
