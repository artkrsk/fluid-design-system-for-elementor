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

  /** @param {import('@arts/elementor-types').Container} container */
  markDocumentAsChanged(container) {
    if (!container?.document?.id) return
    this.changedDocuments.set(container.document.id, true)
  }

  /** @param {string | number} documentId */
  clearDocumentChanges(documentId) {
    this.changedDocuments.delete(documentId)
  }

  /** @param {string | number} documentId */
  hasDocumentChanges(documentId) {
    return this.changedDocuments.has(documentId)
  }

  /** @param {string} id */
  setRecentRemoval(id) {
    this.recentRemovals.set(id, Date.now())
  }

  /** @param {string} id */
  hasRecentRemoval(id) {
    return this.recentRemovals.has(id)
  }

  /** @param {string} id */
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

  /** @param {string} id */
  hasRemovedItems(id) {
    return this.removedItems.has(id)
  }

  /** @param {string} id */
  markItemAsRemoved(id) {
    this.removedItems.set(id, true)
  }

  /** @param {string} id */
  markItemAsRestored(id) {
    this.removedItems.delete(id)
  }

  /**
   * @param {() => void} onConfirm
   * @param {() => void} onCancel
   */
  getSaveChangesDialog(onConfirm, onCancel) {
    if (!this.saveChangesDialog) {
      this.saveChangesDialog = window.elementorCommon?.dialogsManager.createWidget('confirm', {
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
