import { PREFIX } from './Prefix'

// Hook IDs
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

// Container types
export const CONTAINER_TYPES = {
  DOCUMENT: 'document'
}
