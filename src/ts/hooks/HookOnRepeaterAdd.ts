import { stateManager, cssManager } from '../managers'
import { COMMANDS, HOOK_IDS, CONTAINER_TYPES } from '../constants'
import { getItemId } from '../utils'
import { isFluidPresetRepeater } from '../utils/controls'
import type { HookArgs } from '@artemsemkin/elementor-types'

const commandSystem = window.$e!

/** Tracks added items for undo/redo CSS restoration */
export class HookOnRepeaterAdd extends commandSystem.modules.hookUI.After {
  getCommand(): string {
    return COMMANDS.REPEATER.INSERT
  }

  getId(): string {
    return HOOK_IDS.REPEATER.ADD
  }

  getContainerType(): string {
    return CONTAINER_TYPES.DOCUMENT
  }

  getConditions(args: HookArgs): boolean {
    return isFluidPresetRepeater(args.name, args.container)
  }

  apply(args: HookArgs): void {
    const { isRestored } = args
    const addedItemId = getItemId(args.model)

    if (!addedItemId) {
      return
    }

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
