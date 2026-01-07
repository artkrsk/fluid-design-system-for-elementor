<?php
/**
 * CSS variable naming and clamp() formula generation.
 *
 * Constants must match JavaScript: constants/STYLES.ts
 *
 * @package Arts\FluidDesignSystem
 * @since 1.0.0
 */

namespace Arts\FluidDesignSystem\Managers;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use Arts\FluidDesignSystem\Base\Manager as BaseManager;

/**
 * CSS variable constants and clamp() formula builder.
 *
 * @since 1.0.0
 */
class CSSVariables extends BaseManager {

	const CSS_VAR_PREFIX           = 'arts-fluid';
	const CSS_VAR_PRESET_PREFIX    = '--' . self::CSS_VAR_PREFIX . '-preset--';
	const CSS_VAR_MIN_SCREEN       = '--' . self::CSS_VAR_PREFIX . '-min-screen';
	const CSS_VAR_MIN_SCREEN_VALUE = '--' . self::CSS_VAR_PREFIX . '-min-screen-value';
	const CSS_VAR_MAX_SCREEN       = '--' . self::CSS_VAR_PREFIX . '-max-screen';
	const CSS_VAR_MAX_SCREEN_VALUE = '--' . self::CSS_VAR_PREFIX . '-max-screen-value';
	const CSS_VAR_SCREEN_DIFF      = '--' . self::CSS_VAR_PREFIX . '-screen-diff';

	/** @param string $id Preset ID (Elementor _id). */
	public static function get_css_var_preset( string $id ): string {
		/** @var string */
		$result = apply_filters(
			'arts/fluid_design_system/css/var_preset',
			self::CSS_VAR_PRESET_PREFIX . $id,
			$id
		);
		return $result;
	}

	public static function get_css_var_min_screen(): string {
		/** @var string */
		$result = apply_filters(
			'arts/fluid_design_system/css/var_min_screen',
			self::CSS_VAR_MIN_SCREEN
		);
		return $result;
	}

	public static function get_css_var_min_screen_value(): string {
		/** @var string */
		$result = apply_filters(
			'arts/fluid_design_system/css/var_min_screen_value',
			self::CSS_VAR_MIN_SCREEN_VALUE
		);
		return $result;
	}

	public static function get_css_var_max_screen(): string {
		/** @var string */
		$result = apply_filters(
			'arts/fluid_design_system/css/var_max_screen',
			self::CSS_VAR_MAX_SCREEN
		);
		return $result;
	}

	public static function get_css_var_max_screen_value(): string {
		/** @var string */
		$result = apply_filters(
			'arts/fluid_design_system/css/var_max_screen_value',
			self::CSS_VAR_MAX_SCREEN_VALUE
		);
		return $result;
	}

	public static function get_css_var_screen_diff(): string {
		/** @var string */
		$result = apply_filters(
			'arts/fluid_design_system/css/var_screen_diff',
			self::CSS_VAR_SCREEN_DIFF
		);
		return $result;
	}

	/**
	 * Generates clamp(min, preferred, max) with dynamic bounds.
	 *
	 * Uses CSS min()/max() to handle both normal (min < max) and inverted (min > max) cases.
	 * Explicit parentheses ensure proper order of operations with mixed units.
	 *
	 * @param string      $min_value  Elementor control name for min value.
	 * @param string      $max_value  Elementor control name for max value.
	 * @param string|null $min_screen Custom min breakpoint or null for global.
	 * @param string|null $max_screen Custom max breakpoint or null for global.
	 */
	public static function get_clamp_formula( string $min_value, string $max_value, ?string $min_screen = null, ?string $max_screen = null ): string {
		$min_size = '{{' . $min_value . '.size}}{{' . $min_value . '.unit}}';
		$max_size = '{{' . $max_value . '.size}}{{' . $max_value . '.unit}}';

		$value_diff = '({{' . $max_value . '.size}} - {{' . $min_value . '.size}})';

		if ( $min_screen === null ) {
			$min_screen = 'var(' . self::get_css_var_min_screen() . ')';
		}
		if ( $max_screen === null ) {
			$max_screen = 'var(' . self::get_css_var_screen_diff() . ')';
		}

		$viewport_calc   = "(100vw - {$min_screen})";
		$scaling_factor  = "({$value_diff} * ({$viewport_calc} / {$max_screen}))";
		$preferred_value = "calc(({$min_size}) + ({$scaling_factor}))";

		// Dynamic bounds handle inverted min/max values
		$lower_bound = "min({$min_size}, {$max_size})";
		$upper_bound = "max({$min_size}, {$max_size})";

		$formula = "clamp({$lower_bound}, {$preferred_value}, {$upper_bound})";

		/** @var string */
		$result = apply_filters(
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
		return $result;
	}
}
