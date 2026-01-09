/**
 * Elementor AJAX Utilities
 * Promise wrapper for Elementor's callback-based AJAX API.
 * Extracted for reusability and testability.
 */

/** Wraps Elementor AJAX request in a Promise */
export function elementorAjaxRequest<T>(action: string, data: object = {}): Promise<T> {
  return new Promise((resolve, reject) => {
    window.elementor?.ajax.addRequest(action, {
      data,
      success: resolve,
      error: reject
    })
  })
}
