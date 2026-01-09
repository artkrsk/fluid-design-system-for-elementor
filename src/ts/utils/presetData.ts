/**
 * Preset Data Utilities
 * Pure functions for building preset data objects.
 * Extracted for testability with Vitest.
 */

import type { TParsedValue } from '../types'
import type { ISavePresetData, IUpdatePresetData } from '../interfaces'

/** Builds data object for creating a new preset */
export function buildCreatePresetData(
  title: string,
  minParsed: TParsedValue,
  maxParsed: TParsedValue,
  group?: string
): ISavePresetData {
  const defaultTitle = `Custom ${minParsed.size}${minParsed.unit} ~ ${maxParsed.size}${maxParsed.unit}`

  return {
    title: title?.trim() || defaultTitle,
    min_size: minParsed.size,
    min_unit: minParsed.unit,
    max_size: maxParsed.size,
    max_unit: maxParsed.unit,
    group: group || 'spacing'
  }
}

/** Builds data object for updating an existing preset */
export function buildUpdatePresetData(
  presetId: string,
  title: string,
  minParsed: TParsedValue,
  maxParsed: TParsedValue,
  groupId: string
): IUpdatePresetData {
  return {
    preset_id: presetId,
    title: title?.trim() || '',
    min_size: minParsed.size,
    min_unit: minParsed.unit,
    max_size: maxParsed.size,
    max_unit: maxParsed.unit,
    group: groupId
  }
}
