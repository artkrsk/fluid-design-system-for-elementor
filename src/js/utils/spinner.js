class SpinnerUtils {
  static #getSpinnerHTML() {
    return `<span class="elementor-control-spinner" style="display: none;">&nbsp;<i class="eicon-spinner eicon-animation-spin"></i>&nbsp;</span>`
  }

  /** @param {HTMLElement | undefined} el */
  static addControlSpinner(el) {
    if (!el) {
      return null
    }

    const titleEl = el.querySelector('.elementor-control-title')
    const switcherEl = el.querySelector('.elementor-control-responsive-switchers')
    const spinnerMarkup = SpinnerUtils.#getSpinnerHTML()

    if (switcherEl) {
      switcherEl.insertAdjacentHTML('afterend', spinnerMarkup)
      return switcherEl.nextElementSibling
    } else if (titleEl) {
      titleEl.insertAdjacentHTML('afterend', spinnerMarkup)
      return titleEl.nextElementSibling
    }
  }

  /** @param {HTMLElement | undefined} el */
  static showControlSpinner(el) {
    if (!el) {
      return null
    }

    /** @type {HTMLElement | null} */
    let spinnerEl = /** @type {HTMLElement | null} */ (el.querySelector('.elementor-control-spinner'))

    if (!spinnerEl) {
      spinnerEl = /** @type {HTMLElement | null} */ (SpinnerUtils.addControlSpinner(el))
    }

    if (spinnerEl) {
      spinnerEl.style.display = 'block'
    }

    return spinnerEl
  }

  /** @param {HTMLElement | undefined} el */
  static hideControlSpinner(el) {
    if (!el) {
      return null
    }

    const spinnerEl = /** @type {HTMLElement | null} */ (el.querySelector('.elementor-control-spinner'))

    if (spinnerEl) {
      spinnerEl.style.display = 'none'
    }

    return spinnerEl
  }
}

export const { addControlSpinner, showControlSpinner, hideControlSpinner } = SpinnerUtils
