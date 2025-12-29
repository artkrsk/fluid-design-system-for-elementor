import { registerComponent } from './components'
import {
  registerRepeaterGlobalStyleView,
  registerRepeaterRowView,
  registerDimensionsControlView,
  registerGapsControlView,
  registerSliderControlView
} from './views'
import { dataManager } from './managers'

// Expose DataManager globally for dialog access
window.artsFluidDesignSystem = window.artsFluidDesignSystem || {}
window.artsFluidDesignSystem.dataManager = dataManager

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
