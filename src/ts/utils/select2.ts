import { TemplateRenderer } from './templates'
import type {
  TSelect2State,
  TSelect2MatcherData,
  TSelect2SearchOptions,
  TSelect2OptionData
} from '../types'

// Re-export for JSDoc compatibility in templates.js
export type { TSelect2State as Select2State } from '../types'

class Select2Utils {
  static getTemplateSelect2(
    state: TSelect2State,
    isTemplateResult: boolean
  ): JQuery<HTMLElement> | string {
    return TemplateRenderer.getTemplateSelect2(state, isTemplateResult)
  }

  static getSelect2DefaultOptions() {
    return {
      closeOnSelect: true,
      dropdownAutoWidth: true,
      theme: 'default select2-container--width-auto',
      containerCssClass: 'select2-selection--height-large',
      templateResult: (state: TSelect2State) => Select2Utils.getTemplateSelect2(state, true),
      templateSelection: (state: TSelect2State) => Select2Utils.getTemplateSelect2(state, false),
      matcher: (
        params: TSelect2SearchOptions,
        data: TSelect2MatcherData
      ): TSelect2MatcherData | null => {
        // No search term - show everything
        if (jQuery.trim(params.term) === '') {
          return data
        }

        // Regular option (no children) - default text matching
        if (!('children' in data) || typeof data.children === 'undefined') {
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
        const filteredChildren: TSelect2OptionData[] = []
        jQuery.each(data.children, (_idx: number, child: TSelect2OptionData) => {
          if (child.text.toUpperCase().indexOf(term) > -1) {
            filteredChildren.push(child)
          }
        })

        if (filteredChildren.length) {
          const modifiedData = jQuery.extend({}, data, true) as TSelect2MatcherData
          if ('children' in modifiedData) {
            modifiedData.children = filteredChildren
          }
          return modifiedData
        }

        return null
      }
    }
  }
}

export const { getSelect2DefaultOptions } = Select2Utils
