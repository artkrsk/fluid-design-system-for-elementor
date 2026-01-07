/**
 * Manages inheritance attribute setup for fluid control selectors
 * Sets data-* attributes that are used by preset.js when building inherit options
 */
export class InheritanceAttributeManager {
  /**
   * Sets up inheritance attributes if control is responsive
   * @param {HTMLElement} fluidSelector
   * @param {string} propertyName - Property name to read ('size' for slider, 'top'/'left'/etc for dimensions)
   * @param {import('@arts/elementor-types').BackboneModel} controlModel
   * @param {() => import('../interfaces').IInheritedControlValue | null} getParentValueFn
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
   * @param {HTMLElement} fluidSelector
   * @param {import('../interfaces').IInheritedControlValue} inheritedControl
   * @param {string} propertyName
   */
  static setAttributes(fluidSelector, inheritedControl, propertyName) {
    const inheritedSize = inheritedControl[propertyName]
    const inheritedUnit = inheritedControl.unit
    const sourceUnit = inheritedControl.__sourceUnit || inheritedUnit
    const inheritedFrom = inheritedControl.__inheritedFrom || 'parent'
    const directParentDevice = inheritedControl.__directParentDevice

    if (inheritedSize !== undefined) {
      fluidSelector.setAttribute('data-inherited-size', String(inheritedSize))
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
