import { COMMANDS, HOOK_IDS } from '../constants'
import dataManager from '../managers/DataManager'
import type { HookArgs } from '@artemsemkin/elementor-types'

const commandSystem = window.$e!

/** Invalidates preset cache when Kit saves */
export class HookOnKitSettingsSave extends commandSystem.modules.hookUI.After {
  getCommand(): string {
    return COMMANDS.DOCUMENT.SAVE
  }

  getId(): string {
    return HOOK_IDS.KIT.SAVE
  }

  getConditions(args: HookArgs): boolean {
    return args.document?.config?.type === 'kit'
  }

  apply(): void {
    dataManager.invalidate()
  }
}
