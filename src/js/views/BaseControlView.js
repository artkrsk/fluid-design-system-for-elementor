import { createElement } from '../utils/dom'
import { buildSelectOptions } from '../utils/preset'
import { getSelect2DefaultOptions } from '../utils/select2'
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

export const BaseControlView = {
  isDestroyed: false,
  abortControllers: new Map(),

  initialize() {
    // @ts-expect-error - Type assertion for super access
    this.constructor.__super__.initialize.apply(this, arguments)
    this.isDestroyed = false
    this.abortControllers = new Map()
  },

  ui() {
    // @ts-expect-error - Type assertion for super access
    const ui = this.constructor.__super__.ui.apply(this, arguments)
    ui.selectControls = '.elementor-control-fluid-selector'
    ui.dimensions = '.elementor-control-input-wrapper ul > li'

    return ui
  },

  async onRender() {
    // @ts-expect-error - Type assertion for super access
    this.constructor.__super__.onRender.call(this)

    if (this.hasFluidUnit()) {
      await this.renderFluidSelector()
    }
  },

  onDestroy() {
    this.isDestroyed = true

    // Clean up inline input event listeners using AbortController
    if (this.abortControllers && this.abortControllers.size > 0) {
      for (const [_setting, controller] of this.abortControllers) {
        controller.abort()
      }
      this.abortControllers.clear()
    }

    // @ts-expect-error - Type assertion for super access
    this.constructor.__super__.onDestroy.call(this)
  },

  hasRenderedFluidSelector() {
    // @ts-expect-error - Type assertion for ui access
    return this.ui.selectControls.length > 0
  },

  updatePlaceholderClassState() {
    // @ts-expect-error - Type assertion for ui access
    if (!this.ui.selectControls?.length) {
      return
    }

    // @ts-expect-error - Type assertion for ui access
    for (const selectEl of this.ui.selectControls) {
      const value = selectEl.value
      const isEmptyValue = value === ''

      selectEl.classList.toggle('e-select-placeholder', isEmptyValue)

      if (isEmptyValue && selectEl.getAttribute('data-value') !== '') {
        selectEl.setAttribute('data-value', '')
      }
    }
  },

  async renderFluidSelector() {
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

  /** Initialize inline inputs visibility based on current value */
  initializeInlineInputsState() {
    // @ts-expect-error - Type assertion for ui access
    if (!this.ui.selectControls || !Array.isArray(this.ui.selectControls)) {
      return
    }

    // Check if dimensions are linked
    const isLinked = this.isLinkedDimensions()
    let linkedClampValues = null

    // @ts-expect-error - Type assertion for ui access
    for (const selectEl of this.ui.selectControls) {
      const setting = selectEl.getAttribute('data-setting')
      const currentValue = this.getControlValue(setting)

      // Show inputs if custom value is selected OR if value is inline clamp
      const isCustomSelected = selectEl.value === CUSTOM_FLUID_VALUE
      const hasInlineClamp = isInlineClampValue(currentValue)

      if (isCustomSelected || hasInlineClamp) {
        // Verify container exists before trying to manipulate it
        const container = this.getInlineContainer(setting)
        if (!container) {
          continue
        }

        this.toggleInlineInputs(setting, true)

        // Populate inputs if there's a clamp formula
        if (hasInlineClamp) {
          const parsed = parseClampFormula(currentValue)
          if (parsed) {
            this.setInlineInputValues(setting, parsed)

            // Store for linked sync
            if (isLinked && !linkedClampValues) {
              linkedClampValues = parsed
            }
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

    // If linked and we found clamp values, sync to all dimensions
    if (isLinked && linkedClampValues) {
      // @ts-expect-error - Type assertion for ui access
      for (const selectEl of this.ui.selectControls) {
        const setting = selectEl.getAttribute('data-setting')
        if (setting) {
          const container = this.getInlineContainer(setting)
          if (container) {
            // Show inputs and set values
            this.toggleInlineInputs(setting, true)
            this.setInlineInputValues(setting, linkedClampValues)

            // Ensure Custom value is selected
            selectEl.value = CUSTOM_FLUID_VALUE
            selectEl.setAttribute('data-value', CUSTOM_FLUID_VALUE)
            jQuery(selectEl).trigger('change.select2')
          }
        }
      }
    }
  },

  addLoadingOptions() {
    if (this.isDestroyed) {
      return
    }

    // @ts-expect-error - Type assertion for ui access
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

  createSelect2() {
    if (this.isDestroyed) {
      return
    }

    const select2Options = getSelect2DefaultOptions()

    // @ts-expect-error - Type assertion for ui access
    for (const selectEl of this.ui.selectControls) {
      if (this.isDestroyed) {
        return
      }

      jQuery(selectEl)
        .select2(select2Options)
        .on('change', () => {
          this.onSelectChange(selectEl)
        })
        .on('select2:selecting', (e) => {
          // Intercept selection to check if click was on edit icon
          // Note: This doesn't fire for currently selected items
          // @ts-expect-error - Select2 event params type
          const clickEvent = e.params.args.originalEvent
          if (clickEvent && clickEvent.target) {
            // Check if click was on edit icon
            const $clicked = jQuery(clickEvent.target)
            const $icon = $clicked.hasClass('e-fluid-preset-edit-icon')
              ? $clicked
              : $clicked.closest('.e-fluid-preset-edit-icon')

            if ($icon.length) {
              // Prevent Select2 from selecting the option
              e.preventDefault()

              // Extract preset ID
              const presetId = $icon.data('preset-id')

              // Close dropdown first, then open dialog after close completes
              jQuery(selectEl).one('select2:close', () => {
                // Open dialog after dropdown closes to avoid conflicts
                setTimeout(() => {
                  this.onEditPresetClick(selectEl, presetId)
                }, 50)
              })

              // Manually close dropdown
              jQuery(selectEl).select2('close')
            }
          }
        })
        .on('select2:open', () => {
          // Handle edit icon clicks on currently selected item
          // select2:selecting doesn't fire for current selection, so use mousedown
          setTimeout(() => {
            const $dropdown = jQuery('.select2-dropdown')
            $dropdown.on('mousedown.fluidEdit', '.e-fluid-preset-edit-icon', (e) => {
              e.stopPropagation()
              e.stopImmediatePropagation()
              e.preventDefault()

              const presetId = jQuery(e.currentTarget).data('preset-id')

              // Close dropdown first, then open dialog
              jQuery(selectEl).one('select2:close', () => {
                setTimeout(() => {
                  this.onEditPresetClick(selectEl, presetId)
                }, 50)
              })

              jQuery(selectEl).select2('close')
            })
          }, 10)
        })
        .on('select2:close', () => {
          // Clean up mousedown handler
          jQuery('.select2-dropdown').off('mousedown.fluidEdit')
        })
    }
  },

  async populateSelectElements() {
    if (this.isDestroyed) {
      return
    }

    // @ts-expect-error - Type assertion for ui access
    for (const selectEl of this.ui.selectControls) {
      if (this.isDestroyed) {
        return
      }

      await buildSelectOptions(selectEl, this.el)
      jQuery(selectEl).trigger('change.select2')
    }
  },

  onSelectChange(selectEl) {
    const value = selectEl.value
    const isInheritValue = value === ''
    const isCustomValue = value === CUSTOM_FLUID_VALUE
    const dimensionName = selectEl.getAttribute('data-setting')

    // Toggle inline inputs visibility
    this.toggleInlineInputs(dimensionName, isCustomValue)

    // If custom is selected, don't set value yet - wait for inline input
    if (isCustomValue) {
      selectEl.classList.remove('e-select-placeholder')
      selectEl.setAttribute('data-value', value)

      // If linked, show custom on all dimensions
      if (this.isLinkedDimensions()) {
        // @ts-expect-error - Type assertion for ui access
        for (const otherSelectEl of this.ui.selectControls || []) {
          if (otherSelectEl !== selectEl) {
            const otherSetting = otherSelectEl.getAttribute('data-setting')
            if (otherSetting) {
              // Switch to custom value
              otherSelectEl.value = CUSTOM_FLUID_VALUE
              otherSelectEl.setAttribute('data-value', CUSTOM_FLUID_VALUE)
              jQuery(otherSelectEl).trigger('change.select2')
              // Show inline inputs
              this.toggleInlineInputs(otherSetting, true)
            }
          }
        }
      }

      // Check if there's an existing inline value to restore
      const currentValue = this.getControlValue(dimensionName)
      if (isInlineClampValue(currentValue)) {
        const parsed = parseClampFormula(currentValue)
        if (parsed) {
          this.setInlineInputValues(dimensionName, parsed)
        }
      }
      return
    }

    const newValue = {
      unit: 'fluid',
      [dimensionName]: value
    }

    selectEl.classList.toggle('e-select-placeholder', isInheritValue)
    selectEl.setAttribute('data-value', value)
    this.setValue(newValue)

    if (this.isLinkedDimensions()) {
      this.handleLinkedDimensionsChange(selectEl, value, isInheritValue)

      // Hide inline inputs for all linked dimensions when switching away from custom
      // @ts-expect-error - Type assertion for ui access
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

  handleLinkedDimensionsChange(selectEl, value, isInheritValue) {
    // @ts-expect-error - Type assertion for ui access
    this.ui.controls.val(value)

    // @ts-expect-error - Type assertion for ui access
    for (const el of this.ui.selectControls) {
      if (el !== selectEl) {
        el.value = value
        el.setAttribute('data-value', value)
        el.classList.toggle('e-select-placeholder', isInheritValue)
        jQuery(el).trigger('change.select2')
      }
    }
  },

  handleUnlinkedDimensionsChange(dimensionName, value) {
    // @ts-expect-error - Type assertion for ui access
    const relatedInputEl = this.ui.controls.filter(`[data-setting="${dimensionName}"]`)
    relatedInputEl.val(value)
    relatedInputEl.trigger('change')
  },

  updateUnitChoices() {
    const unit = this.getControlValue('unit')
    const wasFluid = this.$el.hasClass('e-units-fluid')
    const isNowFluid = unit === 'fluid'

    // @ts-expect-error - Type assertion for ui access
    this.ui.unitSwitcher.attr('data-selected', unit).find('span').html(unit)
    this.$el.toggleClass('e-units-custom', this.isCustomUnit())
    this.$el.toggleClass('e-units-fluid', isNowFluid)

    const inputType = this.isCustomUnit() ? 'text' : 'number'
    // @ts-expect-error - Type assertion for ui access
    this.ui.controls.attr('type', inputType)

    if (isNowFluid) {
      this.updatePlaceholderClassState()

      // Show inline inputs if Custom value is selected
      // @ts-expect-error - Type assertion for ui access
      for (const selectEl of this.ui.selectControls || []) {
        if (selectEl.value === CUSTOM_FLUID_VALUE) {
          const setting = selectEl.getAttribute('data-setting')
          if (setting) {
            this.toggleInlineInputs(setting, true)
          }
        }
      }
    }

    // Hide inline inputs when switching away from fluid unit
    if (wasFluid && !isNowFluid) {
      // @ts-expect-error - Type assertion for ui access
      for (const selectEl of this.ui.selectControls || []) {
        const setting = selectEl.getAttribute('data-setting')
        if (setting) {
          this.toggleInlineInputs(setting, false)
        }
      }
    }
  },

  onLinkDimensionsClicked(evt) {
    evt.preventDefault()
    evt.stopPropagation()

    // @ts-expect-error - Type assertion for ui access
    this.ui.link.toggleClass('unlinked')

    // @ts-expect-error - Type assertion for ui access
    this.setValue('isLinked', !this.ui.link.hasClass('unlinked'))

    if (this.isLinkedDimensions()) {
      // @ts-expect-error - Type assertion for ui access
      const value = this.ui.controls.eq(0).val()
      // @ts-expect-error - Type assertion for ui access
      this.ui.controls.val(value)
      // @ts-expect-error - Type assertion for ui access
      for (const selectEl of this.ui.selectControls) {
        selectEl.value = value
        jQuery(selectEl).trigger('change.select2')
      }
    }

    this.updateDimensions()
  },

  renderFluidSelectElements() {
    if (this.isDestroyed) {
      return
    }

    // @ts-expect-error - Type assertion for ui access
    if (!this.ui.selectControls || !Array.isArray(this.ui.selectControls)) {
      // @ts-expect-error - Type assertion for ui access
      this.ui.selectControls = []
    }

    // @ts-expect-error - Type assertion for ui access
    for (const dimension of this.ui.dimensions) {
      const inputEl = dimension.querySelector('input[type="text"], input[type="number"]')
      const labelEl = dimension.querySelector('label')

      if (!inputEl || !labelEl) continue

      const fluidSelector = dimension.querySelector('.elementor-control-fluid-selector')
      const fluidSelectorContainer = dimension.querySelector(
        '.elementor-control-fluid-selector-container'
      )

      if (!fluidSelector || !fluidSelectorContainer) {
        this.createFluidSelector(dimension, inputEl, labelEl)
      }
    }
  },

  createFluidSelector(dimension, inputEl, labelEl) {
    const setting = inputEl.dataset.setting

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

    // @ts-expect-error - Type assertion for ui access
    this.ui.selectControls.push(fluidSelector)

    dimension.appendChild(fluidSelectorContainer)

    // Create inline inputs container (hidden by default)
    const inlineContainer = this.createInlineInputsContainer(setting)
    dimension.appendChild(inlineContainer)

    dimension.appendChild(labelEl)
  },

  /** Creates the inline min/max input container */
  createInlineInputsContainer(setting) {
    const { container, abortController } = InlineInputManager.createContainer(
      setting,
      () => this.onInlineInputChange(setting),
      () => this.onSaveAsPresetClick(setting)
    )

    // Store AbortController for cleanup
    this.abortControllers.set(setting, abortController)

    return container
  },

  /** Updates Save button disabled state based on input validity */
  updateSaveButtonState(container) {
    InlineInputManager.updateSaveButtonState(container)
  },

  /** Handles Save as Preset button click */
  async onSaveAsPresetClick(setting) {
    const values = this.getInlineInputValues(setting)
    if (!values) {
      return
    }

    const { minSize, minUnit, maxSize, maxUnit } = values

    // Only allow saving if we have valid values
    if (!minSize || !maxSize) {
      return
    }

    // Get inline container and save button
    const container = this.getInlineContainer(setting)
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
    } finally {
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
      getInlineContainer: (setting) => this.getInlineContainer(setting)
    })
  },

  /** Populates group select options by fetching group metadata (deprecated, use DialogBuilder) */
  async populateGroupOptions($select) {
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

  /** Handles preset create confirmation */
  async onConfirmCreatePreset(title, group, minValue, maxValue, setting) {
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

      // Refresh all preset dropdowns
      await this.refreshPresetDropdowns()

      // Auto-select the new preset (with small delay for Select2 to update)
      setTimeout(() => {
        const presetValue = `var(${STYLES.VAR_PREFIX}${response.id})`
        this.selectPreset(setting, presetValue)

        // If linked, apply preset to all dimensions
        if (this.isLinkedDimensions()) {
          // @ts-expect-error - Type assertion for ui access
          for (const selectEl of this.ui.selectControls || []) {
            const otherSetting = selectEl.getAttribute('data-setting')
            if (otherSetting && otherSetting !== setting) {
              this.selectPreset(otherSetting, presetValue)
            }
          }
        }
      }, 100)
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
   * Handles edit icon click on a preset
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

  /** Handles preset update confirmation (edit mode) */
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
      await this.refreshPresetDropdowns()
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

  /** Refreshes all preset dropdowns in the control */
  async refreshPresetDropdowns() {
    // @ts-expect-error - Type assertion for ui access
    await PresetDropdownManager.refreshDropdowns(this.ui.selectControls, this.el)
  },

  /** Selects a preset value in the dropdown and updates control */
  selectPreset(setting, presetValue) {
    // Find the select element for this setting
    // @ts-expect-error - Type assertion for ui access
    const selectEl = this.ui.selectControls.find(
      (el) => el.getAttribute('data-setting') === setting
    )

    if (!selectEl) {
      return
    }

    // Update select element value and trigger Select2
    PresetDropdownManager.updateSelectValue(selectEl, presetValue)

    // Update control value
    const newValue = {
      unit: 'fluid',
      [setting]: presetValue
    }
    this.setValue(newValue)

    // Hide inline inputs
    this.toggleInlineInputs(setting, false)
  },

  /** Validates an inline input and toggles invalid state */
  validateInlineInput(input) {
    return ValidationService.validateInputElement(input)
  },

  /** Gets the inline container for a specific setting */
  getInlineContainer(setting) {
    return this.$el[0].querySelector(`.e-fluid-inline-container[data-setting="${setting}"]`)
  },

  /** Toggles visibility of inline inputs */
  toggleInlineInputs(setting, show) {
    const container = this.getInlineContainer(setting)
    InlineInputManager.toggleVisibility(container, show)
  },

  /** Parses a value with unit like "20px" or "1.5rem" */
  parseValueWithUnit(value) {
    return ValidationService.parseValueWithUnit(value)
  },

  /** Gets inline input values for a setting */
  getInlineInputValues(setting) {
    const container = this.getInlineContainer(setting)
    return InlineInputManager.getInputValues(container)
  },

  /** Sets inline input values (used when loading existing inline value) */
  setInlineInputValues(setting, values) {
    const container = this.getInlineContainer(setting)
    InlineInputManager.setInputValues(container, values)
  },

  /** Handles inline input value changes */
  onInlineInputChange(setting) {
    const values = this.getInlineInputValues(setting)
    if (!values) {
      return
    }

    const { minSize, minUnit, maxSize, maxUnit } = values

    // Only generate clamp if we have valid min and max values
    if (minSize && maxSize) {
      const clampValue = generateClampFormula(minSize, minUnit, maxSize, maxUnit)

      const newValue = {
        unit: 'fluid',
        [setting]: clampValue
      }

      // Handle linked dimensions/gaps - sync all values and inputs
      if (this.isLinkedDimensions()) {
        const linkedContainers = []

        // @ts-expect-error - Type assertion for ui access
        for (const selectEl of this.ui.selectControls || []) {
          const otherSetting = selectEl.getAttribute('data-setting')
          if (otherSetting && otherSetting !== setting) {
            // Add linked dimension value to the model update
            newValue[otherSetting] = clampValue

            const otherContainer = this.getInlineContainer(otherSetting)
            if (otherContainer) {
              linkedContainers.push(otherContainer)

              // Update related input for Elementor's internal tracking
              // @ts-expect-error - Type assertion for ui access
              const linkedInputEl = this.ui.controls.filter(`[data-setting="${otherSetting}"]`)
              linkedInputEl.val(clampValue)
            }
          }
        }

        // Sync all linked containers at once
        if (linkedContainers.length > 0) {
          InlineInputManager.syncLinkedContainers(linkedContainers, { minSize, minUnit, maxSize, maxUnit })
        }
      }

      this.setValue(newValue)

      // Update related input for Elementor's internal tracking
      // @ts-expect-error - Type assertion for ui access
      const relatedInputEl = this.ui.controls.filter(`[data-setting="${setting}"]`)
      relatedInputEl.val(clampValue)

      this.updateDimensions()
    }
  },

  /** Checks if a value is a custom inline value */
  isCustomFluidValue(value) {
    return value === CUSTOM_FLUID_VALUE || isInlineClampValue(value)
  },

  setupInheritanceAttributes(fluidSelector, setting) {
    InheritanceAttributeManager.setupAttributes(
      fluidSelector,
      setting,
      this.model,
      () => this.getParentControlValue()
    )
  },

  getParentControlValue() {
    if (!this.model.get('responsive')) {
      return null
    }

    try {
      const controlName = this.model.get('name')
      let baseControlName = controlName
      let currentDeviceSuffix = ''

      const deviceOrder = window.elementor.breakpoints.getActiveBreakpointsList({
        largeToSmall: true,
        withDesktop: true
      })

      for (const device of deviceOrder) {
        if (device === 'desktop') {
          continue
        }

        if (controlName.endsWith('_' + device)) {
          baseControlName = controlName.replace('_' + device, '')
          currentDeviceSuffix = device

          break
        }
      }

      if (!currentDeviceSuffix) {
        return null
      }

      if (currentDeviceSuffix === 'widescreen') {
        return this.handleWidescreenInheritance(baseControlName)
      }

      return this.handleStandardInheritance(baseControlName, currentDeviceSuffix, deviceOrder)
    } catch {
      return null
    }
  },

  handleWidescreenInheritance(baseControlName) {
    const desktopValue = this._getControlValue(baseControlName)

    if (desktopValue) {
      return {
        ...desktopValue,
        __inheritedFrom: 'desktop',
        __directParentDevice: 'desktop',
        __inheritPath: ['desktop'],
        __sourceUnit: desktopValue.unit
      }
    }
    return null
  },

  handleStandardInheritance(baseControlName, currentDeviceSuffix, deviceOrder) {
    const currentDeviceIndex = deviceOrder.indexOf(currentDeviceSuffix)
    const ancestorDevices = deviceOrder.slice(0, currentDeviceIndex)
    const inheritPath = []
    let directParent = ''

    const parentDevice = ancestorDevices[ancestorDevices.length - 1]
    const parentControlName =
      parentDevice === 'desktop' ? baseControlName : baseControlName + '_' + parentDevice

    directParent = parentDevice
    const parentValue = this._getControlValue(parentControlName)
    inheritPath.push(parentDevice)

    if (!parentValue || this.isEmptyValue(parentValue)) {
      return this.findNonEmptyAncestorValue(
        baseControlName,
        ancestorDevices,
        inheritPath,
        directParent
      )
    }

    return {
      ...parentValue,
      __inheritedFrom: parentDevice,
      __directParentDevice: directParent,
      __inheritPath: inheritPath,
      __sourceUnit: parentValue.unit
    }
  },

  findNonEmptyAncestorValue(baseControlName, ancestorDevices, inheritPath, directParent) {
    for (let i = ancestorDevices.length - 2; i >= 0; i--) {
      const device = ancestorDevices[i]
      const deviceControlName =
        device === 'desktop' ? baseControlName : baseControlName + '_' + device
      const deviceValue = this._getControlValue(deviceControlName)
      inheritPath.unshift(device)

      if (deviceValue && !this.isEmptyValue(deviceValue)) {
        return {
          ...deviceValue,
          __inheritedFrom: device,
          __directParentDevice: directParent,
          __inheritPath: inheritPath,
          __sourceUnit: deviceValue.unit
        }
      }
    }

    const parentDevice = ancestorDevices[ancestorDevices.length - 1]
    const parentControlName =
      parentDevice === 'desktop' ? baseControlName : baseControlName + '_' + parentDevice
    const parentValue = this._getControlValue(parentControlName)

    return parentValue
      ? {
          ...parentValue,
          __inheritedFrom: parentDevice,
          __directParentDevice: directParent,
          __inheritPath: inheritPath,
          __sourceUnit: parentValue.unit
        }
      : null
  },

  isEmptyValue(value) {
    return !value || Object.keys(value).length === 0
  },

  _getControlValue(controlName) {
    if (this.options?.elementSettingsModel) {
      const controlValue = this.options.elementSettingsModel.get(controlName)
      if (controlValue) return controlValue
    }

    if (this.container?.settings) {
      const controlValue = this.container.settings.get(controlName)
      if (controlValue) return controlValue
    }

    const settings = this.model.get('settings')
    if (settings?.get) {
      const controlValue = settings.get(controlName)
      if (controlValue) return controlValue
    }

    return null
  },

  attachSelectElementsListeners() {
    if (this.isDestroyed) {
      return
    }

    // @ts-expect-error - Type assertion for ui access
    for (const selectEl of this.ui.selectControls) {
      if (this.isDestroyed) {
        return
      }

      selectEl.addEventListener('change', this.onSelectChange.bind(this, selectEl))
    }
  },

  getCurrentUnit() {
    return this.getControlValue('unit')
  },

  isFluidUnit() {
    const currentUnit = this.getCurrentUnit()
    return currentUnit === 'fluid'
  },

  hasFluidUnit() {
    const sizeUnits = this.model.get('size_units')
    return sizeUnits && sizeUnits.includes('fluid')
  },

  isCustomUnit() {
    const currentUnit = this.getCurrentUnit()
    return this.isFluidUnit() || currentUnit === 'custom'
  }
}
