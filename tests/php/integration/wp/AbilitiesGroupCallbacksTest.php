<?php
/**
 * Integration tests for the group-scoped ability execute callbacks.
 *
 * Callbacks are invoked directly (no wp_register_ability needed — the
 * Abilities API plugin is absent here by design). The managers container is
 * wired the same way the plugin bootstrap does it.
 *
 * @package Arts\FluidDesignSystem\Tests
 */

namespace Arts\FluidDesignSystem\Tests\Integration\WP;

use Arts\FluidDesignSystem\Base\ManagersContainer;
use Arts\FluidDesignSystem\Managers\Abilities;
use Arts\FluidDesignSystem\Managers\Data;
use WP_UnitTestCase;

class AbilitiesGroupCallbacksTest extends WP_UnitTestCase {

	private function abilities(): Abilities {
		$abilities       = new Abilities();
		$container       = new ManagersContainer();
		$container->data = new Data();
		$abilities->init( $container );

		return $abilities;
	}

	public function test_list_preset_groups_includes_builtins(): void {
		$result = $this->abilities()->execute_list_preset_groups();

		$this->assertIsArray( $result );
		$names = array_column( $result['groups'], 'name' );
		$this->assertContains( 'Spacing Presets', $names );
		$this->assertContains( 'Typography Presets', $names );
	}

	public function test_create_preset_group_persists_and_reports(): void {
		$result = $this->abilities()->execute_create_preset_group(
			array(
				'name'        => 'Ability Group',
				'description' => 'Made via ability callback',
			)
		);

		$this->assertIsArray( $result );
		$group = $result['group'];
		$this->assertSame( 'Ability Group', $group['name'] );
		$this->assertSame( 'custom', $group['type'] );
		$this->assertSame( 'fluid_custom_' . $group['id'] . '_presets', $group['control_id'] );

		$this->assertTrue( ( new Data() )->group_exists( $group['id'] ) );
	}

	public function test_create_preset_group_rejects_taken_name(): void {
		$abilities = $this->abilities();
		$abilities->execute_create_preset_group( array( 'name' => 'Occupied' ) );

		$error = $abilities->execute_create_preset_group( array( 'name' => 'Occupied' ) );
		$this->assertWPError( $error );
		$this->assertSame( 'name_taken', $error->get_error_code() );

		$builtin_collision = $abilities->execute_create_preset_group( array( 'name' => 'Spacing Presets' ) );
		$this->assertWPError( $builtin_collision );
		$this->assertSame( 'name_taken', $builtin_collision->get_error_code() );
	}

	public function test_rename_preset_group(): void {
		$abilities = $this->abilities();
		$created   = $abilities->execute_create_preset_group( array( 'name' => 'Before Rename' ) );
		$group_id  = $created['group']['id'];

		$renamed = $abilities->execute_rename_preset_group(
			array(
				'group_id' => $group_id,
				'name'     => 'After Rename',
			)
		);
		$this->assertIsArray( $renamed );
		$this->assertSame( 'After Rename', $renamed['group']['name'] );
		$this->assertSame( 'After Rename', ( new Data() )->get_group( $group_id )['name'] );

		$missing = $abilities->execute_rename_preset_group(
			array(
				'group_id' => 'nope',
				'name'     => 'Whatever',
			)
		);
		$this->assertWPError( $missing );
		$this->assertSame( 'group_not_found', $missing->get_error_code() );
	}

	public function test_rename_preset_group_rejects_collision(): void {
		$abilities = $this->abilities();
		$abilities->execute_create_preset_group( array( 'name' => 'Existing Name' ) );
		$created = $abilities->execute_create_preset_group( array( 'name' => 'To Rename' ) );

		$collision = $abilities->execute_rename_preset_group(
			array(
				'group_id' => $created['group']['id'],
				'name'     => 'Existing Name',
			)
		);
		$this->assertWPError( $collision );
		$this->assertSame( 'name_taken', $collision->get_error_code() );
	}

	public function test_delete_preset_group(): void {
		$abilities = $this->abilities();
		$created   = $abilities->execute_create_preset_group( array( 'name' => 'Delete Me' ) );
		$group_id  = $created['group']['id'];

		$deleted = $abilities->execute_delete_preset_group( array( 'group_id' => $group_id ) );
		$this->assertIsArray( $deleted );
		$this->assertTrue( $deleted['deleted'] );
		$this->assertFalse( ( new Data() )->group_exists( $group_id ) );

		$missing = $abilities->execute_delete_preset_group( array( 'group_id' => $group_id ) );
		$this->assertWPError( $missing );
		$this->assertSame( 'group_not_found', $missing->get_error_code() );
	}

	public function test_get_preset_group_returns_group_with_empty_presets_without_elementor(): void {
		$result = $this->abilities()->execute_get_preset_group( array( 'group_id' => 'fluid_spacing_presets' ) );

		$this->assertIsArray( $result );
		$this->assertSame( 'Spacing Presets', $result['group']['name'] );
		$this->assertSame( array(), $result['presets'] );

		$missing = $this->abilities()->execute_get_preset_group( array( 'group_id' => 'no_such_group' ) );
		$this->assertWPError( $missing );
		$this->assertSame( 'group_not_found', $missing->get_error_code() );
	}
}
