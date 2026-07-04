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
}
