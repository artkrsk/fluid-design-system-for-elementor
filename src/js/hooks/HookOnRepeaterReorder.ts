import { stateManager, cssManager } from '../managers'
import { getItemId } from '../utils'
import { COMMANDS, HOOK_IDS, CONTAINER_TYPES } from '../constants'
import { isFluidPresetRepeater } from '../utils/controls'

const commandSystem = /** @type {import('@arts/elementor-types').$e} */ (window.$e)

export class HookOnRepeaterReorder extends commandSystem.modules.hookUI.After {
  getCommand() {
    return COMMANDS.REPEATER.MOVE
  }

  getId() {
    return HOOK_IDS.REPEATER.REORDER
  }

  getContainerType() {
    return CONTAINER_TYPES.DOCUMENT
  }

  /** @param {import('@arts/elementor-types').HookArgs} args */
  getConditions(args) {
    return isFluidPresetRepeater(args.name, args.container)
  }

  /** @param {import('@arts/elementor-types').HookArgs} args */
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
