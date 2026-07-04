<?php
/**
 * Integration tests for KitRepeaterService against a real Elementor Kit.
 *
 * Harness smoke scope: seed a repeater row through the supported Kit API and
 * read it back through the service. The full CRUD + autosave-mirroring
 * inventory builds on this once the wiring is proven.
 *
 * @package Arts\FluidDesignSystem\Tests
 */

namespace Arts\FluidDesignSystem\Tests\Integration\Elementor;

use Arts\FluidDesignSystem\Services\KitRepeaterService;
use Arts\FluidDesignSystem\Tests\Integration\ElementorKitTestCase;

class KitRepeaterServiceTest extends ElementorKitTestCase {

	public function test_get_item_returns_row_seeded_via_kit_api(): void {
		$this->kit->add_repeater_row(
			'fluid_spacing_presets',
			array(
				'_id'   => 'smoke_preset',
				'title' => 'Smoke Preset',
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

		$item = KitRepeaterService::get_item( $this->kit, 'fluid_spacing_presets', 'smoke_preset' );

		$this->assertIsArray( $item );
		$this->assertSame( 'Smoke Preset', $item['title'] );
	}
}
