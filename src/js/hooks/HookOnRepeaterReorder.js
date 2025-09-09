import { stateManager, cssManager } from '../managers'
import { getItemId } from '../utils'
import { COMMANDS, HOOK_IDS, CONTAINER_TYPES, FLUID_REPEATER_CONTROLS } from '../constants'

export class HookOnRepeaterReorder extends window.$e.modules.hookUI.After {
  getCommand() {
    return COMMANDS.REPEATER.MOVE
  }

  getId() {
    return HOOK_IDS.REPEATER.REORDER
  }

  getContainerType() {
    return CONTAINER_TYPES.DOCUMENT
  }

  getConditions(args) {
    return FLUID_REPEATER_CONTROLS.isFluidPresetRepeater(args.name, args.container)
  }

  apply(args) {
    const { container, name: presetName, targetIndex } = args

    // Mark document as having changes
    stateManager.markDocumentAsChanged(container)

    // Get the collection
    const collection = container.settings.get(presetName)
    if (!collection) return

    // Get the item that was moved
    const presetModel = collection.at(targetIndex)
    if (!presetModel) return

    const movedItemId = getItemId(presetModel)
    if (!movedItemId) return

    // Restore the CSS variable since this was just a reorder
    cssManager.restoreCssVariable(movedItemId)
  }
}
