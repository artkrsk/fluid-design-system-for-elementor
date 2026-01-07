<?php
/**
 * Control ID generation and parsing for Elementor Kit controls.
 *
 * Control ID patterns:
 * - Built-in: fluid_spacing_presets, fluid_typography_presets
 * - Custom: fluid_custom_{group_id}_presets
 *
 * @package Arts\FluidDesignSystem
 * @since 1.0.0
 */

namespace Arts\FluidDesignSystem\Managers;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use Arts\FluidDesignSystem\Base\Manager as BaseManager;
use Arts\Utilities\Utilities;

/**
 * Control ID generation and metadata registry.
 *
 * @since 1.0.0
 */
class ControlRegistry extends BaseManager {

	/** @param string $group_id */
	public static function get_custom_group_control_id( $group_id ): string {
		return 'fluid_custom_' . $group_id . '_presets';
	}

	/** @param string $group_id */
	public static function get_custom_group_section_id( $group_id ): string {
		return 'section_fluid_custom_' . $group_id . '_presets';
	}

	/** @param string $group_id */
	public static function get_custom_group_info_control_id( $group_id ): string {
		return 'fluid_custom_' . $group_id . '_presets_info';
	}

	/**
	 * Combines built-in and custom groups metadata. Single source of truth for labels.
	 *
	 * @return array<string, array<string, mixed>>
	 */
	public static function get_builtin_group_metadata(): array {
		$builtin_metadata = array(
			'spacing'    => array(
				'name'        => esc_html__( 'Spacing Presets', 'fluid-design-system-for-elementor' ),
				'description' => '',
			),
			'typography' => array(
				'name'        => esc_html__( 'Typography Presets', 'fluid-design-system-for-elementor' ),
				'description' => '',
			),
		);

		$custom_groups = self::get_custom_groups_metadata();

		return array_merge( $builtin_metadata, $custom_groups );
	}

	/**
	 * Loads custom groups from wp_options, sorted by order field.
	 *
	 * @return array<string, array<string, mixed>>
	 */
	public static function get_custom_groups_metadata(): array {
		$custom_groups = Utilities::get_array_value( get_option( 'arts_fluid_design_system_custom_groups', array() ) );
		$metadata      = array();

		foreach ( $custom_groups as $group_id => $group_data ) {
			$group_array                       = Utilities::get_array_value( $group_data );
			$metadata[ 'custom_' . $group_id ] = array(
				'name'        => Utilities::get_string_value( $group_array['name'] ?? '' ),
				'description' => ! empty( $group_array['description'] ) ? Utilities::get_string_value( $group_array['description'] ) : '',
				'id'          => $group_id,
				'type'        => 'custom',
				'order'       => isset( $group_array['order'] ) ? Utilities::get_int_value( $group_array['order'], 999 ) : 999,
			);
		}

		uasort(
			$metadata,
			function ( $a, $b ) {
				return $a['order'] - $b['order'];
			}
		);

		return $metadata;
	}

	/**
	 * Maps control IDs to their metadata for built-in groups.
	 *
	 * @return array<string, array<string, mixed>>
	 */
	public static function get_builtin_control_mappings(): array {
		$metadata = self::get_builtin_group_metadata();

		return array(
			'fluid_spacing_presets'    => $metadata['spacing'],
			'fluid_typography_presets' => $metadata['typography'],
		);
	}

	/**
	 * Resolves group_id to Kit control_id. Checks direct ID, then prefixed format.
	 *
	 * @param string $group_id Group ID to lookup.
	 * @return string|false Control ID or false if not found in Kit settings.
	 */
	public static function get_kit_control_id( $group_id ) {
		$builtin_mappings = self::get_builtin_control_mappings();

		if ( isset( $builtin_mappings[ $group_id ] ) ) {
			return $group_id;
		}

		if ( ! Utilities::is_elementor_plugin_active() ) {
			return false;
		}

		$kit_id = \Elementor\Plugin::$instance->kits_manager->get_active_id();
		if ( ! $kit_id ) {
			return false;
		}

		$kit_id_int   = Utilities::get_int_value( $kit_id );
		$kit_settings = get_post_meta( $kit_id_int, '_elementor_page_settings', true );
		if ( ! is_array( $kit_settings ) ) {
			return false;
		}

		$group_id_str = Utilities::get_string_value( $group_id );
		if ( isset( $kit_settings[ $group_id_str ] ) ) {
			return $group_id_str;
		}

		$prefixed_id = self::get_custom_group_control_id( $group_id_str );
		if ( isset( $kit_settings[ $prefixed_id ] ) ) {
			return $prefixed_id;
		}

		return false;
	}

	/**
	 * Parses control ID to extract type and group_id. Handles legacy format.
	 *
	 * @param string $control_id Control ID to parse.
	 * @return array<string, string>|false Array with 'type' and 'group_id', or false.
	 */
	public static function parse_control_id( $control_id ) {
		if ( $control_id === 'fluid_spacing_presets' ) {
			return array(
				'type'     => 'builtin',
				'group_id' => 'spacing',
			);
		}

		if ( $control_id === 'fluid_typography_presets' ) {
			return array(
				'type'     => 'builtin',
				'group_id' => 'typography',
			);
		}

		// Custom: fluid_custom_{group_id}_presets
		if ( preg_match( '/^fluid_custom_(.+)_presets$/', $control_id, $matches ) ) {
			return array(
				'type'     => 'custom',
				'group_id' => $matches[1],
			);
		}

		// Legacy: fluid_{group_id}_presets (excluding built-ins)
		if ( preg_match( '/^fluid_(.+)_presets$/', $control_id, $matches ) ) {
			$group_part = $matches[1];

			if ( in_array( $group_part, array( 'spacing', 'typography' ), true ) ) {
				return false;
			}

			return array(
				'type'     => 'custom',
				'group_id' => $group_part,
			);
		}

		return false;
	}

	/**
	 * Auto-detects type if not provided. Cleans double prefixes.
	 *
	 * @param string      $group_id Group ID.
	 * @param string|null $type     'builtin' or 'custom', null for auto-detect.
	 */
	public static function generate_control_id( $group_id, $type = null ): string {
		if ( $type === null ) {
			$builtin_mappings = self::get_builtin_control_mappings();
			$type             = array_key_exists( 'fluid_' . $group_id . '_presets', $builtin_mappings ) ? 'builtin' : 'custom';
		}

		if ( $type === 'builtin' ) {
			if ( $group_id === 'spacing' ) {
				return 'fluid_spacing_presets';
			}
			if ( $group_id === 'typography' ) {
				return 'fluid_typography_presets';
			}
		}

		// Clean any existing prefixes to avoid double prefixing
		$clean_id = preg_replace( '/^fluid_custom_/', '', $group_id );
		$clean_id = preg_replace( '/_presets$/', '', $clean_id ?? '' );

		return 'fluid_custom_' . $clean_id . '_presets';
	}

	/** @param string $control_id */
	public static function is_valid_control_id( $control_id ): bool {
		$parsed = self::parse_control_id( $control_id );
		return $parsed !== false;
	}
}
