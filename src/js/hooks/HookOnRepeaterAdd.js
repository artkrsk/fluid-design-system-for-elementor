import { stateManager, cssManager } from '../managers'
import { COMMANDS, HOOK_IDS, CONTAINER_TYPES, FLUID_REPEATER_CONTROLS } from '../constants'
import { getItemId } from '../utils'

export class HookOnRepeaterAdd extends window.$e.modules.hookUI.After {
  getCommand() {
    return COMMANDS.REPEATER.INSERT
  }

  getId() {
    return HOOK_IDS.REPEATER.ADD
  }

  getContainerType() {
    return CONTAINER_TYPES.DOCUMENT
  }

  getConditions(args) {
    return (
      args.name === FLUID_REPEATER_CONTROLS.SPACING ||
      args.name === FLUID_REPEATER_CONTROLS.TYPOGRAPHY
    )
  }

  apply(args) {
    const { isRestored } = args
    const addedItemId = getItemId(args.model)

    if (!addedItemId) return

    // Mark document as having changes
    stateManager.markDocumentAsChanged(args.container)

    // Handle undo operation first
    if (isRestored && stateManager.hasRemovedItems(addedItemId)) {
      // Restore the CSS variable first
      cssManager.restoreCssVariable(addedItemId)
      // Then mark the item as restored
      stateManager.markItemAsRestored(addedItemId)
      return
    }

    // Check if this is a reordering operation
    if (stateManager.hasRecentRemoval(addedItemId)) {
      // Restore the CSS variable for reordered items
      cssManager.restoreCssVariable(addedItemId)
      stateManager.deleteRecentRemoval(addedItemId)
      return
    }

    // Clean up old entries to prevent memory leaks
    stateManager.cleanupRecentRemovals()
  }
}
