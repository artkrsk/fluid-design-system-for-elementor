/**
 * Manages inheritance attribute setup for fluid control selectors
 * Sets data-* attributes that are used by preset.js when building inherit options
 */
export class InheritanceAttributeManager {
  /**
   * Sets up inheritance attributes if control is responsive
   * @param {HTMLElement} fluidSelector - Select element to set attributes on
   * @param {string} propertyName - Property name to read from inherited control ('size' for slider, 'top'/'left'/etc for dimensions)
   * @param {Object} controlModel - Backbone control model
   * @param {Function} getParentValueFn - Function that returns parent control value with inheritance metadata
   */
  static setupAttributes(fluidSelector, propertyName, controlModel, getParentValueFn) {
    const controlName = controlModel.get('name')
    const isResponsiveControl = controlName && /_(?!.*_)(.+)$/.test(controlName)

    if (isResponsiveControl) {
      const inheritedControl = getParentValueFn()
      if (inheritedControl) {
        InheritanceAttributeManager.setAttributes(fluidSelector, inheritedControl, propertyName)
      }
    }
  }

  /**
   * Sets inheritance data attributes on selector element
   * These attributes are read by preset.js when building the inherit option
   * @param {HTMLElement} fluidSelector - Select element
   * @param {Object} inheritedControl - Inherited control data with metadata (__inheritedFrom, __sourceUnit, etc.)
   * @param {string} propertyName - Property name to read from inheritedControl
   */
  static setAttributes(fluidSelector, inheritedControl, propertyName) {
    const inheritedSize = inheritedControl[propertyName]
    const inheritedUnit = inheritedControl.unit
    const sourceUnit = inheritedControl.__sourceUnit || inheritedUnit
    const inheritedFrom = inheritedControl.__inheritedFrom || 'parent'
    const directParentDevice = inheritedControl.__directParentDevice

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
  }
}
