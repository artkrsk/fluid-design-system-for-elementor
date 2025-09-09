<?php
/**
 * Fluid Typography and Spacing tab for Elementor.
 *
 * @package Arts\FluidDesignSystem
 * @since 1.0.0
 */

namespace Arts\FluidDesignSystem\Elementor\Tabs;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

use Elementor\Core\Kits\Controls\Repeater as Global_Style_Repeater;
use \Arts\ElementorExtension\Tabs\BaseTab;
use \Elementor\Controls_Manager;
use \Elementor\Repeater;
use \Arts\FluidDesignSystem\Managers\CSSVariables;
use \Arts\FluidDesignSystem\Managers\ControlRegistry;
use \Arts\FluidDesignSystem\Managers\GroupsData;

/**
 * FluidTypographySpacing Class
 *
 * Implements a tab in Elementor for controlling fluid typography
 * and spacing presets with responsive scaling.
 *
 * @since 1.0.0
 */
class FluidTypographySpacing extends BaseTab {
	/**
	 * Tab identifier.
	 *
	 * @since 1.0.0
	 * @access public
	 * @var string
	 */
	const TAB_ID = 'arts-fluid-design-system-tab-fluid-typography-spacing';

	/**
	 * Get the title of the tab.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @return string The tab title.
	 */
	public function get_title() {
		return esc_html__( 'Fluid Typography & Spacing', 'fluid-design-system-for-elementor' );
	}

	/**
	 * Get the group this tab belongs to.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @return string The tab group.
	 */
	public function get_group() {
		return 'global';
	}

	/**
	 * Get the icon for this tab.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @return string The tab icon.
	 */
	public function get_icon() {
		return 'eicon-spacer';
	}

	/**
	 * Factory method to create a fluid preset repeater control.
	 *
	 * Creates a standardized fluid preset repeater control with consistent
	 * configuration across all fluid preset types (built-in and custom).
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @param string   $control_id The control ID.
	 * @param array    $args       Optional additional control arguments.
	 * @param Repeater $repeater   Optional custom repeater instance.
	 * @return array                  The control configuration array.
	 */
	public function create_fluid_preset_control( $control_id, $args = array(), $repeater = null ) {
		// Get the repeater control (use provided or create new)
		if ( null === $repeater ) {
			$repeater = $this->get_repeater_control();
		}

		// Base configuration for all fluid preset controls
		$base_config = array(
			'type'                     => Global_Style_Repeater::CONTROL_TYPE,
			'fields'                   => $repeater->get_controls(),
			'prevent_empty'            => false,
			'is_fluid_preset_repeater' => true,
			'selectors'                => array(
				':root' => CSSVariables::get_css_var_screen_diff() . ': calc(var(' . CSSVariables::get_css_var_max_screen_value() . ') - var(' . CSSVariables::get_css_var_min_screen_value() . '));',
			),
			'frontend_available'       => true,
			'render_type'              => 'template',
		);

		// Merge with custom arguments (allows overriding defaults)
		$config = array_merge( $base_config, $args );

		// Add the control to this instance
		$this->add_control( $control_id, $config );

		return $config;
	}

	/**
	 * Factory method to create a fluid preset section with optional description.
	 *
	 * Creates a complete fluid preset section including:
	 * - Section start with proper labeling
	 * - Optional description/info control
	 * - Fluid preset repeater control
	 * - Section end
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @param string $section_id   The section ID.
	 * @param string $control_id   The control ID for the repeater.
	 * @param string $label        The section label.
	 * @param string $description  Optional description text.
	 * @param array  $args         Optional additional control arguments.
	 * @return void
	 */
	public function create_fluid_preset_section( $section_id, $control_id, $label, $description = '', $args = array() ) {
		// Start the section
		$this->start_controls_section(
			$section_id,
			array(
				'label' => $label,
				'tab'   => $this->get_id(),
			)
		);

		// Add description if provided
		if ( ! empty( $description ) ) {
			$info_control_id = $control_id . '_info';
			$this->add_control(
				$info_control_id,
				array(
					'type'            => Controls_Manager::RAW_HTML,
					'raw'             => esc_html( $description ),
					'content_classes' => 'elementor-panel-alert elementor-panel-alert-info',
				)
			);
		}

		// Create the fluid preset control
		$this->create_fluid_preset_control( $control_id, $args );

		// End the section
		$this->end_controls_section();
	}

	/**
	 * Convenience method to create a custom group section using the factory.
	 *
	 * This is a specialized version of create_fluid_preset_section() that
	 * automatically generates IDs and uses consistent naming patterns for custom groups.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @param string $group_id     The custom group ID.
	 * @param string $name         The group display name.
	 * @param string $description  Optional description text.
	 * @param array  $args         Optional additional control arguments.
	 * @return void
	 */
	public function create_custom_group_section( $group_id, $name, $description = '', $args = array() ) {
		$section_id = ControlRegistry::get_custom_group_section_id( $group_id );
		$control_id = ControlRegistry::get_custom_group_control_id( $group_id );

		$this->create_fluid_preset_section( $section_id, $control_id, $name, $description, $args );
	}

	/**
	 * Register tab controls.
	 *
	 * @since 1.0.0
	 * @access protected
	 *
	 * @return void
	 */
	protected function register_tab_controls() {
		// Always register breakpoints first
		$this->register_section_fluid_breakpoints();

		// Register main groups (built-in + custom) in correct order
		$this->register_main_group_sections();
	}

	/**
	 * Register sections for main groups (built-in + custom) in correct order.
	 *
	 * @since 1.0.0
	 * @access private
	 *
	 * @return void
	 */
	private function register_main_group_sections() {
		// Get the main groups in the correct order
		$main_groups = $this->get_main_groups_from_manager();

		foreach ( $main_groups as $group ) {
			switch ( $group['type'] ) {
				case 'builtin':
					$this->register_builtin_group_section( $group );
					break;

				case 'custom':
					$this->register_custom_group_section( $group );
					break;
			}
		}
	}

	/**
	 * Get main groups from the groups data manager.
	 *
	 * @since 1.0.0
	 * @access private
	 *
	 * @return array Array of main groups.
	 */
	private function get_main_groups_from_manager() {
		return GroupsData::get_main_groups();
	}

	/**
	 * Register a section for a built-in group.
	 *
	 * @since 1.0.0
	 * @access private
	 *
	 * @param array $group Group data.
	 * @return void
	 */
	private function register_builtin_group_section( $group ) {
		$control_id = $group['id'];

		switch ( $control_id ) {
			case 'fluid_spacing_presets':
				$this->register_section_fluid_spacing();
				break;

			case 'fluid_typography_presets':
				$this->register_section_fluid_typography();
				break;
		}
	}

	/**
	 * Register a section for a custom group.
	 *
	 * @since 1.0.0
	 * @access private
	 *
	 * @param array $group_data Group data from groups data manager.
	 * @return void
	 */
	private function register_custom_group_section( $group_data ) {
		// Extract group information from the groups data manager format
		$group_id    = isset( $group_data['id'] ) ? $group_data['id'] : '';
		$name        = isset( $group_data['name'] ) ? $group_data['name'] : '';
		$description = isset( $group_data['description'] ) ? $group_data['description'] : '';

		if ( empty( $group_id ) || empty( $name ) ) {
			return; // Skip invalid groups
		}

		// Use convenience method for custom groups
		$this->create_custom_group_section( $group_id, $name, $description );
	}

	/**
	 * Register fluid breakpoints section.
	 *
	 * @since 1.0.0
	 * @access private
	 *
	 * @return void
	 */
	private function register_section_fluid_breakpoints() {
		$this->start_controls_section(
			'section_fluid_breakpoints',
			array(
				'label' => esc_html__( 'Breakpoints', 'fluid-design-system-for-elementor' ),
				'tab'   => $this->get_id(),
			)
		);

		// Screen width settings
		$this->add_control(
			'min_screen_width',
			array(
				'label'       => esc_html__( 'Minimum Screen Width', 'fluid-design-system-for-elementor' ),
				'type'        => Controls_Manager::NUMBER,
				'default'     => 360,
				'min'         => 0,
				'max'         => 1920,
				'step'        => 1,
				'description' => esc_html__( 'The screen width in pixels where the minimum fluid values will be applied.', 'fluid-design-system-for-elementor' ),
				'selectors'   => array(
					':root' => CSSVariables::get_css_var_min_screen() . ': {{VALUE}}px; ' . CSSVariables::get_css_var_min_screen_value() . ': {{VALUE}};',
				),
			)
		);

		$this->add_control(
			'max_screen_width',
			array(
				'label'       => esc_html__( 'Maximum Screen Width', 'fluid-design-system-for-elementor' ),
				'type'        => Controls_Manager::NUMBER,
				'default'     => 1920,
				'min'         => 0,
				'max'         => 3840,
				'step'        => 1,
				'description' => esc_html__( 'The screen width in pixels where the maximum fluid values will be applied.', 'fluid-design-system-for-elementor' ),
				'selectors'   => array(
					':root' => CSSVariables::get_css_var_max_screen() . ': {{VALUE}}px; ' . CSSVariables::get_css_var_max_screen_value() . ': {{VALUE}};',
				),
			)
		);

		$this->end_controls_section();
	}

	/**
	 * Get repeater control for fluid presets.
	 *
	 * @since 1.0.0
	 * @access private
	 *
	 * @return Repeater The repeater control.
	 */
	private function get_repeater_control() {
		$repeater = new Repeater();

		$repeater->add_control(
			'title',
			array(
				'type'               => Controls_Manager::TEXT,
				'label_block'        => true,
				'required'           => true,
				'selectors'          => array(
					':root' => CSSVariables::get_css_var_preset( '{{_id.VALUE}}' ) . ': ' . CSSVariables::get_clamp_formula( 'min', 'max' ) . ';',
				),
				'frontend_available' => true,
				'render_type'        => 'template',
			)
		);

		$repeater->add_control(
			'popover_toggle',
			array(
				'type' => Controls_Manager::POPOVER_TOGGLE,
			)
		);

		$repeater->start_popover();

		$repeater->add_control(
			'min',
			array(
				'label'              => esc_html__( 'Minimum Value', 'fluid-design-system-for-elementor' ),
				'type'               => Controls_Manager::SLIDER,
				'size_units'         => array( 'px', 'rem', 'em', '%', 'vw', 'vh' ),
				'range'              => array(
					'px'  => array(
						'min'  => 0,
						'max'  => 500,
						'step' => 1,
					),
					'rem' => array(
						'min'  => 0,
						'max'  => 50,
						'step' => 0.1,
					),
					'%'   => array(
						'min'  => 0,
						'max'  => 100,
						'step' => 1,
					),
					'vw'  => array(
						'min'  => 0,
						'max'  => 100,
						'step' => 0.1,
					),
					'vh'  => array(
						'min'  => 0,
						'max'  => 100,
						'step' => 0.1,
					),
				),
				'default'            => array(
					'unit' => 'px',
					'size' => 40,
				),
				'description'        => esc_html__( 'The design token value that will be applied at the minimum screen width.', 'fluid-design-system-for-elementor' ),
				'frontend_available' => true,
				'render_type'        => 'template',
			)
		);

		$repeater->add_control(
			'max',
			array(
				'label'              => esc_html__( 'Maximum Value', 'fluid-design-system-for-elementor' ),
				'type'               => Controls_Manager::SLIDER,
				'size_units'         => array( 'px', 'rem', 'em', '%', 'vw', 'vh' ),
				'range'              => array(
					'px'  => array(
						'min'  => 0,
						'max'  => 500,
						'step' => 1,
					),
					'rem' => array(
						'min'  => 0,
						'max'  => 50,
						'step' => 0.1,
					),
					'%'   => array(
						'min'  => 0,
						'max'  => 100,
						'step' => 1,
					),
					'vw'  => array(
						'min'  => 0,
						'max'  => 100,
						'step' => 0.1,
					),
					'vh'  => array(
						'min'  => 0,
						'max'  => 100,
						'step' => 0.1,
					),
				),
				'default'            => array(
					'unit' => 'px',
					'size' => 120,
				),
				'description'        => esc_html__( 'The design token value that will be applied at the maximum screen width.', 'fluid-design-system-for-elementor' ),
				'frontend_available' => true,
				'render_type'        => 'template',
			)
		);

		// Note: Using the same CSS variable name with different conditions
		// Elementor's CSS processing will use the last defined value
		// This allows us to override the default clamp formula with custom screen widths
		$repeater->add_control(
			'override_screen_width_enabled',
			array(
				'label'              => esc_html__( 'Use Custom Screen Width', 'fluid-design-system-for-elementor' ),
				'type'               => Controls_Manager::SWITCHER,
				'default'            => '',
				'separator'          => 'before',
				'frontend_available' => true,
				'render_type'        => 'template',
				'selectors'          => array(
					':root' => CSSVariables::CSS_VAR_PRESET_PREFIX . '{{_id.VALUE}}: ' .
					CSSVariables::get_clamp_formula(
						'min',
						'max',
						'{{overriden_min_screen_width.size}}px',
						'({{overriden_max_screen_width.size}} - {{overriden_min_screen_width.size}})'
					),
				),
			)
		);

		$repeater->add_control(
			'overriden_min_screen_width',
			array(
				'label'              => sprintf( '<strong>%s</strong>', esc_html__( 'Custom Minimum Screen Width', 'fluid-design-system-for-elementor' ) ),
				'type'               => Controls_Manager::NUMBER,
				'description'        => esc_html__( 'The screen width in pixels where the minimum fluid values will be applied.', 'fluid-design-system-for-elementor' ),
				'default'            => 360,
				'min'                => 0,
				'max'                => 1920,
				'step'               => 1,
				'frontend_available' => true,
				'render_type'        => 'template',
				'condition'          => array(
					'override_screen_width_enabled' => 'yes',
				),
			)
		);

		$repeater->add_control(
			'overriden_max_screen_width',
			array(
				'label'              => sprintf( '<strong>%s</strong>', esc_html__( 'Custom Maximum Screen Width', 'fluid-design-system-for-elementor' ) ),
				'type'               => Controls_Manager::NUMBER,
				'description'        => esc_html__( 'The screen width in pixels where the maximum fluid values will be applied.', 'fluid-design-system-for-elementor' ),
				'default'            => 1920,
				'min'                => 0,
				'max'                => 3840,
				'step'               => 1,
				'frontend_available' => true,
				'render_type'        => 'template',
				'condition'          => array(
					'override_screen_width_enabled' => 'yes',
				),
			)
		);

		$repeater->end_popover();

		/**
		 * Filter the repeater control.
		 *
		 * @since 1.0.0
		 *
		 * @param Repeater $repeater The repeater control.
		 * @param FluidTypographySpacing $this The current tab instance.
		 */
		return apply_filters( 'arts/fluid_design_system/controls/fluid_preset_repeater', $repeater, $this );
	}

	/**
	 * Register fluid spacing section.
	 *
	 * @since 1.0.0
	 * @access private
	 *
	 * @return void
	 */
	private function register_section_fluid_spacing() {
		// Get metadata for consistent labeling
		$metadata         = ControlRegistry::get_builtin_group_metadata();
		$spacing_metadata = $metadata['spacing'];

		// Use factory method to create the complete section
		$this->create_fluid_preset_section(
			'section_fluid_spacing_presets',
			'fluid_spacing_presets',
			$spacing_metadata['name'],
			$spacing_metadata['description']
		);
	}

	/**
	 * Register fluid typography section.
	 *
	 * @since 1.0.0
	 * @access private
	 *
	 * @return void
	 */
	private function register_section_fluid_typography() {
		// Get metadata for consistent labeling
		$metadata            = ControlRegistry::get_builtin_group_metadata();
		$typography_metadata = $metadata['typography'];

		// Use factory method to create the complete section
		$this->create_fluid_preset_section(
			'section_fluid_typography_presets',
			'fluid_typography_presets',
			$typography_metadata['name'],
			$typography_metadata['description']
		);
	}
}
