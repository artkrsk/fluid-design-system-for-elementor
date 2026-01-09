import type { BackboneModel } from '@artemsemkin/elementor-types'

/** Get the item ID from a model */
export const getItemId = (itemModel: BackboneModel | undefined): string | null => {
  return itemModel?.attributes?._id || null
}
