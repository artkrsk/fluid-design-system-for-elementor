<?php
/**
 * CSS Variables manager for Fluid Design System.
 *
 * @package Arts\FluidDesignSystem
 * @since 1.0.0
 */

namespace Arts\FluidDesignSystem\Managers;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

use \Arts\FluidDesignSystem\Base\Manager as BaseManager;

/**
 * CSSVariables Class
 *
 * Manages CSS variable generation and clamp formula creation
 * for the Fluid Design System.
 *
 * @since 1.0.0
 */
class CSSVariables extends BaseManager {

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
	 * Get CSS variable name for a preset with the specified ID.
	 *
	 * @since 1.0.0
	 * @access public
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
	 * Generates a CSS clamp formula for the fluid unit.
	 *
	 * @since 1.0.0
	 * @access public
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

		// Calculate the difference between max and min values with explicit parentheses
		$value_diff = '({{' . $max_value . '.size}} - {{' . $min_value . '.size}})';

		// Use provided values or fall back to CSS variables
		if ( $min_screen === null ) {
			$min_screen = 'var(' . self::get_css_var_min_screen() . ')';
		}
		if ( $max_screen === null ) {
			$max_screen = 'var(' . self::get_css_var_screen_diff() . ')';
		}

		// Explicit parentheses around viewport calculation
		$viewport_calc = "(100vw - {$min_screen})";

		// Explicit parentheses around division operation
		$scaling_factor = "({$value_diff} * ({$viewport_calc} / {$max_screen}))";

		// Build the formula with proper grouping to handle mixed signs
		// Use parentheses around the entire addition to ensure proper calculation
		$preferred_value = "calc(({$min_size}) + ({$scaling_factor}))";

		// Use CSS min() and max() to automatically determine correct bounds
		// This handles both normal cases (min < max) and inverted cases (min > max)
		$lower_bound = "min({$min_size}, {$max_size})";
		$upper_bound = "max({$min_size}, {$max_size})";

		// Build the clamp with dynamic bounds
		$formula = "clamp({$lower_bound}, {$preferred_value}, {$upper_bound})";

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
