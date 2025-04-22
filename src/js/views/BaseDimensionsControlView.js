export const BaseDimensionsControlView = {
  isEmptyValue(value) {
    if (!value) {
      return true
    }

    return ['top', 'right', 'bottom', 'left'].every((prop) => !value[prop] || value[prop] === '')
  }
}
