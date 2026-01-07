import { createElement } from './dom'
import { dataManager } from '../managers'
import { CUSTOM_FLUID_VALUE } from '../constants'
import { parseClampFormula } from './clamp'
import { ValueFormatter } from './formatters'
import type { IFluidPreset, ICustomPreset, IInheritanceData } from '../interfaces'
import type { TInheritedPresetResult } from '../types'

/** Type guard to check if preset is IFluidPreset */
function isFluidPreset(preset: IFluidPreset | ICustomPreset): preset is IFluidPreset {
  return 'min_size' in preset && 'max_size' in preset
}

class PresetUtils {
  static #setElementAttributes(
    element: HTMLElement,
    attributes: Record<string, string | boolean | undefined | null>
  ): void {
    Object.entries(attributes).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        element.setAttribute(key, String(value))
      }
    })
  }

  static #createBaseOption(
    value: string,
    currentValue: string,
    attributes: Record<string, string | boolean | undefined> = {}
  ): HTMLOptionElement {
    const optionEl = createElement('option') as HTMLOptionElement
    optionEl.value = value
    if (currentValue === value) {
      optionEl.setAttribute('selected', 'selected')
    }
    PresetUtils.#setElementAttributes(optionEl, attributes)
    return optionEl
  }

  static createPresetOption(preset: IFluidPreset, currentValue: string): HTMLOptionElement {
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

    const optionEl = PresetUtils.#createBaseOption(value, currentValue, {
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

  static createCustomPresetOption(preset: ICustomPreset, currentValue: string): HTMLOptionElement {
    const { id, value, title, display_value } = preset

    const optionEl = PresetUtils.#createBaseOption(value, currentValue, {
      'data-id': id,
      'data-title': title
    })

    // Handle display_value logic
    if (display_value === true) {
      // Show the actual value
      optionEl.setAttribute('data-display-value', value)
      optionEl.textContent = `${value} ${title}`
    } else if (typeof display_value === 'string') {
      // Show the custom display string
      optionEl.setAttribute('data-display-value', display_value)
      optionEl.textContent = `${display_value} ${title}`
    } else {
      // Fallback to current behavior (title only)
      optionEl.textContent = title
    }

    return optionEl
  }

  static handleMixedUnitsInheritance(
    optionEl: HTMLOptionElement,
    inheritanceData: IInheritanceData & { name?: string }
  ): void {
    const { inheritedSize, sourceUnit, inheritedFrom, inheritedVia, inheritedDevice, name } =
      inheritanceData

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

  static handleComplexPresetInheritance(optionEl: HTMLOptionElement, preset: IFluidPreset): HTMLOptionElement {
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
    PresetUtils.#setElementAttributes(optionEl, {
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

  static handleFluidInheritance(
    optionEl: HTMLOptionElement,
    inheritanceData: IInheritanceData & { name?: string }
  ): void {
    const { inheritedSize, inheritedFrom, inheritedVia, inheritedDevice, name } = inheritanceData
    const inheritedPreset = PresetUtils.getInheritedPresetSync(inheritedSize)

    optionEl.setAttribute('data-inherited-title', name ?? '')
    if (inheritedFrom) { optionEl.setAttribute('data-inherited-from', inheritedFrom) }
    if (inheritedVia) { optionEl.setAttribute('data-inherited-via', inheritedVia) }
    if (inheritedDevice) { optionEl.setAttribute('data-inherited-device', inheritedDevice) }

    if (inheritedPreset) {
      if (inheritedPreset.isComplex) {
        PresetUtils.handleComplexPresetInheritance(optionEl, inheritedPreset)
      } else {
        optionEl.setAttribute('data-inherited-value', 'true')
        optionEl.setAttribute('data-value-display', inheritedSize ?? '')
        optionEl.textContent = inheritedPreset.name
      }
    } else if (inheritedSize && inheritedSize !== CUSTOM_FLUID_VALUE) {
      // Check if it's an inline clamp formula
      const parsed = parseClampFormula(inheritedSize)
      if (parsed) {
        // Display inline clamp nicely formatted like presets
        optionEl.setAttribute('data-inherited-value', 'true')

        // Set min/max attributes for Select2 template rendering
        PresetUtils.#setElementAttributes(optionEl, {
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
        // Fallback to raw display for unknown formats
        optionEl.setAttribute('data-inherited-value', 'true')
        const displayValue = inheritedSize || name || ''
        optionEl.setAttribute('data-title', displayValue)
        optionEl.setAttribute('data-value-display', displayValue)
        optionEl.textContent = displayValue
      }
    }
    // Note: CUSTOM_FLUID_VALUE without actual clamp formula is skipped
    // to show simple inherit option instead of raw "__custom__" value
  }

  static handleStandardInheritance(
    optionEl: HTMLOptionElement,
    data: { inheritedSize: string | null; sourceUnit: string | null; name: string }
  ): HTMLOptionElement {
    const { inheritedSize, sourceUnit, name } = data
    const valueText =
      inheritedSize !== null && sourceUnit !== null ? `${inheritedSize}${sourceUnit}` : name

    PresetUtils.#setElementAttributes(optionEl, {
      'data-inherited-value': 'true',
      'data-title': valueText,
      'data-value-display': valueText
    })
    optionEl.textContent = valueText
    return optionEl
  }

  static handleInheritOption(
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
        PresetUtils.handleMixedUnitsInheritance(optionEl, { ...inheritanceData, name })
      } else if (inheritedUnit === 'fluid' && inheritedSize !== null) {
        PresetUtils.handleFluidInheritance(optionEl, { ...inheritanceData, name })
      } else {
        PresetUtils.handleStandardInheritance(optionEl, { inheritedSize, sourceUnit, name })
      }
    } else {
      optionEl.textContent = name
    }

    return optionEl
  }

  static createSimpleOption(
    value: string,
    name: string,
    currentValue: string,
    inheritanceData: IInheritanceData
  ): HTMLOptionElement {
    const optionEl = PresetUtils.#createBaseOption(value, currentValue)

    if (value === '') {
      PresetUtils.handleInheritOption(optionEl, currentValue, inheritanceData, name)
    } else {
      optionEl.textContent = name
    }

    return optionEl
  }

  /** Creates the "Custom value..." option for inline fluid values */
  static createCustomValueOption(currentValue: string): HTMLOptionElement {
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

  static async buildSelectOptions(selectEl: HTMLSelectElement, el?: HTMLElement): Promise<HTMLSelectElement> {
    const presetsData = await dataManager.getPresetsData(el)

    if (!presetsData) {
      return selectEl
    }

    selectEl.classList.remove('is-loading')
    const loadingOption = selectEl.querySelector('.elementor-loading-option')
    if (loadingOption) {
      loadingOption.remove()
    }

    const currentValue = selectEl.getAttribute('data-value') ?? ''
    const inheritanceData: IInheritanceData = {
      inheritedSize: selectEl.getAttribute('data-inherited-size'),
      inheritedUnit: selectEl.getAttribute('data-inherited-unit'),
      sourceUnit: selectEl.getAttribute('data-source-unit'),
      inheritedFrom: selectEl.getAttribute('data-inherited-from'),
      inheritedDevice: selectEl.getAttribute('data-inherited-device'),
      inheritedVia: selectEl.getAttribute('data-inherited-via')
    }

    let customOptionAdded = false

    for (const group of presetsData) {
      const { name, value, control_id } = group

      if (!name) {
        continue
      }

      if (typeof value === 'object' && Array.isArray(value)) {
        // Add "Custom value..." option before first optgroup (after inherit option)
        if (!customOptionAdded) {
          const customOption = PresetUtils.createCustomValueOption(currentValue)
          selectEl.appendChild(customOption)
          customOptionAdded = true
        }

        const optionsGroupEl = createElement('optgroup', null, { label: name })

        for (const preset of value) {
          let optionEl: HTMLOptionElement
          // Check if this is a fluid preset (has min/max values) or custom preset
          if (isFluidPreset(preset)) {
            optionEl = PresetUtils.createPresetOption(preset, currentValue)
          } else {
            optionEl = PresetUtils.createCustomPresetOption(preset, currentValue)
          }

          // Add group control_id to each option
          if (control_id) {
            optionEl.setAttribute('data-group-id', control_id)
          }

          optionsGroupEl.appendChild(optionEl)
        }

        selectEl.appendChild(optionsGroupEl)
      } else if (typeof value === 'string') {
        const optionEl = PresetUtils.createSimpleOption(value, name, currentValue, inheritanceData)
        selectEl.appendChild(optionEl)
      }
    }

    selectEl.classList.toggle('e-select-placeholder', currentValue === '')
    return selectEl
  }

  static async getInheritedPreset(inheritedSize: string | null): Promise<TInheritedPresetResult> {
    const presetsData = await dataManager.getPresetsData()

    if (!presetsData) {
      return null
    }

    for (const { name, value } of presetsData) {
      if (typeof value === 'object' && Array.isArray(value)) {
        for (const preset of value) {
          if (inheritedSize === preset.value && isFluidPreset(preset)) {
            return { ...preset, isComplex: true as const }
          }
        }
      } else if (typeof value === 'string' && inheritedSize === value) {
        return { isComplex: false as const, id: value, name }
      }
    }

    return null
  }

  static getInheritedPresetSync(inheritedSize: string | null): TInheritedPresetResult {
    const presetsData = dataManager.presets

    if (!presetsData) {
      return null
    }

    for (const { name, value } of presetsData) {
      if (typeof value === 'object' && Array.isArray(value)) {
        for (const preset of value) {
          if (inheritedSize === preset.value && isFluidPreset(preset)) {
            return { ...preset, isComplex: true as const }
          }
        }
      } else if (typeof value === 'string' && inheritedSize === value) {
        return { isComplex: false as const, id: value, name }
      }
    }

    return null
  }
}

export const { buildSelectOptions, getInheritedPreset, getInheritedPresetSync } = PresetUtils
