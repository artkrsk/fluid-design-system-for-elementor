import { BaseControlView } from './BaseControlView'
import { BaseControlViewStatic } from './BaseControlViewStatic'
import { BaseSliderControlView } from './BaseSliderControlView'

const createSliderControlView = () => {
  const editor = /** @type {import('@arts/elementor-types').ElementorEditor} */ (window.elementor)
  return editor.modules.controls.Slider.extend(
    { ...BaseControlView, ...BaseSliderControlView },
    { ...BaseControlViewStatic }
  )
}

export function registerSliderControlView() {
  const SliderControlView = createSliderControlView()
  const editor = /** @type {import('@arts/elementor-types').ElementorEditor} */ (window.elementor)
  editor.addControlView('slider', SliderControlView)
}
