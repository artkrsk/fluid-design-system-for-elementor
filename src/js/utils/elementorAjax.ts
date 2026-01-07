/**
 * Elementor AJAX Utilities
 * Promise wrapper for Elementor's callback-based AJAX API.
 * Extracted for reusability and testability.
 */

/**
 * Wraps Elementor AJAX request in a Promise
 * @template T
 * @param {string} action - AJAX action name
 * @param {object} [data] - Data to send with request
 * @returns {Promise<T>} Promise that resolves with response or rejects with error
 */
export function elementorAjaxRequest(action, data = {}) {
  return new Promise((resolve, reject) => {
    window.elementor?.ajax.addRequest(action, {
      data,
      success: resolve,
      error: reject
    })
  })
}
