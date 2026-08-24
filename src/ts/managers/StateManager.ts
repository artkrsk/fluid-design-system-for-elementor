export class StateManager {
  /** Checks if a timestamp has exceeded the reorder detection window */
  static isRemovalExpired(timestamp: number, currentTime: number, windowMs: number): boolean {
    return currentTime - timestamp > windowMs
  }

  private removedItems = new Map<string, boolean>()
  private recentRemovals = new Map<string, number>()
  /**
   * Reorder-vs-delete disambiguation window, in ms. HookOnRepeaterRemove timestamps every removed
   * id; HookOnRepeaterAdd treats a re-insert of that id inside this window as a reorder and
   * restores its CSS variable instead of leaving it unset. Nothing else distinguishes the two at
   * the hook level, so this value is load-bearing - don't retune it casually.
   */
  private REORDER_DETECTION_WINDOW = 200

  setRecentRemoval(id: string): void {
    this.recentRemovals.set(id, Date.now())
  }

  hasRecentRemoval(id: string): boolean {
    return this.recentRemovals.has(id)
  }

  deleteRecentRemoval(id: string): void {
    this.recentRemovals.delete(id)
  }

  cleanupRecentRemovals(): void {
    const now = Date.now()
    this.recentRemovals.forEach((timestamp, id) => {
      if (StateManager.isRemovalExpired(timestamp, now, this.REORDER_DETECTION_WINDOW)) {
        this.recentRemovals.delete(id)
      }
    })
  }

  hasRemovedItems(id: string): boolean {
    return this.removedItems.has(id)
  }

  markItemAsRemoved(id: string): void {
    this.removedItems.set(id, true)
  }

  markItemAsRestored(id: string): void {
    this.removedItems.delete(id)
  }
}

const stateManager = new StateManager()
export default stateManager
