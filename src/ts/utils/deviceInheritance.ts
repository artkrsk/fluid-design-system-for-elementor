/**
 * Device Inheritance Utilities
 * Pure functions for handling responsive control value inheritance.
 * Extracted for testability and easier TypeScript migration.
 */

import type { TParsedControlName } from '../types'
import type { IInheritedControlValue } from '../interfaces'

/** Parse control name to extract base name and device suffix */
export function parseControlNameDevice(
  controlName: string,
  deviceOrder: string[]
): TParsedControlName {
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

/** Get control name for a specific device */
export function getDeviceControlName(baseName: string, device: string): string {
  return device === 'desktop' ? baseName : `${baseName}_${device}`
}

/** Build inheritance metadata result object */
export function buildInheritanceResult(
  value: Record<string, any>,
  inheritedFrom: string,
  directParent: string,
  inheritPath: string[]
): IInheritedControlValue {
  return {
    ...value,
    __inheritedFrom: inheritedFrom,
    __directParentDevice: directParent,
    __inheritPath: inheritPath,
    __sourceUnit: value.unit
  }
}

/** Get ancestor devices for a given device in the hierarchy */
export function getAncestorDevices(deviceSuffix: string, deviceOrder: string[]): string[] {
  const currentIndex = deviceOrder.indexOf(deviceSuffix)
  return deviceOrder.slice(0, currentIndex)
}

/** Find inherited value by traversing device hierarchy upward */
export function findInheritedValue(
  baseName: string,
  ancestorDevices: string[],
  getValueFn: (controlName: string) => Record<string, any> | null,
  isEmptyFn: (value: any) => boolean
): IInheritedControlValue | null {
  if (ancestorDevices.length === 0) {
    return null
  }

  const inheritPath: string[] = []
  const directParent = ancestorDevices[ancestorDevices.length - 1]!

  // First check direct parent
  const parentDevice = ancestorDevices[ancestorDevices.length - 1]!
  const parentControlName = getDeviceControlName(baseName, parentDevice)
  const parentValue = getValueFn(parentControlName)
  inheritPath.push(parentDevice)

  if (parentValue && !isEmptyFn(parentValue)) {
    return buildInheritanceResult(parentValue, parentDevice, directParent, inheritPath)
  }

  // Traverse up the hierarchy looking for non-empty value
  for (let i = ancestorDevices.length - 2; i >= 0; i--) {
    const device = ancestorDevices[i]!
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

/** Handle widescreen inheritance (inherits from desktop) */
export function getWidescreenInheritedValue(
  baseName: string,
  getValueFn: (controlName: string) => Record<string, any> | null
): IInheritedControlValue | null {
  const desktopValue = getValueFn(baseName)
  if (desktopValue) {
    return buildInheritanceResult(desktopValue, 'desktop', 'desktop', ['desktop'])
  }
  return null
}

/** Get parent control value with full inheritance resolution */
export function resolveInheritedValue(
  controlName: string,
  deviceOrder: string[],
  getValueFn: (controlName: string) => Record<string, any> | null,
  isEmptyFn: (value: any) => boolean
): IInheritedControlValue | null {
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
