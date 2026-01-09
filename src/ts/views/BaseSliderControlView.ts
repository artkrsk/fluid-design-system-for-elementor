import { callSuper } from '../utils/backbone'
import { createElement } from '../utils/dom'
import { generateClampFormula, isInlineClampValue, parseClampFormula } from '../utils/clamp'
import { ValidationService } from '../utils/validation'
import { InlineInputManager } from '../utils/inlineInputs'
import { PresetDropdownManager } from '../utils/presetDropdown'
import { InheritanceAttributeManager } from '../utils/inheritanceAttributes'
import { PresetDialogManager } from '../managers/PresetDialogManager'
import { handleUpdatePreset, handleCreatePreset } from '../utils/presetActions'
import { CUSTOM_FLUID_VALUE } from '../constants'
import type { IInlineInputValues, IPresetDialogData } from '../interfaces'

/** Mixin for fluid unit support in Elementor slider controls */
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

    const inlineContainer = this._createSliderInlineInputsContainer(setting)
    inputWrapperEl.appendChild(inlineContainer)
  },

  /** Creates inline min/max input container */
  _createSliderInlineInputsContainer(this: any, setting: string): HTMLElement {
    const { container } = InlineInputManager.createContainer(
      setting,
      () => this._onSliderInlineInputChange(setting),
      () => this._onSliderSaveAsPresetClick(setting)
    )

    return container
  },

  _updateSliderSaveButtonState(this: any, container: HTMLElement): void {
    InlineInputManager.updateSaveButtonState(container)
  },

  async _onSliderSaveAsPresetClick(this: any, setting: string): Promise<void> {
    const values = this._getSliderInlineInputValues(setting)
    if (!values) {
      return
    }

    const { minSize, minUnit, maxSize, maxUnit } = values

    if (!minSize || !maxSize) {
      return
    }

    const container = this._getSliderInlineContainer(setting)
    const saveButton = container?.querySelector('.e-fluid-save-preset') as HTMLButtonElement | null
    const icon = saveButton?.querySelector('i')

    if (!container || !saveButton || !icon) {
      return
    }

    container.classList.add('e-fluid-loading')
    saveButton.disabled = true
    icon.className = 'eicon-spinner eicon-animation-spin'

    try {
      const dialog = await this.openPresetDialog('create', {
        setting,
        minSize: String(minSize),
        minUnit,
        maxSize: String(maxSize),
        maxUnit
      } as IPresetDialogData)
      ;(dialog as { show: () => void }).show()
    } finally {
      container.classList.remove('e-fluid-loading')
      saveButton.disabled = false
      icon.className = 'eicon-plus'
    }
  },

  async openPresetDialog(
    this: any,
    mode: 'create' | 'edit',
    data: IPresetDialogData
  ): Promise<unknown> {
    return PresetDialogManager.open(mode, data, {
      onCreate: (name: string, group: string, minVal: string, maxVal: string, setting: string) =>
        this.onConfirmCreatePreset(name, group, minVal, maxVal, setting),
      onUpdate: (presetId: string, name: string, group: string, minVal: string, maxVal: string) =>
        this.onConfirmUpdatePreset(presetId, name, group, minVal, maxVal),
      getInlineContainer: (setting: string) => this._getSliderInlineContainer(setting)
    })
  },

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

  async onEditPresetClick(this: any, selectEl: HTMLSelectElement, presetId: string): Promise<void> {
    const setting = selectEl.getAttribute('data-setting') ?? 'size'
    const option = selectEl.querySelector(`option[data-id="${presetId}"]`)
    if (!option) {
      return
    }

    const presetData = PresetDialogManager.extractPresetData(
      option as HTMLOptionElement,
      presetId,
      setting
    )
    const dialog = await this.openPresetDialog('edit', presetData)
    ;(dialog as { show: () => void }).show()
  },

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

  async _refreshSliderPresetDropdown(this: any): Promise<void> {
    await PresetDropdownManager.refreshDropdowns(this.ui.selectControls, this.el)
  },

  _selectSliderPreset(this: any, presetValue: string): void {
    const selectEl = this.ui.selectControls[0]

    if (!selectEl) {
      return
    }

    PresetDropdownManager.updateSelectValue(selectEl, presetValue)

    const newValue = {
      unit: 'fluid',
      size: presetValue
    }
    this.setValue(newValue)
    this._toggleSliderInlineInputs('size', false)
    this.ui.input.val(presetValue)
  },

  _validateSliderInlineInput(this: any, input: HTMLInputElement): boolean {
    return ValidationService.validateInputElement(input)
  },

  _getSliderInlineContainer(this: any, setting: string): HTMLElement | null {
    return this.$el[0].querySelector(`.e-fluid-inline-container[data-setting="${setting}"]`)
  },

  _toggleSliderInlineInputs(this: any, setting: string, show: boolean): void {
    const container = this._getSliderInlineContainer(setting)
    InlineInputManager.toggleVisibility(container, show)
  },

  _parseSliderValueWithUnit(this: any, value: string): { size: string; unit: string } | null {
    return ValidationService.parseValueWithUnit(value)
  },

  _getSliderInlineInputValues(this: any, setting: string): IInlineInputValues | null {
    const container = this._getSliderInlineContainer(setting)
    return InlineInputManager.getInputValues(container)
  },

  _setSliderInlineInputValues(
    this: any,
    setting: string,
    values: { minSize: string; minUnit: string; maxSize: string; maxUnit: string }
  ): void {
    const container = this._getSliderInlineContainer(setting)
    InlineInputManager.setInputValues(container, values)
  },

  initializeInlineInputsState(this: any): void {
    if (!this.ui.selectControls || this.ui.selectControls.length === 0) {
      return
    }

    for (const selectEl of this.ui.selectControls) {
      const setting = selectEl.getAttribute('data-setting') || 'size'
      const currentValue = this.getControlValue('size')
      const isCustomSelected = selectEl.value === CUSTOM_FLUID_VALUE
      const hasInlineClamp = isInlineClampValue(currentValue)

      if (isCustomSelected || hasInlineClamp) {
        const container = this._getSliderInlineContainer(setting)

        if (!container) {
          continue
        }

        this._toggleSliderInlineInputs(setting, true)

        if (hasInlineClamp) {
          const parsed = parseClampFormula(currentValue)
          if (parsed) {
            this._setSliderInlineInputValues(setting, parsed)
          }

          selectEl.value = CUSTOM_FLUID_VALUE
          selectEl.setAttribute('data-value', CUSTOM_FLUID_VALUE)
          jQuery(selectEl).trigger('change.select2')
        }
      }
    }
  },

  _onSliderInlineInputChange(this: any, setting: string): void {
    const values = this._getSliderInlineInputValues(setting)
    if (!values) {
      return
    }

    const { minSize, minUnit, maxSize, maxUnit } = values

    if (minSize && maxSize) {
      const clampValue = generateClampFormula(minSize, minUnit, maxSize, maxUnit)
      this.setValue('size', clampValue)
      this.setValue('unit', 'fluid')
      this.ui.input.val(clampValue)
    }
  },

  _setupSliderInheritanceAttributes(this: any, fluidSelector: HTMLSelectElement): void {
    InheritanceAttributeManager.setupAttributes(fluidSelector, 'size', this.model, () =>
      this.getParentControlValue()
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

    this._toggleSliderInlineInputs(setting, isCustomValue)

    // Don't set value yet for custom - wait for inline input
    if (isCustomValue) {
      selectEl.classList.remove('e-select-placeholder')
      selectEl.setAttribute('data-value', value)

      // Restore existing inline clamp value if present
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

      for (const selectEl of this.ui.selectControls || []) {
        if (selectEl.value === CUSTOM_FLUID_VALUE) {
          this._toggleSliderInlineInputs('size', true)
        }
      }
    }

    if (wasFluid && !isNowFluid) {
      this._toggleSliderInlineInputs('size', false)
    }
  },

  /** Traverses view hierarchy to check parent repeater type */
  _isInFluidPresetRepeater(this: any): boolean {
    try {
      const repeaterView = this._parent?._parent
      return repeaterView?.model?.get('is_fluid_preset_repeater') === true
    } catch {
      return false
    }
  },

  /** Preserves size value during unit switch for fluid preset repeater sliders */
  handleUnitChange(this: any): void {
    if (!this._isInFluidPresetRepeater()) {
      callSuper(this, 'handleUnitChange', arguments)
      return
    }

    const currentSize = this.getControlValue('size')
    callSuper(this, 'handleUnitChange', arguments)

    // Restore size after parent resets it
    if (currentSize !== '' && currentSize !== null && currentSize !== undefined) {
      this.setValue('size', currentSize)

      if (this.ui.input && this.ui.input.length) {
        this.ui.input.val(currentSize)
      }

      if (this.isSliderInitialized && this.isSliderInitialized()) {
        const slider = this.ui.slider?.[0]?.noUiSlider
        if (slider) {
          slider.set(currentSize)
        }
      }
    }
  }
}
