import { TemplateRenderer } from './templates.js'

/**
 * @typedef {Select2.OptionData | Select2.LoadingData | Select2.OptGroupData} Select2State
 * @typedef {Select2.OptionData | Select2.OptGroupData} Select2MatcherData
 */

class Select2Utils {
  /**
   * @param {Select2State} state
   * @param {boolean} isTemplateResult
   * @returns {JQuery<HTMLElement>|string}
   */
  static getTemplateSelect2(state, isTemplateResult) {
    return TemplateRenderer.getTemplateSelect2(state, isTemplateResult)
  }

  static getSelect2DefaultOptions() {
    return {
      closeOnSelect: true,
      dropdownAutoWidth: true,
      theme: 'default select2-container--width-auto',
      containerCssClass: 'select2-selection--height-large',
      templateResult: /** @param {Select2State} state */ (state) => Select2Utils.getTemplateSelect2(state, true),
      templateSelection: /** @param {Select2State} state */ (state) => Select2Utils.getTemplateSelect2(state, false),
      /** @type {(params: Select2.SearchOptions, data: Select2MatcherData) => Select2MatcherData | null} */
      matcher: (params, data) => {
        // No search term - show everything
        if (jQuery.trim(params.term) === '') {
          return data
        }

        // Regular option (no children) - default text matching
        if (typeof data.children === 'undefined') {
          if (data.text.toUpperCase().indexOf(params.term.toUpperCase()) > -1) {
            return data
          }
          return null
        }

        // Optgroup - check if group name matches
        const term = params.term.toUpperCase()
        const groupText = data.text.toUpperCase()

        if (groupText.indexOf(term) > -1) {
          // Group name matches - return ALL children
          return data
        }

        // Group doesn't match - filter children individually
        /** @type {Select2.OptionData[]} */
        const filteredChildren = []
        jQuery.each(data.children, (idx, /** @type {Select2.OptionData} */ child) => {
          if (child.text.toUpperCase().indexOf(term) > -1) {
            filteredChildren.push(child)
          }
        })

        if (filteredChildren.length) {
          const modifiedData = jQuery.extend({}, data, true)
          modifiedData.children = filteredChildren
          return modifiedData
        }

        return null
      }
    }
  }
}

export const { getSelect2DefaultOptions } = Select2Utils
