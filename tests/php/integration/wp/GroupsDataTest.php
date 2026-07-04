<?php
/**
 * Integration tests for GroupsData aggregation.
 *
 * This suite runs WITHOUT Elementor on purpose: preset values degrade to
 * empty arrays (Utilities::get_kit_settings fallback) while merge, ordering
 * and name-collision logic stay fully exercisable.
 *
 * @package Arts\FluidDesignSystem\Tests
 */

namespace Arts\FluidDesignSystem\Tests\Integration\WP;

use Arts\FluidDesignSystem\Managers\Data;
use Arts\FluidDesignSystem\Managers\GroupsData;
use WP_UnitTestCase;

class GroupsDataTest extends WP_UnitTestCase {

	public function test_builtin_groups_present_and_degrade_without_elementor(): void {
		$builtin = GroupsData::get_builtin_groups();

		$this->assertCount( 2, $builtin );
		$this->assertSame( 'Spacing Presets', $builtin[0]['name'] );
		$this->assertSame( 'Typography Presets', $builtin[1]['name'] );
		$this->assertSame( 'builtin', $builtin[0]['type'] );
		$this->assertSame( 'fluid_spacing_presets', $builtin[0]['id'] );
		// No Elementor loaded: kit settings fall back to the provided default.
		$this->assertSame( array(), $builtin[0]['value'] );
	}

	public function test_custom_group_appears_in_all_groups(): void {
		$data     = new Data();
		$group_id = $data->create_group( 'Aggregated Group' );

		$names = array_column( GroupsData::get_all_groups(), 'name' );

		$this->assertContains( 'Aggregated Group', $names );

		$custom = GroupsData::get_custom_groups();
		$this->assertSame( 'custom', $custom[0]['type'] );
		$this->assertSame( $group_id, $custom[0]['id'] );
	}

	/**
	 * Filter groups come from FluidUnitModule, which is Elementor-gated, so
	 * without Elementor loaded they must degrade to empty rather than fatal —
	 * even when a filter is registered. (The populated path is covered by the
	 * Elementor tier and by e2e.)
	 */
	public function test_filter_groups_degrade_without_elementor(): void {
		add_filter(
			'arts/fluid_design_system/custom_presets',
			function ( $groups ) {
				$groups[] = array(
					'name'  => 'Dev Filter Group',
					'value' => array(),
				);
				return $groups;
			}
		);

		$this->assertSame( array(), GroupsData::get_filter_groups() );
		$this->assertFalse( GroupsData::is_group_name_taken( 'Dev Filter Group' ) );
	}

	public function test_name_collision_across_builtin_and_custom(): void {
		$this->assertTrue( GroupsData::is_group_name_taken( 'Spacing Presets' ) );

		$data = new Data();
		$data->create_group( 'Taken Custom Name' );
		$this->assertTrue( GroupsData::is_group_name_taken( 'Taken Custom Name' ) );

		$this->assertFalse( GroupsData::is_group_name_taken( 'Free Name' ) );
	}

	public function test_main_group_order_is_applied(): void {
		$defaults = GroupsData::get_main_groups();
		$this->assertSame( 'fluid_spacing_presets', $defaults[0]['id'] );

		Data::save_main_group_order( array( 'fluid_typography_presets', 'fluid_spacing_presets' ) );

		$ordered = GroupsData::get_main_groups();
		$this->assertSame( 'fluid_typography_presets', $ordered[0]['id'] );
		$this->assertSame( 'fluid_spacing_presets', $ordered[1]['id'] );
	}
}
