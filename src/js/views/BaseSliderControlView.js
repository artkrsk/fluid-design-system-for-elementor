import { createElement } from '../utils/dom'
import { generateClampFormula, isInlineClampValue, parseClampFormula } from '../utils/clamp'
import { ValidationService } from '../utils/validation.js'
import { InlineInputManager } from '../utils/inlineInputs.js'
import { CUSTOM_FLUID_VALUE } from '../constants/Controls'
import { AJAX_ACTION_SAVE_PRESET, AJAX_ACTION_GET_GROUPS } from '../constants/AJAX'
import { dataManager, cssManager } from '../managers'
import { buildSelectOptions } from '../utils/preset'
import { STYLES } from '../constants/Styles'

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
    const { container } = InlineInputManager.createContainer(
      setting,
      () => this._onSliderInlineInputChange(setting),
      () => this._onSliderSaveAsPresetClick(setting)
    )

    return container
  },

  /** Updates Save button disabled state based on input validity for slider */
  _updateSliderSaveButtonState(container) {
    InlineInputManager.updateSaveButtonState(container)
  },

  /** Handles Save as Preset button click for slider */
  async _onSliderSaveAsPresetClick(setting) {
    const values = this._getSliderInlineInputValues(setting)
    if (!values) {
      return
    }

    const { minSize, minUnit, maxSize, maxUnit } = values

    // Only allow saving if we have valid values
    if (!minSize || !maxSize) {
      return
    }

    // Get inline container and save button
    const container = this._getSliderInlineContainer(setting)
    const saveButton = container?.querySelector('.e-fluid-save-preset')
    const icon = saveButton?.querySelector('i')

    if (!container || !saveButton || !icon) {
      return
    }

    // Show loading state
    container.classList.add('e-fluid-loading')
    saveButton.disabled = true
    icon.className = 'eicon-spinner eicon-animation-spin'

    try {
      // Create confirmation dialog (Elementor pattern)
      const dialog = await this._createSliderSavePresetDialog(
        minSize,
        minUnit,
        maxSize,
        maxUnit,
        setting
      )
      dialog.show()
    } finally {
      // Restore normal state
      container.classList.remove('e-fluid-loading')
      saveButton.disabled = false
      icon.className = 'eicon-plus'
    }
  },

  /** Creates the Save as Preset dialog for slider */
  async _createSliderSavePresetDialog(minSize, minUnit, maxSize, maxUnit, setting) {
    // Create dialog message with input
    const $message = jQuery('<div>', { class: 'e-global__confirm-message' })
    const $messageText = jQuery('<div>', { class: 'e-global__confirm-message-text' }).html(
      window.ArtsFluidDSStrings?.createNewPreset || 'Create a new fluid preset:'
    )

    const $inputWrapper = jQuery('<div>', { class: 'e-global__confirm-input-wrapper' })

    // Preview of the values
    const previewText = `${minSize}${minUnit} ~ ${maxSize}${maxUnit}`
    const $preview = jQuery('<div>', {
      class: 'e-fluid-preset-preview',
      text: previewText
    })

    // Preset name input
    const $input = jQuery('<input>', {
      type: 'text',
      name: 'preset-name',
      placeholder: window.ArtsFluidDSStrings?.presetName || 'Preset Name'
    }).val(`Custom ${previewText}`)

    // Group selector
    const $groupSelect = jQuery('<select>', {
      name: 'preset-group',
      class: 'e-fluid-group-select'
    })

    // Populate groups (async)
    await this._populateSliderGroupOptions($groupSelect)

    $inputWrapper.append($preview, $input, $groupSelect)
    $message.append($messageText, $inputWrapper)

    // Create dialog
    const dialog = elementorCommon.dialogsManager.createWidget('confirm', {
      className: 'e-fluid-save-preset-dialog',
      headerMessage: window.ArtsFluidDSStrings?.saveAsPreset || 'Save as Preset',
      message: $message,
      strings: {
        confirm: window.ArtsFluidDSStrings?.create || 'Create',
        cancel: window.ArtsFluidDSStrings?.cancel || 'Cancel'
      },
      hide: {
        onBackgroundClick: false
      },
      onConfirm: () =>
        this._onSliderConfirmSavePreset(
          $input.val(),
          $groupSelect.val(),
          minSize,
          minUnit,
          maxSize,
          maxUnit,
          setting
        ),
      onShow: () => {
        // Initialize Select2 on group selector
        $groupSelect.select2({
          minimumResultsForSearch: -1, // Hide search box
          width: '100%'
        })

        // Get the dialog's Create button
        const $confirmButton = dialog.getElements('widget').find('.dialog-ok')

        // Validate name input on change
        $input.on('input', () => {
          const inputValue = String($input.val() || '')
          const isNameValid = inputValue.trim().length > 0
          $confirmButton.prop('disabled', !isNameValid)
        })

        // Submit on Enter key
        $input.on('keydown', (e) => {
          if (e.key === 'Enter' && !$confirmButton.prop('disabled')) {
            e.preventDefault()
            $confirmButton.click()
          }
        })

        // Set initial button state
        const initialValue = String($input.val() || '')
        const hasInitialName = initialValue.trim().length > 0
        $confirmButton.prop('disabled', !hasInitialName)

        // Auto-focus and select input text
        setTimeout(() => {
          $input.focus().select()
        }, 50)
      }
    })

    return dialog
  },

  /** Populates group select options by fetching group metadata for slider */
  async _populateSliderGroupOptions($select) {
    // Fetch groups with proper IDs
    return new Promise((resolve) => {
      window.elementor.ajax.addRequest(AJAX_ACTION_GET_GROUPS, {
        data: {},
        success: (groups) => {
          if (!groups || !Array.isArray(groups)) {
            // Fallback to default groups
            $select.append(
              jQuery('<option>', { value: 'fluid_spacing_presets', text: 'Spacing Presets' }),
              jQuery('<option>', { value: 'fluid_typography_presets', text: 'Typography Presets' })
            )
            resolve()
            return
          }

          // Add all groups with proper IDs
          for (const group of groups) {
            $select.append(
              jQuery('<option>', {
                value: group.id,
                text: group.name
              })
            )
          }
          resolve()
        },
        error: () => {
          // Fallback on error
          $select.append(
            jQuery('<option>', { value: 'fluid_spacing_presets', text: 'Spacing Presets' }),
            jQuery('<option>', { value: 'fluid_typography_presets', text: 'Typography Presets' })
          )
          resolve()
        }
      })
    })
  },

  /** Handles dialog confirmation for slider */
  _onSliderConfirmSavePreset(title, group, minSize, minUnit, maxSize, maxUnit, _setting) {
    // Prepare data for AJAX
    const ajaxData = {
      title: title.trim() || `Custom ${minSize}${minUnit} ~ ${maxSize}${maxUnit}`,
      min_size: minSize,
      min_unit: minUnit,
      max_size: maxSize,
      max_unit: maxUnit,
      group: group || 'spacing'
    }

    // Call AJAX endpoint
    window.elementor.ajax.addRequest(AJAX_ACTION_SAVE_PRESET, {
      data: ajaxData,
      success: async (response) => {
        // Generate and inject CSS variable into preview immediately
        const clampFormula = generateClampFormula(minSize, minUnit, maxSize, maxUnit)
        cssManager.setCssVariable(response.id, clampFormula)

        // Invalidate cache to force fresh data fetch
        dataManager.invalidate()

        // Refresh preset dropdown
        await this._refreshSliderPresetDropdown()

        // Auto-select the new preset
        const presetValue = `var(${STYLES.VAR_PREFIX}${response.id})`
        this._selectSliderPreset(presetValue)
      },
      error: (error) => {
        // Show error message
        elementorCommon.dialogsManager
          .createWidget('alert', {
            headerMessage: window.ArtsFluidDSStrings?.error || 'Error',
            message: error || window.ArtsFluidDSStrings?.failedToSave || 'Failed to save preset'
          })
          .show()
      }
    })
  },

  /** Refreshes the slider preset dropdown */
  async _refreshSliderPresetDropdown() {
    for (const selectEl of this.ui.selectControls) {
      // Clear existing options
      selectEl.innerHTML = ''

      // Re-populate with fresh data
      await buildSelectOptions(selectEl, this.el)

      // Refresh Select2
      jQuery(selectEl).trigger('change.select2')
    }
  },

  /** Selects a preset value in the slider dropdown */
  _selectSliderPreset(presetValue) {
    const selectEl = this.ui.selectControls[0]

    if (!selectEl) {
      return
    }

    // Update select value
    selectEl.value = presetValue
    selectEl.setAttribute('data-value', presetValue)

    // Update control value
    const newValue = {
      unit: 'fluid',
      size: presetValue
    }
    this.setValue(newValue)

    // Hide inline inputs
    this._toggleSliderInlineInputs('size', false)

    // Update UI input
    this.ui.input.val(presetValue)

    // Trigger Select2 update
    jQuery(selectEl).trigger('change.select2')
  },

  /** Validates an inline input and toggles invalid state */
  _validateSliderInlineInput(input) {
    return ValidationService.validateInputElement(input)
  },

  /** Gets the inline container for slider */
  _getSliderInlineContainer(setting) {
    return this.$el[0].querySelector(`.e-fluid-inline-container[data-setting="${setting}"]`)
  },

  /** Toggles visibility of inline inputs for slider */
  _toggleSliderInlineInputs(setting, show) {
    const container = this._getSliderInlineContainer(setting)
    InlineInputManager.toggleVisibility(container, show)
  },

  /** Parses a value with unit like "20px" or "1.5rem" */
  _parseSliderValueWithUnit(value) {
    return ValidationService.parseValueWithUnit(value)
  },

  /** Gets inline input values for slider */
  _getSliderInlineInputValues(setting) {
    const container = this._getSliderInlineContainer(setting)
    return InlineInputManager.getInputValues(container)
  },

  /** Sets inline input values for slider */
  _setSliderInlineInputValues(setting, values) {
    const container = this._getSliderInlineContainer(setting)
    InlineInputManager.setInputValues(container, values)
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

      // Show inputs if custom value is selected OR if value is inline clamp
      const isCustomSelected = selectEl.value === CUSTOM_FLUID_VALUE
      const hasInlineClamp = isInlineClampValue(currentValue)

      if (isCustomSelected || hasInlineClamp) {
        // Verify container exists before trying to manipulate it
        const container = this._getSliderInlineContainer(setting)

        if (!container) {
          continue
        }

        this._toggleSliderInlineInputs(setting, true)

        // Populate inputs if there's a clamp formula
        if (hasInlineClamp) {
          const parsed = parseClampFormula(currentValue)
          if (parsed) {
            this._setSliderInlineInputValues(setting, parsed)
          }
        }

        // Ensure Custom value is selected
        if (hasInlineClamp) {
          selectEl.value = CUSTOM_FLUID_VALUE
          selectEl.setAttribute('data-value', CUSTOM_FLUID_VALUE)
          jQuery(selectEl).trigger('change.select2')
        }
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
    const wasFluid = this.$el.hasClass('e-units-fluid')
    const isNowFluid = unit === 'fluid'

    this.ui.unitSwitcher.attr('data-selected', unit).find('span').html(unit)

    this.$el.toggleClass('e-units-custom', this.isCustomUnit())
    this.$el.toggleClass('e-units-fluid', isNowFluid)

    const inputType = this.isCustomUnit() ? 'text' : 'number'

    if (this.isCustomUnit()) {
      this.destroySlider()
    } else {
      this.initSlider()
    }

    if (!this.isMultiple()) {
      this.ui.input.attr('type', inputType)
    }

    if (isNowFluid) {
      this.updatePlaceholderClassState()

      // Show inline inputs if Custom value is selected
      for (const selectEl of this.ui.selectControls || []) {
        if (selectEl.value === CUSTOM_FLUID_VALUE) {
          this._toggleSliderInlineInputs('size', true)
        }
      }
    }

    // Hide inline inputs when switching away from fluid unit
    if (wasFluid && !isNowFluid) {
      this._toggleSliderInlineInputs('size', false)
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
