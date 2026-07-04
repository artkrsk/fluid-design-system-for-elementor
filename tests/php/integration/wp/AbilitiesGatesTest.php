<?php
/**
 * Integration tests for the Abilities permission gates.
 *
 * The frozen contract: fluid/* reads gate on edit_posts, writes on
 * manage_options. Direct calls to the public permission callbacks under real
 * WP roles — no Abilities API plugin required.
 *
 * @package Arts\FluidDesignSystem\Tests
 */

namespace Arts\FluidDesignSystem\Tests\Integration\WP;

use Arts\FluidDesignSystem\Managers\Abilities;
use WP_UnitTestCase;

class AbilitiesGatesTest extends WP_UnitTestCase {

	private function abilities(): Abilities {
		return new Abilities();
	}

	public function test_subscriber_can_neither_read_nor_manage(): void {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'subscriber' ) ) );

		$this->assertFalse( $this->abilities()->can_read() );
		$this->assertFalse( $this->abilities()->can_manage() );
	}

	public function test_editor_can_read_but_not_manage(): void {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		$this->assertTrue( $this->abilities()->can_read() );
		$this->assertFalse( $this->abilities()->can_manage() );
	}

	public function test_administrator_can_read_and_manage(): void {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );

		$this->assertTrue( $this->abilities()->can_read() );
		$this->assertTrue( $this->abilities()->can_manage() );
	}

	public function test_logged_out_visitor_is_denied(): void {
		wp_set_current_user( 0 );

		$this->assertFalse( $this->abilities()->can_read() );
		$this->assertFalse( $this->abilities()->can_manage() );
	}
}
