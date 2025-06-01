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

use \Elementor\Core\Common\Modules\Ajax\Module as Ajax;
use \Elementor\Core\Base\Module as Module_Base;
use \Arts\Utilities\Utilities;
use \Arts\FluidDesignSystem\Elementor\Tabs\FluidTypographySpacing;

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
	 * @param array $data Data received from the AJAX request.
	 * @return array Formatted presets data for the fluid unit control.
	 * @throws \Exception If the user does not have permission to edit posts.
	 */
	public static function ajax_fluid_design_system_presets( $data ) {
		// Verify user permissions
		if ( ! current_user_can( 'edit_posts' ) ) {
			throw new \Exception( esc_html__( 'Access denied.', 'fluid-design-system-for-elementor' ) );
		}

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
		 *
		 * @since 1.0.0
		 *
		 * @param array $result             The existing preset collections.
		 * @param array $breakpoint_settings Global breakpoint settings.
		 * @param array $data               The AJAX request data.
		 */
		$result = apply_filters( 'arts/fluid_design_system/custom_presets', $result, $breakpoint_settings, $data );

		return $result;
	}

	/**
	 * Get default preset options that should always be available.
	 *
	 * @since 1.0.0
	 * @access private
	 * @static
	 *
	 * @return array Array of default preset options.
	 */
	private static function get_default_preset_options() {
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
	 * @return array Array with min and max screen width values.
	 */
	private static function get_breakpoint_settings() {
		return array(
			'min_screen_width' => Utilities::get_kit_settings( 'min_screen_width', 360 ),
			'max_screen_width' => Utilities::get_kit_settings( 'max_screen_width', 1920 ),
		);
	}

	/**
	 * Get preset collections from Elementor kit.
	 *
	 * @since 1.0.0
	 * @access private
	 * @static
	 *
	 * @return array Array of preset collections with titles as keys.
	 */
	private static function get_preset_collections() {
		return array(
			esc_html__( 'Fluid Spacing Presets', 'fluid-design-system-for-elementor' ) =>
				Utilities::get_kit_settings( 'fluid_spacing_presets', array(), false ),
			esc_html__( 'Fluid Typography Presets', 'fluid-design-system-for-elementor' ) =>
				Utilities::get_kit_settings( 'fluid_typography_presets', array(), false ),
		);
	}

	/**
	 * Process a collection of presets into a formatted group.
	 *
	 * @since 1.0.0
	 * @access private
	 * @static
	 *
	 * @param string $collection_title  The title of the collection.
	 * @param array  $presets           Array of preset data.
	 * @param int    $global_min_width  Global minimum screen width.
	 * @param int    $global_max_width  Global maximum screen width.
	 * @return array|null               Formatted preset group or null if empty.
	 */
	private static function process_preset_collection( $collection_title, $presets, $global_min_width, $global_max_width ) {
		if ( empty( $presets ) ) {
			return null;
		}

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

		return empty( $preset_group['value'] ) ? null : $preset_group;
	}

	/**
	 * Format a single preset for use in the UI.
	 *
	 * @since 1.0.0
	 * @access private
	 * @static
	 *
	 * @param array $preset            The preset data.
	 * @param int   $global_min_width  Global minimum screen width.
	 * @param int   $global_max_width  Global maximum screen width.
	 * @return array|null              Formatted preset or null if invalid.
	 */
	private static function format_preset( $preset, $global_min_width, $global_max_width ) {
		// Only process presets with a title and ID
		if ( empty( $preset['title'] ) || empty( $preset['_id'] ) ) {
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
		$value = 'var(' . FluidTypographySpacing::get_css_var_preset( $id ) . ')';

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
	 * @param array $preset            The preset data.
	 * @param int   $global_min_width  Global minimum screen width.
	 * @param int   $global_max_width  Global maximum screen width.
	 * @return array                   Array with min_width and max_width values.
	 */
	private static function get_preset_breakpoints( $preset, $global_min_width, $global_max_width ) {
		$min_width = $global_min_width;
		$max_width = $global_max_width;

		// Use custom breakpoints if enabled in the preset
		if ( ! empty( $preset['override_screen_width_enabled'] ) ) {
			$min_width = $preset['overriden_min_screen_width'];
			$max_width = $preset['overriden_max_screen_width'];
		}

		return array(
			'min_width' => $min_width,
			'max_width' => $max_width,
		);
	}
}
