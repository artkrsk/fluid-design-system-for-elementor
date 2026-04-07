import type { ThirdParty } from '@artemsemkin/elementor-types'

/** Get the item ID from a model */
export const getItemId = (itemModel: ThirdParty.BackboneModel | undefined): string | null => {
  return itemModel?.attributes?._id || null
}
