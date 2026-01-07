/**
 * @param {string} tag
 * @param {string | null} [className]
 * @param {Record<string, string>} [attributes]
 */
export const createElement = (tag, className, attributes = {}) => {
  const element = document.createElement(tag)

  if (className) {
    element.className = className
  }

  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value))

  return element
}
