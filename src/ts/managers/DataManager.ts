import { AJAX_ACTIONS, AJAX_DEFAULTS } from '../constants'
import { showControlSpinner, hideControlSpinner, elementorAjaxRequest } from '../utils'
import { PresetAPIService } from '../services/presetAPI'
import type { ICustomPreset, IFluidPreset, IPresetGroup, IPresetGroupOption } from '../interfaces'

export class DataManager {
  presets: IPresetGroup[] | null = null
  request: Promise<IPresetGroup[]> | null = null
  isPending: boolean = false
  groupsRequest: Promise<IPresetGroupOption[]> | null = null

  /** Bumped on invalidate, so a response from a superseded request can't resurrect stale data */
  private generation: number = 0

  invalidate(): void {
    this.generation++
    this.presets = null
    this.request = null
    this.isPending = false
    this.groupsRequest = null
  }

  /** Adds a newly created preset to the cache, sparing the dropdowns a full refetch */
  addPreset(controlId: string, preset: IFluidPreset): void {
    const rows = this.getCachedRows(controlId)

    if (!rows) {
      return
    }

    rows.push(preset)
  }

  /** Patches an edited preset in the cache, sparing the dropdowns a full refetch */
  updatePreset(controlId: string, presetId: string, fields: Partial<IFluidPreset>): void {
    const rows = this.getCachedRows(controlId)

    if (!rows) {
      return
    }

    const row = rows.find(row => row.id === presetId)

    if (!row) {
      this.invalidate()
      return
    }

    Object.assign(row, fields)
  }

  /** Rows of a cached group, or null when patching isn't safe and a refetch should win */
  private getCachedRows(controlId: string): (IFluidPreset | ICustomPreset)[] | null {
    /** A response already in flight predates the write */
    if (this.isPending) {
      this.invalidate()
      return null
    }

    if (!this.presets) {
      return null
    }

    const group = this.presets.find(group => group.control_id === controlId)

    if (!group || !Array.isArray(group.value)) {
      this.invalidate()
      return null
    }

    return group.value
  }

  /** Groups change outside the editor, so they're fetched fresh per call (deduping concurrent callers) */
  async getGroups(): Promise<IPresetGroupOption[]> {
    if (this.groupsRequest) {
      return this.groupsRequest
    }

    const generation = this.generation

    this.groupsRequest = PresetAPIService.fetchGroups()
      .catch(() => [] as IPresetGroupOption[])
      .finally(() => {
        if (generation === this.generation) {
          this.groupsRequest = null
        }
      })

    return this.groupsRequest
  }

  async getPresetsData(el?: HTMLElement): Promise<IPresetGroup[] | null> {
    if (this.presets) {
      hideControlSpinner(el)
      return this.presets
    }

    if (el && el.closest('.elementor-control.e-units-fluid')) {
      showControlSpinner(el)
    }

    if (this.isPending && this.request) {
      this.request.finally(() => {
        hideControlSpinner(el)
      })

      return this.request
    }

    this.isPending = true

    const generation = this.generation

    this.request = elementorAjaxRequest<IPresetGroup[]>(
      AJAX_ACTIONS.FETCH_PRESETS,
      AJAX_DEFAULTS.FETCH_PRESETS
    ).then(response => {
      if (generation === this.generation) {
        this.presets = response
      }

      return response
    })

    try {
      const result = await this.request
      return result
    } catch {
      return null
    } finally {
      if (generation === this.generation) {
        this.isPending = false
      }

      hideControlSpinner(el)
    }
  }
}

// Create a singleton instance
const dataManager = new DataManager()

// Export the instance
export default dataManager
