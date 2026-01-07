import type { ElementorEditor } from '@arts/elementor-types'
import { callSuper } from '../utils/backbone'

const createGlobalStyleRepeater = () => {
  const editor = window.elementor as ElementorEditor
  const GlobalStyleRepeaterBase = (editor.modules.controls as any)['Global-style-repeater']

  return GlobalStyleRepeaterBase.extend({
    initialize(this: any) {
      callSuper(this, 'initialize', arguments)

      if (this.isFluidSpacingTypographyRepeater()) {
        this.listenTo(this, 'childview:render', this.onAfterChildViewRender)
      }
    },

    isFluidSpacingTypographyRepeater(this: any): boolean {
      return this.model.get('is_fluid_preset_repeater') === true
    },

    onAfterChildViewRender(this: any, childView: any) {
      if (!this.isFluidSpacingTypographyRepeater()) {
        return
      }

      const resetButton = childView.$el.find('.elementor-control-popover-toggle-reset-label')
      if (resetButton.length) {
        resetButton.hide()
      }

      const removeButton = childView.$el.find(
        '.elementor-repeater-tool-remove:not(.elementor-repeater-tool-remove--disabled)'
      )

      if (removeButton.length) {
        removeButton.data('e-global-type', 'fluid-preset')

        if (removeButton.data('tipsy')) {
          removeButton.tipsy('hide')
          const el = removeButton.get(0)
          if (el) {
            jQuery.removeData(el, 'tipsy')
          }
        }

        removeButton.tipsy({
          title: () => window.ArtsFluidDSStrings?.deleteFluidPreset,
          gravity: () => 's'
        })

        removeButton.off('click').on('click', (e: JQuery.ClickEvent) => {
          e.preventDefault()
          e.stopPropagation()

          const translatedMessage = window.ArtsFluidDSStrings?.deletePresetMessage

          const confirmDeleteModal = window.elementorCommon?.dialogsManager.createWidget('confirm', {
            className: 'e-global__confirm-delete',
            headerMessage: window.ArtsFluidDSStrings?.deleteFluidPreset,
            message: '<i class="eicon-info-circle"></i> ' + translatedMessage,
            strings: {
              confirm: window.ArtsFluidDSStrings?.delete,
              cancel: window.ArtsFluidDSStrings?.cancel
            },
            hide: {
              onBackgroundClick: false
            },
            onConfirm: () => {
              childView.trigger('click:remove')
            }
          })

          if (confirmDeleteModal) {
            confirmDeleteModal.show()
          }
        })
      }
    },

    templateHelpers(this: any) {
      const templateHelpers = callSuper(this, 'templateHelpers')

      if (this.isFluidSpacingTypographyRepeater()) {
        templateHelpers.addButtonText = window.ArtsFluidDSStrings?.addPreset
      }
      return templateHelpers
    },

    getDefaults(this: any) {
      const defaults = callSuper(this, 'getDefaults')

      if (this.isFluidSpacingTypographyRepeater()) {
        defaults.title = `${window.ArtsFluidDSStrings?.newPreset} #${this.children.length + 1}`
      }

      return defaults
    }
  })
}

export function registerRepeaterGlobalStyleView(): void {
  const GlobalStyleRepeater = createGlobalStyleRepeater()
  const editor = window.elementor as ElementorEditor
  editor.addControlView('global-style-repeater', GlobalStyleRepeater as any)
}
