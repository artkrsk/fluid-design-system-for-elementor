import { PREVIEW } from '../constants'

type TAnchor = 'min' | 'max'

/**
 * Resizes the Elementor preview iframe to a fluid screen anchor width without
 * touching device mode. Sets a CSS var + body class consumed by a compiled rule
 * (see styles/_preview-switcher.sass), so no channel event fires and no control
 * re-renders. Tracks one active "owner" switcher so the highlight reflects which
 * control triggered the resize.
 */
export class PreviewSizeManager {
  private switchers = new Set<HTMLElement>()
  private activeAnchor: TAnchor | null = null
  private activeOwner: HTMLElement | null = null
  private deviceModeBound = false
  private ownerVisibilityObserver: IntersectionObserver | null = null

  /** Registers a switcher element for shared active-state and cleanup */
  register(switcherEl: HTMLElement): void {
    this.switchers.add(switcherEl)
    this.bindDeviceModeReset()
    this.refreshSwitchers()
  }

  /** Removes a switcher; restores the preview if it owned the active resize */
  unregister(switcherEl: HTMLElement): void {
    this.switchers.delete(switcherEl)
    if (this.activeOwner === switcherEl) {
      this.reset()
    }
  }

  /** Resizes the preview to an anchor width; re-clicking the active anchor resets */
  applyAnchor(anchor: TAnchor, widthPx: number, owner: HTMLElement): void {
    if (this.activeAnchor === anchor && this.activeOwner === owner) {
      this.reset()
      return
    }

    document.body.style.setProperty(PREVIEW.VAR_WIDTH, `${widthPx}px`)
    document.body.classList.add(PREVIEW.ACTIVE_CLASS)

    this.activeAnchor = anchor
    this.activeOwner = owner
    this.observeOwnerVisibility(owner)
    this.refreshSwitchers()
  }

  /** Restores the preview to its natural width */
  reset(): void {
    document.body.classList.remove(PREVIEW.ACTIVE_CLASS)
    document.body.style.removeProperty(PREVIEW.VAR_WIDTH)

    this.activeAnchor = null
    this.activeOwner = null
    this.disconnectOwnerVisibility()
    this.refreshSwitchers()
  }

  /** Restores the preview only if the given switcher owns the active resize */
  resetIfOwner(switcherEl: HTMLElement): void {
    if (this.activeOwner === switcherEl) {
      this.reset()
    }
  }

  /** Syncs every registered switcher's active-button state */
  private refreshSwitchers(): void {
    for (const switcher of this.switchers) {
      const buttons = switcher.querySelectorAll<HTMLElement>('[data-anchor]')
      for (const button of buttons) {
        const isActive =
          button.getAttribute('data-anchor') === this.activeAnchor && this.activeOwner === switcher
        button.classList.toggle('is-active', isActive)
      }
    }
  }

  /**
   * Resets when the owning switcher becomes hidden (popover closed, section
   * collapsed) so the preview is never left resized without a visible Reset.
   * `offsetParent === null` distinguishes a hidden owner from one merely
   * scrolled out of the panel viewport.
   */
  private observeOwnerVisibility(owner: HTMLElement): void {
    this.disconnectOwnerVisibility()

    if (typeof IntersectionObserver === 'undefined') {
      return
    }

    this.ownerVisibilityObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting && (entry.target as HTMLElement).offsetParent === null) {
          this.reset()
          return
        }
      }
    })
    this.ownerVisibilityObserver.observe(owner)
  }

  private disconnectOwnerVisibility(): void {
    this.ownerVisibilityObserver?.disconnect()
    this.ownerVisibilityObserver = null
  }

  /** Drops our override when Elementor enters a real device mode */
  private bindDeviceModeReset(): void {
    if (this.deviceModeBound) {
      return
    }

    const channel = window.elementor?.channels?.deviceMode
    if (!channel) {
      return
    }

    channel.on('change', () => this.reset())
    this.deviceModeBound = true
  }
}

const previewSizeManager = new PreviewSizeManager()

export default previewSizeManager
