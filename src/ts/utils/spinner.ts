class SpinnerUtils {
  static #getSpinnerHTML(): string {
    return `<span class="elementor-control-spinner" style="display: none;">&nbsp;<i class="eicon-spinner eicon-animation-spin"></i>&nbsp;</span>`
  }

  static addControlSpinner(el: HTMLElement | undefined): Element | null | undefined {
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

    return null
  }

  static showControlSpinner(el: HTMLElement | undefined): HTMLElement | null {
    if (!el) {
      return null
    }

    let spinnerEl = el.querySelector('.elementor-control-spinner') as HTMLElement | null

    if (!spinnerEl) {
      spinnerEl = SpinnerUtils.addControlSpinner(el) as HTMLElement | null
    }

    if (spinnerEl) {
      spinnerEl.style.display = 'block'
    }

    return spinnerEl
  }

  static hideControlSpinner(el: HTMLElement | undefined): HTMLElement | null {
    if (!el) {
      return null
    }

    const spinnerEl = el.querySelector('.elementor-control-spinner') as HTMLElement | null

    if (spinnerEl) {
      spinnerEl.style.display = 'none'
    }

    return spinnerEl
  }
}

export const { addControlSpinner, showControlSpinner, hideControlSpinner } = SpinnerUtils
