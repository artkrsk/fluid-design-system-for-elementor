<?php
/**
 * Integration tests for the preset-scoped ability execute callbacks.
 *
 * These need a real active Kit: they resolve group ids to Kit controls and
 * route through KitRepeaterService / Kit::add_repeater_row.
 *
 * @package Arts\FluidDesignSystem\Tests
 */

namespace Arts\FluidDesignSystem\Tests\Integration\Elementor;

use Arts\FluidDesignSystem\Base\ManagersContainer;
use Arts\FluidDesignSystem\Managers\Abilities;
use Arts\FluidDesignSystem\Managers\Data;
use Arts\FluidDesignSystem\Services\KitRepeaterService;
use Arts\FluidDesignSystem\Tests\Integration\ElementorKitTestCase;

class AbilitiesPresetCallbacksTest extends ElementorKitTestCase {

	private function abilities(): Abilities {
		$abilities       = new Abilities();
		$container       = new ManagersContainer();
		$container->data = new Data();
		$abilities->init( $container );

		return $abilities;
	}

	/** @return array<string, mixed> */
	private function create_preset( Abilities $abilities, string $title, string $group = 'fluid_spacing_presets' ): array {
		$result = $abilities->execute_create_preset(
			array(
				'title'    => $title,
				'min_size' => 10,
				'min_unit' => 'px',
				'max_size' => 40,
				'max_unit' => 'px',
				'group_id' => $group,
			)
		);

		$this->assertIsArray( $result, 'create-preset returned an error: ' . ( is_wp_error( $result ) ? $result->get_error_message() : '' ) );

		return $result['preset'];
	}

	public function test_create_preset_persists_to_kit(): void {
		$abilities = $this->abilities();
		$preset    = $this->create_preset( $abilities, 'Ability Preset' );

		$this->assertStringStartsWith( 'fluid-', $preset['id'] );
		$this->assertSame( 'Ability Preset', $preset['title'] );

		$item = KitRepeaterService::get_item( $this->kit, 'fluid_spacing_presets', $preset['id'] );
		$this->assertSame( 'Ability Preset', $item['title'] );
		$this->assertSame( 10.0, $item['min']['size'] );
	}

	public function test_get_preset_errors_for_missing_id(): void {
		$missing = $this->abilities()->execute_get_preset(
			array(
				'preset_id' => 'fluid-does-not-exist',
				'group_id'  => 'fluid_spacing_presets',
			)
		);

		$this->assertWPError( $missing );
		$this->assertSame( 'preset_not_found', $missing->get_error_code() );
	}

	public function test_update_preset_renames(): void {
		$abilities = $this->abilities();
		$preset    = $this->create_preset( $abilities, 'Old Name' );

		$updated = $abilities->execute_update_preset(
			array(
				'preset_id' => $preset['id'],
				'group_id'  => 'fluid_spacing_presets',
				'title'     => 'New Name',
			)
		);

		$this->assertIsArray( $updated );
		$this->assertSame( 'New Name', $updated['preset']['title'] );

		$item = KitRepeaterService::get_item( $this->kit, 'fluid_spacing_presets', $preset['id'] );
		$this->assertSame( 'New Name', $item['title'] );
	}

	public function test_move_preset_to_group(): void {
		$abilities = $this->abilities();
		$preset    = $this->create_preset( $abilities, 'Wanderer' );

		$moved = $abilities->execute_move_preset_to_group(
			array(
				'preset_id'     => $preset['id'],
				'from_group_id' => 'fluid_spacing_presets',
				'to_group_id'   => 'fluid_typography_presets',
			)
		);

		$this->assertIsArray( $moved );
		$this->assertTrue( $moved['moved'] );

		$item = KitRepeaterService::get_item( $this->kit, 'fluid_typography_presets', $preset['id'] );
		$this->assertSame( 'Wanderer', $item['title'] );
	}

	public function test_move_preset_rejects_same_group(): void {
		$abilities = $this->abilities();
		$preset    = $this->create_preset( $abilities, 'Stayer' );

		$error = $abilities->execute_move_preset_to_group(
			array(
				'preset_id'     => $preset['id'],
				'from_group_id' => 'fluid_spacing_presets',
				'to_group_id'   => 'fluid_spacing_presets',
			)
		);

		$this->assertWPError( $error );
		$this->assertSame( 'same_group', $error->get_error_code() );
	}

	public function test_delete_preset(): void {
		$abilities = $this->abilities();
		$preset    = $this->create_preset( $abilities, 'Short Lived' );

		$deleted = $abilities->execute_delete_preset(
			array(
				'preset_id' => $preset['id'],
				'group_id'  => 'fluid_spacing_presets',
			)
		);

		$this->assertIsArray( $deleted );
		$this->assertTrue( $deleted['deleted'] );

		$again = $abilities->execute_delete_preset(
			array(
				'preset_id' => $preset['id'],
				'group_id'  => 'fluid_spacing_presets',
			)
		);
		$this->assertWPError( $again );
		$this->assertSame( 'delete_failed', $again->get_error_code() );
	}
}
