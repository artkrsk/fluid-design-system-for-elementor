<?php
/**
 * Integration tests for KitRepeaterService against a real Elementor Kit.
 *
 * Covers the CRUD surface and the invariant the service exists for: every
 * write must mirror to the Kit's autosave document, because the editor reads
 * settings through get_doc_or_auto_save and would otherwise show stale data.
 *
 * @package Arts\FluidDesignSystem\Tests
 */

namespace Arts\FluidDesignSystem\Tests\Integration\Elementor;

use Arts\FluidDesignSystem\Services\KitRepeaterService;
use Arts\FluidDesignSystem\Tests\Integration\ElementorKitTestCase;

class KitRepeaterServiceTest extends ElementorKitTestCase {

	/** @param array<string, mixed> $extra */
	private function seed_preset( string $id, string $title, array $extra = array(), string $control_id = 'fluid_spacing_presets' ): void {
		$this->kit->add_repeater_row(
			$control_id,
			array_merge(
				array(
					'_id'   => $id,
					'title' => $title,
					'min'   => array(
						'size' => 16,
						'unit' => 'px',
					),
					'max'   => array(
						'size' => 48,
						'unit' => 'px',
					),
				),
				$extra
			)
		);
	}

	public function test_get_item_returns_row_seeded_via_kit_api(): void {
		$this->seed_preset( 'smoke_preset', 'Smoke Preset' );

		$item = KitRepeaterService::get_item( $this->kit, 'fluid_spacing_presets', 'smoke_preset' );

		$this->assertIsArray( $item );
		$this->assertSame( 'Smoke Preset', $item['title'] );
	}

	public function test_get_item_throws_for_missing_preset_and_group(): void {
		$this->seed_preset( 'existing', 'Existing' );

		try {
			KitRepeaterService::get_item( $this->kit, 'fluid_spacing_presets', 'ghost' );
			$this->fail( 'Expected exception for missing preset' );
		} catch ( \Exception $e ) {
			$this->assertSame( 'Preset not found.', $e->getMessage() );
		}

		try {
			KitRepeaterService::get_item( $this->kit, 'fluid_custom_ghost_presets', 'existing' );
			$this->fail( 'Expected exception for missing group' );
		} catch ( \Exception $e ) {
			$this->assertSame( 'Preset group not found.', $e->getMessage() );
		}
	}

	public function test_update_item_merges_and_preserves_untouched_fields(): void {
		$this->seed_preset(
			'merge_preset',
			'Original Title',
			array( 'custom_screen_width' => 'yes' )
		);

		$this->assertTrue(
			KitRepeaterService::update_item(
				$this->kit,
				'fluid_spacing_presets',
				'merge_preset',
				array( 'title' => 'Updated Title' )
			)
		);

		$item = KitRepeaterService::get_item( $this->kit, 'fluid_spacing_presets', 'merge_preset' );
		$this->assertSame( 'Updated Title', $item['title'] );
		$this->assertSame( 'yes', $item['custom_screen_width'] );
		$this->assertSame( 16, $item['min']['size'] );
	}

	public function test_delete_item_removes_row(): void {
		$this->seed_preset( 'doomed', 'Doomed' );

		$this->assertTrue( KitRepeaterService::delete_item( $this->kit, 'fluid_spacing_presets', 'doomed' ) );

		$this->expectExceptionMessage( 'Preset not found.' );
		KitRepeaterService::delete_item( $this->kit, 'fluid_spacing_presets', 'doomed' );
	}

	public function test_move_item_between_controls(): void {
		$this->seed_preset( 'mover', 'Mover' );

		$this->assertTrue(
			KitRepeaterService::move_item( $this->kit, 'fluid_spacing_presets', 'fluid_typography_presets', 'mover' )
		);

		$item = KitRepeaterService::get_item( $this->kit, 'fluid_typography_presets', 'mover' );
		$this->assertSame( 'Mover', $item['title'] );

		$this->expectExceptionMessage( 'Preset not found.' );
		KitRepeaterService::get_item( $this->kit, 'fluid_spacing_presets', 'mover' );
	}

	public function test_move_item_initializes_missing_target_control(): void {
		$this->seed_preset( 'pioneer', 'Pioneer' );

		$this->assertTrue(
			KitRepeaterService::move_item( $this->kit, 'fluid_spacing_presets', 'fluid_custom_newgroup_presets', 'pioneer' )
		);

		$item = KitRepeaterService::get_item( $this->kit, 'fluid_custom_newgroup_presets', 'pioneer' );
		$this->assertSame( 'Pioneer', $item['title'] );
	}

	/**
	 * The stale-editor guard: with an autosave present, a write to the main
	 * Kit must recursively apply to the autosave document too.
	 */
	public function test_writes_mirror_to_autosave(): void {
		$this->seed_preset( 'mirrored', 'Before Mirror' );

		$autosave = $this->kit->get_autosave( get_current_user_id(), true );
		$this->assertInstanceOf(
			\Elementor\Core\Kits\Documents\Kit::class,
			$autosave,
			'Kit autosave must be a Kit document or process_autosave() silently skips mirroring'
		);

		KitRepeaterService::update_item(
			$this->kit,
			'fluid_spacing_presets',
			'mirrored',
			array( 'title' => 'After Mirror' )
		);

		$autosave_item = KitRepeaterService::get_item(
			$this->kit->get_autosave(),
			'fluid_spacing_presets',
			'mirrored'
		);
		$this->assertSame( 'After Mirror', $autosave_item['title'] );
	}
}
