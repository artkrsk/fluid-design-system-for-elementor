import { stateManager, cssManager } from '../managers'
import { getItemId } from '../utils'
import { COMMANDS, HOOK_IDS, CONTAINER_TYPES } from '../constants'
import { isFluidPresetRepeater } from '../utils/controls'
import type { HookArgs, BackboneCollection } from '@arts/elementor-types'

const commandSystem = window.$e!

export class HookOnRepeaterReorder extends commandSystem.modules.hookUI.After {
  getCommand(): string {
    return COMMANDS.REPEATER.MOVE
  }

  getId(): string {
    return HOOK_IDS.REPEATER.REORDER
  }

  getContainerType(): string {
    return CONTAINER_TYPES.DOCUMENT
  }

  getConditions(args: HookArgs): boolean {
    return isFluidPresetRepeater(args.name, args.container)
  }

  apply(args: HookArgs): void {
    const { container, name: presetName, targetIndex } = args

    // Mark document as having changes
    stateManager.markDocumentAsChanged(container)

    // Get the collection
    const collection = container.settings.get(presetName) as BackboneCollection | undefined
    if (!collection) { return }

    // Get the item that was moved
    const presetModel = collection.at(targetIndex)
    if (!presetModel) { return }

    const movedItemId = getItemId(presetModel)
    if (!movedItemId) { return }

    // Restore the CSS variable since this was just a reorder
    cssManager.restoreCssVariable(movedItemId)
  }
}
