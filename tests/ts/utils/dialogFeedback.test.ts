import { describe, it, expect, beforeEach } from 'vitest'
import {
  setDialogBusy,
  showDialogError,
  clearDialogError,
  toErrorMessage
} from '@/utils/dialogFeedback'

/** Mirrors the markup dialogs-manager builds around PresetDialogManager's message */
function createDialogWidget(): HTMLElement {
  const widget = document.createElement('div')
  widget.className = 'dialog-widget'
  widget.innerHTML = `
    <div class="e-global__confirm-message">
      <div class="e-global__confirm-input-wrapper">
        <input type="text" data-fluid-role="min" />
        <input type="text" name="preset-name" />
        <select class="e-fluid-group-select"></select>
      </div>
    </div>
    <div class="dialog-buttons-wrapper">
      <button class="dialog-button dialog-cancel">Cancel</button>
      <button class="dialog-button dialog-ok">Create</button>
    </div>
  `
  return widget
}

describe('dialogFeedback', () => {
  let widget: HTMLElement

  beforeEach(() => {
    widget = createDialogWidget()
  })

  describe('setDialogBusy', () => {
    it('marks the dialog busy, disables every control and spins the confirm button', () => {
      setDialogBusy(widget, true)

      expect(widget.classList.contains('e-fluid-dialog-busy')).toBe(true)

      const controls = widget.querySelectorAll<HTMLButtonElement>('button, input, select')
      expect(controls.length).toBe(5)
      controls.forEach(control => expect(control.disabled).toBe(true))

      const spinners = widget.querySelectorAll('.dialog-ok .e-fluid-dialog-spinner')
      expect(spinners.length).toBe(1)
      expect(spinners[0].classList.contains('eicon-spinner')).toBe(true)
      expect(spinners[0].classList.contains('eicon-animation-spin')).toBe(true)
    })

    it('stays idempotent when called twice', () => {
      setDialogBusy(widget, true)
      setDialogBusy(widget, true)

      expect(widget.querySelectorAll('.e-fluid-dialog-spinner').length).toBe(1)
    })

    it('restores the dialog when busy is cleared', () => {
      setDialogBusy(widget, true)
      setDialogBusy(widget, false)

      expect(widget.classList.contains('e-fluid-dialog-busy')).toBe(false)
      widget
        .querySelectorAll<HTMLButtonElement>('button, input, select')
        .forEach(control => expect(control.disabled).toBe(false))
      expect(widget.querySelector('.e-fluid-dialog-spinner')).toBeNull()
    })

    it('ignores a missing widget', () => {
      expect(() => setDialogBusy(null, true)).not.toThrow()
    })

    it('still locks the controls when the widget has no confirm button', () => {
      widget.querySelector('.dialog-ok')?.remove()

      setDialogBusy(widget, true)

      expect(widget.classList.contains('e-fluid-dialog-busy')).toBe(true)
      widget
        .querySelectorAll<HTMLButtonElement>('button, input, select')
        .forEach(control => expect(control.disabled).toBe(true))
      expect(widget.querySelector('.e-fluid-dialog-spinner')).toBeNull()
    })
  })

  describe('showDialogError', () => {
    it('renders the message inside the dialog message', () => {
      showDialogError(widget, 'Server said no')

      const errorEl = widget.querySelector('.e-global__confirm-message > .e-fluid-dialog-error')
      expect(errorEl?.textContent).toBe('Server said no')
    })

    it('reuses a single node and replaces its text', () => {
      showDialogError(widget, 'First')
      showDialogError(widget, 'Second')

      const errors = widget.querySelectorAll('.e-fluid-dialog-error')
      expect(errors.length).toBe(1)
      expect(errors[0].textContent).toBe('Second')
    })

    it('renders the message as text, never as markup', () => {
      showDialogError(widget, '<b>boom</b>')

      expect(widget.querySelector('.e-fluid-dialog-error b')).toBeNull()
      expect(widget.querySelector('.e-fluid-dialog-error')?.textContent).toBe('<b>boom</b>')
    })

    it('ignores a missing widget', () => {
      expect(() => showDialogError(null, 'nope')).not.toThrow()
    })
  })

  describe('clearDialogError', () => {
    it('removes a rendered error and tolerates its absence', () => {
      showDialogError(widget, 'Gone soon')
      clearDialogError(widget)

      expect(widget.querySelector('.e-fluid-dialog-error')).toBeNull()
      expect(() => clearDialogError(widget)).not.toThrow()
      expect(() => clearDialogError(null)).not.toThrow()
    })
  })

  describe('toErrorMessage', () => {
    it('keeps a non-empty string', () => {
      expect(toErrorMessage('  boom  ', 'fallback')).toBe('boom')
    })

    it('reads the message of an Error or an error-shaped object', () => {
      expect(toErrorMessage(new Error('bad request'), 'fallback')).toBe('bad request')
      expect(toErrorMessage({ message: 'ajax died' }, 'fallback')).toBe('ajax died')
    })

    it('falls back for anything without a usable message', () => {
      expect(toErrorMessage('', 'fallback')).toBe('fallback')
      expect(toErrorMessage(undefined, 'fallback')).toBe('fallback')
      expect(toErrorMessage({}, 'fallback')).toBe('fallback')
      expect(toErrorMessage(500, 'fallback')).toBe('fallback')
      expect(toErrorMessage(new Error(''), 'fallback')).toBe('fallback')
    })
  })
})
