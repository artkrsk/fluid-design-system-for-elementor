/**
 * AJAX Manager for Fluid Design System Admin
 *
 * @package Arts\FluidDesignSystem
 * @since 1.0.0
 */

;(function ($) {
  'use strict'

  /**
   * Sanitize HTML content to prevent XSS attacks while preserving structure
   *
   * @param {string} htmlContent The HTML content to sanitize
   * @return {string} Sanitized HTML safe for insertion
   */
  function sanitizeHTML(htmlContent) {
    // Return empty string for null/undefined input
    if (!htmlContent) {
      return ''
    }

    // Configure DOMPurify to allow needed elements but prevent scripts
    const config = {
      ALLOWED_TAGS: [
        'table',
        'thead',
        'tbody',
        'tfoot',
        'tr',
        'th',
        'td',
        'colgroup',
        'col',

        // Text content
        'div',
        'span',
        'p',
        'strong',
        'em',
        'b',
        'i',
        'br',
        // Headings
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        // Lists
        'ul',
        'ol',
        'li',
        // Links and buttons
        'a',
        'button',
        // Form elements
        'input',
        'select',
        'textarea',
        'form',
        'option',
        // Semantic elements
        'details',
        'summary',
        'pre',
        'code',
        // WordPress/Elementor specific
        'fieldset',
        'legend'
      ],
      ALLOWED_ATTR: [
        // Basic attributes
        'class',
        'id',
        'style',
        'title',
        'lang',
        'dir',
        // Link attributes
        'href',
        'target',
        'rel',
        // Form attributes
        'type',
        'name',
        'value',
        'placeholder',
        'disabled',
        'checked',
        'selected',
        'readonly',
        'required',
        'maxlength',
        'min',
        'max',
        'pattern',
        'step',
        'autocomplete',
        'autofocus',
        // Data attributes
        'data-*',
        // ARIA attributes
        'aria-*',
        'role',
        // Table attributes
        'colspan',
        'rowspan',
        'scope',
        // WordPress/Admin specific
        'method',
        'action',
        'enctype',
        // For dashicons and eicons
        'for',
        'tabindex'
      ],
      ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel|sms):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
      ADD_TAGS: ['i'], // For dashicons like <i class="eicon-elementor-square">
      ADD_ATTR: ['target', 'rel'], // For links that open in new window
      ALLOW_DATA_ATTR: true, // Critical for your data attributes
      ALLOW_ARIA_ATTR: true, // For accessibility
      KEEP_CONTENT: true, // Preserve text content even if tag is removed
      ALLOW_STYLE_ATTR: true // Allow style attribute but sanitize its content
    }

    // Use DOMPurify to sanitize
    return DOMPurify.sanitize(htmlContent, config)
  }

  /**
   * Send AJAX request
   */
  function sendRequest(action, data, successCallback, errorCallback) {
    const requestData = {
      action: 'fluid_design_system_admin_action',
      security: fluidDesignSystemAdmin.ajaxNonce,
      fluid_action: action,
      ...data
    }

    // Show loading status with action-specific message
    if (window.FluidDesignSystemAdmin && window.FluidDesignSystemAdmin.statusNotices) {
      let loadingMessage = fluidDesignSystemAdmin.strings.savingChanges
      if (action === 'save_all_changes') {
        loadingMessage = fluidDesignSystemAdmin.strings.savingChanges
      } else if (action === 'update_title') {
        loadingMessage = fluidDesignSystemAdmin.strings.updatingTitle
      } else if (action === 'update_description') {
        loadingMessage = fluidDesignSystemAdmin.strings.updatingDescription
      } else if (action === 'reorder_groups') {
        loadingMessage = fluidDesignSystemAdmin.strings.updatingOrder
      }

      window.FluidDesignSystemAdmin.statusNotices.showLoading(loadingMessage)
    }

    // Mark as AJAX operation to prevent pulse animation
    $('body').addClass('ajax-operation-pending')

    $.ajax({
      url: fluidDesignSystemAdmin.ajaxUrl,
      type: 'POST',
      data: requestData,
      success: function (response) {
        $('body').removeClass('ajax-operation-pending')

        // Update tables with HTML if provided (for save_all_changes)
        if (response.data && response.data.main_table_html) {
          updateTablesWithHtml(response.data)
        }
        // Update tables with data if provided (for individual operations)
        else if (response.data && (response.data.main_groups || response.data.filter_groups)) {
          updateTablesData(response.data)
        }

        if (response.success) {
          if (typeof successCallback === 'function') {
            successCallback(response)
          }

          // Show success status unless specifically suppressed
          if (window.FluidDesignSystemAdmin && window.FluidDesignSystemAdmin.statusNotices) {
            const message = response.message || fluidDesignSystemAdmin.strings.operationSuccess
            window.FluidDesignSystemAdmin.statusNotices.showSuccess(message)
          }
        } else {
          if (typeof errorCallback === 'function') {
            errorCallback(response)
          } else {
            // Show error status
            if (window.FluidDesignSystemAdmin && window.FluidDesignSystemAdmin.statusNotices) {
              const message = response.message || fluidDesignSystemAdmin.strings.operationError
              window.FluidDesignSystemAdmin.statusNotices.showError(message)
            }
          }
        }

        // Auto-hide status after 5 seconds
        setTimeout(hideStatus, 5000)
      },
      error: function (xhr, status, error) {
        $('body').removeClass('ajax-operation-pending')

        if (typeof errorCallback === 'function') {
          errorCallback({
            success: false,
            message: `AJAX Error: ${error}`
          })
        }

        // Show error status
        if (window.FluidDesignSystemAdmin && window.FluidDesignSystemAdmin.statusNotices) {
          const message = fluidDesignSystemAdmin.strings.ajaxError || `Request failed: ${error}`
          window.FluidDesignSystemAdmin.statusNotices.showError(message)
        }

        // Auto-hide status after 5 seconds
        setTimeout(hideStatus, 5000)
      }
    })
  }

  /**
   * Update group title via AJAX
   */
  function updateTitle(groupId, title, successCallback, errorCallback) {
    // Check if this is a temporary unsaved group
    if (groupId.toString().startsWith('temp_')) {
      // Handle client-side only for temporary groups
      handleTemporaryGroupUpdate('title', groupId, title, successCallback)
      return
    }

    sendRequest('update_title', { group_id: groupId, title }, successCallback, errorCallback)
  } /**
   * Update group description via AJAX
   */
  function updateDescription(groupId, description, callback) {
    // Check if this is a temporary group
    if (groupId.toString().startsWith('temp_')) {
      handleTemporaryGroupUpdate('description', groupId, description, callback)
      return
    }

    sendRequest(
      'update_description',
      { group_id: groupId, description },
      callback,
      function (response) {
        const $row = $(`tr[data-group-id="${groupId}"]`)
        const $descText = $row.find('.description-text')

        if (description.trim()) {
          $descText.text(description)
        } else {
          $descText.text('')
        }
      }
    )
  }

  /**
   * Reorder groups via AJAX
   */
  function reorderGroups(groupOrder, successCallback, errorCallback) {
    // Check if the order contains temporary groups
    const hasTemporaryGroups = groupOrder.some((id) => id.toString().startsWith('temp_'))

    if (hasTemporaryGroups) {
      // Just update the UI and hidden inputs without AJAX
      updateTemporaryGroupOrder(groupOrder, successCallback)
      return
    }

    sendRequest('reorder_groups', { group_order: groupOrder }, successCallback, errorCallback)
  } /**
   * Show status message (delegates to status notices module)
   */
  function showStatus(type, message, options = {}) {
    if (window.FluidDesignSystemAdmin && window.FluidDesignSystemAdmin.statusNotices) {
      return window.FluidDesignSystemAdmin.statusNotices.showStatus(type, message, options)
    }
    // Fallback for backwards compatibility
    console.warn(fluidDesignSystemAdmin.strings.statusModuleNotLoaded)
  }

  /**
   * Show unsaved changes status (delegates to status notices module)
   */
  function showUnsavedChanges() {
    if (window.FluidDesignSystemAdmin && window.FluidDesignSystemAdmin.statusNotices) {
      return window.FluidDesignSystemAdmin.statusNotices.showUnsavedChanges()
    }
  }

  /**
   * Show validation feedback (delegates to status notices module)
   */
  function showValidationFeedback(scenario, data = {}) {
    if (window.FluidDesignSystemAdmin && window.FluidDesignSystemAdmin.statusNotices) {
      return window.FluidDesignSystemAdmin.statusNotices.showValidationFeedback(scenario, data)
    }
  }

  /**
   * Clear validation feedback (delegates to status notices module)
   */
  function clearValidationFeedback() {
    if (window.FluidDesignSystemAdmin && window.FluidDesignSystemAdmin.statusNotices) {
      return window.FluidDesignSystemAdmin.statusNotices.clearValidationFeedback()
    }
  }

  /**
   * Hide status area (delegates to status notices module)
   */
  function hideStatus() {
    if (window.FluidDesignSystemAdmin && window.FluidDesignSystemAdmin.statusNotices) {
      return window.FluidDesignSystemAdmin.statusNotices.hideStatus()
    }
  } /**
   * Update both main and filter tables with fresh data from server
   */
  function updateTablesData(data) {
    // Update main groups table preset counts
    if (data.main_groups && Array.isArray(data.main_groups)) {
      updateTablePresetCounts('#fluid-main-groups-table', data.main_groups)
    }

    // Update filter groups table preset counts
    if (data.filter_groups && Array.isArray(data.filter_groups)) {
      updateTablePresetCounts('#fluid-developer-groups-table', data.filter_groups)
    }
  }

  /**
   * Update preset counts in a specific table
   */
  function updateTablePresetCounts(tableSelector, groups) {
    const $table = $(tableSelector)
    if ($table.length === 0) {
      return
    }

    groups.forEach(function (group) {
      const $row = $table.find(`tr[data-group-id="${group.id}"]`)
      if ($row.length && group.value && Array.isArray(group.value)) {
        const presetCount = group.value.length
        $row.find('.preset-count').text(presetCount)

        // Update the hidden data as well
        $row.attr('data-preset-count', presetCount)
      }
    })
  }

  /**
   * Update tables with fresh HTML from server (complete refresh)
   */
  function updateTablesWithHtml(data) {
    // Update main groups table (complete table replacement)
    if (data.main_table_html) {
      const $currentTable = $('#fluid-groups-sortable')

      if ($currentTable.length > 0) {
        // Destroy existing sortable before replacing content
        const $tbody = $currentTable.find('tbody')
        if ($tbody.hasClass('ui-sortable')) {
          $tbody.sortable('destroy')
        }

        // Replace the entire table with fresh HTML
        const $newTable = $(sanitizeHTML(data.main_table_html))
        $currentTable.replaceWith($newTable)

        // Reinitialize sortable after content replacement
        if (window.FluidDesignSystemAdmin && window.FluidDesignSystemAdmin.sortable) {
          window.FluidDesignSystemAdmin.sortable.init()
        }
      }
    }

    // Update developer groups table (complete table replacement)
    if (data.developer_table_html !== undefined) {
      const $currentTable = $('#fluid-developer-groups-table-list')
      const $developerSection = $('#fluid-developer-groups-table')

      if (data.developer_table_exists && data.developer_table_html) {
        // Show the developer section and update content
        $developerSection.show()
        if ($currentTable.length > 0) {
          // Replace the entire table with fresh HTML
          const $newTable = $(sanitizeHTML(data.developer_table_html))
          $currentTable.replaceWith($newTable)
        }
      } else {
        // Hide the developer section if no developer groups
        $developerSection.hide()
      }
    }

    // Clear any temporary group data from hidden inputs (they're now real groups)
    $('#fluid-groups-form').find('input[name^="new_groups"]').remove()
    $('#fluid-groups-form').find('input[name="temp_group_mapping"]').remove()
    $('#fluid-groups-form').find('input[name="temp_group_positions"]').remove()
    $('#fluid-groups-form').find('input[name^="delete_groups"]').remove()
  }

  /**
   * Handle temporary group updates (client-side only)
   */
  function handleTemporaryGroupUpdate(type, tempId, value, callback) {
    // Update the hidden input value and display text
    if (type === 'title') {
      $(`input[name="group_titles[${tempId}]"]`).val(value)
      $(`tr[data-group-id="${tempId}"] .title-text`).text(value)
    } else if (type === 'description') {
      $(`input[name="group_descriptions[${tempId}]"]`).val(value)
      $(`tr[data-group-id="${tempId}"] .description-text`).text(value)
    }

    // Update form data from all temporary groups to ensure Save Changes works correctly
    if (
      window.FluidDesignSystemAdmin &&
      window.FluidDesignSystemAdmin.base &&
      window.FluidDesignSystemAdmin.base.updateFormDataFromTempGroups
    ) {
      window.FluidDesignSystemAdmin.base.updateFormDataFromTempGroups()
    }

    // Trigger form change to highlight save button
    $('#fluid-groups-form').trigger('change')

    // Remove ajax-operation-pending class since this was a client-side operation
    $('body').removeClass('ajax-operation-pending')

    // No success feedback for temporary operations - they're just local changes
    // Don't show notices for temporary group operations

    // Call success callback with simulated response
    if (typeof callback === 'function') {
      callback({ tempUpdate: true })
    }
  }

  /**
   * Update temporary group order (client-side only)
   */
  function updateTemporaryGroupOrder(groupOrder, callback) {
    // This is a temporary group operation - handle client-side only
    if (
      window.FluidDesignSystemAdmin &&
      window.FluidDesignSystemAdmin.base &&
      window.FluidDesignSystemAdmin.base.updateFormDataFromTempGroups
    ) {
      window.FluidDesignSystemAdmin.base.updateFormDataFromTempGroups()
    }

    // Trigger form change to highlight save button - reordering requires saving
    $('#fluid-groups-form').trigger('change')

    // Remove ajax-operation-pending class since this was a client-side operation
    $('body').removeClass('ajax-operation-pending')

    // Simulate success callback for consistency
    if (callback && typeof callback === 'function') {
      callback({
        success: true,
        message: fluidDesignSystemAdmin.strings.tempGroupOrderSuccess
      })
    }
  }

  /**
   * Save all changes via AJAX
   */
  function saveAllChanges(formData, successCallback, errorCallback) {
    sendRequest('save_all_changes', formData, successCallback, errorCallback)
  }

  // Public API
  window.FluidDesignSystemAdmin = window.FluidDesignSystemAdmin || {}
  window.FluidDesignSystemAdmin.ajax = {
    updateTitle,
    updateDescription,
    reorderGroups,
    saveAllChanges,
    sendRequest,
    showStatus,
    showUnsavedChanges,
    showValidationFeedback,
    clearValidationFeedback,
    hideStatus
  }
})(jQuery)
