<?php
/**
 * Groups data manager for Fluid Design System.
 *
 * @package Arts\FluidDesignSystem
 * @since 1.0.0
 */

namespace Arts\FluidDesignSystem\Managers;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

use \Arts\FluidDesignSystem\Base\Manager as BaseManager;
use \Arts\FluidDesignSystem\Elementor\Units\Fluid\Module as FluidUnitModule;
use \Arts\FluidDesignSystem\Managers\ControlRegistry;
use \Arts\FluidDesignSystem\Managers\Data;
use \Arts\Utilities\Utilities;

/**
 * GroupsData Class
 *
 * Manages group data retrieval and validation logic
 * for the Fluid Design System admin interface.
 *
 * @since 1.0.0
 */
class GroupsData extends BaseManager {

	/**
	 * Get all groups (built-in, custom, and filter-based).
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @return array Array of groups.
	 */
	public static function get_all_groups() {
		$groups = array();

		// Add main groups (built-in + custom) in correct order
		$groups = array_merge( $groups, self::get_main_groups() );

		// Add filter-based groups (developer-added groups last)
		$groups = array_merge( $groups, self::get_filter_groups() );

		return $groups;
	}

	/**
	 * Get main groups (built-in + custom) in the correct order.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @return array Array of main groups in order.
	 */
	public static function get_main_groups() {
		// Check if custom ordering is active
		if ( ! Data::is_main_group_ordering_active() ) {
			// Backward compatibility: return in original order
			$builtin_groups = self::get_builtin_groups();
			$custom_groups  = self::get_custom_groups();
			return array_merge( $builtin_groups, $custom_groups );
		}

		// Get custom order
		$ordered_ids          = Data::get_main_group_order();
		$all_available_groups = array();

		// Get all available groups indexed by ID
		$builtin_groups = self::get_builtin_groups();
		$custom_groups  = self::get_custom_groups();

		// Index built-in groups by their control ID (which is used as their "ID")
		foreach ( $builtin_groups as $group ) {
			if ( isset( $group['id'] ) ) {
				$all_available_groups[ $group['id'] ] = $group;
			}
		}

		// Index custom groups by their ID
		foreach ( $custom_groups as $group ) {
			if ( isset( $group['id'] ) ) {
				$all_available_groups[ $group['id'] ] = $group;
			}
		}

		// Build ordered array
		$ordered_groups = array();
		foreach ( $ordered_ids as $group_id ) {
			if ( isset( $all_available_groups[ $group_id ] ) ) {
				$ordered_groups[] = $all_available_groups[ $group_id ];
				unset( $all_available_groups[ $group_id ] );
			}
		}

		// Add any remaining groups that weren't in the order (fallback for data integrity)
		foreach ( $all_available_groups as $group ) {
			$ordered_groups[] = $group;
		}

		return $ordered_groups;
	}

	/**
	 * Get built-in groups.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @return array Array of built-in groups.
	 */
	public static function get_builtin_groups() {
		$groups = array();

		// Get built-in control mappings from tab registrar
		$builtin_controls = ControlRegistry::get_builtin_control_mappings();

		$order = 10;
		foreach ( $builtin_controls as $control_id => $group_data ) {
			// Get actual presets from Site Settings
			$presets = Utilities::get_kit_settings( $control_id, array(), false );

			$groups[] = array(
				'name'        => $group_data['name'],
				'description' => $group_data['description'],
				'type'        => 'builtin',
				'value'       => $presets,
				'id'          => sanitize_key( $control_id ),
				'order'       => $order,
			);

			$order += 10;
		}

		return $groups;
	}



	/**
	 * Get filter-based groups (from developers).
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @return array Array of filter-based groups.
	 */
	public static function get_filter_groups() {
		// Get all preset groups from the Module (includes filter-based groups)
		$all_groups = FluidUnitModule::get_all_preset_groups();

		// Get dynamic list of built-in names from metadata (clean names, not collection titles)
		$builtin_names = self::get_builtin_names();

		// Get custom group names to exclude them from filter groups
		$custom_groups = Data::get_custom_groups();
		$custom_names  = array();
		foreach ( $custom_groups as $custom_group ) {
			if ( isset( $custom_group['name'] ) ) {
				$custom_names[] = $custom_group['name'];
			}
		}

		// Filter out only the groups that were added via filter (not built-in default groups or custom groups)
		$filter_groups = array();

		foreach ( $all_groups as $group ) {
			// Skip default options and built-in groups
			if ( in_array( $group['name'], $builtin_names, true ) ) {
				continue;
			}

			// Skip custom groups (they should only appear in the custom section)
			if ( in_array( $group['name'], $custom_names, true ) ) {
				continue;
			}

			// Mark as filter type and add to results
			$group['type']   = 'filter';
			$filter_groups[] = $group;
		}

		return $filter_groups;
	}

	/**
	 * Get built-in names dynamically from tab registrar.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @return array Array of built-in group names.
	 */
	public static function get_builtin_names() {
		$builtin_names = array();

		// Get default preset option names
		$default_options = FluidUnitModule::get_default_preset_options();
		foreach ( $default_options as $option ) {
			$builtin_names[] = $option['name'];
		}

		// Get built-in group names from tab registrar
		$builtin_controls = ControlRegistry::get_builtin_control_mappings();
		foreach ( $builtin_controls as $group_data ) {
			$builtin_names[] = $group_data['name'];
		}

		return $builtin_names;
	}

	/**
	 * Get custom groups from data manager.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @return array Array of custom groups.
	 */
	public static function get_custom_groups() {
		$custom_groups_data = Data::get_custom_groups();
		$groups             = array();

		foreach ( $custom_groups_data as $id => $group_data ) {
			// Get actual presets from Site Settings
			$control_id = ControlRegistry::get_custom_group_control_id( $id );
			$presets    = Utilities::get_kit_settings( $control_id, array(), false );

			$groups[] = array(
				'name'        => $group_data['name'],
				'description' => $group_data['description'],
				'type'        => 'custom',
				'value'       => $presets,
				'id'          => $id,
				'order'       => isset( $group_data['order'] ) ? (int) $group_data['order'] : 999,
			);
		}

		// Sort by order field
		usort(
			$groups,
			function( $a, $b ) {
				return $a['order'] - $b['order'];
			}
		);

		return $groups;
	}

	/**
	 * Check if a group name is already taken (custom, built-in, or filter-based).
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @param string $name Group name to check.
	 * @param string $exclude_id Optional. Group ID to exclude from check.
	 * @return bool True if name is taken, false otherwise.
	 */
	public static function is_group_name_taken( $name, $exclude_id = null ) {
		$sanitized_name = sanitize_text_field( $name );

		// Check custom groups
		if ( Data::name_exists( $name, $exclude_id ) ) {
			return true;
		}

		// Check built-in groups
		$builtin_groups = self::get_builtin_groups();
		foreach ( $builtin_groups as $group ) {
			if ( isset( $group['name'] ) && $group['name'] === $sanitized_name ) {
				return true;
			}
		}

		// Check filter-based groups
		$filter_groups = self::get_filter_groups();
		foreach ( $filter_groups as $group ) {
			if ( isset( $group['name'] ) && $group['name'] === $sanitized_name ) {
				return true;
			}
		}

		return false;
	}
}
