import {
  HookOnRepeaterAdd,
  HookOnRepeaterRemove,
  HookOnRepeaterReorder,
  HookOnDocumentSave,
  HookOnKitSettingsSave
} from '../hooks'
import { NAMESPACES, COMMANDS } from '../constants'

class Component extends window.$e.modules.ComponentBase {
  getNamespace() {
    return NAMESPACES.HOOKS
  }

  defaultHooks() {
    return this.importHooks({
      [COMMANDS.REPEATER.INSERT]: HookOnRepeaterAdd,
      [COMMANDS.REPEATER.REMOVE]: HookOnRepeaterRemove,
      [COMMANDS.REPEATER.MOVE]: HookOnRepeaterReorder,
      [COMMANDS.DOCUMENT.SAVE]: HookOnDocumentSave,
      [COMMANDS.DOCUMENT.UPDATE]: HookOnKitSettingsSave
    })
  }
}

export const registerComponent = () => {
  window.$e.components.register(new Component())
}
