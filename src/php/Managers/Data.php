<?php
/**
 * Custom groups CRUD and ordering persistence.
 *
 * @package Arts\FluidDesignSystem
 */

namespace Arts\FluidDesignSystem\Managers;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use Arts\FluidDesignSystem\Base\Manager as BaseManager;
use Arts\Utilities\Utilities;

/**
 * Custom groups data storage (wp_options).
 */
class Data extends BaseManager {
	const OPTION_NAME             = 'arts_fluid_design_system_custom_groups';
	const MAIN_GROUP_ORDER_OPTION = 'arts_fluid_design_system_main_group_order';

	/**
	 * Migrates legacy groups without order field on first access.
	 *
	 * @return array<string, array<string, mixed>>
	 */
	public static function get_custom_groups(): array {
		/** @var array<string, array<string, mixed>> $groups */
		$groups = Utilities::get_array_value( get_option( self::OPTION_NAME, array() ) );

		$needs_update = false;
		foreach ( $groups as $id => $group ) {
			$group_array = Utilities::get_array_value( $group );
			if ( ! isset( $group_array['order'] ) ) {
				$group_array['order'] = 999;
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

	/** @param array<string, array<string, mixed>> $groups */
	public function save_custom_groups( array $groups ): bool {
		return update_option( self::OPTION_NAME, $groups );
	}

	/**
	 * ID format: sanitized_name_timestamp for uniqueness.
	 *
	 * @return string|false Group ID on success, false if name exists.
	 */
	public function create_group( string $name, string $description = '' ) {
		$groups         = $this->get_custom_groups();
		$sanitized_name = sanitize_text_field( $name );

		foreach ( $groups as $existing_group ) {
			$group_array = Utilities::get_array_value( $existing_group );
			if ( isset( $group_array['name'] ) && $group_array['name'] === $sanitized_name ) {
				return false;
			}
		}

		$id = sanitize_key( $name ) . '_' . time();

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

	public function delete_group( string $id ): bool {
		$groups = $this->get_custom_groups();

		if ( ! isset( $groups[ $id ] ) ) {
			return false;
		}

		unset( $groups[ $id ] );
		return $this->save_custom_groups( $groups );
	}

	public function group_exists( string $id ): bool {
		$groups = $this->get_custom_groups();
		return isset( $groups[ $id ] );
	}

	/** @return array<string, mixed>|null */
	public function get_group( string $id ): ?array {
		$groups = $this->get_custom_groups();
		return isset( $groups[ $id ] ) ? $groups[ $id ] : null;
	}

	/**
	 * @param string      $name       Group name to check.
	 * @param string|null $exclude_id Group ID to skip (for updates).
	 */
	public static function name_exists( string $name, ?string $exclude_id = null ): bool {
		$groups         = self::get_custom_groups();
		$sanitized_name = sanitize_text_field( $name );

		foreach ( $groups as $group_id => $existing_group ) {
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
	 * Validates all IDs exist before updating order values.
	 *
	 * @param array<int, string> $order Group IDs in new order.
	 */
	public function reorder_groups( array $order ): bool {
		$groups = $this->get_custom_groups();

		foreach ( $order as $id ) {
			if ( ! isset( $groups[ $id ] ) ) {
				return false;
			}
		}

		foreach ( $order as $index => $id ) {
			$groups[ $id ]['order'] = $index + 1;
		}

		return $this->save_custom_groups( $groups );
	}

	/**
	 * Empty array = no custom ordering (backward compat mode).
	 *
	 * @return array<int, string>
	 */
	public static function get_main_group_order(): array {
		/** @var array<int, string> $order */
		$order = Utilities::get_array_value( get_option( self::MAIN_GROUP_ORDER_OPTION, array() ) );
		return $order;
	}

	/** @param array<int, string> $order */
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

	/** Empty order array means backward compatibility mode (builtin first, then custom). */
	public static function is_main_group_ordering_active(): bool {
		$order = self::get_main_group_order();
		return ! empty( $order );
	}
}
