<?php
/**
 * AJAX handlers for fluid preset operations in Elementor editor.
 *
 * @package Arts\FluidDesignSystem
 * @since 1.0.0
 */

namespace Arts\FluidDesignSystem\Elementor\Units\Fluid;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use Elementor\Core\Common\Modules\Ajax\Module as Ajax;
use Elementor\Core\Base\Module as Module_Base;
use Arts\Utilities\Utilities;
use Arts\FluidDesignSystem\Managers\CSSVariables;
use Arts\FluidDesignSystem\Managers\ControlRegistry;
use Arts\FluidDesignSystem\Services\KitRepeaterService;

/**
 * AJAX handlers for fluid preset CRUD operations.
 *
 * @since 1.0.0
 */
class Module extends Module_Base {
	/** @var Module|null */
	protected static $instance;

	const ACTION_GET_PRESETS   = 'arts_fluid_design_system_presets';
	const ACTION_SAVE_PRESET   = 'arts_fluid_design_system_save_preset';
	const ACTION_GET_GROUPS    = 'arts_fluid_design_system_get_groups';
	const ACTION_UPDATE_PRESET = 'arts_fluid_design_system_update_preset';

	/** @return Module */
	public static function instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/** @inheritDoc */
	public function get_name() {
		return 'arts-fluid-design-system-units-fluid-ajax-handlers';
	}

	/**
	 * @param Ajax $ajax_manager Elementor AJAX manager.
	 */
	public function register_ajax_actions( Ajax $ajax_manager ): void {
		$ajax_manager->register_ajax_action( self::ACTION_GET_PRESETS, array( self::class, 'ajax_fluid_design_system_presets' ) );
		$ajax_manager->register_ajax_action( self::ACTION_SAVE_PRESET, array( self::class, 'ajax_save_fluid_preset' ) );
		$ajax_manager->register_ajax_action( self::ACTION_GET_GROUPS, array( self::class, 'ajax_get_groups' ) );
		$ajax_manager->register_ajax_action( self::ACTION_UPDATE_PRESET, array( self::class, 'ajax_update_fluid_preset' ) );
	}

	/**
	 * @param array<string, mixed> $data AJAX request data.
	 * @return array<int, array<string, mixed>> Formatted presets for fluid unit control.
	 * @throws \Exception On permission denied.
	 */
	public static function ajax_fluid_design_system_presets( $data ): array {
		if ( ! current_user_can( 'edit_posts' ) ) {
			throw new \Exception( esc_html__( 'Access denied.', 'fluid-design-system-for-elementor' ) );
		}

		return self::get_all_preset_groups( $data );
	}

	/**
	 * Aggregates presets from Kit settings, custom groups, and filter-based sources.
	 *
	 * @param array<string, mixed> $data Optional context for filter processing.
	 * @return array<int, array<string, mixed>> Formatted presets for dropdown.
	 */
	public static function get_all_preset_groups( $data = array() ): array {
		$result              = self::get_default_preset_options();
		$breakpoint_settings = self::get_breakpoint_settings();
		$preset_collections  = self::get_preset_collections();

		foreach ( $preset_collections as $control_id => $collection_data ) {
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
		 * Adds custom preset groups. Filter-added presets are marked non-editable.
		 *
		 * Expected structure per group:
		 * - name: string (required)
		 * - value: array of presets with id, value, title keys (required)
		 * - description: string (optional)
		 *
		 * @since 1.0.0
		 * @param array<int, array<string, mixed>> $result             Existing presets.
		 * @param array<string, int>               $breakpoint_settings Min/max screen widths.
		 * @param array<string, mixed>             $data                AJAX request data.
		 */
		$filtered_result = apply_filters( 'arts/fluid_design_system/custom_presets', $result, $breakpoint_settings, $data );

		if ( ! is_array( $filtered_result ) ) {
			return $result;
		}

		// Mark filter-added groups as non-editable (Kit presets remain editable)
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
	 * @return array<int, array<string, string>> Default + 0px options always shown first.
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
	 * @return array<string, int> Global min/max breakpoints from Kit settings.
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
	 * Built-in + custom group presets from Kit settings.
	 *
	 * @return array<string, array{title: string, control_id: string, presets: array<int, array<string, mixed>>}>
	 */
	public static function get_preset_collections(): array {
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
	 * @param string                           $collection_title Group display name.
	 * @param array<int, array<string, mixed>> $presets          Raw preset data from Kit.
	 * @param int                              $global_min_width Global min breakpoint.
	 * @param int                              $global_max_width Global max breakpoint.
	 * @param string|null                      $control_id       Control ID for saving.
	 * @return array<string, mixed> Formatted group with value array.
	 */
	private static function process_preset_collection( $collection_title, $presets, $global_min_width, $global_max_width, $control_id = null ): array {
		$preset_group = array(
			'name'       => $collection_title,
			'control_id' => $control_id,
			'value'      => array(),
		);

		foreach ( $presets as $preset ) {
			$formatted_preset = self::format_preset( $preset, $global_min_width, $global_max_width );

			if ( $formatted_preset ) {
				$formatted_preset['editable'] = true;
				$preset_group['value'][]      = $formatted_preset;
			}
		}

		return $preset_group;
	}

	/**
	 * Transforms Kit preset data to dropdown format. Returns null for invalid presets.
	 *
	 * Validates: title, _id, min/max arrays with size+unit, numeric size values.
	 * Empty size strings cause CSS generation failures - filtered out here.
	 *
	 * @param array<string, mixed> $preset           Raw preset from Kit.
	 * @param int                  $global_min_width Fallback min breakpoint.
	 * @param int                  $global_max_width Fallback max breakpoint.
	 * @return array<string, mixed>|null Formatted preset or null if invalid.
	 */
	private static function format_preset( $preset, $global_min_width, $global_max_width ): ?array {
		if ( empty( $preset['title'] ) || ! is_string( $preset['title'] ) || empty( $preset['_id'] ) || ! is_string( $preset['_id'] ) ) {
			return null;
		}

		if ( ! isset( $preset['min'] ) || ! is_array( $preset['min'] ) || ! isset( $preset['max'] ) || ! is_array( $preset['max'] ) ) {
			return null;
		}

		if ( ! isset( $preset['min']['size'] ) || ! isset( $preset['min']['unit'] ) || ! isset( $preset['max']['size'] ) || ! isset( $preset['max']['unit'] ) ) {
			return null;
		}

		if ( ! is_numeric( $preset['min']['size'] ) || ! is_numeric( $preset['max']['size'] ) ) {
			return null;
		}

		$preset_breakpoints = self::get_preset_breakpoints( $preset, $global_min_width, $global_max_width );

		return array(
			'id'                    => $preset['_id'],
			'value'                 => 'var(' . CSSVariables::get_css_var_preset( $preset['_id'] ) . ')',
			'title'                 => $preset['title'],
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
	 * Uses preset-specific breakpoints when override_screen_width_enabled is set.
	 *
	 * @param array<string, mixed> $preset           Preset with optional override fields.
	 * @param int                  $global_min_width Fallback min.
	 * @param int                  $global_max_width Fallback max.
	 * @return array<string, int> min_width and max_width.
	 */
	private static function get_preset_breakpoints( $preset, $global_min_width, $global_max_width ): array {
		$min_width = $global_min_width;
		$max_width = $global_max_width;

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
	 * Creates preset in Kit via add_repeater_row. Uses isset() for validation since '0' is valid.
	 *
	 * @param array<string, mixed> $data title, min_size, min_unit, max_size, max_unit, group.
	 * @return array<string, mixed> success, id, title, control_id.
	 * @throws \Exception On validation/permission failure.
	 */
	public static function ajax_save_fluid_preset( $data ): array {
		if ( ! current_user_can( 'edit_posts' ) ) {
			throw new \Exception( esc_html__( 'Access denied.', 'fluid-design-system-for-elementor' ) );
		}

		$required_fields = array( 'title', 'min_size', 'min_unit', 'max_size', 'max_unit' );
		foreach ( $required_fields as $field ) {
			if ( ! isset( $data[ $field ] ) || $data[ $field ] === '' ) {
				/* translators: %s: Field name */
				throw new \Exception( sprintf( esc_html__( 'Missing required field: %s', 'fluid-design-system-for-elementor' ), esc_html( $field ) ) );
			}
		}

		$kit = \Elementor\Plugin::$instance->kits_manager->get_active_kit();
		if ( ! $kit instanceof \Elementor\Core\Kits\Documents\Kit ) {
			throw new \Exception( esc_html__( 'Invalid Kit instance.', 'fluid-design-system-for-elementor' ) );
		}

		$preset_id = ! empty( $data['id'] ) && is_string( $data['id'] ) ? sanitize_key( $data['id'] ) : 'fluid-' . wp_generate_uuid4();

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

		$control_id = ! empty( $data['group'] ) && is_string( $data['group'] ) ? sanitize_key( $data['group'] ) : 'fluid_spacing_presets';

		$kit->add_repeater_row( $control_id, $preset_item );

		return array(
			'success'    => true,
			'id'         => $preset_id,
			'title'      => $preset_item['title'],
			'control_id' => $control_id,
		);
	}

	/**
	 * Returns simplified group list with control_id for saving.
	 *
	 * @param array<string, mixed> $data Unused.
	 * @return array<int, array<string, mixed>> id (control_id), name, type per group.
	 * @throws \Exception On permission denied.
	 */
	public static function ajax_get_groups( $data ): array {
		if ( ! current_user_can( 'edit_posts' ) ) {
			throw new \Exception( esc_html__( 'Access denied.', 'fluid-design-system-for-elementor' ) );
		}

		$groups     = \Arts\FluidDesignSystem\Managers\GroupsData::get_main_groups();
		$simplified = array();

		foreach ( $groups as $group ) {
			$group_id   = isset( $group['id'] ) && is_string( $group['id'] ) ? $group['id'] : '';
			$group_type = isset( $group['type'] ) && is_string( $group['type'] ) ? $group['type'] : 'builtin';

			// Custom groups need control_id transformation; built-in already use control_id as ID
			$control_id = ( $group_type === 'custom' && $group_id !== '' )
				? ControlRegistry::get_custom_group_control_id( $group_id )
				: $group_id;

			$simplified[] = array(
				'id'   => $control_id,
				'name' => isset( $group['name'] ) && is_string( $group['name'] ) ? $group['name'] : '',
				'type' => $group_type,
			);
		}

		return $simplified;
	}

	/**
	 * Updates existing preset via KitRepeaterService (handles autosave sync).
	 *
	 * @param array<string, mixed> $data preset_id, title, min_size, min_unit, max_size, max_unit, group.
	 * @return array<string, mixed> success, id, title, control_id.
	 * @throws \Exception On validation/permission failure.
	 */
	public static function ajax_update_fluid_preset( $data ): array {
		if ( ! current_user_can( 'edit_posts' ) ) {
			throw new \Exception( esc_html__( 'Access denied.', 'fluid-design-system-for-elementor' ) );
		}

		$required = array( 'preset_id', 'title', 'min_size', 'min_unit', 'max_size', 'max_unit', 'group' );
		foreach ( $required as $field ) {
			if ( ! isset( $data[ $field ] ) || $data[ $field ] === '' ) {
				/* translators: %s: Field name */
				throw new \Exception( sprintf( esc_html__( 'Missing required field: %s', 'fluid-design-system-for-elementor' ), esc_html( $field ) ) );
			}
		}

		$kit = \Elementor\Plugin::$instance->kits_manager->get_active_kit();
		if ( ! $kit instanceof \Elementor\Core\Kits\Documents\Kit ) {
			throw new \Exception( esc_html__( 'Invalid Kit instance.', 'fluid-design-system-for-elementor' ) );
		}

		$preset_id  = isset( $data['preset_id'] ) && is_string( $data['preset_id'] ) ? sanitize_key( $data['preset_id'] ) : '';
		$control_id = isset( $data['group'] ) && is_string( $data['group'] ) ? sanitize_key( $data['group'] ) : '';

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

		KitRepeaterService::update_item( $kit, $control_id, $preset_id, $updated_fields );

		return array(
			'success'    => true,
			'id'         => $preset_id,
			'title'      => $updated_fields['title'],
			'control_id' => $control_id,
		);
	}
}
