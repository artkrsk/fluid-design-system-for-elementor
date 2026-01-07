import stateManager from '../managers/StateManager'
import { COMMANDS, HOOK_IDS, CONTAINER_TYPES } from '../constants'

const commandSystem = /** @type {import('@arts/elementor-types').$e} */ (window.$e)

export class HookOnDocumentSave extends commandSystem.modules.hookUI.After {
  getCommand() {
    return COMMANDS.DOCUMENT.UPDATE
  }

  getId() {
    return HOOK_IDS.DOCUMENT.SAVE
  }

  getContainerType() {
    return CONTAINER_TYPES.DOCUMENT
  }

  getConditions() {
    return true // Apply to any document
  }

  /** @param {import('@arts/elementor-types').HookArgs} args */
  apply(args) {
    if (args.document && args.document.id) {
      stateManager.clearDocumentChanges(args.document.id)
    }
  }
}
