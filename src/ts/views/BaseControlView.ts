import { callSuper } from '../utils/backbone'
import { createElement } from '../utils/dom'
import { buildSelectOptions } from '../utils/preset'
import { getSelect2DefaultOptions } from '../utils/select2'
import { generateClampFormula, isInlineClampValue, parseClampFormula } from '../utils/clamp'
import { ValidationService, isEmptyControlValue, isCustomFluidValue } from '../utils/validation'
import { InlineInputManager } from '../utils/inlineInputs'
import { PresetDropdownManager } from '../utils/presetDropdown'
import { InheritanceAttributeManager } from '../utils/inheritanceAttributes'
import { PresetDialogManager } from '../managers/PresetDialogManager'
import { EditIconHandler } from '../utils/editIconHandler'
import { resolveInheritedValue } from '../utils/deviceInheritance'
import { handleUpdatePreset, handleCreatePreset } from '../utils/presetActions'
import { isFluidUnit, requiresTextInput, hasFluidInUnits } from '../utils/controls'
import { CUSTOM_FLUID_VALUE } from '../constants'
import type { IInlineInputValues, IPresetDialogData } from '../interfaces'

/** Mixin for fluid unit support in Elementor dimension/gap controls */
export const BaseControlView: Record<string, unknown> = {
  isDestroyed: false,
  abortControllers: new Map<string, AbortController>(),

  initialize(this: any): void {
    callSuper(this, 'initialize', arguments)
    this.isDestroyed = false
    this.abortControllers = new Map<string, AbortController>()
  },

  ui(this: any): Record<string, string> {
    const ui = callSuper(this, 'ui', arguments)
    ui.selectControls = '.elementor-control-fluid-selector'
    ui.dimensions = '.elementor-control-input-wrapper ul > li'

    return ui
  },

  async onRender(this: any): Promise<void> {
    callSuper(this, 'onRender')

    if (this.hasFluidUnit()) {
      await this.renderFluidSelector()
    }
  },

  onDestroy(this: any): void {
    this.isDestroyed = true

    if (this.abortControllers && this.abortControllers.size > 0) {
      for (const [_setting, controller] of this.abortControllers) {
        controller.abort()
      }
      this.abortControllers.clear()
    }

    callSuper(this, 'onDestroy')
  },

  hasRenderedFluidSelector(this: any): boolean {
    return this.ui.selectControls && this.ui.selectControls.length > 0
  },

  updatePlaceholderClassState(this: any): void {
    if (!this.ui.selectControls?.length) {
      return
    }

    for (const selectEl of this.ui.selectControls) {
      const value = selectEl.value
      const isEmptyValue = value === ''

      selectEl.classList.toggle('e-select-placeholder', isEmptyValue)

      if (isEmptyValue && selectEl.getAttribute('data-value') !== '') {
        selectEl.setAttribute('data-value', '')
      }
    }
  },

  async renderFluidSelector(this: any): Promise<void> {
    if (this.isDestroyed) {
      return
    }

    this.renderFluidSelectElements()
    this.addLoadingOptions()
    this.createSelect2()
    await this.populateSelectElements()
    this.attachSelectElementsListeners()
    this.initializeInlineInputsState()
  },

  initializeInlineInputsState(this: any): void {
    if (!this.ui.selectControls || !Array.isArray(this.ui.selectControls)) {
      return
    }

    const isLinked = this.isLinkedDimensions()
    let linkedClampValues: ReturnType<typeof parseClampFormula> = null

    for (const selectEl of this.ui.selectControls) {
      const setting = selectEl.getAttribute('data-setting')
      const currentValue = this.getControlValue(setting)
      const isCustomSelected = selectEl.value === CUSTOM_FLUID_VALUE
      const hasInlineClamp = isInlineClampValue(currentValue)

      if (isCustomSelected || hasInlineClamp) {
        const container = this.getInlineContainer(setting)
        if (!container) {
          continue
        }

        this.toggleInlineInputs(setting, true)

        if (hasInlineClamp) {
          const parsed = parseClampFormula(currentValue)
          if (parsed) {
            this.setInlineInputValues(setting, parsed)
            if (isLinked && !linkedClampValues) {
              linkedClampValues = parsed
            }
          }
        }

        if (hasInlineClamp) {
          selectEl.value = CUSTOM_FLUID_VALUE
          selectEl.setAttribute('data-value', CUSTOM_FLUID_VALUE)
          jQuery(selectEl).trigger('change.select2')
        }
      }
    }

    if (isLinked && linkedClampValues) {
      for (const selectEl of this.ui.selectControls) {
        const setting = selectEl.getAttribute('data-setting')
        if (setting) {
          const container = this.getInlineContainer(setting)
          if (container) {
            this.toggleInlineInputs(setting, true)
            this.setInlineInputValues(setting, linkedClampValues)
            selectEl.value = CUSTOM_FLUID_VALUE
            selectEl.setAttribute('data-value', CUSTOM_FLUID_VALUE)
            jQuery(selectEl).trigger('change.select2')
          }
        }
      }
    }
  },

  addLoadingOptions(this: any): void {
    if (this.isDestroyed) {
      return
    }

    for (const selectEl of this.ui.selectControls) {
      if (this.isDestroyed) {
        return
      }

      const loadingOption = createElement('option', 'elementor-loading-option', {
        value: '',
        disabled: 'disabled',
        selected: 'selected'
      })

      loadingOption.textContent = 'Loading...'

      selectEl.appendChild(loadingOption)
      selectEl.classList.add('is-loading')
    }
  },

  createSelect2(this: any): void {
    if (this.isDestroyed) {
      return
    }

    const select2Options = getSelect2DefaultOptions()

    for (const selectEl of this.ui.selectControls) {
      if (this.isDestroyed) {
        return
      }

      ;(jQuery(selectEl).select2(select2Options as any) as unknown as JQuery).on('change', () => {
        this.onSelectChange(selectEl)
      })

      const editIconHandler = new EditIconHandler(selectEl, (presetId: string) =>
        this.onEditPresetClick(selectEl, presetId)
      )
      editIconHandler.attach()
    }
  },

  async populateSelectElements(this: any): Promise<void> {
    if (this.isDestroyed) {
      return
    }

    for (const selectEl of this.ui.selectControls) {
      if (this.isDestroyed) {
        return
      }

      await buildSelectOptions(selectEl, this.el)
      jQuery(selectEl).trigger('change.select2')
    }
  },

  onSelectChange(this: any, selectEl: HTMLSelectElement): void {
    const value = selectEl.value
    const isInheritValue = value === ''
    const isCustomValue = value === CUSTOM_FLUID_VALUE
    const dimensionName = selectEl.getAttribute('data-setting')

    this.toggleInlineInputs(dimensionName, isCustomValue)

    // Don't set value yet for custom - wait for inline input
    if (isCustomValue) {
      selectEl.classList.remove('e-select-placeholder')
      selectEl.setAttribute('data-value', value)

      if (this.isLinkedDimensions()) {
        for (const otherSelectEl of this.ui.selectControls || []) {
          if (otherSelectEl !== selectEl) {
            const otherSetting = otherSelectEl.getAttribute('data-setting')
            if (otherSetting) {
              otherSelectEl.value = CUSTOM_FLUID_VALUE
              otherSelectEl.setAttribute('data-value', CUSTOM_FLUID_VALUE)
              jQuery(otherSelectEl).trigger('change.select2')
              this.toggleInlineInputs(otherSetting, true)
            }
          }
        }
      }

      const currentValue = this.getControlValue(dimensionName)
      if (isInlineClampValue(currentValue)) {
        const parsed = parseClampFormula(currentValue)
        if (parsed) {
          this.setInlineInputValues(dimensionName, parsed)
        }
      }
      return
    }

    const newValue: Record<string, string> = {
      unit: 'fluid',
      [dimensionName as string]: value
    }

    selectEl.classList.toggle('e-select-placeholder', isInheritValue)
    selectEl.setAttribute('data-value', value)
    this.setValue(newValue)

    if (this.isLinkedDimensions()) {
      this.handleLinkedDimensionsChange(selectEl, value, isInheritValue)

      for (const otherSelectEl of this.ui.selectControls || []) {
        const otherSetting = otherSelectEl.getAttribute('data-setting')
        if (otherSetting) {
          this.toggleInlineInputs(otherSetting, false)
        }
      }
    } else {
      this.handleUnlinkedDimensionsChange(dimensionName, value)
    }

    this.updateDimensions()
  },

  handleLinkedDimensionsChange(
    this: any,
    selectEl: HTMLSelectElement,
    value: string,
    isInheritValue: boolean
  ): void {
    this.ui.controls.val(value)

    for (const el of this.ui.selectControls) {
      if (el !== selectEl) {
        el.value = value
        el.setAttribute('data-value', value)
        el.classList.toggle('e-select-placeholder', isInheritValue)
        jQuery(el).trigger('change.select2')
      }
    }
  },

  handleUnlinkedDimensionsChange(this: any, dimensionName: string, value: string): void {
    const relatedInputEl = this.ui.controls.filter(`[data-setting="${dimensionName}"]`)
    relatedInputEl.val(value)
    relatedInputEl.trigger('change')
  },

  updateUnitChoices(this: any): void {
    const unit = this.getControlValue('unit')
    const wasFluid = this.$el.hasClass('e-units-fluid')
    const isNowFluid = unit === 'fluid'

    this.ui.unitSwitcher.attr('data-selected', unit).find('span').html(unit)
    this.$el.toggleClass('e-units-custom', this.isCustomUnit())
    this.$el.toggleClass('e-units-fluid', isNowFluid)

    const inputType = this.isCustomUnit() ? 'text' : 'number'
    this.ui.controls.attr('type', inputType)

    if (isNowFluid) {
      this.updatePlaceholderClassState()

      for (const selectEl of this.ui.selectControls || []) {
        if (selectEl.value === CUSTOM_FLUID_VALUE) {
          const setting = selectEl.getAttribute('data-setting')
          if (setting) {
            this.toggleInlineInputs(setting, true)
          }
        }
      }
    }

    if (wasFluid && !isNowFluid) {
      for (const selectEl of this.ui.selectControls || []) {
        const setting = selectEl.getAttribute('data-setting')
        if (setting) {
          this.toggleInlineInputs(setting, false)
        }
      }
    }
  },

  onLinkDimensionsClicked(this: any, evt: Event): void {
    evt.preventDefault()
    evt.stopPropagation()

    this.ui.link.toggleClass('unlinked')

    this.setValue('isLinked', !this.ui.link.hasClass('unlinked'))

    if (this.isLinkedDimensions()) {
      const value = this.ui.controls.eq(0).val()
      this.ui.controls.val(value)
      for (const selectEl of this.ui.selectControls) {
        selectEl.value = value
        jQuery(selectEl).trigger('change.select2')
      }
    }

    this.updateDimensions()
  },

  renderFluidSelectElements(this: any): void {
    if (this.isDestroyed) {
      return
    }

    if (!this.ui.selectControls || !Array.isArray(this.ui.selectControls)) {
      this.ui.selectControls = []
    }

    for (const dimension of this.ui.dimensions) {
      const inputEl = dimension.querySelector('input[type="text"], input[type="number"]')
      const labelEl = dimension.querySelector('label')

      if (!inputEl || !labelEl) {
        continue
      }

      const fluidSelector = dimension.querySelector('.elementor-control-fluid-selector')
      const fluidSelectorContainer = dimension.querySelector(
        '.elementor-control-fluid-selector-container'
      )

      if (!fluidSelector || !fluidSelectorContainer) {
        this.createFluidSelector(dimension, inputEl, labelEl)
      }
    }
  },

  createFluidSelector(
    this: any,
    dimension: Element,
    inputEl: HTMLInputElement,
    labelEl: HTMLLabelElement
  ): void {
    const setting = inputEl.dataset.setting ?? ''

    // Check if containers already exist (prevent duplicates during re-render)
    const existingSelector = dimension.querySelector('.elementor-control-fluid-selector-container')
    const existingInline = dimension.querySelector('.e-fluid-inline-container')
    if (existingSelector || existingInline) {
      return
    }

    const fluidSelectorContainer = createElement(
      'div',
      'elementor-control-fluid-selector-container'
    )
    const fluidSelector = createElement('select', 'elementor-control-fluid-selector', {
      'data-setting': setting,
      'data-value': inputEl.value
    })

    this.setupInheritanceAttributes(fluidSelector, setting)
    fluidSelectorContainer.appendChild(fluidSelector)

    this.ui.selectControls.push(fluidSelector)

    dimension.appendChild(fluidSelectorContainer)

    const inlineContainer = this.createInlineInputsContainer(setting)
    dimension.appendChild(inlineContainer)

    dimension.appendChild(labelEl)
  },

  /** Creates inline min/max input container */
  createInlineInputsContainer(this: any, setting: string): HTMLElement {
    const { container, abortController } = InlineInputManager.createContainer(
      setting,
      () => this.onInlineInputChange(setting),
      () => this.onSaveAsPresetClick(setting)
    )

    this.abortControllers.set(setting, abortController)

    return container
  },

  /** Updates Save button disabled state based on input validity */
  updateSaveButtonState(this: any, container: HTMLElement): void {
    InlineInputManager.updateSaveButtonState(container)
  },

  /** Handles Save as Preset button click */
  async onSaveAsPresetClick(this: any, setting: string): Promise<void> {
    const values = this.getInlineInputValues(setting)
    if (!values) {
      return
    }

    const { minSize, minUnit, maxSize, maxUnit } = values

    if (!minSize || !maxSize) {
      return
    }

    const container = this.getInlineContainer(setting)
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
      })
      dialog.show()
    } finally {
      container.classList.remove('e-fluid-loading')
      saveButton.disabled = false
      icon.className = 'eicon-plus'
    }
  },

  /** Opens unified preset dialog (delegates to PresetDialogManager) */
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
      getInlineContainer: (setting: string) => this.getInlineContainer(setting)
    })
  },

  /** Handles preset create confirmation */
  async onConfirmCreatePreset(
    this: any,
    title: string,
    group: string,
    minValue: string,
    maxValue: string,
    setting: string
  ): Promise<void> {
    await handleCreatePreset(title, group, minValue, maxValue, setting, {
      refreshDropdowns: () => this.refreshPresetDropdowns(),
      selectPreset: (s: string, v: string) => this.selectPreset(s, v),
      getLinkedSelects: () => {
        if (!this.isLinkedDimensions()) {
          return []
        }
        return (this.ui.selectControls || []).map((el: HTMLSelectElement) => ({
          setting: el.getAttribute('data-setting') ?? ''
        }))
      }
    })
  },

  /** Handles edit icon click on a preset */
  async onEditPresetClick(this: any, selectEl: HTMLSelectElement, presetId: string): Promise<void> {
    const setting = selectEl.getAttribute('data-setting') ?? ''
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
    dialog.show()
  },

  /** Handles preset update confirmation (edit mode) */
  async onConfirmUpdatePreset(
    this: any,
    presetId: string,
    title: string,
    groupId: string,
    minValue: string,
    maxValue: string
  ): Promise<void> {
    await handleUpdatePreset(presetId, title, groupId, minValue, maxValue, () =>
      this.refreshPresetDropdowns()
    )
  },

  /** Refreshes all preset dropdowns in the control */
  async refreshPresetDropdowns(this: any): Promise<void> {
    await PresetDropdownManager.refreshDropdowns(this.ui.selectControls, this.el)
  },

  /** Selects a preset value in the dropdown and updates control */
  selectPreset(this: any, setting: string, presetValue: string): void {
    const selectEl = this.ui.selectControls.find(
      (el: HTMLSelectElement) => el.getAttribute('data-setting') === setting
    )

    if (!selectEl) {
      return
    }

    PresetDropdownManager.updateSelectValue(selectEl, presetValue)

    const newValue = {
      unit: 'fluid',
      [setting]: presetValue
    }
    this.setValue(newValue)

    this.toggleInlineInputs(setting, false)
  },

  /** Validates an inline input and toggles invalid state */
  validateInlineInput(this: any, input: HTMLInputElement): boolean {
    return ValidationService.validateInputElement(input)
  },

  /** Gets the inline container for a specific setting */
  getInlineContainer(this: any, setting: string): HTMLElement | null {
    return this.$el[0].querySelector(`.e-fluid-inline-container[data-setting="${setting}"]`)
  },

  /** Toggles visibility of inline inputs */
  toggleInlineInputs(this: any, setting: string, show: boolean): void {
    const container = this.getInlineContainer(setting)
    InlineInputManager.toggleVisibility(container, show)
  },

  /** Parses a value with unit like "20px" or "1.5rem" */
  parseValueWithUnit(this: any, value: string): { size: string; unit: string } | null {
    return ValidationService.parseValueWithUnit(value)
  },

  /** Gets inline input values for a setting */
  getInlineInputValues(this: any, setting: string): IInlineInputValues | null {
    const container = this.getInlineContainer(setting)
    return InlineInputManager.getInputValues(container)
  },

  /** Sets inline input values (used when loading existing inline value) */
  setInlineInputValues(
    this: any,
    setting: string,
    values: { minSize: string; minUnit: string; maxSize: string; maxUnit: string }
  ): void {
    const container = this.getInlineContainer(setting)
    InlineInputManager.setInputValues(container, values)
  },

  /** Handles inline input value changes */
  onInlineInputChange(this: any, setting: string): void {
    const values = this.getInlineInputValues(setting)
    if (!values) {
      return
    }

    const { minSize, minUnit, maxSize, maxUnit } = values

    if (minSize && maxSize) {
      const clampValue = generateClampFormula(minSize, minUnit, maxSize, maxUnit)

      const newValue: Record<string, string> = {
        unit: 'fluid',
        [setting]: clampValue
      }

      if (this.isLinkedDimensions()) {
        const linkedContainers: HTMLElement[] = []

        for (const selectEl of this.ui.selectControls || []) {
          const otherSetting = selectEl.getAttribute('data-setting')
          if (otherSetting && otherSetting !== setting) {
            newValue[otherSetting] = clampValue

            const otherContainer = this.getInlineContainer(otherSetting)
            if (otherContainer) {
              linkedContainers.push(otherContainer)
              const linkedInputEl = this.ui.controls.filter(`[data-setting="${otherSetting}"]`)
              linkedInputEl.val(clampValue)
            }
          }
        }

        if (linkedContainers.length > 0) {
          InlineInputManager.syncLinkedContainers(linkedContainers, {
            minSize,
            minUnit,
            maxSize,
            maxUnit
          })
        }
      }

      this.setValue(newValue)

      const relatedInputEl = this.ui.controls.filter(`[data-setting="${setting}"]`)
      relatedInputEl.val(clampValue)

      this.updateDimensions()
    }
  },

  /** Checks if a value is a custom inline value */
  isCustomFluidValue(this: any, value: string): boolean {
    return isCustomFluidValue(value)
  },

  setupInheritanceAttributes(this: any, fluidSelector: HTMLSelectElement, setting: string): void {
    InheritanceAttributeManager.setupAttributes(fluidSelector, setting, this.model, () =>
      this.getParentControlValue()
    )
  },

  getParentControlValue(this: any): unknown {
    if (!this.model.get('responsive')) {
      return null
    }

    try {
      const controlName = this.model.get('name')
      const deviceOrder = window.elementor?.breakpoints.getActiveBreakpointsList({
        largeToSmall: true,
        withDesktop: true
      })

      if (!deviceOrder) {
        return null
      }

      // Control-specific isEmptyValue handles different value shapes
      return resolveInheritedValue(
        controlName,
        deviceOrder,
        (name: string) => this._getControlValue(name),
        (value: unknown) => this.isEmptyValue(value)
      )
    } catch {
      return null
    }
  },

  isEmptyValue(this: any, value: unknown): boolean {
    return isEmptyControlValue(value as Record<string, any> | null | undefined)
  },

  _getControlValue(this: any, controlName: string): unknown {
    if (this.options?.elementSettingsModel) {
      const controlValue = this.options.elementSettingsModel.get(controlName)
      if (controlValue) {
        return controlValue
      }
    }

    if (this.container?.settings) {
      const controlValue = this.container.settings.get(controlName)
      if (controlValue) {
        return controlValue
      }
    }

    const settings = this.model.get('settings')
    if (settings?.get) {
      const controlValue = settings.get(controlName)
      if (controlValue) {
        return controlValue
      }
    }

    return null
  },

  attachSelectElementsListeners(this: any): void {
    if (this.isDestroyed) {
      return
    }

    for (const selectEl of this.ui.selectControls) {
      if (this.isDestroyed) {
        return
      }

      selectEl.addEventListener('change', this.onSelectChange.bind(this, selectEl))
    }
  },

  getCurrentUnit(this: any): string {
    return this.getControlValue('unit')
  },

  isFluidUnit(this: any): boolean {
    return isFluidUnit(this.getCurrentUnit())
  },

  hasFluidUnit(this: any): boolean {
    return hasFluidInUnits(this.model.get('size_units'))
  },

  isCustomUnit(this: any): boolean {
    return requiresTextInput(this.getCurrentUnit())
  }
}
