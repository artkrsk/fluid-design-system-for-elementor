class SpinnerUtils {
  static #getSpinnerHTML() {
    return `<span class="elementor-control-spinner" style="display: none;">&nbsp;<i class="eicon-spinner eicon-animation-spin"></i>&nbsp;</span>`
  }

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

  static showControlSpinner(el) {
    if (!el) {
      return null
    }

    let spinnerEl = el.querySelector('.elementor-control-spinner')

    if (!spinnerEl) {
      spinnerEl = SpinnerUtils.addControlSpinner(el)
    }

    if (spinnerEl) {
      spinnerEl.style.display = 'block'
    }

    return spinnerEl
  }

  static hideControlSpinner(el) {
    if (!el) {
      return null
    }

    const spinnerEl = el.querySelector('.elementor-control-spinner')

    if (spinnerEl) {
      spinnerEl.style.display = 'none'
    }

    return spinnerEl
  }
}

export const { addControlSpinner, showControlSpinner, hideControlSpinner } = SpinnerUtils
