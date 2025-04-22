import { BaseControlView } from './BaseControlView'
import { BaseControlViewStatic } from './BaseControlViewStatic'
import { BaseGapsControlView } from './BaseGapsControlView'

const createGapsControlView = () => {
  return window.elementor.modules.controls.Gaps.extend(
    { ...BaseControlView, ...BaseGapsControlView },
    { ...BaseControlViewStatic }
  )
}

export function registerGapsControlView() {
  const GapsControlView = createGapsControlView()

  window.elementor.addControlView('gaps', GapsControlView)
}
