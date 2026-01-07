import { stateManager, cssManager } from '../managers'
import { getItemId } from '../utils'
import { COMMANDS, HOOK_IDS, CONTAINER_TYPES } from '../constants'
import { isFluidPresetRepeater } from '../utils/controls'
import type { HookArgs, BackboneCollection } from '@arts/elementor-types'

const commandSystem = window.$e!

export class HookOnRepeaterRemove extends commandSystem.modules.hookUI.Before {
  getCommand(): string {
    return COMMANDS.REPEATER.REMOVE
  }

  getId(): string {
    return HOOK_IDS.REPEATER.REMOVE
  }

  getContainerType(): string {
    return CONTAINER_TYPES.DOCUMENT
  }

  getConditions(args: HookArgs): boolean {
    return isFluidPresetRepeater(args.name, args.container)
  }

  apply(args: HookArgs): boolean {
    const { container, name: presetName, index } = args

    // Mark document as having changes
    stateManager.markDocumentAsChanged(container)

    // Get the model before it's removed
    const collection = container.settings.get(presetName) as BackboneCollection | undefined
    if (!collection || index === undefined) { return true }

    const presetModel = collection.at(index)
    if (!presetModel) { return true }

    const removedItemId = getItemId(presetModel)
    if (!removedItemId) { return true }

    // Track this removal with a timestamp for reordering detection
    stateManager.setRecentRemoval(removedItemId)

    // Mark the item as removed for undo operations
    stateManager.markItemAsRemoved(removedItemId)

    // Find and update CSS rules with the matching ID pattern
    cssManager.unsetCssVariable(removedItemId)

    return true // Always continue with the command
  }
}
