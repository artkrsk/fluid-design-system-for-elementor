import type { Container } from '@arts/elementor-types'
import type { ISaveChangesDialog } from '../interfaces'

export class StateManager {
  /** Checks if a timestamp has exceeded the reorder detection window */
  static isRemovalExpired(timestamp: number, currentTime: number, windowMs: number): boolean {
    return currentTime - timestamp > windowMs
  }

  private removedItems = new Map<string, boolean>()
  private recentRemovals = new Map<string, number>()
  private changedDocuments = new Map<string | number, boolean>()
  private REORDER_DETECTION_WINDOW = 200
  private saveChangesDialog: ISaveChangesDialog | null = null

  markDocumentAsChanged(container: Container): void {
    if (!container?.document?.id) { return }
    this.changedDocuments.set(container.document.id, true)
  }

  clearDocumentChanges(documentId: string | number): void {
    this.changedDocuments.delete(documentId)
  }

  hasDocumentChanges(documentId: string | number): boolean {
    return this.changedDocuments.has(documentId)
  }

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

  getSaveChangesDialog(onConfirm: () => void, onCancel: () => void): ISaveChangesDialog | null {
    if (!this.saveChangesDialog) {
      this.saveChangesDialog = (window.elementorCommon?.dialogsManager.createWidget('confirm', {
        id: 'elementor-fluid-spacing-save-changes-dialog',
        headerMessage: window.ArtsFluidDSStrings?.saveChanges,
        message: window.ArtsFluidDSStrings?.saveChangesMessage,
        position: {
          my: 'center center',
          at: 'center center'
        },
        strings: {
          confirm: window.ArtsFluidDSStrings?.save,
          cancel: window.ArtsFluidDSStrings?.discard
        }
      }) as ISaveChangesDialog | undefined) ?? null
    }

    if (!this.saveChangesDialog) {
      return null
    }

    // Update the event handlers
    this.saveChangesDialog.onConfirm = onConfirm
    this.saveChangesDialog.onCancel = onCancel

    // Set escape key behavior
    this.saveChangesDialog.setSettings('hide', {
      onEscKeyPress: false
    })

    return this.saveChangesDialog
  }
}

// Create a singleton instance
const stateManager = new StateManager()

// Export the instance
export default stateManager
