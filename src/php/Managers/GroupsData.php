<?php
/**
 * Aggregates built-in, custom, and filter-based preset groups.
 *
 * Group types:
 * - builtin: Spacing/Typography (from ControlRegistry)
 * - custom: User-created via admin UI (from Data manager)
 * - filter: Developer-added via arts/fluid_design_system/preset_groups filter
 *
 * @package Arts\FluidDesignSystem
 */

namespace Arts\FluidDesignSystem\Managers;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use Arts\FluidDesignSystem\Base\Manager as BaseManager;
use Arts\FluidDesignSystem\Elementor\Units\Fluid\Module as FluidUnitModule;
use Arts\FluidDesignSystem\Managers\ControlRegistry;
use Arts\FluidDesignSystem\Managers\Data;
use ArtsFluidDS\Arts\Utilities\Utilities;

/**
 * Aggregates all preset group types for admin display.
 */
class GroupsData extends BaseManager {

	/** @return array<int, array<string, mixed>> */
	public static function get_all_groups(): array {
		$groups = array();
		$groups = array_merge( $groups, self::get_main_groups() );
		$groups = array_merge( $groups, self::get_filter_groups() );
		return $groups;
	}

	/**
	 * Main groups respect custom ordering when set, falls back to builtin+custom sequence.
	 *
	 * @return array<int, array<string, mixed>>
	 */
	public static function get_main_groups(): array {
		if ( ! Data::is_main_group_ordering_active() ) {
			$builtin_groups = self::get_builtin_groups();
			$custom_groups  = self::get_custom_groups();
			/** @var array<int, array<string, mixed>> $merged */
			$merged = array_merge( $builtin_groups, $custom_groups );
			return $merged;
		}

		$ordered_ids = Data::get_main_group_order();
		/** @var array<string, array<string, mixed>> $all_available_groups */
		$all_available_groups = array();

		$builtin_groups = self::get_builtin_groups();
		$custom_groups  = self::get_custom_groups();

		foreach ( $builtin_groups as $group ) {
			$group_array = Utilities::get_array_value( $group );
			if ( isset( $group_array['id'] ) ) {
				$group_id                          = Utilities::get_string_value( $group_array['id'] );
				$all_available_groups[ $group_id ] = $group_array;
			}
		}

		foreach ( $custom_groups as $group ) {
			$group_array = Utilities::get_array_value( $group );
			if ( isset( $group_array['id'] ) ) {
				$group_id                          = Utilities::get_string_value( $group_array['id'] );
				$all_available_groups[ $group_id ] = $group_array;
			}
		}

		/** @var array<int, array<string, mixed>> $ordered_groups */
		$ordered_groups = array();
		foreach ( $ordered_ids as $group_id ) {
			if ( isset( $all_available_groups[ $group_id ] ) ) {
				/** @var array<string, mixed> $group_item */
				$group_item       = $all_available_groups[ $group_id ];
				$ordered_groups[] = $group_item;
				unset( $all_available_groups[ $group_id ] );
			}
		}

		// Append any groups not in saved order (data integrity fallback)
		foreach ( $all_available_groups as $group ) {
			/** @var array<string, mixed> $group_item */
			$group_item       = $group;
			$ordered_groups[] = $group_item;
		}

		return $ordered_groups;
	}

	/** @return array<int, array<string, mixed>> */
	public static function get_builtin_groups(): array {
		$groups           = array();
		$builtin_controls = ControlRegistry::get_builtin_control_mappings();

		$order = 10;
		foreach ( $builtin_controls as $control_id => $group_data ) {
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
	 * Filter groups are developer-added via hook, excluding builtin and custom.
	 *
	 * @return array<int, array<string, mixed>>
	 */
	public static function get_filter_groups(): array {
		$all_groups    = FluidUnitModule::get_all_preset_groups();
		$builtin_names = self::get_builtin_names();

		$custom_groups = Data::get_custom_groups();
		$custom_names  = array();
		foreach ( $custom_groups as $custom_group ) {
			if ( isset( $custom_group['name'] ) ) {
				$custom_names[] = $custom_group['name'];
			}
		}

		$filter_groups = array();

		foreach ( $all_groups as $group ) {
			if ( in_array( $group['name'], $builtin_names, true ) ) {
				continue;
			}

			if ( in_array( $group['name'], $custom_names, true ) ) {
				continue;
			}

			$group['type']   = 'filter';
			$filter_groups[] = $group;
		}

		return $filter_groups;
	}

	/**
	 * Collects all reserved names (default options + builtin group names).
	 *
	 * @return array<int, string>
	 */
	public static function get_builtin_names(): array {
		$builtin_names = array();

		$default_options = FluidUnitModule::get_default_preset_options();
		foreach ( $default_options as $option ) {
			$option_array = Utilities::get_array_value( $option );
			if ( isset( $option_array['name'] ) ) {
				$builtin_names[] = Utilities::get_string_value( $option_array['name'] );
			}
		}

		$builtin_controls = ControlRegistry::get_builtin_control_mappings();
		foreach ( $builtin_controls as $group_data ) {
			$group_array = Utilities::get_array_value( $group_data );
			if ( isset( $group_array['name'] ) ) {
				$builtin_names[] = Utilities::get_string_value( $group_array['name'] );
			}
		}

		return $builtin_names;
	}

	/**
	 * Custom groups with their Kit preset values for admin display.
	 *
	 * @return array<int, array<string, mixed>>
	 */
	public static function get_custom_groups(): array {
		$custom_groups_data = Data::get_custom_groups();
		$groups             = array();

		foreach ( $custom_groups_data as $id => $group_data ) {
			$group_array = Utilities::get_array_value( $group_data );
			$group_id    = Utilities::get_string_value( $id );

			$control_id = ControlRegistry::get_custom_group_control_id( $group_id );
			$presets    = Utilities::get_kit_settings( $control_id, array(), false );

			$groups[] = array(
				'name'        => Utilities::get_string_value( $group_array['name'] ?? '' ),
				'description' => Utilities::get_string_value( $group_array['description'] ?? '' ),
				'type'        => 'custom',
				'value'       => $presets,
				'id'          => $group_id,
				'order'       => isset( $group_array['order'] ) ? Utilities::get_int_value( $group_array['order'], 999 ) : 999,
			);
		}

		usort(
			$groups,
			function ( $a, $b ) {
				return $a['order'] - $b['order'];
			}
		);

		return $groups;
	}

	/**
	 * Checks all group types (custom, builtin, filter) for name collision.
	 *
	 * @param string      $name       Group name to check.
	 * @param string|null $exclude_id Group ID to skip (for updates).
	 */
	public static function is_group_name_taken( $name, $exclude_id = null ): bool {
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
