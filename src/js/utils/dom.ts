export const createElement = (
  tag: string,
  className?: string | null,
  attributes: Record<string, string> = {}
): HTMLElement => {
  const element = document.createElement(tag)

  if (className) {
    element.className = className
  }

  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value))

  return element
}
