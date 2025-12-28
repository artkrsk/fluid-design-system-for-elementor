import { createElement } from '../utils/dom'
import { generateClampFormula, isInlineClampValue, parseClampFormula } from '../utils/clamp'
import { CUSTOM_FLUID_VALUE } from '../constants/Controls'

export const BaseSliderControlView = {
  renderFluidSelectElements() {
    if (!this.ui.selectControls || !Array.isArray(this.ui.selectControls)) {
      this.ui.selectControls = []
    }

    const inputWrapperEl = this.el.querySelector('.elementor-control-input-wrapper')
    if (!inputWrapperEl) {
      return
    }

    const inputEl = inputWrapperEl.querySelector('input[type="text"], input[type="number"]')
    if (!inputEl) {
      return
    }

    const fluidSelector = inputWrapperEl.querySelector('.elementor-control-fluid-selector')
    const fluidSelectorContainer = inputWrapperEl.querySelector(
      '.elementor-control-fluid-selector-container'
    )

    if (!fluidSelector || !fluidSelectorContainer) {
      this._createSliderFluidSelector(inputWrapperEl, inputEl)
    }
  },

  _createSliderFluidSelector(inputWrapperEl, inputEl) {
    const setting = inputEl.dataset.setting
    const fluidSelectorContainer = createElement(
      'div',
      'elementor-control-fluid-selector-container'
    )
    const fluidSelector = createElement('select', 'elementor-control-fluid-selector', {
      'data-setting': setting,
      'data-value': inputEl.value
    })

    this._setupSliderInheritanceAttributes(fluidSelector)
    fluidSelectorContainer.appendChild(fluidSelector)
    this.ui.selectControls.push(fluidSelector)
    inputWrapperEl.appendChild(fluidSelectorContainer)

    // Create inline inputs container (hidden by default)
    const inlineContainer = this._createSliderInlineInputsContainer(setting)
    inputWrapperEl.appendChild(inlineContainer)
  },

  /** Creates the inline min/max input container for slider */
  _createSliderInlineInputsContainer(setting) {
    const container = createElement('div', 'e-fluid-inline-container e-hidden', {
      'data-setting': setting
    })

    // Min value input (text input accepting "20px", "1.5rem", etc.)
    const minInput = createElement('input', 'e-fluid-inline-input', {
      type: 'text',
      'data-fluid-role': 'min',
      placeholder: '0px'
    })

    // Separator
    const separator = createElement('span', 'e-fluid-inline-separator')
    separator.textContent = '~'

    // Max value input
    const maxInput = createElement('input', 'e-fluid-inline-input', {
      type: 'text',
      'data-fluid-role': 'max',
      placeholder: '0px'
    })

    container.appendChild(minInput)
    container.appendChild(separator)
    container.appendChild(maxInput)

    // Attach input event listeners with validation
    minInput.addEventListener('input', () => {
      this._validateSliderInlineInput(minInput)
      this._onSliderInlineInputChange(setting)
    })
    maxInput.addEventListener('input', () => {
      this._validateSliderInlineInput(maxInput)
      this._onSliderInlineInputChange(setting)
    })

    return container
  },

  /** Validates an inline input and toggles invalid state */
  _validateSliderInlineInput(input) {
    const value = input.value.trim()
    // Empty is valid (just not ready yet)
    if (!value) {
      input.classList.remove('e-fluid-inline-invalid')
      return true
    }
    const parsed = this._parseSliderValueWithUnit(value)
    const isValid = parsed !== null
    input.classList.toggle('e-fluid-inline-invalid', !isValid)
    return isValid
  },

  /** Gets the inline container for slider */
  _getSliderInlineContainer(setting) {
    return this.$el[0].querySelector(`.e-fluid-inline-container[data-setting="${setting}"]`)
  },

  /** Toggles visibility of inline inputs for slider */
  _toggleSliderInlineInputs(setting, show) {
    const container = this._getSliderInlineContainer(setting)
    if (container) {
      container.classList.toggle('e-hidden', !show)
    }
  },

  /** Parses a value with unit like "20px" or "1.5rem" */
  _parseSliderValueWithUnit(value) {
    // Empty value defaults to 0px
    if (!value || typeof value !== 'string' || value.trim() === '') {
      return { size: '0', unit: 'px' }
    }
    // Strict validation: only allow specific units (px, rem, em, %, vw, vh)
    const match = value.trim().match(/^(-?[\d.]+)\s*(px|rem|em|%|vw|vh)?$/i)
    if (!match) {
      return null
    }
    return {
      size: match[1],
      unit: match[2] || 'px' // Default to px if no unit
    }
  },

  /** Gets inline input values for slider */
  _getSliderInlineInputValues(setting) {
    const container = this._getSliderInlineContainer(setting)
    if (!container) {
      return null
    }

    const minValue = container.querySelector('[data-fluid-role="min"]')?.value
    const maxValue = container.querySelector('[data-fluid-role="max"]')?.value

    const minParsed = this._parseSliderValueWithUnit(minValue)
    const maxParsed = this._parseSliderValueWithUnit(maxValue)

    if (!minParsed || !maxParsed) {
      return null
    }

    return {
      minSize: minParsed.size,
      minUnit: minParsed.unit,
      maxSize: maxParsed.size,
      maxUnit: maxParsed.unit
    }
  },

  /** Sets inline input values for slider */
  _setSliderInlineInputValues(setting, values) {
    const container = this._getSliderInlineContainer(setting)
    if (!container || !values) {
      return
    }

    const minInput = container.querySelector('[data-fluid-role="min"]')
    const maxInput = container.querySelector('[data-fluid-role="max"]')

    if (minInput && values.minSize) {
      minInput.value = `${values.minSize}${values.minUnit || 'px'}`
      this._validateSliderInlineInput(minInput)
    }
    if (maxInput && values.maxSize) {
      maxInput.value = `${values.maxSize}${values.maxUnit || 'px'}`
      this._validateSliderInlineInput(maxInput)
    }
  },

  /** Initialize inline inputs state for slider on render */
  initializeInlineInputsState() {
    // Override base method for slider-specific behavior
    if (!this.ui.selectControls || this.ui.selectControls.length === 0) {
      return
    }

    for (const selectEl of this.ui.selectControls) {
      const setting = selectEl.getAttribute('data-setting') || 'size'
      const currentValue = this.getControlValue('size')

      // If current value is an inline clamp formula, show the inputs and populate them
      if (isInlineClampValue(currentValue)) {
        // Verify container exists before trying to manipulate it
        const container = this._getSliderInlineContainer(setting)

        if (!container) {
          continue
        }

        this._toggleSliderInlineInputs(setting, true)
        const parsed = parseClampFormula(currentValue)
        if (parsed) {
          this._setSliderInlineInputValues(setting, parsed)
        }
        // Update Select2 selection
        selectEl.value = CUSTOM_FLUID_VALUE
        selectEl.setAttribute('data-value', CUSTOM_FLUID_VALUE)
        jQuery(selectEl).trigger('change.select2')
      }
    }
  },

  /** Handles inline input value changes for slider */
  _onSliderInlineInputChange(setting) {
    const values = this._getSliderInlineInputValues(setting)
    if (!values) {
      return
    }

    const { minSize, minUnit, maxSize, maxUnit } = values

    // Only generate clamp if we have valid min and max values
    if (minSize && maxSize) {
      const clampValue = generateClampFormula(minSize, minUnit, maxSize, maxUnit)

      // Use Elementor's setValue with key-value pairs
      this.setValue('size', clampValue)
      this.setValue('unit', 'fluid')

      // Set UI input to clamp formula
      this.ui.input.val(clampValue)
    }
  },

  _setupSliderInheritanceAttributes(fluidSelector) {
    const controlName = this.model.get('name')
    const isResponsiveControl = controlName && /_(?!.*_)(.+)$/.test(controlName)

    if (isResponsiveControl) {
      const inheritedControl = this.getParentControlValue()
      if (inheritedControl) {
        this._setSliderInheritanceAttributes(fluidSelector, inheritedControl)
      }
    }
  },

  _setSliderInheritanceAttributes(fluidSelector, inheritedControl) {
    const inheritedSize = inheritedControl.size
    const inheritedUnit = inheritedControl.unit
    const sourceUnit = inheritedControl.__sourceUnit || inheritedUnit
    const inheritedFrom = inheritedControl.__inheritedFrom || 'parent'

    if (inheritedSize !== undefined) {
      fluidSelector.setAttribute('data-inherited-size', inheritedSize)
    }

    if (inheritedUnit) {
      fluidSelector.setAttribute('data-inherited-unit', inheritedUnit)
    }

    if (sourceUnit) {
      fluidSelector.setAttribute('data-source-unit', sourceUnit)
    }

    fluidSelector.setAttribute('data-inherited-from', inheritedFrom)

    if (
      inheritedControl.__directParentDevice &&
      inheritedControl.__directParentDevice !== inheritedFrom
    ) {
      fluidSelector.setAttribute('data-inherited-via', inheritedControl.__directParentDevice)
    }

    let deviceName = inheritedFrom.charAt(0).toUpperCase() + inheritedFrom.slice(1)
    if (deviceName === 'Desktop') {
      deviceName = 'Default'
    }

    fluidSelector.setAttribute('data-inherited-device', deviceName)

    if (inheritedSize !== undefined) {
      let displayValue

      if (sourceUnit === 'custom' || sourceUnit === 'fluid') {
        displayValue = inheritedSize
      } else {
        displayValue = `${inheritedSize}${sourceUnit}`
        fluidSelector.setAttribute('data-mixed-units', 'true')
      }

      fluidSelector.setAttribute('data-value-display', displayValue)
      fluidSelector.setAttribute('data-title', displayValue)

      if (inheritedControl.__inheritPath?.length > 0) {
        fluidSelector.setAttribute('data-inherit-path', inheritedControl.__inheritPath.join(','))
      }
    }
  },

  isEmptyValue(value) {
    if (!value) {
      return true
    }

    return value.size === '' || value.size === null || value.size === undefined
  },

  onSelectChange(selectEl) {
    const value = selectEl.value
    const isInheritValue = value === ''
    const isCustomValue = value === CUSTOM_FLUID_VALUE
    const setting = selectEl.getAttribute('data-setting') || 'size'

    // Toggle inline inputs visibility
    this._toggleSliderInlineInputs(setting, isCustomValue)

    // If custom is selected, don't set value yet - wait for inline input
    if (isCustomValue) {
      selectEl.classList.remove('e-select-placeholder')
      selectEl.setAttribute('data-value', value)

      // Check if there's an existing inline value to restore
      const currentValue = this.getControlValue('size')
      if (isInlineClampValue(currentValue)) {
        const parsed = parseClampFormula(currentValue)
        if (parsed) {
          this._setSliderInlineInputValues(setting, parsed)
        }
      }
      return
    }

    const newValue = {
      unit: 'fluid',
      size: value
    }

    selectEl.setAttribute('data-value', value)
    selectEl.classList.toggle('e-select-placeholder', isInheritValue)

    this.setValue(newValue)
    this.ui.input.val(value)
    this.ui.input.trigger('change')
  },

  updateUnitChoices() {
    const unit = this.getControlValue('unit')

    this.ui.unitSwitcher.attr('data-selected', unit).find('span').html(unit)

    this.$el.toggleClass('e-units-custom', this.isCustomUnit())
    this.$el.toggleClass('e-units-fluid', this.isFluidUnit())

    const inputType = this.isCustomUnit() ? 'text' : 'number'

    if (this.isCustomUnit()) {
      this.destroySlider()
    } else {
      this.initSlider()
    }

    if (!this.isMultiple()) {
      this.ui.input.attr('type', inputType)
    }

    if (this.isFluidUnit()) {
      this.updatePlaceholderClassState()
    }
  },

  /**
   * Check if this slider control is inside a fluid preset repeater.
   * Uses view hierarchy: Slider → RepeaterRow → GlobalStyleRepeater
   */
  _isInFluidPresetRepeater() {
    try {
      // Traverse up: slider → repeater row → repeater
      const repeaterView = this._parent?._parent
      return repeaterView?.model?.get('is_fluid_preset_repeater') === true
    } catch {
      return false
    }
  },

  /**
   * Override handleUnitChange to preserve size value when switching units,
   * but ONLY for sliders inside fluid preset repeaters.
   *
   * This fixes an Elementor core bug where the UI shows a value after unit change
   * but the model actually has empty string, causing data loss on save.
   *
   * For all other sliders, standard Elementor behavior is preserved.
   */
  handleUnitChange() {
    // Only apply the fix for fluid preset repeater sliders
    if (!this._isInFluidPresetRepeater()) {
      // Standard Elementor behavior for all other sliders
      // @ts-expect-error - Type assertion for super access in mixin pattern
      this.constructor.__super__.handleUnitChange.apply(this, arguments)
      return
    }

    // Get current size before any changes
    const currentSize = this.getControlValue('size')

    // Call parent's handleUnitChange which will reset the size
    // @ts-expect-error - Type assertion for super access in mixin pattern
    this.constructor.__super__.handleUnitChange.apply(this, arguments)

    // If we had a valid size, restore it (only for fluid preset repeaters)
    if (currentSize !== '' && currentSize !== null && currentSize !== undefined) {
      this.setValue('size', currentSize)

      // Update the input field to show the preserved value
      if (this.ui.input && this.ui.input.length) {
        this.ui.input.val(currentSize)
      }

      // Update slider if initialized
      if (this.isSliderInitialized && this.isSliderInitialized()) {
        const slider = this.ui.slider?.[0]?.noUiSlider
        if (slider) {
          slider.set(currentSize)
        }
      }
    }
  }
}
