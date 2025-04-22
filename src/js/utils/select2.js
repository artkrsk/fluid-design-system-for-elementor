import { getInheritedPresetSync } from './preset'

class Select2Utils {
  static #createBaseTemplate(className = '', content = '') {
    return jQuery(`
      <span class="select2-result-fluid-spacing-formatted ${className}">
        ${content}
      </span>
    `)
  }

  static #createHeader(content) {
    return `
      <span class="select2-result-fluid-spacing-formatted__header">
        ${content}
      </span>
    `
  }

  static #createFooter(content) {
    return `
      <span class="select2-result-fluid-spacing-formatted__footer">
        ${content}
      </span>
    `
  }

  static #createInheritTemplate(valueDisplay) {
    return Select2Utils.#createBaseTemplate(
      'select2-result-fluid-spacing-formatted--inherit',
      `
        ${Select2Utils.#createHeader(`
          <span class="select2-result-fluid-spacing-formatted__value">${valueDisplay}</span>
        `)}
        ${Select2Utils.#createFooter(`
          <span class="select2-result-fluid-spacing-formatted__title">Inherit</span>
        `)}
      `
    )
  }

  static #createSimpleInheritTemplate(element, text) {
    const inheritedTitle =
      element.getAttribute('data-inherited-title') ||
      text ||
      window.ArtsFluidDSStrings?.inherit ||
      'Inherit'

    return Select2Utils.#createBaseTemplate(
      'select2-result-fluid-spacing-formatted--inherit',
      Select2Utils.#createHeader(`
        <span class="select2-result-fluid-spacing-formatted__title">${inheritedTitle}</span>
      `)
    )
  }

  static #createComplexPresetTemplate(minSize, minUnit, maxSize, maxUnit, name) {
    return Select2Utils.#createBaseTemplate(
      'select2-result-fluid-spacing-formatted--inherit',
      `
        ${Select2Utils.#createHeader(`
          <span class="select2-result-fluid-spacing-formatted__size">${minSize}${minUnit}<span class="select2-result-fluid-spacing-formatted__size-divider"></span>${maxSize}${maxUnit}</span>
        `)}
        ${Select2Utils.#createFooter(`
          <span class="select2-result-fluid-spacing-formatted__title">${name}</span>
        `)}
      `
    )
  }

  static #handleFluidPresetTemplate(valueDisplay) {
    const inheritedPreset = getInheritedPresetSync(valueDisplay)

    if (inheritedPreset && inheritedPreset.isComplex) {
      const { min_size, min_unit, max_size, max_unit, title } = inheritedPreset
      return Select2Utils.#createComplexPresetTemplate(
        min_size,
        min_unit,
        max_size,
        max_unit,
        title
      )
    }

    return Select2Utils.#createInheritTemplate(valueDisplay)
  }

  static #handleEmptyValueTemplate(element, text) {
    const valueDisplay = element.getAttribute('data-value-display')

    if (valueDisplay) {
      const isInheritedPreset = element.getAttribute('data-inherited-preset')

      if (isInheritedPreset) {
        return Select2Utils.#handleFluidPresetTemplate(valueDisplay)
      }

      return Select2Utils.#createInheritTemplate(valueDisplay)
    }

    return Select2Utils.#createSimpleInheritTemplate(element, text)
  }

  static #createInheritedValueTemplate(element, valueDisplay, title) {
    const isCustomValue = element.getAttribute('data-custom-value') === 'true'
    const minSize = element.getAttribute('data-min-size')
    const minUnit = element.getAttribute('data-min-unit')
    const maxSize = element.getAttribute('data-max-size')
    const maxUnit = element.getAttribute('data-max-unit')
    const inheritedTitle = element.getAttribute('data-inherited-title')

    const headerContent = isCustomValue
      ? valueDisplay
      : minSize && maxSize
        ? `${minSize}${minUnit}<span class="select2-result-fluid-spacing-formatted__size-divider"></span>${maxSize}${maxUnit}`
        : valueDisplay || title

    const headerMarkup = isCustomValue
      ? `<span class="select2-result-fluid-spacing-formatted__title select2-result-fluid-spacing-formatted__title--custom">${headerContent}</span>`
      : minSize && maxSize
        ? `<span class="select2-result-fluid-spacing-formatted__size">${headerContent}</span>`
        : `<span class="select2-result-fluid-spacing-formatted__value">${headerContent}</span>`

    const markup = Select2Utils.#createBaseTemplate(
      'select2-result-fluid-spacing-formatted--inherit',
      Select2Utils.#createHeader(headerMarkup)
    )

    if (inheritedTitle && headerContent !== inheritedTitle) {
      markup.append(
        Select2Utils.#createFooter(`
        <span class="select2-result-fluid-spacing-formatted__title">${inheritedTitle}</span>
      `)
      )
    }

    return markup
  }

  static #createInheritedPresetTemplate(minSize, minUnit, maxSize, maxUnit, title, element) {
    const headerContent = `${minSize}${minUnit}<span class="select2-result-fluid-spacing-formatted__size-divider"></span>${maxSize}${maxUnit}`
    const inheritedTitle = element.getAttribute('data-inherited-title')

    const markup = Select2Utils.#createBaseTemplate(
      'select2-result-fluid-spacing-formatted--inherit',
      Select2Utils.#createHeader(`
        <span class="select2-result-fluid-spacing-formatted__title">${headerContent}</span>
      `)
    )

    if (inheritedTitle && headerContent !== inheritedTitle) {
      markup.append(
        Select2Utils.#createFooter(`
        <span class="select2-result-fluid-spacing-formatted__title">${inheritedTitle}</span>
      `)
      )
    }

    return markup
  }

  static #createNormalValueTemplate(
    minSize,
    minUnit,
    maxSize,
    maxUnit,
    title,
    text,
    isTemplateResult,
    element
  ) {
    if (title) {
      const headerContent = `${minSize}${minUnit}<span class="select2-result-fluid-spacing-formatted__size-divider"></span>${maxSize}${maxUnit}`
      const markup = Select2Utils.#createBaseTemplate(
        '',
        Select2Utils.#createHeader(`
          <span class="select2-result-fluid-spacing-formatted__size">${headerContent}</span>
        `)
      )

      if (title !== headerContent) {
        let footerContent = `<span class="select2-result-fluid-spacing-formatted__title">${title}</span>`

        if (isTemplateResult) {
          const minScreenWidthSize = element.getAttribute('data-min-screen-width-size') || ''
          const minScreenWidthUnit = element.getAttribute('data-min-screen-width-unit') || ''
          const maxScreenWidthSize = element.getAttribute('data-max-screen-width-size') || ''
          const maxScreenWidthUnit = element.getAttribute('data-max-screen-width-unit') || ''

          footerContent += `
            <span class="select2-result-fluid-spacing-formatted__divider"></span>
            <span class="select2-result-fluid-spacing-formatted__screen-width">${minScreenWidthSize}${minScreenWidthUnit} – ${maxScreenWidthSize}${maxScreenWidthUnit}</span>
          `
        }

        markup.append(Select2Utils.#createFooter(footerContent))
      }

      return markup
    }

    return Select2Utils.#createBaseTemplate(
      '',
      Select2Utils.#createHeader(`
        <span class="select2-result-fluid-spacing-formatted__title">${text}</span>
      `)
    )
  }

  static #handleNonEmptyValueTemplate(element, text, isTemplateResult) {
    const isInheritedPreset = element.getAttribute('data-inherited-preset')
    const isInheritedValue = element.getAttribute('data-inherited-value')
    const title = element.getAttribute('data-title') || ''
    const minSize = element.getAttribute('data-min-size') || ''
    const minUnit = element.getAttribute('data-min-unit') || ''
    const maxSize = element.getAttribute('data-max-size') || ''
    const maxUnit = element.getAttribute('data-max-unit') || ''
    const valueDisplay = element.getAttribute('data-value-display') || ''

    if (isInheritedValue) {
      return Select2Utils.#createInheritedValueTemplate(element, valueDisplay, title)
    } else if (isInheritedPreset) {
      return Select2Utils.#createInheritedPresetTemplate(
        minSize,
        minUnit,
        maxSize,
        maxUnit,
        title,
        element
      )
    }

    return Select2Utils.#createNormalValueTemplate(
      minSize,
      minUnit,
      maxSize,
      maxUnit,
      title,
      text,
      isTemplateResult,
      element
    )
  }

  static getTemplateSelect2(state, isTemplateResult) {
    if (!state.element) {
      return state.text
    }

    const { element } = state

    if (element.value === '') {
      return Select2Utils.#handleEmptyValueTemplate(element, state.text)
    }

    return Select2Utils.#handleNonEmptyValueTemplate(element, state.text, isTemplateResult)
  }

  static getSelect2DefaultOptions() {
    return {
      closeOnSelect: true,
      dropdownAutoWidth: true,
      theme: 'default select2-container--width-auto',
      containerCssClass: 'select2-selection--height-large',
      templateResult: (state) => Select2Utils.getTemplateSelect2(state, true),
      templateSelection: (state) => Select2Utils.getTemplateSelect2(state, false)
    }
  }
}

export const { getSelect2DefaultOptions } = Select2Utils
