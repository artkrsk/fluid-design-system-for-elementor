import { createElement } from '../utils/dom'
import { buildSelectOptions } from '../utils/preset'
import { getSelect2DefaultOptions } from '../utils/select2'

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
    const dimensionName = selectEl.getAttribute('data-setting')

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
    dimension.appendChild(labelEl)
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
