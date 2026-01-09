import { describe, it, expect, vi } from 'vitest'
import {
  parseControlNameDevice,
  getDeviceControlName,
  buildInheritanceResult,
  getAncestorDevices,
  findInheritedValue,
  getWidescreenInheritedValue,
  resolveInheritedValue
} from '@/utils/deviceInheritance'

/** Standard Elementor device order */
const DEVICE_ORDER = ['desktop', 'laptop', 'tablet_extra', 'tablet', 'mobile_extra', 'mobile']

/** Extended device order including widescreen */
const DEVICE_ORDER_WITH_WIDESCREEN = ['widescreen', ...DEVICE_ORDER]

describe('deviceInheritance utilities', () => {
  describe('parseControlNameDevice', () => {
    it('returns baseName with null suffix for desktop control', () => {
      const result = parseControlNameDevice('typography_font_size', DEVICE_ORDER)

      expect(result).toEqual({ baseName: 'typography_font_size', deviceSuffix: null })
    })

    it('extracts tablet suffix', () => {
      const result = parseControlNameDevice('typography_font_size_tablet', DEVICE_ORDER)

      expect(result).toEqual({ baseName: 'typography_font_size', deviceSuffix: 'tablet' })
    })

    it('extracts mobile suffix', () => {
      const result = parseControlNameDevice('spacing_padding_mobile', DEVICE_ORDER)

      expect(result).toEqual({ baseName: 'spacing_padding', deviceSuffix: 'mobile' })
    })

    it('extracts tablet_extra suffix', () => {
      const result = parseControlNameDevice('width_tablet_extra', DEVICE_ORDER)

      expect(result).toEqual({ baseName: 'width', deviceSuffix: 'tablet_extra' })
    })

    it('extracts widescreen suffix when in device order', () => {
      const result = parseControlNameDevice('font_size_widescreen', DEVICE_ORDER_WITH_WIDESCREEN)

      expect(result).toEqual({ baseName: 'font_size', deviceSuffix: 'widescreen' })
    })

    it('handles control names with underscores', () => {
      const result = parseControlNameDevice('my_custom_control_name_tablet', DEVICE_ORDER)

      expect(result).toEqual({ baseName: 'my_custom_control_name', deviceSuffix: 'tablet' })
    })

    it('returns original name when suffix not in device order', () => {
      const result = parseControlNameDevice('font_size_unknown', DEVICE_ORDER)

      expect(result).toEqual({ baseName: 'font_size_unknown', deviceSuffix: null })
    })
  })

  describe('getDeviceControlName', () => {
    it('returns baseName for desktop', () => {
      expect(getDeviceControlName('font_size', 'desktop')).toBe('font_size')
    })

    it('appends tablet suffix', () => {
      expect(getDeviceControlName('font_size', 'tablet')).toBe('font_size_tablet')
    })

    it('appends mobile suffix', () => {
      expect(getDeviceControlName('font_size', 'mobile')).toBe('font_size_mobile')
    })

    it('appends widescreen suffix', () => {
      expect(getDeviceControlName('font_size', 'widescreen')).toBe('font_size_widescreen')
    })
  })

  describe('buildInheritanceResult', () => {
    it('spreads original value and adds metadata', () => {
      const value = { size: '16', unit: 'px', custom: 'data' }
      const result = buildInheritanceResult(value, 'tablet', 'mobile', ['desktop', 'tablet'])

      expect(result).toEqual({
        size: '16',
        unit: 'px',
        custom: 'data',
        __inheritedFrom: 'tablet',
        __directParentDevice: 'mobile',
        __inheritPath: ['desktop', 'tablet'],
        __sourceUnit: 'px'
      })
    })

    it('handles value without unit property', () => {
      const value = { size: '16' }
      const result = buildInheritanceResult(value, 'desktop', 'desktop', ['desktop'])

      expect(result.__sourceUnit).toBeUndefined()
    })
  })

  describe('getAncestorDevices', () => {
    it('returns empty array for desktop', () => {
      expect(getAncestorDevices('desktop', DEVICE_ORDER)).toEqual([])
    })

    it('returns desktop for tablet', () => {
      expect(getAncestorDevices('tablet', DEVICE_ORDER)).toEqual([
        'desktop',
        'laptop',
        'tablet_extra'
      ])
    })

    it('returns all ancestors for mobile', () => {
      expect(getAncestorDevices('mobile', DEVICE_ORDER)).toEqual([
        'desktop',
        'laptop',
        'tablet_extra',
        'tablet',
        'mobile_extra'
      ])
    })

    it('returns desktop only for laptop', () => {
      expect(getAncestorDevices('laptop', DEVICE_ORDER)).toEqual(['desktop'])
    })

    it('returns all but last when device not in order (indexOf returns -1)', () => {
      // slice(0, -1) when device not found - this is edge case behavior
      expect(getAncestorDevices('unknown', DEVICE_ORDER)).toEqual([
        'desktop',
        'laptop',
        'tablet_extra',
        'tablet',
        'mobile_extra'
      ])
    })
  })

  describe('findInheritedValue', () => {
    it('returns null for empty ancestor list', () => {
      const getValueFn = vi.fn()
      const isEmptyFn = vi.fn()

      const result = findInheritedValue('font_size', [], getValueFn, isEmptyFn)

      expect(result).toBeNull()
      expect(getValueFn).not.toHaveBeenCalled()
    })

    it('returns direct parent value when not empty', () => {
      const parentValue = { size: '16', unit: 'px' }
      const getValueFn = vi.fn().mockReturnValue(parentValue)
      const isEmptyFn = vi.fn().mockReturnValue(false)

      const result = findInheritedValue('font_size', ['desktop', 'tablet'], getValueFn, isEmptyFn)

      expect(result).toMatchObject({
        size: '16',
        unit: 'px',
        __inheritedFrom: 'tablet',
        __directParentDevice: 'tablet'
      })
      expect(getValueFn).toHaveBeenCalledWith('font_size_tablet')
    })

    it('traverses up hierarchy when parent is empty', () => {
      const desktopValue = { size: '20', unit: 'px' }
      const getValueFn = vi.fn().mockImplementation((name: string) => {
        if (name === 'font_size') {
          return desktopValue
        }
        return null // tablet returns null
      })
      const isEmptyFn = vi.fn().mockReturnValue(true)

      findInheritedValue('font_size', ['desktop', 'tablet'], getValueFn, isEmptyFn)

      expect(getValueFn).toHaveBeenCalledWith('font_size_tablet')
      expect(getValueFn).toHaveBeenCalledWith('font_size') // desktop
    })

    it('finds value in middle of hierarchy', () => {
      const tabletValue = { size: '18', unit: 'px' }
      const getValueFn = vi.fn().mockImplementation((name: string) => {
        if (name === 'font_size_tablet') {
          return tabletValue
        }
        return { size: '', unit: '' } // empty but not null
      })
      const isEmptyFn = vi.fn().mockImplementation((v) => !v?.size)

      const result = findInheritedValue(
        'font_size',
        ['desktop', 'tablet', 'mobile_extra'],
        getValueFn,
        isEmptyFn
      )

      expect(result?.__inheritedFrom).toBe('tablet')
      expect(result?.__directParentDevice).toBe('mobile_extra')
    })

    it('returns parent value even if empty when all ancestors empty', () => {
      const emptyValue = { size: '', unit: '' }
      const getValueFn = vi.fn().mockReturnValue(emptyValue)
      const isEmptyFn = vi.fn().mockReturnValue(true)

      const result = findInheritedValue('font_size', ['desktop', 'tablet'], getValueFn, isEmptyFn)

      expect(result).not.toBeNull()
      expect(result?.__inheritedFrom).toBe('tablet')
    })

    it('returns null when parent value is null and all empty', () => {
      const getValueFn = vi.fn().mockReturnValue(null)
      const isEmptyFn = vi.fn().mockReturnValue(true)

      const result = findInheritedValue('font_size', ['desktop', 'tablet'], getValueFn, isEmptyFn)

      expect(result).toBeNull()
    })
  })

  describe('getWidescreenInheritedValue', () => {
    it('returns desktop value with correct metadata', () => {
      const desktopValue = { size: '24', unit: 'px' }
      const getValueFn = vi.fn().mockReturnValue(desktopValue)

      const result = getWidescreenInheritedValue('font_size', getValueFn)

      expect(result).toMatchObject({
        size: '24',
        unit: 'px',
        __inheritedFrom: 'desktop',
        __directParentDevice: 'desktop',
        __inheritPath: ['desktop']
      })
      expect(getValueFn).toHaveBeenCalledWith('font_size')
    })

    it('returns null when desktop has no value', () => {
      const getValueFn = vi.fn().mockReturnValue(null)

      const result = getWidescreenInheritedValue('font_size', getValueFn)

      expect(result).toBeNull()
    })
  })

  describe('resolveInheritedValue', () => {
    it('returns null for desktop control', () => {
      const getValueFn = vi.fn()
      const isEmptyFn = vi.fn()

      const result = resolveInheritedValue('font_size', DEVICE_ORDER, getValueFn, isEmptyFn)

      expect(result).toBeNull()
      expect(getValueFn).not.toHaveBeenCalled()
    })

    it('uses widescreen handler for widescreen suffix', () => {
      const desktopValue = { size: '24', unit: 'px' }
      const getValueFn = vi.fn().mockReturnValue(desktopValue)
      const isEmptyFn = vi.fn()

      const result = resolveInheritedValue(
        'font_size_widescreen',
        DEVICE_ORDER_WITH_WIDESCREEN,
        getValueFn,
        isEmptyFn
      )

      expect(result?.__inheritedFrom).toBe('desktop')
      expect(getValueFn).toHaveBeenCalledWith('font_size')
    })

    it('uses standard inheritance for tablet', () => {
      const desktopValue = { size: '20', unit: 'px' }
      const getValueFn = vi.fn().mockImplementation((name: string) => {
        if (name === 'font_size') {
          return desktopValue
        }
        return null
      })
      const isEmptyFn = vi.fn().mockReturnValue(true)

      resolveInheritedValue(
        'font_size_tablet',
        DEVICE_ORDER,
        getValueFn,
        isEmptyFn
      )

      // Should traverse up to desktop
      expect(getValueFn).toHaveBeenCalled()
    })

    it('resolves mobile inheritance through full hierarchy', () => {
      const tabletValue = { size: '18', unit: 'px' }
      const getValueFn = vi.fn().mockImplementation((name: string) => {
        if (name === 'font_size_tablet') {
          return tabletValue
        }
        return { size: '', unit: '' }
      })
      const isEmptyFn = vi.fn().mockImplementation((v) => !v?.size)

      const result = resolveInheritedValue(
        'font_size_mobile',
        DEVICE_ORDER,
        getValueFn,
        isEmptyFn
      )

      expect(result?.__inheritedFrom).toBe('tablet')
    })
  })
})
