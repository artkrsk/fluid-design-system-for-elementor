import type { IGapsValue } from '../interfaces'

export const BaseGapsControlView = {
  isEmptyValue(value: IGapsValue | null | undefined): boolean {
    if (!value) {
      return true
    }

    return (['column', 'row'] as const).every((prop) => !value[prop] || value[prop] === '')
  }
}
