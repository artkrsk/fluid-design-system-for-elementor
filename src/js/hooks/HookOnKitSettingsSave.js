import { COMMANDS, HOOK_IDS } from '../constants'
import dataManager from '../managers/DataManager'

const commandSystem = /** @type {import('@arts/elementor-types').$e} */ (window.$e)

export class HookOnKitSettingsSave extends commandSystem.modules.hookUI.After {
  getCommand() {
    return COMMANDS.DOCUMENT.SAVE
  }

  getId() {
    return HOOK_IDS.KIT.SAVE
  }

  /** @param {import('@arts/elementor-types').HookArgs} args */
  getConditions(args) {
    return args.document && args.document.config && args.document.config.type === 'kit'
  }

  apply() {
    dataManager.invalidate()
  }
}
