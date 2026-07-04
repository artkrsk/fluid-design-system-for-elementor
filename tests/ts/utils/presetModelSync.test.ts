import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { insertPresetRow, updatePresetRow } from '@/utils/presetModelSync'

const ROW = {
  _id: 'preset-1',
  title: 'Preset One',
  min: { size: 20, unit: 'px' },
  max: { size: 40, unit: 'px' }
}

describe('presetModelSync', () => {
  let runSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    runSpy = vi.fn()
    ;(window as any).$e = { run: runSpy }
  })

  afterEach(() => {
    delete (window as any).$e
    delete (window as any).elementor
  })

  describe('insertPresetRow', () => {
    it('runs document/repeater/insert on the resolved kit container', () => {
      const container = { settings: { get: vi.fn() } }
      ;(window as any).elementor = {
        config: { kit_id: 82 },
        documents: { get: (id: number) => (id === 82 ? { container } : undefined) }
      }

      insertPresetRow('fluid_typography_presets', ROW)

      expect(runSpy).toHaveBeenCalledWith('document/repeater/insert', {
        container,
        name: 'fluid_typography_presets',
        model: ROW
      })
    })

    it('falls back to the current document when there is no kit_id', () => {
      const container = { settings: { get: vi.fn() } }
      ;(window as any).elementor = {
        config: {},
        documents: { get: vi.fn(), getCurrent: () => ({ container }) }
      }

      insertPresetRow('fluid_spacing_presets', ROW)

      expect(runSpy).toHaveBeenCalledWith(
        'document/repeater/insert',
        expect.objectContaining({ container, name: 'fluid_spacing_presets' })
      )
    })

    it('is a no-op when no container can be resolved', () => {
      ;(window as any).elementor = {
        config: {},
        documents: { get: () => undefined, getCurrent: () => undefined }
      }

      insertPresetRow('fluid_typography_presets', ROW)

      expect(runSpy).not.toHaveBeenCalled()
    })
  })

  describe('updatePresetRow', () => {
    it('sets the changed fields on the matching row model', () => {
      const model = { set: vi.fn() }
      const collection = { findWhere: vi.fn().mockReturnValue(model) }
      const container = { settings: { get: vi.fn().mockReturnValue(collection) } }
      ;(window as any).elementor = {
        config: { kit_id: 82 },
        documents: { get: () => ({ container }) }
      }

      updatePresetRow('fluid_typography_presets', 'preset-1', { title: 'Renamed' })

      expect(collection.findWhere).toHaveBeenCalledWith({ _id: 'preset-1' })
      expect(model.set).toHaveBeenCalledWith({ title: 'Renamed' })
    })

    it('is a no-op when the row is not found', () => {
      const collection = { findWhere: vi.fn().mockReturnValue(undefined) }
      const container = { settings: { get: vi.fn().mockReturnValue(collection) } }
      ;(window as any).elementor = {
        config: { kit_id: 82 },
        documents: { get: () => ({ container }) }
      }

      expect(() =>
        updatePresetRow('fluid_typography_presets', 'missing', { title: 'x' })
      ).not.toThrow()
    })
  })
})
