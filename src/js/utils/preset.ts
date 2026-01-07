import { createElement } from './dom'
import { dataManager } from '../managers'
import {
  createPresetOption,
  createCustomPresetOption,
  createSimpleOption,
  createCustomValueOption
} from './presetOptions'
import { getInheritedPreset, getInheritedPresetSync, isFluidPreset } from './presetLookup'
import type { IInheritanceData } from '../interfaces'

/** Builds select options from preset data */
export async function buildSelectOptions(selectEl: HTMLSelectElement, el?: HTMLElement): Promise<HTMLSelectElement> {
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
      if (!customOptionAdded) {
        const customOption = createCustomValueOption(currentValue)
        selectEl.appendChild(customOption)
        customOptionAdded = true
      }

      const optionsGroupEl = createElement('optgroup', null, { label: name })

      for (const preset of value) {
        let optionEl: HTMLOptionElement
        if (isFluidPreset(preset)) {
          optionEl = createPresetOption(preset, currentValue)
        } else {
          optionEl = createCustomPresetOption(preset, currentValue)
        }

        if (control_id) {
          optionEl.setAttribute('data-group-id', control_id)
        }

        optionsGroupEl.appendChild(optionEl)
      }

      selectEl.appendChild(optionsGroupEl)
    } else if (typeof value === 'string') {
      const optionEl = createSimpleOption(value, name, currentValue, inheritanceData)
      selectEl.appendChild(optionEl)
    }
  }

  selectEl.classList.toggle('e-select-placeholder', currentValue === '')
  return selectEl
}

// Re-export lookup functions for backward compatibility
export { getInheritedPreset, getInheritedPresetSync }
