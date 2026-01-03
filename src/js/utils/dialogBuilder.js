import { PresetAPIService } from '../services/presetAPI.js'

/**
 * Dialog building utilities for preset dialogs
 * Pure helper functions with no complex logic or timing dependencies
 * Extracted from duplicated dialog creation code for safety and reusability
 */
export class DialogBuilder {
  /**
   * Creates read-only preview display of min/max values
   * @param {string} minSize - Minimum size
   * @param {string} minUnit - Minimum unit
   * @param {string} maxSize - Maximum size
   * @param {string} maxUnit - Maximum unit
   * @returns {jQuery} Preview element
   */
  static createPreviewDisplay(minSize, minUnit, maxSize, maxUnit) {
    const previewText = `${minSize}${minUnit} ~ ${maxSize}${maxUnit}`
    return jQuery('<div>', {
      class: 'e-fluid-preset-preview',
      text: previewText
    })
  }

  /**
   * Creates preset name input field
   * @param {string} defaultValue - Default input value
   * @param {string} placeholder - Input placeholder text (defaults to translation)
   * @returns {jQuery} Input element
   */
  static createNameInput(defaultValue = '', placeholder = null) {
    return jQuery('<input>', {
      type: 'text',
      name: 'preset-name',
      placeholder: placeholder || window.ArtsFluidDSStrings?.presetName,
      value: defaultValue
    })
  }

  /**
   * Creates group selector dropdown
   * @returns {jQuery} Select element
   */
  static createGroupSelector() {
    return jQuery('<select>', {
      name: 'preset-group',
      class: 'e-fluid-group-select'
    })
  }

  /**
   * Populates group selector with available groups
   * Uses PresetAPIService to fetch groups, falls back to defaults on error
   * @param {jQuery} $select - Select element to populate
   * @param {string} defaultGroup - Optional group ID to pre-select
   */
  static async populateGroupSelector($select, defaultGroup = null) {
    try {
      const groups = await PresetAPIService.fetchGroups()

      if (!groups || !Array.isArray(groups) || groups.length === 0) {
        // Fallback to default groups
        $select.append(
          jQuery('<option>', { value: 'fluid_spacing_presets', text: window.ArtsFluidDSStrings?.spacingPresets }),
          jQuery('<option>', { value: 'fluid_typography_presets', text: window.ArtsFluidDSStrings?.typographyPresets })
        )
        return
      }

      // Add all groups with proper IDs
      for (const group of groups) {
        $select.append(
          jQuery('<option>', {
            value: group.id,
            text: group.name
          })
        )
      }

      // Pre-select group if provided
      if (defaultGroup) {
        $select.val(defaultGroup)
      }
    } catch {
      // Fallback on error
      $select.append(
        jQuery('<option>', { value: 'fluid_spacing_presets', text: window.ArtsFluidDSStrings?.spacingPresets }),
        jQuery('<option>', { value: 'fluid_typography_presets', text: window.ArtsFluidDSStrings?.typographyPresets })
      )
    }
  }

  /**
   * Initializes Select2 on group selector
   * @param {jQuery} $select - Select element
   * @param {Object} options - Optional Select2 options to merge
   */
  static initializeSelect2($select, options = {}) {
    const defaultOptions = {
      minimumResultsForSearch: -1, // Hide search box
      width: '100%'
    }
    $select.select2({ ...defaultOptions, ...options })
  }

  /**
   * Attaches name validation to input field
   * Updates button state based on input validity
   * @param {jQuery} $input - Name input element
   * @param {jQuery} $button - Confirm button element
   */
  static attachNameValidation($input, $button) {
    $input.on('input', () => {
      const inputValue = String($input.val() || '')
      const isNameValid = inputValue.trim().length > 0
      $button.prop('disabled', !isNameValid)
    })
  }

  /**
   * Attaches Enter key handler for form submission
   * @param {jQuery} $input - Input element to listen on
   * @param {jQuery} $button - Button to click on Enter
   */
  static attachEnterKeyHandler($input, $button) {
    $input.on('keydown', (e) => {
      if (e.key === 'Enter' && !$button.prop('disabled')) {
        e.preventDefault()
        $button.click()
      }
    })
  }

  /**
   * Auto-focuses input and selects text
   * @param {jQuery} $input - Input element to focus
   * @param {number} delay - Delay in milliseconds (default 50)
   */
  static autoFocusInput($input, delay = 50) {
    setTimeout(() => {
      $input.focus().select()
    }, delay)
  }

  /**
   * Sets initial button state based on input value
   * @param {jQuery} $input - Input element to check
   * @param {jQuery} $button - Button to enable/disable
   */
  static setInitialButtonState($input, $button) {
    const initialValue = String($input.val() || '')
    const hasInitialName = initialValue.trim().length > 0
    $button.prop('disabled', !hasInitialName)
  }
}
