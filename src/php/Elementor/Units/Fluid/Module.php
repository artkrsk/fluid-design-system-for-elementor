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
	 * AJAX action identifier for saving new presets.
	 *
	 * @since 1.2.2
	 * @access public
	 * @var string
	 */
	const ACTION_SAVE_PRESET = 'arts_fluid_design_system_save_preset';

	/**
	 * AJAX action identifier for retrieving group list.
	 *
	 * @since 1.2.2
	 * @access public
	 * @var string
	 */
	const ACTION_GET_GROUPS = 'arts_fluid_design_system_get_groups';

	/**
	 * AJAX action identifier for updating existing presets.
	 *
	 * @since 2.1.0
	 * @access public
	 * @var string
	 */
	const ACTION_UPDATE_PRESET = 'arts_fluid_design_system_update_preset';

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
		$ajax_manager->register_ajax_action( self::ACTION_SAVE_PRESET, array( self::class, 'ajax_save_fluid_preset' ) );
		$ajax_manager->register_ajax_action( self::ACTION_GET_GROUPS, array( self::class, 'ajax_get_groups' ) );
		$ajax_manager->register_ajax_action( self::ACTION_UPDATE_PRESET, array( self::class, 'ajax_update_fluid_preset' ) );
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
		foreach ( $preset_collections as $control_id => $collection_data ) {
			// Validate collection structure
			if ( ! is_array( $collection_data ) || ! isset( $collection_data['title'] ) || ! isset( $collection_data['presets'] ) || ! isset( $collection_data['control_id'] ) ) {
				continue;
			}

			/** @var array{title: string, control_id: string, presets: array<int, array<string, mixed>>} $collection_data */
			$preset_group = self::process_preset_collection(
				$collection_data['title'],
				$collection_data['presets'],
				$breakpoint_settings['min_screen_width'],
				$breakpoint_settings['max_screen_width'],
				$collection_data['control_id']
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

		// Mark filter-added presets as not editable
		$num_kit_groups = count( $result );
		for ( $i = $num_kit_groups; $i < count( $filtered_result ); $i++ ) {
			if ( ! isset( $filtered_result[ $i ] ) || ! is_array( $filtered_result[ $i ] ) ) {
				continue;
			}

			if ( ! isset( $filtered_result[ $i ]['value'] ) || ! is_array( $filtered_result[ $i ]['value'] ) ) {
				continue;
			}

			foreach ( $filtered_result[ $i ]['value'] as $key => &$preset ) {
				if ( is_array( $preset ) ) {
					$preset['editable']                     = false;
					$filtered_result[ $i ]['value'][ $key ] = $preset;
				}
			}
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
	 * @return array<string, array{title: string, control_id: string, presets: array<int, array<string, mixed>>}> Array of preset collections with control_id as keys.
	 */
	public static function get_preset_collections(): array {
		// Get correct names from ControlRegistry
		$metadata = ControlRegistry::get_builtin_group_metadata();

		$spacing_name    = isset( $metadata['spacing']['name'] ) && is_string( $metadata['spacing']['name'] ) ? $metadata['spacing']['name'] : 'Spacing';
		$typography_name = isset( $metadata['typography']['name'] ) && is_string( $metadata['typography']['name'] ) ? $metadata['typography']['name'] : 'Typography';

		$spacing_presets_raw    = Utilities::get_kit_settings( 'fluid_spacing_presets', array(), false );
		$typography_presets_raw = Utilities::get_kit_settings( 'fluid_typography_presets', array(), false );

		/** @var array<int, array<string, mixed>> $spacing_presets */
		$spacing_presets = is_array( $spacing_presets_raw ) ? $spacing_presets_raw : array();

		/** @var array<int, array<string, mixed>> $typography_presets */
		$typography_presets = is_array( $typography_presets_raw ) ? $typography_presets_raw : array();

		$collections = array(
			'fluid_spacing_presets'    => array(
				'title'      => $spacing_name,
				'control_id' => 'fluid_spacing_presets',
				'presets'    => $spacing_presets,
			),
			'fluid_typography_presets' => array(
				'title'      => $typography_name,
				'control_id' => 'fluid_typography_presets',
				'presets'    => $typography_presets,
			),
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

				if ( ! is_array( $group_presets ) ) {
					$group_presets = array();
				}

				/** @var array<int, array<string, mixed>> $group_presets */
				$collections[ $control_id ] = array(
					'title'      => $group_data['name'],
					'control_id' => $control_id,
					'presets'    => $group_presets,
				);
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
	 * @param string|null                          $control_id        Control ID for the group (e.g., 'fluid_spacing_presets').
	 * @return array<string, mixed>                Formatted preset group.
	 */
	private static function process_preset_collection( $collection_title, $presets, $global_min_width, $global_max_width, $control_id = null ): array {
		$preset_group = array(
			'name'       => $collection_title,
			'control_id' => $control_id,
			'value'      => array(),
		);

		foreach ( $presets as $preset ) {
			$formatted_preset = self::format_preset(
				$preset,
				$global_min_width,
				$global_max_width
			);

			if ( $formatted_preset ) {
				// Mark Kit presets as editable
				$formatted_preset['editable'] = true;
				$preset_group['value'][]      = $formatted_preset;
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

	/**
	 * AJAX handler for saving a new fluid preset.
	 *
	 * @since 1.2.2
	 * @access public
	 * @static
	 *
	 * @param array<string, mixed> $data Data received from the AJAX request.
	 * @return array<string, mixed> Response data.
	 * @throws \Exception If validation fails or save fails.
	 */
	public static function ajax_save_fluid_preset( $data ): array {
		// Verify user permissions
		if ( ! current_user_can( 'edit_posts' ) ) {
			throw new \Exception( esc_html__( 'Access denied.', 'fluid-design-system-for-elementor' ) );
		}

		// Validate required fields (use isset to allow '0' values)
		$required_fields = array( 'title', 'min_size', 'min_unit', 'max_size', 'max_unit' );
		foreach ( $required_fields as $field ) {
			if ( ! isset( $data[ $field ] ) || $data[ $field ] === '' ) {
				/* translators: %s: Field name */
				throw new \Exception( sprintf( esc_html__( 'Missing required field: %s', 'fluid-design-system-for-elementor' ), $field ) );
			}
		}

		// Get active Kit
		$kit = \Elementor\Plugin::$instance->kits_manager->get_active_kit();
		if ( ! $kit ) {
			throw new \Exception( esc_html__( 'Could not get active Kit.', 'fluid-design-system-for-elementor' ) );
		}

		// Ensure $kit is Kit object (PHPStan)
		if ( ! $kit instanceof \Elementor\Core\Kits\Documents\Kit ) {
			throw new \Exception( esc_html__( 'Invalid Kit instance.', 'fluid-design-system-for-elementor' ) );
		}

		// Generate unique ID
		$preset_id = ! empty( $data['id'] ) && is_string( $data['id'] ) ? sanitize_key( $data['id'] ) : 'fluid-' . wp_generate_uuid4();

		// Build preset object (with type validation)
		$preset_item = array(
			'_id'   => $preset_id,
			'title' => is_string( $data['title'] ) ? sanitize_text_field( $data['title'] ) : '',
			'min'   => array(
				'size' => is_numeric( $data['min_size'] ) ? floatval( $data['min_size'] ) : 0,
				'unit' => is_string( $data['min_unit'] ) ? sanitize_text_field( $data['min_unit'] ) : 'px',
			),
			'max'   => array(
				'size' => is_numeric( $data['max_size'] ) ? floatval( $data['max_size'] ) : 0,
				'unit' => is_string( $data['max_unit'] ) ? sanitize_text_field( $data['max_unit'] ) : 'px',
			),
		);

		// Use group as control_id directly (frontend sends full control_id)
		$control_id = ! empty( $data['group'] ) && is_string( $data['group'] ) ? sanitize_key( $data['group'] ) : 'fluid_spacing_presets';

		// Add preset to Kit
		$kit->add_repeater_row( $control_id, $preset_item );

		// Return success response
		return array(
			'success'    => true,
			'id'         => $preset_id,
			'title'      => $preset_item['title'],
			'control_id' => $control_id,
		);
	}

	/**
	 * AJAX handler for retrieving group list with metadata.
	 *
	 * @since 1.2.2
	 * @access public
	 * @static
	 *
	 * @param array<string, mixed> $data Data received from the AJAX request.
	 * @return array<int, array<string, mixed>> Array of groups with id, name, type.
	 * @throws \Exception If the user does not have permission to edit posts.
	 */
	public static function ajax_get_groups( $data ): array {
		// Verify user permissions
		if ( ! current_user_can( 'edit_posts' ) ) {
			throw new \Exception( esc_html__( 'Access denied.', 'fluid-design-system-for-elementor' ) );
		}

		// Get main groups (built-in + custom) with proper IDs
		$groups = \Arts\FluidDesignSystem\Managers\GroupsData::get_main_groups();

		// Simplify response - return control_id for use in save
		$simplified = array();
		foreach ( $groups as $group ) {
			$group_id   = isset( $group['id'] ) && is_string( $group['id'] ) ? $group['id'] : '';
			$group_type = isset( $group['type'] ) && is_string( $group['type'] ) ? $group['type'] : 'builtin';

			// Determine control_id
			if ( $group_type === 'custom' && $group_id !== '' ) {
				$control_id = ControlRegistry::get_custom_group_control_id( $group_id );
			} else {
				$control_id = $group_id; // Built-in groups already have full control_id as ID
			}

			$simplified[] = array(
				'id'   => $control_id, // Full control_id for saving
				'name' => isset( $group['name'] ) && is_string( $group['name'] ) ? $group['name'] : '',
				'type' => $group_type,
			);
		}

		return $simplified;
	}

	/**
	 * AJAX handler for updating an existing fluid preset.
	 *
	 * @since 2.1.0
	 * @access public
	 * @static
	 *
	 * @param array<string, mixed> $data Data received from the AJAX request.
	 * @return array<string, mixed> Response data.
	 * @throws \Exception If validation fails or update fails.
	 */
	public static function ajax_update_fluid_preset( $data ): array {
		// Verify permissions
		if ( ! current_user_can( 'edit_posts' ) ) {
			throw new \Exception( esc_html__( 'Access denied.', 'fluid-design-system-for-elementor' ) );
		}

		// Validate required fields
		$required = array( 'preset_id', 'title', 'min_size', 'min_unit', 'max_size', 'max_unit', 'group' );
		foreach ( $required as $field ) {
			if ( ! isset( $data[ $field ] ) || $data[ $field ] === '' ) {
				/* translators: %s: Field name */
				throw new \Exception( sprintf( esc_html__( 'Missing required field: %s', 'fluid-design-system-for-elementor' ), $field ) );
			}
		}

		// Get active Kit
		$kit = \Elementor\Plugin::$instance->kits_manager->get_active_kit();
		if ( ! $kit instanceof \Elementor\Core\Kits\Documents\Kit ) {
			throw new \Exception( esc_html__( 'Invalid Kit instance.', 'fluid-design-system-for-elementor' ) );
		}

		$preset_id  = isset( $data['preset_id'] ) && is_string( $data['preset_id'] ) ? sanitize_key( $data['preset_id'] ) : '';
		$control_id = isset( $data['group'] ) && is_string( $data['group'] ) ? sanitize_key( $data['group'] ) : '';

		// Build updated preset object (only fields we're updating)
		$updated_fields = array(
			'_id'   => $preset_id,
			'title' => isset( $data['title'] ) && is_string( $data['title'] ) ? sanitize_text_field( $data['title'] ) : '',
			'min'   => array(
				'size' => isset( $data['min_size'] ) && is_numeric( $data['min_size'] ) ? floatval( $data['min_size'] ) : 0,
				'unit' => isset( $data['min_unit'] ) && is_string( $data['min_unit'] ) ? sanitize_text_field( $data['min_unit'] ) : 'px',
			),
			'max'   => array(
				'size' => isset( $data['max_size'] ) && is_numeric( $data['max_size'] ) ? floatval( $data['max_size'] ) : 0,
				'unit' => isset( $data['max_unit'] ) && is_string( $data['max_unit'] ) ? sanitize_text_field( $data['max_unit'] ) : 'px',
			),
		);

		// Update in Kit (handles autosaves internally)
		self::update_kit_repeater_item( $kit, $control_id, $preset_id, $updated_fields );

		// Return success
		return array(
			'success'    => true,
			'id'         => $preset_id,
			'title'      => $updated_fields['title'],
			'control_id' => $control_id,
		);
	}

	/**
	 * Updates a repeater item in Kit by ID.
	 * Preserves existing fields not included in $updated_fields.
	 * Handles autosaves recursively.
	 *
	 * @since 2.1.0
	 * @access private
	 * @static
	 *
	 * @param \Elementor\Core\Kits\Documents\Kit $kit           Kit document instance.
	 * @param string                              $control_id    Repeater control ID.
	 * @param string                              $item_id       Item _id to update.
	 * @param array<string, mixed>                $updated_fields Fields to update.
	 * @return void
	 * @throws \Exception If preset not found or update fails.
	 */
	private static function update_kit_repeater_item( $kit, $control_id, $item_id, $updated_fields ) {
		// Get current kit settings
		$meta_key          = \Elementor\Core\Settings\Page\Manager::META_KEY;
		$document_settings = $kit->get_meta( $meta_key );

		if ( ! is_array( $document_settings ) ) {
			throw new \Exception( esc_html__( 'Invalid Kit settings.', 'fluid-design-system-for-elementor' ) );
		}

		/** @var array<string, mixed> $document_settings */

		if ( ! isset( $document_settings[ $control_id ] ) || ! is_array( $document_settings[ $control_id ] ) ) {
			throw new \Exception( esc_html__( 'Preset group not found.', 'fluid-design-system-for-elementor' ) );
		}

		/** @var array<int, array<string, mixed>> $presets */
		$presets = $document_settings[ $control_id ];

		// Find and update the item (preserving other fields)
		$found = false;
		foreach ( $presets as $index => $existing_item ) {
			if ( ! is_array( $existing_item ) ) {
				continue;
			}

			if ( isset( $existing_item['_id'] ) && $existing_item['_id'] === $item_id ) {
				// Use array_merge to preserve fields not in $updated_fields
				// This maintains custom_screen_width and other metadata
				$document_settings[ $control_id ][ $index ] = array_merge( $existing_item, $updated_fields );
				$found                                      = true;
				break;
			}
		}

		if ( ! $found ) {
			throw new \Exception( esc_html__( 'Preset not found.', 'fluid-design-system-for-elementor' ) );
		}

		// Save settings using Page Settings Manager
		$page_settings_manager = \Elementor\Core\Settings\Manager::get_settings_managers( 'page' );

		if ( $page_settings_manager instanceof \Elementor\Core\Settings\Base\Manager ) {
			/** @var array<string, mixed> $document_settings */
			$kit_id = $kit->get_id();
			if ( is_int( $kit_id ) ) {
				$page_settings_manager->save_settings( $document_settings, $kit_id );
			}
		}

		// Handle autosave recursively
		$autosave = $kit->get_autosave();
		if ( $autosave instanceof \Elementor\Core\Kits\Documents\Kit ) {
			self::update_kit_repeater_item( $autosave, $control_id, $item_id, $updated_fields );
		}
	}
}
