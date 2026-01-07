export const BaseControlViewStatic = {
  /**
   * @param {string} placeholder
   * @param {Record<string, string> | string} controlValue
   */
  getStyleValue: (placeholder, controlValue) => {
    let returnValue = window._.isObject(controlValue) ? controlValue[placeholder.toLowerCase()] : ''

    if (placeholder === 'UNIT' && (returnValue === 'fluid' || returnValue === 'custom')) {
      returnValue = '__EMPTY__'
    }

    return returnValue
  }
}
