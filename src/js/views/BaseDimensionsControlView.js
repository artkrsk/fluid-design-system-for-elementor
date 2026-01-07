export const BaseDimensionsControlView = {
  /** @param {import('../interfaces').IDimensionsValue | null | undefined} value */
  isEmptyValue(value) {
    if (!value) {
      return true
    }

    return ['top', 'right', 'bottom', 'left'].every((prop) => !value[prop] || value[prop] === '')
  }
}
