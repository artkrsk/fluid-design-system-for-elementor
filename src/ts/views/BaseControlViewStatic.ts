export const BaseControlViewStatic = {
  getStyleValue: (placeholder: string, controlValue: Record<string, string> | string): string => {
    let returnValue = window._.isObject(controlValue) ? controlValue[placeholder.toLowerCase()] : ''

    if (placeholder === 'UNIT' && (returnValue === 'fluid' || returnValue === 'custom')) {
      returnValue = '__EMPTY__'
    }

    return returnValue
  }
}
