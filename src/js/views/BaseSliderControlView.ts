import { callSuper } from '../utils/backbone'
import { createElement } from '../utils/dom'
import { generateClampFormula, isInlineClampValue, parseClampFormula } from '../utils/clamp'
import { ValidationService } from '../utils/validation'
import { InlineInputManager } from '../utils/inlineInputs'
import { PresetDropdownManager } from '../utils/presetDropdown'
import { PresetAPIService } from '../services/presetAPI'
import { InheritanceAttributeManager } from '../utils/inheritanceAttributes'
import { PresetDialogManager } from '../managers/PresetDialogManager'
import { handleUpdatePreset, handleCreatePreset } from '../utils/presetActions'
import { CUSTOM_FLUID_VALUE } from '../constants'
import type { IInlineInputValues, IPresetDialogData } from '../interfaces'

export const BaseSliderControlView: Record<string, unknown> = {
  renderFluidSelectElements(this: any): void {
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

  _createSliderFluidSelector(this: any, inputWrapperEl: Element, inputEl: HTMLInputElement): void {
    const setting = inputEl.dataset.setting ?? ''
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
  _createSliderInlineInputsContainer(this: any, setting: string): HTMLElement {
    const { container } = InlineInputManager.createContainer(
      setting,
      () => this._onSliderInlineInputChange(setting),
      () => this._onSliderSaveAsPresetClick(setting)
    )

    return container
  },

  /** Updates Save button disabled state based on input validity for slider */
  _updateSliderSaveButtonState(this: any, container: HTMLElement): void {
    InlineInputManager.updateSaveButtonState(container)
  },

  /** Handles Save as Preset button click for slider */
  async _onSliderSaveAsPresetClick(this: any, setting: string): Promise<void> {
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
    const saveButton = container?.querySelector('.e-fluid-save-preset') as HTMLButtonElement | null
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
      } as IPresetDialogData)
      ;(dialog as { show: () => void }).show()
    } finally {
      // Restore normal state
      container.classList.remove('e-fluid-loading')
      saveButton.disabled = false
      icon.className = 'eicon-plus'
    }
  },

  /** Opens unified preset dialog (delegates to PresetDialogManager) */
  async openPresetDialog(this: any, mode: 'create' | 'edit', data: IPresetDialogData): Promise<unknown> {
    return PresetDialogManager.open(mode, data, {
      onCreate: (name: string, group: string, minVal: string, maxVal: string, setting: string) =>
        this.onConfirmCreatePreset(name, group, minVal, maxVal, setting),
      onUpdate: (presetId: string, name: string, group: string, minVal: string, maxVal: string) =>
        this.onConfirmUpdatePreset(presetId, name, group, minVal, maxVal),
      getInlineContainer: (setting: string) => this._getSliderInlineContainer(setting)
    })
  },

  /** Populates group select options by fetching group metadata for slider (deprecated, use DialogBuilder) */
  async _populateSliderGroupOptions(this: any, $select: JQuery): Promise<void> {
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
  async onConfirmCreatePreset(
    this: any,
    title: string,
    group: string,
    minValue: string,
    maxValue: string,
    _setting: string
  ): Promise<void> {
    await handleCreatePreset(title, group, minValue, maxValue, 'size', {
      refreshDropdowns: () => this._refreshSliderPresetDropdown(),
      selectPreset: (_s: string, v: string) => this._selectSliderPreset(v)
    })
  },

  /** Handles edit icon click on a preset (slider) */
  async onEditPresetClick(this: any, selectEl: HTMLSelectElement, presetId: string): Promise<void> {
    const setting = selectEl.getAttribute('data-setting') ?? 'size'

    // Find the option element with preset data
    const option = selectEl.querySelector(`option[data-id="${presetId}"]`)
    if (!option) {
      return
    }

    // Extract preset data using manager
    const presetData = PresetDialogManager.extractPresetData(option as HTMLOptionElement, presetId, setting)

    // Open dialog in edit mode
    const dialog = await this.openPresetDialog('edit', presetData)
    ;(dialog as { show: () => void }).show()
  },

  /** Handles preset update confirmation (edit mode) for slider */
  async onConfirmUpdatePreset(
    this: any,
    presetId: string,
    title: string,
    groupId: string,
    minValue: string,
    maxValue: string
  ): Promise<void> {
    await handleUpdatePreset(presetId, title, groupId, minValue, maxValue, () =>
      this._refreshSliderPresetDropdown()
    )
  },

  /** Refreshes the slider preset dropdown */
  async _refreshSliderPresetDropdown(this: any): Promise<void> {
    await PresetDropdownManager.refreshDropdowns(this.ui.selectControls, this.el)
  },

  /** Selects a preset value in the slider dropdown */
  _selectSliderPreset(this: any, presetValue: string): void {
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
  _validateSliderInlineInput(this: any, input: HTMLInputElement): boolean {
    return ValidationService.validateInputElement(input)
  },

  /** Gets the inline container for slider */
  _getSliderInlineContainer(this: any, setting: string): HTMLElement | null {
    return this.$el[0].querySelector(`.e-fluid-inline-container[data-setting="${setting}"]`)
  },

  /** Toggles visibility of inline inputs for slider */
  _toggleSliderInlineInputs(this: any, setting: string, show: boolean): void {
    const container = this._getSliderInlineContainer(setting)
    InlineInputManager.toggleVisibility(container, show)
  },

  /** Parses a value with unit like "20px" or "1.5rem" */
  _parseSliderValueWithUnit(this: any, value: string): { size: string; unit: string } | null {
    return ValidationService.parseValueWithUnit(value)
  },

  /** Gets inline input values for slider */
  _getSliderInlineInputValues(this: any, setting: string): IInlineInputValues | null {
    const container = this._getSliderInlineContainer(setting)
    return InlineInputManager.getInputValues(container)
  },

  /** Sets inline input values for slider */
  _setSliderInlineInputValues(
    this: any,
    setting: string,
    values: { minSize: string; minUnit: string; maxSize: string; maxUnit: string }
  ): void {
    const container = this._getSliderInlineContainer(setting)
    InlineInputManager.setInputValues(container, values)
  },

  /** Initialize inline inputs state for slider on render */
  initializeInlineInputsState(this: any): void {
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
  _onSliderInlineInputChange(this: any, setting: string): void {
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

  _setupSliderInheritanceAttributes(this: any, fluidSelector: HTMLSelectElement): void {
    InheritanceAttributeManager.setupAttributes(
      fluidSelector,
      'size',
      this.model,
      () => this.getParentControlValue()
    )
  },

  isEmptyValue(this: any, value: { size?: string | null } | null | undefined): boolean {
    if (!value) {
      return true
    }

    return value.size === '' || value.size === null || value.size === undefined
  },

  onSelectChange(this: any, selectEl: HTMLSelectElement): void {
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

  updateUnitChoices(this: any): void {
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

  /** Check if this slider control is inside a fluid preset repeater */
  _isInFluidPresetRepeater(this: any): boolean {
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
   */
  handleUnitChange(this: any): void {
    // Only apply the fix for fluid preset repeater sliders
    if (!this._isInFluidPresetRepeater()) {
      callSuper(this, 'handleUnitChange', arguments)
      return
    }

    // Get current size before any changes
    const currentSize = this.getControlValue('size')

    // Call parent's handleUnitChange which will reset the size
    callSuper(this, 'handleUnitChange', arguments)

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
