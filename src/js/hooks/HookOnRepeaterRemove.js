import { stateManager, cssManager } from '../managers'
import { getItemId } from '../utils'
import { COMMANDS, HOOK_IDS, CONTAINER_TYPES, FLUID_REPEATER_CONTROLS } from '../constants'

export class HookOnRepeaterRemove extends window.$e.modules.hookUI.Before {
  getCommand() {
    return COMMANDS.REPEATER.REMOVE
  }

  getId() {
    return HOOK_IDS.REPEATER.REMOVE
  }

  getContainerType() {
    return CONTAINER_TYPES.DOCUMENT
  }

  getConditions(args) {
    return FLUID_REPEATER_CONTROLS.isFluidPresetRepeater(args.name, args.container)
  }

  apply(args) {
    const { container, name: presetName, index } = args

    // Mark document as having changes
    stateManager.markDocumentAsChanged(container)

    // Get the model before it's removed
    const collection = container.settings.get(presetName)
    if (!collection) return true

    const presetModel = collection.at(index)
    if (!presetModel) return true

    const removedItemId = getItemId(presetModel)
    if (!removedItemId) return true

    // Track this removal with a timestamp for reordering detection
    stateManager.setRecentRemoval(removedItemId)

    // Mark the item as removed for undo operations
    stateManager.markItemAsRemoved(removedItemId)

    // Find and update CSS rules with the matching ID pattern
    cssManager.unsetCssVariable(removedItemId)

    return true // Always continue with the command
  }
}
