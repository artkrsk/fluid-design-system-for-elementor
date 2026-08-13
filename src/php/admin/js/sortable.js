/**
 * Sortable functionality for Fluid Design System Admin
 *
 * @package Arts\FluidDesignSystem
 * @since 1.0.0
 */

;(function ($) {
  'use strict'

  /**
   * Initialize sortable functionality
   */
  function init() {
    initSortable()
  }

  /**
   * Initialize jQuery UI sortable
   */
  function initSortable() {
    const $tbody = $('#fluid-groups-tbody')

    if ($tbody.length === 0) {
      return
    }

    $tbody.sortable({
      items: 'tr.sortable-row:not(.marked-for-deletion)', // Exclude marked rows from sorting
      axis: 'y',
      cursor: 'move',
      placeholder: 'ui-sortable-placeholder',
      helper: function (e, tr) {
        var $originals = tr.children()
        var $helper = tr.clone()
        $helper.children().each(function (index) {
          $(this).width($originals.eq(index).width())
        })
        return $helper
      },
      start: function (event, ui) {
        // Store the associated preset row
        const groupId = ui.item.data('group-id')
        const $presetRow = $(`.group-presets-row[data-group-id="${groupId}"]`)
        ui.item.data('associated-preset-row', $presetRow)
      },
      stop: function (event, ui) {
        // Move the associated preset row to follow its group row
        const $presetRow = ui.item.data('associated-preset-row')
        if ($presetRow && $presetRow.length) {
          ui.item.after($presetRow)
        }

        // Update order numbers after sorting
        updateOrderNumbers()
      },
      update: function (event, ui) {
        // Update hidden inputs with new order and update order numbers
        updateGroupOrder()
        updateOrderNumbers()

        // Update temporary group form data with new positions
        if (
          window.FluidDesignSystemAdmin &&
          window.FluidDesignSystemAdmin.base &&
          window.FluidDesignSystemAdmin.base.updateFormDataFromTempGroups
        ) {
          window.FluidDesignSystemAdmin.base.updateFormDataFromTempGroups()
        }

        // Get current order of group IDs for AJAX
        const groupOrder = []
        $('#fluid-groups-tbody tr.sortable-row:not(.marked-for-deletion)').each(function () {
          const groupId = $(this).data('group-id')
          if (groupId) {
            groupOrder.push(groupId)
          }
        })

        // Immediate AJAX request to save new order
        if (window.FluidDesignSystemAdmin && window.FluidDesignSystemAdmin.ajax) {
          window.FluidDesignSystemAdmin.ajax.reorderGroups(
            groupOrder,
            // Success callback
            function (response) {
              // Success feedback handled by ajax-manager.js
            },
            // Error callback
            function (errorData) {
              // Error feedback handled by ajax-manager.js
            }
          )
        }
      }
    })

    // Make the table rows look sortable
    $tbody.disableSelection()
  }

  /**
   * Update group order numbers and hidden inputs
   */
  function updateOrderNumbers() {
    $('#fluid-groups-tbody tr.sortable-row:not(.marked-for-deletion)').each(function (index) {
      var $row = $(this)
      var order = index + 1

      // Update order number display
      $row.find('.order-number').text(order)
    })
  }

  /**
   * Update group order in hidden inputs for saving
   */
  function updateGroupOrder() {
    // The group order is maintained by the order of group_order[] inputs
    // which are already in the correct DOM order after sorting
    // No additional updates needed since the hidden inputs move with the rows
  }

  // Public API
  window.FluidDesignSystemAdmin = window.FluidDesignSystemAdmin || {}
  window.FluidDesignSystemAdmin.sortable = {
    init: init,
    updateOrderNumbers: updateOrderNumbers,
    updateGroupOrder: updateGroupOrder
  }

  // Initialize when DOM is ready
  $(document).ready(init)
})(jQuery)
