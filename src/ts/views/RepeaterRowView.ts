import type { ElementorEditor } from '@arts/elementor-types'
import { callSuper } from '../utils/backbone'

const createFluidPresetRepeaterRow = () => {
  const editor = window.elementor as ElementorEditor
  return editor.modules.controls.RepeaterRow.extend({
    isFluidPresetRepeater(this: any): boolean {
      return this._parent?.model?.get('is_fluid_preset_repeater') === true
    },

    ui(this: any) {
      const ui = callSuper(this, 'ui', arguments)
      ui.resetButton = '.elementor-repeater-tool-reset'
      ui.sortButton = '.elementor-repeater-tool-sort'
      return ui
    },

    onChildviewRender(this: any) {
      callSuper(this, 'onChildviewRender', arguments)

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

    onRemoveButtonClick(this: any) {
      if (!this.isFluidPresetRepeater()) {
        return callSuper(this, 'onRemoveButtonClick', arguments)
      }

      const translatedMessage = window.ArtsFluidDSStrings?.deletePresetMessage

      this.confirmDeleteModal = window.elementorCommon?.dialogsManager.createWidget('confirm', {
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

      this.confirmDeleteModal?.show()
    }
  })
}

export function registerRepeaterRowView(): void {
  const FluidPresetRepeaterRow = createFluidPresetRepeaterRow()
  const editor = window.elementor as ElementorEditor
  Object.assign(editor.modules.controls, {
    FluidPresetRepeaterRow
  })
}
