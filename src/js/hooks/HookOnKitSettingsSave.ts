import { COMMANDS, HOOK_IDS } from '../constants'
import dataManager from '../managers/DataManager'
import type { HookArgs } from '@arts/elementor-types'

const commandSystem = window.$e!

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
