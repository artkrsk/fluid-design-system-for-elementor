export const BaseControlViewStatic = {
  getStyleValue: (placeholder, controlValue) => {
    let returnValue = window._.isObject(controlValue) ? controlValue[placeholder.toLowerCase()] : ''

    if (placeholder === 'UNIT' && returnValue === 'fluid') {
      returnValue = '__EMPTY__'
    }

    return returnValue
  }
}
