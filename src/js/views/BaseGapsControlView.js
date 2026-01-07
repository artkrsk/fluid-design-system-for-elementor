export const BaseGapsControlView = {
  /** @param {import('../interfaces').IGapsValue | null | undefined} value */
  isEmptyValue(value) {
    if (!value) {
      return true
    }

    return ['column', 'row'].every((prop) => !value[prop] || value[prop] === '')
  }
}
