import type { ElementorEditor } from '@artemsemkin/elementor-types'
import { BaseControlView } from './BaseControlView'
import { BaseControlViewStatic } from './BaseControlViewStatic'
import { BaseGapsControlView } from './BaseGapsControlView'

const createGapsControlView = () => {
  const editor = window.elementor as ElementorEditor
  return editor.modules.controls.Gaps.extend(
    { ...BaseControlView, ...BaseGapsControlView },
    { ...BaseControlViewStatic }
  )
}

export function registerGapsControlView(): void {
  const GapsControlView = createGapsControlView()
  const editor = window.elementor as ElementorEditor
  editor.addControlView('gaps', GapsControlView)
}
