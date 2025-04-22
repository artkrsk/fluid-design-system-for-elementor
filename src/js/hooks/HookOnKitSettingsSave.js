import { COMMANDS, HOOK_IDS } from '../constants'
import dataManager from '../managers/DataManager'

export class HookOnKitSettingsSave extends window.$e.modules.hookUI.After {
  getCommand() {
    return COMMANDS.DOCUMENT.SAVE
  }

  getId() {
    return HOOK_IDS.KIT.SAVE
  }

  getConditions(args) {
    return args.document && args.document.config && args.document.config.type === 'kit'
  }

  apply() {
    dataManager.invalidate()
  }
}
