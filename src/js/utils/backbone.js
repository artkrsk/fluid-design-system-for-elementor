/**
 * Call parent class method in Backbone extend pattern
 * @param {any} instance - The instance (this)
 * @param {string} method - Method name to call
 * @param {IArguments | any[]} [args] - Arguments to pass (typically `arguments`)
 * @returns {any}
 */
export const callSuper = (instance, method, args = []) => {
  const proto = /** @type {any} */ (instance).constructor.__super__
  return proto[method].apply(instance, args)
}
