import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { PreviewSwitcherManager } from '@/utils/previewSwitcher'

const q = (root: HTMLElement, selector: string) => root.querySelector(selector) as HTMLElement

describe('PreviewSwitcherManager.createSwitcher', () => {
  const originalStrings = (window as any).ArtsFluidDSStrings

  beforeEach(() => {
    ;(window as any).ArtsFluidDSStrings = undefined
  })

  afterEach(() => {
    ;(window as any).ArtsFluidDSStrings = originalStrings
  })

  it('builds a hidden container with a label and min/max/reset buttons', () => {
    const { container } = PreviewSwitcherManager.createSwitcher({
      onAnchor: vi.fn(),
      onReset: vi.fn()
    })

    expect(container.classList.contains('e-fluid-preview-switcher')).toBe(true)
    expect(container.classList.contains('e-hidden')).toBe(true)
    expect(q(container, '.e-fluid-preview-switcher__label').textContent).toBe('Preview')
    expect(container.querySelector('[data-anchor="min"]')).toBeTruthy()
    expect(container.querySelector('[data-anchor="max"]')).toBeTruthy()
    expect(container.querySelector('[data-anchor="reset"]')).toBeTruthy()
  })

  it('calls onAnchor with the clicked anchor', () => {
    const onAnchor = vi.fn()
    const onReset = vi.fn()
    const { container } = PreviewSwitcherManager.createSwitcher({ onAnchor, onReset })

    q(container, '[data-anchor="min"]').click()
    expect(onAnchor).toHaveBeenCalledWith('min')

    q(container, '[data-anchor="max"]').click()
    expect(onAnchor).toHaveBeenCalledWith('max')

    expect(onReset).not.toHaveBeenCalled()
  })

  it('calls onReset for the reset button only', () => {
    const onAnchor = vi.fn()
    const onReset = vi.fn()
    const { container } = PreviewSwitcherManager.createSwitcher({ onAnchor, onReset })

    q(container, '[data-anchor="reset"]').click()

    expect(onReset).toHaveBeenCalledTimes(1)
    expect(onAnchor).not.toHaveBeenCalled()
  })

  it('resolves the anchor when a child (e.g. label span) is clicked', () => {
    const onAnchor = vi.fn()
    const { container } = PreviewSwitcherManager.createSwitcher({ onAnchor, onReset: vi.fn() })

    q(container, '[data-anchor="min"] span').click()

    expect(onAnchor).toHaveBeenCalledWith('min')
  })

  it('does nothing when a non-button element is clicked', () => {
    const onAnchor = vi.fn()
    const onReset = vi.fn()
    const { container } = PreviewSwitcherManager.createSwitcher({ onAnchor, onReset })

    q(container, '.e-fluid-preview-switcher__label').click()

    expect(onAnchor).not.toHaveBeenCalled()
    expect(onReset).not.toHaveBeenCalled()
  })

  it('removes the click listener when the controller aborts', () => {
    const onAnchor = vi.fn()
    const { container, abortController } = PreviewSwitcherManager.createSwitcher({
      onAnchor,
      onReset: vi.fn()
    })

    abortController.abort()
    q(container, '[data-anchor="min"]').click()

    expect(onAnchor).not.toHaveBeenCalled()
  })

  it('uses localized strings when available, English fallbacks otherwise', () => {
    ;(window as any).ArtsFluidDSStrings = {
      previewLabel: 'Vista',
      previewMin: 'Min-x',
      previewMax: 'Max-x'
    }

    const { container } = PreviewSwitcherManager.createSwitcher({
      onAnchor: vi.fn(),
      onReset: vi.fn()
    })

    expect(q(container, '.e-fluid-preview-switcher__label').textContent).toBe('Vista')
    expect(q(container, '[data-anchor="min"] span').textContent).toBe('Min-x')
    expect(q(container, '[data-anchor="max"] span').textContent).toBe('Max-x')
  })
})
