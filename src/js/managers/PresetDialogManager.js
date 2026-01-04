import { ValidationService } from '../utils/validation.js'
import { DialogBuilder } from '../utils/dialogBuilder.js'
import { generateClampFormula } from '../utils/clamp.js'
import cssManager from './CSSManager.js'

/**
 * Manages preset dialog creation and lifecycle
 * Centralizes dialog logic to eliminate duplication between view classes
 */
export class PresetDialogManager {
  /**
   * Opens unified preset dialog for create or edit mode
   * @param {'create' | 'edit'} mode - Dialog mode
   * @param {Object} data - Dialog data (minSize, maxSize, presetId, etc.)
   * @param {Object} callbacks - View-specific callbacks
   * @param {Function} callbacks.onCreate - Called when creating preset
   * @param {Function} callbacks.onUpdate - Called when updating preset
   * @param {Function} callbacks.getInlineContainer - Gets inline input container (create mode)
   * @returns {Promise<Dialog>} Elementor dialog instance
   */
  static async open(mode, data, callbacks) {
    // Validate mode
    if (mode !== 'create' && mode !== 'edit') {
      throw new Error(`Invalid mode: ${mode}. Expected 'create' or 'edit'.`)
    }

    // Mode-specific configuration
    const config = this._getDialogConfig(mode, data, callbacks)

    // Store original formula for cancel restoration (edit mode only)
    let originalFormula = null
    let confirmed = false

    if (mode === 'edit' && data.presetId) {
      originalFormula = generateClampFormula(data.minSize, data.minUnit, data.maxSize, data.maxUnit)
    }

    // Create dialog UI
    const { $message, $input, $minInput, $maxInput, $groupSelect, $separator } = this._createDialogMessage(
      config,
      mode
    )

    // Create dialog with mode-specific class
    const modeClass = mode === 'create' ? 'e-fluid-create-preset-dialog' : 'e-fluid-edit-preset-dialog'
    const dialog = elementorCommon.dialogsManager.createWidget('confirm', {
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
        config.onConfirm($input.val(), $groupSelect.val(), $minInput.val(), $maxInput.val())
      },
      onShow: async () => {
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

          // Attach live preview based on mode
          if (mode === 'edit' && data.presetId) {
            // Edit mode: Update CSS variable directly
            this._attachLivePreviewListeners($minInput, $maxInput, data.presetId)
          } else if (mode === 'create' && data.setting && callbacks.getInlineContainer) {
            // Create mode: Mirror to inline inputs
            this._attachCreateModeLivePreview($minInput, $maxInput, data.setting, callbacks.getInlineContainer)
          }
        } catch (error) {
          console.error('[FluidDS] Error in dialog onShow:', error)
        }
      },
      onHide: () => {
        // Restore original CSS if cancelled in edit mode
        if (mode === 'edit' && !confirmed && originalFormula && data.presetId) {
          cssManager.setCssVariable(data.presetId, originalFormula)
        }
      }
    })

    return dialog
  }

  /**
   * Gets mode-specific dialog configuration
   * @private
   */
  static _getDialogConfig(mode, data, callbacks) {
    const configs = {
      create: {
        headerMessage: window.ArtsFluidDSStrings?.saveAsPreset,
        messageText: window.ArtsFluidDSStrings?.createNewPreset,
        confirmButton: window.ArtsFluidDSStrings?.create,
        defaultName: `Custom ${data.minSize}${data.minUnit} ~ ${data.maxSize}${data.maxUnit}`,
        defaultMin: `${data.minSize}${data.minUnit}`,
        defaultMax: `${data.maxSize}${data.maxUnit}`,
        onConfirm: (name, group, minVal, maxVal) => {
          callbacks.onCreate(name, group, minVal, maxVal, data.setting)
        }
      },
      edit: {
        headerMessage: window.ArtsFluidDSStrings?.editPreset,
        messageText: window.ArtsFluidDSStrings?.editPresetMessage,
        confirmButton: window.ArtsFluidDSStrings?.save,
        defaultName: data.presetTitle || '',
        defaultMin: `${data.minSize}${data.minUnit}`,
        defaultMax: `${data.maxSize}${data.maxUnit}`,
        onConfirm: (name, group, minVal, maxVal) => {
          callbacks.onUpdate(data.presetId, name, group || data.groupId, minVal, maxVal)
        }
      }
    }

    return configs[mode]
  }

  /**
   * Creates dialog message DOM with inputs
   * @private
   */
  static _createDialogMessage(config, mode) {
    const $message = jQuery('<div>', { class: 'e-global__confirm-message' })
    const $messageText = jQuery('<div>', { class: 'e-global__confirm-message-text' }).html(
      config.messageText
    )

    const $inputWrapper = jQuery('<div>', { class: 'e-global__confirm-input-wrapper' })

    // Min/Max value inputs
    const $valuesRow = jQuery('<div>', { class: 'e-fluid-dialog-values-row' })

    const $minInput = jQuery('<input>', {
      type: 'text',
      class: 'e-fluid-inline-input e-fluid-dialog-input',
      'data-fluid-role': 'min',
      placeholder: '0px',
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
      placeholder: '0px',
      value: config.defaultMax
    })

    $valuesRow.append($minInput, $separator, $maxInput)

    // Name input
    const $input = DialogBuilder.createNameInput(config.defaultName)

    // Group selector (only in create mode)
    const $groupSelect = mode === 'create' ? DialogBuilder.createGroupSelector() : jQuery('<select>')

    $inputWrapper.append($valuesRow, $input)

    // Only add group selector in create mode
    if (mode === 'create') {
      $inputWrapper.append($groupSelect)
    }

    $message.append($messageText, $inputWrapper)

    return { $message, $input, $minInput, $maxInput, $groupSelect, $separator }
  }

  /**
   * Initializes dialog UI
   * @private
   */
  static async _initializeDialogUI($input, $minInput, $maxInput, $groupSelect, $separator, $confirmButton, data) {
    // Populate and initialize group selector (only exists in create mode)
    if ($groupSelect && $groupSelect.length) {
      await DialogBuilder.populateGroupSelector($groupSelect, data.groupId)
      DialogBuilder.initializeSelect2($groupSelect)
    }

    // Use DialogBuilder helpers for name input
    DialogBuilder.attachEnterKeyHandler($input, $confirmButton)
    DialogBuilder.autoFocusInput($input)

    // Update separator based on value equality
    const updateSeparator = () => {
      const minParsed = ValidationService.parseValueWithUnit($minInput.val())
      const maxParsed = ValidationService.parseValueWithUnit($maxInput.val())

      if (minParsed && maxParsed) {
        const minValue = parseFloat(minParsed.size)
        const maxValue = parseFloat(maxParsed.size)
        const isSameUnit = minParsed.unit === maxParsed.unit
        const isSameValue = minValue === maxValue
        const isNonZero = minValue !== 0 || maxValue !== 0

        // Show "=" only for non-zero equal values with same unit
        // Keep "~" for: 0→0, empty, different values, different units
        const shouldShowEquals = isSameValue && isSameUnit && isNonZero
        $separator.text(shouldShowEquals ? '=' : '~')
      }
    }

    // Combined validation (name + min/max + separator)
    const validateAll = () => {
      // Name validation
      const name = String($input.val() || '').trim()
      const isNameValid = name.length > 0

      // Min/Max validation
      const minParsed = ValidationService.parseValueWithUnit($minInput.val())
      const maxParsed = ValidationService.parseValueWithUnit($maxInput.val())

      $minInput.toggleClass('e-fluid-inline-invalid', !minParsed)
      $maxInput.toggleClass('e-fluid-inline-invalid', !maxParsed)

      const areValuesValid = minParsed && maxParsed

      // Update separator (~ for range, = for same value)
      updateSeparator()

      // Update button state
      $confirmButton.prop('disabled', !(isNameValid && areValuesValid))
    }

    // Attach validation to all inputs
    $input.on('input', validateAll)
    $minInput.on('input', validateAll)
    $maxInput.on('input', validateAll)

    // Set initial state
    validateAll()
  }

  /**
   * Attaches live preview listeners for edit mode
   * @private
   */
  static _attachLivePreviewListeners($minInput, $maxInput, presetId) {
    if (!presetId) {
      return
    }

    const updatePreview = () => {
      const minValue = String($minInput.val() || '')
      const maxValue = String($maxInput.val() || '')

      const minParsed = ValidationService.parseValueWithUnit(minValue)
      const maxParsed = ValidationService.parseValueWithUnit(maxValue)

      // Only update if both values are valid
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

  /**
   * Attaches live preview for create mode (mirrors to inline inputs)
   * @private
   */
  static _attachCreateModeLivePreview($minInput, $maxInput, setting, getInlineContainerFn) {
    const updateInlineInputs = () => {
      // Find inline input container via callback
      const container = getInlineContainerFn(setting)
      if (!container) {
        return
      }

      // Get inline input elements
      const inlineMinInput = container.querySelector('[data-fluid-role="min"]')
      const inlineMaxInput = container.querySelector('[data-fluid-role="max"]')

      if (!inlineMinInput || !inlineMaxInput) {
        return
      }

      // Mirror dialog values to inline inputs
      inlineMinInput.value = String($minInput.val() || '')
      inlineMaxInput.value = String($maxInput.val() || '')

      // Trigger input event on inline inputs
      // This fires onChange → setValue() → Live preview!
      inlineMinInput.dispatchEvent(new Event('input', { bubbles: true }))
    }

    $minInput.on('input', updateInlineInputs)
    $maxInput.on('input', updateInlineInputs)
  }

  /**
   * Extracts preset data from option element
   * @param {HTMLElement} option - Option element with data attributes
   * @param {string} presetId - Preset ID
   * @param {string} setting - Setting name
   * @returns {Object} Preset data object
   */
  static extractPresetData(option, presetId, setting) {
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
