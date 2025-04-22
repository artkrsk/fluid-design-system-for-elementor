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
      const presetName = this._parent?.model?.get('name')
      return presetName === 'fluid_spacing_presets' || presetName === 'fluid_typography_presets'
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
          title: () => window.ArtsFluidDSStrings?.deleteFluidPreset || 'Delete Fluid Preset',
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

      const translatedMessage =
        window.ArtsFluidDSStrings?.deletePresetMessage ||
        "You're about to delete a fluid preset. Note that if it's being used anywhere on your site, it will inherit default values."

      this.confirmDeleteModal = elementorCommon.dialogsManager.createWidget('confirm', {
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
