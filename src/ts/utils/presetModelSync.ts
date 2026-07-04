import type { IPresetRow } from '../interfaces'

/** Resolves the Kit document container that owns the fluid preset repeaters. */
function getKitContainer(): any {
  const elementor = window.elementor as any
  const documents = elementor?.documents
  const kitId = elementor?.config?.kit_id
  const doc = kitId != null && documents?.get ? documents.get(kitId) : documents?.getCurrent?.()
  return doc?.container
}

/**
 * Mirrors a newly created preset into the editor's in-memory Kit model.
 *
 * Preset creation persists server-side immediately, but the open editor's Kit
 * repeater collection never learns about it — so the next Site Settings save
 * serializes a stale model and drops the row. Running the same repeater/insert
 * command the native UI uses keeps the save payload in sync.
 */
export function insertPresetRow(controlId: string, row: IPresetRow): void {
  const container = getKitContainer()
  if (!container) {
    return
  }
  window.$e?.run('document/repeater/insert', { container, name: controlId, model: row })
}

/** Mirrors an edited preset's fields onto the matching row in the editor's Kit model. */
export function updatePresetRow(
  controlId: string,
  presetId: string,
  fields: Partial<IPresetRow>
): void {
  const container = getKitContainer()
  const collection = container?.settings?.get(controlId)
  const model = collection?.findWhere?.({ _id: presetId })
  if (model && typeof model.set === 'function') {
    model.set(fields)
  }
}
