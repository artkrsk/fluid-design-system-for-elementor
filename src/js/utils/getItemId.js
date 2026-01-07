/**
 * Get the item ID from a model
 * @param {import('@arts/elementor-types').BackboneModel | undefined} itemModel
 * @returns {string|null}
 */
export const getItemId = (itemModel) => {
  return itemModel?.attributes?._id || null
}
