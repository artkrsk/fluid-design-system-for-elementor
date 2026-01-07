/**
 * Device Inheritance Utilities
 * Pure functions for handling responsive control value inheritance.
 * Extracted for testability and easier TypeScript migration.
 */

/**
 * @typedef {Object} ParsedControlName
 * @property {string} baseName - Base control name without device suffix
 * @property {string | null} deviceSuffix - Device suffix (e.g., 'tablet', 'mobile') or null for desktop
 */

/**
 * @typedef {Object} InheritedValue
 * @property {string} [unit] - Unit value
 * @property {string} __inheritedFrom - Device the value was inherited from
 * @property {string} __directParentDevice - Direct parent device in hierarchy
 * @property {string[]} __inheritPath - Path of devices traversed
 * @property {string} [__sourceUnit] - Original unit from source value
 * @property {string} [top] - Dimension value
 * @property {string} [right] - Dimension value
 * @property {string} [bottom] - Dimension value
 * @property {string} [left] - Dimension value
 * @property {string} [row] - Gap value
 * @property {string} [column] - Gap value
 * @property {string} [size] - Slider value
 */

/**
 * Parse control name to extract base name and device suffix
 * @param {string} controlName - Full control name (e.g., 'padding_tablet')
 * @param {string[]} deviceOrder - Device order from largest to smallest
 * @returns {ParsedControlName}
 */
export function parseControlNameDevice(controlName, deviceOrder) {
  for (const device of deviceOrder) {
    if (device === 'desktop') {
      continue
    }
    if (controlName.endsWith('_' + device)) {
      return {
        baseName: controlName.replace('_' + device, ''),
        deviceSuffix: device
      }
    }
  }
  return { baseName: controlName, deviceSuffix: null }
}

/**
 * Get control name for a specific device
 * @param {string} baseName - Base control name
 * @param {string} device - Device name
 * @returns {string}
 */
export function getDeviceControlName(baseName, device) {
  return device === 'desktop' ? baseName : `${baseName}_${device}`
}

/**
 * Build inheritance metadata result object
 * @param {Record<string, any>} value - Source value object
 * @param {string} inheritedFrom - Device the value was inherited from
 * @param {string} directParent - Direct parent device
 * @param {string[]} inheritPath - Path of devices traversed
 * @returns {InheritedValue}
 */
export function buildInheritanceResult(value, inheritedFrom, directParent, inheritPath) {
  return {
    ...value,
    __inheritedFrom: inheritedFrom,
    __directParentDevice: directParent,
    __inheritPath: inheritPath,
    __sourceUnit: value.unit
  }
}

/**
 * Get ancestor devices for a given device in the hierarchy
 * @param {string} deviceSuffix - Current device suffix
 * @param {string[]} deviceOrder - Device order from largest to smallest
 * @returns {string[]} Ancestor devices (devices larger than current)
 */
export function getAncestorDevices(deviceSuffix, deviceOrder) {
  const currentIndex = deviceOrder.indexOf(deviceSuffix)
  return deviceOrder.slice(0, currentIndex)
}

/**
 * Find inherited value by traversing device hierarchy upward
 * @param {string} baseName - Base control name
 * @param {string[]} ancestorDevices - Ancestor devices from largest to smallest
 * @param {(controlName: string) => Record<string, any> | null} getValueFn - Function to get control value
 * @param {(value: any) => boolean} isEmptyFn - Function to check if value is empty
 * @returns {InheritedValue | null}
 */
export function findInheritedValue(baseName, ancestorDevices, getValueFn, isEmptyFn) {
  if (ancestorDevices.length === 0) {
    return null
  }

  const inheritPath = []
  const directParent = ancestorDevices[ancestorDevices.length - 1]

  // First check direct parent
  const parentDevice = ancestorDevices[ancestorDevices.length - 1]
  const parentControlName = getDeviceControlName(baseName, parentDevice)
  const parentValue = getValueFn(parentControlName)
  inheritPath.push(parentDevice)

  if (parentValue && !isEmptyFn(parentValue)) {
    return buildInheritanceResult(parentValue, parentDevice, directParent, inheritPath)
  }

  // Traverse up the hierarchy looking for non-empty value
  for (let i = ancestorDevices.length - 2; i >= 0; i--) {
    const device = ancestorDevices[i]
    const deviceControlName = getDeviceControlName(baseName, device)
    const deviceValue = getValueFn(deviceControlName)
    inheritPath.unshift(device)

    if (deviceValue && !isEmptyFn(deviceValue)) {
      return buildInheritanceResult(deviceValue, device, directParent, inheritPath)
    }
  }

  // Return parent value even if empty (for inheritance chain tracking)
  if (parentValue) {
    return buildInheritanceResult(parentValue, parentDevice, directParent, inheritPath)
  }

  return null
}

/**
 * Handle widescreen inheritance (inherits from desktop)
 * @param {string} baseName - Base control name
 * @param {(controlName: string) => Record<string, any> | null} getValueFn - Function to get control value
 * @returns {InheritedValue | null}
 */
export function getWidescreenInheritedValue(baseName, getValueFn) {
  const desktopValue = getValueFn(baseName)
  if (desktopValue) {
    return buildInheritanceResult(desktopValue, 'desktop', 'desktop', ['desktop'])
  }
  return null
}

/**
 * Get parent control value with full inheritance resolution
 * @param {string} controlName - Current control name
 * @param {string[]} deviceOrder - Device order from largest to smallest
 * @param {(controlName: string) => Record<string, any> | null} getValueFn - Function to get control value
 * @param {(value: any) => boolean} isEmptyFn - Function to check if value is empty
 * @returns {InheritedValue | null}
 */
export function resolveInheritedValue(controlName, deviceOrder, getValueFn, isEmptyFn) {
  const { baseName, deviceSuffix } = parseControlNameDevice(controlName, deviceOrder)

  // Desktop controls don't inherit
  if (!deviceSuffix) {
    return null
  }

  // Widescreen inherits from desktop (special case)
  if (deviceSuffix === 'widescreen') {
    return getWidescreenInheritedValue(baseName, getValueFn)
  }

  // Standard inheritance - traverse up the hierarchy
  const ancestorDevices = getAncestorDevices(deviceSuffix, deviceOrder)
  return findInheritedValue(baseName, ancestorDevices, getValueFn, isEmptyFn)
}
