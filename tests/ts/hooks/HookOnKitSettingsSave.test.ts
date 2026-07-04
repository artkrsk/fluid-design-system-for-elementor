import { describe, it, expect, vi, beforeEach } from 'vitest'

// The hook resolves `window.$e.modules.hookUI.After` as its base class at import
// time, so a constructable base must exist before the module is evaluated.
vi.hoisted(() => {
  class HookBase {}
  ;(window as any).$e = {
    modules: { hookUI: { After: HookBase, Before: HookBase } }
  }
})

import { HookOnKitSettingsSave } from '@/hooks/HookOnKitSettingsSave'
import dataManager from '@/managers/DataManager'
import { COMMANDS, HOOK_IDS } from '@/constants'

describe('HookOnKitSettingsSave', () => {
  let hook: HookOnKitSettingsSave

  beforeEach(() => {
    hook = new HookOnKitSettingsSave()
  })

  it('binds to the internal document/save/save command', () => {
    expect(hook.getCommand()).toBe(COMMANDS.DOCUMENT.SAVE)
    expect(hook.getCommand()).toBe('document/save/save')
  })

  it('registers under the kit-save hook id', () => {
    expect(hook.getId()).toBe(HOOK_IDS.KIT.SAVE)
  })

  describe('getConditions', () => {
    it('runs on a real kit publish save', () => {
      const args = { document: { config: { type: 'kit' } }, status: 'publish' }
      expect(hook.getConditions(args as any)).toBe(true)
    })

    it('skips kit autosaves', () => {
      const args = { document: { config: { type: 'kit' } }, status: 'autosave' }
      expect(hook.getConditions(args as any)).toBe(false)
    })

    it('skips saves of non-kit documents', () => {
      const args = { document: { config: { type: 'wp-page' } }, status: 'publish' }
      expect(hook.getConditions(args as any)).toBe(false)
    })

    it('skips when status is absent', () => {
      const args = { document: { config: { type: 'kit' } } }
      expect(hook.getConditions(args as any)).toBe(false)
    })

    it('does not throw when the document is missing', () => {
      expect(hook.getConditions({ status: 'publish' } as any)).toBe(false)
    })
  })

  describe('apply', () => {
    it('invalidates the preset cache', () => {
      const spy = vi.spyOn(dataManager, 'invalidate')
      hook.apply()
      expect(spy).toHaveBeenCalledOnce()
      spy.mockRestore()
    })
  })
})
