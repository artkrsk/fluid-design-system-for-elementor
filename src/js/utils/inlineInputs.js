import { createElement } from './dom.js'
import { ValidationService } from './validation.js'
import { ValueFormatter } from './formatters.js'
import { UI_DEFAULTS } from '../constants/VALUES'

/**
 * Manages inline min/max input fields for custom fluid values
 */
export class InlineInputManager {
  /**
   * Creates the inline min/max input container with event listeners
   * @param {string} setting - Setting name (e.g., 'top', 'size')
   * @param {Function} onInputChange - Callback when input values change
   * @param {Function} onSaveClick - Callback when save button is clicked
   * @returns {{container: HTMLElement, abortController: AbortController}} Container and abort controller
   */
  static createContainer(setting, onInputChange, onSaveClick) {
    const container = createElement('div', 'e-fluid-inline-container e-hidden', {
      'data-setting': setting
    })

    // Min value input (text input accepting "20px", "1.5rem", etc.)
    const minInput = createElement('input', 'e-fluid-inline-input', {
      type: 'text',
      'data-fluid-role': 'min',
      placeholder: UI_DEFAULTS.INLINE_INPUT_PLACEHOLDER
    })

    // Separator
    const separator = createElement('span', 'e-fluid-inline-separator')
    separator.textContent = '~'

    // Max value input
    const maxInput = createElement('input', 'e-fluid-inline-input', {
      type: 'text',
      'data-fluid-role': 'max',
      placeholder: UI_DEFAULTS.INLINE_INPUT_PLACEHOLDER
    })

    container.appendChild(minInput)
    container.appendChild(separator)
    container.appendChild(maxInput)

    // Add "Save as Preset" button (Elementor pattern)
    const saveButton = createElement('button', 'e-control-tool e-fluid-save-preset', {
      type: 'button',
      title: window.ArtsFluidDSStrings?.saveAsPreset
    })
    const icon = createElement('i', 'eicon-plus')
    saveButton.appendChild(icon)
    container.appendChild(saveButton)

    // Create AbortController for event listeners
    const abortController = new AbortController()
    const { signal } = abortController

    // Attach input event listeners with validation and AbortController
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

    // Set initial separator state
    InlineInputManager.updateSeparator(minInput, maxInput, separator)

    // Attach button click listener with AbortController
    saveButton.addEventListener(
      'click',
      (e) => {
        e.preventDefault()
        if (onSaveClick) {
          onSaveClick(setting)
        }
      },
      { signal }
    )

    // Set initial button state
    InlineInputManager.updateSaveButtonState(container)

    return { container, abortController }
  }

  /**
   * Updates separator text based on value equality
   * @param {HTMLInputElement} minInput - Min input element
   * @param {HTMLInputElement} maxInput - Max input element
   * @param {HTMLElement} separator - Separator element
   */
  static updateSeparator(minInput, maxInput, separator) {
    const minParsed = ValidationService.parseValueWithUnit(minInput.value)
    const maxParsed = ValidationService.parseValueWithUnit(maxInput.value)

    separator.textContent = ValueFormatter.calculateSeparator(minParsed, maxParsed)
  }

  /**
   * Updates save button disabled state based on input validity
   * @param {HTMLElement} container - Inline input container
   */
  static updateSaveButtonState(container) {
    /** @type {HTMLInputElement|null} */
    const minInput = container.querySelector('[data-fluid-role="min"]')
    /** @type {HTMLInputElement|null} */
    const maxInput = container.querySelector('[data-fluid-role="max"]')
    /** @type {HTMLButtonElement|null} */
    const saveButton = container.querySelector('.e-fluid-save-preset')

    if (!minInput || !maxInput || !saveButton) {
      return
    }

    const validation = ValidationService.validateMinMax(minInput.value, maxInput.value)
    saveButton.disabled = !validation.valid
  }

  /**
   * Gets inline input values for a setting
   * @param {HTMLElement} container - Inline input container
   * @returns {{minSize: string, minUnit: string, maxSize: string, maxUnit: string}|null} Input values or null
   */
  static getInputValues(container) {
    if (!container) {
      return null
    }

    /** @type {HTMLInputElement|null} */
    const minInput = container.querySelector('[data-fluid-role="min"]')
    /** @type {HTMLInputElement|null} */
    const maxInput = container.querySelector('[data-fluid-role="max"]')

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

  /**
   * Sets inline input values (used when loading existing inline value)
   * @param {HTMLElement} container - Inline input container
   * @param {{minSize: string, minUnit: string, maxSize: string, maxUnit: string}} values - Values to set
   */
  static setInputValues(container, values) {
    if (!container || !values) {
      return
    }

    /** @type {HTMLInputElement|null} */
    const minInput = container.querySelector('[data-fluid-role="min"]')
    /** @type {HTMLInputElement|null} */
    const maxInput = container.querySelector('[data-fluid-role="max"]')

    if (minInput && values.minSize) {
      minInput.value = `${values.minSize}${values.minUnit || 'px'}`
      ValidationService.validateInputElement(minInput)
    }
    if (maxInput && values.maxSize) {
      maxInput.value = `${values.maxSize}${values.maxUnit || 'px'}`
      ValidationService.validateInputElement(maxInput)
    }

    // Update separator after setting values
    /** @type {HTMLElement|null} */
    const separator = container.querySelector('.e-fluid-inline-separator')
    if (minInput && maxInput && separator) {
      InlineInputManager.updateSeparator(minInput, maxInput, separator)
    }

    // Update button state after setting values
    InlineInputManager.updateSaveButtonState(container)
  }

  /**
   * Toggles visibility of inline inputs
   * @param {HTMLElement} container - Inline input container
   * @param {boolean} show - Whether to show or hide
   */
  static toggleVisibility(container, show) {
    if (container) {
      container.classList.toggle('e-hidden', !show)
    }
  }

  /**
   * Syncs values across multiple linked containers (for linked dimensions)
   * @param {HTMLElement[]} containers - Array of containers to sync
   * @param {{minSize: string, minUnit: string, maxSize: string, maxUnit: string}} values - Values to sync
   */
  static syncLinkedContainers(containers, values) {
    if (!containers || !values) {
      return
    }

    containers.forEach((container) => {
      if (!container) {
        return
      }

      /** @type {HTMLInputElement|null} */
      const minInput = container.querySelector('[data-fluid-role="min"]')
      /** @type {HTMLInputElement|null} */
      const maxInput = container.querySelector('[data-fluid-role="max"]')

      if (minInput) {
        minInput.value = `${values.minSize}${values.minUnit}`
        ValidationService.validateInputElement(minInput)
      }
      if (maxInput) {
        maxInput.value = `${values.maxSize}${values.maxUnit}`
        ValidationService.validateInputElement(maxInput)
      }

      // Update separator after setting values
      /** @type {HTMLElement|null} */
      const separator = container.querySelector('.e-fluid-inline-separator')
      if (minInput && maxInput && separator) {
        InlineInputManager.updateSeparator(minInput, maxInput, separator)
      }

      InlineInputManager.updateSaveButtonState(container)
    })
  }
}
