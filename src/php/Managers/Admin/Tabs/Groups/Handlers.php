<?php

namespace Arts\FluidDesignSystem\Managers\Admin\Tabs\Groups;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

use Arts\FluidDesignSystem\Base\Manager as BaseManager;
use Arts\FluidDesignSystem\Managers\Data;
use Arts\FluidDesignSystem\Managers\GroupsData;
use Arts\Utilities\Utilities;

class Handlers extends BaseManager {
	/**
	 * Handle save all changes action (unified save for order, titles, descriptions, etc.)
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function handle_save_all_changes() {
		// Check managers availability
		if ( $this->managers === null || $this->managers->notices === null || $this->managers->data === null ) {
			return;
		}

		$changes_saved = false;

		// Step 1: Capture the original group order with temporary IDs
		// Nonce verification is handled in handle_group_actions()
		$original_order_raw = isset( $_POST['group_order'] ) && is_array( $_POST['group_order'] ) ? wp_unslash( $_POST['group_order'] ) : array(); // phpcs:ignore WordPress.Security.NonceVerification.Missing, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		$original_order     = array();
		foreach ( $original_order_raw as $item ) {
			if ( is_string( $item ) ) {
				$original_order[] = sanitize_key( $item );
			}
		}

		$temp_group_mapping_json = isset( $_POST['temp_group_mapping'] ) && is_string( $_POST['temp_group_mapping'] ) ? sanitize_textarea_field( wp_unslash( $_POST['temp_group_mapping'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Missing, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		$temp_group_mapping      = ! empty( $temp_group_mapping_json ) ? json_decode( $temp_group_mapping_json, true ) : array();
		if ( ! is_array( $temp_group_mapping ) ) {
			$temp_group_mapping = array();
		}

		$temp_group_positions_json = isset( $_POST['temp_group_positions'] ) && is_string( $_POST['temp_group_positions'] ) ? sanitize_textarea_field( wp_unslash( $_POST['temp_group_positions'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Missing, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		$temp_group_positions      = ! empty( $temp_group_positions_json ) ? json_decode( $temp_group_positions_json, true ) : array();
		if ( ! is_array( $temp_group_positions ) ) {
			$temp_group_positions = array();
		}

		// Step 2: Create new groups and build ID mapping
		$temp_id_to_real_id = array();

		if ( isset( $_POST['new_groups'] ) && is_array( $_POST['new_groups'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
			// Unslash immediately when assigning
			$new_groups_raw = isset( $_POST['new_groups'] ) ? wp_unslash( $_POST['new_groups'] ) : array(); // phpcs:ignore WordPress.Security.NonceVerification.Missing, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized

			$new_group_names        = array();
			$new_group_descriptions = array();

			if ( isset( $new_groups_raw['name'] ) && is_array( $new_groups_raw['name'] ) ) {
				foreach ( $new_groups_raw['name'] as $key => $value ) {
					if ( is_string( $value ) ) {
						$new_group_names[ $key ] = sanitize_text_field( $value ); // Already unslashed
					}
				}
			}

			if ( isset( $new_groups_raw['description'] ) && is_array( $new_groups_raw['description'] ) ) {
				foreach ( $new_groups_raw['description'] as $key => $value ) {
					if ( is_string( $value ) ) {
						$new_group_descriptions[ $key ] = sanitize_textarea_field( $value ); // Already unslashed
					}
				}
			}

			if ( ! empty( $new_group_names ) ) {
				$created_count  = 0;
				$created_groups = array(); // Track created groups with their index

				for ( $i = 0; $i < count( $new_group_names ); $i++ ) {
					$name        = isset( $new_group_names[ $i ] ) ? sanitize_text_field( $new_group_names[ $i ] ) : '';
					$description = isset( $new_group_descriptions[ $i ] ) ? sanitize_textarea_field( $new_group_descriptions[ $i ] ) : '';

					if ( empty( $name ) ) {
						continue;
					}

					// Check for duplicate names
					if ( GroupsData::is_group_name_taken( $name ) ) {
						$this->managers->notices->add_notice(
							sprintf(
								/* translators: %s: Group name */
								esc_html__( 'Group "%s" was not created because a group with the same name already exists.', 'fluid-design-system-for-elementor' ),
								esc_html( $name )
							),
							'error'
						);
						continue;
					}

					// Create the group
					$group_id = $this->managers->data->create_group( $name, $description );
					if ( $group_id ) {
						++$created_count;
						$changes_saved        = true;
						$created_groups[ $i ] = $group_id; // Map array index to real group ID
					}
				}

				// Build mapping from temporary IDs to real IDs using both mappings
				if ( ! empty( $temp_group_mapping ) && ! empty( $created_groups ) ) {
					foreach ( $temp_group_mapping as $temp_id => $array_index ) {
						if ( is_string( $temp_id ) && ( is_int( $array_index ) || is_string( $array_index ) ) && isset( $created_groups[ $array_index ] ) ) {
							$temp_id_to_real_id[ $temp_id ] = $created_groups[ $array_index ];
						}
					}
				}

				if ( $created_count > 0 ) {
					$this->managers->notices->add_notice(
						sprintf(
							/* translators: %d: Number of created groups */
							_n(
								'%d group created successfully.',
								'%d groups created successfully.',
								$created_count,
								'fluid-design-system-for-elementor'
							),
							$created_count
						),
						'success'
					);
				}
			}
		}

		// Step 3: Reconstruct the final order using position data if available
		if ( ! empty( $original_order ) ) {
			$sanitized_order = array();

			// If we have position data, use it to reconstruct order properly
			if ( ! empty( $temp_group_positions ) && ! empty( $temp_id_to_real_id ) ) {
				// Create a mapping of positions to group IDs (both existing and new)
				$position_to_group = array();

				foreach ( $original_order as $index => $group_id ) {
					if ( ! is_string( $group_id ) ) {
						continue;
					}
					$sanitized_id = sanitize_key( $group_id );
					if ( ! empty( $sanitized_id ) ) {
						if ( strpos( $sanitized_id, 'temp_' ) === 0 ) {
							// This is a temporary ID - use the position mapping
							if ( isset( $temp_group_positions[ $sanitized_id ] ) && is_int( $temp_group_positions[ $sanitized_id ] ) && isset( $temp_id_to_real_id[ $sanitized_id ] ) ) {
								$position                       = $temp_group_positions[ $sanitized_id ];
								$position_to_group[ $position ] = $temp_id_to_real_id[ $sanitized_id ];
							}
						} else {
							// This is an existing group ID - use its current position
							$position_to_group[ $index ] = $sanitized_id;
						}
					}
				}

				// Sort by position and build the final order
				ksort( $position_to_group );
				$sanitized_order = array_values( $position_to_group );

			} else {
				// Fallback to the original method if no position data
				foreach ( $original_order as $group_id ) {
					$sanitized_id = sanitize_key( $group_id );
					if ( ! empty( $sanitized_id ) ) {
						// If this is a temporary ID, replace it with the real ID (if it was created)
						if ( strpos( $sanitized_id, 'temp_' ) === 0 ) {
							// This is a temporary ID
							if ( isset( $temp_id_to_real_id[ $sanitized_id ] ) ) {
								$sanitized_order[] = $temp_id_to_real_id[ $sanitized_id ];
							}
							// If temp ID not in mapping, skip it (group wasn't created due to validation error)
						} else {
							// This is an existing group ID
							$sanitized_order[] = $sanitized_id;
						}
					}
				}
			}

			if ( ! empty( $sanitized_order ) ) {
				// Save main group order (includes built-in and custom groups)
				if ( Data::save_main_group_order( $sanitized_order ) ) {
					$changes_saved = true;

					// Also update custom group order for backward compatibility
					$custom_groups = Data::get_custom_groups();
					$custom_order  = array();

					foreach ( $sanitized_order as $group_id ) {
						if ( isset( $custom_groups[ $group_id ] ) ) {
							$custom_order[] = $group_id;
						}
					}

					if ( ! empty( $custom_order ) ) {
						$this->managers->data->reorder_groups( $custom_order );
					}
				}
			}
		}

		// Handle title updates
		if ( isset( $_POST['group_titles'] ) && is_array( $_POST['group_titles'] ) && ! empty( $_POST['group_titles'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
			// Unslash immediately when assigning
			$title_updates_raw = isset( $_POST['group_titles'] ) ? wp_unslash( $_POST['group_titles'] ) : array(); // phpcs:ignore WordPress.Security.NonceVerification.Missing, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
			$title_updates     = array();

			foreach ( $title_updates_raw as $key => $value ) {
				if ( is_string( $key ) && is_string( $value ) ) {
					$sanitized_key                   = sanitize_key( $key );
					$title_updates[ $sanitized_key ] = sanitize_text_field( $value ); // Already unslashed
				}
			}

			$custom_groups  = Data::get_custom_groups();
			$updated_groups = false;

			foreach ( $title_updates as $group_id => $new_title ) {
				// Skip temporary groups - they were handled during creation
				if ( strpos( $group_id, 'temp_' ) === 0 ) {
					continue;
				}

				// Skip if empty
				if ( empty( $new_title ) || empty( $group_id ) || ! isset( $custom_groups[ $group_id ] ) ) {
					continue;
				}

				// Skip if unchanged
				if ( $custom_groups[ $group_id ]['name'] === $new_title ) {
					continue;
				}

				// Check for duplicate names
				$is_duplicate = false;
				foreach ( $custom_groups as $existing_id => $existing_group ) {
					if ( $existing_id !== $group_id && $existing_group['name'] === $new_title ) {
						$is_duplicate = true;
						break;
					}
				}

				if ( $is_duplicate ) {
					$this->managers->notices->add_notice(
						sprintf(
							/* translators: %s: Group title */
							esc_html__( 'Group "%s" was not renamed because another group with the same name already exists.', 'fluid-design-system-for-elementor' ),
							esc_html( $new_title )
						),
						'error'
					);
					continue;
				}

				// Update the title
				$custom_groups[ $group_id ]['name'] = $new_title;
				$updated_groups                     = true;
			}

			if ( $updated_groups && $this->managers->data->save_custom_groups( $custom_groups ) ) {
				$changes_saved = true;
			}
		}

		// Handle description updates
		if ( isset( $_POST['group_descriptions'] ) && is_array( $_POST['group_descriptions'] ) && ! empty( $_POST['group_descriptions'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
			// Unslash immediately when assigning
			$description_updates_raw = isset( $_POST['group_descriptions'] ) ? wp_unslash( $_POST['group_descriptions'] ) : array(); // phpcs:ignore WordPress.Security.NonceVerification.Missing, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
			$description_updates     = array();

			foreach ( $description_updates_raw as $key => $value ) {
				if ( is_string( $key ) && is_string( $value ) ) {
					$sanitized_key                         = sanitize_key( $key );
					$description_updates[ $sanitized_key ] = sanitize_textarea_field( $value ); // Already unslashed
				}
			}

			$custom_groups  = Data::get_custom_groups();
			$updated_groups = false;

			foreach ( $description_updates as $group_id => $new_description ) {
				// Skip temporary groups - they were handled during creation
				if ( strpos( $group_id, 'temp_' ) === 0 ) {
					continue;
				}

				// Only update if the group exists in custom groups
				if ( isset( $custom_groups[ $group_id ] ) ) {
					// Update the description
					$custom_groups[ $group_id ]['description'] = $new_description;
					$updated_groups                            = true;
				}
			}

			if ( $updated_groups && $this->managers->data->save_custom_groups( $custom_groups ) ) {
				$changes_saved = true;
			}
		}

		// Handle group deletions
		if ( isset( $_POST['delete_groups'] ) && is_array( $_POST['delete_groups'] ) && ! empty( $_POST['delete_groups'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
			// Unslash immediately when assigning
			$groups_to_delete_raw = isset( $_POST['delete_groups'] ) ? wp_unslash( $_POST['delete_groups'] ) : array(); // phpcs:ignore WordPress.Security.NonceVerification.Missing, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
			$groups_to_delete     = array();

			foreach ( $groups_to_delete_raw as $value ) {
				if ( is_string( $value ) ) {
					$groups_to_delete[] = sanitize_key( $value ); // Already unslashed
				}
			}

			$custom_groups = Data::get_custom_groups();
			$deleted_count = 0;

			foreach ( $groups_to_delete as $group_id ) {
				// Only delete if the group exists in custom groups
				if ( isset( $custom_groups[ $group_id ] ) ) {
					if ( $this->managers->data->delete_group( $group_id ) ) {
						++$deleted_count;
					}
				}
			}

			if ( $deleted_count > 0 ) {
				$changes_saved = true;
				$this->managers->notices->add_notice(
					sprintf(
						/* translators: %d: Number of deleted groups */
						_n(
							'%d group deleted successfully.',
							'%d groups deleted successfully.',
							$deleted_count,
							'fluid-design-system-for-elementor'
						),
						$deleted_count
					),
					'success'
				);
			}
		}

		// Future: Handle inter-group preset rearranging here

		// Final success/failure message
		if ( $changes_saved ) {
			// Check if we already have a success notice from deletions
			if ( ! $this->managers->notices->has_notices( 'success' ) ) {
				$this->managers->notices->add_notice( esc_html__( 'Changes saved successfully.', 'fluid-design-system-for-elementor' ), 'success' );
			}
		} else {
			$this->managers->notices->add_notice( esc_html__( 'No changes to save.', 'fluid-design-system-for-elementor' ), 'info' );
		}
	}

	/**
	 * Handle group actions (create, delete).
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function handle_group_actions() {
		// Check managers availability
		if ( $this->managers === null || $this->managers->notices === null || $this->managers->data === null ) {
			return;
		}

		if ( ! isset( $_POST['fluid_groups_action'] ) ) {
			return;
		}

		$action = isset( $_POST['fluid_groups_action'] ) && is_string( $_POST['fluid_groups_action'] ) ? sanitize_key( wp_unslash( $_POST['fluid_groups_action'] ) ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized

		// Handle delete actions with separate nonce
		if ( 'delete_group' === $action ) {
			$delete_nonce_raw = isset( $_POST['fluid_delete_nonce'] ) && is_string( $_POST['fluid_delete_nonce'] ) ? wp_unslash( $_POST['fluid_delete_nonce'] ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
			if ( empty( $delete_nonce_raw ) || ! wp_verify_nonce( sanitize_text_field( $delete_nonce_raw ), 'fluid_groups_action' ) ) {
				$this->managers->notices->add_notice( esc_html__( 'Security check failed.', 'fluid-design-system-for-elementor' ), 'error' );
				return;
			}
		} else {
			// Verify main form nonce for all other actions
			$groups_nonce_raw = isset( $_POST['fluid_groups_nonce'] ) && is_string( $_POST['fluid_groups_nonce'] ) ? wp_unslash( $_POST['fluid_groups_nonce'] ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
			if ( empty( $groups_nonce_raw ) || ! wp_verify_nonce( sanitize_text_field( $groups_nonce_raw ), 'fluid_groups_action' ) ) {
				$this->managers->notices->add_notice( esc_html__( 'Security check failed.', 'fluid-design-system-for-elementor' ), 'error' );
				return;
			}
		}

		switch ( $action ) {
			case 'create_group':
				$this->handle_create_group();
				break;

			case 'delete_group':
				$this->handle_delete_group();
				break;

			case 'save_all_changes':
				$this->handle_save_all_changes();
				break;
		}
	}

	/**
	 * Handle create group action.
	 *
	 * @since 1.0.0
	 * @access private
	 *
	 * @return void
	 */
	private function handle_create_group() {
		// Check managers availability
		if ( $this->managers === null || $this->managers->notices === null || $this->managers->data === null ) {
			return;
		}

		// Nonce verification is handled in handle_group_actions()
		$name        = isset( $_POST['group_name'] ) && is_string( $_POST['group_name'] ) ? sanitize_text_field( wp_unslash( $_POST['group_name'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Missing, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		$description = isset( $_POST['group_description'] ) && is_string( $_POST['group_description'] ) ? sanitize_textarea_field( wp_unslash( $_POST['group_description'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Missing, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized

		if ( empty( $name ) ) {
			$this->managers->notices->add_notice( esc_html__( 'Group name is required.', 'fluid-design-system-for-elementor' ), 'error' );
			return;
		}

		// Check for duplicate names (including built-in and filter groups)
		if ( $this->is_group_name_taken( $name ) ) {
			$this->managers->notices->add_notice( esc_html__( 'A group with this name already exists. Please choose a different name.', 'fluid-design-system-for-elementor' ), 'error' );
			return;
		}

		$group_id = $this->managers->data->create_group( $name, $description );

		if ( $group_id ) {
			$this->managers->notices->add_notice( esc_html__( 'Group created successfully.', 'fluid-design-system-for-elementor' ), 'success' );
		} else {
			$this->managers->notices->add_notice( esc_html__( 'Failed to create group.', 'fluid-design-system-for-elementor' ), 'error' );
		}
	}

	/**
	 * Handle delete group action.
	 *
	 * @since 1.0.0
	 * @access private
	 *
	 * @return void
	 */
	private function handle_delete_group() {
		// Check managers availability
		if ( $this->managers === null || $this->managers->notices === null || $this->managers->data === null ) {
			return;
		}

		// Nonce verification is handled in handle_group_actions()
		$group_id = isset( $_POST['group_id'] ) && is_string( $_POST['group_id'] ) ? sanitize_key( wp_unslash( $_POST['group_id'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Missing, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized

		if ( empty( $group_id ) ) {
			$this->managers->notices->add_notice( esc_html__( 'Group could not be deleted - invalid ID.', 'fluid-design-system-for-elementor' ), 'error' );
			return;
		}

		if ( $this->managers->data->delete_group( $group_id ) ) {
			$this->managers->notices->add_notice( esc_html__( 'Group deleted successfully.', 'fluid-design-system-for-elementor' ), 'success' );
		} else {
			$this->managers->notices->add_notice( esc_html__( 'Failed to delete group.', 'fluid-design-system-for-elementor' ), 'error' );
		}
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
