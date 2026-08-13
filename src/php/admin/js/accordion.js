/**
 * Accordion functionality for Cross-Group Preset Management
 * SIMPLIFIED REWRITE - Clean, lean implementation
 *
 * @package Arts\FluidDesignSystem
 * @since 1.0.0
 */

;(function ($) {
  'use strict'

  let saveTimeout = null

  /**
   * Initialize everything
   */
  function init() {
    // Initialize accordions
    $(document).on('click', '.group-chevron', handleChevronClick)

    // Initialize all visible preset lists
    $('.preset-sortable-list').each(function () {
      initPresetList($(this))
    })

    // Initialize preset lists when accordions expand
    $(document).on('accordion-expanded', function (e, $presetsRow) {
      const $list = $presetsRow.find('.preset-sortable-list')
      if ($list.length && !$list.hasClass('ui-sortable')) {
        initPresetList($list)
      }
    })

    // Initialize placeholder states on page load
    updatePresetListStates()
  }

  /**
   * Initialize a preset list for drag & drop
   */
  function initPresetList($list) {
    // Skip if already initialized
    if ($list.hasClass('ui-sortable')) {
      return
    }

    $list.sortable({
      connectWith: '.preset-sortable-list',
      items: '.preset-item:not(.preset-placeholder)',
      placeholder: 'preset-sortable-placeholder',
      tolerance: 'pointer',
      cursor: 'move',
      helper: 'clone',
      appendTo: 'body', // Append helper to body to avoid z-index issues
      zIndex: 9999,

      start: function (event, ui) {
        // Add dragging state to body for placeholder styling
        $('body').addClass('ui-sortable-helper-active')

        // Simple visual feedback
        ui.placeholder.height(ui.helper.outerHeight())

        // Placeholders remain visible as drop targets (styled via CSS)
      },

      stop: function (event, ui) {
        // Remove dragging state from body
        $('body').removeClass('ui-sortable-helper-active')

        // Update empty states and placeholder visibility
        updatePresetListStates()

        // Save after any change
        scheduleSnapshot()
      }
    })
  }

  /**
   * Handle chevron click to expand/collapse
   */
  function handleChevronClick(e) {
    e.preventDefault()
    e.stopPropagation()

    const $chevron = $(this)
    const groupId = $chevron.data('group-id')
    const $groupRow = $chevron.closest('.group-row')
    const $presetsRow = $(`.group-presets-row[data-group-id="${groupId}"]`)

    if ($presetsRow.length === 0) {
      return
    }

    const $wrapper = $presetsRow.find('.group-presets-wrapper')

    if ($chevron.hasClass('expanded')) {
      // Collapse
      $chevron.removeClass('expanded')
      $wrapper.slideUp(200)
      $groupRow.removeClass('accordion-expanded')
    } else {
      // Expand
      $chevron.addClass('expanded')
      $wrapper.slideDown(200, function () {
        // Initialize sortable if needed
        const $list = $presetsRow.find('.preset-sortable-list')
        if ($list.length && !$list.hasClass('ui-sortable')) {
          initPresetList($list)
        }
      })
      $groupRow.addClass('accordion-expanded')
    }

    // Toggle group table sorting based on accordion state (main table only)
    const hasExpanded = $('#fluid-groups-sortable .group-chevron.expanded').length > 0
    const $tbody = $('#fluid-groups-tbody')

    if ($tbody.hasClass('ui-sortable')) {
      if (hasExpanded) {
        $tbody.sortable('disable')
        $('#fluid-groups-sortable .group-row.sortable-row').addClass('sorting-disabled')
      } else {
        $tbody.sortable('enable')
        $('#fluid-groups-sortable .group-row.sortable-row').removeClass('sorting-disabled')
      }
    }
  }

  /**
   * Schedule a snapshot save (debounced)
   */
  function scheduleSnapshot() {
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }

    saveTimeout = setTimeout(function () {
      saveSnapshot()
    }, 300) // 300ms debounce
  }

  /**
   * Save the current preset arrangement
   */
  function saveSnapshot() {
    // Show loading state
    $('body').addClass('ajax-operation-pending')
    $('.preset-sortable-list').addClass('ajax-operation-pending')

    if (window.FluidDesignSystemAdmin && window.FluidDesignSystemAdmin.statusNotices) {
      window.FluidDesignSystemAdmin.statusNotices.showLoading('Saving Changes...')
    }

    // Collect the snapshot
    const snapshot = collectSnapshot()

    // Send to server
    $.ajax({
      url: window.fluidDesignSystemAdmin.ajaxUrl,
      type: 'POST',
      data: {
        action: 'fluid_design_system_admin_action',
        security: window.fluidDesignSystemAdmin.ajaxNonce,
        fluid_action: 'save_presets_snapshot',
        snapshot: JSON.stringify(snapshot)
      },
      success: function (response) {
        if (response.success) {
          // Update preset counts in the table
          updatePresetCounts()

          if (window.FluidDesignSystemAdmin && window.FluidDesignSystemAdmin.statusNotices) {
            window.FluidDesignSystemAdmin.statusNotices.showSuccess('Presets updated successfully')
          }
        } else {
          if (window.FluidDesignSystemAdmin && window.FluidDesignSystemAdmin.statusNotices) {
            window.FluidDesignSystemAdmin.statusNotices.showError('Failed to save presets')
          }
        }
      },
      error: function () {
        if (window.FluidDesignSystemAdmin && window.FluidDesignSystemAdmin.statusNotices) {
          window.FluidDesignSystemAdmin.statusNotices.showError('Failed to save presets')
        }
      },
      complete: function () {
        // Hide loading state
        $('body').removeClass('ajax-operation-pending')
        $('.preset-sortable-list').removeClass('ajax-operation-pending')
      }
    })
  }

  /**
   * Collect snapshot of current preset arrangement
   */
  function collectSnapshot() {
    const snapshot = {}

    $('.group-presets-row[data-group-id]').each(function () {
      const $row = $(this)
      const groupId = $row.data('group-id')

      if (!groupId || groupId === '') {
        return // Skip invalid groups
      }

      // Map group ID to control ID
      const controlId = mapGroupToControl(groupId)
      if (!controlId) {
        return // Skip if no mapping
      }

      // Collect presets in this group
      const presets = []
      $row.find('.preset-item[data-preset-id]').each(function () {
        const $preset = $(this)
        const presetId = $preset.data('preset-id')

        if (presetId && presetId !== '') {
          presets.push({
            _id: String(presetId),
            title: $preset.find('.preset-title').text() || 'Untitled'
          })
        }
      })

      snapshot[controlId] = presets
    })

    return snapshot
  }

  /**
   * Simple group to control ID mapping
   */
  function mapGroupToControl(groupId) {
    // Built-in groups
    if (groupId === 'fluid_spacing_presets' || groupId === 'spacing') {
      return 'fluid_spacing_presets'
    }
    if (groupId === 'fluid_typography_presets' || groupId === 'typography') {
      return 'fluid_typography_presets'
    }

    // Already formatted
    if (groupId.includes('_presets')) {
      return groupId
    }

    // Custom groups
    return `fluid_custom_${groupId}_presets`
  }

  /**
   * Update preset counts in the table
   */
  function updatePresetCounts() {
    $('.group-row[data-group-id]').each(function () {
      const $row = $(this)
      const groupId = $row.data('group-id')
      const count = $(
        `.group-presets-row[data-group-id="${groupId}"] .preset-item:not(.preset-placeholder)`
      ).length
      $row.find('.column-presets').text(count)
    })
  }

  /**
   * Update preset list states and placeholder visibility
   */
  function updatePresetListStates() {
    $('.preset-sortable-list').each(function () {
      const $list = $(this)
      const $realPresets = $list.find('.preset-item:not(.preset-placeholder)')
      const $placeholder = $list.find('.preset-placeholder')

      if ($realPresets.length === 0) {
        // No real presets - show placeholder
        $placeholder.show()
        $list.removeClass('has-presets')
      } else {
        // Has real presets - hide placeholder
        $placeholder.hide()
        $list.addClass('has-presets')
      }
    })
  }

  // Public API
  window.FluidDesignSystemAdmin = window.FluidDesignSystemAdmin || {}
  window.FluidDesignSystemAdmin.accordion = {
    init: init,
    saveSnapshot: saveSnapshot,
    collectSnapshot: collectSnapshot,
    updatePresetCounts: updatePresetCounts,
    updatePresetListStates: updatePresetListStates
  }

  // Initialize when ready
  $(document).ready(init)
})(jQuery)
