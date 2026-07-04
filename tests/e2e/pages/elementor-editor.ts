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

  /** Get a control element by label or name */
  getControl(controlLabel: string): Locator {
    return this.page.locator(
      `.elementor-control:has(.elementor-control-title:has-text("${controlLabel}"))`
    )
  }

  /**
   * Switch a control's unit via the units switcher. The open choices overlay
   * covers the switcher, so it cannot be toggle-closed — selecting a unit is
   * what closes it.
   */
  async switchUnit(controlName: string, unit: string) {
    const control = this.page.locator(`.elementor-control-${controlName}`)
    await control.locator('.e-units-switcher').click()
    await control.locator('.e-units-choices.e-units-choices-open').waitFor({ timeout: 5000 })
    await control.locator(`.e-units-choices label[data-choose="${unit}"]`).click()
    await expect(control.locator('.e-units-switcher')).toHaveAttribute('data-selected', unit)
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

  /**
   * Get the value of a CSS variable from the preview iframe's root element.
   *
   * NOTE: every seeded preset variable exists on :root regardless of what any
   * control has selected — reselecting a preset does NOT change these values.
   * Use this to assert set/unset/restore of a variable itself (CSSManager
   * contract); to assert a selection took effect, check the widget's applied
   * computed style or the control's select value instead.
   */
  async getCssVariableValue(varName: string): Promise<string> {
    return await this.previewFrame.locator('html').evaluate((el, cssVar) => {
      return getComputedStyle(el).getPropertyValue(cssVar).trim()
    }, varName)
  }

  /**
   * Save the current PAGE document via the footer button.
   *
   * Kit-only edits (Site Settings) leave this button disabled — use
   * saveSiteSettings() for those.
   */
  async save() {
    const saveButton = this.page.locator('#elementor-panel-saver-button-publish')
    await saveButton.click()
    await this.page.waitForSelector('.elementor-button-success', { timeout: 30000 })
  }

  /** Open Site Settings and wait for the Kit document + its settings model */
  async openSiteSettings() {
    await this.page.evaluate(async () => {
      const w = window as unknown as { $e: { run: (cmd: string) => Promise<unknown> } }
      await w.$e.run('panel/global/open')
    })
    await this.page.waitForFunction(
      () => {
        const w = window as unknown as {
          elementor?: {
            config?: { kit_id?: number }
            documents?: {
              get?: (id: number) => { container?: { settings?: { get: (key: string) => unknown } } }
            }
          }
        }
        const kitId = w.elementor?.config?.kit_id
        const container = kitId != null ? w.elementor?.documents?.get?.(kitId)?.container : null
        return Boolean(container && container.settings && container.settings.get('fluid_typography_presets'))
      },
      undefined,
      { timeout: 15000 }
    )
  }

  /**
   * Save the Kit (Site Settings) document via its save command.
   *
   * The footer save button tracks the primary page document's changed state,
   * so it stays disabled for Kit-only edits. Running the Kit's save command
   * directly is the reliable way to persist Site Settings; its promise
   * resolves only after the save AJAX has persisted.
   */
  async saveSiteSettings() {
    await this.page.evaluate(async () => {
      const w = window as unknown as {
        elementor: { config: { kit_id: number }; documents: { get: (id: number) => unknown } }
        $e: { run: (cmd: string, args: Record<string, unknown>) => Promise<unknown> }
      }
      const kitDoc = w.elementor.documents.get(w.elementor.config.kit_id)
      await w.$e.run('document/save/update', { document: kitDoc })
    })
  }

  /**
   * Open Site Settings, route to the plugin's fluid tab and expand the section
   * that owns the given repeater control.
   *
   * Repeater controls inside collapsed kit-panel sections are NOT attached to
   * the DOM until the section expands — routing alone is not enough.
   */
  async openSiteSettingsFluidTab(controlName: string = 'fluid_spacing_presets') {
    await this.openSiteSettings()

    await this.page.evaluate(() => {
      const w = window as unknown as { $e: { route: (route: string) => void } }
      w.$e.route('panel/global/arts-fluid-design-system-tab-fluid-typography-spacing')
    })

    const section = this.page.locator(`.elementor-control-section_${controlName}`)
    await section.waitFor({ timeout: 15000 })

    const control = this.page.locator(`.elementor-control-${controlName}`)
    if ((await control.count()) === 0) {
      await section.locator('.elementor-panel-heading').click()
    }
    await control.waitFor({ timeout: 10000 })
  }

  /**
   * Add a row to a fluid preset repeater in the open Site Settings tab and
   * fill its title. Returns the generated _id read from the Kit model.
   */
  async addRepeaterRow(controlName: string, title: string): Promise<string> {
    const control = this.page.locator(`.elementor-control-${controlName}`)
    const rowsBefore = await control.locator('.elementor-repeater-fields').count()

    await control.locator('button.elementor-repeater-add').click()
    await expect(control.locator('.elementor-repeater-fields')).toHaveCount(rowsBefore + 1)

    const newRow = control.locator('.elementor-repeater-fields').nth(rowsBefore)
    await newRow.locator('input[data-setting="title"]').fill(title)

    const itemId = await this.page.evaluate(
      ({ name, index }) => {
        const w = window as unknown as {
          elementor: {
            config: { kit_id: number }
            documents: {
              get: (id: number) => {
                container: { settings: { get: (key: string) => { models: Array<{ get: (k: string) => string }> } } }
              }
            }
          }
        }
        const collection = w.elementor.documents
          .get(w.elementor.config.kit_id)
          .container.settings.get(name)
        return collection.models[index]?.get('_id') ?? ''
      },
      { name: controlName, index: rowsBefore }
    )

    expect(itemId).not.toBe('')
    return itemId
  }

  /**
   * Remove a repeater row via its (hover-revealed) remove tool and confirm
   * the plugin's delete dialog.
   */
  async removeRepeaterRow(controlName: string, index: number) {
    const control = this.page.locator(`.elementor-control-${controlName}`)
    const row = control.locator('.elementor-repeater-fields').nth(index)

    await row.hover()
    await row.locator('.elementor-repeater-tool-remove').click()

    const confirmDialog = this.page.locator('.e-global__confirm-delete')
    await confirmDialog.waitFor({ timeout: 5000 })
    await confirmDialog.locator('.dialog-ok').click()
    await confirmDialog.waitFor({ state: 'hidden', timeout: 5000 })
  }
}
