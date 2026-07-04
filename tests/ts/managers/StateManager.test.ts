import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { StateManager } from '@/managers/StateManager'

describe('StateManager', () => {
  describe('isRemovalExpired (static)', () => {
    const WINDOW_MS = 200

    it('returns true when timestamp is older than window', () => {
      expect(StateManager.isRemovalExpired(1000, 1300, WINDOW_MS)).toBe(true)
    })

    it('returns false when timestamp is within window', () => {
      expect(StateManager.isRemovalExpired(1000, 1100, WINDOW_MS)).toBe(false)
    })

    it('returns false when exactly at window boundary', () => {
      // currentTime - timestamp = 200, which is NOT > 200
      expect(StateManager.isRemovalExpired(1000, 1200, WINDOW_MS)).toBe(false)
    })

    it('returns true when one millisecond past boundary', () => {
      expect(StateManager.isRemovalExpired(1000, 1201, WINDOW_MS)).toBe(true)
    })

    it('handles zero timestamp', () => {
      expect(StateManager.isRemovalExpired(0, 300, WINDOW_MS)).toBe(true)
    })

    it('handles zero window (always expired)', () => {
      expect(StateManager.isRemovalExpired(1000, 1001, 0)).toBe(true)
    })

    it('handles same timestamp and currentTime', () => {
      expect(StateManager.isRemovalExpired(1000, 1000, WINDOW_MS)).toBe(false)
    })

    it('handles large timestamp values', () => {
      const timestamp = 1704067200000 // Jan 1, 2024 00:00:00 UTC
      const currentTime = 1704067200500 // 500ms later
      expect(StateManager.isRemovalExpired(timestamp, currentTime, WINDOW_MS)).toBe(true)
    })
  })

  describe('instance methods', () => {
    let stateManager: StateManager

    beforeEach(() => {
      stateManager = new StateManager()
    })

    describe('removedItems', () => {
      it('hasRemovedItems returns false for non-existing id', () => {
        expect(stateManager.hasRemovedItems('test-id')).toBe(false)
      })

      it('markItemAsRemoved adds entry', () => {
        stateManager.markItemAsRemoved('test-id')
        expect(stateManager.hasRemovedItems('test-id')).toBe(true)
      })

      it('markItemAsRestored removes entry', () => {
        stateManager.markItemAsRemoved('test-id')
        stateManager.markItemAsRestored('test-id')
        expect(stateManager.hasRemovedItems('test-id')).toBe(false)
      })

      it('handles multiple items independently', () => {
        stateManager.markItemAsRemoved('id-1')
        stateManager.markItemAsRemoved('id-2')

        stateManager.markItemAsRestored('id-1')

        expect(stateManager.hasRemovedItems('id-1')).toBe(false)
        expect(stateManager.hasRemovedItems('id-2')).toBe(true)
      })

      it('markItemAsRestored on non-existing id does not throw', () => {
        expect(() => stateManager.markItemAsRestored('non-existing')).not.toThrow()
      })
    })

    describe('recentRemovals', () => {
      it('hasRecentRemoval returns false for non-existing id', () => {
        expect(stateManager.hasRecentRemoval('test-id')).toBe(false)
      })

      it('setRecentRemoval adds entry', () => {
        stateManager.setRecentRemoval('test-id')
        expect(stateManager.hasRecentRemoval('test-id')).toBe(true)
      })

      it('deleteRecentRemoval removes entry', () => {
        stateManager.setRecentRemoval('test-id')
        stateManager.deleteRecentRemoval('test-id')
        expect(stateManager.hasRecentRemoval('test-id')).toBe(false)
      })

      it('deleteRecentRemoval on non-existing id does not throw', () => {
        expect(() => stateManager.deleteRecentRemoval('non-existing')).not.toThrow()
      })

      it('handles multiple recent removals independently', () => {
        stateManager.setRecentRemoval('id-1')
        stateManager.setRecentRemoval('id-2')

        stateManager.deleteRecentRemoval('id-1')

        expect(stateManager.hasRecentRemoval('id-1')).toBe(false)
        expect(stateManager.hasRecentRemoval('id-2')).toBe(true)
      })
    })

    describe('cleanupRecentRemovals', () => {
      beforeEach(() => {
        vi.useFakeTimers()
      })

      afterEach(() => {
        vi.useRealTimers()
      })

      it('removes expired entries', () => {
        vi.setSystemTime(1000)
        stateManager.setRecentRemoval('old-id')

        // Advance past the REORDER_DETECTION_WINDOW (200ms)
        vi.setSystemTime(1300)
        stateManager.cleanupRecentRemovals()

        expect(stateManager.hasRecentRemoval('old-id')).toBe(false)
      })

      it('keeps entries within window', () => {
        vi.setSystemTime(1000)
        stateManager.setRecentRemoval('recent-id')

        // Advance within the window (100ms < 200ms)
        vi.setSystemTime(1100)
        stateManager.cleanupRecentRemovals()

        expect(stateManager.hasRecentRemoval('recent-id')).toBe(true)
      })

      it('handles mixed expired and fresh entries', () => {
        vi.setSystemTime(1000)
        stateManager.setRecentRemoval('old-id')

        vi.setSystemTime(1150)
        stateManager.setRecentRemoval('recent-id')

        // At 1300: old-id is 300ms old (expired), recent-id is 150ms old (fresh)
        vi.setSystemTime(1300)
        stateManager.cleanupRecentRemovals()

        expect(stateManager.hasRecentRemoval('old-id')).toBe(false)
        expect(stateManager.hasRecentRemoval('recent-id')).toBe(true)
      })

      it('handles empty recentRemovals map', () => {
        expect(() => stateManager.cleanupRecentRemovals()).not.toThrow()
      })
    })
  })
})
