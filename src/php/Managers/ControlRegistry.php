<?php
/**
 * Control Registry manager for Fluid Design System.
 *
 * @package Arts\FluidDesignSystem
 * @since 1.0.0
 */

namespace Arts\FluidDesignSystem\Managers;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

use \Arts\FluidDesignSystem\Base\Manager as BaseManager;
use \Arts\Utilities\Utilities;

/**
 * ControlRegistry Class
 *
 * Manages control ID generation and metadata for
 * Fluid Design System Elementor controls.
 *
 * @since 1.0.0
 */
class ControlRegistry extends BaseManager {

	/**
	 * Get control ID for custom group presets.
	 *
	 * @since 1.0.0
	 * @access public
	 * @static
	 *
	 * @param string $group_id The custom group ID.
	 * @return string The control ID.
	 */
	public static function get_custom_group_control_id( $group_id ) {
		return 'fluid_custom_' . $group_id . '_presets';
	}

	/**
	 * Get section ID for custom group presets.
	 *
	 * @since 1.0.0
	 * @access public
	 * @static
	 *
	 * @param string $group_id The custom group ID.
	 * @return string The section ID.
	 */
	public static function get_custom_group_section_id( $group_id ) {
		return 'section_fluid_custom_' . $group_id . '_presets';
	}

	/**
	 * Get info control ID for custom group presets.
	 *
	 * @since 1.0.0
	 * @access public
	 * @static
	 *
	 * @param string $group_id The custom group ID.
	 * @return string The info control ID.
	 */
	public static function get_custom_group_info_control_id( $group_id ) {
		return 'fluid_custom_' . $group_id . '_presets_info';
	}

	/**
	 * Get built-in group metadata for admin display.
	 *
	 * Returns an array mapping collection types to their display names and descriptions
	 * as defined in the Elementor controls. This ensures a single source of truth
	 * for group labels and descriptions.
	 *
	 * @since 1.0.0
	 * @access public
	 * @static
	 *
	 * @return array Array mapping collection types to display metadata.
	 */
	public static function get_builtin_group_metadata() {
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

		// Add custom groups metadata
		$custom_groups = self::get_custom_groups_metadata();

		return array_merge( $builtin_metadata, $custom_groups );
	}

	/**
	 * Get custom group metadata for admin display.
	 *
	 * Retrieves display names and descriptions for all custom preset groups
	 * by loading the group data from the saved options. This dynamically
	 * generates metadata for custom groups that have been created via the
	 * admin interface.
	 *
	 * @since 1.0.0
	 * @access public
	 * @static
	 *
	 * @return array Array mapping custom group IDs to display metadata.
	 */
	public static function get_custom_groups_metadata() {
		// Use WordPress option directly to avoid dependency issues
		$custom_groups = get_option( 'arts_fluid_design_system_custom_groups', array() );
		$metadata      = array();

		foreach ( $custom_groups as $group_id => $group_data ) {
			$metadata[ 'custom_' . $group_id ] = array(
				'name'        => $group_data['name'],
				'description' => ! empty( $group_data['description'] ) ? $group_data['description'] : '',
				'id'          => $group_id,
				'type'        => 'custom',
				'order'       => isset( $group_data['order'] ) ? (int) $group_data['order'] : 999,
			);
		}

		// Sort by order field
		uasort(
			$metadata,
			function( $a, $b ) {
				return $a['order'] - $b['order'];
			}
		);

		return $metadata;
	}

	/**
	 * Get built-in control mappings for data managers.
	 *
	 * @since 1.0.0
	 * @access public
	 * @static
	 *
	 * @return array Array mapping control IDs to group metadata.
	 */
	public static function get_builtin_control_mappings() {
		// Get metadata from this registry
		$metadata = self::get_builtin_group_metadata();

		// Map control IDs to their metadata
		return array(
			'fluid_spacing_presets'    => $metadata['spacing'],
			'fluid_typography_presets' => $metadata['typography'],
		);
	}

	/**
	 * Get the control ID for a group from kit settings.
	 *
	 * @since 1.0.0
	 *
	 * @param string $group_id Group ID to lookup.
	 * @return string|false Control ID or false if not found.
	 */
	public static function get_kit_control_id( $group_id ) {
		// Handle built-in groups
		$builtin_mappings = self::get_builtin_control_mappings();

		if ( isset( $builtin_mappings[ $group_id ] ) ) {
			return $group_id;
		}

		// Handle custom groups
		if ( ! Utilities::is_elementor_plugin_active() ) {
			return false;
		}

		$kit_id = \Elementor\Plugin::$instance->kits_manager->get_active_id();
		if ( ! $kit_id ) {
			return false;
		}

		$kit_settings = get_post_meta( $kit_id, '_elementor_page_settings', true );
		if ( ! is_array( $kit_settings ) ) {
			return false;
		}

		// Try the group ID directly first
		if ( isset( $kit_settings[ $group_id ] ) ) {
			return $group_id;
		}

		// Try with the fluid_custom_ prefix
		$prefixed_id = self::get_custom_group_control_id( $group_id );
		if ( isset( $kit_settings[ $prefixed_id ] ) ) {
			return $prefixed_id;
		}

		return false;
	}

	/**
	 * Parse a control ID to extract the group ID and type.
	 *
	 * @since 1.0.0
	 * @access public
	 * @static
	 *
	 * @param string $control_id The control ID to parse.
	 * @return array|false Array with 'type' and 'group_id' keys, or false if invalid.
	 */
	public static function parse_control_id( $control_id ) {
		// Built-in controls
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

		// Custom group controls: fluid_custom_{group_id}_presets
		if ( preg_match( '/^fluid_custom_(.+)_presets$/', $control_id, $matches ) ) {
			return array(
				'type'     => 'custom',
				'group_id' => $matches[1],
			);
		}

		// Legacy custom format: fluid_{group_id}_presets (excluding built-ins)
		if ( preg_match( '/^fluid_(.+)_presets$/', $control_id, $matches ) ) {
			$group_part = $matches[1];

			// Skip if it matches built-in patterns
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
	 * Generate a control ID from a group ID.
	 *
	 * @since 1.0.0
	 * @access public
	 * @static
	 *
	 * @param string $group_id The group ID.
	 * @param string $type The group type ('builtin' or 'custom').
	 * @return string The control ID.
	 */
	public static function generate_control_id( $group_id, $type = null ) {
		// If type not provided, try to detect it
		if ( $type === null ) {
			$builtin_mappings = self::get_builtin_control_mappings();
			$type             = array_key_exists( 'fluid_' . $group_id . '_presets', $builtin_mappings ) ? 'builtin' : 'custom';
		}

		if ( $type === 'builtin' ) {
			// Built-in groups use their standard format
			if ( $group_id === 'spacing' ) {
				return 'fluid_spacing_presets';
			}
			if ( $group_id === 'typography' ) {
				return 'fluid_typography_presets';
			}
		}

		// Custom groups need the fluid_custom_ prefix
		// Remove any existing prefixes to avoid double prefixing
		$clean_id = preg_replace( '/^fluid_custom_/', '', $group_id );
		$clean_id = preg_replace( '/_presets$/', '', $clean_id );

		return 'fluid_custom_' . $clean_id . '_presets';
	}

	/**
	 * Validate if a control ID is valid for fluid preset storage.
	 *
	 * @since 1.0.0
	 * @access public
	 * @static
	 *
	 * @param string $control_id The control ID to validate.
	 * @return bool True if valid, false otherwise.
	 */
	public static function is_valid_control_id( $control_id ) {
		$parsed = self::parse_control_id( $control_id );
		return $parsed !== false;
	}
}
