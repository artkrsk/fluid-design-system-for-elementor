import { BaseControlView } from './BaseControlView'
import { BaseControlViewStatic } from './BaseControlViewStatic'
import { BaseDimensionsControlView } from './BaseDimensionsControlView'

const createDimensionsControlView = () => {
  return window.elementor.modules.controls.Dimensions.extend(
    { ...BaseControlView, ...BaseDimensionsControlView },
    { ...BaseControlViewStatic }
  )
}

export function registerDimensionsControlView() {
  const DimensionsControlView = createDimensionsControlView()

  window.elementor.addControlView('dimensions', DimensionsControlView)
}
