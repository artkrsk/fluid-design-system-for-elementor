/**
 * Get the item ID from a model
 * @param {Object} itemModel - The Backbone model
 * @returns {string|null} The item ID or null
 */
export const getItemId = (itemModel) => {
  return itemModel?.attributes?._id || null
}
