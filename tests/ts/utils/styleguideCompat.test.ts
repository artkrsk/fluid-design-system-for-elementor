import { describe, it, expect } from 'vitest'
import { sanitizeFluidCSS } from '@/utils/styleguideCompat'

describe('sanitizeFluidCSS', () => {
  it('strips "fluid" after var() with semicolon', () => {
    const input = '.foo { font-size: var(--arts-fluid-preset--id) fluid; }'
    const result = sanitizeFluidCSS(input)

    expect(result).toBe('.foo { font-size: var(--arts-fluid-preset--id); }')
  })

  it('strips "fluid" after clamp() with semicolon', () => {
    const input = '.foo { font-size: clamp(16px, 2vw, 24px) fluid; }'
    const result = sanitizeFluidCSS(input)

    expect(result).toBe('.foo { font-size: clamp(16px, 2vw, 24px); }')
  })

  it('strips "fluid" at end of string without semicolon', () => {
    const input = '.foo { font-size: var(--x) fluid }'
    const result = sanitizeFluidCSS(input)

    expect(result).toBe('.foo { font-size: var(--x) }')
  })

  it('strips "fluid" with extra whitespace before it', () => {
    const input = '.foo { font-size: var(--x)   fluid; }'
    const result = sanitizeFluidCSS(input)

    expect(result).toBe('.foo { font-size: var(--x); }')
  })

  it('strips multiple occurrences in one rule', () => {
    const input = '.foo { font-size: var(--a) fluid; letter-spacing: var(--b) fluid; }'
    const result = sanitizeFluidCSS(input)

    expect(result).toBe('.foo { font-size: var(--a); letter-spacing: var(--b); }')
  })

  it('does not modify rules without "fluid"', () => {
    const input = '.foo { font-size: 16px; }'
    const result = sanitizeFluidCSS(input)

    expect(result).toBe('.foo { font-size: 16px; }')
  })

  it('does not modify CSS custom properties containing "fluid" in name', () => {
    const input = '.foo { --fluid-var: 10px; }'
    const result = sanitizeFluidCSS(input)

    expect(result).toBe('.foo { --fluid-var: 10px; }')
  })

  it('does not modify "fluid" inside var() reference', () => {
    const input = '.foo { font-size: var(--my-fluid-thing); }'
    const result = sanitizeFluidCSS(input)

    expect(result).toBe('.foo { font-size: var(--my-fluid-thing); }')
  })

  it('does not match "fluid-thing" after closing paren', () => {
    const input = '.foo { content: calc(100%) fluid-extra; }'
    const result = sanitizeFluidCSS(input)

    expect(result).toBe('.foo { content: calc(100%) fluid-extra; }')
  })

  it('returns empty string unchanged', () => {
    expect(sanitizeFluidCSS('')).toBe('')
  })

  it('handles real-world styled-components rule', () => {
    const input =
      '.ecSLNa{font-family:Roboto,sans-serif;font-size:var(--arts-fluid-preset--fluid-9446699a-33ac-4826-925f-da57395047d8) fluid;font-weight:600;}'
    const result = sanitizeFluidCSS(input)

    expect(result).toBe(
      '.ecSLNa{font-family:Roboto,sans-serif;font-size:var(--arts-fluid-preset--fluid-9446699a-33ac-4826-925f-da57395047d8);font-weight:600;}'
    )
  })
})
