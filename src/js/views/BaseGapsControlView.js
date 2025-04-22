export const BaseGapsControlView = {
  isEmptyValue(value) {
    if (!value) {
      return true
    }

    return ['column', 'row'].every((prop) => !value[prop] || value[prop] === '')
  }
}
