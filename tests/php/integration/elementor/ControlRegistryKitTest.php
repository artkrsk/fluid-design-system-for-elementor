<?php
/**
 * Integration tests for ControlRegistry's Kit-backed resolution.
 *
 * @package Arts\FluidDesignSystem\Tests
 */

namespace Arts\FluidDesignSystem\Tests\Integration\Elementor;

use Arts\FluidDesignSystem\Managers\ControlRegistry;
use Arts\FluidDesignSystem\Tests\Integration\ElementorKitTestCase;

class ControlRegistryKitTest extends ElementorKitTestCase {

	public function test_builtin_control_id_passes_through(): void {
		$this->assertSame( 'fluid_spacing_presets', ControlRegistry::get_kit_control_id( 'fluid_spacing_presets' ) );
	}

	public function test_custom_group_resolves_against_kit_settings(): void {
		$this->kit->add_repeater_row(
			'fluid_custom_resolver_presets',
			array(
				'_id'   => 'r1',
				'title' => 'Resolver',
			)
		);

		$this->assertSame( 'fluid_custom_resolver_presets', ControlRegistry::get_kit_control_id( 'resolver' ) );
		$this->assertSame( 'fluid_custom_resolver_presets', ControlRegistry::get_kit_control_id( 'fluid_custom_resolver_presets' ) );
	}

	public function test_unknown_group_returns_false(): void {
		$this->assertFalse( ControlRegistry::get_kit_control_id( 'never_created' ) );
	}
}
