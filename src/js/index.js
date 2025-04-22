import { registerComponent } from './components'
import {
  registerRepeaterGlobalStyleView,
  registerRepeaterRowView,
  registerDimensionsControlView,
  registerGapsControlView,
  registerSliderControlView
} from './views'

window.addEventListener('elementor/init-components', () => {
  registerComponent()
})

window.addEventListener('elementor/init', () => {
  registerRepeaterRowView()
  registerRepeaterGlobalStyleView()
  registerDimensionsControlView()
  registerGapsControlView()
  registerSliderControlView()
})
