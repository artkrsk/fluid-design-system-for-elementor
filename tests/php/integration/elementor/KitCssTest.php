<?php
/**
 * Integration test for the rendered Kit CSS: a seeded preset must emit its
 * --arts-fluid-preset-- variable with a clamp() formula.
 *
 * Post_CSS instances are memoized per request and get_content() self-caches,
 * so the file is deleted and rebuilt explicitly.
 *
 * @package Arts\FluidDesignSystem\Tests
 */

namespace Arts\FluidDesignSystem\Tests\Integration\Elementor;

use Arts\FluidDesignSystem\Tests\Integration\ElementorKitTestCase;
use Elementor\Core\Files\CSS\Post as Post_CSS;

class KitCssTest extends ElementorKitTestCase {

	public function test_kit_css_contains_preset_variable_with_clamp(): void {
		$this->kit->add_repeater_row(
			'fluid_spacing_presets',
			array(
				'_id'   => 'css_smoke',
				'title' => 'CSS Smoke',
				'min'   => array(
					'size' => 16,
					'unit' => 'px',
				),
				'max'   => array(
					'size' => 48,
					'unit' => 'px',
				),
			)
		);

		$css_file = Post_CSS::create( $this->kit->get_id() );
		$css_file->delete();
		$css_file->update();
		$content = $css_file->get_content();

		$this->assertStringContainsString( '--arts-fluid-preset--css_smoke', $content );
		$this->assertStringContainsString( 'clamp(', $content );
	}
}
