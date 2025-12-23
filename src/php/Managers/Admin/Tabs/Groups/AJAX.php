<?php

namespace Arts\FluidDesignSystem\Managers\Admin\Tabs\Groups;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

use Arts\FluidDesignSystem\Base\Manager as BaseManager;
use Arts\FluidDesignSystem\Managers\Data;
use Arts\FluidDesignSystem\Managers\GroupsData;
use Arts\Utilities\Utilities;

class AJAX extends BaseManager {
	/**
	 * Handle AJAX requests for admin operations.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @return void
	 */
	public function handle_ajax_requests() {
		// Check managers availability
		if ( $this->managers === null || $this->managers->notices === null ) {
			wp_send_json_error(
				array(
					'message' => esc_html__( 'Managers not initialized.', 'fluid-design-system-for-elementor' ),
				)
			);
		}

		// Check security nonce
		if ( ! check_ajax_referer( 'fluid_design_system_ajax_nonce', 'security', false ) ) {
			wp_send_json_error(
				array(
					'message' => esc_html__( 'Security check failed.', 'fluid-design-system-for-elementor' ),
					'notices' => $this->managers->notices->get_notices_for_ajax(),
				)
			);
		}

		$fluid_action_raw = isset( $_POST['fluid_action'] ) && is_string( $_POST['fluid_action'] ) ? wp_unslash( $_POST['fluid_action'] ) : '';
		$action           = sanitize_key( $fluid_action_raw );
		$result           = array( 'success' => false );

		switch ( $action ) {
			case 'update_title':
				$result = $this->handle_ajax_update_title();
				break;

			case 'update_description':
				$result = $this->handle_ajax_update_description();
				break;

			case 'reorder_groups':
				$result = $this->handle_ajax_reorder_groups();
				break;

			case 'save_all_changes':
				$result = $this->handle_ajax_save_all_changes();
				break;

			case 'save_presets_snapshot':
				$result = $this->handle_ajax_save_presets_snapshot();
				break;

			default:
				$this->managers->notices->add_notice(
					esc_html__( 'Unknown action.', 'fluid-design-system-for-elementor' ),
					'error'
				);
				break;
		}

		// Include notices in the response
		$result['notices'] = $this->managers->notices->get_notices_for_ajax();

		// Include fresh group data for table updates
		$result['main_groups']   = GroupsData::get_main_groups();
		$result['filter_groups'] = GroupsData::get_filter_groups();

		if ( isset( $result['success'] ) && $result['success'] ) {
			wp_send_json_success( $result );
		} else {
			wp_send_json_error( $result );
		}
	}

	/**
	 * Handle AJAX title update.
	 *
	 * @since 1.0.0
	 * @access private
	 *
	 * @return array<string, mixed> Operation result
	 */
	private function handle_ajax_update_title() {
		// Check managers availability
		if ( $this->managers === null || $this->managers->notices === null || $this->managers->data === null ) {
			return array( 'success' => false );
		}

		// Nonce verification is handled in handle_ajax_requests()
		$group_id_raw = isset( $_POST['group_id'] ) && is_string( $_POST['group_id'] ) ? wp_unslash( $_POST['group_id'] ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Missing
		$group_id     = sanitize_key( $group_id_raw );
		$title_raw    = isset( $_POST['title'] ) && is_string( $_POST['title'] ) ? wp_unslash( $_POST['title'] ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Missing
		$title        = sanitize_text_field( $title_raw );

		if ( empty( $group_id ) || empty( $title ) ) {
			$this->managers->notices->add_notice(
				esc_html__( 'Title cannot be empty.', 'fluid-design-system-for-elementor' ),
				'error'
			);
			return array( 'success' => false );
		}

		// Check for duplicate names (excluding current group)
		if ( $this->is_group_name_taken( $title, $group_id ) ) {
			$this->managers->notices->add_notice(
				esc_html__( 'A group with this name already exists.', 'fluid-design-system-for-elementor' ),
				'error'
			);
			return array( 'success' => false );
		}

		// Get and update group
		$custom_groups = Data::get_custom_groups();
		if ( ! isset( $custom_groups[ $group_id ] ) ) {
			$this->managers->notices->add_notice(
				esc_html__( 'Group not found.', 'fluid-design-system-for-elementor' ),
				'error'
			);
			return array( 'success' => false );
		}

		// Check if title actually changed
		$current_title = $custom_groups[ $group_id ]['name'] ?? '';
		if ( $title === $current_title ) {
			// No change - return success with appropriate message
			return array(
				'success' => true,
				'message' => esc_html__( 'No changes made', 'fluid-design-system-for-elementor' ),
			);
		}

		$custom_groups[ $group_id ]['name'] = $title;

		// Save changes
		if ( $this->managers->data->save_custom_groups( $custom_groups ) ) {
			$this->managers->notices->add_notice(
				esc_html__( 'Title updated successfully.', 'fluid-design-system-for-elementor' ),
				'success'
			);
			return array( 'success' => true );
		} else {
			$this->managers->notices->add_notice(
				esc_html__( 'Failed to update title.', 'fluid-design-system-for-elementor' ),
				'error'
			);
			return array( 'success' => false );
		}
	}

	/**
	 * Handle AJAX description update.
	 *
	 * @since 1.0.0
	 * @access private
	 *
	 * @return array<string, mixed> Operation result
	 */
	private function handle_ajax_update_description() {
		// Check managers availability
		if ( $this->managers === null || $this->managers->notices === null || $this->managers->data === null ) {
			return array( 'success' => false );
		}

		// Nonce verification is handled in handle_ajax_requests()
		$group_id_raw    = isset( $_POST['group_id'] ) && is_string( $_POST['group_id'] ) ? wp_unslash( $_POST['group_id'] ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Missing
		$group_id        = sanitize_key( $group_id_raw );
		$description_raw = isset( $_POST['description'] ) && is_string( $_POST['description'] ) ? wp_unslash( $_POST['description'] ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Missing
		$description     = sanitize_textarea_field( $description_raw );

		if ( empty( $group_id ) ) {
			$this->managers->notices->add_notice(
				esc_html__( 'Group ID is required.', 'fluid-design-system-for-elementor' ),
				'error'
			);
			return array( 'success' => false );
		}

		// Get and update group
		$custom_groups = Data::get_custom_groups();
		if ( ! isset( $custom_groups[ $group_id ] ) ) {
			$this->managers->notices->add_notice(
				esc_html__( 'Group not found.', 'fluid-design-system-for-elementor' ),
				'error'
			);
			return array( 'success' => false );
		}

		// Check if description actually changed
		$current_description = $custom_groups[ $group_id ]['description'] ?? '';
		if ( $description === $current_description ) {
			// No change - return success with appropriate message
			return array(
				'success' => true,
				'message' => esc_html__( 'No changes made', 'fluid-design-system-for-elementor' ),
			);
		}

		$custom_groups[ $group_id ]['description'] = $description;

		// Save changes
		if ( $this->managers->data->save_custom_groups( $custom_groups ) ) {
			$this->managers->notices->add_notice(
				esc_html__( 'Description updated successfully.', 'fluid-design-system-for-elementor' ),
				'success'
			);
			return array( 'success' => true );
		} else {
			$this->managers->notices->add_notice(
				esc_html__( 'Failed to update description.', 'fluid-design-system-for-elementor' ),
				'error'
			);
			return array( 'success' => false );
		}
	}

	/**
	 * Handle AJAX groups reordering.
	 *
	 * @since 1.0.0
	 * @access private
	 *
	 * @return array<string, mixed> Operation result
	 */
	private function handle_ajax_reorder_groups() {
		// Check managers availability
		if ( $this->managers === null || $this->managers->notices === null ) {
			return array( 'success' => false );
		}

		// Nonce verification is handled in handle_ajax_requests()
		$group_order_raw = isset( $_POST['group_order'] ) && is_array( $_POST['group_order'] ) ? wp_unslash( $_POST['group_order'] ) : array(); // phpcs:ignore WordPress.Security.NonceVerification.Missing, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		$group_order     = array();
		foreach ( $group_order_raw as $item ) {
			if ( is_string( $item ) ) {
				$group_order[] = sanitize_key( $item );
			}
		}

		if ( empty( $group_order ) ) {
			$this->managers->notices->add_notice(
				esc_html__( 'Group order data is required.', 'fluid-design-system-for-elementor' ),
				'error'
			);
			return array( 'success' => false );
		}

		// Save main group order (built-in + custom groups)
		if ( Data::save_main_group_order( $group_order ) ) {
			$this->managers->notices->add_notice(
				esc_html__( 'Groups reordered successfully.', 'fluid-design-system-for-elementor' ),
				'success'
			);
			return array( 'success' => true );
		} else {
			$this->managers->notices->add_notice(
				esc_html__( 'Failed to reorder groups.', 'fluid-design-system-for-elementor' ),
				'error'
			);
			return array( 'success' => false );
		}
	}

	/**
	 * Handle AJAX save all changes request.
	 *
	 * @since 1.0.0
	 * @access private
	 *
	 * @return array<string, mixed> Array with success status and optional message.
	 */
	private function handle_ajax_save_all_changes() {
		// Check managers availability
		if ( $this->managers === null || $this->managers->admin_tabs_groups_handlers === null || $this->managers->admin_tabs_groups_view === null ) {
			return array( 'success' => false );
		}

		// Capture the starting time for performance tracking
		$start_time = microtime( true );

		// Call the existing save all changes method (reuse all logic)
		$this->managers->admin_tabs_groups_handlers->handle_save_all_changes();

		// Calculate processing time
		$processing_time = round( ( microtime( true ) - $start_time ) * 1000 );

		// Get fresh group data for table updates
		$main_groups   = GroupsData::get_main_groups();
		$filter_groups = GroupsData::get_filter_groups();

		// Count total presets across all groups (for summary)
		$total_presets = 0;
		foreach ( $main_groups as $group ) {
			if ( isset( $group['preset_count'] ) && is_int( $group['preset_count'] ) ) {
				$total_presets += $group['preset_count'];
			}
		}
		foreach ( $filter_groups as $group ) {
			if ( isset( $group['preset_count'] ) && is_int( $group['preset_count'] ) ) {
				$total_presets += $group['preset_count'];
			}
		}

		// Build success message
		$group_count     = count( $main_groups );
		$success_message = __( 'Changes saved successfully.', 'fluid-design-system-for-elementor' );

		return array(
			'success'                => true,
			'message'                => $success_message,
			'main_groups'            => $main_groups,
			'filter_groups'          => $filter_groups,
			'main_table_html'        => $this->managers->admin_tabs_groups_view->get_main_groups_table_html(),
			'developer_table_html'   => $this->managers->admin_tabs_groups_view->get_developer_groups_table_html(),
			'developer_table_exists' => ! empty( $filter_groups ),
			'stats'                  => array(
				'total_groups'       => $group_count,
				'total_presets'      => $total_presets,
				'processing_time_ms' => $processing_time,
			),
		);
	}

	/**
	 * Handle AJAX preset snapshot save - PROPER ELEMENTOR API APPROACH.
	 *
	 * @since 1.0.0
	 * @access private
	 *
	 * @return array<string, mixed> Operation result
	 */
	private function handle_ajax_save_presets_snapshot() {
		// Nonce verification is handled in handle_ajax_requests()
		$snapshot_json_raw = isset( $_POST['snapshot'] ) && is_string( $_POST['snapshot'] ) ? wp_unslash( $_POST['snapshot'] ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Missing
		$snapshot_json     = sanitize_textarea_field( $snapshot_json_raw );

		if ( empty( $snapshot_json ) ) {
			return array(
				'success' => false,
				'error'   => 'no_snapshot_data',
				'message' => 'No snapshot data provided',
			);
		}

		// Decode the JSON string
		$snapshot = json_decode( $snapshot_json, true );

		if ( ! is_array( $snapshot ) ) {
			return array(
				'success' => false,
				'error'   => 'invalid_snapshot_data',
				'message' => 'Invalid snapshot data format',
			);
		}

		if ( ! Utilities::is_elementor_plugin_active() ) {
			return array(
				'success' => false,
				'error'   => 'elementor_inactive',
				'message' => 'Elementor is not active',
			);
		}

		// Get the kit document
		$kit = \Elementor\Plugin::$instance->kits_manager->get_active_kit();
		if ( ! is_object( $kit ) || ! method_exists( $kit, 'get_main_id' ) ) {
			return array(
				'success' => false,
				'error'   => 'kit_not_found',
				'message' => 'Active kit not found',
			);
		}

		$kit_id = $kit->get_main_id();
		if ( ! is_int( $kit_id ) ) {
			return array(
				'success' => false,
				'error'   => 'invalid_kit_id',
				'message' => 'Invalid kit ID',
			);
		}

		// Get current settings (raw)
		$meta_key     = \Elementor\Core\Settings\Page\Manager::META_KEY;
		$kit_settings = get_post_meta( $kit_id, $meta_key, true );

		if ( ! is_array( $kit_settings ) ) {
			$kit_settings = array();
		}

		$preset_data_map = array();

		// Collect all existing preset data from current settings
		foreach ( $kit_settings as $control_id => $presets ) {
			if ( is_array( $presets ) && is_string( $control_id ) && strpos( $control_id, '_presets' ) !== false ) {
				foreach ( $presets as $preset ) {
					if ( is_array( $preset ) && isset( $preset['_id'] ) && is_string( $preset['_id'] ) ) {
						// Store the COMPLETE preset data, not just id and title
						$preset_data_map[ $preset['_id'] ] = $preset;
					}
				}
			}
		}

		// Now update the settings with the new organization, preserving all data
		foreach ( $snapshot as $control_id => $presets ) {
			if ( ! is_array( $presets ) ) {
				continue;
			}

			$updated_presets = array();

			foreach ( $presets as $preset ) {
				if ( is_array( $preset ) && isset( $preset['_id'] ) && is_string( $preset['_id'] ) && isset( $preset_data_map[ $preset['_id'] ] ) ) {
					// Use the FULL preset data from our map
					$updated_presets[] = $preset_data_map[ $preset['_id'] ];
				} else {
					// If it's a new preset or data not found, use what we have
					$updated_presets[] = $preset;
				}
			}

			if ( is_string( $control_id ) ) {
				$kit_settings[ $control_id ] = $updated_presets;
			}
		}

		// Get the settings manager directly
		$page_settings_manager = \Elementor\Core\Settings\Manager::get_settings_managers( 'page' );

		// Ensure we have a valid settings manager object
		if ( ! is_object( $page_settings_manager ) || ! method_exists( $page_settings_manager, 'ajax_before_save_settings' ) || ! method_exists( $page_settings_manager, 'save_settings' ) ) {
			return array(
				'success' => false,
				'error'   => 'settings_manager_not_found',
				'message' => 'Settings manager not available',
			);
		}

		// Run pre-save actions
		$page_settings_manager->ajax_before_save_settings( $kit_settings, $kit_id );

		// Save settings directly
		$page_settings_manager->save_settings( $kit_settings, $kit_id );

		return array(
			'success' => true,
			'message' => 'Presets updated successfully',
		);
	}

	/**
	 * Check if a group name is already taken (custom, built-in, or filter-based).
	 *
	 * @since 1.0.0
	 * @access private
	 *
	 * @param string $name Group name to check.
	 * @param string $exclude_id Optional. Group ID to exclude from check.
	 * @return bool True if name is taken, false otherwise.
	 */
	private function is_group_name_taken( $name, $exclude_id = null ) {
		$sanitized_name = sanitize_text_field( $name );

		// Check custom groups
		if ( Data::name_exists( $sanitized_name, $exclude_id ) ) {
			return true;
		}

		return GroupsData::is_group_name_taken( $sanitized_name, $exclude_id );
	}
}
