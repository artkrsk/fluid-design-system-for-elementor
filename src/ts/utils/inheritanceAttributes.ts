import type { BackboneModel } from '@artemsemkin/elementor-types'
import type { IInheritedControlValue } from '../interfaces'

/** Manages inheritance attribute setup for fluid control selectors */
export class InheritanceAttributeManager {
  /** Sets up inheritance attributes if control is responsive */
  static setupAttributes(
    fluidSelector: HTMLElement,
    propertyName: string,
    controlModel: BackboneModel,
    getParentValueFn: () => IInheritedControlValue | null
  ): void {
    const controlName = controlModel.get('name') as string | undefined
    const isResponsiveControl = controlName && /_(?!.*_)(.+)$/.test(controlName)

    if (isResponsiveControl) {
      const inheritedControl = getParentValueFn()
      if (inheritedControl) {
        InheritanceAttributeManager.setAttributes(fluidSelector, inheritedControl, propertyName)
      }
    }
  }

  /** Sets inheritance data attributes on selector element */
  static setAttributes(
    fluidSelector: HTMLElement,
    inheritedControl: IInheritedControlValue,
    propertyName: string
  ): void {
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
