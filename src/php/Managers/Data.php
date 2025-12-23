<?php
/**
 * Data manager for Fluid Design System.
 *
 * @package Arts\FluidDesignSystem
 * @since 1.0.0
 */

namespace Arts\FluidDesignSystem\Managers;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

use Arts\FluidDesignSystem\Base\Manager as BaseManager;
use Arts\Utilities\Utilities;

/**
 * Data Class
 *
 * Manages custom groups data storage and retrieval
 * for the Fluid Design System.
 *
 * @since 1.0.0
 */
class Data extends BaseManager {
	/**
	 * WordPress option name for storing custom groups.
	 *
	 * @since 1.0.0
	 * @var string
	 */
	const OPTION_NAME = 'arts_fluid_design_system_custom_groups';

	/**
	 * Get all custom groups.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @return array<string, array<string, mixed>> Array of custom groups.
	 */
	public static function get_custom_groups(): array {
		/** @var array<string, array<string, mixed>> $groups */
		$groups = Utilities::get_array_value( get_option( self::OPTION_NAME, array() ) );

		// Ensure all groups have an order field (migration)
		$needs_update = false;
		foreach ( $groups as $id => $group ) {
			$group_array = Utilities::get_array_value( $group );
			if ( ! isset( $group_array['order'] ) ) {
				$group_array['order'] = 999; // Put at the end
				/** @var array<string, mixed> $group_array */
				$groups[ $id ] = $group_array;
				$needs_update  = true;
			}
		}

		if ( $needs_update ) {
			update_option( self::OPTION_NAME, $groups );
		}

		/** @var array<string, array<string, mixed>> $groups */
		return $groups;
	}

	/**
	 * Save custom groups to database.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @param array<string, array<string, mixed>> $groups Array of custom groups.
	 * @return bool True on success, false on failure.
	 */
	public function save_custom_groups( array $groups ): bool {
		return update_option( self::OPTION_NAME, $groups );
	}

	/**
	 * Create a new custom group.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @param string $name        Group name.
	 * @param string $description Group description (optional).
	 * @return string|false Group ID on success, false on failure.
	 */
	public function create_group( $name, $description = '' ) {
		$groups = $this->get_custom_groups();

		// Check for duplicate names
		$sanitized_name = sanitize_text_field( $name );
		foreach ( $groups as $existing_group ) {
			$group_array = Utilities::get_array_value( $existing_group );
			if ( isset( $group_array['name'] ) && $group_array['name'] === $sanitized_name ) {
				return false; // Duplicate name found
			}
		}

		$id = sanitize_key( $name ) . '_' . time();

		// Get next order position
		$max_order = 0;
		foreach ( $groups as $group ) {
			$group_array = Utilities::get_array_value( $group );
			if ( isset( $group_array['order'] ) ) {
				$order_value = Utilities::get_int_value( $group_array['order'] );
				if ( $order_value > $max_order ) {
					$max_order = $order_value;
				}
			}
		}

		$groups[ $id ] = array(
			'name'        => $sanitized_name,
			'description' => sanitize_textarea_field( $description ),
			'order'       => $max_order + 1,
		);

		return $this->save_custom_groups( $groups ) ? $id : false;
	}

	/**
	 * Delete a custom group.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @param string $id Group ID to delete.
	 * @return bool True on success, false on failure.
	 */
	public function delete_group( $id ) {
		$groups = $this->get_custom_groups();

		if ( ! isset( $groups[ $id ] ) ) {
			return false;
		}

		unset( $groups[ $id ] );
		return $this->save_custom_groups( $groups );
	}

	/**
	 * Check if a group exists.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @param string $id Group ID to check.
	 * @return bool True if group exists, false otherwise.
	 */
	public function group_exists( $id ) {
		$groups = $this->get_custom_groups();
		return isset( $groups[ $id ] );
	}

	/**
	 * Get a specific custom group.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @param string $id Group ID.
	 * @return array<string, mixed>|null Group data or null if not found.
	 */
	public function get_group( $id ) {
		$groups = $this->get_custom_groups();
		return isset( $groups[ $id ] ) ? $groups[ $id ] : null;
	}

	/**
	 * Check if a custom group name already exists.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @param string $name Group name to check.
	 * @param string $exclude_id Optional. Group ID to exclude from check.
	 * @return bool True if name exists, false otherwise.
	 */
	public static function name_exists( $name, $exclude_id = null ) {
		$groups         = self::get_custom_groups();
		$sanitized_name = sanitize_text_field( $name );

		foreach ( $groups as $group_id => $existing_group ) {
			// Skip the group we're excluding (for updates)
			if ( $exclude_id && $group_id === $exclude_id ) {
				continue;
			}

			$group_array = Utilities::get_array_value( $existing_group );
			if ( isset( $group_array['name'] ) && $group_array['name'] === $sanitized_name ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Reorder custom groups.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @param array<int, string> $order Array of group IDs in new order.
	 * @return bool True on success, false on failure.
	 */
	public function reorder_groups( array $order ): bool {
		$groups = $this->get_custom_groups();

		// Validate that all IDs exist
		foreach ( $order as $id ) {
			if ( ! isset( $groups[ $id ] ) ) {
				return false;
			}
		}

		// Update order for each group
		foreach ( $order as $index => $id ) {
			$groups[ $id ]['order'] = $index + 1;
		}

		return $this->save_custom_groups( $groups );
	}

	/**
	 * WordPress option name for storing main group order (built-in + custom).
	 *
	 * @since 1.0.0
	 * @var string
	 */
	const MAIN_GROUP_ORDER_OPTION = 'arts_fluid_design_system_main_group_order';

	/**
	 * Get the main group order (built-in + custom groups).
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @return array<int, string> Array of group IDs in order. Empty array if no custom order set.
	 */
	public static function get_main_group_order(): array {
		/** @var array<int, string> $order */
		$order = Utilities::get_array_value( get_option( self::MAIN_GROUP_ORDER_OPTION, array() ) );
		return $order;
	}

	/**
	 * Save the main group order (built-in + custom groups).
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @param array<int, string> $order Array of group IDs in order.
	 * @return bool True on success, false on failure.
	 */
	public static function save_main_group_order( array $order ): bool {
		$sanitized_order = array();
		foreach ( $order as $group_id ) {
			$sanitized_id = sanitize_key( $group_id );
			if ( ! empty( $sanitized_id ) ) {
				$sanitized_order[] = $sanitized_id;
			}
		}

		return update_option( self::MAIN_GROUP_ORDER_OPTION, $sanitized_order );
	}

	/**
	 * Check if main group ordering is enabled (backward compatibility).
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @return bool True if main group ordering is active, false for backward compatibility.
	 */
	public static function is_main_group_ordering_active() {
		$order = self::get_main_group_order();
		return ! empty( $order );
	}
}
