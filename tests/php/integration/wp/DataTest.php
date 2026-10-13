<?php
/**
 * Integration tests for the Data manager (custom-group CRUD over WP options).
 *
 * Runs against real WordPress: sanitize_key/sanitize_text_field semantics and
 * option persistence are the point, so nothing is stubbed.
 *
 * @package Arts\FluidDesignSystem\Tests
 */

namespace Arts\FluidDesignSystem\Tests\Integration\WP;

use Arts\FluidDesignSystem\Managers\Data;
use WP_UnitTestCase;

class DataTest extends WP_UnitTestCase {

	public function test_create_and_get_group(): void {
		$data = new Data();

		$group_id = $data->create_group( 'Smoke Group', 'Created by the wp-env harness smoke test' );

		$this->assertIsString( $group_id );
		// sanitize_key strips characters outside [a-z0-9_-]; spaces are removed, not underscored.
		$this->assertStringStartsWith( 'smokegroup_', $group_id );
		$this->assertTrue( $data->group_exists( $group_id ) );

		$group = $data->get_group( $group_id );
		$this->assertIsArray( $group );
		$this->assertSame( 'Smoke Group', $group['name'] );
		$this->assertSame( 'Created by the wp-env harness smoke test', $group['description'] );
		$this->assertSame( 1, $group['order'] );
	}

	public function test_create_group_rejects_duplicate_name(): void {
		$data = new Data();

		$first = $data->create_group( 'Unique Group' );
		$this->assertIsString( $first );
		$this->assertFalse( $data->create_group( 'Unique Group' ) );
	}

	public function test_order_increments_per_created_group(): void {
		$data = new Data();

		$first  = $data->create_group( 'First' );
		$second = $data->create_group( 'Second' );

		$this->assertSame( 1, $data->get_group( $first )['order'] );
		$this->assertSame( 2, $data->get_group( $second )['order'] );
	}

	public function test_delete_group(): void {
		$data = new Data();

		$group_id = $data->create_group( 'Doomed' );
		$this->assertIsString( $group_id );

		$this->assertTrue( $data->delete_group( $group_id ) );
		$this->assertFalse( $data->group_exists( $group_id ) );
		$this->assertNull( $data->get_group( $group_id ) );

		$this->assertFalse( $data->delete_group( $group_id ) );
	}

	public function test_name_exists_respects_exclude_id(): void {
		$data = new Data();

		$group_id = $data->create_group( 'Named Group' );

		$this->assertTrue( Data::name_exists( 'Named Group' ) );
		$this->assertFalse( Data::name_exists( 'Named Group', $group_id ) );
		$this->assertFalse( Data::name_exists( 'Other Name' ) );
	}

	public function test_reorder_groups_updates_order_fields(): void {
		$data = new Data();

		$a = $data->create_group( 'Alpha' );
		$b = $data->create_group( 'Beta' );

		$this->assertTrue( $data->reorder_groups( array( $b, $a ) ) );
		$this->assertSame( 1, $data->get_group( $b )['order'] );
		$this->assertSame( 2, $data->get_group( $a )['order'] );
	}

	public function test_reorder_groups_rejects_unknown_id(): void {
		$data = new Data();

		$a = $data->create_group( 'Alpha' );

		$this->assertFalse( $data->reorder_groups( array( $a, 'nonexistent_id' ) ) );
	}

	public function test_main_group_order_roundtrip(): void {
		$this->assertFalse( Data::is_main_group_ordering_active() );

		Data::save_main_group_order( array( 'fluid_typography_presets', 'fluid_spacing_presets' ) );

		$this->assertTrue( Data::is_main_group_ordering_active() );
		$this->assertSame(
			array( 'fluid_typography_presets', 'fluid_spacing_presets' ),
			Data::get_main_group_order()
		);
	}

	private function register_layout_group(): void {
		add_filter(
			'arts/fluid_design_system/registered_groups',
			function ( $groups ) {
				$groups['theme_layout'] = array(
					'name'  => 'Layout',
					'order' => 5,
				);
				return $groups;
			}
		);
	}

	public function test_registered_group_is_listed_but_never_stored(): void {
		$this->register_layout_group();
		$data = new Data();

		$group = $data->get_group( 'theme_layout' );
		$this->assertIsArray( $group );
		$this->assertSame( 'Layout', $group['name'] );
		$this->assertSame( '', $group['description'] );
		$this->assertSame( 5, $group['order'] );
		$this->assertTrue( $group['registered'] );

		// The registered name is taken like any other.
		$this->assertFalse( $data->create_group( 'Layout' ) );

		$created = $data->create_group( 'Stored Group' );
		$this->assertIsString( $created );

		$stored = get_option( Data::OPTION_NAME );
		$this->assertArrayHasKey( $created, $stored );
		$this->assertArrayNotHasKey( 'theme_layout', $stored );
	}

	/** Copies persisted before the filter existed (option-filter workarounds) give way and get cleaned out. */
	public function test_registered_group_replaces_and_drops_a_stored_copy(): void {
		update_option(
			Data::OPTION_NAME,
			array(
				'theme_layout' => array(
					'name'        => 'Old Layout',
					'description' => '',
					'order'       => 1,
				),
			)
		);
		$this->register_layout_group();
		$data = new Data();

		$this->assertSame( 'Layout', $data->get_group( 'theme_layout' )['name'] );

		$data->create_group( 'Triggers A Save' );
		$this->assertArrayNotHasKey( 'theme_layout', get_option( Data::OPTION_NAME ) );
	}

	public function test_registered_group_cannot_be_deleted(): void {
		$this->register_layout_group();
		$data = new Data();

		$this->assertFalse( $data->delete_group( 'theme_layout' ) );
		$this->assertTrue( $data->group_exists( 'theme_layout' ) );
	}

	public function test_malformed_registered_groups_are_dropped(): void {
		add_filter(
			'arts/fluid_design_system/registered_groups',
			function ( $groups ) {
				$groups['Bad Id']    = array( 'name' => 'Bad Id' );
				$groups['no_name']   = array( 'description' => 'Missing name' );
				$groups['not_array'] = 'Layout';
				$groups[]            = array( 'name' => 'Numeric key' );
				$groups['good_one']  = array( 'name' => 'Good' );
				return $groups;
			}
		);

		$this->assertSame( array( 'good_one' ), array_keys( Data::get_registered_groups() ) );
	}
}
