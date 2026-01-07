import { describe, it, expect } from 'vitest'
import { createElement } from '@/utils/dom'

describe('dom utilities', () => {
  describe('createElement', () => {
    it('creates element with specified tag', () => {
      const element = createElement('div')

      expect(element.tagName).toBe('DIV')
    })

    it('creates span element', () => {
      const element = createElement('span')

      expect(element.tagName).toBe('SPAN')
    })

    it('creates input element', () => {
      const element = createElement('input')

      expect(element.tagName).toBe('INPUT')
    })

    it('sets className when provided', () => {
      const element = createElement('div', 'my-class')

      expect(element.className).toBe('my-class')
    })

    it('sets multiple classes via className string', () => {
      const element = createElement('div', 'class-one class-two class-three')

      expect(element.className).toBe('class-one class-two class-three')
      expect(element.classList.contains('class-one')).toBe(true)
      expect(element.classList.contains('class-two')).toBe(true)
      expect(element.classList.contains('class-three')).toBe(true)
    })

    it('does not set className when null', () => {
      const element = createElement('div', null)

      expect(element.className).toBe('')
    })

    it('does not set className when undefined', () => {
      const element = createElement('div', undefined)

      expect(element.className).toBe('')
    })

    it('does not set className when empty string', () => {
      // Empty string is falsy, so className won't be set
      const element = createElement('div', '')

      expect(element.className).toBe('')
    })

    it('sets single attribute', () => {
      const element = createElement('input', null, { type: 'text' })

      expect(element.getAttribute('type')).toBe('text')
    })

    it('sets multiple attributes', () => {
      const element = createElement('input', null, {
        type: 'number',
        min: '0',
        max: '100',
        placeholder: 'Enter value'
      })

      expect(element.getAttribute('type')).toBe('number')
      expect(element.getAttribute('min')).toBe('0')
      expect(element.getAttribute('max')).toBe('100')
      expect(element.getAttribute('placeholder')).toBe('Enter value')
    })

    it('sets data attributes', () => {
      const element = createElement('div', null, {
        'data-id': '123',
        'data-value': 'test'
      })

      expect(element.getAttribute('data-id')).toBe('123')
      expect(element.getAttribute('data-value')).toBe('test')
      expect(element.dataset.id).toBe('123')
      expect(element.dataset.value).toBe('test')
    })

    it('sets aria attributes', () => {
      const element = createElement('button', null, {
        'aria-label': 'Close',
        'aria-expanded': 'false'
      })

      expect(element.getAttribute('aria-label')).toBe('Close')
      expect(element.getAttribute('aria-expanded')).toBe('false')
    })

    it('combines className and attributes', () => {
      const element = createElement('button', 'btn btn-primary', {
        type: 'submit',
        disabled: 'true'
      })

      expect(element.className).toBe('btn btn-primary')
      expect(element.getAttribute('type')).toBe('submit')
      expect(element.getAttribute('disabled')).toBe('true')
    })

    it('handles empty attributes object', () => {
      const element = createElement('div', 'my-class', {})

      expect(element.className).toBe('my-class')
      expect(element.attributes.length).toBe(1) // Only class attribute
    })

    it('sets id attribute', () => {
      const element = createElement('div', null, { id: 'unique-id' })

      expect(element.id).toBe('unique-id')
      expect(element.getAttribute('id')).toBe('unique-id')
    })

    it('sets style attribute as string', () => {
      const element = createElement('div', null, {
        style: 'color: red; font-size: 16px;'
      })

      expect(element.getAttribute('style')).toBe('color: red; font-size: 16px;')
    })

    it('returns HTMLElement instance', () => {
      const element = createElement('div')

      expect(element).toBeInstanceOf(HTMLElement)
    })

    it('creates nested-friendly elements', () => {
      const parent = createElement('div', 'parent')
      const child = createElement('span', 'child')

      parent.appendChild(child)

      expect(parent.children.length).toBe(1)
      expect(parent.firstElementChild).toBe(child)
    })
  })
})
