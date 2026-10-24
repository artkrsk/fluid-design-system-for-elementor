import type { IDimensionsValue } from '../interfaces'
import { callSuper } from '../utils/backbone'
import { getInheritedSideValue } from '../utils/deviceInheritance'

export const BaseDimensionsControlView: Record<string, unknown> = {
  filledSides: [] as string[],

  isEmptyValue(value: IDimensionsValue | null | undefined): boolean {
    if (!value) {
      return true
    }

    return (['top', 'right', 'bottom', 'left'] as const).every(
      (prop) => !value[prop] || value[prop] === ''
    )
  },

  /** Elementor's saved-unlinked fill writes 0 into empty inputs, which would hide inherited values */
  onReady(this: any): void {
    callSuper(this, 'onReady', arguments)

    if (!this.isFluidUnit() || this.isLinkedDimensions()) {
      return
    }

    const value = this.getControlValue()
    this.ui.controls.each((_index: number, el: HTMLInputElement) => {
      if (!value[el.dataset.setting ?? '']) {
        el.value = ''
      }
    })
  },

  /** Fills empty sides with the inherited value instead of Elementor's 0, so unlinking keeps what the panel shows */
  fillEmptyDimensions(this: any): void {
    if (!this.isFluidUnit() || this.isLinkedDimensions()) {
      callSuper(this, 'fillEmptyDimensions', arguments)
      return
    }

    const inherited = this.getParentControlValue()
    const allowed = this.model.get('allowed_dimensions')

    this.filledSides = []
    for (const side of this.getPossibleDimensions()) {
      const $input = this.ui.controls.filter(`[data-setting="${side}"]`)
      if (allowed.includes(side) && $input.length && !$input.val()) {
        $input.val(getInheritedSideValue(inherited, side))
        this.filledSides.push(side)
      }
    }
  },

  updateDimensions(this: any): void {
    this.filledSides = []
    callSuper(this, 'updateDimensions', arguments)

    if (this.filledSides.length > 0) {
      this.syncFluidSelectsFromModel(this.filledSides)
    }
  }
}
