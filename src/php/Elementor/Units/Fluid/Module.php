<?php
/**
 * Fluid Unit Module for handling AJAX requests.
 *
 * @package Arts\FluidDesignSystem
 * @since 1.0.0
 */

namespace Arts\FluidDesignSystem\Elementor\Units\Fluid;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

use Elementor\Core\Common\Modules\Ajax\Module as Ajax;
use Elementor\Core\Base\Module as Module_Base;
use Arts\Utilities\Utilities;
use Arts\FluidDesignSystem\Managers\CSSVariables;
use Arts\FluidDesignSystem\Managers\ControlRegistry;

/**
 * Module Class
 *
 * Handles AJAX operations for retrieving fluid design system presets
 * for use in the Elementor editor.
 *
 * @since 1.0.0
 */
class Module extends Module_Base {
	/**
	 * Module instance.
	 *
	 * @since 1.0.0
	 * @access protected
	 * @static
	 * @var Module|null The singleton instance.
	 */
	protected static $instance;

	/**
	 * AJAX action identifier for retrieving presets.
	 *
	 * @since 1.0.0
	 * @access public
	 * @var string
	 */
	const ACTION_GET_PRESETS = 'arts_fluid_design_system_presets';

	/**
	 * Get module instance.
	 *
	 * Ensures only one instance of the module is loaded or can be loaded.
	 *
	 * @since 1.0.0
	 * @access public
	 * @static
	 *
	 * @return Module An instance of the module class.
	 */
	public static function instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Get module name.
	 *
	 * Retrieve the module name.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @return string Module name.
	 */
	public function get_name() {
		return 'arts-fluid-design-system-units-fluid-ajax-handlers';
	}

	/**
	 * Register AJAX actions.
	 *
	 * Register AJAX action handlers for the module.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @param Ajax $ajax_manager An instance of the AJAX manager.
	 * @return void
	 */
	public function register_ajax_actions( Ajax $ajax_manager ) {
		$ajax_manager->register_ajax_action( self::ACTION_GET_PRESETS, array( self::class, 'ajax_fluid_design_system_presets' ) );
	}

	/**
	 * AJAX handler for retrieving fluid design system presets.
	 *
	 * Retrieves fluid spacing and typography presets configured in Elementor.
	 *
	 * @since 1.0.0
	 * @access public
	 * @static
	 *
	 * @param array<string, mixed> $data Data received from the AJAX request.
	 * @return array<int, array<string, mixed>> Formatted presets data for the fluid unit control.
	 * @throws \Exception If the user does not have permission to edit posts.
	 */
	public static function ajax_fluid_design_system_presets( $data ): array {
		// Verify user permissions
		if ( ! current_user_can( 'edit_posts' ) ) {
			throw new \Exception( esc_html__( 'Access denied.', 'fluid-design-system-for-elementor' ) );
		}

		return self::get_all_preset_groups( $data );
	}

	/**
	 * Get all preset groups including built-in, filter-based, and custom groups.
	 *
	 * This method consolidates all preset groups from various sources:
	 * - Built-in groups (Typography, Spacing) from Elementor kit settings
	 * - Filter-based groups added by developers via the custom_presets filter
	 * - Future: Custom groups stored in database (Milestone 2)
	 *
	 * @since 1.0.0
	 * @access public
	 * @static
	 *
	 * @param array<string, mixed> $data Optional data context for filter processing.
	 * @return array<int, array<string, mixed>> Formatted presets data for the fluid unit control and admin display.
	 */
	public static function get_all_preset_groups( $data = array() ): array {
		// Initialize the result with default options
		$result = self::get_default_preset_options();

		// Get global breakpoint settings
		$breakpoint_settings = self::get_breakpoint_settings();

		// Get preset settings from Elementor kit
		$preset_collections = self::get_preset_collections();

		// Process each preset collection
		foreach ( $preset_collections as $collection_title => $presets ) {
			$preset_group = self::process_preset_collection(
				$collection_title,
				$presets,
				$breakpoint_settings['min_screen_width'],
				$breakpoint_settings['max_screen_width']
			);

			if ( ! empty( $preset_group ) ) {
				$result[] = $preset_group;
			}
		}

		/**
		 * Filter to add custom fluid design system presets.
		 *
		 * Allows developers to add custom preset collections to the fluid unit control.
		 * Each custom preset group should have the following structure:
		 *
		 * array(
		 *     'name'        => 'Group Name',           // Required: Display name for the group
		 *     'description' => 'Group description',   // Optional: Description shown in admin
		 *     'value'       => array(                  // Required: Array of presets
		 *         array(
		 *             'id'              => 'preset-id',         // Required: Unique preset identifier
		 *             'value'           => 'var(--css-var)',    // Required: CSS value (CSS var or any valid CSS value)
		 *             'title'           => 'Preset Title',      // Required: Display name for the preset
		 *             'display_value'   => true|'Custom Text',  // Optional: Controls value display in UI
		 *                                                       //   true = show actual value
		 *                                                       //   string = show custom text
		 *                                                       //   omitted = show title only
		 *         ),
		 *     ),
		 * )
		 *
		 * @since 1.0.0
		 *
		 * @param array $result             The existing preset collections.
		 * @param array $breakpoint_settings Global breakpoint settings.
		 * @param array $data               The AJAX request data.
		 */
		$filtered_result = apply_filters( 'arts/fluid_design_system/custom_presets', $result, $breakpoint_settings, $data );

		// Ensure filter returns an array
		if ( ! is_array( $filtered_result ) ) {
			return $result;
		}

		/** @var array<int, array<string, mixed>> $filtered_result */
		return $filtered_result;
	}

	/**
	 * Get default preset options that should always be available.
	 *
	 * @since 1.0.0
	 * @access public
	 * @static
	 *
	 * @return array<int, array<string, string>> Array of default preset options.
	 */
	public static function get_default_preset_options(): array {
		return array(
			array(
				'name'  => esc_html__( 'Default', 'fluid-design-system-for-elementor' ),
				'value' => '',
			),
			array(
				'name'  => esc_html__( '0px', 'fluid-design-system-for-elementor' ),
				'value' => '0',
			),
		);
	}

	/**
	 * Get global breakpoint settings from Elementor kit.
	 *
	 * @since 1.0.0
	 * @access private
	 * @static
	 *
	 * @return array<string, int> Array with min and max screen width values.
	 */
	private static function get_breakpoint_settings(): array {
		$min_width = Utilities::get_kit_settings( 'min_screen_width', 360 );
		$max_width = Utilities::get_kit_settings( 'max_screen_width', 1920 );

		return array(
			'min_screen_width' => is_numeric( $min_width ) ? (int) $min_width : 360,
			'max_screen_width' => is_numeric( $max_width ) ? (int) $max_width : 1920,
		);
	}

	/**
	 * Get preset collections from Elementor kit.
	 *
	 * @since 1.0.0
	 * @access public
	 * @static
	 *
	 * @return array<string, array<int, array<string, mixed>>> Array of preset collections with titles as keys.
	 */
	public static function get_preset_collections(): array {
		// Get correct names from ControlRegistry
		$metadata = ControlRegistry::get_builtin_group_metadata();

		$spacing_name    = isset( $metadata['spacing']['name'] ) && is_string( $metadata['spacing']['name'] ) ? $metadata['spacing']['name'] : 'Spacing';
		$typography_name = isset( $metadata['typography']['name'] ) && is_string( $metadata['typography']['name'] ) ? $metadata['typography']['name'] : 'Typography';

		$spacing_presets    = Utilities::get_kit_settings( 'fluid_spacing_presets', array(), false );
		$typography_presets = Utilities::get_kit_settings( 'fluid_typography_presets', array(), false );

		/** @var array<string, array<int, array<string, mixed>>> $collections */
		$collections = array(
			$spacing_name    => is_array( $spacing_presets ) ? $spacing_presets : array(),
			$typography_name => is_array( $typography_presets ) ? $typography_presets : array(),
		);

		// Add custom groups collections
		$custom_groups = get_option( 'arts_fluid_design_system_custom_groups', array() );

		if ( is_array( $custom_groups ) ) {
			foreach ( $custom_groups as $group_id => $group_data ) {
				if ( ! is_array( $group_data ) || ! isset( $group_data['name'] ) || ! is_string( $group_data['name'] ) ) {
					continue;
				}

				$control_id    = ControlRegistry::get_custom_group_control_id( $group_id );
				$group_presets = Utilities::get_kit_settings( $control_id, array(), false );
				/** @var array<int, array<string, mixed>> $validated_presets */
				$validated_presets                  = is_array( $group_presets ) ? $group_presets : array();
				$collections[ $group_data['name'] ] = $validated_presets;
			}
		}

		return $collections;
	}

	/**
	 * Process a collection of presets into a formatted group.
	 *
	 * @since 1.0.0
	 * @access private
	 * @static
	 *
	 * @param string                               $collection_title  The title of the collection.
	 * @param array<int, array<string, mixed>>     $presets           Array of preset data.
	 * @param int                                  $global_min_width  Global minimum screen width.
	 * @param int                                  $global_max_width  Global maximum screen width.
	 * @return array<string, mixed>                Formatted preset group.
	 */
	private static function process_preset_collection( $collection_title, $presets, $global_min_width, $global_max_width ): array {
		$preset_group = array(
			'name'  => $collection_title,
			'value' => array(),
		);

		foreach ( $presets as $preset ) {
			$formatted_preset = self::format_preset(
				$preset,
				$global_min_width,
				$global_max_width
			);

			if ( $formatted_preset ) {
				$preset_group['value'][] = $formatted_preset;
			}
		}

		return $preset_group;
	}

	/**
	 * Format a single preset for use in the UI.
	 *
	 * @since 1.0.0
	 * @access private
	 * @static
	 *
	 * @param array<string, mixed> $preset            The preset data.
	 * @param int                  $global_min_width  Global minimum screen width.
	 * @param int                  $global_max_width  Global maximum screen width.
	 * @return array<string, mixed>|null              Formatted preset or null if invalid.
	 */
	private static function format_preset( $preset, $global_min_width, $global_max_width ): ?array {
		// Only process presets with a title and ID
		if ( empty( $preset['title'] ) || ! is_string( $preset['title'] ) || empty( $preset['_id'] ) || ! is_string( $preset['_id'] ) ) {
			return null;
		}

		// Validate required nested array structures
		if ( ! isset( $preset['min'] ) || ! is_array( $preset['min'] ) || ! isset( $preset['max'] ) || ! is_array( $preset['max'] ) ) {
			return null;
		}

		// Validate required min/max fields exist
		if ( ! isset( $preset['min']['size'] ) || ! isset( $preset['min']['unit'] ) || ! isset( $preset['max']['size'] ) || ! isset( $preset['max']['unit'] ) ) {
			return null;
		}

		// Validate that size values are numeric (not empty strings)
		// This prevents CSS generation failures when sizes are accidentally saved as empty
		if ( ! is_numeric( $preset['min']['size'] ) || ! is_numeric( $preset['max']['size'] ) ) {
			return null;
		}

		// Get preset-specific or global breakpoint values
		$preset_breakpoints = self::get_preset_breakpoints(
			$preset,
			$global_min_width,
			$global_max_width
		);

		// Extract necessary values from the preset
		$id    = $preset['_id'];
		$title = $preset['title'];
		$value = 'var(' . CSSVariables::get_css_var_preset( $id ) . ')';

		// Create the formatted preset
		return array(
			'id'                    => $id,
			'value'                 => $value,
			'title'                 => $title,
			'min_size'              => $preset['min']['size'],
			'min_unit'              => $preset['min']['unit'],
			'max_size'              => $preset['max']['size'],
			'max_unit'              => $preset['max']['unit'],
			'min_screen_width_size' => $preset_breakpoints['min_width'],
			'max_screen_width_size' => $preset_breakpoints['max_width'],
			'min_screen_width_unit' => 'px',
			'max_screen_width_unit' => 'px',
		);
	}

	/**
	 * Get the breakpoint values for a specific preset.
	 *
	 * @since 1.0.0
	 * @access private
	 * @static
	 *
	 * @param array<string, mixed> $preset            The preset data.
	 * @param int                  $global_min_width  Global minimum screen width.
	 * @param int                  $global_max_width  Global maximum screen width.
	 * @return array<string, int>                     Array with min_width and max_width values.
	 */
	private static function get_preset_breakpoints( $preset, $global_min_width, $global_max_width ): array {
		$min_width = $global_min_width;
		$max_width = $global_max_width;

		// Use custom breakpoints if enabled in the preset
		if ( ! empty( $preset['override_screen_width_enabled'] ) ) {
			if ( isset( $preset['overriden_min_screen_width'] ) && is_numeric( $preset['overriden_min_screen_width'] ) ) {
				$min_width = (int) $preset['overriden_min_screen_width'];
			}
			if ( isset( $preset['overriden_max_screen_width'] ) && is_numeric( $preset['overriden_max_screen_width'] ) ) {
				$max_width = (int) $preset['overriden_max_screen_width'];
			}
		}

		return array(
			'min_width' => $min_width,
			'max_width' => $max_width,
		);
	}
}
