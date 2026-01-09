import stateManager from '../managers/StateManager'
import { COMMANDS, HOOK_IDS, CONTAINER_TYPES } from '../constants'
import type { HookArgs } from '@artemsemkin/elementor-types'

const commandSystem = window.$e!

/** Clears document change state after save */
export class HookOnDocumentSave extends commandSystem.modules.hookUI.After {
  getCommand(): string {
    return COMMANDS.DOCUMENT.UPDATE
  }

  getId(): string {
    return HOOK_IDS.DOCUMENT.SAVE
  }

  getContainerType(): string {
    return CONTAINER_TYPES.DOCUMENT
  }

  getConditions(): boolean {
    return true // Apply to any document
  }

  apply(args: HookArgs): void {
    if (args.document?.id) {
      stateManager.clearDocumentChanges(args.document.id)
    }
  }
}
