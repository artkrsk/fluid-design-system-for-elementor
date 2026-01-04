import { createElement } from '../utils/dom'
import { generateClampFormula, isInlineClampValue, parseClampFormula } from '../utils/clamp'
import { ValidationService } from '../utils/validation.js'
import { InlineInputManager } from '../utils/inlineInputs.js'
import { PresetDropdownManager } from '../utils/presetDropdown.js'
import { PresetAPIService } from '../services/presetAPI.js'
import { InheritanceAttributeManager } from '../utils/inheritanceAttributes.js'
import { PresetDialogManager } from '../managers/PresetDialogManager.js'
import { CUSTOM_FLUID_VALUE } from '../constants/VALUES'
import { dataManager, cssManager } from '../managers'
import { STYLES } from '../constants/STYLES'

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
      const dialog = await this.openPresetDialog('create', {
        setting,
        minSize: String(minSize),
        minUnit,
        maxSize: String(maxSize),
        maxUnit
      })
      dialog.show()
    } finally{
      // Restore normal state
      container.classList.remove('e-fluid-loading')
      saveButton.disabled = false
      icon.className = 'eicon-plus'
    }
  },

  /** Opens unified preset dialog (delegates to PresetDialogManager) */
  async openPresetDialog(mode, data) {
    return PresetDialogManager.open(mode, data, {
      onCreate: (name, group, minVal, maxVal, setting) =>
        this.onConfirmCreatePreset(name, group, minVal, maxVal, setting),
      onUpdate: (presetId, name, group, minVal, maxVal) =>
        this.onConfirmUpdatePreset(presetId, name, group, minVal, maxVal),
      getInlineContainer: (setting) => this._getSliderInlineContainer(setting)
    })
  },

  /** Populates group select options by fetching group metadata for slider (deprecated, use DialogBuilder) */
  async _populateSliderGroupOptions($select) {
    try {
      const groups = await PresetAPIService.fetchGroups()

      if (!groups || !Array.isArray(groups) || groups.length === 0) {
        // Fallback to default groups
        $select.append(
          jQuery('<option>', { value: 'fluid_spacing_presets', text: 'Spacing Presets' }),
          jQuery('<option>', { value: 'fluid_typography_presets', text: 'Typography Presets' })
        )
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
    } catch {
      // Fallback on error
      $select.append(
        jQuery('<option>', { value: 'fluid_spacing_presets', text: 'Spacing Presets' }),
        jQuery('<option>', { value: 'fluid_typography_presets', text: 'Typography Presets' })
      )
    }
  },

  /** Handles preset create confirmation for slider */
  async onConfirmCreatePreset(title, group, minValue, maxValue, _setting) {
    // Parse combined input values
    const minParsed = ValidationService.parseValueWithUnit(minValue)
    const maxParsed = ValidationService.parseValueWithUnit(maxValue)

    if (!minParsed || !maxParsed) {
      return
    }

    // Prepare data for AJAX
    const ajaxData = {
      title: title.trim() || `Custom ${minParsed.size}${minParsed.unit} ~ ${maxParsed.size}${maxParsed.unit}`,
      min_size: minParsed.size,
      min_unit: minParsed.unit,
      max_size: maxParsed.size,
      max_unit: maxParsed.unit,
      group: group || 'spacing'
    }

    try {
      const response = await PresetAPIService.savePreset(ajaxData)

      // Generate and inject CSS variable into preview immediately
      const clampFormula = generateClampFormula(
        minParsed.size,
        minParsed.unit,
        maxParsed.size,
        maxParsed.unit
      )
      cssManager.setCssVariable(response.id, clampFormula)

      // Invalidate cache to force fresh data fetch
      dataManager.invalidate()

      // Refresh preset dropdown
      await this._refreshSliderPresetDropdown()

      // Auto-select the new preset
      const presetValue = `var(${STYLES.VAR_PREFIX}${response.id})`
      this._selectSliderPreset(presetValue)
    } catch (error) {
      // Show error message
      elementorCommon.dialogsManager
        .createWidget('alert', {
          headerMessage: window.ArtsFluidDSStrings?.error,
          message: error || window.ArtsFluidDSStrings?.failedToSave
        })
        .show()
    }
  },

  /**
   * Handles edit icon click on a preset (slider)
   */
  async onEditPresetClick(selectEl, presetId) {
    const setting = selectEl.getAttribute('data-setting')

    // Find the option element with preset data
    const option = selectEl.querySelector(`option[data-id="${presetId}"]`)
    if (!option) {
      console.error('Preset option not found:', presetId)
      return
    }

    // Extract preset data using manager
    const presetData = PresetDialogManager.extractPresetData(option, presetId, setting)

    // Open dialog in edit mode
    const dialog = await this.openPresetDialog('edit', presetData)
    dialog.show()
  },

  /** Handles preset update confirmation (edit mode) for slider */
  async onConfirmUpdatePreset(presetId, title, groupId, minValue, maxValue) {
    // Parse combined input values
    const minParsed = ValidationService.parseValueWithUnit(minValue)
    const maxParsed = ValidationService.parseValueWithUnit(maxValue)

    if (!minParsed || !maxParsed) {
      return
    }

    // Generate and inject CSS immediately (before AJAX) to prevent flash of old values
    const clampFormula = generateClampFormula(
      minParsed.size,
      minParsed.unit,
      maxParsed.size,
      maxParsed.unit
    )
    cssManager.setCssVariable(presetId, clampFormula)

    const presetData = {
      preset_id: presetId,
      title: title.trim(),
      min_size: minParsed.size,
      min_unit: minParsed.unit,
      max_size: maxParsed.size,
      max_unit: maxParsed.unit,
      group: groupId
    }

    try {
      await PresetAPIService.updatePreset(presetData)

      // Invalidate cache
      dataManager.invalidate()

      // Refresh dropdowns to show updated values
      await this._refreshSliderPresetDropdown()
    } catch (error) {
      // Restore original CSS on error
      cssManager.restoreCssVariable(presetId)

      elementorCommon.dialogsManager
        .createWidget('alert', {
          headerMessage: window.ArtsFluidDSStrings?.error,
          message: error || 'Failed to update preset'
        })
        .show()
    }
  },

  /** Refreshes the slider preset dropdown */
  async _refreshSliderPresetDropdown() {
    await PresetDropdownManager.refreshDropdowns(this.ui.selectControls, this.el)
  },

  /** Selects a preset value in the slider dropdown */
  _selectSliderPreset(presetValue) {
    const selectEl = this.ui.selectControls[0]

    if (!selectEl) {
      return
    }

    // Update select element value and trigger Select2
    PresetDropdownManager.updateSelectValue(selectEl, presetValue)

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
    InheritanceAttributeManager.setupAttributes(
      fluidSelector,
      'size',
      this.model,
      () => this.getParentControlValue()
    )
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
