import { BaseControlView } from './BaseControlView'
import { BaseControlViewStatic } from './BaseControlViewStatic'
import { BaseDimensionsControlView } from './BaseDimensionsControlView'

const createDimensionsControlView = () => {
  const editor = /** @type {import('@arts/elementor-types').ElementorEditor} */ (window.elementor)
  return editor.modules.controls.Dimensions.extend(
    { ...BaseControlView, ...BaseDimensionsControlView },
    { ...BaseControlViewStatic }
  )
}

export function registerDimensionsControlView() {
  const DimensionsControlView = createDimensionsControlView()
  const editor = /** @type {import('@arts/elementor-types').ElementorEditor} */ (window.elementor)
  editor.addControlView('dimensions', DimensionsControlView)
}
