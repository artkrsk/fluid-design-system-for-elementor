import type { ElementorEditor } from '@artemsemkin/elementor-types'
import { BaseControlView } from './BaseControlView'
import { BaseControlViewStatic } from './BaseControlViewStatic'
import { BaseDimensionsControlView } from './BaseDimensionsControlView'

const createDimensionsControlView = () => {
  const editor = window.elementor as ElementorEditor
  return editor.modules.controls.Dimensions.extend(
    { ...BaseControlView, ...BaseDimensionsControlView },
    { ...BaseControlViewStatic }
  )
}

export function registerDimensionsControlView(): void {
  const DimensionsControlView = createDimensionsControlView()
  const editor = window.elementor as ElementorEditor
  editor.addControlView('dimensions', DimensionsControlView)
}
