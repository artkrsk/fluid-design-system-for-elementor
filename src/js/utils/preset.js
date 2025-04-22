import { createElement } from './dom'
import { dataManager } from '../managers'

class PresetUtils {
  static #setElementAttributes(element, attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        element.setAttribute(key, value)
      }
    })
  }

  static #createBaseOption(value, currentValue, attributes = {}) {
    const optionEl = createElement('option')
    optionEl.value = value
    if (currentValue === value) {
      optionEl.setAttribute('selected', 'selected')
    }
    PresetUtils.#setElementAttributes(optionEl, attributes)
    return optionEl
  }

  static createPresetOption(preset, currentValue) {
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
      max_screen_width_unit
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
      'data-max-screen-width-unit': max_screen_width_unit
    })

    optionEl.textContent = `${min_size}${min_unit} ~ ${max_size}${max_unit} ${title}`
    return optionEl
  }

  static handleMixedUnitsInheritance(optionEl, inheritanceData) {
    const { inheritedSize, sourceUnit, inheritedFrom, inheritedVia, inheritedDevice } =
      inheritanceData

    optionEl.setAttribute('data-mixed-units', 'true')
    optionEl.setAttribute('data-inherited-title', name)

    if (inheritedFrom) optionEl.setAttribute('data-inherited-from', inheritedFrom)
    if (inheritedVia) optionEl.setAttribute('data-inherited-via', inheritedVia)
    if (inheritedDevice) optionEl.setAttribute('data-inherited-device', inheritedDevice)

    const displayValue =
      sourceUnit === 'custom' ? inheritedSize : inheritedSize ? `${inheritedSize}${sourceUnit}` : ''
    if (sourceUnit === 'custom') optionEl.setAttribute('data-custom-value', 'true')

    optionEl.setAttribute('data-title', displayValue)
    if (displayValue) {
      optionEl.setAttribute('data-value-display', displayValue)
    }
    optionEl.setAttribute('data-inherited-value', 'true')
    optionEl.textContent = displayValue
  }

  static handleComplexPresetInheritance(optionEl, preset) {
    const {
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

    optionEl.textContent = `${min_size}${min_unit} ~ ${max_size}${max_unit} ${title}`
    return optionEl
  }

  static handleFluidInheritance(optionEl, inheritanceData) {
    const { inheritedSize, inheritedFrom, inheritedVia, inheritedDevice } = inheritanceData
    const inheritedPreset = PresetUtils.getInheritedPresetSync(inheritedSize)

    optionEl.setAttribute('data-inherited-title', name)
    if (inheritedSize) optionEl.setAttribute('data-value-display', inheritedSize)
    if (inheritedFrom) optionEl.setAttribute('data-inherited-from', inheritedFrom)
    if (inheritedVia) optionEl.setAttribute('data-inherited-via', inheritedVia)
    if (inheritedDevice) optionEl.setAttribute('data-inherited-device', inheritedDevice)

    if (inheritedPreset) {
      if (inheritedPreset.isComplex) {
        PresetUtils.handleComplexPresetInheritance(optionEl, inheritedPreset)
      } else {
        optionEl.setAttribute('data-inherited-value', 'true')
        optionEl.textContent = inheritedPreset.title
      }
    } else {
      optionEl.setAttribute('data-inherited-value', 'true')
      const displayValue = inheritedSize || name
      optionEl.setAttribute('data-title', displayValue)
      optionEl.textContent = displayValue
    }
  }

  static handleStandardInheritance(optionEl, { inheritedSize, sourceUnit, name }) {
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

  static handleInheritOption(optionEl, currentValue, inheritanceData, name) {
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

  static createSimpleOption(value, name, currentValue, inheritanceData) {
    const optionEl = PresetUtils.#createBaseOption(value, currentValue)

    if (value === '') {
      PresetUtils.handleInheritOption(optionEl, currentValue, inheritanceData, name)
    } else {
      optionEl.textContent = name
    }

    return optionEl
  }

  static async buildSelectOptions(selectEl, el) {
    const presetsData = await dataManager.getPresetsData(el)

    if (!presetsData) {
      return selectEl
    }

    selectEl.classList.remove('is-loading')
    const loadingOption = selectEl.querySelector('.elementor-loading-option')
    if (loadingOption) {
      loadingOption.remove()
    }

    const currentValue = selectEl.getAttribute('data-value')
    const inheritanceData = {
      inheritedSize: selectEl.getAttribute('data-inherited-size'),
      inheritedUnit: selectEl.getAttribute('data-inherited-unit'),
      sourceUnit: selectEl.getAttribute('data-source-unit'),
      inheritedFrom: selectEl.getAttribute('data-inherited-from'),
      inheritedDevice: selectEl.getAttribute('data-inherited-device'),
      inheritedVia: selectEl.getAttribute('data-inherited-via')
    }

    for (const { name, value } of presetsData) {
      if (!name) {
        continue
      }

      if (typeof value === 'object' && Array.isArray(value)) {
        const optionsGroupEl = createElement('optgroup', null, { label: name })

        for (const preset of value) {
          const optionEl = PresetUtils.createPresetOption(preset, currentValue)
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

  static async getInheritedPreset(inheritedSize) {
    const presetsData = await dataManager.getPresetsData()

    if (!presetsData) {
      return null
    }

    for (const { name, value } of presetsData) {
      if (typeof value === 'object') {
        for (const preset of Object.values(value)) {
          if (inheritedSize === preset.value) {
            return { ...preset, isComplex: true }
          }
        }
      } else if (typeof value === 'string' && inheritedSize === value) {
        return { isComplex: false, id: value, name }
      }
    }

    return null
  }

  static getInheritedPresetSync(inheritedSize) {
    const presetsData = dataManager.presets

    if (!presetsData) {
      return null
    }

    for (const { name, value } of presetsData) {
      if (typeof value === 'object') {
        for (const preset of Object.values(value)) {
          if (inheritedSize === preset.value) {
            return { ...preset, isComplex: true }
          }
        }
      } else if (typeof value === 'string' && inheritedSize === value) {
        return { isComplex: false, id: value, name }
      }
    }

    return null
  }
}

export const { buildSelectOptions, getInheritedPreset, getInheritedPresetSync } = PresetUtils
