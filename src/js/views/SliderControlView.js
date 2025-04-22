import { BaseControlView } from './BaseControlView'
import { BaseControlViewStatic } from './BaseControlViewStatic'
import { BaseSliderControlView } from './BaseSliderControlView'

const createSliderControlView = () => {
  return window.elementor.modules.controls.Slider.extend(
    { ...BaseControlView, ...BaseSliderControlView },
    { ...BaseControlViewStatic }
  )
}

export function registerSliderControlView() {
  const SliderControlView = createSliderControlView()

  window.elementor.addControlView('slider', SliderControlView)
}
