import { describe, it, expect, afterEach, vi } from 'vitest'
import { resolveAnchorWidths } from '@/utils/screenAnchors'

/** Build a <select> whose selected option carries optional screen-width override attrs */
function makeSelect(attrs: Record<string, string> = {}): HTMLSelectElement {
  const select = document.createElement('select')
  const option = document.createElement('option')
  option.value = 'preset'
  for (const [key, value] of Object.entries(attrs)) {
    option.setAttribute(key, value)
  }
  select.appendChild(option)
  option.selected = true
  return select
}

/** Stub the anchor CSS custom properties read from the preview root (avoids jsdom CSS-var quirks) */
function stubAnchorVars(vars: Record<string, string>): void {
  vi.spyOn(window, 'getComputedStyle').mockReturnValue({
    getPropertyValue: (name: string) => vars[name] ?? ''
  } as unknown as CSSStyleDeclaration)
}

describe('resolveAnchorWidths', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('reads global anchors from the preview root CSS vars', () => {
    stubAnchorVars({
      '--arts-fluid-min-screen-value': '320',
      '--arts-fluid-max-screen-value': '1600'
    })

    expect(resolveAnchorWidths(null, document)).toEqual({ min: 320, max: 1600 })
  })

  it('falls back to 360 / 1920 when vars are empty', () => {
    stubAnchorVars({})

    expect(resolveAnchorWidths(null, document)).toEqual({ min: 360, max: 1920 })
  })

  it('falls back when vars are non-numeric', () => {
    stubAnchorVars({
      '--arts-fluid-min-screen-value': 'abc',
      '--arts-fluid-max-screen-value': ''
    })

    expect(resolveAnchorWidths(null, document)).toEqual({ min: 360, max: 1920 })
  })

  it('falls back to defaults when previewDoc is null', () => {
    expect(resolveAnchorWidths(null, null)).toEqual({ min: 360, max: 1920 })
  })

  it("uses the selected preset's per-preset override widths over the globals", () => {
    stubAnchorVars({
      '--arts-fluid-min-screen-value': '320',
      '--arts-fluid-max-screen-value': '1600'
    })
    const select = makeSelect({
      'data-min-screen-width-size': '400',
      'data-max-screen-width-size': '1440'
    })

    expect(resolveAnchorWidths(select, document)).toEqual({ min: 400, max: 1440 })
  })

  it('keeps the global value for a side without an override', () => {
    stubAnchorVars({
      '--arts-fluid-min-screen-value': '320',
      '--arts-fluid-max-screen-value': '1600'
    })
    const select = makeSelect({ 'data-min-screen-width-size': '400' })

    expect(resolveAnchorWidths(select, document)).toEqual({ min: 400, max: 1600 })
  })

  it('ignores non-numeric override attributes', () => {
    stubAnchorVars({
      '--arts-fluid-min-screen-value': '320',
      '--arts-fluid-max-screen-value': '1600'
    })
    const select = makeSelect({
      'data-min-screen-width-size': 'oops',
      'data-max-screen-width-size': ''
    })

    expect(resolveAnchorWidths(select, document)).toEqual({ min: 320, max: 1600 })
  })

  it('uses globals when the select has no selected option', () => {
    stubAnchorVars({
      '--arts-fluid-min-screen-value': '320',
      '--arts-fluid-max-screen-value': '1600'
    })
    const emptySelect = document.createElement('select')

    expect(resolveAnchorWidths(emptySelect, document)).toEqual({ min: 320, max: 1600 })
  })
})
