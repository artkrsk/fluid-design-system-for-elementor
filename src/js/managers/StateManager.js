export class StateManager {
  /**
   * Checks if a timestamp has exceeded the reorder detection window
   * @param {number} timestamp - Removal timestamp
   * @param {number} currentTime - Current time
   * @param {number} windowMs - Detection window in milliseconds
   * @returns {boolean}
   */
  static isRemovalExpired(timestamp, currentTime, windowMs) {
    return currentTime - timestamp > windowMs
  }

  constructor() {
    // Track removed items for undo operations
    this.removedItems = new Map()

    // Track recent removals to detect reordering operations
    this.recentRemovals = new Map()

    // Track document changes and states
    this.changedDocuments = new Map()

    // Time window for considering an add after remove as a reorder (milliseconds)
    this.REORDER_DETECTION_WINDOW = 200

    // Save changes dialog
    this.saveChangesDialog = null
  }

  markDocumentAsChanged(container) {
    if (!container?.document?.id) return
    this.changedDocuments.set(container.document.id, true)
  }

  clearDocumentChanges(documentId) {
    this.changedDocuments.delete(documentId)
  }

  hasDocumentChanges(documentId) {
    return this.changedDocuments.has(documentId)
  }

  setRecentRemoval(id) {
    this.recentRemovals.set(id, Date.now())
  }

  hasRecentRemoval(id) {
    return this.recentRemovals.has(id)
  }

  deleteRecentRemoval(id) {
    this.recentRemovals.delete(id)
  }

  cleanupRecentRemovals() {
    const now = Date.now()
    this.recentRemovals.forEach((timestamp, id) => {
      if (StateManager.isRemovalExpired(timestamp, now, this.REORDER_DETECTION_WINDOW)) {
        this.recentRemovals.delete(id)
      }
    })
  }

  hasRemovedItems(id) {
    return this.removedItems.has(id)
  }

  markItemAsRemoved(id) {
    this.removedItems.set(id, true)
  }

  markItemAsRestored(id) {
    this.removedItems.delete(id)
  }

  getSaveChangesDialog(onConfirm, onCancel) {
    if (!this.saveChangesDialog) {
      this.saveChangesDialog = window.elementorCommon.dialogsManager.createWidget('confirm', {
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
      })
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
