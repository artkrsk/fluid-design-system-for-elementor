import { createElement } from '../utils/dom'
import { buildSelectOptions } from '../utils/preset'
import { getSelect2DefaultOptions } from '../utils/select2'
import { generateClampFormula, isInlineClampValue, parseClampFormula } from '../utils/clamp'
import { CUSTOM_FLUID_VALUE } from '../constants/Controls'
import { AJAX_ACTION_SAVE_PRESET, AJAX_ACTION_GET_GROUPS } from '../constants/AJAX'

export const BaseControlView = {
  isDestroyed: false,

  initialize() {
    // @ts-expect-error - Type assertion for super access
    this.constructor.__super__.initialize.apply(this, arguments)
    this.isDestroyed = false
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
    for (const selectEl of this.ui.selectControls) {
      const setting = selectEl.getAttribute('data-setting')
      const currentValue = this.getControlValue(setting)

      // If current value is an inline clamp formula, show the inputs and populate them
      if (isInlineClampValue(currentValue)) {
        // Verify container exists before trying to manipulate it
        const container = this.getInlineContainer(setting)
        if (!container) {
          continue
        }

        this.toggleInlineInputs(setting, true)
        const parsed = parseClampFormula(currentValue)
        if (parsed) {
          this.setInlineInputValues(setting, parsed)
        }
        // Update Select2 selection
        selectEl.value = CUSTOM_FLUID_VALUE
        selectEl.setAttribute('data-value', CUSTOM_FLUID_VALUE)
        jQuery(selectEl).trigger('change.select2')
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
    // @ts-expect-error - Type assertion for ui access
    this.ui.unitSwitcher.attr('data-selected', unit).find('span').html(unit)
    this.$el.toggleClass('e-units-custom', this.isCustomUnit())
    this.$el.toggleClass('e-units-fluid', this.isFluidUnit())

    const inputType = this.isCustomUnit() ? 'text' : 'number'
    // @ts-expect-error - Type assertion for ui access
    this.ui.controls.attr('type', inputType)

    if (this.isFluidUnit()) {
      this.updatePlaceholderClassState()
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

    // Add "Save as Preset" button (Elementor pattern)
    const saveButton = createElement('button', 'e-control-tool e-fluid-save-preset', {
      type: 'button',
      title: 'Save as Preset'
    })
    const icon = createElement('i', 'eicon-plus')
    saveButton.appendChild(icon)
    container.appendChild(saveButton)

    // Attach input event listeners with validation
    minInput.addEventListener('input', () => {
      this.validateInlineInput(minInput)
      this.onInlineInputChange(setting)
    })
    maxInput.addEventListener('input', () => {
      this.validateInlineInput(maxInput)
      this.onInlineInputChange(setting)
    })

    // Attach button click listener (no functionality yet)
    saveButton.addEventListener('click', (e) => {
      e.preventDefault()
      this.onSaveAsPresetClick(setting)
    })

    return container
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
      const dialog = await this.createSavePresetDialog(minSize, minUnit, maxSize, maxUnit, setting)
      dialog.show()
    } finally {
      // Restore normal state
      container.classList.remove('e-fluid-loading')
      saveButton.disabled = false
      icon.className = 'eicon-plus'
    }
  },

  /** Creates the Save as Preset dialog */
  async createSavePresetDialog(minSize, minUnit, maxSize, maxUnit, setting) {
    // Create dialog message with input
    const $message = jQuery('<div>', { class: 'e-global__confirm-message' })
    const $messageText = jQuery('<div>', { class: 'e-global__confirm-message-text' })
      .html('Create a new fluid preset:')

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
      placeholder: 'Preset Name'
    }).val(`Custom ${previewText}`)

    // Group selector
    const $groupSelect = jQuery('<select>', {
      name: 'preset-group',
      class: 'e-fluid-group-select'
    })

    // Populate groups (async)
    await this.populateGroupOptions($groupSelect)

    $inputWrapper.append($preview, $input, $groupSelect)
    $message.append($messageText, $inputWrapper)

    // Create dialog
    const dialog = elementorCommon.dialogsManager.createWidget('confirm', {
      className: 'e-global__confirm-add',
      headerMessage: 'Save as Preset',
      message: $message,
      strings: {
        confirm: 'Create',
        cancel: 'Cancel'
      },
      hide: {
        onBackgroundClick: false
      },
      onConfirm: () => this.onConfirmSavePreset($input.val(), $groupSelect.val(), minSize, minUnit, maxSize, maxUnit, setting),
      onShow: () => {
        // Initialize Select2 on group selector
        $groupSelect.select2({
          minimumResultsForSearch: -1, // Hide search box
          width: '100%'
        })

        // Auto-focus and select input text
        setTimeout(() => {
          $input.focus().select()
        }, 50)
      }
    })

    return dialog
  },

  /** Populates group select options by fetching group metadata */
  async populateGroupOptions($select) {
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

  /** Handles dialog confirmation */
  onConfirmSavePreset(title, group, minSize, minUnit, maxSize, maxUnit, setting) {
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
      success: (response) => {
        // Phase 4: Will invalidate cache and refresh dropdown here
      },
      error: (error) => {
        // Show error message
        elementorCommon.dialogsManager.createWidget('alert', {
          headerMessage: 'Error',
          message: error || 'Failed to save preset'
        }).show()
      }
    })
  },

  /** Validates an inline input and toggles invalid state */
  validateInlineInput(input) {
    const value = input.value.trim()
    // Empty is valid (just not ready yet)
    if (!value) {
      input.classList.remove('e-fluid-inline-invalid')
      return true
    }
    const parsed = this.parseValueWithUnit(value)
    const isValid = parsed !== null
    input.classList.toggle('e-fluid-inline-invalid', !isValid)
    return isValid
  },

  /** Gets the inline container for a specific setting */
  getInlineContainer(setting) {
    return this.$el[0].querySelector(`.e-fluid-inline-container[data-setting="${setting}"]`)
  },

  /** Toggles visibility of inline inputs */
  toggleInlineInputs(setting, show) {
    const container = this.getInlineContainer(setting)
    if (container) {
      container.classList.toggle('e-hidden', !show)
    }
  },

  /** Parses a value with unit like "20px" or "1.5rem" */
  parseValueWithUnit(value) {
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

  /** Gets inline input values for a setting */
  getInlineInputValues(setting) {
    const container = this.getInlineContainer(setting)
    if (!container) {
      return null
    }

    const minValue = container.querySelector('[data-fluid-role="min"]')?.value
    const maxValue = container.querySelector('[data-fluid-role="max"]')?.value

    const minParsed = this.parseValueWithUnit(minValue)
    const maxParsed = this.parseValueWithUnit(maxValue)

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

  /** Sets inline input values (used when loading existing inline value) */
  setInlineInputValues(setting, values) {
    const container = this.getInlineContainer(setting)
    if (!container || !values) {
      return
    }

    const minInput = container.querySelector('[data-fluid-role="min"]')
    const maxInput = container.querySelector('[data-fluid-role="max"]')

    if (minInput && values.minSize) {
      minInput.value = `${values.minSize}${values.minUnit || 'px'}`
      this.validateInlineInput(minInput)
    }
    if (maxInput && values.maxSize) {
      maxInput.value = `${values.maxSize}${values.maxUnit || 'px'}`
      this.validateInlineInput(maxInput)
    }
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
    const controlName = this.model.get('name')
    const isResponsiveControl = controlName && /_(?!.*_)(.+)$/.test(controlName)

    if (isResponsiveControl) {
      const inheritedControl = this.getParentControlValue()
      if (inheritedControl) {
        this.setInheritanceAttributes(fluidSelector, inheritedControl, setting)
      }
    }
  },

  setInheritanceAttributes(fluidSelector, inheritedControl, setting) {
    const inheritedSize = inheritedControl[setting]
    const inheritedUnit = inheritedControl.unit
    const inheritedFrom = inheritedControl.__inheritedFrom || 'parent'
    const directParentDevice = inheritedControl.__directParentDevice
    const sourceUnit = inheritedControl.__sourceUnit

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

    if (directParentDevice && directParentDevice !== inheritedFrom) {
      fluidSelector.setAttribute('data-inherited-via', directParentDevice)
    }

    let deviceName = inheritedFrom.charAt(0).toUpperCase() + inheritedFrom.slice(1)

    if (deviceName === 'Desktop') {
      deviceName = 'Default'
    }

    fluidSelector.setAttribute('data-inherited-device', deviceName)
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
