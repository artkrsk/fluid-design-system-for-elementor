import { PresetAPIService } from '../services/presetAPI'
import { SELECT2_CONFIG } from '../constants'

/** Dialog building utilities for preset dialogs */
export class DialogBuilder {
  /** Creates read-only preview display of min/max values */
  static createPreviewDisplay(minSize: string, minUnit: string, maxSize: string, maxUnit: string): JQuery {
    const previewText = `${minSize}${minUnit} ~ ${maxSize}${maxUnit}`
    return jQuery('<div>', {
      class: 'e-fluid-preset-preview',
      text: previewText
    })
  }

  /** Creates preset name input field */
  static createNameInput(defaultValue: string = '', placeholder: string | null = null): JQuery {
    return jQuery('<input>', {
      type: 'text',
      name: 'preset-name',
      placeholder: placeholder || window.ArtsFluidDSStrings?.presetName,
      value: defaultValue
    })
  }

  /** Creates group selector dropdown */
  static createGroupSelector(): JQuery {
    return jQuery('<select>', {
      name: 'preset-group',
      class: 'e-fluid-group-select'
    })
  }

  /** Populates group selector with available groups */
  static async populateGroupSelector($select: JQuery, defaultGroup: string | null = null): Promise<void> {
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

  /** Initializes Select2 on group selector */
  static initializeSelect2($select: JQuery, options: Record<string, unknown> = {}): void {
    const defaultOptions = {
      minimumResultsForSearch: SELECT2_CONFIG.HIDE_SEARCH_BOX,
      width: '100%'
    }
    $select.select2({ ...defaultOptions, ...options })
  }

  /** Attaches name validation to input field */
  static attachNameValidation($input: JQuery, $button: JQuery): void {
    $input.on('input', () => {
      const inputValue = String($input.val() || '')
      const isNameValid = inputValue.trim().length > 0
      $button.prop('disabled', !isNameValid)
    })
  }

  /** Attaches Enter key handler for form submission */
  static attachEnterKeyHandler($input: JQuery, $button: JQuery): void {
    $input.on('keydown', (e) => {
      if (e.key === 'Enter' && !$button.prop('disabled')) {
        e.preventDefault()
        $button.click()
      }
    })
  }

  /** Auto-focuses input and selects text */
  static autoFocusInput($input: JQuery, delay: number = 50): void {
    setTimeout(() => {
      $input.focus().select()
    }, delay)
  }

  /** Sets initial button state based on input value */
  static setInitialButtonState($input: JQuery, $button: JQuery): void {
    const initialValue = String($input.val() || '')
    const hasInitialName = initialValue.trim().length > 0
    $button.prop('disabled', !hasInitialName)
  }
}
