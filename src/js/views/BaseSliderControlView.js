import { createElement } from '../utils/dom'

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
  }
}
