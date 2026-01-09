import type { IDimensionsValue } from '../interfaces'

export const BaseDimensionsControlView = {
  isEmptyValue(value: IDimensionsValue | null | undefined): boolean {
    if (!value) {
      return true
    }

    return (['top', 'right', 'bottom', 'left'] as const).every(
      (prop) => !value[prop] || value[prop] === ''
    )
  }
}
