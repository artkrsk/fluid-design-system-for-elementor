/**
 * Custom repeater row view for fluid presets
 */
const createFluidPresetRepeaterRow = () => {
  return window.elementor.modules.controls.RepeaterRow.extend({
    /**
     * Determine if this is a fluid preset repeater
     * @returns {boolean}
     */
    isFluidPresetRepeater() {
      return this._parent?.model?.get('is_fluid_preset_repeater') === true
    },

    /**
     * @returns {Object} UI selectors
     */
    ui() {
      const ui = this.constructor.__super__.ui.apply(this, arguments)
      ui.resetButton = '.elementor-repeater-tool-reset'
      ui.sortButton = '.elementor-repeater-tool-sort'
      return ui
    },

    onChildviewRender() {
      this.constructor.__super__.onChildviewRender.apply(this, arguments)

      if (!this.isFluidPresetRepeater()) {
        return
      }

      if (this.ui.resetButton.length) {
        this.ui.resetButton.hide()
      }

      if (this.ui.removeButton.length) {
        this.ui.removeButton.data('e-global-type', 'fluid-preset').tipsy({
          title: () => window.ArtsFluidDSStrings?.deleteFluidPreset,
          gravity: () => 's'
        })
      }
    },

    /**
     * Override remove button click to customize modal dialog
     */
    onRemoveButtonClick() {
      if (!this.isFluidPresetRepeater()) {
        // Call parent method for non-fluid presets
        return this.constructor.__super__.onRemoveButtonClick.apply(this, arguments)
      }

      const translatedMessage = window.ArtsFluidDSStrings?.deletePresetMessage

      this.confirmDeleteModal = elementorCommon.dialogsManager.createWidget('confirm', {
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
          this.trigger('click:remove')
        }
      })

      this.confirmDeleteModal.show()
    }
  })
}

// Export a function that will be called after elementor/init
export function registerRepeaterRowView() {
  const FluidPresetRepeaterRow = createFluidPresetRepeaterRow()

  // Register the custom row view
  Object.assign(window.elementor.modules.controls, {
    FluidPresetRepeaterRow
  })
}
