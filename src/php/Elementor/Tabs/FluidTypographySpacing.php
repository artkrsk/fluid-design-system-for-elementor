<?php
/**
 * Fluid Typography and Spacing tab for Elementor Site Settings.
 *
 * @package Arts\FluidDesignSystem
 * @since 1.0.0
 */

namespace Arts\FluidDesignSystem\Elementor\Tabs;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use Elementor\Core\Kits\Controls\Repeater as Global_Style_Repeater;
use Arts\ElementorExtension\Tabs\BaseTab;
use Elementor\Controls_Manager;
use Elementor\Repeater;
use Arts\FluidDesignSystem\Managers\CSSVariables;
use Arts\FluidDesignSystem\Managers\ControlRegistry;
use Arts\FluidDesignSystem\Managers\GroupsData;
use Arts\Utilities\Utilities;

/**
 * Elementor Site Settings tab for fluid typography and spacing presets.
 *
 * @since 1.0.0
 */
class FluidTypographySpacing extends BaseTab {
	/** @var string */
	const TAB_ID = 'arts-fluid-design-system-tab-fluid-typography-spacing';

	/** @inheritDoc */
	public function get_title(): string {
		return esc_html__( 'Fluid Typography & Spacing', 'fluid-design-system-for-elementor' );
	}

	/** @inheritDoc */
	public function get_group(): string {
		return 'global';
	}

	/** @inheritDoc */
	public function get_icon(): string {
		return 'eicon-spacer';
	}

	/**
	 * Creates a fluid preset repeater control with consistent configuration.
	 *
	 * The 'is_fluid_preset_repeater' flag enables JS-side detection for custom UI behavior.
	 *
	 * @since 1.0.0
	 *
	 * @param string                $control_id Control ID.
	 * @param array<string, mixed>  $args       Optional control arguments to merge.
	 * @param Repeater|null         $repeater   Optional custom repeater instance.
	 * @return array<string, mixed> The control configuration.
	 */
	public function create_fluid_preset_control( $control_id, $args = array(), $repeater = null ): array {
		if ( null === $repeater ) {
			$repeater = $this->get_repeater_control();
		}

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

		$config = array_merge( $base_config, $args );
		$this->add_control( $control_id, $config );

		return $config;
	}

	/**
	 * Creates a complete fluid preset section with optional info alert.
	 *
	 * @since 1.0.0
	 *
	 * @param string               $section_id  Section ID.
	 * @param string               $control_id  Repeater control ID.
	 * @param string               $label       Section label.
	 * @param string               $description Optional info text shown as alert.
	 * @param array<string, mixed> $args        Optional control arguments.
	 */
	public function create_fluid_preset_section( $section_id, $control_id, $label, $description = '', $args = array() ): void {
		$this->start_controls_section(
			$section_id,
			array(
				'label' => $label,
				'tab'   => $this->get_id(),
			)
		);

		if ( ! empty( $description ) ) {
			$this->add_control(
				$control_id . '_info',
				array(
					'type'            => Controls_Manager::RAW_HTML,
					'raw'             => esc_html( $description ),
					'content_classes' => 'elementor-panel-alert elementor-panel-alert-info',
				)
			);
		}

		$this->create_fluid_preset_control( $control_id, $args );
		$this->end_controls_section();
	}

	/**
	 * Creates a custom group section with auto-generated IDs from ControlRegistry.
	 *
	 * @since 1.0.0
	 *
	 * @param string               $group_id    Custom group ID.
	 * @param string               $name        Display name.
	 * @param string               $description Optional info text.
	 * @param array<string, mixed> $args        Optional control arguments.
	 */
	public function create_custom_group_section( $group_id, $name, $description = '', $args = array() ): void {
		$section_id = ControlRegistry::get_custom_group_section_id( $group_id );
		$control_id = ControlRegistry::get_custom_group_control_id( $group_id );

		$this->create_fluid_preset_section( $section_id, $control_id, $name, $description, $args );
	}

	/** @inheritDoc */
	protected function register_tab_controls(): void {
		$this->register_section_fluid_breakpoints();
		$this->register_main_group_sections();
	}

	/** Registers built-in and custom group sections in user-defined order. */
	private function register_main_group_sections(): void {
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
	 * @return array<int, array<string, mixed>>
	 */
	private function get_main_groups_from_manager(): array {
		return GroupsData::get_main_groups();
	}

	/**
	 * Routes built-in group IDs to their registration methods.
	 *
	 * @param array<string, mixed> $group Group data with 'id' key.
	 */
	private function register_builtin_group_section( array $group ): void {
		if ( ! isset( $group['id'] ) ) {
			return;
		}

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
	 * @param array<string, mixed> $group_data Group data from GroupsData.
	 */
	private function register_custom_group_section( array $group_data ): void {
		$group_id    = Utilities::get_string_value( $group_data['id'] ?? '' );
		$name        = Utilities::get_string_value( $group_data['name'] ?? '' );
		$description = Utilities::get_string_value( $group_data['description'] ?? '' );

		if ( empty( $group_id ) || empty( $name ) ) {
			return;
		}

		$this->create_custom_group_section( $group_id, $name, $description );
	}

	/** Global breakpoints used for clamp() calculations when presets don't override. */
	private function register_section_fluid_breakpoints(): void {
		$this->start_controls_section(
			'section_fluid_breakpoints',
			array(
				'label' => esc_html__( 'Breakpoints', 'fluid-design-system-for-elementor' ),
				'tab'   => $this->get_id(),
			)
		);

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
	 * Builds the repeater control structure for fluid presets.
	 *
	 * The 'title' selector generates the clamp() CSS variable using min/max values.
	 * Override controls allow per-preset breakpoint customization.
	 */
	private function get_repeater_control(): Repeater {
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

		// Selector intentionally redefines the same CSS variable - Elementor uses last value,
		// allowing custom breakpoints to override the default clamp formula when enabled
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
		 * Allows adding custom fields to the preset repeater.
		 *
		 * @since 1.0.0
		 * @param Repeater $repeater The repeater instance.
		 * @param self     $tab      The current tab instance.
		 * @return Repeater
		 */
		$filtered = apply_filters( 'arts/fluid_design_system/controls/fluid_preset_repeater', $repeater, $this );

		return $filtered instanceof Repeater ? $filtered : $repeater;
	}

	private function register_section_fluid_spacing(): void {
		$metadata = ControlRegistry::get_builtin_group_metadata();

		if ( ! isset( $metadata['spacing'] ) || ! is_array( $metadata['spacing'] ) ) {
			return;
		}

		$this->create_fluid_preset_section(
			'section_fluid_spacing_presets',
			'fluid_spacing_presets',
			Utilities::get_string_value( $metadata['spacing']['name'] ?? '' ),
			Utilities::get_string_value( $metadata['spacing']['description'] ?? '' )
		);
	}

	private function register_section_fluid_typography(): void {
		$metadata = ControlRegistry::get_builtin_group_metadata();

		if ( ! isset( $metadata['typography'] ) || ! is_array( $metadata['typography'] ) ) {
			return;
		}

		$this->create_fluid_preset_section(
			'section_fluid_typography_presets',
			'fluid_typography_presets',
			Utilities::get_string_value( $metadata['typography']['name'] ?? '' ),
			Utilities::get_string_value( $metadata['typography']['description'] ?? '' )
		);
	}
}
