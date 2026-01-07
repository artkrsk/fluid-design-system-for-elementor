/**
 * Preset Data Utilities
 * Pure functions for building preset data objects.
 * Extracted for testability with Vitest.
 */

/**
 * Builds data object for creating a new preset
 * @param {string} title - Preset title
 * @param {import('../types').TParsedValue} minParsed - Parsed min value
 * @param {import('../types').TParsedValue} maxParsed - Parsed max value
 * @param {string} [group] - Group ID
 * @returns {import('../interfaces').ISavePresetData}
 */
export function buildCreatePresetData(title, minParsed, maxParsed, group) {
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
 * Builds data object for updating an existing preset
 * @param {string} presetId - Preset ID
 * @param {string} title - Preset title
 * @param {import('../types').TParsedValue} minParsed - Parsed min value
 * @param {import('../types').TParsedValue} maxParsed - Parsed max value
 * @param {string} groupId - Group ID
 * @returns {import('../interfaces').IUpdatePresetData}
 */
export function buildUpdatePresetData(presetId, title, minParsed, maxParsed, groupId) {
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
