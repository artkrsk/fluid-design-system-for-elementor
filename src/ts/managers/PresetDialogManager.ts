import { ValidationService } from '../utils/validation'
import { DialogBuilder } from '../utils/dialogBuilder'
import { generateClampFormula } from '../utils/clamp'
import { UI_DEFAULTS } from '../constants'
import { ValueFormatter } from '../utils/formatters'
import cssManager from './CSSManager'
import type {
  IDialogConfig,
  IPresetData,
  IPresetDialogData,
  IPresetDialogCallbacks
} from '../interfaces'

/** Manages preset dialog creation and lifecycle */
export class PresetDialogManager {
  static async open(
    mode: 'create' | 'edit',
    data: IPresetDialogData,
    callbacks: IPresetDialogCallbacks
  ): Promise<unknown> {
    if (mode !== 'create' && mode !== 'edit') {
      throw new Error(`Invalid mode: ${mode}. Expected 'create' or 'edit'.`)
    }

    const config = this._getDialogConfig(mode, data, callbacks)

    /** Store for cancel restoration in edit mode */
    let originalFormula = null
    let confirmed = false

    if (mode === 'edit' && data.presetId) {
      originalFormula = generateClampFormula(data.minSize, data.minUnit, data.maxSize, data.maxUnit)
    }

    const { $message, $input, $minInput, $maxInput, $groupSelect, $separator } =
      this._createDialogMessage(config, mode)

    const modeClass =
      mode === 'create' ? 'e-fluid-create-preset-dialog' : 'e-fluid-edit-preset-dialog'
    const dialog = window.elementorCommon?.dialogsManager.createWidget('confirm', {
      className: `e-fluid-save-preset-dialog ${modeClass}`,
      headerMessage: config.headerMessage,
      message: $message,
      strings: {
        confirm: config.confirmButton,
        cancel: window.ArtsFluidDSStrings?.cancel
      },
      hide: {
        onBackgroundClick: false
      },
      onConfirm: () => {
        confirmed = true
        config.onConfirm(
          String($input.val() ?? ''),
          String($groupSelect.val() ?? ''),
          String($minInput.val() ?? ''),
          String($maxInput.val() ?? '')
        )
      },
      onShow: async () => {
        if (!dialog) {
          return
        }
        try {
          const $confirmButton = dialog.getElements('widget').find('.dialog-ok')
          await this._initializeDialogUI(
            $input,
            $minInput,
            $maxInput,
            $groupSelect,
            $separator,
            $confirmButton,
            data
          )

          if (mode === 'edit' && data.presetId) {
            this._attachLivePreviewListeners($minInput, $maxInput, data.presetId)
          } else if (mode === 'create' && data.setting && callbacks.getInlineContainer) {
            this._attachCreateModeLivePreview(
              $minInput,
              $maxInput,
              data.setting,
              callbacks.getInlineContainer
            )
          }
        } catch {
          // Silently handle setup errors - dialog will still function
        }
      },
      onHide: () => {
        /** Restore original CSS if cancelled */
        if (mode === 'edit' && !confirmed && originalFormula && data.presetId) {
          cssManager.setCssVariable(data.presetId, originalFormula)
        }
      }
    })

    return dialog
  }

  private static _getDialogConfig(
    mode: 'create' | 'edit',
    data: IPresetDialogData,
    callbacks: IPresetDialogCallbacks
  ): IDialogConfig {
    const configs: Record<'create' | 'edit', IDialogConfig> = {
      create: {
        headerMessage: window.ArtsFluidDSStrings?.saveAsPreset,
        messageText: window.ArtsFluidDSStrings?.createNewPreset,
        confirmButton: window.ArtsFluidDSStrings?.create,
        defaultName: `Custom ${data.minSize}${data.minUnit} ~ ${data.maxSize}${data.maxUnit}`,
        defaultMin: `${data.minSize}${data.minUnit}`,
        defaultMax: `${data.maxSize}${data.maxUnit}`,
        onConfirm: (name: string, group: string, minVal: string, maxVal: string) => {
          callbacks.onCreate?.(name, group, minVal, maxVal, data.setting ?? '')
        }
      },
      edit: {
        headerMessage: window.ArtsFluidDSStrings?.editPreset,
        messageText: window.ArtsFluidDSStrings?.editPresetMessage,
        confirmButton: window.ArtsFluidDSStrings?.save,
        defaultName: data.presetTitle || '',
        defaultMin: `${data.minSize}${data.minUnit}`,
        defaultMax: `${data.maxSize}${data.maxUnit}`,
        onConfirm: (name: string, group: string, minVal: string, maxVal: string) => {
          callbacks.onUpdate?.(
            data.presetId ?? '',
            name,
            group || (data.groupId ?? ''),
            minVal,
            maxVal
          )
        }
      }
    }

    return configs[mode]
  }

  private static _createDialogMessage(config: IDialogConfig, mode: 'create' | 'edit') {
    const $message = jQuery('<div>', { class: 'e-global__confirm-message' })
    const $messageText = jQuery('<div>', { class: 'e-global__confirm-message-text' }).html(
      config.messageText ?? ''
    )

    const $inputWrapper = jQuery('<div>', { class: 'e-global__confirm-input-wrapper' })
    const $valuesRow = jQuery('<div>', { class: 'e-fluid-dialog-values-row' })

    const $minInput = jQuery('<input>', {
      type: 'text',
      class: 'e-fluid-inline-input e-fluid-dialog-input',
      'data-fluid-role': 'min',
      placeholder: UI_DEFAULTS.INLINE_INPUT_PLACEHOLDER,
      value: config.defaultMin
    })

    const $separator = jQuery('<span>', {
      class: 'e-fluid-inline-separator',
      text: '~'
    })

    const $maxInput = jQuery('<input>', {
      type: 'text',
      class: 'e-fluid-inline-input e-fluid-dialog-input',
      'data-fluid-role': 'max',
      placeholder: UI_DEFAULTS.INLINE_INPUT_PLACEHOLDER,
      value: config.defaultMax
    })

    $valuesRow.append($minInput, $separator, $maxInput)

    const $input = DialogBuilder.createNameInput(config.defaultName)
    const $groupSelect =
      mode === 'create' ? DialogBuilder.createGroupSelector() : jQuery('<select>')

    $inputWrapper.append($valuesRow, $input)

    if (mode === 'create') {
      $inputWrapper.append($groupSelect)
    }

    $message.append($messageText, $inputWrapper)

    return { $message, $input, $minInput, $maxInput, $groupSelect, $separator }
  }

  private static async _initializeDialogUI(
    $input: JQuery,
    $minInput: JQuery,
    $maxInput: JQuery,
    $groupSelect: JQuery,
    $separator: JQuery,
    $confirmButton: JQuery,
    data: IPresetDialogData
  ): Promise<void> {
    if ($groupSelect && $groupSelect.length) {
      await DialogBuilder.populateGroupSelector($groupSelect, data.groupId)
      DialogBuilder.initializeSelect2($groupSelect)
    }

    DialogBuilder.attachEnterKeyHandler($input, $confirmButton)
    DialogBuilder.autoFocusInput($input)

    /** Updates separator: ~ for range, = for same value */
    const updateSeparator = () => {
      const minParsed = ValidationService.parseValueWithUnit(String($minInput.val() ?? ''))
      const maxParsed = ValidationService.parseValueWithUnit(String($maxInput.val() ?? ''))

      $separator.text(ValueFormatter.calculateSeparator(minParsed, maxParsed))
    }

    const validateAll = () => {
      const name = String($input.val() || '').trim()
      const isNameValid = name.length > 0

      const minParsed = ValidationService.parseValueWithUnit(String($minInput.val() ?? ''))
      const maxParsed = ValidationService.parseValueWithUnit(String($maxInput.val() ?? ''))

      $minInput.toggleClass('e-fluid-inline-invalid', !minParsed)
      $maxInput.toggleClass('e-fluid-inline-invalid', !maxParsed)

      const areValuesValid = minParsed && maxParsed

      updateSeparator()
      $confirmButton.prop('disabled', !(isNameValid && areValuesValid))
    }

    $input.on('input', validateAll)
    $minInput.on('input', validateAll)
    $maxInput.on('input', validateAll)
    validateAll()
  }

  /** Updates CSS variable on input change for live preview */
  private static _attachLivePreviewListeners(
    $minInput: JQuery,
    $maxInput: JQuery,
    presetId: string
  ): void {
    if (!presetId) {
      return
    }

    const updatePreview = () => {
      const minValue = String($minInput.val() || '')
      const maxValue = String($maxInput.val() || '')

      const minParsed = ValidationService.parseValueWithUnit(minValue)
      const maxParsed = ValidationService.parseValueWithUnit(maxValue)

      if (minParsed && maxParsed) {
        const formula = generateClampFormula(
          minParsed.size,
          minParsed.unit,
          maxParsed.size,
          maxParsed.unit
        )
        cssManager.setCssVariable(presetId, formula)
      }
    }

    $minInput.on('input', updatePreview)
    $maxInput.on('input', updatePreview)
  }

  /** Mirrors dialog values to inline inputs for live preview */
  private static _attachCreateModeLivePreview(
    $minInput: JQuery,
    $maxInput: JQuery,
    setting: string,
    getInlineContainerFn: (setting: string) => HTMLElement | null
  ): void {
    const updateInlineInputs = () => {
      const container = getInlineContainerFn(setting)
      if (!container) {
        return
      }

      const inlineMinInput = container.querySelector(
        '[data-fluid-role="min"]'
      ) as HTMLInputElement | null
      const inlineMaxInput = container.querySelector(
        '[data-fluid-role="max"]'
      ) as HTMLInputElement | null

      if (!inlineMinInput || !inlineMaxInput) {
        return
      }

      inlineMinInput.value = String($minInput.val() || '')
      inlineMaxInput.value = String($maxInput.val() || '')

      /** Triggers onChange -> setValue() -> live preview chain */
      inlineMinInput.dispatchEvent(new Event('input', { bubbles: true }))
    }

    $minInput.on('input', updateInlineInputs)
    $maxInput.on('input', updateInlineInputs)
  }

  static extractPresetData(option: HTMLElement, presetId: string, setting: string): IPresetData {
    return {
      presetId,
      presetTitle: option.dataset.title || '',
      minSize: option.dataset.minSize || '0',
      minUnit: option.dataset.minUnit || 'px',
      maxSize: option.dataset.maxSize || '0',
      maxUnit: option.dataset.maxUnit || 'px',
      groupId: option.dataset.groupId || 'fluid_spacing_presets',
      setting
    }
  }
}
