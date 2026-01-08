import type { ElementorEditor } from '@artemsemkin/elementor-types'
import { BaseControlView } from './BaseControlView'
import { BaseControlViewStatic } from './BaseControlViewStatic'
import { BaseSliderControlView } from './BaseSliderControlView'

const createSliderControlView = () => {
  const editor = window.elementor as ElementorEditor
  return editor.modules.controls.Slider.extend(
    { ...BaseControlView, ...BaseSliderControlView },
    { ...BaseControlViewStatic }
  )
}

export function registerSliderControlView(): void {
  const SliderControlView = createSliderControlView()
  const editor = window.elementor as ElementorEditor
  editor.addControlView('slider', SliderControlView)
}
