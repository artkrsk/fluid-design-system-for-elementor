import { registerComponent } from './components'
import { dataManager } from './managers'
import { applyStyleguideCompat } from './utils/styleguideCompat'
import {
  registerDimensionsControlView,
  registerGapsControlView,
  registerRepeaterGlobalStyleView,
  registerRepeaterRowView,
  registerSliderControlView
} from './views'

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

  window.elementor!.on('preview:loaded', () => {
    applyStyleguideCompat()
  })
})
