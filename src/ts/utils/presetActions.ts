import { ValidationService } from './validation'
import { generateClampFormula } from './clamp'
import { PresetDialogManager } from '../managers/PresetDialogManager'
import { PresetAPIService } from '../services/presetAPI'
import { buildCreatePresetData, buildUpdatePresetData } from './presetData'
import { dataManager, cssManager } from '../managers'
import { STYLES, UI_TIMING } from '../constants'
import type { IPresetData } from '../interfaces'

type DialogInstance = { show: () => void }

interface ICreatePresetCallbacks {
  refreshDropdowns: () => Promise<void>
  selectPreset: (setting: string, value: string) => void
  getLinkedSelects?: () => { setting: string }[]
}

/** Handles edit icon click - extracts preset data and opens dialog */
export async function handleEditPresetClick(
  selectEl: HTMLSelectElement,
  openDialog: (mode: 'edit', data: IPresetData) => Promise<DialogInstance>
): Promise<void> {
  const presetId = selectEl.querySelector('option:checked')?.getAttribute('data-id')
  if (!presetId) {
    return
  }

  const setting = selectEl.getAttribute('data-setting') ?? ''
  const option = selectEl.querySelector(`option[data-id="${presetId}"]`)
  if (!option) {
    return
  }

  const presetData = PresetDialogManager.extractPresetData(option as HTMLOptionElement, presetId, setting)
  const dialog = await openDialog('edit', presetData)
  dialog.show()
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
    return
  }

  const clampFormula = generateClampFormula(
    minParsed.size,
    minParsed.unit,
    maxParsed.size,
    maxParsed.unit
  )
  cssManager.setCssVariable(presetId, clampFormula)

  const presetData = buildUpdatePresetData(presetId, title, minParsed, maxParsed, groupId)

  try {
    await PresetAPIService.updatePreset(presetData)
    dataManager.invalidate()
    await refreshDropdowns()
  } catch (error) {
    cssManager.restoreCssVariable(presetId)
    showErrorDialog((error as string) || 'Failed to update preset')
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
    return
  }

  const ajaxData = buildCreatePresetData(title, minParsed, maxParsed, group)

  try {
    const response = await PresetAPIService.savePreset(ajaxData)

    const clampFormula = generateClampFormula(
      minParsed.size,
      minParsed.unit,
      maxParsed.size,
      maxParsed.unit
    )
    cssManager.setCssVariable(response.id, clampFormula)

    dataManager.invalidate()
    await callbacks.refreshDropdowns()

    setTimeout(() => {
      const presetValue = `var(${STYLES.VAR_PREFIX}${response.id})`
      callbacks.selectPreset(setting, presetValue)

      // Apply to linked dimensions if provided
      const linkedSelects = callbacks.getLinkedSelects?.() ?? []
      for (const { setting: otherSetting } of linkedSelects) {
        if (otherSetting !== setting) {
          callbacks.selectPreset(otherSetting, presetValue)
        }
      }
    }, UI_TIMING.PRESET_AUTO_SELECT_DELAY)
  } catch (error) {
    showErrorDialog((error as string) || window.ArtsFluidDSStrings?.failedToSave || 'Failed to save preset')
  }
}

/** Shows error dialog */
function showErrorDialog(message: string): void {
  window.elementorCommon?.dialogsManager
    .createWidget('alert', {
      headerMessage: window.ArtsFluidDSStrings?.error,
      message
    })
    .show()
}
