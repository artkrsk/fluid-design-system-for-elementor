const BUSY_CLASS = 'e-fluid-dialog-busy'
const SPINNER_CLASS = 'e-fluid-dialog-spinner'
const ERROR_CLASS = 'e-fluid-dialog-error'
const CONFIRM_BUTTON_SELECTOR = '.dialog-ok'
const MESSAGE_SELECTOR = '.e-global__confirm-message'

/** Locks the dialog while a request is in flight and spins the confirm button */
export function setDialogBusy(widgetEl: HTMLElement | null, busy: boolean): void {
  if (!widgetEl) {
    return
  }

  widgetEl.classList.toggle(BUSY_CLASS, busy)

  // Disabling every control (not just the buttons) keeps the input-bound validation
  // from re-enabling the confirm button mid-request.
  const controls = widgetEl.querySelectorAll<HTMLButtonElement>('button, input, select')
  for (const control of controls) {
    control.disabled = busy
  }

  const confirmButton = widgetEl.querySelector(CONFIRM_BUTTON_SELECTOR)
  if (!confirmButton) {
    return
  }

  const spinner = confirmButton.querySelector(`.${SPINNER_CLASS}`)

  if (busy && !spinner) {
    confirmButton.insertAdjacentHTML(
      'afterbegin',
      `<i class="eicon-spinner eicon-animation-spin ${SPINNER_CLASS}"></i>`
    )
  } else if (!busy && spinner) {
    spinner.remove()
  }
}

/** Shows a failure message inside the dialog so the user can fix the input and retry */
export function showDialogError(widgetEl: HTMLElement | null, message: string): void {
  const messageEl = widgetEl?.querySelector(MESSAGE_SELECTOR)
  if (!messageEl) {
    return
  }

  let errorEl = messageEl.querySelector(`.${ERROR_CLASS}`)

  if (!errorEl) {
    errorEl = document.createElement('div')
    errorEl.className = ERROR_CLASS
    messageEl.appendChild(errorEl)
  }

  errorEl.textContent = message
}

export function clearDialogError(widgetEl: HTMLElement | null): void {
  widgetEl?.querySelector(`.${ERROR_CLASS}`)?.remove()
}

/** Normalizes what the editor AJAX layer rejects with (string, Error or jqXHR-ish object) */
export function toErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'string' && error.trim()) {
    return error.trim()
  }

  const message = (error as { message?: unknown } | null | undefined)?.message

  if (typeof message === 'string' && message.trim()) {
    return message.trim()
  }

  return fallback
}
