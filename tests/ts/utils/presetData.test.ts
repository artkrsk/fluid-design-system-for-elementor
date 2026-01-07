import { describe, it, expect } from 'vitest'
import { buildCreatePresetData, buildUpdatePresetData } from '@/utils/presetData'

describe('presetData utilities', () => {
  describe('buildCreatePresetData', () => {
    it('builds preset data with all fields', () => {
      const result = buildCreatePresetData(
        'Heading 1',
        { size: '24', unit: 'px' },
        { size: '48', unit: 'px' },
        'typography'
      )

      expect(result).toEqual({
        title: 'Heading 1',
        min_size: '24',
        min_unit: 'px',
        max_size: '48',
        max_unit: 'px',
        group: 'typography'
      })
    })

    it('uses default title when title is empty', () => {
      const result = buildCreatePresetData(
        '',
        { size: '16', unit: 'px' },
        { size: '24', unit: 'rem' }
      )

      expect(result.title).toBe('Custom 16px ~ 24rem')
    })

    it('uses default title when title is whitespace only', () => {
      const result = buildCreatePresetData(
        '   ',
        { size: '1', unit: 'rem' },
        { size: '2', unit: 'rem' }
      )

      expect(result.title).toBe('Custom 1rem ~ 2rem')
    })

    it('trims whitespace from title', () => {
      const result = buildCreatePresetData(
        '  My Preset  ',
        { size: '16', unit: 'px' },
        { size: '24', unit: 'px' }
      )

      expect(result.title).toBe('My Preset')
    })

    it('defaults group to spacing when not provided', () => {
      const result = buildCreatePresetData(
        'Test',
        { size: '10', unit: 'px' },
        { size: '20', unit: 'px' }
      )

      expect(result.group).toBe('spacing')
    })

    it('defaults group to spacing when undefined', () => {
      const result = buildCreatePresetData(
        'Test',
        { size: '10', unit: 'px' },
        { size: '20', unit: 'px' },
        undefined
      )

      expect(result.group).toBe('spacing')
    })

    it('uses provided group', () => {
      const result = buildCreatePresetData(
        'Test',
        { size: '10', unit: 'px' },
        { size: '20', unit: 'px' },
        'custom-group'
      )

      expect(result.group).toBe('custom-group')
    })

    it('handles decimal sizes', () => {
      const result = buildCreatePresetData(
        'Body Text',
        { size: '0.875', unit: 'rem' },
        { size: '1.125', unit: 'rem' },
        'typography'
      )

      expect(result.min_size).toBe('0.875')
      expect(result.max_size).toBe('1.125')
    })

    it('handles mixed units', () => {
      const result = buildCreatePresetData(
        'Mixed',
        { size: '16', unit: 'px' },
        { size: '2', unit: 'rem' },
        'spacing'
      )

      expect(result.min_unit).toBe('px')
      expect(result.max_unit).toBe('rem')
    })

    it('handles negative sizes', () => {
      const result = buildCreatePresetData(
        'Negative',
        { size: '-10', unit: 'px' },
        { size: '10', unit: 'px' }
      )

      expect(result.min_size).toBe('-10')
      expect(result.max_size).toBe('10')
    })

    it('handles zero sizes', () => {
      const result = buildCreatePresetData(
        'From Zero',
        { size: '0', unit: 'px' },
        { size: '24', unit: 'px' }
      )

      expect(result.min_size).toBe('0')
    })

    it('preserves all supported units', () => {
      const units = ['px', 'rem', 'em', '%', 'vw', 'vh']

      for (const unit of units) {
        const result = buildCreatePresetData(
          'Test',
          { size: '10', unit },
          { size: '20', unit }
        )

        expect(result.min_unit).toBe(unit)
        expect(result.max_unit).toBe(unit)
      }
    })

    it('generates descriptive default title', () => {
      const result = buildCreatePresetData(
        '',
        { size: '14', unit: 'px' },
        { size: '18', unit: 'px' }
      )

      expect(result.title).toBe('Custom 14px ~ 18px')
    })
  })

  describe('buildUpdatePresetData', () => {
    it('builds update data with all fields', () => {
      const result = buildUpdatePresetData(
        'preset_123',
        'Updated Title',
        { size: '20', unit: 'px' },
        { size: '40', unit: 'px' },
        'typography'
      )

      expect(result).toEqual({
        preset_id: 'preset_123',
        title: 'Updated Title',
        min_size: '20',
        min_unit: 'px',
        max_size: '40',
        max_unit: 'px',
        group: 'typography'
      })
    })

    it('trims whitespace from title', () => {
      const result = buildUpdatePresetData(
        'preset_1',
        '  Trimmed Title  ',
        { size: '16', unit: 'px' },
        { size: '24', unit: 'px' },
        'spacing'
      )

      expect(result.title).toBe('Trimmed Title')
    })

    it('returns empty string for empty title (no default)', () => {
      const result = buildUpdatePresetData(
        'preset_1',
        '',
        { size: '16', unit: 'px' },
        { size: '24', unit: 'px' },
        'spacing'
      )

      // Note: unlike create, update returns empty string
      expect(result.title).toBe('')
    })

    it('returns empty string for whitespace-only title', () => {
      const result = buildUpdatePresetData(
        'preset_1',
        '   ',
        { size: '16', unit: 'px' },
        { size: '24', unit: 'px' },
        'spacing'
      )

      expect(result.title).toBe('')
    })

    it('preserves preset_id exactly', () => {
      const result = buildUpdatePresetData(
        'preset_custom_abc-123',
        'Test',
        { size: '10', unit: 'px' },
        { size: '20', unit: 'px' },
        'spacing'
      )

      expect(result.preset_id).toBe('preset_custom_abc-123')
    })

    it('handles UUID-style preset id', () => {
      const result = buildUpdatePresetData(
        '550e8400-e29b-41d4-a716-446655440000',
        'Test',
        { size: '10', unit: 'px' },
        { size: '20', unit: 'px' },
        'spacing'
      )

      expect(result.preset_id).toBe('550e8400-e29b-41d4-a716-446655440000')
    })

    it('handles decimal values', () => {
      const result = buildUpdatePresetData(
        'preset_1',
        'Test',
        { size: '1.5', unit: 'rem' },
        { size: '2.5', unit: 'rem' },
        'typography'
      )

      expect(result.min_size).toBe('1.5')
      expect(result.max_size).toBe('2.5')
    })

    it('handles different min and max units', () => {
      const result = buildUpdatePresetData(
        'preset_1',
        'Mixed Units',
        { size: '14', unit: 'px' },
        { size: '1.5', unit: 'rem' },
        'typography'
      )

      expect(result.min_unit).toBe('px')
      expect(result.max_unit).toBe('rem')
    })

    it('uses group parameter directly', () => {
      const result = buildUpdatePresetData(
        'preset_1',
        'Test',
        { size: '10', unit: 'px' },
        { size: '20', unit: 'px' },
        'custom_group_id'
      )

      expect(result.group).toBe('custom_group_id')
    })

    it('handles empty group id', () => {
      const result = buildUpdatePresetData(
        'preset_1',
        'Test',
        { size: '10', unit: 'px' },
        { size: '20', unit: 'px' },
        ''
      )

      expect(result.group).toBe('')
    })
  })

  describe('integration: create vs update data', () => {
    it('create has default title generation, update does not', () => {
      const createResult = buildCreatePresetData(
        '',
        { size: '16', unit: 'px' },
        { size: '24', unit: 'px' }
      )

      const updateResult = buildUpdatePresetData(
        'preset_1',
        '',
        { size: '16', unit: 'px' },
        { size: '24', unit: 'px' },
        'spacing'
      )

      expect(createResult.title).toBe('Custom 16px ~ 24px')
      expect(updateResult.title).toBe('')
    })

    it('create has default group, update uses provided group', () => {
      const createResult = buildCreatePresetData(
        'Test',
        { size: '16', unit: 'px' },
        { size: '24', unit: 'px' }
        // No group provided
      )

      const updateResult = buildUpdatePresetData(
        'preset_1',
        'Test',
        { size: '16', unit: 'px' },
        { size: '24', unit: 'px' },
        'required_group' // Group is required
      )

      expect(createResult.group).toBe('spacing')
      expect(updateResult.group).toBe('required_group')
    })

    it('both preserve size and unit values identically', () => {
      const minParsed = { size: '0.875', unit: 'rem' }
      const maxParsed = { size: '1.25', unit: 'em' }

      const createResult = buildCreatePresetData('Test', minParsed, maxParsed)
      const updateResult = buildUpdatePresetData('p1', 'Test', minParsed, maxParsed, 'g1')

      expect(createResult.min_size).toBe(updateResult.min_size)
      expect(createResult.min_unit).toBe(updateResult.min_unit)
      expect(createResult.max_size).toBe(updateResult.max_size)
      expect(createResult.max_unit).toBe(updateResult.max_unit)
    })
  })
})
