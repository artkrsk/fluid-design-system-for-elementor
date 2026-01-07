import { BaseControlView } from './BaseControlView'
import { BaseControlViewStatic } from './BaseControlViewStatic'
import { BaseGapsControlView } from './BaseGapsControlView'

const createGapsControlView = () => {
  const editor = /** @type {import('@arts/elementor-types').ElementorEditor} */ (window.elementor)
  return editor.modules.controls.Gaps.extend(
    { ...BaseControlView, ...BaseGapsControlView },
    { ...BaseControlViewStatic }
  )
}

export function registerGapsControlView() {
  const GapsControlView = createGapsControlView()
  const editor = /** @type {import('@arts/elementor-types').ElementorEditor} */ (window.elementor)
  editor.addControlView('gaps', GapsControlView)
}
