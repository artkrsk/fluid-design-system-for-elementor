import {
  HookOnRepeaterAdd,
  HookOnRepeaterRemove,
  HookOnRepeaterReorder,
  HookOnDocumentSave,
  HookOnKitSettingsSave
} from '../hooks'
import { NAMESPACES, COMMANDS } from '../constants'

const commandSystem = window.$e!

class Component extends commandSystem.modules.ComponentBase {
  getNamespace(): string {
    return NAMESPACES.HOOKS
  }

  defaultHooks(): Record<string, unknown> {
    return this.importHooks({
      [COMMANDS.REPEATER.INSERT]: HookOnRepeaterAdd,
      [COMMANDS.REPEATER.REMOVE]: HookOnRepeaterRemove,
      [COMMANDS.REPEATER.MOVE]: HookOnRepeaterReorder,
      [COMMANDS.DOCUMENT.SAVE]: HookOnDocumentSave,
      [COMMANDS.DOCUMENT.UPDATE]: HookOnKitSettingsSave
    })
  }
}

export const registerComponent = (): void => {
  window.$e?.components.register(new Component())
}
