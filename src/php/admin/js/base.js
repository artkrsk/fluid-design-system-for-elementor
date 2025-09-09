/**
 * Base JavaScript functionality for Fluid Design System Admin
 *
 * @package Arts\FluidDesignSystem
 * @since 1.0.0
 */

;(function ($) {
  'use strict'

  /**
   * Initialize the admin interface
   */
  function init() {
    initTabs()
    initFormValidation()
    initSaveChangesHighlight()
    initSaveChangesAjax()
    initDeleteHandlers()
    initInlineAddGroup()
  }

  /**
   * Decode HTML entities and convert escaped newlines to actual newlines
   */
  function decodeHtmlString(str) {
    if (!str) return str

    return str
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\\n/g, '\n')
  }

  /**
   * Initialize tab functionality
   */
  function initTabs() {
    $('.nav-tab').on('click', function (e) {
      e.preventDefault()

      const $tab = $(this)
      const href = $tab.attr('href')

      // Extract tab parameter from URL
      const url = new URL(href, window.location.origin)
      const tabId = url.searchParams.get('tab') || 'groups'

      // Update tab states
      $('.nav-tab').removeClass('nav-tab-active')
      $tab.addClass('nav-tab-active')

      // Update panel visibility using tab IDs
      $('.fluid-design-system-form-page').hide()
      $('#tab-' + tabId).show()

      // Update URL hash without jumping (Elementor-style)
      const newHash = '#tab-' + tabId
      if (history.pushState) {
        const newUrl = window.location.pathname + window.location.search + newHash
        history.pushState(null, null, newUrl)
      } else {
        window.location.hash = newHash
      }
    })

    // Handle initial tab based on URL hash or query parameter
    const urlParams = new URLSearchParams(window.location.search)
    const currentTab = urlParams.get('tab') || 'groups'

    // If there's a hash that matches a tab, use that instead
    if (window.location.hash && window.location.hash.startsWith('#tab-')) {
      const hashTab = window.location.hash.replace('#tab-', '')
      const $hashTab = $('.nav-tab[href*="tab=' + hashTab + '"]')
      if ($hashTab.length) {
        $hashTab.addClass('nav-tab-active')
        $('.nav-tab').not($hashTab).removeClass('nav-tab-active')
        $('.fluid-design-system-form-page').hide()
        $('#tab-' + hashTab).show()
        return
      }
    }

    // Ensure the current tab is properly activated
    const $currentTab = $('.nav-tab[href*="tab=' + currentTab + '"]')
    if ($currentTab.length) {
      $currentTab.addClass('nav-tab-active')
      $('.nav-tab').not($currentTab).removeClass('nav-tab-active')
      $('.fluid-design-system-form-page').hide()
      $('#tab-' + currentTab).show()
    }
  }

  /**
   * Initialize form validation
   */
  function initFormValidation() {
    // Add required field validation (use event delegation)
    $(document).on('submit', 'form', function (e) {
      const $form = $(this)
      let isValid = true

      $form.find('[required]').each(function () {
        const $field = $(this)
        if (!$field.val().trim()) {
          $field.addClass('error')
          isValid = false
        } else {
          $field.removeClass('error')
        }
      })

      if (!isValid) {
        e.preventDefault()
      }
    })

    // Remove error class on input (use event delegation)
    $(document).on('input', '[required]', function () {
      $(this).removeClass('error')
    })
  }

  /**
   * Initialize save changes highlight functionality
   */
  function initSaveChangesHighlight() {
    let hasChanges = false

    // Monitor form changes that actually require "Save Changes"
    // Exclude AJAX-handled inputs (inline editing inputs)
    // Use event delegation to handle dynamically added form elements
    $(document).on(
      'change input',
      'form input:not(.title-input):not(.description-input):not(.add-title-input):not(.add-description-input), form textarea, form select',
      function () {
        // Skip if this is an AJAX operation
        if ($('body').hasClass('ajax-operation-pending')) {
          return
        }

        if (!hasChanges) {
          hasChanges = true
          // Add class to body to trigger CSS animation for Save Changes button only
          $('body').addClass('has-unsaved-changes')

          // Show unsaved changes status
          if (window.FluidDesignSystemAdmin && window.FluidDesignSystemAdmin.ajax) {
            window.FluidDesignSystemAdmin.statusNotices.showUnsavedChanges()
          }
        }
      }
    )

    // Reset on form submit (use event delegation)
    $(document).on('submit', 'form', function () {
      // Update form data from temporary groups before submission
      updateFormDataFromTempGroups()

      hasChanges = false
      $('body').removeClass('has-unsaved-changes')

      // Hide unsaved changes status
      if (window.FluidDesignSystemAdmin && window.FluidDesignSystemAdmin.ajax) {
        window.FluidDesignSystemAdmin.ajax.hideStatus()
      }
    })

    // Also reset when AJAX operations complete successfully
    $(document).on('ajaxSuccess', function () {
      // Only reset for non-destructive operations that don't require save
      if (!$('body').hasClass('ajax-operation-pending')) {
        hasChanges = false
        $('body').removeClass('has-unsaved-changes')

        // Only hide status if it's currently showing a warning (unsaved changes)
        // Don't hide success/error messages - let them auto-hide after their timeout
        if (window.FluidDesignSystemAdmin && window.FluidDesignSystemAdmin.ajax) {
          const $statusArea = $('.fluid-status-area')
          if ($statusArea.hasClass('warning')) {
            window.FluidDesignSystemAdmin.ajax.hideStatus()
          }
        }
      }
    })
  }

  /**
   * Initialize AJAX Save Changes functionality
   */
  function initSaveChangesAjax() {
    // Handle Save Changes button click
    $(document).on('click', '#fluid-groups-form input[name="save_changes"]', function (e) {
      e.preventDefault()

      const $button = $(this)
      const $form = $('#fluid-groups-form')

      // Prevent multiple concurrent save operations
      if ($button.prop('disabled') || $('body').hasClass('ajax-operation-pending')) {
        return
      }

      // Update form data from temporary groups before sending
      updateFormDataFromTempGroups()

      // Collect all form data
      const formData = {}
      const serializedData = $form.serializeArray()

      // Convert serialized data to object
      serializedData.forEach((field) => {
        if (formData[field.name]) {
          // Handle multiple values (arrays)
          if (!Array.isArray(formData[field.name])) {
            formData[field.name] = [formData[field.name]]
          }
          formData[field.name].push(field.value)
        } else {
          formData[field.name] = field.value
        }
      })

      // Use AJAX to save changes
      if (window.FluidDesignSystemAdmin && window.FluidDesignSystemAdmin.ajax) {
        window.FluidDesignSystemAdmin.ajax.saveAllChanges(
          formData,
          // Success callback
          function (response) {
            // Tables are automatically updated by ajax-manager.js with HTML refresh

            // Reset unsaved changes state
            $('body').removeClass('has-unsaved-changes')
            $button.removeClass('button-primary-highlight')

            // Clear any "marked-for-deletion" classes (they're gone now)
            $('.marked-for-deletion').removeClass('marked-for-deletion')

            // Show success message with stats
            const message = response.message || 'Changes saved successfully.'
            if (window.FluidDesignSystemAdmin.statusNotices) {
              window.FluidDesignSystemAdmin.statusNotices.showSuccess(message)
            }
          },
          // Error callback
          function (errorData) {
            // Show error message
            const message =
              errorData.message ||
              fluidDesignSystemAdmin.strings.saveError ||
              'Failed to save changes. Please try again.'
            if (window.FluidDesignSystemAdmin.statusNotices) {
              window.FluidDesignSystemAdmin.statusNotices.showError(message)
            }

            // Fall back to form submission on critical error
            $form.off('submit.ajax').submit()
          }
        )
      } else {
        // Fallback to regular form submission if AJAX is not available
        $form.off('submit').submit()
      }
    })
  }

  /**
   * Initialize delete handlers
   */
  function initDeleteHandlers() {
    // Handle delete button clicks
    $(document).on('click', '.fluid-delete-group', function (e) {
      e.preventDefault()

      const $button = $(this)
      const $row = $button.closest('tr')
      const groupId = $row.data('group-id')
      const groupName = $row.find('.title-text').text().trim()
      const presetCount = parseInt($row.find('.column-presets').text()) || 0

      // Skip confirmation if group has no presets
      if (presetCount === 0) {
        markRowForDeletion($row, groupId, groupName)
        return
      }

      // Show confirmation for groups with presets
      const confirmTemplate =
        fluidDesignSystemAdmin.strings.deleteGroupConfirm ||
        'Are you sure you want to delete "%s"?\n\nThis group contains %d preset%s that will be permanently removed.'
      const pluralText = presetCount !== 1 ? 's' : ''

      // Handle WordPress-style placeholders (%1$s, %2$d, %3$s) first, then fallback to simple ones
      let confirmMessage = confirmTemplate
        .replace('%1$s', groupName)
        .replace('%2$d', presetCount.toString())
        .replace('%3$s', pluralText)

      // If WordPress-style placeholders weren't used, try simple placeholders
      // (but only if the message still contains placeholders)
      if (confirmMessage.includes('%s') || confirmMessage.includes('%d')) {
        confirmMessage = confirmMessage
          .replace('%s', groupName)
          .replace('%d', presetCount.toString())
          .replace('%s', pluralText)
      }

      // Decode HTML entities and convert \n to actual newlines
      confirmMessage = decodeHtmlString(confirmMessage)

      if (confirm(confirmMessage)) {
        markRowForDeletion($row, groupId, groupName)
      }
    })

    // Handle undo delete
    $(document).on('click', '.undo-delete', function (e) {
      e.preventDefault()

      const $button = $(this)
      const $row = $button.closest('tr')

      unmarkRowForDeletion($row)
    })

    // Handle temporary group deletion
    $(document).on('click', '.temp-delete-group', function (e) {
      e.preventDefault()

      const $button = $(this)
      const tempId = $button.data('temp-id')

      handleTempGroupDelete(tempId)
    })
  }

  /**
   * Mark a row for deletion (visual feedback, no actual deletion yet)
   */
  function markRowForDeletion($row, groupId, groupName) {
    // Add hidden input to track deletion
    $('<input>')
      .attr('type', 'hidden')
      .attr('name', 'delete_groups[]')
      .attr('value', groupId)
      .appendTo('#fluid-groups-form')

    // Add deletion state class and animate
    $row.addClass('marked-for-deletion')

    // Disable sortable for this row
    if ($('#fluid-groups-tbody').hasClass('ui-sortable')) {
      $('#fluid-groups-tbody').sortable('option', 'cancel', '.marked-for-deletion')
    }

    // Replace delete button with undo button
    const $actionsCell = $row.find('.column-actions')
    const originalActions = $actionsCell.html()
    $actionsCell.data('original-actions', originalActions)

    $actionsCell.html(`
      <span class="deletion-notice">
        <button type="button" class="button-link undo-delete" title="${fluidDesignSystemAdmin.strings.undoDeletion}">
          <span class="dashicons dashicons-undo"></span>
        </button>
      </span>
    `)

    // Update order numbers for remaining sortable rows
    if (window.FluidDesignSystemAdmin && window.FluidDesignSystemAdmin.sortable) {
      window.FluidDesignSystemAdmin.sortable.updateOrderNumbers()
    }

    // Trigger change to highlight save button
    $('#fluid-groups-form input[name="save_changes"]').trigger('change')

    // No need for deletion help - the UI is clear with the visual feedback
  }

  /**
   * Unmark a row for deletion
   */
  function unmarkRowForDeletion($row) {
    const groupId = $row.data('group-id')

    // Remove hidden deletion input
    $(`#fluid-groups-form input[name="delete_groups[]"][value="${groupId}"]`).remove()

    // Remove deletion state
    $row.removeClass('marked-for-deletion')

    // Re-enable sortable for all rows
    if ($('#fluid-groups-tbody').hasClass('ui-sortable')) {
      $('#fluid-groups-tbody').sortable('option', 'cancel', '')
    }

    // Restore original actions
    const $actionsCell = $row.find('.column-actions')
    const originalActions = $actionsCell.data('original-actions')
    $actionsCell.html(originalActions)

    // Update order numbers for all sortable rows
    if (window.FluidDesignSystemAdmin && window.FluidDesignSystemAdmin.sortable) {
      window.FluidDesignSystemAdmin.sortable.updateOrderNumbers()
    }

    // Trigger change to highlight save button
    $('#fluid-groups-form input[name="save_changes"]').trigger('change')
  }

  /**
   * Initialize inline add group functionality
   * Note: All event listeners use delegation so they work with dynamically replaced content
   */
  function initInlineAddGroup() {
    // Use event delegation for add group functionality to handle dynamic content
    // Click on the editable title or description to start adding
    $(document).on(
      'click',
      '#inline-add-row .editable-add-title, #inline-add-row .editable-add-description',
      function (e) {
        e.stopPropagation()
        startInlineAdd()
      }
    )

    $(document).on('click', '#inline-add-row', function (e) {
      const $addRow = $(this)
      if (!$(e.target).is('input, button') && !$addRow.hasClass('editing')) {
        startInlineAdd()
      }
    })

    // Handle input events with auto-sizing
    $(document).on('keydown', '#inline-add-row .add-title-input', function (e) {
      const $addRow = $('#inline-add-row')
      if (e.key === 'Enter') {
        e.preventDefault()
        // Move to description field
        $addRow.find('.add-description-input').focus()
      } else if (e.key === 'Escape') {
        cancelInlineAdd()
      }
    })

    $(document).on('input', '#inline-add-row .add-title-input', function () {
      const $input = $(this)
      const $addRow = $('#inline-add-row')
      autoSizeAddInput($input, $addRow.find('.add-title-text'))

      // Check for duplicates in real-time and highlight them
      const currentValue = $input.val().trim()
      if (currentValue && isGroupNameTaken(currentValue)) {
        // Show duplicate warning in status area
        if (
          window.FluidDesignSystemAdmin &&
          window.FluidDesignSystemAdmin.statusNotices &&
          window.FluidDesignSystemAdmin.statusNotices.showValidationFeedback
        ) {
          window.FluidDesignSystemAdmin.statusNotices.showValidationFeedback('duplicateDetected', {
            name: currentValue
          })
        }
        highlightDuplicateTitles(currentValue)
      } else {
        // Clear duplicate feedback and highlights
        if (
          window.FluidDesignSystemAdmin &&
          window.FluidDesignSystemAdmin.statusNotices &&
          window.FluidDesignSystemAdmin.statusNotices.clearValidationFeedback
        ) {
          window.FluidDesignSystemAdmin.statusNotices.clearValidationFeedback()
        }
        clearDuplicateHighlights()
      }
    })

    $(document).on('keydown', '#inline-add-row .add-description-input', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault()
        saveInlineAdd()
      } else if (e.key === 'Escape') {
        cancelInlineAdd()
      }
    })

    $(document).on('input', '#inline-add-row .add-description-input', function () {
      const $addRow = $('#inline-add-row')
      autoSizeAddInput($(this), $addRow.find('.add-description-text'))
    })

    // Handle blur events to auto-cancel if both fields are empty
    $(document).on(
      'blur',
      '#inline-add-row .add-title-input, #inline-add-row .add-description-input',
      function () {
        const $addRow = $('#inline-add-row')
        // Use a timeout to allow for the possibility of focusing the other input
        setTimeout(() => {
          // Check if focus has moved outside both inputs
          const $focusedElement = $(document.activeElement)
          const isWithinAddRow = $focusedElement.closest('#inline-add-row').length > 0

          if (!isWithinAddRow && $addRow.hasClass('editing')) {
            // Check if both fields are empty
            const titleValue = $addRow.find('.add-title-input').val().trim()
            const descriptionValue = $addRow.find('.add-description-input').val().trim()

            if (!titleValue && !descriptionValue) {
              // Both fields are empty, cancel editing
              cancelInlineAdd()
            }
          }
        }, 1) // Small delay to allow focus to settle
      }
    )

    // Handle save and cancel buttons
    $(document).on('click', '#inline-add-row .add-group-save', function (e) {
      e.preventDefault()
      e.stopPropagation()
      saveInlineAdd()
    })

    $(document).on('click', '#inline-add-row .add-group-cancel', function (e) {
      e.preventDefault()
      e.stopPropagation()
      cancelInlineAdd()
    })
  }

  /**
   * Start inline add mode - show both inputs at once
   */
  function startInlineAdd() {
    const $addRow = $('#inline-add-row')

    if ($addRow.hasClass('editing')) {
      return
    }

    $addRow.addClass('editing')

    // Add table editing mode class to body for CSS targeting
    $('body').addClass('table-editing-mode')

    // Disable sortable functionality
    const $tbody = $('#fluid-groups-tbody')
    if ($tbody.hasClass('ui-sortable')) {
      $tbody.sortable('disable')
    }

    // Switch to editing mode for both title and description
    const $titleElement = $addRow.find('.editable-add-title')
    const $descriptionElement = $addRow.find('.editable-add-description')
    const $titleInput = $addRow.find('.add-title-input')
    const $descriptionInput = $addRow.find('.add-description-input')

    $titleElement.addClass('editing')
    $descriptionElement.addClass('editing')

    // Auto-size both inputs
    autoSizeAddInput($titleInput, $addRow.find('.add-title-text'))
    autoSizeAddInput($descriptionInput, $addRow.find('.add-description-text'))

    // Focus on name input
    $titleInput.focus()
  }

  /**
   * Auto-size input field for add row
   */
  function autoSizeAddInput($input, $textElement) {
    // Create a temporary element to measure text width
    const $measurer = $('<span>')
      .css({
        position: 'absolute',
        visibility: 'hidden',
        whiteSpace: 'nowrap',
        fontSize: $textElement ? $textElement.css('fontSize') : $input.css('fontSize'),
        fontFamily: $textElement ? $textElement.css('fontFamily') : $input.css('fontFamily'),
        fontWeight: $textElement ? $textElement.css('fontWeight') : $input.css('fontWeight'),
        letterSpacing: $textElement
          ? $textElement.css('letterSpacing')
          : $input.css('letterSpacing'),
        padding: '0',
        margin: '0',
        border: 'none'
      })
      .text($input.val() || $input.attr('placeholder') || '')
      .appendTo('body')

    // Get the measured width
    const textWidth = $measurer.width()
    $measurer.remove()

    // Get container constraints
    const $container = $input.closest('td')
    const containerWidth = $container.width()

    // Account for input padding/border in our calculations
    const inputPadding =
      parseInt($input.css('padding-left')) + parseInt($input.css('padding-right'))
    const inputBorder =
      parseInt($input.css('border-left-width')) + parseInt($input.css('border-right-width'))
    const inputExtras = inputPadding + inputBorder

    const minWidth = 120 // Minimum width in pixels
    const maxWidth = containerWidth * 0.95 // 95% of container width
    const extraSpace = 20 // Extra space for comfortable editing

    // Calculate optimal width including padding and borders
    let optimalWidth = Math.max(textWidth + extraSpace + inputExtras, minWidth)
    optimalWidth = Math.min(optimalWidth, maxWidth)

    // Apply the width
    $input.css('width', optimalWidth + 'px')
  }

  /**
   * Cancel inline add mode
   */
  function cancelInlineAdd() {
    const $addRow = $('#inline-add-row')
    const $titleElement = $addRow.find('.editable-add-title')
    const $descriptionElement = $addRow.find('.editable-add-description')
    const $titleInput = $addRow.find('.add-title-input')
    const $descriptionInput = $addRow.find('.add-description-input')

    $addRow.removeClass('editing')
    $titleElement.removeClass('editing validation-error')
    $descriptionElement.removeClass('editing validation-error')

    // Remove table editing mode class from body
    $('body').removeClass('table-editing-mode')

    // Re-enable sortable functionality
    const $tbody = $('#fluid-groups-tbody')
    if ($tbody.hasClass('ui-sortable')) {
      $tbody.sortable('enable')
    }

    // Clear inputs
    $titleInput.val('')
    $descriptionInput.val('')

    // Clear any duplicate highlights
    clearDuplicateHighlights()
  }

  /**
   * Sanitize input to prevent XSS attacks
   */
  function sanitizeInput(input) {
    // Remove HTML tags and dangerous characters
    return input
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[<>"'&]/g, '') // Remove dangerous characters
      .trim()
  }

  /**
   * Save inline add
   */
  function saveInlineAdd() {
    const $addRow = $('#inline-add-row')
    const $titleElement = $addRow.find('.editable-add-title')
    const $descriptionElement = $addRow.find('.editable-add-description')
    const $titleInput = $addRow.find('.add-title-input')
    const $descriptionInput = $addRow.find('.add-description-input')

    const groupName = $titleInput.val().trim()
    const groupDescription = $descriptionInput.val().trim()

    if (!groupName) {
      // Show visual error for empty name (shake animation only)
      $titleElement.addClass('validation-error')
      $titleInput.focus().select()

      // Show helpful error message in status area
      if (
        window.FluidDesignSystemAdmin &&
        window.FluidDesignSystemAdmin.statusNotices &&
        window.FluidDesignSystemAdmin.statusNotices.showValidationFeedback
      ) {
        window.FluidDesignSystemAdmin.statusNotices.showValidationFeedback('emptyTitle')
      }

      // Remove error state after a short delay
      setTimeout(() => {
        $titleElement.removeClass('validation-error')
      }, 2000)

      return
    }

    // Sanitize input to prevent XSS attacks
    const sanitizedGroupName = sanitizeInput(groupName)
    const sanitizedGroupDescription = sanitizeInput(groupDescription)

    // Check if sanitization changed the input (potential XSS attempt)
    if (sanitizedGroupName !== groupName || sanitizedGroupDescription !== groupDescription) {
      // Determine which field(s) have invalid characters
      const titleHasInvalidChars = sanitizedGroupName !== groupName
      const descriptionHasInvalidChars = sanitizedGroupDescription !== groupDescription

      // Highlight the appropriate field(s)
      let $targetElement, $targetInput
      if (titleHasInvalidChars) {
        $targetElement = $titleElement
        $targetInput = $titleInput
        $titleElement.addClass('validation-error')
        $titleInput.focus().select()
      }
      if (descriptionHasInvalidChars) {
        $targetElement = $descriptionElement
        $targetInput = $descriptionInput
        $descriptionElement.addClass('validation-error')
        if (!titleHasInvalidChars) {
          // Only focus description if title is not also invalid
          $descriptionInput.focus().select()
        }
      }

      // Show helpful error message in status area
      if (
        window.FluidDesignSystemAdmin &&
        window.FluidDesignSystemAdmin.statusNotices &&
        window.FluidDesignSystemAdmin.statusNotices.showValidationFeedback
      ) {
        // Use specific message based on which field(s) have invalid characters
        if (titleHasInvalidChars && descriptionHasInvalidChars) {
          // Both fields have issues - use generic message
          window.FluidDesignSystemAdmin.statusNotices.showValidationFeedback('invalidCharacters')
        } else if (titleHasInvalidChars) {
          // Only title has issues
          window.FluidDesignSystemAdmin.statusNotices.showValidationFeedback(
            'invalidCharactersTitle'
          )
        } else {
          // Only description has issues
          window.FluidDesignSystemAdmin.statusNotices.showValidationFeedback(
            'invalidCharactersDescription'
          )
        }
      }

      // Remove error state after a short delay
      setTimeout(() => {
        if (titleHasInvalidChars) {
          $titleElement.removeClass('validation-error')
        }
        if (descriptionHasInvalidChars) {
          $descriptionElement.removeClass('validation-error')
        }
      }, 2000)

      return
    }

    // Check for duplicate name
    if (isGroupNameTaken(sanitizedGroupName)) {
      // Show visual error (shake animation only)
      $titleElement.addClass('validation-error')
      $titleInput.focus().select()

      // Show helpful error message in status area
      if (
        window.FluidDesignSystemAdmin &&
        window.FluidDesignSystemAdmin.statusNotices &&
        window.FluidDesignSystemAdmin.statusNotices.showValidationFeedback
      ) {
        window.FluidDesignSystemAdmin.statusNotices.showValidationFeedback('duplicateTitle', {
          name: sanitizedGroupName
        })
      }

      // Highlight the existing duplicate title(s)
      highlightDuplicateTitles(sanitizedGroupName)

      // Remove error state after a short delay
      setTimeout(() => {
        $titleElement.removeClass('validation-error')
        clearDuplicateHighlights()
      }, 3000)

      return
    }

    // Convert add row to regular row temporarily - use sanitized values
    convertAddRowToRegular($addRow, sanitizedGroupName, sanitizedGroupDescription)

    // Update form data from all temporary groups in the DOM
    updateFormDataFromTempGroups()

    // Trigger save highlight
    $('#fluid-groups-form input[name="save_changes"]').trigger('change')
  }

  /**
   * Check if group name is already taken
   */
  function isGroupNameTaken(name, excludeId = null) {
    const normalizedName = name.toLowerCase().trim()
    let nameTaken = false

    // Check ALL existing rows in the table (built-in, custom, and temporary)
    $('#fluid-groups-tbody tr').each(function () {
      const $row = $(this)

      // Skip the add row itself
      if ($row.hasClass('inline-add-row')) {
        return true // Continue to next iteration
      }

      // Skip the row we're currently editing (if excludeId is provided)
      if (excludeId && $row.data('group-id') == excludeId) {
        return true // Continue to next iteration
      }

      let existingName = ''

      // Look for the title text - all rows should have .title-text
      const $titleText = $row.find('.title-text')
      if ($titleText.length) {
        existingName = $titleText.text().toLowerCase().trim()
      } else {
        // Fallback: look for any strong element in name column
        const $strongText = $row.find('.column-name strong')
        if ($strongText.length) {
          existingName = $strongText.text().toLowerCase().trim()
        }
      }

      if (existingName && existingName === normalizedName) {
        nameTaken = true
        return false // Break out of each loop
      }
    })

    return nameTaken
  }

  /**
   * Convert add row to temporary regular row
   */
  function convertAddRowToRegular($addRow, groupName, groupDescription) {
    const nextOrder = $('#fluid-groups-tbody tr.sortable-row').length + 1
    const tempId = Date.now()

    // Escape HTML to prevent XSS
    const escapeHtml = (text) => {
      const div = document.createElement('div')
      div.textContent = text
      return div.innerHTML
    }

    const escapedGroupName = escapeHtml(groupName)
    const escapedGroupDescription = escapeHtml(groupDescription || '')
    const escapedGroupNameAttr = groupName.replace(/"/g, '&quot;')
    const escapedGroupDescriptionAttr = (groupDescription || '').replace(/"/g, '&quot;')

    // Create a temporary row
    const $tempRow = $(`
      <tr class="sortable-row temp-new-group" data-temp-group="true" data-group-id="temp_${tempId}">
        <td class="column-order">
          <span class="order-number order-draggable">${nextOrder}</span>
          <input type="hidden" name="group_order[]" value="temp_${tempId}">
        </td>
        <td class="column-name">
          <strong class="editable-title" data-editable="true">
            <span class="title-text">${escapedGroupName}</span>
            <input type="text" class="title-input" style="display: none;">
          </strong>
          <input type="hidden" name="group_titles[temp_${tempId}]" value="${escapedGroupNameAttr}">
        </td>
        <td class="column-description">
          <span class="editable-description" data-original-description="${escapedGroupDescriptionAttr}">
            <span class="description-text">${escapedGroupDescription}</span>
            <input type="text" class="description-input" style="display: none;">
          </span>
          <input type="hidden" name="group_descriptions[temp_${tempId}]" value="${escapedGroupDescriptionAttr}">
        </td>
        <td class="column-type">
          <span class="group-type-badge group-type-custom">CUSTOM</span>
        </td>
        <td class="column-presets">0</td>
        <td class="column-actions">
          <button type="button" class="button-link temp-delete-group" title="Delete group" data-temp-id="${tempId}">
            <span class="dashicons dashicons-trash"></span>
          </button>
        </td>
      </tr>
    `)

    // Insert before the add row
    $addRow.before($tempRow)

    // Reset add row
    cancelInlineAdd()

    // Update sortable to include new row
    if ($('#fluid-groups-tbody').hasClass('ui-sortable')) {
      $('#fluid-groups-tbody').sortable('refresh')
    }

    // Update order numbers
    if (window.FluidDesignSystemAdmin && window.FluidDesignSystemAdmin.sortable) {
      window.FluidDesignSystemAdmin.sortable.updateOrderNumbers()
    }
  }

  /**
   * Update form data from all temporary groups in the DOM
   */
  function updateFormDataFromTempGroups() {
    const $form = $('#fluid-groups-form')

    // Remove any existing new group inputs and position data
    $form.find('input[name^="new_groups"]').remove()
    $form.find('input[name="temp_group_mapping"]').remove()
    $form.find('input[name="temp_group_positions"]').remove()

    // Collect all temporary groups from the DOM in their current order
    const tempGroups = []
    const tempGroupMapping = {} // Map tempId to index in new_groups arrays (for group creation)
    const tempGroupPositions = {} // Map tempId to position in full group order (for order reconstruction)

    $('#fluid-groups-tbody tr.sortable-row').each(function (index) {
      const $row = $(this)
      if ($row.data('temp-group')) {
        const name = $row.find('input[name^="group_titles"]').val() || ''
        const description = $row.find('input[name^="group_descriptions"]').val() || ''
        const tempId = $row.data('group-id')

        if (name.trim()) {
          const newGroupIndex = tempGroups.length
          tempGroups.push({
            name: name.trim(),
            description: description.trim(),
            tempId: tempId,
            position: index // DOM position among all sortable rows
          })

          // Map temporary ID to the index in the new_groups arrays (for creation)
          tempGroupMapping[tempId] = newGroupIndex
          // Map temporary ID to its position in the full group order (for order reconstruction)
          tempGroupPositions[tempId] = index
        }
      }
    })

    // Add all temporary groups to form data
    tempGroups.forEach((group) => {
      $('<input>')
        .attr('type', 'hidden')
        .attr('name', 'new_groups[name][]')
        .val(group.name)
        .appendTo($form)

      $('<input>')
        .attr('type', 'hidden')
        .attr('name', 'new_groups[description][]')
        .val(group.description)
        .appendTo($form)
    })

    // Add mapping data for group creation (maps temp IDs to array indices)
    if (Object.keys(tempGroupMapping).length > 0) {
      $('<input>')
        .attr('type', 'hidden')
        .attr('name', 'temp_group_mapping')
        .val(JSON.stringify(tempGroupMapping))
        .appendTo($form)
    }

    // Add position data for order reconstruction (maps temp IDs to positions in full order)
    if (Object.keys(tempGroupPositions).length > 0) {
      $('<input>')
        .attr('type', 'hidden')
        .attr('name', 'temp_group_positions')
        .val(JSON.stringify(tempGroupPositions))
        .appendTo($form)
    }
  }

  /**
   * Handle temporary group deletion
   */
  function handleTempGroupDelete(tempId) {
    // Look for the row using data-group-id since that's how temporary rows are identified
    const $tempRow = $(`tr[data-group-id="temp_${tempId}"]`)

    if ($tempRow.length === 0) {
      return
    }

    // Remove the row
    $tempRow.remove()

    // Update form data from remaining temporary groups
    updateFormDataFromTempGroups()

    // Update order numbers
    if (window.FluidDesignSystemAdmin && window.FluidDesignSystemAdmin.sortable) {
      window.FluidDesignSystemAdmin.sortable.updateOrderNumbers()
    }

    // Don't trigger change for temporary group deletion - they were never saved
    // Only trigger if there are actual changes that need saving
  }

  /**
   * Highlight existing titles that match the duplicated name
   */
  function highlightDuplicateTitles(name) {
    const normalizedName = name.toLowerCase().trim()

    // Clear any existing highlights first
    clearDuplicateHighlights()

    // Find all rows with matching titles
    $('#fluid-groups-tbody tr').each(function () {
      const $row = $(this)

      // Skip the add row itself
      if ($row.hasClass('inline-add-row')) {
        return true // Continue to next iteration
      }

      // Get the title text from the row - look for .title-text directly since both
      // built-in and custom groups have this class (built-in groups don't have .editable-title)
      const $titleElement = $row.find('.title-text')
      if ($titleElement.length) {
        const rowTitle = $titleElement.text().toLowerCase().trim()
        if (rowTitle === normalizedName) {
          $row.addClass('duplicate-highlight')
        }
      }
    })
  }

  /**
   * Clear all duplicate title highlights
   */
  function clearDuplicateHighlights() {
    $('#fluid-groups-tbody tr').removeClass('duplicate-highlight')
  }

  /**
   * Utility function to debounce function calls
   */
  function debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  // Public API
  window.FluidDesignSystemAdmin = window.FluidDesignSystemAdmin || {}
  window.FluidDesignSystemAdmin.base = {
    init: init,
    debounce: debounce,
    decodeHtmlString: decodeHtmlString,
    sanitizeInput: sanitizeInput,
    markRowForDeletion: markRowForDeletion,
    unmarkRowForDeletion: unmarkRowForDeletion,
    startInlineAdd: startInlineAdd,
    autoSizeAddInput: autoSizeAddInput,
    cancelInlineAdd: cancelInlineAdd,
    saveInlineAdd: saveInlineAdd,
    isGroupNameTaken: isGroupNameTaken,
    handleTempGroupDelete: handleTempGroupDelete,
    highlightDuplicateTitles: highlightDuplicateTitles,
    clearDuplicateHighlights: clearDuplicateHighlights,
    updateFormDataFromTempGroups: updateFormDataFromTempGroups,
    initInlineAddGroup: initInlineAddGroup
  }

  // Initialize when DOM is ready
  $(document).ready(init)
})(jQuery)
