import type { HookArgs, ThirdParty } from '@artemsemkin/elementor-types'
import { COMMANDS, CONTAINER_TYPES, HOOK_IDS } from '../constants'
import { cssManager } from '../managers'
import { getItemId } from '../utils'
import { isFluidPresetRepeater } from '../utils/controls'

const commandSystem = window.$e!

/** Restores CSS variables after reorder operations */
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

    // Get the collection
    const collection = container.settings.get(presetName) as
      | ThirdParty.BackboneCollection
      | undefined
    if (!collection) {
      return
    }

    // Get the item that was moved
    const presetModel = collection.at(targetIndex)
    if (!presetModel) {
      return
    }

    const movedItemId = getItemId(presetModel)
    if (!movedItemId) {
      return
    }

    // Restore the CSS variable since this was just a reorder
    cssManager.restoreCssVariable(movedItemId)
  }
}
