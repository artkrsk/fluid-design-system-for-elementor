import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { PreviewSizeManager } from '@/managers/PreviewSizeManager'
import { PREVIEW } from '@/constants'

const ACTIVE_CLASS = PREVIEW.ACTIVE_CLASS
const VAR_WIDTH = PREVIEW.VAR_WIDTH

/** Build a switcher element with min/max/reset buttons, attached to the body */
function makeSwitcher(): HTMLElement {
  const el = document.createElement('div')
  el.className = 'e-fluid-preview-switcher'
  for (const anchor of ['min', 'max', 'reset']) {
    const button = document.createElement('button')
    button.setAttribute('data-anchor', anchor)
    el.appendChild(button)
  }
  document.body.appendChild(el)
  return el
}

function btn(switcher: HTMLElement, anchor: string): HTMLElement {
  return switcher.querySelector(`[data-anchor="${anchor}"]`) as HTMLElement
}

function isActive(): boolean {
  return document.body.classList.contains(ACTIVE_CLASS)
}

describe('PreviewSizeManager', () => {
  const originalElementor = (window as any).elementor

  let manager: PreviewSizeManager
  let ioCallback: IntersectionObserverCallback | null
  let deviceModeHandlers: Record<string, () => void>

  beforeEach(() => {
    document.body.className = ''
    document.body.removeAttribute('style')
    document.body.innerHTML = ''

    ioCallback = null
    class MockIntersectionObserver {
      constructor(cb: IntersectionObserverCallback) {
        ioCallback = cb
      }
      observe = vi.fn()
      disconnect = vi.fn()
      unobserve = vi.fn()
      takeRecords = vi.fn()
    }
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)

    deviceModeHandlers = {}
    ;(window as any).elementor = {
      channels: {
        deviceMode: {
          on: (event: string, handler: () => void) => {
            deviceModeHandlers[event] = handler
          }
        }
      }
    }

    manager = new PreviewSizeManager()
  })

  afterEach(() => {
    ;(window as any).elementor = originalElementor
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    document.body.className = ''
    document.body.removeAttribute('style')
    document.body.innerHTML = ''
  })

  /** Force offsetParent (jsdom returns null with no layout) */
  function setVisible(el: HTMLElement, visible: boolean): void {
    Object.defineProperty(el, 'offsetParent', {
      configurable: true,
      get: () => (visible ? document.body : null)
    })
  }

  it('applyAnchor sets the body class + width var and marks the owner button active', () => {
    const sw = makeSwitcher()
    manager.register(sw)

    manager.applyAnchor('min', 360, sw)

    expect(isActive()).toBe(true)
    expect(document.body.style.getPropertyValue(VAR_WIDTH)).toBe('360px')
    expect(btn(sw, 'min').classList.contains('is-active')).toBe(true)
    expect(btn(sw, 'max').classList.contains('is-active')).toBe(false)
  })

  it('re-clicking the active anchor on the same owner toggles off (reset)', () => {
    const sw = makeSwitcher()
    manager.register(sw)

    manager.applyAnchor('min', 360, sw)
    manager.applyAnchor('min', 360, sw)

    expect(isActive()).toBe(false)
    expect(document.body.style.getPropertyValue(VAR_WIDTH)).toBe('')
    expect(btn(sw, 'min').classList.contains('is-active')).toBe(false)
  })

  it('switching anchor updates the width var and moves the active highlight', () => {
    const sw = makeSwitcher()
    manager.register(sw)

    manager.applyAnchor('min', 360, sw)
    manager.applyAnchor('max', 1920, sw)

    expect(document.body.style.getPropertyValue(VAR_WIDTH)).toBe('1920px')
    expect(btn(sw, 'min').classList.contains('is-active')).toBe(false)
    expect(btn(sw, 'max').classList.contains('is-active')).toBe(true)
  })

  it('reset clears state across all registered switchers', () => {
    const a = makeSwitcher()
    const b = makeSwitcher()
    manager.register(a)
    manager.register(b)
    manager.applyAnchor('min', 360, a)

    manager.reset()

    expect(isActive()).toBe(false)
    expect(btn(a, 'min').classList.contains('is-active')).toBe(false)
    expect(btn(b, 'min').classList.contains('is-active')).toBe(false)
  })

  it('only the owner switcher shows the active highlight', () => {
    const a = makeSwitcher()
    const b = makeSwitcher()
    manager.register(a)
    manager.register(b)

    manager.applyAnchor('min', 360, a)

    expect(btn(a, 'min').classList.contains('is-active')).toBe(true)
    expect(btn(b, 'min').classList.contains('is-active')).toBe(false)
  })

  it('unregistering the active owner resets the preview', () => {
    const sw = makeSwitcher()
    manager.register(sw)
    manager.applyAnchor('min', 360, sw)

    manager.unregister(sw)

    expect(isActive()).toBe(false)
  })

  it('unregistering a non-owner does not reset', () => {
    const a = makeSwitcher()
    const b = makeSwitcher()
    manager.register(a)
    manager.register(b)
    manager.applyAnchor('min', 360, a)

    manager.unregister(b)

    expect(isActive()).toBe(true)
  })

  it('resetIfOwner resets only when the switcher owns the active resize', () => {
    const a = makeSwitcher()
    const b = makeSwitcher()
    manager.register(a)
    manager.register(b)
    manager.applyAnchor('min', 360, a)

    manager.resetIfOwner(b)
    expect(isActive()).toBe(true)

    manager.resetIfOwner(a)
    expect(isActive()).toBe(false)
  })

  it('resets when the device mode changes', () => {
    const sw = makeSwitcher()
    manager.register(sw)
    manager.applyAnchor('min', 360, sw)

    deviceModeHandlers.change?.()

    expect(isActive()).toBe(false)
  })

  it('binds the device-mode change listener only once', () => {
    const onSpy = vi.fn()
    ;(window as any).elementor.channels.deviceMode.on = onSpy
    const m = new PreviewSizeManager()

    m.register(makeSwitcher())
    m.register(makeSwitcher())

    expect(onSpy).toHaveBeenCalledTimes(1)
    expect(onSpy).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('resets when the owner becomes hidden (offsetParent null)', () => {
    const sw = makeSwitcher()
    manager.register(sw)
    manager.applyAnchor('min', 360, sw)

    setVisible(sw, false)
    ioCallback?.([{ isIntersecting: false, target: sw } as any], {} as any)

    expect(isActive()).toBe(false)
  })

  it('does not reset when the owner is merely scrolled out of view', () => {
    const sw = makeSwitcher()
    manager.register(sw)
    manager.applyAnchor('min', 360, sw)

    setVisible(sw, true)
    ioCallback?.([{ isIntersecting: false, target: sw } as any], {} as any)

    expect(isActive()).toBe(true)
  })
})
