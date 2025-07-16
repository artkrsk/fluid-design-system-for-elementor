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
	 * CSS variable prefix for fluid design system.
	 *
	 * @since 1.0.0
	 * @access public
	 * @var string
	 */
	const CSS_VAR_PREFIX = 'arts-fluid';

	/**
	 * CSS variable prefix for fluid presets.
	 *
	 * @since 1.0.0
	 * @access public
	 * @var string
	 */
	const CSS_VAR_PRESET_PREFIX = '--' . self::CSS_VAR_PREFIX . '-preset--';

	/**
	 * CSS variable for minimum screen width.
	 *
	 * @since 1.0.0
	 * @access public
	 * @var string
	 */
	const CSS_VAR_MIN_SCREEN = '--' . self::CSS_VAR_PREFIX . '-min-screen';

	/**
	 * CSS variable for minimum screen width value.
	 *
	 * @since 1.0.0
	 * @access public
	 * @var string
	 */
	const CSS_VAR_MIN_SCREEN_VALUE = '--' . self::CSS_VAR_PREFIX . '-min-screen-value';

	/**
	 * CSS variable for maximum screen width.
	 *
	 * @since 1.0.0
	 * @access public
	 * @var string
	 */
	const CSS_VAR_MAX_SCREEN = '--' . self::CSS_VAR_PREFIX . '-max-screen';

	/**
	 * CSS variable for maximum screen width value.
	 *
	 * @since 1.0.0
	 * @access public
	 * @var string
	 */
	const CSS_VAR_MAX_SCREEN_VALUE = '--' . self::CSS_VAR_PREFIX . '-max-screen-value';

	/**
	 * CSS variable for screen difference calculation.
	 *
	 * @since 1.0.0
	 * @access public
	 * @var string
	 */
	const CSS_VAR_SCREEN_DIFF = '--' . self::CSS_VAR_PREFIX . '-screen-diff';

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
	 * Get CSS variable name for a preset with the specified ID.
	 *
	 * @since 1.0.0
	 * @access public
	 * @static
	 *
	 * @param string $id The preset ID.
	 * @return string The CSS variable name.
	 */
	public static function get_css_var_preset( $id ) {
		return apply_filters(
			'arts/fluid_design_system/css/var_preset',
			self::CSS_VAR_PRESET_PREFIX . $id,
			$id
		);
	}

	/**
	 * Get CSS variable name for minimum screen width.
	 *
	 * @since 1.0.0
	 * @access public
	 * @static
	 *
	 * @return string The CSS variable name.
	 */
	public static function get_css_var_min_screen() {
		return apply_filters(
			'arts/fluid_design_system/css/var_min_screen',
			self::CSS_VAR_MIN_SCREEN
		);
	}

	/**
	 * Get CSS variable name for minimum screen width value.
	 *
	 * @since 1.0.0
	 * @access public
	 * @static
	 *
	 * @return string The CSS variable name.
	 */
	public static function get_css_var_min_screen_value() {
		return apply_filters(
			'arts/fluid_design_system/css/var_min_screen_value',
			self::CSS_VAR_MIN_SCREEN_VALUE
		);
	}

	/**
	 * Get CSS variable name for maximum screen width.
	 *
	 * @since 1.0.0
	 * @access public
	 * @static
	 *
	 * @return string The CSS variable name.
	 */
	public static function get_css_var_max_screen() {
		return apply_filters(
			'arts/fluid_design_system/css/var_max_screen',
			self::CSS_VAR_MAX_SCREEN
		);
	}

	/**
	 * Get CSS variable name for maximum screen width value.
	 *
	 * @since 1.0.0
	 * @access public
	 * @static
	 *
	 * @return string The CSS variable name.
	 */
	public static function get_css_var_max_screen_value() {
		return apply_filters(
			'arts/fluid_design_system/css/var_max_screen_value',
			self::CSS_VAR_MAX_SCREEN_VALUE
		);
	}

	/**
	 * Get CSS variable name for screen difference.
	 *
	 * @since 1.0.0
	 * @access public
	 * @static
	 *
	 * @return string The CSS variable name.
	 */
	public static function get_css_var_screen_diff() {
		return apply_filters(
			'arts/fluid_design_system/css/var_screen_diff',
			self::CSS_VAR_SCREEN_DIFF
		);
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
		$this->register_section_fluid_breakpoints();
		$this->register_section_fluid_spacing();
		$this->register_section_fluid_typography();
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
			'section_fluid_breakpoins',
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
					':root' => self::get_css_var_min_screen() . ': {{VALUE}}px; ' . self::get_css_var_min_screen_value() . ': {{VALUE}};',
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
					':root' => self::get_css_var_max_screen() . ': {{VALUE}}px; ' . self::get_css_var_max_screen_value() . ': {{VALUE}};',
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
					':root' => self::get_css_var_preset( '{{_id.VALUE}}' ) . ': ' . self::get_clamp_formula( 'min', 'max' ) . ';',
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
					':root' => self::CSS_VAR_PRESET_PREFIX . '{{_id.VALUE}}: ' .
					self::get_clamp_formula(
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
		$this->start_controls_section(
			'section_fluid_spacing_presets',
			array(
				'label' => esc_html__( 'Spacing Presets', 'fluid-design-system-for-elementor' ),
				'tab'   => $this->get_id(),
			)
		);

		$repeater = $this->get_repeater_control();

		$this->add_control(
			'fluid_spacing_presets',
			array(
				'type'               => Global_Style_Repeater::CONTROL_TYPE,
				'fields'             => $repeater->get_controls(),
				'prevent_empty'      => false,
				'selectors'          => array(
					':root' => self::get_css_var_screen_diff() . ': calc(var(' . self::get_css_var_max_screen_value() . ') - var(' . self::get_css_var_min_screen_value() . '));',
				),
				'frontend_available' => true,
				'render_type'        => 'template',
			)
		);

		$this->end_controls_section();
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
		$this->start_controls_section(
			'section_fluid_typography_presets',
			array(
				'label' => esc_html__( 'Typography Presets', 'fluid-design-system-for-elementor' ),
				'tab'   => $this->get_id(),
			)
		);

		$repeater = $this->get_repeater_control();

		$this->add_control(
			'fluid_typography_presets',
			array(
				'type'               => Global_Style_Repeater::CONTROL_TYPE,
				'fields'             => $repeater->get_controls(),
				'prevent_empty'      => false,
				'selectors'          => array(
					':root' => self::get_css_var_screen_diff() . ': calc(var(' . self::get_css_var_max_screen_value() . ') - var(' . self::get_css_var_min_screen_value() . '));',
				),
				'frontend_available' => true,
				'render_type'        => 'template',
			)
		);

		$this->end_controls_section();
	}

	/**
	 * Generates a CSS clamp formula for the fluid unit
	 *
	 * @since 1.0.0
	 * @access public
	 * @static
	 *
	 * @param string      $min_value The control name for minimum value
	 * @param string      $max_value The control name for maximum value
	 * @param string|null $min_screen The minimum screen width value or CSS variable
	 * @param string|null $max_screen The maximum screen width value or CSS variable
	 *
	 * @return string The complete clamp formula
	 */
	public static function get_clamp_formula( $min_value, $max_value, $min_screen = null, $max_screen = null ) {
		// Break down the formula into logical parts
		$min_size = '{{' . $min_value . '.size}}{{' . $min_value . '.unit}}';
		$max_size = '{{' . $max_value . '.size}}{{' . $max_value . '.unit}}';

		// Calculate the difference between max and min values
		$value_diff = '({{' . $max_value . '.size}} - {{' . $min_value . '.size}})';

		// Use provided values or fall back to CSS variables
		if ( $min_screen === null ) {
			$min_screen = 'var(' . self::get_css_var_min_screen() . ')';
		}
		if ( $max_screen === null ) {
			$max_screen = 'var(' . self::get_css_var_screen_diff() . ')';
		}

		$viewport_calc = "(100vw - {$min_screen})";

		// Build the formula
		$formula = "clamp({$min_size}, calc({$min_size} + ({$value_diff} * {$viewport_calc} / {$max_screen})), {$max_size})";

		// Allow filtering of the complete formula
		return apply_filters(
			'arts/fluid_design_system/css/clamp_formula',
			$formula,
			array(
				'min_value'     => $min_value,
				'max_value'     => $max_value,
				'min_screen'    => $min_screen,
				'max_screen'    => $max_screen,
				'min_size'      => $min_size,
				'max_size'      => $max_size,
				'value_diff'    => $value_diff,
				'viewport_calc' => $viewport_calc,
			)
		);
	}
}
