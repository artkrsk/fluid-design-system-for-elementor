<?php
/**
 * Unit tests for the CSSVariables manager.
 *
 * Pins the frozen CSS-variable contract (must equal JS constants/STYLES.ts)
 * and the exact clamp() template emitted for Elementor's CSS parser.
 *
 * @package Arts\FluidDesignSystem\Tests
 */

namespace Arts\FluidDesignSystem\Tests\Unit;

use Arts\FluidDesignSystem\Managers\CSSVariables;
use PHPUnit\Framework\TestCase;

class CSSVariablesTest extends TestCase {

	public function test_preset_prefix_matches_frozen_contract(): void {
		$this->assertSame( '--arts-fluid-preset--', CSSVariables::CSS_VAR_PRESET_PREFIX );
	}

	public function test_screen_variable_names_match_frozen_contract(): void {
		$this->assertSame( '--arts-fluid-min-screen', CSSVariables::CSS_VAR_MIN_SCREEN );
		$this->assertSame( '--arts-fluid-min-screen-value', CSSVariables::CSS_VAR_MIN_SCREEN_VALUE );
		$this->assertSame( '--arts-fluid-max-screen', CSSVariables::CSS_VAR_MAX_SCREEN );
		$this->assertSame( '--arts-fluid-max-screen-value', CSSVariables::CSS_VAR_MAX_SCREEN_VALUE );
		$this->assertSame( '--arts-fluid-screen-diff', CSSVariables::CSS_VAR_SCREEN_DIFF );
	}

	public function test_get_css_var_preset_builds_variable_name(): void {
		$this->assertSame( '--arts-fluid-preset--abc123', CSSVariables::get_css_var_preset( 'abc123' ) );
		$this->assertSame( '--arts-fluid-preset--', CSSVariables::get_css_var_preset( '' ) );
	}

	public function test_screen_variable_accessors_return_constants(): void {
		$this->assertSame( CSSVariables::CSS_VAR_MIN_SCREEN, CSSVariables::get_css_var_min_screen() );
		$this->assertSame( CSSVariables::CSS_VAR_MIN_SCREEN_VALUE, CSSVariables::get_css_var_min_screen_value() );
		$this->assertSame( CSSVariables::CSS_VAR_MAX_SCREEN, CSSVariables::get_css_var_max_screen() );
		$this->assertSame( CSSVariables::CSS_VAR_MAX_SCREEN_VALUE, CSSVariables::get_css_var_max_screen_value() );
		$this->assertSame( CSSVariables::CSS_VAR_SCREEN_DIFF, CSSVariables::get_css_var_screen_diff() );
	}

	/**
	 * The formula is a template for Elementor's CSS parser: {{control.size}} /
	 * {{control.unit}} placeholders are substituted at render time. With no
	 * custom screen bounds it scales between the global screen variables.
	 */
	public function test_clamp_formula_with_global_screen_bounds(): void {
		$expected = 'clamp('
			. 'min({{min.size}}{{min.unit}}, {{max.size}}{{max.unit}}), '
			. 'calc(({{min.size}}{{min.unit}}) + ((({{max.size}} - {{min.size}}) * ((100vw - var(--arts-fluid-min-screen)) / var(--arts-fluid-screen-diff))))), '
			. 'max({{min.size}}{{min.unit}}, {{max.size}}{{max.unit}})'
			. ')';

		$this->assertSame( $expected, CSSVariables::get_clamp_formula( 'min', 'max' ) );
	}

	public function test_clamp_formula_with_custom_screen_bounds(): void {
		$expected = 'clamp('
			. 'min({{min.size}}{{min.unit}}, {{max.size}}{{max.unit}}), '
			. 'calc(({{min.size}}{{min.unit}}) + ((({{max.size}} - {{min.size}}) * ((100vw - 400px) / 1200px)))), '
			. 'max({{min.size}}{{min.unit}}, {{max.size}}{{max.unit}})'
			. ')';

		$this->assertSame( $expected, CSSVariables::get_clamp_formula( 'min', 'max', '400px', '1200px' ) );
	}

	public function test_clamp_formula_uses_given_control_names_in_placeholders(): void {
		$formula = CSSVariables::get_clamp_formula( 'preset_min', 'preset_max' );

		$this->assertStringContainsString( '{{preset_min.size}}{{preset_min.unit}}', $formula );
		$this->assertStringContainsString( '{{preset_max.size}}{{preset_max.unit}}', $formula );
		$this->assertStringContainsString( '({{preset_max.size}} - {{preset_min.size}})', $formula );
	}

	/**
	 * min()/max() bounds are what make inverted presets (min > max) render
	 * correctly: the bounds swap dynamically in CSS instead of in PHP.
	 */
	public function test_clamp_formula_uses_dynamic_bounds_for_inversion(): void {
		$formula = CSSVariables::get_clamp_formula( 'min', 'max' );

		$this->assertStringStartsWith( 'clamp(min(', $formula );
		$this->assertStringContainsString( ', max({{min.size}}{{min.unit}}, {{max.size}}{{max.unit}}))', $formula );
	}

	public function test_clamp_formula_mixes_custom_min_with_global_max(): void {
		$formula = CSSVariables::get_clamp_formula( 'min', 'max', '360px', null );

		$this->assertStringContainsString( '(100vw - 360px)', $formula );
		$this->assertStringContainsString( '/ var(--arts-fluid-screen-diff)', $formula );
	}
}
