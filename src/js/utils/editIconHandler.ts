import { UI_TIMING } from '../constants/VALUES'

type EditCallback = (presetId: string) => void

interface Select2SelectingEvent extends JQuery.TriggeredEvent {
  params?: {
    args?: {
      originalEvent?: MouseEvent
    }
  }
}

/** Handles edit icon click events in Select2 dropdowns */
export class EditIconHandler {
  private selectEl: HTMLSelectElement
  private onEdit: EditCallback
  private mousedownHandler: ((e: JQuery.TriggeredEvent) => void) | null = null

  constructor(selectElement: HTMLSelectElement, onEditCallback: EditCallback) {
    this.selectEl = selectElement
    this.onEdit = onEditCallback
  }

  /** Attaches all event handlers to Select2 element */
  attach(): void {
    jQuery(this.selectEl)
      .on('select2:selecting', (e) => this._handleSelecting(e as unknown as Select2SelectingEvent))
      .on('select2:open', () => this._handleOpen())
      .on('select2:close', () => this._handleClose())
  }

  /** Removes all event handlers */
  detach(): void {
    jQuery(this.selectEl).off('select2:selecting select2:open select2:close')
    this._cleanupMousedownHandler()
  }

  /** Handles select2:selecting event (fires for non-selected items) */
  private _handleSelecting(e: Select2SelectingEvent): void {
    const clickEvent = e.params?.args?.originalEvent
    if (!clickEvent || !clickEvent.target) {
      return
    }

    // Check if click was on edit icon
    const $clicked = jQuery(clickEvent.target as Element)
    const $icon = $clicked.hasClass('e-fluid-preset-edit-icon')
      ? $clicked
      : $clicked.closest('.e-fluid-preset-edit-icon')

    if (!$icon.length) {
      return
    }

    // Prevent Select2 from selecting the option
    e.preventDefault()

    // Extract preset ID
    const presetId = $icon.data('preset-id') as string

    // Close dropdown first, then open dialog after close completes
    jQuery(this.selectEl).one('select2:close', () => {
      setTimeout(() => {
        this.onEdit(presetId)
      }, UI_TIMING.DIALOG_OPEN_DELAY)
    })

    // Manually close dropdown
    jQuery(this.selectEl).select2('close')
  }

  /** Handles select2:open event - attaches mousedown handler for currently selected items */
  private _handleOpen(): void {
    // Small delay to ensure dropdown is fully rendered
    setTimeout(() => {
      const $dropdown = jQuery('.select2-dropdown')

      // Create mousedown handler
      this.mousedownHandler = (e: JQuery.TriggeredEvent) => {
        e.stopPropagation()
        e.stopImmediatePropagation()
        e.preventDefault()

        const presetId = e.currentTarget ? jQuery(e.currentTarget).data('preset-id') as string : null

        // Close dropdown first, then open dialog
        jQuery(this.selectEl).one('select2:close', () => {
          setTimeout(() => {
            if (presetId) {
              this.onEdit(presetId)
            }
          }, UI_TIMING.DIALOG_OPEN_DELAY)
        })

        jQuery(this.selectEl).select2('close')
      }

      // Attach handler
      $dropdown.on('mousedown.fluidEdit', '.e-fluid-preset-edit-icon', this.mousedownHandler)
    }, UI_TIMING.DROPDOWN_RENDER_DELAY)
  }

  /** Handles select2:close event - cleans up mousedown handler */
  private _handleClose(): void {
    this._cleanupMousedownHandler()
  }

  /** Removes mousedown handler from dropdown */
  private _cleanupMousedownHandler(): void {
    jQuery('.select2-dropdown').off('mousedown.fluidEdit')
    this.mousedownHandler = null
  }
}
