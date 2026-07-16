import { ValidationService } from './validation'
import { generateClampFormula } from './clamp'
import { PresetAPIService } from '../services/presetAPI'
import { buildCreatePresetData, buildUpdatePresetData, buildCachedPresetRow } from './presetData'
import { insertPresetRow, updatePresetRow } from './presetModelSync'
import { dataManager, cssManager } from '../managers'
import { STYLES, UI_TIMING } from '../constants'

/** Defensive: the dialog already blocks confirming with unparseable values */
const invalidValuesError = () =>
  new Error(window.ArtsFluidDSStrings?.invalidValue || 'Invalid min/max value')

interface ICreatePresetCallbacks {
  refreshDropdowns: () => Promise<void>
  selectPreset: (setting: string, value: string) => void
  getLinkedSelects?: () => { setting: string }[]
}

/** Handles preset update with CSS injection and refresh */
export async function handleUpdatePreset(
  presetId: string,
  title: string,
  groupId: string,
  minValue: string,
  maxValue: string,
  refreshDropdowns: () => Promise<void>
): Promise<void> {
  const minParsed = ValidationService.parseValueWithUnit(minValue)
  const maxParsed = ValidationService.parseValueWithUnit(maxValue)

  if (!minParsed || !maxParsed) {
    throw invalidValuesError()
  }

  const clampFormula = generateClampFormula(
    minParsed.size,
    minParsed.unit,
    maxParsed.size,
    maxParsed.unit
  )
  cssManager.setCssVariable(presetId, clampFormula)

  const presetData = buildUpdatePresetData(presetId, title, minParsed, maxParsed, groupId)
  let response

  try {
    response = await PresetAPIService.updatePreset(presetData)
  } catch (error) {
    cssManager.restoreCssVariable(presetId)
    throw error
  }

  const controlId = response.control_id ?? groupId

  // The preset is persisted from here on: a UI-sync failure must not surface
  // as a failed update, so the cache is invalidated and refetched instead.
  try {
    // Mirror the edited fields onto the editor's Kit model row so a Site
    // Settings save doesn't overwrite them with the pre-edit snapshot.
    // The server-sanitized title wins over the raw client input.
    updatePresetRow(controlId, presetId, {
      title: response.title ?? presetData.title,
      min: { size: Number(minParsed.size), unit: minParsed.unit },
      max: { size: Number(maxParsed.size), unit: maxParsed.unit }
    })

    dataManager.updatePreset(controlId, presetId, {
      title: response.title ?? presetData.title,
      min_size: minParsed.size,
      min_unit: minParsed.unit,
      max_size: maxParsed.size,
      max_unit: maxParsed.unit
    })

    await refreshDropdowns()
  } catch {
    dataManager.invalidate()
  }
}

/** Handles preset creation with CSS injection and auto-select */
export async function handleCreatePreset(
  title: string,
  group: string,
  minValue: string,
  maxValue: string,
  setting: string,
  callbacks: ICreatePresetCallbacks
): Promise<void> {
  const minParsed = ValidationService.parseValueWithUnit(minValue)
  const maxParsed = ValidationService.parseValueWithUnit(maxValue)

  if (!minParsed || !maxParsed) {
    throw invalidValuesError()
  }

  const ajaxData = buildCreatePresetData(title, minParsed, maxParsed, group)
  const response = await PresetAPIService.savePreset(ajaxData)

  // The preset is persisted from here on: a UI-sync failure must not reject the
  // dialog as a failed save — a retry would duplicate the preset. Invalidate so
  // the next dropdown open refetches the truth instead.
  try {
    const clampFormula = generateClampFormula(
      minParsed.size,
      minParsed.unit,
      maxParsed.size,
      maxParsed.unit
    )
    cssManager.setCssVariable(response.id, clampFormula)

    const controlId = response.control_id ?? group

    // Mirror the new row into the editor's Kit model so a Site Settings save
    // doesn't serialize a stale snapshot and drop the freshly created preset.
    // The server-sanitized title wins over the raw client input.
    insertPresetRow(controlId, {
      _id: response.id,
      title: response.title ?? ajaxData.title,
      min: { size: Number(minParsed.size), unit: minParsed.unit },
      max: { size: Number(maxParsed.size), unit: maxParsed.unit }
    })

    dataManager.addPreset(
      controlId,
      buildCachedPresetRow(response.id, response.title ?? ajaxData.title, minParsed, maxParsed)
    )

    await callbacks.refreshDropdowns()

    // Resolve only once the preset is selected, so the dialog can stay up for the
    // whole flow and the auto-select can't overwrite a value picked in the meantime.
    await new Promise<void>(resolve => setTimeout(resolve, UI_TIMING.PRESET_AUTO_SELECT_DELAY))

    const presetValue = `var(${STYLES.VAR_PREFIX}${response.id})`
    callbacks.selectPreset(setting, presetValue)

    // Apply to linked dimensions if provided
    const linkedSelects = callbacks.getLinkedSelects?.() ?? []
    for (const { setting: otherSetting } of linkedSelects) {
      if (otherSetting !== setting) {
        callbacks.selectPreset(otherSetting, presetValue)
      }
    }
  } catch {
    dataManager.invalidate()
  }
}
