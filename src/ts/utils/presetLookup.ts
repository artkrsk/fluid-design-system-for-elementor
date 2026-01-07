import { dataManager } from '../managers'
import type { IFluidPreset, ICustomPreset } from '../interfaces'
import type { TInheritedPresetResult } from '../types'

/** Type guard to check if preset is IFluidPreset */
export function isFluidPreset(preset: IFluidPreset | ICustomPreset): preset is IFluidPreset {
  return 'min_size' in preset && 'max_size' in preset
}

/** Async lookup for inherited preset data */
export async function getInheritedPreset(inheritedSize: string | null): Promise<TInheritedPresetResult> {
  const presetsData = await dataManager.getPresetsData()

  if (!presetsData) {
    return null
  }

  for (const { name, value } of presetsData) {
    if (typeof value === 'object' && Array.isArray(value)) {
      for (const preset of value) {
        if (inheritedSize === preset.value && isFluidPreset(preset)) {
          return { ...preset, isComplex: true as const }
        }
      }
    } else if (typeof value === 'string' && inheritedSize === value) {
      return { isComplex: false as const, id: value, name }
    }
  }

  return null
}

/** Sync lookup for inherited preset data (uses cached presets) */
export function getInheritedPresetSync(inheritedSize: string | null): TInheritedPresetResult {
  const presetsData = dataManager.presets

  if (!presetsData) {
    return null
  }

  for (const { name, value } of presetsData) {
    if (typeof value === 'object' && Array.isArray(value)) {
      for (const preset of value) {
        if (inheritedSize === preset.value && isFluidPreset(preset)) {
          return { ...preset, isComplex: true as const }
        }
      }
    } else if (typeof value === 'string' && inheritedSize === value) {
      return { isComplex: false as const, id: value, name }
    }
  }

  return null
}
