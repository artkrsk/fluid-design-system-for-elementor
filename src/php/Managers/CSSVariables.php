<?php
/**
 * CSS variable naming and clamp() formula generation.
 *
 * Constants must match JavaScript: constants/STYLES.ts (STYLES.VAR_PREFIX for the preset prefix,
 * FORMULA for the var names the clamp() formula reads); utils/clamp.ts builds the same formula.
 *
 * @package Arts\FluidDesignSystem
 * @since 1.0.0
 */

namespace Arts\FluidDesignSystem\Managers;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use Arts\FluidDesignSystem\Base\Manager as BaseManager;
use ArtsFluidDS\Arts\Utilities\Utilities;

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
	const CSS_VAR_TYPED            = '--' . self::CSS_VAR_PREFIX . '-typed';
	const CSS_VAR_VW               = '--' . self::CSS_VAR_PREFIX . '-vw';
	const CSS_VAR_PX               = '--' . self::CSS_VAR_PREFIX . '-px';

	/** Bump whenever the formula changes, so the Elementor CSS cache is cleared once. */
	const FORMULA_VERSION        = 2;
	const FORMULA_VERSION_OPTION = 'arts_fluid_design_system_formula_version';

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
	 * @param string|null $min_screen Unitless min screen width; null for the global min-screen-value var.
	 * @param string|null $max_screen Unitless screen-width *range* (max minus min) used as the scaling
	 *                                divisor, not the max breakpoint; null for the global screen-diff var.
	 */
	public static function get_clamp_formula( string $min_value, string $max_value, ?string $min_screen = null, ?string $max_screen = null ): string {
		$min_number = '{{' . $min_value . '.size}}';
		$max_number = '{{' . $max_value . '.size}}';
		$min_size   = $min_number . '{{' . $min_value . '.unit}}';
		$max_size   = $max_number . '{{' . $max_value . '.unit}}';

		if ( $min_screen === null ) {
			$min_screen = 'var(' . self::get_css_var_min_screen_value() . ')';
		}
		if ( $max_screen === null ) {
			$max_screen = 'var(' . self::get_css_var_screen_diff() . ')';
		}

		$typed = 'var(' . self::CSS_VAR_TYPED . ', 0)';
		$vw    = 'var(' . self::CSS_VAR_VW . ', 0)';
		$px    = 'var(' . self::CSS_VAR_PX . ', 1)';

		// Without typed arithmetic a length can't be divided by a length, so the legacy term scales a
		// unitless diff by a px progress (right for px only), and the typed term must still parse there:
		// the fallbacks keep it unitless and zero it. get_typed_arithmetic_css() flips which term counts.
		$legacy_term     = "(({$max_number} - {$min_number}) * ((100vw - {$min_screen} * 1px) / {$max_screen}) * (1 - {$typed}))";
		$typed_term      = "(({$max_size} - {$min_size}) * (({$vw} - {$min_screen} * {$px}) / ({$max_screen} * {$px})) * {$typed})";
		$preferred_value = "calc(({$min_size}) + {$legacy_term} + {$typed_term})";

		// Dynamic bounds handle inverted min/max values
		$lower_bound = "min({$min_size}, {$max_size})";
		$upper_bound = "max({$min_size}, {$max_size})";

		$formula = "clamp({$lower_bound}, {$preferred_value}, {$upper_bound})";

		/** @var string */
		$result = apply_filters(
			'arts/fluid_design_system/css/clamp_formula',
			$formula,
			array(
				'min_value'  => $min_value,
				'max_value'  => $max_value,
				'min_screen' => $min_screen,
				'max_screen' => $max_screen,
				'min_size'   => $min_size,
				'max_size'   => $max_size,
			)
		);
		return $result;
	}

	/** Switches every fluid formula to its unit-aware term in engines with CSS typed arithmetic. */
	public static function get_typed_arithmetic_css(): string {
		return '@supports (width: calc(1px * (1px / 1px))) { :root { '
			. self::CSS_VAR_TYPED . ': 1; '
			. self::CSS_VAR_VW . ': 100vw; '
			. self::CSS_VAR_PX . ': 1px; } }';
	}

	/**
	 * Hooked to elementor/frontend/after_register_styles: the inline style then prints whenever
	 * 'elementor-frontend' does (frontend, templates, editor preview), however it gets enqueued.
	 */
	public function add_typed_arithmetic_css(): void {
		wp_add_inline_style( 'elementor-frontend', self::get_typed_arithmetic_css() );
	}

	/**
	 * Hooked to wp_loaded. Elementor doesn't regenerate cached Kit CSS when this plugin updates,
	 * so presets would keep the previous formula until the next Kit save.
	 */
	public function maybe_clear_elementor_css(): void {
		if ( Utilities::get_int_value( get_option( self::FORMULA_VERSION_OPTION ) ) === self::FORMULA_VERSION ) {
			return;
		}

		if ( ! class_exists( '\Elementor\Plugin' ) ) {
			return;
		}

		\Elementor\Plugin::$instance->files_manager->clear_cache();
		update_option( self::FORMULA_VERSION_OPTION, self::FORMULA_VERSION );
	}
}
