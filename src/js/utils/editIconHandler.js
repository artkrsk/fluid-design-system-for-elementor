import { UI_TIMING } from '../constants/VALUES.js'

/**
 * Handles edit icon click events in Select2 dropdowns
 * Encapsulates event lifecycle for testability and clarity
 */
export class EditIconHandler {
  /**
   * Creates an edit icon handler for a Select2 element
   * @param {HTMLSelectElement} selectElement - Select element with Select2
   * @param {Function} onEditCallback - Callback when edit icon clicked (receives presetId)
   */
  constructor(selectElement, onEditCallback) {
    this.selectEl = selectElement
    this.onEdit = onEditCallback
    this.mousedownHandler = null
  }

  /**
   * Attaches all event handlers to Select2 element
   */
  attach() {
    jQuery(this.selectEl)
      .on('select2:selecting', (e) => this._handleSelecting(e))
      .on('select2:open', () => this._handleOpen())
      .on('select2:close', () => this._handleClose())
  }

  /**
   * Removes all event handlers
   */
  detach() {
    jQuery(this.selectEl).off('select2:selecting select2:open select2:close')
    this._cleanupMousedownHandler()
  }

  /**
   * Handles select2:selecting event (fires for non-selected items)
   * @private
   */
  _handleSelecting(e) {
    const clickEvent = e.params?.args?.originalEvent
    if (!clickEvent || !clickEvent.target) {
      return
    }

    // Check if click was on edit icon
    const $clicked = jQuery(clickEvent.target)
    const $icon = $clicked.hasClass('e-fluid-preset-edit-icon')
      ? $clicked
      : $clicked.closest('.e-fluid-preset-edit-icon')

    if (!$icon.length) {
      return
    }

    // Prevent Select2 from selecting the option
    e.preventDefault()

    // Extract preset ID
    const presetId = $icon.data('preset-id')

    // Close dropdown first, then open dialog after close completes
    jQuery(this.selectEl).one('select2:close', () => {
      setTimeout(() => {
        this.onEdit(presetId)
      }, UI_TIMING.DIALOG_OPEN_DELAY)
    })

    // Manually close dropdown
    jQuery(this.selectEl).select2('close')
  }

  /**
   * Handles select2:open event
   * Attaches mousedown handler for currently selected items
   * (select2:selecting doesn't fire for selected items)
   * @private
   */
  _handleOpen() {
    // Small delay to ensure dropdown is fully rendered
    setTimeout(() => {
      const $dropdown = jQuery('.select2-dropdown')

      // Create mousedown handler
      this.mousedownHandler = (e) => {
        e.stopPropagation()
        e.stopImmediatePropagation()
        e.preventDefault()

        const presetId = jQuery(e.currentTarget).data('preset-id')

        // Close dropdown first, then open dialog
        jQuery(this.selectEl).one('select2:close', () => {
          setTimeout(() => {
            this.onEdit(presetId)
          }, UI_TIMING.DIALOG_OPEN_DELAY)
        })

        jQuery(this.selectEl).select2('close')
      }

      // Attach handler
      $dropdown.on('mousedown.fluidEdit', '.e-fluid-preset-edit-icon', this.mousedownHandler)
    }, UI_TIMING.DROPDOWN_RENDER_DELAY)
  }

  /**
   * Handles select2:close event
   * Cleans up mousedown handler
   * @private
   */
  _handleClose() {
    this._cleanupMousedownHandler()
  }

  /**
   * Removes mousedown handler from dropdown
   * @private
   */
  _cleanupMousedownHandler() {
    jQuery('.select2-dropdown').off('mousedown.fluidEdit')
    this.mousedownHandler = null
  }
}
