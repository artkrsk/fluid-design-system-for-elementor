/**
 * Status Notices functionality for Fluid Design System Admin
 *
 * @package Arts\FluidDesignSystem
 * @since 1.0.0
 */

;(function ($) {
  'use strict'

  // Global timeout tracking for status messages
  let statusTimeout = null

  // Default configuration
  const defaultConfig = {
    hideDelays: {
      loading: false, // Never auto-hide loading
      success: 5000,
      error: 8000, // Longer for errors
      warning: 7000,
      info: 7000
    },
    autoHide: {
      loading: false,
      success: true,
      error: true,
      warning: true,
      info: true
    },
    animations: {
      fadeIn: 300,
      fadeOut: 300
    }
  }

  /**
   * Show status message in the dedicated status area
   */
  function showStatus(type, message, options = {}) {
    let $statusArea = $('.fluid-status-area')

    // Clear any existing timeout to prevent conflicts
    clearStatusTimeout()

    // Status area should be pre-rendered in PHP
    if ($statusArea.length === 0) {
      $statusArea = createStatusArea()
    }

    // Map error type to is-error class to avoid WordPress conflicts
    const cssClass = type === 'error' ? 'is-error' : type

    // Clear existing content and state
    $statusArea.removeClass('hidden loading success is-error warning info').addClass(cssClass)

    // Clear any inline styles that might interfere
    $statusArea.removeAttr('style')

    // Set content based on type with unified icons
    setStatusContent($statusArea, type, message)

    // Handle auto-hide timing with proper timeout management
    handleAutoHide(type, options)
  }

  /**
   * Create status area dynamically if not found
   */
  function createStatusArea() {
    const $statusArea = $('<div class="fluid-status-area hidden"></div>')
    const $container = $('.fluid-save-changes-row')

    if ($container.length === 0) {
      // Fallback: append to form or main container
      const $fallback = $('#fluid-groups-form, .fluid-design-system-form-page').first()
      $fallback.prepend($statusArea)
    } else {
      $container.append($statusArea)
    }

    return $statusArea
  }

  /**
   * Set status content based on type
   */
  function setStatusContent($statusArea, type, message) {
    const iconMap = {
      loading: '<div class="spinner is-active"></div>',
      success: '<div class="fluid-status-icon success"></div>',
      error: '<div class="fluid-status-icon is-error"></div>',
      warning: '<div class="fluid-status-icon warning"></div>',
      info: '<div class="fluid-status-icon info"></div>'
    }

    const icon = iconMap[type] || ''
    $statusArea.html(`${icon}<span>${message}</span>`)
  }

  /**
   * Handle auto-hide timing
   */
  function handleAutoHide(type, options) {
    const config = { ...defaultConfig.autoHide, ...options }

    if (config.autoHide !== false && defaultConfig.autoHide[type] !== false) {
      const hideDelay = options.hideDelay || defaultConfig.hideDelays[type]

      if (hideDelay) {
        statusTimeout = setTimeout(() => {
          hideStatus()
          statusTimeout = null
        }, hideDelay)
      }
    }
  }

  /**
   * Clear status timeout
   */
  function clearStatusTimeout() {
    if (statusTimeout) {
      clearTimeout(statusTimeout)
      statusTimeout = null
    }
  }

  /**
   * Hide status area
   */
  function hideStatus() {
    clearStatusTimeout()

    const $statusArea = $('.fluid-status-area')

    // Add hidden class with smooth transition
    $statusArea.addClass('hidden')

    // Remove all status type classes to reset state
    $statusArea.removeClass('loading success is-error warning info')
  }

  /**
   * Show unsaved changes status
   */
  function showUnsavedChanges() {
    const message =
      typeof fluidDesignSystemAdmin !== 'undefined' &&
      fluidDesignSystemAdmin.strings &&
      fluidDesignSystemAdmin.strings.unsavedChanges
        ? fluidDesignSystemAdmin.strings.unsavedChanges
        : ''

    showStatus('warning', message, { autoHide: false })
  }

  /**
   * Replace placeholders in message strings (handles both WordPress-style and simple placeholders)
   */
  function replacePlaceholders(template, replacements) {
    if (!template || !replacements) {
      return template || ''
    }

    let message = template

    // Handle WordPress-style placeholders first (%1$s, %2$d, etc.)
    Object.keys(replacements).forEach((key, index) => {
      const value = replacements[key]
      const wpPlaceholder = `%${index + 1}$${key === 'name' ? 's' : key === 'length' || key === 'maxLength' ? 'd' : 's'}`
      message = message.replace(wpPlaceholder, value)
    })

    // Handle simple placeholders (%s, %d) as fallback
    if (message.includes('%s') || message.includes('%d')) {
      Object.keys(replacements).forEach((key) => {
        const value = replacements[key]
        const placeholder = key === 'length' || key === 'maxLength' ? '%d' : '%s'
        message = message.replace(placeholder, value)
      })
    }

    // Decode HTML entities that might come from WordPress localization
    message = message
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\\n/g, '\n')

    return message
  }

  /**
   * Show validation feedback for different scenarios
   */
  function showValidationFeedback(scenario, data = {}) {
    // Get localized strings from backend
    const strings =
      typeof fluidDesignSystemAdmin !== 'undefined' && fluidDesignSystemAdmin.strings
        ? fluidDesignSystemAdmin.strings
        : {}

    // Build message based on scenario and localized strings
    let message = ''

    switch (scenario) {
      case 'duplicateTitle':
      case 'duplicateDetected':
        message = replacePlaceholders(strings.duplicateTitle, { name: data.name })
        break
      case 'emptyTitle':
        message = strings.emptyTitle
        break
      case 'invalidCharacters':
        message = strings.invalidCharacters
        break
      case 'invalidCharactersTitle':
        message = strings.invalidCharactersTitle
        break
      case 'invalidCharactersDescription':
        message = strings.invalidCharactersDescription
        break
      case 'tooLong':
        message = replacePlaceholders(strings.tooLong, {
          length: data.length,
          maxLength: data.maxLength
        })
        break
      case 'tooShort':
        message = strings.tooShort
        break
      case 'addingSuccess':
        message = replacePlaceholders(strings.addingSuccess, { name: data.name })
        break
      case 'updatingSuccess':
        message = replacePlaceholders(strings.updatingSuccess, { name: data.name })
        break
      case 'savingChanges':
        message = strings.savingChanges
        break
      case 'operationSuccess':
        message = strings.operationSuccess
        break
      case 'operationError':
        message = strings.operationError
        break
      default:
        message = data.message || strings.validationError
        break
    }

    // Determine status type based on scenario
    let statusType = 'error'
    let options = {}

    if (scenario.includes('Success')) {
      statusType = 'success'
    } else if (scenario === 'duplicateDetected') {
      statusType = 'warning'
      options.autoHide = false // Keep showing until resolved
    } else if (scenario === 'savingChanges') {
      statusType = 'loading'
      options.autoHide = false // Never auto-hide loading
    }

    showStatus(statusType, message, options)
  }

  /**
   * Clear validation feedback (useful for real-time validation)
   */
  function clearValidationFeedback() {
    const $statusArea = $('.fluid-status-area')

    // Clear any existing timeout
    clearStatusTimeout()

    // Only clear if showing validation-related status
    if ($statusArea.hasClass('is-error') || $statusArea.hasClass('warning')) {
      hideStatus()
    }
  }

  /**
   * Show quick success feedback
   */
  function showSuccess(message, options = {}) {
    showStatus('success', message, options)
  }

  /**
   * Show error feedback
   */
  function showError(message, options = {}) {
    showStatus('error', message, options)
  }

  /**
   * Show loading state
   */
  function showLoading(message) {
    const defaultMessage =
      typeof fluidDesignSystemAdmin !== 'undefined' &&
      fluidDesignSystemAdmin.strings &&
      fluidDesignSystemAdmin.strings.savingChanges
        ? fluidDesignSystemAdmin.strings.savingChanges
        : 'Loading...'

    showStatus('loading', message || defaultMessage, { autoHide: false })
  }

  /**
   * Show info message
   */
  function showInfo(message, options = {}) {
    showStatus('info', message, options)
  }

  /**
   * Show warning message
   */
  function showWarning(message, options = {}) {
    showStatus('warning', message, options)
  }

  /**
   * Check if status area is currently showing a message
   */
  function isVisible() {
    const $statusArea = $('.fluid-status-area')
    return $statusArea.length > 0 && !$statusArea.hasClass('hidden')
  }

  /**
   * Get current status type
   */
  function getCurrentType() {
    const $statusArea = $('.fluid-status-area')

    if ($statusArea.hasClass('loading')) return 'loading'
    if ($statusArea.hasClass('success')) return 'success'
    if ($statusArea.hasClass('is-error')) return 'error'
    if ($statusArea.hasClass('warning')) return 'warning'
    if ($statusArea.hasClass('info')) return 'info'

    return null
  }

  // Public API
  window.FluidDesignSystemAdmin = window.FluidDesignSystemAdmin || {}
  window.FluidDesignSystemAdmin.statusNotices = {
    // Core functions
    showStatus,
    hideStatus,
    clearStatusTimeout,

    // Convenience methods
    showSuccess,
    showError,
    showLoading,
    showInfo,
    showWarning,

    // Specialized functions
    showUnsavedChanges,
    showValidationFeedback,
    clearValidationFeedback,

    // Utility functions
    isVisible,
    getCurrentType,

    // Configuration
    config: defaultConfig
  }
})(jQuery)
