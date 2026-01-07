import { describe, it, expect } from 'vitest'
import { getItemId } from '@/utils/getItemId'

describe('getItemId utility', () => {
  describe('getItemId', () => {
    it('returns _id from model attributes', () => {
      const model = {
        attributes: {
          _id: 'abc123'
        }
      }

      expect(getItemId(model as any)).toBe('abc123')
    })

    it('returns numeric id as string', () => {
      const model = {
        attributes: {
          _id: '12345'
        }
      }

      expect(getItemId(model as any)).toBe('12345')
    })

    it('returns null for undefined model', () => {
      expect(getItemId(undefined)).toBeNull()
    })

    it('returns null for model without attributes', () => {
      const model = {} as any

      expect(getItemId(model)).toBeNull()
    })

    it('returns null for model with empty attributes', () => {
      const model = {
        attributes: {}
      }

      expect(getItemId(model as any)).toBeNull()
    })

    it('returns null for model with undefined _id', () => {
      const model = {
        attributes: {
          _id: undefined
        }
      }

      expect(getItemId(model as any)).toBeNull()
    })

    it('returns null for model with null attributes', () => {
      const model = {
        attributes: null
      }

      expect(getItemId(model as any)).toBeNull()
    })

    it('handles model with other attributes but no _id', () => {
      const model = {
        attributes: {
          name: 'test',
          value: 'something'
        }
      }

      expect(getItemId(model as any)).toBeNull()
    })

    it('handles empty string _id', () => {
      const model = {
        attributes: {
          _id: ''
        }
      }

      // Empty string is falsy, returns null
      expect(getItemId(model as any)).toBeNull()
    })

    it('returns _id alongside other attributes', () => {
      const model = {
        attributes: {
          _id: 'xyz789',
          title: 'Preset Name',
          min_size: '16',
          max_size: '24'
        }
      }

      expect(getItemId(model as any)).toBe('xyz789')
    })

    it('handles Backbone-like model structure', () => {
      // Simulating Backbone.Model structure
      const model = {
        cid: 'c1',
        attributes: {
          _id: 'preset_custom_123'
        },
        get: function (attr: string) {
          return this.attributes[attr]
        }
      }

      expect(getItemId(model as any)).toBe('preset_custom_123')
    })

    it('handles UUID-style ids', () => {
      const model = {
        attributes: {
          _id: '550e8400-e29b-41d4-a716-446655440000'
        }
      }

      expect(getItemId(model as any)).toBe('550e8400-e29b-41d4-a716-446655440000')
    })

    it('handles special characters in id', () => {
      const model = {
        attributes: {
          _id: 'preset_heading-1_v2'
        }
      }

      expect(getItemId(model as any)).toBe('preset_heading-1_v2')
    })
  })
})
