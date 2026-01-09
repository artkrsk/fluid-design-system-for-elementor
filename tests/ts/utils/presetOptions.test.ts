import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  createPresetOption,
  createCustomPresetOption,
  handleInheritOption,
  createSimpleOption,
  createCustomValueOption
} from '@/utils/presetOptions'
import type { IFluidPreset, ICustomPreset, IInheritanceData } from '@/interfaces'
import { CUSTOM_FLUID_VALUE } from '@/constants'

// Import the mock to control its behavior
import { getInheritedPresetSync } from '@/utils/presetLookup'

// Mock getInheritedPresetSync to control its behavior in tests
vi.mock('@/utils/presetLookup', () => ({
  getInheritedPresetSync: vi.fn().mockReturnValue(null),
  isFluidPreset: (preset: any) => 'min_size' in preset && 'max_size' in preset
}))

describe('presetOptions utilities', () => {
  const originalArtsFluidDSStrings = (window as any).ArtsFluidDSStrings

  beforeEach(() => {
    ;(window as any).ArtsFluidDSStrings = {
      customValue: 'Custom value...',
      inherit: 'Inherit'
    }
  })

  afterEach(() => {
    ;(window as any).ArtsFluidDSStrings = originalArtsFluidDSStrings
  })

  describe('createPresetOption', () => {
    const basePreset: IFluidPreset = {
      id: 'preset_1',
      value: 'var(--preset-1)',
      title: 'Heading 1',
      min_size: '24',
      min_unit: 'px',
      max_size: '48',
      max_unit: 'px'
    }

    it('creates option element with correct value', () => {
      const option = createPresetOption(basePreset, '')

      expect(option.tagName).toBe('OPTION')
      expect(option.value).toBe('var(--preset-1)')
    })

    it('sets data attributes from preset', () => {
      const option = createPresetOption(basePreset, '')

      expect(option.getAttribute('data-id')).toBe('preset_1')
      expect(option.getAttribute('data-title')).toBe('Heading 1')
      expect(option.getAttribute('data-min-size')).toBe('24')
      expect(option.getAttribute('data-min-unit')).toBe('px')
      expect(option.getAttribute('data-max-size')).toBe('48')
      expect(option.getAttribute('data-max-unit')).toBe('px')
    })

    it('sets selected attribute when currentValue matches', () => {
      const option = createPresetOption(basePreset, 'var(--preset-1)')

      expect(option.hasAttribute('selected')).toBe(true)
    })

    it('does not set selected when currentValue differs', () => {
      const option = createPresetOption(basePreset, 'other-value')

      expect(option.hasAttribute('selected')).toBe(false)
    })

    it('formats textContent with size range and title', () => {
      const option = createPresetOption(basePreset, '')

      expect(option.textContent).toBe('24px ~ 48px Heading 1')
    })

    it('handles preset with screen width attributes', () => {
      const presetWithScreenWidth: IFluidPreset = {
        ...basePreset,
        min_screen_width_size: '320',
        max_screen_width_size: '1920',
        min_screen_width_unit: 'px',
        max_screen_width_unit: 'px'
      }

      const option = createPresetOption(presetWithScreenWidth, '')

      expect(option.getAttribute('data-min-screen-width-size')).toBe('320')
      expect(option.getAttribute('data-max-screen-width-size')).toBe('1920')
      expect(option.getAttribute('data-min-screen-width-unit')).toBe('px')
      expect(option.getAttribute('data-max-screen-width-unit')).toBe('px')
    })

    it('sets editable attribute to false by default', () => {
      const option = createPresetOption(basePreset, '')

      expect(option.getAttribute('data-editable')).toBe('false')
    })

    it('sets editable attribute to true when preset is editable', () => {
      const editablePreset: IFluidPreset = { ...basePreset, editable: true }
      const option = createPresetOption(editablePreset, '')

      expect(option.getAttribute('data-editable')).toBe('true')
    })

    it('handles mixed units in size range', () => {
      const mixedPreset: IFluidPreset = {
        ...basePreset,
        min_unit: 'rem',
        max_unit: 'px'
      }

      const option = createPresetOption(mixedPreset, '')

      expect(option.textContent).toBe('24rem ~ 48px Heading 1')
    })

    it('handles equal min/max values', () => {
      const equalPreset: IFluidPreset = {
        ...basePreset,
        min_size: '24',
        max_size: '24'
      }

      const option = createPresetOption(equalPreset, '')

      expect(option.textContent).toBe('24px Heading 1')
    })
  })

  describe('createCustomPresetOption', () => {
    const baseCustomPreset: ICustomPreset = {
      id: 'custom_1',
      value: 'custom-value',
      title: 'Custom Option'
    }

    it('creates option element with correct value', () => {
      const option = createCustomPresetOption(baseCustomPreset, '')

      expect(option.tagName).toBe('OPTION')
      expect(option.value).toBe('custom-value')
    })

    it('sets data-id and data-title attributes', () => {
      const option = createCustomPresetOption(baseCustomPreset, '')

      expect(option.getAttribute('data-id')).toBe('custom_1')
      expect(option.getAttribute('data-title')).toBe('Custom Option')
    })

    it('sets selected when currentValue matches', () => {
      const option = createCustomPresetOption(baseCustomPreset, 'custom-value')

      expect(option.hasAttribute('selected')).toBe(true)
    })

    it('uses title as textContent when no display_value', () => {
      const option = createCustomPresetOption(baseCustomPreset, '')

      expect(option.textContent).toBe('Custom Option')
    })

    it('handles display_value as true (shows value)', () => {
      const presetWithDisplayTrue: ICustomPreset = {
        ...baseCustomPreset,
        display_value: true
      }

      const option = createCustomPresetOption(presetWithDisplayTrue, '')

      expect(option.getAttribute('data-display-value')).toBe('custom-value')
      expect(option.textContent).toBe('custom-value Custom Option')
    })

    it('handles display_value as string', () => {
      const presetWithDisplayString: ICustomPreset = {
        ...baseCustomPreset,
        display_value: 'Display Text'
      }

      const option = createCustomPresetOption(presetWithDisplayString, '')

      expect(option.getAttribute('data-display-value')).toBe('Display Text')
      expect(option.textContent).toBe('Display Text Custom Option')
    })

    it('handles display_value as false (uses title only)', () => {
      const presetWithDisplayFalse: ICustomPreset = {
        ...baseCustomPreset,
        display_value: false
      }

      const option = createCustomPresetOption(presetWithDisplayFalse, '')

      expect(option.hasAttribute('data-display-value')).toBe(false)
      expect(option.textContent).toBe('Custom Option')
    })
  })

  describe('handleInheritOption', () => {
    const emptyInheritanceData: IInheritanceData = {
      inheritedSize: null,
      inheritedUnit: null,
      sourceUnit: null,
      inheritedFrom: null,
      inheritedDevice: null,
      inheritedVia: null
    }

    it('adds option-inherit class', () => {
      const option = document.createElement('option')

      handleInheritOption(option, 'some-value', emptyInheritanceData, 'Inherit')

      expect(option.classList.contains('option-inherit')).toBe(true)
    })

    it('adds e-select-placeholder class when currentValue is empty', () => {
      const option = document.createElement('option')

      handleInheritOption(option, '', emptyInheritanceData, 'Inherit')

      expect(option.classList.contains('e-select-placeholder')).toBe(true)
    })

    it('does not add placeholder class when currentValue is not empty', () => {
      const option = document.createElement('option')

      handleInheritOption(option, 'some-value', emptyInheritanceData, 'Inherit')

      expect(option.classList.contains('e-select-placeholder')).toBe(false)
    })

    it('sets textContent to name when no inherited data', () => {
      const option = document.createElement('option')

      handleInheritOption(option, '', emptyInheritanceData, 'Default Value')

      expect(option.textContent).toBe('Default Value')
    })

    it('handles standard inheritance (non-fluid, non-mixed)', () => {
      const option = document.createElement('option')
      const inheritanceData: IInheritanceData = {
        inheritedSize: '16',
        inheritedUnit: 'px',
        sourceUnit: null,
        inheritedFrom: 'desktop',
        inheritedDevice: 'Desktop',
        inheritedVia: null
      }

      handleInheritOption(option, '', inheritanceData, 'Inherit')

      expect(option.getAttribute('data-inherited-value')).toBe('true')
      expect(option.getAttribute('data-title')).toBe('Inherit')
      expect(option.textContent).toBe('Inherit')
    })

    it('handles standard inheritance with null sourceUnit', () => {
      const option = document.createElement('option')
      const inheritanceData: IInheritanceData = {
        inheritedSize: '32',
        inheritedUnit: 'em',
        sourceUnit: null,
        inheritedFrom: 'tablet',
        inheritedDevice: null,
        inheritedVia: null
      }

      handleInheritOption(option, '', inheritanceData, 'Standard Name')

      expect(option.getAttribute('data-inherited-value')).toBe('true')
      // When sourceUnit is null, valueText uses name
      expect(option.getAttribute('data-title')).toBe('Standard Name')
      expect(option.textContent).toBe('Standard Name')
    })

    it('handles mixed units inheritance', () => {
      const option = document.createElement('option')
      const inheritanceData: IInheritanceData = {
        inheritedSize: '16',
        inheritedUnit: 'px',
        sourceUnit: 'rem',
        inheritedFrom: 'desktop',
        inheritedDevice: 'Desktop',
        inheritedVia: null
      }

      handleInheritOption(option, '', inheritanceData, 'Inherit')

      expect(option.getAttribute('data-mixed-units')).toBe('true')
      expect(option.getAttribute('data-inherited-value')).toBe('true')
      expect(option.getAttribute('data-value-display')).toBe('16rem')
    })

    it('handles custom unit in mixed inheritance', () => {
      const option = document.createElement('option')
      const inheritanceData: IInheritanceData = {
        inheritedSize: 'var(--custom)',
        inheritedUnit: 'custom',
        sourceUnit: 'custom',
        inheritedFrom: 'desktop',
        inheritedDevice: null,
        inheritedVia: null
      }

      handleInheritOption(option, '', inheritanceData, 'Inherit')

      expect(option.getAttribute('data-custom-value')).toBe('true')
      expect(option.getAttribute('data-value-display')).toBe('var(--custom)')
    })

    it('handles mixed inheritance without inheritedFrom/Via/Device', () => {
      const option = document.createElement('option')
      const inheritanceData: IInheritanceData = {
        inheritedSize: '16',
        inheritedUnit: 'px',
        sourceUnit: 'rem',
        inheritedFrom: null,
        inheritedDevice: null,
        inheritedVia: null
      }

      handleInheritOption(option, '', inheritanceData, 'Inherit')

      expect(option.hasAttribute('data-inherited-from')).toBe(false)
      expect(option.hasAttribute('data-inherited-device')).toBe(false)
      expect(option.hasAttribute('data-inherited-via')).toBe(false)
    })

    it('handles mixed inheritance with empty inheritedSize', () => {
      const option = document.createElement('option')
      const inheritanceData: IInheritanceData = {
        inheritedSize: '',
        inheritedUnit: 'px',
        sourceUnit: 'rem',
        inheritedFrom: 'desktop',
        inheritedDevice: null,
        inheritedVia: null
      }

      handleInheritOption(option, '', inheritanceData, 'Inherit')

      expect(option.getAttribute('data-title')).toBe('')
      expect(option.hasAttribute('data-value-display')).toBe(false)
      expect(option.textContent).toBe('')
    })

    it('handles mixed inheritance without name', () => {
      const option = document.createElement('option')
      const inheritanceData: IInheritanceData = {
        inheritedSize: '20',
        inheritedUnit: 'px',
        sourceUnit: 'em',
        inheritedFrom: 'desktop',
        inheritedDevice: null,
        inheritedVia: null
      }

      // Pass undefined-like empty name
      handleInheritOption(option, '', inheritanceData, '')

      expect(option.getAttribute('data-inherited-title')).toBe('')
    })

    it('sets inheritance tracking attributes', () => {
      const option = document.createElement('option')
      const inheritanceData: IInheritanceData = {
        inheritedSize: '20',
        inheritedUnit: 'px',
        sourceUnit: 'em',
        inheritedFrom: 'tablet',
        inheritedDevice: 'Tablet',
        inheritedVia: 'laptop'
      }

      handleInheritOption(option, '', inheritanceData, 'Inherit')

      expect(option.getAttribute('data-inherited-from')).toBe('tablet')
      expect(option.getAttribute('data-inherited-device')).toBe('Tablet')
      expect(option.getAttribute('data-inherited-via')).toBe('laptop')
    })

    describe('fluid inheritance', () => {
      it('handles complex preset inheritance', () => {
        const mockComplexPreset = {
          isComplex: true as const,
          id: 'preset_1',
          value: 'var(--preset-1)',
          title: 'Heading 1',
          min_size: '24',
          min_unit: 'px',
          max_size: '48',
          max_unit: 'px'
        }
        vi.mocked(getInheritedPresetSync).mockReturnValueOnce(mockComplexPreset)

        const option = document.createElement('option')
        const inheritanceData: IInheritanceData = {
          inheritedSize: 'var(--preset-1)',
          inheritedUnit: 'fluid',
          sourceUnit: null,
          inheritedFrom: 'desktop',
          inheritedDevice: 'Desktop',
          inheritedVia: null
        }

        handleInheritOption(option, '', inheritanceData, 'Inherit')

        expect(option.getAttribute('data-inherited-preset')).toBe('true')
        expect(option.getAttribute('data-value-display')).toBe('var(--preset-1)')
        expect(option.getAttribute('data-min-size')).toBe('24')
        expect(option.getAttribute('data-max-size')).toBe('48')
        expect(option.textContent).toContain('24px')
        expect(option.textContent).toContain('48px')
      })

      it('handles simple preset inheritance', () => {
        const mockSimplePreset = {
          isComplex: false as const,
          id: 'simple_1',
          name: 'Simple Preset'
        }
        vi.mocked(getInheritedPresetSync).mockReturnValueOnce(mockSimplePreset)

        const option = document.createElement('option')
        const inheritanceData: IInheritanceData = {
          inheritedSize: 'simple_1',
          inheritedUnit: 'fluid',
          sourceUnit: null,
          inheritedFrom: 'desktop',
          inheritedDevice: null,
          inheritedVia: null
        }

        handleInheritOption(option, '', inheritanceData, 'Inherit')

        expect(option.getAttribute('data-inherited-value')).toBe('true')
        expect(option.getAttribute('data-value-display')).toBe('simple_1')
        expect(option.textContent).toBe('Simple Preset')
      })

      it('handles clamp formula when no preset found', () => {
        vi.mocked(getInheritedPresetSync).mockReturnValueOnce(null)

        const option = document.createElement('option')
        const clampFormula = 'clamp(min(16px, 24px), calc((16px) + (24px - 16px) * (100vw - var(--arts-fluid-min-screen)) / calc(var(--arts-fluid-max-screen) - var(--arts-fluid-min-screen))), max(16px, 24px))'
        const inheritanceData: IInheritanceData = {
          inheritedSize: clampFormula,
          inheritedUnit: 'fluid',
          sourceUnit: null,
          inheritedFrom: 'desktop',
          inheritedDevice: null,
          inheritedVia: null
        }

        handleInheritOption(option, '', inheritanceData, 'Inherit')

        expect(option.getAttribute('data-inherited-value')).toBe('true')
        expect(option.getAttribute('data-min-size')).toBe('16')
        expect(option.getAttribute('data-max-size')).toBe('24')
      })

      it('handles non-clamp value when no preset found', () => {
        vi.mocked(getInheritedPresetSync).mockReturnValueOnce(null)

        const option = document.createElement('option')
        const inheritanceData: IInheritanceData = {
          inheritedSize: 'unknown-value',
          inheritedUnit: 'fluid',
          sourceUnit: null,
          inheritedFrom: 'desktop',
          inheritedDevice: null,
          inheritedVia: null
        }

        handleInheritOption(option, '', inheritanceData, 'Fallback Name')

        expect(option.getAttribute('data-inherited-value')).toBe('true')
        expect(option.getAttribute('data-title')).toBe('unknown-value')
        expect(option.getAttribute('data-value-display')).toBe('unknown-value')
        expect(option.textContent).toBe('unknown-value')
      })

      it('sets inherited-title attribute from name', () => {
        vi.mocked(getInheritedPresetSync).mockReturnValueOnce(null)

        const option = document.createElement('option')
        const inheritanceData: IInheritanceData = {
          inheritedSize: 'some-value',
          inheritedUnit: 'fluid',
          sourceUnit: null,
          inheritedFrom: 'tablet',
          inheritedDevice: 'Tablet',
          inheritedVia: 'laptop'
        }

        handleInheritOption(option, '', inheritanceData, 'Custom Name')

        expect(option.getAttribute('data-inherited-title')).toBe('Custom Name')
        expect(option.getAttribute('data-inherited-from')).toBe('tablet')
        expect(option.getAttribute('data-inherited-via')).toBe('laptop')
        expect(option.getAttribute('data-inherited-device')).toBe('Tablet')
      })

      it('does not enter fluid path when inheritedSize is null', () => {
        // When inheritedSize is null, the main if block is skipped
        // and only the else branch (optionEl.textContent = name) executes
        const option = document.createElement('option')
        const inheritanceData: IInheritanceData = {
          inheritedSize: null,
          inheritedUnit: 'fluid',
          sourceUnit: null,
          inheritedFrom: 'desktop',
          inheritedDevice: null,
          inheritedVia: null
        }

        handleInheritOption(option, '', inheritanceData, 'Fallback Text')

        // No data-value-display is set because fluid inheritance path isn't taken
        expect(option.hasAttribute('data-value-display')).toBe(false)
        expect(option.textContent).toBe('Fallback Text')
      })

      it('uses name as fallback when inheritedSize is empty', () => {
        vi.mocked(getInheritedPresetSync).mockReturnValueOnce(null)

        const option = document.createElement('option')
        const inheritanceData: IInheritanceData = {
          inheritedSize: '',
          inheritedUnit: 'fluid',
          sourceUnit: null,
          inheritedFrom: 'desktop',
          inheritedDevice: null,
          inheritedVia: null
        }

        handleInheritOption(option, '', inheritanceData, 'Fallback Name')

        // Empty inheritedSize doesn't trigger the else-if branch
        expect(option.getAttribute('data-inherited-title')).toBe('Fallback Name')
      })

      it('handles fluid inheritance without inheritedFrom/Via/Device', () => {
        vi.mocked(getInheritedPresetSync).mockReturnValueOnce(null)

        const option = document.createElement('option')
        const inheritanceData: IInheritanceData = {
          inheritedSize: 'some-value',
          inheritedUnit: 'fluid',
          sourceUnit: null,
          inheritedFrom: null,
          inheritedDevice: null,
          inheritedVia: null
        }

        handleInheritOption(option, '', inheritanceData, 'Name')

        expect(option.hasAttribute('data-inherited-from')).toBe(false)
        expect(option.hasAttribute('data-inherited-via')).toBe(false)
        expect(option.hasAttribute('data-inherited-device')).toBe(false)
      })

      it('handles complex preset without screen width (optional attributes)', () => {
        const mockComplexPreset = {
          isComplex: true as const,
          id: 'preset_basic',
          value: 'var(--preset-basic)',
          title: 'Basic Preset',
          min_size: '16',
          min_unit: 'px',
          max_size: '32',
          max_unit: 'px'
          // No screen width attributes - they're optional
        }
        vi.mocked(getInheritedPresetSync).mockReturnValueOnce(mockComplexPreset)

        const option = document.createElement('option')
        const inheritanceData: IInheritanceData = {
          inheritedSize: 'var(--preset-basic)',
          inheritedUnit: 'fluid',
          sourceUnit: null,
          inheritedFrom: 'desktop',
          inheritedDevice: null,
          inheritedVia: null
        }

        handleInheritOption(option, '', inheritanceData, 'Inherit')

        // Screen width attributes are not set when undefined in preset
        expect(option.hasAttribute('data-min-screen-width-size')).toBe(false)
        expect(option.hasAttribute('data-max-screen-width-size')).toBe(false)
        // But basic preset data is set
        expect(option.getAttribute('data-min-size')).toBe('16')
        expect(option.getAttribute('data-max-size')).toBe('32')
      })
    })
  })

  describe('createSimpleOption', () => {
    const emptyInheritanceData: IInheritanceData = {
      inheritedSize: null,
      inheritedUnit: null,
      sourceUnit: null,
      inheritedFrom: null,
      inheritedDevice: null,
      inheritedVia: null
    }

    it('creates option with correct value', () => {
      const option = createSimpleOption('test-value', 'Test Name', '', emptyInheritanceData)

      expect(option.value).toBe('test-value')
    })

    it('sets selected when currentValue matches', () => {
      const option = createSimpleOption('test-value', 'Test Name', 'test-value', emptyInheritanceData)

      expect(option.hasAttribute('selected')).toBe(true)
    })

    it('sets textContent for non-empty value', () => {
      const option = createSimpleOption('test-value', 'Test Name', '', emptyInheritanceData)

      expect(option.textContent).toBe('Test Name')
    })

    it('handles inherit option (empty value)', () => {
      const option = createSimpleOption('', 'Inherit', '', emptyInheritanceData)

      expect(option.value).toBe('')
      expect(option.classList.contains('option-inherit')).toBe(true)
    })

    it('applies inheritance data for empty value option', () => {
      const inheritanceData: IInheritanceData = {
        inheritedSize: '24',
        inheritedUnit: 'px',
        sourceUnit: null,
        inheritedFrom: 'desktop',
        inheritedDevice: 'Desktop',
        inheritedVia: null
      }

      const option = createSimpleOption('', 'Inherit', '', inheritanceData)

      expect(option.getAttribute('data-inherited-value')).toBe('true')
    })
  })

  describe('createCustomValueOption', () => {
    it('creates option with CUSTOM_FLUID_VALUE', () => {
      const option = createCustomValueOption('')

      expect(option.value).toBe(CUSTOM_FLUID_VALUE)
    })

    it('sets data-is-custom-fluid attribute', () => {
      const option = createCustomValueOption('')

      expect(option.getAttribute('data-is-custom-fluid')).toBe('true')
    })

    it('uses ArtsFluidDSStrings.customValue as textContent', () => {
      const option = createCustomValueOption('')

      expect(option.textContent).toBe('Custom value...')
    })

    it('sets selected when currentValue is CUSTOM_FLUID_VALUE', () => {
      const option = createCustomValueOption(CUSTOM_FLUID_VALUE)

      expect(option.hasAttribute('selected')).toBe(true)
    })

    it('sets selected when currentValue starts with clamp(', () => {
      const option = createCustomValueOption('clamp(16px, calc(...), 24px)')

      expect(option.hasAttribute('selected')).toBe(true)
    })

    it('does not set selected for other values', () => {
      const option = createCustomValueOption('some-preset-value')

      expect(option.hasAttribute('selected')).toBe(false)
    })

    it('does not set selected for empty currentValue', () => {
      const option = createCustomValueOption('')

      expect(option.hasAttribute('selected')).toBe(false)
    })

    it('handles missing ArtsFluidDSStrings gracefully', () => {
      ;(window as any).ArtsFluidDSStrings = undefined

      const option = createCustomValueOption('')

      expect(option.textContent).toBe('')
    })
  })
})
