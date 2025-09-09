/**
 * Inline editing functionality for Fluid Design System Admin
 *
 * @package Arts\FluidDesignSystem
 * @since 1.0.0
 */

;(function ($) {
  'use strict'

  /**
   * Initialize inline editing functionality
   */
  function init() {
    initInlineEditing()
  }

  /**
   * Auto-size input field based on content
   */
  function autoSizeInput($input, $textElement) {
    // Create a temporary element to measure text width
    const $measurer = $('<span>')
      .css({
        position: 'absolute',
        visibility: 'hidden',
        whiteSpace: 'nowrap',
        fontSize: $textElement.css('fontSize'),
        fontFamily: $textElement.css('fontFamily'),
        fontWeight: $textElement.css('fontWeight'),
        letterSpacing: $textElement.css('letterSpacing'),
        padding: '0',
        margin: '0',
        border: 'none'
      })
      .text($input.val() || $textElement.text())
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

    const minWidth = 120 // Minimum width in pixels (updated to match CSS)
    const maxWidth = containerWidth * 0.95 // 95% of container width
    const extraSpace = 20 // Extra space for comfortable editing

    // Calculate optimal width including padding and borders
    let optimalWidth = Math.max(textWidth + extraSpace + inputExtras, minWidth)
    optimalWidth = Math.min(optimalWidth, maxWidth)

    // Apply the width
    $input.css('width', optimalWidth + 'px')
  }

  /**
   * Initialize inline editing
   */
  function initInlineEditing() {
    // Click on editable title
    $(document).on('click', '.editable-title', function (e) {
      startEdit($(this), 'title', e)
    })

    // Click on editable description
    $(document).on('click', '.editable-description', function (e) {
      startEdit($(this), 'description', e)
    })
  }

  /**
   * Start editing an element (title or description)
   */
  function startEdit($element, type, e) {
    // Skip if already editing
    if ($element.hasClass('editing')) {
      return
    }

    // Skip if row is marked for deletion
    const $row = $element.closest('tr')
    if ($row.hasClass('marked-for-deletion')) {
      return
    }

    const isTitle = type === 'title'
    const $textElement = $element.find(isTitle ? '.title-text' : '.description-text')
    const $inputElement = $element.find(isTitle ? '.title-input' : '.description-input')
    const originalValue = isTitle
      ? $textElement.text()
      : $element.data('original-description') || ''
    const groupId = $element.closest('tr').data('group-id')

    // Set input value and update data attributes
    $inputElement.val(originalValue)
    $inputElement.attr('data-group-id', groupId)
    $inputElement.attr('data-field', type)

    // Store original value for comparison later
    $element.data('editing-original-value', originalValue)

    // Auto-size the input
    autoSizeInput($inputElement, $textElement)

    // Switch to editing mode
    $element.addClass('editing')
    $textElement.hide()
    $inputElement.show()

    // Focus and select text
    $inputElement.focus()
    setTimeout(function () {
      if ($inputElement.is(':focus')) {
        $inputElement.select()
      }
    }, 10)

    // No need for editing help - it's intuitive with modern UI patterns

    // Handle events
    $inputElement
      .off('.inline-edit')
      .on('keydown.inline-edit', function (e) {
        if (e.key === 'Enter') {
          saveInlineEdit($element, $inputElement)
          e.preventDefault()
        } else if (e.key === 'Escape') {
          cancelInlineEdit($element)
          e.preventDefault()
        }
      })
      .on('input.inline-edit', function () {
        autoSizeInput($inputElement, $textElement)

        // For title editing, check for duplicates in real-time and highlight them
        if (isTitle) {
          const currentValue = $inputElement.val().trim()
          const currentRowId = $element.closest('tr').data('group-id')

          if (
            currentValue &&
            window.FluidDesignSystemAdmin &&
            window.FluidDesignSystemAdmin.base &&
            window.FluidDesignSystemAdmin.base.isGroupNameTaken
          ) {
            const isDuplicate = window.FluidDesignSystemAdmin.base.isGroupNameTaken(
              currentValue,
              currentRowId
            )

            if (isDuplicate) {
              // Show duplicate warning in status area
              if (
                window.FluidDesignSystemAdmin.statusNotices &&
                window.FluidDesignSystemAdmin.statusNotices.showValidationFeedback
              ) {
                window.FluidDesignSystemAdmin.statusNotices.showValidationFeedback(
                  'duplicateDetected',
                  {
                    name: currentValue
                  }
                )
              }

              // Highlight existing duplicates
              if (window.FluidDesignSystemAdmin.base.highlightDuplicateTitles) {
                window.FluidDesignSystemAdmin.base.highlightDuplicateTitles(currentValue)
              }
            } else {
              // Clear duplicate feedback and highlights
              if (
                window.FluidDesignSystemAdmin.statusNotices &&
                window.FluidDesignSystemAdmin.statusNotices.clearValidationFeedback
              ) {
                window.FluidDesignSystemAdmin.statusNotices.clearValidationFeedback()
              }
              if (window.FluidDesignSystemAdmin.base.clearDuplicateHighlights) {
                window.FluidDesignSystemAdmin.base.clearDuplicateHighlights()
              }
            }
          } else if (currentValue === '') {
            // Clear everything when field is empty
            if (
              window.FluidDesignSystemAdmin.statusNotices &&
              window.FluidDesignSystemAdmin.statusNotices.clearValidationFeedback
            ) {
              window.FluidDesignSystemAdmin.statusNotices.clearValidationFeedback()
            }
            if (window.FluidDesignSystemAdmin.base.clearDuplicateHighlights) {
              window.FluidDesignSystemAdmin.base.clearDuplicateHighlights()
            }
          }
        }
      })
      .on('blur.inline-edit', function () {
        saveInlineEdit($element, $inputElement)
      })

    e.stopPropagation()
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
   * Save inline edit
   */
  function saveInlineEdit($element, $input) {
    const rawValue = $input.val().trim()
    const isTitle = $element.hasClass('editable-title')

    // Validate title input - cannot be empty
    if (isTitle && rawValue === '') {
      // Show error state (shake animation only)
      $element.addClass('validation-error')
      $input.focus().select()

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
        $element.removeClass('validation-error')
      }, 2000)

      return // Don't save empty title
    }

    // Sanitize input to prevent XSS attacks
    const sanitizedValue = sanitizeInput(rawValue)

    // Check if sanitization changed the input (potential XSS attempt)
    if (sanitizedValue !== rawValue) {
      // Show error state (shake animation only)
      $element.addClass('validation-error')
      $input.focus().select()

      // Show helpful error message in status area
      if (
        window.FluidDesignSystemAdmin &&
        window.FluidDesignSystemAdmin.statusNotices &&
        window.FluidDesignSystemAdmin.statusNotices.showValidationFeedback
      ) {
        const fieldType = isTitle ? 'Title' : 'Description'
        window.FluidDesignSystemAdmin.statusNotices.showValidationFeedback(
          `invalidCharacters${fieldType}`
        )
      }

      // Remove error state after a short delay
      setTimeout(() => {
        $element.removeClass('validation-error')
      }, 2000)

      return // Don't save potentially malicious input
    }

    // For titles, check for duplicates (excluding the current row)
    if (isTitle && sanitizedValue !== '') {
      const currentRowId = $element.closest('tr').data('group-id')
      if (
        window.FluidDesignSystemAdmin &&
        window.FluidDesignSystemAdmin.base &&
        window.FluidDesignSystemAdmin.base.isGroupNameTaken
      ) {
        // Check if another group (not this one) has the same name
        const isDuplicate = window.FluidDesignSystemAdmin.base.isGroupNameTaken(
          sanitizedValue,
          currentRowId
        )

        if (isDuplicate) {
          // Show error state (shake animation only)
          $element.addClass('validation-error')
          $input.focus().select()

          // Show helpful error message in status area
          if (
            window.FluidDesignSystemAdmin &&
            window.FluidDesignSystemAdmin.statusNotices &&
            window.FluidDesignSystemAdmin.statusNotices.showValidationFeedback
          ) {
            window.FluidDesignSystemAdmin.statusNotices.showValidationFeedback('duplicateTitle', {
              name: sanitizedValue
            })
          }

          // Highlight the existing duplicate title(s) if the function is available
          if (
            window.FluidDesignSystemAdmin &&
            window.FluidDesignSystemAdmin.base &&
            window.FluidDesignSystemAdmin.base.highlightDuplicateTitles
          ) {
            window.FluidDesignSystemAdmin.base.highlightDuplicateTitles(sanitizedValue)
          }

          // Remove error state and highlights after a short delay
          setTimeout(() => {
            $element.removeClass('validation-error')
            if (
              window.FluidDesignSystemAdmin &&
              window.FluidDesignSystemAdmin.base &&
              window.FluidDesignSystemAdmin.base.clearDuplicateHighlights
            ) {
              window.FluidDesignSystemAdmin.base.clearDuplicateHighlights()
            }
          }, 3000)

          return // Don't save duplicate title
        }
      }
    }

    const newValue = sanitizedValue
    const groupId = $element.closest('tr').data('group-id')
    const originalValue = $element.data('editing-original-value') || ''

    // Check if value actually changed
    if (newValue === originalValue) {
      // No change - just exit editing mode silently without sending AJAX request
      exitEditingMode($element)
      return
    }

    if (isTitle) {
      // Update UI optimistically
      const $titleText = $element.find('.title-text')
      const $hiddenInput = $element.closest('tr').find('input[name*="group_titles"]')
      const originalValue = $element.data('original-title') || $titleText.text()

      $titleText.text(newValue)
      if ($hiddenInput.length) {
        $hiddenInput.val(newValue).trigger('change')
      }

      // Send AJAX request to update the title
      if (window.FluidDesignSystemAdmin && window.FluidDesignSystemAdmin.ajax) {
        window.FluidDesignSystemAdmin.ajax.updateTitle(
          groupId,
          newValue,
          // Success callback
          function (response) {
            // Apply success feedback
            $element.addClass('success-feedback')

            // Show contextual success message
            if (
              window.FluidDesignSystemAdmin &&
              window.FluidDesignSystemAdmin.statusNotices &&
              window.FluidDesignSystemAdmin.statusNotices.showValidationFeedback
            ) {
              window.FluidDesignSystemAdmin.statusNotices.showValidationFeedback(
                'updatingSuccess',
                {
                  name: newValue
                }
              )
            }

            setTimeout(function () {
              $element.removeClass('success-feedback')
            }, 1000)
          },
          // Error callback
          function (errorData) {
            // Revert to original value on error
            $titleText.text(originalValue)
            if ($hiddenInput.length) {
              $hiddenInput.val(originalValue).trigger('change')
            }
            $element.addClass('error-feedback')
            setTimeout(function () {
              $element.removeClass('error-feedback')
            }, 2000)
          }
        )
      }
    } else {
      // Update UI optimistically
      const $descriptionText = $element.find('.description-text')
      const $hiddenInput = $element.closest('tr').find('input[name*="group_descriptions"]')
      const originalValue = $element.data('original-description') || ''

      $element.data('original-description', newValue)
      $descriptionText.text(newValue)
      if ($hiddenInput.length) {
        $hiddenInput.val(newValue).trigger('change')
      }

      // Send AJAX request to update the description
      if (window.FluidDesignSystemAdmin && window.FluidDesignSystemAdmin.ajax) {
        window.FluidDesignSystemAdmin.ajax.updateDescription(
          groupId,
          newValue,
          // Success callback
          function (response) {
            // Apply success feedback
            $element.addClass('success-feedback')

            // Show contextual success message
            if (
              window.FluidDesignSystemAdmin &&
              window.FluidDesignSystemAdmin.statusNotices &&
              window.FluidDesignSystemAdmin.statusNotices.showValidationFeedback
            ) {
              const groupName = $element.closest('tr').find('.title-text').text() || 'group'
              window.FluidDesignSystemAdmin.statusNotices.showValidationFeedback(
                'updatingSuccess',
                {
                  name: groupName
                }
              )
            }

            setTimeout(function () {
              $element.removeClass('success-feedback')
            }, 1000)
          },
          // Error callback
          function (errorData) {
            // Revert to original value on error
            $element.data('original-description', originalValue)
            $descriptionText.text(originalValue || '')
            if ($hiddenInput.length) {
              $hiddenInput.val(originalValue).trigger('change')
            }
            $element.addClass('error-feedback')
            setTimeout(function () {
              $element.removeClass('error-feedback')
            }, 2000)
          }
        )
      }
    }

    // Clear any duplicate highlights on successful save
    if (
      window.FluidDesignSystemAdmin &&
      window.FluidDesignSystemAdmin.base &&
      window.FluidDesignSystemAdmin.base.clearDuplicateHighlights
    ) {
      window.FluidDesignSystemAdmin.base.clearDuplicateHighlights()
    }

    // Exit editing mode
    exitEditingMode($element)
  }

  /**
   * Cancel inline edit
   */
  function cancelInlineEdit($element) {
    // Remove any error state when canceling
    $element.removeClass('validation-error')

    // Clear any duplicate highlights
    if (
      window.FluidDesignSystemAdmin &&
      window.FluidDesignSystemAdmin.base &&
      window.FluidDesignSystemAdmin.base.clearDuplicateHighlights
    ) {
      window.FluidDesignSystemAdmin.base.clearDuplicateHighlights()
    }

    exitEditingMode($element)
  }

  /**
   * Exit editing mode
   */
  function exitEditingMode($element) {
    const isTitle = $element.hasClass('editable-title')
    const $textElement = $element.find(isTitle ? '.title-text' : '.description-text')
    const $inputElement = $element.find(isTitle ? '.title-input' : '.description-input')

    $element.removeClass('editing')
    $inputElement.hide().off('.inline-edit')
    $textElement.show()

    // Clean up stored original value
    $element.removeData('editing-original-value')
  }

  // Public API
  window.FluidDesignSystemAdmin = window.FluidDesignSystemAdmin || {}
  window.FluidDesignSystemAdmin.inlineEditing = {
    init: init,
    startEdit: startEdit,
    autoSizeInput: autoSizeInput,
    sanitizeInput: sanitizeInput,
    saveInlineEdit: saveInlineEdit,
    cancelInlineEdit: cancelInlineEdit
  }

  // Initialize when DOM is ready
  $(document).ready(init)
})(jQuery)
