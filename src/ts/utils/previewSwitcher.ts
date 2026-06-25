import { createElement } from './dom'

type TAnchor = 'min' | 'max'

interface IPreviewSwitcherCallbacks {
  onAnchor: (anchor: TAnchor) => void
  onReset: () => void
}

interface IPreviewSwitcherResult {
  container: HTMLElement
  abortController: AbortController
}

/** Builds the per-control Min/Max/Reset preview-width switcher */
export class PreviewSwitcherManager {
  static createSwitcher(callbacks: IPreviewSwitcherCallbacks): IPreviewSwitcherResult {
    const strings = window.ArtsFluidDSStrings

    const container = createElement('div', 'e-fluid-preview-switcher e-hidden')

    const label = createElement('span', 'e-fluid-preview-switcher__label')
    label.textContent = strings?.previewLabel ?? 'Preview'
    container.appendChild(label)

    const minButton = PreviewSwitcherManager.createButton(
      'min',
      strings?.previewMin ?? 'Min',
      strings?.previewMinTitle ?? 'Preview at minimum screen width'
    )
    const maxButton = PreviewSwitcherManager.createButton(
      'max',
      strings?.previewMax ?? 'Max',
      strings?.previewMaxTitle ?? 'Preview at maximum screen width'
    )
    const resetButton = PreviewSwitcherManager.createButton(
      'reset',
      '',
      strings?.previewReset ?? 'Reset preview width',
      'eicon-undo'
    )

    container.appendChild(minButton)
    container.appendChild(maxButton)
    container.appendChild(resetButton)

    const abortController = new AbortController()

    container.addEventListener(
      'click',
      (event: Event) => {
        const button = (event.target as HTMLElement).closest('[data-anchor]') as HTMLElement | null
        if (!button) {
          return
        }

        event.preventDefault()
        const anchor = button.getAttribute('data-anchor')

        if (anchor === 'reset') {
          callbacks.onReset()
        } else if (anchor === 'min' || anchor === 'max') {
          callbacks.onAnchor(anchor)
        }
      },
      { signal: abortController.signal }
    )

    return { container, abortController }
  }

  /** Creates a single switcher button (optional eicon + label text) */
  private static createButton(
    anchor: string,
    text: string,
    title: string,
    iconClass?: string
  ): HTMLButtonElement {
    const button = createElement('button', 'e-fluid-preview-switcher__btn', {
      type: 'button',
      'data-anchor': anchor,
      title
    }) as HTMLButtonElement

    if (iconClass) {
      button.appendChild(createElement('i', iconClass))
    }

    if (text) {
      const span = createElement('span')
      span.textContent = text
      button.appendChild(span)
    }

    return button
  }
}
