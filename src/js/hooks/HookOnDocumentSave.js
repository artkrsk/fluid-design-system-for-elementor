import stateManager from '../managers/StateManager'
import { COMMANDS, HOOK_IDS, CONTAINER_TYPES } from '../constants'

export class HookOnDocumentSave extends window.$e.modules.hookUI.After {
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

  apply(args) {
    if (args.document && args.document.id) {
      stateManager.clearDocumentChanges(args.document.id)
    }
  }
}
