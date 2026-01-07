import { callSuper } from '../utils/backbone'

/**
 * Global style repeater view
 */
const createGlobalStyleRepeater = () => {
  const editor = /** @type {import('@arts/elementor-types').ElementorEditor} */ (window.elementor)
  const GlobalStyleRepeaterBase = /** @type {any} */ (editor.modules.controls)['Global-style-repeater']
  return GlobalStyleRepeaterBase.extend({
    initialize() {
      callSuper(this, 'initialize', arguments)

      // Check if this is a fluid spacing/typography repeater
      if (this.isFluidSpacingTypographyRepeater()) {
        // Listen to child view adds to modify them after they're created
        this.listenTo(this, 'childview:render', this.onAfterChildViewRender)
      }
    },

    isFluidSpacingTypographyRepeater() {
      return this.model.get('is_fluid_preset_repeater') === true
    },

    /** @param {import('@arts/elementor-types').BackboneView & {$el: JQuery}} childView */
    onAfterChildViewRender(childView) {
      if (!this.isFluidSpacingTypographyRepeater()) {
        return
      }

      // Hide reset button
      const resetButton = childView.$el.find('.elementor-control-popover-toggle-reset-label')
      if (resetButton.length) {
        resetButton.hide()
      }

      // Update tooltip for delete button
      const removeButton = childView.$el.find(
        '.elementor-repeater-tool-remove:not(.elementor-repeater-tool-remove--disabled)'
      )

      if (removeButton.length) {
        removeButton.data('e-global-type', 'fluid-preset')

        // If tipsy is already initialized, destroy it first
        const tipsyButton = /** @type {any} */ (removeButton)
        if (removeButton.data('tipsy')) {
          tipsyButton.tipsy('hide')
          // Remove the tipsy data to ensure we create a fresh instance
          const el = removeButton.get(0)
          if (el) {
            jQuery.removeData(el, 'tipsy')
          }
        }

        // Initialize tipsy with proper options
        tipsyButton.tipsy({
          title: () => window.ArtsFluidDSStrings?.deleteFluidPreset,
          gravity: () => 's'
        })

        // Override the click handler for the remove button
        removeButton.off('click').on('click', /** @param {JQuery.ClickEvent} e */ (e) => {
          e.preventDefault()
          e.stopPropagation()

          // Show our custom confirmation modal
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
              // Trigger the original remove action
              childView.trigger('click:remove')
            }
          })

          if (confirmDeleteModal) {
            confirmDeleteModal.show()
          }
        })
      }
    },

    templateHelpers() {
      const templateHelpers = callSuper(this, 'templateHelpers')

      if (this.isFluidSpacingTypographyRepeater()) {
        templateHelpers.addButtonText = window.ArtsFluidDSStrings?.addPreset
      }
      return templateHelpers
    },

    getDefaults() {
      const defaults = callSuper(this, 'getDefaults')

      if (this.isFluidSpacingTypographyRepeater()) {
        defaults.title = `${window.ArtsFluidDSStrings?.newPreset} #${this.children.length + 1}`
      }

      return defaults
    }
  })
}

export function registerRepeaterGlobalStyleView() {
  const GlobalStyleRepeater = createGlobalStyleRepeater()
  const editor = /** @type {import('@arts/elementor-types').ElementorEditor} */ (window.elementor)
  editor.addControlView('global-style-repeater', GlobalStyleRepeater)
}
