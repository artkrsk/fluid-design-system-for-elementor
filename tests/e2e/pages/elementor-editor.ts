import { Page, FrameLocator, Locator, expect } from '@playwright/test'

export class ElementorEditorPage {
  private previewFrame: FrameLocator
  readonly page: Page

  constructor(page: Page) {
    this.page = page
    this.previewFrame = page.frameLocator('#elementor-preview-iframe')
  }

  /** Wait for Elementor editor to fully load */
  async waitForEditor() {
    // Wait for editor to be active
    await this.page.waitForSelector('.elementor-editor-active', { timeout: 60000 })
    // Wait for panel to load
    await this.page.waitForSelector('#elementor-panel', { timeout: 30000 })
    // Wait for preview frame
    await this.previewFrame.locator('body').waitFor({ timeout: 30000 })
    // Wait for attach-preview to finish: document-switching commands (e.g.
    // panel/global/open) dereference documents.getCurrent().$element via
    // exitPreviewMode(), and Elementor populates $element asynchronously
    // after the panel and preview DOM above already exist
    await this.page.waitForFunction(
      () => {
        const doc = (
          window as unknown as {
            elementor?: {
              documents?: { getCurrent?: () => { $element?: { length: number } } }
            }
          }
        ).elementor?.documents?.getCurrent?.()
        return Boolean(doc && doc.$element && doc.$element.length)
      },
      undefined,
      { timeout: 30000 }
    )
  }

  /** Open Elementor editor for a specific post */
  async openPost(postId: number) {
    await this.page.goto(`/wp-admin/post.php?post=${postId}&action=elementor`)
    await this.waitForEditor()
  }

  /** Get the preview iframe frame locator */
  getPreviewFrame(): FrameLocator {
    return this.previewFrame
  }

  /** Add a widget from the panel */
  async addWidget(widgetName: string) {
    // Open add element panel
    const addButton = this.page.locator('#elementor-panel-header-add-button')
    await addButton.click()

    // Search for widget
    const searchInput = this.page.locator('#elementor-panel-elements-search-input')
    await searchInput.fill(widgetName)
    await searchInput.press('Enter')

    // Drag widget to canvas (or double-click to add)
    const widget = this.page.locator(`.elementor-element[data-widget_type="${widgetName}-widget"]`).first()

    if ((await widget.count()) === 0) {
      // Try alternative selector
      const widgetAlt = this.page
        .locator('.elementor-element')
        .filter({ hasText: new RegExp(`^${widgetName}$`, 'i') })
        .first()
      await widgetAlt.dblclick()
    } else {
      await widget.dblclick()
    }

    // Wait for widget to appear in preview
    await this.previewFrame.locator('.elementor-widget').first().waitFor({ timeout: 10000 })
  }

  /** Select a widget in the preview */
  async selectWidget(selector: string = '.elementor-widget') {
    const widget = this.previewFrame.locator(selector).first()

    // First click to show the edit overlay
    await widget.click()

    // Click the edit button in the overlay (pen/pencil icon); fall back to
    // double-clicking the widget if the overlay never shows up
    const editButton = widget
      .locator('.elementor-editor-element-edit, [data-event="edit"]')
      .first()
    try {
      await editButton.waitFor({ state: 'visible', timeout: 2000 })
      await editButton.click()
    } catch {
      await widget.dblclick()
    }

    // Wait for editor panel page to load (appears when widget is selected)
    await this.page.waitForSelector('#elementor-panel-page-editor', { timeout: 15000 })
    // Wait for controls to render
    await this.page.waitForSelector('#elementor-controls .elementor-control', { timeout: 10000 })
  }

  /** Open the Style tab in the panel */
  async openStyleTab() {
    // Use data-tab attribute for more reliable selection
    const styleTab = this.page.locator('.elementor-panel-navigation-tab[data-tab="style"]')
    await styleTab.click()
    // Wait for tab to become active
    await this.page.waitForSelector('.elementor-panel-navigation-tab[data-tab="style"].elementor-active', { timeout: 5000 })
  }

  /** Expand a control section (accordion) */
  async expandSection(sectionName: string) {
    const section = this.page.locator(
      `.elementor-control-type-section:has(.elementor-panel-heading-title:has-text("${sectionName}"))`
    )
    const toggle = section.locator('.elementor-panel-heading-toggle')

    // Check if already expanded
    const heading = section.locator('.elementor-panel-heading')
    const isExpanded = await heading.getAttribute('aria-expanded')
    if (isExpanded !== 'true') {
      await toggle.click()
      await expect(heading).toHaveAttribute('aria-expanded', 'true')
    }
  }

  /** Get a control element by label or name */
  getControl(controlLabel: string): Locator {
    return this.page.locator(
      `.elementor-control:has(.elementor-control-title:has-text("${controlLabel}"))`
    )
  }

  /** Select a fluid preset from a Select2 dropdown */
  async selectFluidPreset(controlLabel: string, presetName: string) {
    const control = this.getControl(controlLabel)

    // Find and click the Select2 container
    const select2 = control.locator('.select2-container')
    await select2.click()

    // Wait for dropdown
    await this.page.waitForSelector('.select2-results', { timeout: 5000 })

    // Find and click the preset option
    const option = this.page.locator(`.select2-results__option:has-text("${presetName}")`)
    await option.click()

    // Wait for the dropdown to close and the selection to render
    await this.page
      .locator('.select2-results')
      .waitFor({ state: 'hidden', timeout: 5000 })
    await expect(control.locator('.select2-selection__rendered')).toContainText(
      presetName
    )
  }

  /** Switch responsive device mode */
  async switchDevice(device: 'desktop' | 'tablet' | 'mobile') {
    // Device switcher is in the top bar as a tablist
    // The tabs have text like "Desktop", "Tablet Portrait", "Mobile Portrait"
    const deviceLabels = {
      desktop: 'Desktop',
      tablet: 'Tablet',
      mobile: 'Mobile'
    }

    // Find the device tab in the Switch Device tablist
    const deviceTab = this.page.locator(`[role="tablist"][aria-label="Switch Device"] [role="tab"]`)
      .filter({ hasText: deviceLabels[device] })

    await deviceTab.click()

    // Wait for device mode to apply (body class changes)
    await this.page.waitForSelector(`body.elementor-device-${device}`, { timeout: 5000 })
  }

  /** Verify a CSS variable exists in the preview iframe */
  async verifyCssVariable(varName: string, expectedPattern: RegExp | string) {
    const value = await this.previewFrame.locator('html').evaluate((el, cssVar) => {
      return getComputedStyle(el).getPropertyValue(cssVar).trim()
    }, varName)

    if (typeof expectedPattern === 'string') {
      expect(value).toBe(expectedPattern)
    } else {
      expect(value).toMatch(expectedPattern)
    }

    return value
  }

  /** Get the value of a CSS variable from preview */
  async getCssVariableValue(varName: string): Promise<string> {
    return await this.previewFrame.locator('html').evaluate((el, cssVar) => {
      return getComputedStyle(el).getPropertyValue(cssVar).trim()
    }, varName)
  }

  /** Check if inheritance indicator is visible */
  getInheritIndicator(): Locator {
    return this.page.locator('[data-inherited-from], .elementor-control-inherit-indicator')
  }

  /** Save the current page */
  async save() {
    const saveButton = this.page.locator('#elementor-panel-saver-button-publish')
    await saveButton.click()
    await this.page.waitForSelector('.elementor-button-success', { timeout: 30000 })
  }
}
