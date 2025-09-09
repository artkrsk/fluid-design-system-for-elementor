<?php

namespace Arts\FluidDesignSystem\Managers\Admin\Tabs\Groups;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

use \Arts\FluidDesignSystem\Base\Manager as BaseManager;
use \Arts\FluidDesignSystem\Managers\Data;
use \Arts\FluidDesignSystem\Managers\GroupsData;
use \Arts\Utilities\Utilities;

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
		// Check security nonce
		if ( ! check_ajax_referer( 'fluid_design_system_ajax_nonce', 'security', false ) ) {
			wp_send_json_error(
				array(
					'message' => esc_html__( 'Security check failed.', 'fluid-design-system-for-elementor' ),
					'notices' => $this->managers->notices->get_notices_for_ajax(),
				)
			);
		}

		$action = isset( $_POST['fluid_action'] ) ? sanitize_key( $_POST['fluid_action'] ) : '';
		$result = array( 'success' => false );

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
	 * @return array Operation result
	 */
	private function handle_ajax_update_title() {
		$group_id = isset( $_POST['group_id'] ) ? sanitize_key( $_POST['group_id'] ) : '';
		$title    = isset( $_POST['title'] ) ? sanitize_text_field( $_POST['title'] ) : '';

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
	 * @return array Operation result
	 */
	private function handle_ajax_update_description() {
		$group_id    = isset( $_POST['group_id'] ) ? sanitize_key( $_POST['group_id'] ) : '';
		$description = isset( $_POST['description'] ) ? sanitize_textarea_field( $_POST['description'] ) : '';

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
	 * @return array Operation result
	 */
	private function handle_ajax_reorder_groups() {
		$group_order = isset( $_POST['group_order'] ) ? array_map( 'sanitize_key', $_POST['group_order'] ) : array();

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
	 * @return array Array with success status and optional message.
	 */
	private function handle_ajax_save_all_changes() {
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
			$total_presets += $group['preset_count'] ?? 0;
		}
		foreach ( $filter_groups as $group ) {
			$total_presets += $group['preset_count'] ?? 0;
		}

		// Build success message
		$group_count     = count( $main_groups );
		$success_message = __( 'Changes saved successfully.', 'fluid-design-system-for-elementor' );

		return array(
			'success'                => true,
			'message'                => $success_message,
			'main_groups'            => $main_groups,
			'filter_groups'          => $filter_groups,
			'main_table_html'        => $this->managers->admin_tabs_groups_view->get_main_groups_table_body_html(),
			'developer_table_html'   => $this->managers->admin_tabs_groups_view->get_developer_groups_table_body_html(),
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
	 * @return array Operation result
	 */
	private function handle_ajax_save_presets_snapshot() {
		$snapshot_json = isset( $_POST['snapshot'] ) ? wp_unslash( $_POST['snapshot'] ) : '';

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
		$kit    = \Elementor\Plugin::$instance->kits_manager->get_active_kit();
		$kit_id = $kit->get_main_id();

		// Get current settings (raw)
		$meta_key     = \Elementor\Core\Settings\Page\Manager::META_KEY;
		$kit_settings = get_post_meta( $kit_id, $meta_key, true );

		if ( ! is_array( $kit_settings ) ) {
			$kit_settings = array();
		}

		$preset_data_map = array();

		// Collect all existing preset data from current settings
		foreach ( $kit_settings as $control_id => $presets ) {
			if ( is_array( $presets ) && strpos( $control_id, '_presets' ) !== false ) {
				foreach ( $presets as $preset ) {
					if ( isset( $preset['_id'] ) ) {
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
				if ( isset( $preset['_id'] ) && isset( $preset_data_map[ $preset['_id'] ] ) ) {
					// Use the FULL preset data from our map
					$updated_presets[] = $preset_data_map[ $preset['_id'] ];
				} else {
					// If it's a new preset or data not found, use what we have
					$updated_presets[] = $preset;
				}
			}

			$kit_settings[ $control_id ] = $updated_presets;
		}

		// Get the settings manager directly
		$page_settings_manager = \Elementor\Core\Settings\Manager::get_settings_managers( 'page' );

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
