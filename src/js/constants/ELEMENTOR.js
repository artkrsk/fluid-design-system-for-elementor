/** Base prefix for all plugin identifiers */
export const PREFIX = 'fluid-design-system-for-elementor'

/** Elementor command paths for $e.run() */
export const COMMANDS = {
  REPEATER: {
    INSERT: 'document/repeater/insert',
    REMOVE: 'document/repeater/remove',
    MOVE: 'document/repeater/move'
  },
  DOCUMENT: {
    UPDATE: 'document/save/update',
    SAVE: 'document/save/save'
  }
}

/** Hook registration IDs for $e.hooks system */
export const HOOK_IDS = {
  REPEATER: {
    ADD: `${PREFIX}-hook-on-repeater-add`,
    REMOVE: `${PREFIX}-hook-on-repeater-remove`,
    REORDER: `${PREFIX}-hook-on-repeater-reorder`
  },
  DOCUMENT: {
    SAVE: `${PREFIX}-hook-on-document-save`
  },
  KIT: {
    SAVE: `${PREFIX}-hook-on-kit-save`
  }
}

/** Component namespaces for $e.components.register() */
export const NAMESPACES = {
  HOOKS: `${PREFIX}-hooks`
}

/** Elementor container type identifiers */
export const CONTAINER_TYPES = {
  DOCUMENT: 'document'
}
