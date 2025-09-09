/**
 * Global style repeater view
 */
const createGlobalStyleRepeater = () => {
  return window.elementor.modules.controls['Global-style-repeater'].extend({
    initialize() {
      // Call parent initialize first
      this.constructor.__super__.initialize.apply(this, arguments)

      // Check if this is a fluid spacing/typography repeater
      if (this.isFluidSpacingTypographyRepeater()) {
        // Listen to child view adds to modify them after they're created
        this.listenTo(this, 'childview:render', this.onAfterChildViewRender)
      }
    },

    isFluidSpacingTypographyRepeater() {
      return this.model.get('is_fluid_preset_repeater') === true
    },

    // This method will be called after each child view is rendered
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
        if (removeButton.data('tipsy')) {
          removeButton.tipsy('hide')
          // Remove the tipsy data to ensure we create a fresh instance
          jQuery.removeData(removeButton.get(0), 'tipsy')
        }

        // Initialize tipsy with proper options
        removeButton.tipsy({
          title: () => window.ArtsFluidDSStrings?.deleteFluidPreset || 'Delete Fluid Preset',
          gravity: () => 's'
        })

        // Override the click handler for the remove button
        removeButton.off('click').on('click', (e) => {
          e.preventDefault()
          e.stopPropagation()

          // Show our custom confirmation modal
          const translatedMessage =
            window.ArtsFluidDSStrings?.deletePresetMessage ||
            "You're about to delete a Fluid Preset. Note that if it's being used anywhere on your site, it will inherit default values."

          const confirmDeleteModal = elementorCommon.dialogsManager.createWidget('confirm', {
            className: 'e-global__confirm-delete',
            headerMessage: window.ArtsFluidDSStrings?.deleteFluidPreset || 'Delete Fluid Preset',
            message: '<i class="eicon-info-circle"></i> ' + translatedMessage,
            strings: {
              confirm: window.ArtsFluidDSStrings?.delete || 'Delete',
              cancel: window.ArtsFluidDSStrings?.cancel || 'Cancel'
            },
            hide: {
              onBackgroundClick: false
            },
            onConfirm: () => {
              // Trigger the original remove action
              childView.trigger('click:remove')
            }
          })

          confirmDeleteModal.show()
        })
      }
    },

    templateHelpers() {
      const templateHelpers = this.constructor.__super__.templateHelpers.call(this)

      if (this.isFluidSpacingTypographyRepeater()) {
        templateHelpers.addButtonText = window.ArtsFluidDSStrings?.addPreset || 'Add Preset'
      }
      return templateHelpers
    },

    getDefaults() {
      const defaults = this.constructor.__super__.getDefaults.call(this)

      if (this.isFluidSpacingTypographyRepeater()) {
        defaults.title = `${window.ArtsFluidDSStrings?.newPreset || 'New Preset'} #${this.children.length + 1}`
      }

      return defaults
    }
  })
}

export function registerRepeaterGlobalStyleView() {
  const GlobalStyleRepeater = createGlobalStyleRepeater()

  // Register the global style repeater view
  window.elementor.addControlView('global-style-repeater', GlobalStyleRepeater)
}
