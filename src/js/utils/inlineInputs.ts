import { createElement } from './dom'
import { ValidationService } from './validation'
import { ValueFormatter } from './formatters'
import { UI_DEFAULTS } from '../constants'
import type { IInlineContainerResult, IInlineInputValues } from '../interfaces'

/** Manages inline min/max input fields for custom fluid values */
export class InlineInputManager {
  /** Creates the inline min/max input container with event listeners */
  static createContainer(
    setting: string,
    onInputChange: ((setting: string) => void) | null,
    onSaveClick: ((setting: string) => void) | null
  ): IInlineContainerResult {
    const container = createElement('div', 'e-fluid-inline-container e-hidden', {
      'data-setting': setting
    })

    const minInput = createElement('input', 'e-fluid-inline-input', {
      type: 'text',
      'data-fluid-role': 'min',
      placeholder: UI_DEFAULTS.INLINE_INPUT_PLACEHOLDER
    }) as HTMLInputElement

    const separator = createElement('span', 'e-fluid-inline-separator')
    separator.textContent = '~'

    const maxInput = createElement('input', 'e-fluid-inline-input', {
      type: 'text',
      'data-fluid-role': 'max',
      placeholder: UI_DEFAULTS.INLINE_INPUT_PLACEHOLDER
    }) as HTMLInputElement

    container.appendChild(minInput)
    container.appendChild(separator)
    container.appendChild(maxInput)

    const saveButton = createElement('button', 'e-control-tool e-fluid-save-preset', {
      type: 'button',
      title: window.ArtsFluidDSStrings?.saveAsPreset ?? ''
    }) as HTMLButtonElement
    const icon = createElement('i', 'eicon-plus')
    saveButton.appendChild(icon)
    container.appendChild(saveButton)

    const abortController = new AbortController()
    const { signal } = abortController

    const handleInputChange = () => {
      ValidationService.validateInputElement(minInput)
      ValidationService.validateInputElement(maxInput)
      InlineInputManager.updateSaveButtonState(container)
      InlineInputManager.updateSeparator(minInput, maxInput, separator)
      if (onInputChange) {
        onInputChange(setting)
      }
    }

    minInput.addEventListener('input', handleInputChange, { signal })
    maxInput.addEventListener('input', handleInputChange, { signal })

    InlineInputManager.updateSeparator(minInput, maxInput, separator)

    saveButton.addEventListener(
      'click',
      (e: Event) => {
        e.preventDefault()
        if (onSaveClick) {
          onSaveClick(setting)
        }
      },
      { signal }
    )

    InlineInputManager.updateSaveButtonState(container)

    return { container, abortController }
  }

  /** Updates separator text based on value equality */
  static updateSeparator(minInput: HTMLInputElement, maxInput: HTMLInputElement, separator: HTMLElement): void {
    const minParsed = ValidationService.parseValueWithUnit(minInput.value)
    const maxParsed = ValidationService.parseValueWithUnit(maxInput.value)

    separator.textContent = ValueFormatter.calculateSeparator(minParsed, maxParsed)
  }

  /** Updates save button disabled state based on input validity */
  static updateSaveButtonState(container: HTMLElement): void {
    const minInput = container.querySelector('[data-fluid-role="min"]') as HTMLInputElement | null
    const maxInput = container.querySelector('[data-fluid-role="max"]') as HTMLInputElement | null
    const saveButton = container.querySelector('.e-fluid-save-preset') as HTMLButtonElement | null

    if (!minInput || !maxInput || !saveButton) {
      return
    }

    const validation = ValidationService.validateMinMax(minInput.value, maxInput.value)
    saveButton.disabled = !validation.valid
  }

  /** Gets inline input values for a setting */
  static getInputValues(container: HTMLElement | null): IInlineInputValues | null {
    if (!container) {
      return null
    }

    const minInput = container.querySelector('[data-fluid-role="min"]') as HTMLInputElement | null
    const maxInput = container.querySelector('[data-fluid-role="max"]') as HTMLInputElement | null

    const minValue = minInput?.value ?? ''
    const maxValue = maxInput?.value ?? ''

    const minParsed = ValidationService.parseValueWithUnit(minValue)
    const maxParsed = ValidationService.parseValueWithUnit(maxValue)

    if (!minParsed || !maxParsed) {
      return null
    }

    return {
      minSize: minParsed.size,
      minUnit: minParsed.unit,
      maxSize: maxParsed.size,
      maxUnit: maxParsed.unit
    }
  }

  /** Sets inline input values (used when loading existing inline value) */
  static setInputValues(container: HTMLElement | null, values: IInlineInputValues | null): void {
    if (!container || !values) {
      return
    }

    const minInput = container.querySelector('[data-fluid-role="min"]') as HTMLInputElement | null
    const maxInput = container.querySelector('[data-fluid-role="max"]') as HTMLInputElement | null

    if (minInput && values.minSize) {
      minInput.value = `${values.minSize}${values.minUnit || 'px'}`
      ValidationService.validateInputElement(minInput)
    }
    if (maxInput && values.maxSize) {
      maxInput.value = `${values.maxSize}${values.maxUnit || 'px'}`
      ValidationService.validateInputElement(maxInput)
    }

    const separator = container.querySelector('.e-fluid-inline-separator') as HTMLElement | null
    if (minInput && maxInput && separator) {
      InlineInputManager.updateSeparator(minInput, maxInput, separator)
    }

    InlineInputManager.updateSaveButtonState(container)
  }

  /** Toggles visibility of inline inputs */
  static toggleVisibility(container: HTMLElement | null, show: boolean): void {
    if (container) {
      container.classList.toggle('e-hidden', !show)
    }
  }

  /** Syncs values across multiple linked containers (for linked dimensions) */
  static syncLinkedContainers(containers: HTMLElement[] | null, values: IInlineInputValues | null): void {
    if (!containers || !values) {
      return
    }

    containers.forEach((container) => {
      if (!container) {
        return
      }

      const minInput = container.querySelector('[data-fluid-role="min"]') as HTMLInputElement | null
      const maxInput = container.querySelector('[data-fluid-role="max"]') as HTMLInputElement | null

      if (minInput) {
        minInput.value = `${values.minSize}${values.minUnit}`
        ValidationService.validateInputElement(minInput)
      }
      if (maxInput) {
        maxInput.value = `${values.maxSize}${values.maxUnit}`
        ValidationService.validateInputElement(maxInput)
      }

      const separator = container.querySelector('.e-fluid-inline-separator') as HTMLElement | null
      if (minInput && maxInput && separator) {
        InlineInputManager.updateSeparator(minInput, maxInput, separator)
      }

      InlineInputManager.updateSaveButtonState(container)
    })
  }
}
