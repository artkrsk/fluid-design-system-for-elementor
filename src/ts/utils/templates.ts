import { ValueFormatter } from './formatters'
import { getInheritedPresetSync } from './preset'
import type { TSelect2State } from '../types'

/** HTML template generation utilities for Select2 preset options */
export class TemplateRenderer {
  /** Escapes HTML special characters to prevent XSS */
  private static escapeHtml(str: string | null | undefined): string {
    if (!str) { return '' }
    const div = document.createElement('div')
    div.textContent = str
    return div.innerHTML
  }

  /** Creates a base template container */
  static createBaseTemplate(className: string = '', content: string = ''): JQuery<HTMLElement> {
    return jQuery(`
      <span class="select2-result-fluid-spacing-formatted ${className}">
        ${content}
      </span>
    `)
  }

  /** Creates a header section */
  static createHeader(content: string): string {
    return `
      <span class="select2-result-fluid-spacing-formatted__header">
        ${content}
      </span>
    `
  }

  /** Creates a footer section */
  static createFooter(content: string): string {
    return `
      <span class="select2-result-fluid-spacing-formatted__footer">
        ${content}
      </span>
    `
  }

  /** Creates template for inherited value */
  static createInheritTemplate(valueDisplay: string): JQuery<HTMLElement> {
    return TemplateRenderer.createBaseTemplate(
      'select2-result-fluid-spacing-formatted--inherit',
      `
        ${TemplateRenderer.createHeader(`
          <span class="select2-result-fluid-spacing-formatted__value">${valueDisplay}</span>
        `)}
        ${TemplateRenderer.createFooter(`
          <span class="select2-result-fluid-spacing-formatted__title">${window.ArtsFluidDSStrings?.inherit}</span>
        `)}
      `
    )
  }

  /** Creates simple inherit template */
  static createSimpleInheritTemplate(element: HTMLElement, text: string): JQuery<HTMLElement> {
    const inheritedTitle =
      TemplateRenderer.escapeHtml(element.getAttribute('data-inherited-title')) || text || window.ArtsFluidDSStrings?.inherit

    return TemplateRenderer.createBaseTemplate(
      'select2-result-fluid-spacing-formatted--inherit',
      TemplateRenderer.createHeader(`
        <span class="select2-result-fluid-spacing-formatted__title">${inheritedTitle}</span>
      `)
    )
  }

  /** Creates template for complex preset (with min/max values) */
  static createComplexPresetTemplate(
    minSize: string,
    minUnit: string,
    maxSize: string,
    maxUnit: string,
    name: string
  ): JQuery<HTMLElement> {
    return TemplateRenderer.createBaseTemplate(
      'select2-result-fluid-spacing-formatted--inherit',
      `
        ${TemplateRenderer.createHeader(`
          <span class="select2-result-fluid-spacing-formatted__size">${ValueFormatter.formatSizeRange(minSize, minUnit, maxSize, maxUnit, { includeSpan: true })}</span>
        `)}
        ${TemplateRenderer.createFooter(`
          <span class="select2-result-fluid-spacing-formatted__title">${name}</span>
        `)}
      `
    )
  }

  /** Handles fluid preset template rendering */
  static handleFluidPresetTemplate(valueDisplay: string): JQuery<HTMLElement> {
    const inheritedPreset = getInheritedPresetSync(valueDisplay)

    if (inheritedPreset && inheritedPreset.isComplex) {
      const { min_size, min_unit, max_size, max_unit, title } = inheritedPreset
      return TemplateRenderer.createComplexPresetTemplate(
        min_size,
        min_unit,
        max_size,
        max_unit,
        title
      )
    }

    return TemplateRenderer.createInheritTemplate(valueDisplay)
  }

  /** Handles empty value template */
  static handleEmptyValueTemplate(element: HTMLElement, text: string): JQuery<HTMLElement> {
    const valueDisplay = TemplateRenderer.escapeHtml(element.getAttribute('data-value-display'))

    if (valueDisplay) {
      const isInheritedPreset = element.getAttribute('data-inherited-preset')

      if (isInheritedPreset) {
        return TemplateRenderer.handleFluidPresetTemplate(valueDisplay)
      }

      return TemplateRenderer.createInheritTemplate(valueDisplay)
    }

    return TemplateRenderer.createSimpleInheritTemplate(element, text)
  }

  /** Creates template for inherited value */
  static createInheritedValueTemplate(
    element: HTMLElement,
    valueDisplay: string,
    title: string
  ): JQuery<HTMLElement> {
    const isCustomValue = element.getAttribute('data-custom-value') === 'true'
    const minSize = element.getAttribute('data-min-size')
    const minUnit = element.getAttribute('data-min-unit')
    const maxSize = element.getAttribute('data-max-size')
    const maxUnit = element.getAttribute('data-max-unit')
    const inheritedTitle = TemplateRenderer.escapeHtml(element.getAttribute('data-inherited-title'))

    // For simple values without min/max sizes
    if (!minSize || !maxSize) {
      const simpleHeaderContent = valueDisplay || title
      const simpleMarkup = TemplateRenderer.createBaseTemplate(
        'select2-result-fluid-spacing-formatted--inherit',
        TemplateRenderer.createHeader(`
        <span class="select2-result-fluid-spacing-formatted__title">${simpleHeaderContent}</span>
      `)
      )

      if (inheritedTitle && simpleHeaderContent !== inheritedTitle) {
        simpleMarkup.append(
          TemplateRenderer.createFooter(`
          <span class="select2-result-fluid-spacing-formatted__title">${inheritedTitle}</span>
        `)
        )
      }

      return simpleMarkup
    }

    // Continue with existing logic for complex values
    const headerContent = isCustomValue
      ? valueDisplay
      : minSize && maxSize
        ? ValueFormatter.formatSizeRange(minSize, minUnit ?? 'px', maxSize, maxUnit ?? 'px', {
            includeSpan: true
          })
        : valueDisplay || title

    const headerMarkup = isCustomValue
      ? `<span class="select2-result-fluid-spacing-formatted__title select2-result-fluid-spacing-formatted__title--custom">${headerContent}</span>`
      : minSize && maxSize
        ? `<span class="select2-result-fluid-spacing-formatted__size">${headerContent}</span>`
        : `<span class="select2-result-fluid-spacing-formatted__value">${headerContent}</span>`

    const markup = TemplateRenderer.createBaseTemplate(
      'select2-result-fluid-spacing-formatted--inherit',
      TemplateRenderer.createHeader(headerMarkup)
    )

    if (inheritedTitle && headerContent !== inheritedTitle) {
      markup.append(
        TemplateRenderer.createFooter(`
        <span class="select2-result-fluid-spacing-formatted__title">${inheritedTitle}</span>
      `)
      )
    }

    return markup
  }

  /** Creates template for inherited preset */
  static createInheritedPresetTemplate(
    minSize: string,
    minUnit: string,
    maxSize: string,
    maxUnit: string,
    title: string,
    element: HTMLElement
  ): JQuery<HTMLElement> {
    const headerContent = ValueFormatter.formatSizeRange(minSize, minUnit, maxSize, maxUnit, {
      includeSpan: true
    })
    const inheritedTitle = TemplateRenderer.escapeHtml(element.getAttribute('data-inherited-title'))

    const markup = TemplateRenderer.createBaseTemplate(
      'select2-result-fluid-spacing-formatted--inherit',
      TemplateRenderer.createHeader(`
        <span class="select2-result-fluid-spacing-formatted__title">${headerContent}</span>
      `)
    )

    if (inheritedTitle && headerContent !== inheritedTitle) {
      markup.append(
        TemplateRenderer.createFooter(`
        <span class="select2-result-fluid-spacing-formatted__title">${inheritedTitle}</span>
      `)
      )
    }

    return markup
  }

  /** Creates template for custom preset */
  static createCustomPresetTemplate(displayValue: string, title: string): JQuery<HTMLElement> {
    const markup = TemplateRenderer.createBaseTemplate(
      '',
      TemplateRenderer.createHeader(`
        <span class="select2-result-fluid-spacing-formatted__size">${displayValue}</span>
      `)
    )

    // Add footer with title if it's different from the display value
    if (title && title !== displayValue) {
      markup.append(
        TemplateRenderer.createFooter(`
          <span class="select2-result-fluid-spacing-formatted__title">${title}</span>
        `)
      )
    }

    return markup
  }

  /** Creates template for normal value */
  static createNormalValueTemplate(
    minSize: string,
    minUnit: string,
    maxSize: string,
    maxUnit: string,
    title: string,
    text: string,
    isTemplateResult: boolean,
    element: HTMLElement
  ): JQuery<HTMLElement> {
    // If we have a title but no min/max sizes, render simple title-only template
    if (title && (!minSize || !maxSize)) {
      return TemplateRenderer.createBaseTemplate(
        '',
        TemplateRenderer.createHeader(`
        <span class="select2-result-fluid-spacing-formatted__title">${title}</span>
      `)
      )
    }

    // If we have title and min/max sizes, render the full complex template
    if (title) {
      const headerContent = ValueFormatter.formatSizeRange(minSize, minUnit, maxSize, maxUnit, {
        includeSpan: true
      })
      const markup = TemplateRenderer.createBaseTemplate(
        '',
        TemplateRenderer.createHeader(`
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

        markup.append(TemplateRenderer.createFooter(footerContent))
      }

      // Add edit icon for editable presets (only in dropdown results, not selection)
      if (isTemplateResult && element.getAttribute('data-editable') === 'true') {
        const presetId = element.getAttribute('data-id')
        const $editIcon = jQuery('<i>', {
          class: 'eicon-edit e-fluid-preset-edit-icon',
          'data-preset-id': presetId,
          title: window.ArtsFluidDSStrings?.editPreset || 'Edit Preset'
        })

        markup.append($editIcon)
      }

      return markup
    }

    return TemplateRenderer.createBaseTemplate(
      '',
      TemplateRenderer.createHeader(`
        <span class="select2-result-fluid-spacing-formatted__title">${text}</span>
      `)
    )
  }

  /** Handles non-empty value template */
  static handleNonEmptyValueTemplate(
    element: HTMLElement,
    text: string,
    isTemplateResult: boolean
  ): JQuery<HTMLElement> {
    const isInheritedPreset = element.getAttribute('data-inherited-preset')
    const isInheritedValue = element.getAttribute('data-inherited-value')
    const title = TemplateRenderer.escapeHtml(element.getAttribute('data-title')) || ''
    const minSize = element.getAttribute('data-min-size') || ''
    const minUnit = element.getAttribute('data-min-unit') || ''
    const maxSize = element.getAttribute('data-max-size') || ''
    const maxUnit = element.getAttribute('data-max-unit') || ''
    const valueDisplay = TemplateRenderer.escapeHtml(element.getAttribute('data-value-display')) || ''
    const customDisplayValue = TemplateRenderer.escapeHtml(element.getAttribute('data-display-value')) || ''

    if (isInheritedValue) {
      return TemplateRenderer.createInheritedValueTemplate(element, valueDisplay, title)
    } else if (isInheritedPreset) {
      return TemplateRenderer.createInheritedPresetTemplate(
        minSize,
        minUnit,
        maxSize,
        maxUnit,
        title,
        element
      )
    }

    // Handle custom presets with display_value
    if (customDisplayValue) {
      return TemplateRenderer.createCustomPresetTemplate(customDisplayValue, title)
    }

    return TemplateRenderer.createNormalValueTemplate(
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

  /** Main template selection function for Select2 */
  static getTemplateSelect2(
    state: TSelect2State,
    isTemplateResult: boolean
  ): JQuery<HTMLElement> | string {
    if (!state.element) {
      return state.text
    }

    const element = state.element as HTMLOptionElement

    if (element.value === '') {
      return TemplateRenderer.handleEmptyValueTemplate(element, state.text)
    }

    return TemplateRenderer.handleNonEmptyValueTemplate(element, state.text, isTemplateResult)
  }
}
