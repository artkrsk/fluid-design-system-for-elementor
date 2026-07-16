/**
 * Preset Data Utilities
 * Pure functions for building preset data objects.
 * Extracted for testability with Vitest.
 */

import { STYLES } from '../constants'
import type { TParsedValue } from '../types'
import type { IFluidPreset, ISavePresetData, IUpdatePresetData } from '../interfaces'

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

/**
 * Builds the dropdown row for a preset the server just stored, so the cache can be
 * patched instead of refetched. Screen anchors are left out on purpose: the option
 * then falls back to the preview's global anchors, which is what the server sends.
 */
export function buildCachedPresetRow(
  id: string,
  title: string,
  minParsed: TParsedValue,
  maxParsed: TParsedValue
): IFluidPreset {
  return {
    id,
    value: `var(${STYLES.VAR_PREFIX}${id})`,
    title,
    min_size: minParsed.size,
    min_unit: minParsed.unit,
    max_size: maxParsed.size,
    max_unit: maxParsed.unit,
    /** Without this the freshly created preset renders without its edit pencil */
    editable: true
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
