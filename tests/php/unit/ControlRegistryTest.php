<?php
/**
 * Unit tests for the ControlRegistry manager.
 *
 * Pins the frozen control-ID contract shared with the JS layer
 * (isFluidPresetRepeater in utils/controls.ts): builtin IDs, the
 * fluid_custom_{group_id}_presets pattern, and the legacy fallback.
 *
 * @package Arts\FluidDesignSystem\Tests
 */

namespace Arts\FluidDesignSystem\Tests\Unit;

use Arts\FluidDesignSystem\Managers\ControlRegistry;
use PHPUnit\Framework\TestCase;

class ControlRegistryTest extends TestCase {

	public function test_custom_group_control_id_generation(): void {
		$this->assertSame( 'fluid_custom_foo_presets', ControlRegistry::get_custom_group_control_id( 'foo' ) );
		$this->assertSame( 'section_fluid_custom_foo_presets', ControlRegistry::get_custom_group_section_id( 'foo' ) );
		$this->assertSame( 'fluid_custom_foo_presets_info', ControlRegistry::get_custom_group_info_control_id( 'foo' ) );
	}

	public function test_parse_builtin_control_ids(): void {
		$this->assertSame(
			array(
				'type'     => 'builtin',
				'group_id' => 'spacing',
			),
			ControlRegistry::parse_control_id( 'fluid_spacing_presets' )
		);
		$this->assertSame(
			array(
				'type'     => 'builtin',
				'group_id' => 'typography',
			),
			ControlRegistry::parse_control_id( 'fluid_typography_presets' )
		);
	}

	public function test_parse_custom_control_id(): void {
		$this->assertSame(
			array(
				'type'     => 'custom',
				'group_id' => 'my_group',
			),
			ControlRegistry::parse_control_id( 'fluid_custom_my_group_presets' )
		);
	}

	/** Group IDs containing underscores are captured greedily. */
	public function test_parse_custom_control_id_with_underscored_group(): void {
		$this->assertSame(
			array(
				'type'     => 'custom',
				'group_id' => 'e2e_test_group',
			),
			ControlRegistry::parse_control_id( 'fluid_custom_e2e_test_group_presets' )
		);
	}

	/** Legacy format fluid_{group_id}_presets still parses as custom. */
	public function test_parse_legacy_control_id(): void {
		$this->assertSame(
			array(
				'type'     => 'custom',
				'group_id' => 'mygroup',
			),
			ControlRegistry::parse_control_id( 'fluid_mygroup_presets' )
		);
	}

	public function test_parse_rejects_invalid_control_ids(): void {
		$this->assertFalse( ControlRegistry::parse_control_id( '' ) );
		$this->assertFalse( ControlRegistry::parse_control_id( 'random_control' ) );
		$this->assertFalse( ControlRegistry::parse_control_id( 'fluid_x_preset' ) );
		$this->assertFalse( ControlRegistry::parse_control_id( 'xfluid_spacing_presets' ) );
		$this->assertFalse( ControlRegistry::parse_control_id( 'fluid_spacing_presets_extra' ) );
	}

	/**
	 * Documents actual behavior: an empty custom group ID does not match the
	 * custom pattern ((.+) needs one char) but falls through to the legacy
	 * branch, yielding group_id "custom_".
	 */
	public function test_parse_empty_custom_group_falls_through_to_legacy(): void {
		$this->assertSame(
			array(
				'type'     => 'custom',
				'group_id' => 'custom_',
			),
			ControlRegistry::parse_control_id( 'fluid_custom__presets' )
		);
	}

	public function test_generate_control_id_with_explicit_type(): void {
		$this->assertSame( 'fluid_spacing_presets', ControlRegistry::generate_control_id( 'spacing', 'builtin' ) );
		$this->assertSame( 'fluid_typography_presets', ControlRegistry::generate_control_id( 'typography', 'builtin' ) );
		$this->assertSame( 'fluid_custom_foo_presets', ControlRegistry::generate_control_id( 'foo', 'custom' ) );
	}

	public function test_generate_control_id_cleans_double_prefixes(): void {
		$this->assertSame( 'fluid_custom_foo_presets', ControlRegistry::generate_control_id( 'fluid_custom_foo_presets', 'custom' ) );
		$this->assertSame( 'fluid_custom_foo_presets', ControlRegistry::generate_control_id( 'foo_presets', 'custom' ) );
	}

	/** Auto-detect resolves builtins by probing the builtin control mappings. */
	public function test_generate_control_id_auto_detects_type(): void {
		$this->assertSame( 'fluid_spacing_presets', ControlRegistry::generate_control_id( 'spacing' ) );
		$this->assertSame( 'fluid_typography_presets', ControlRegistry::generate_control_id( 'typography' ) );
		$this->assertSame( 'fluid_custom_foo_presets', ControlRegistry::generate_control_id( 'foo' ) );
	}

	public function test_generate_parse_roundtrip(): void {
		$parsed = ControlRegistry::parse_control_id( ControlRegistry::generate_control_id( 'foo', 'custom' ) );

		$this->assertSame(
			array(
				'type'     => 'custom',
				'group_id' => 'foo',
			),
			$parsed
		);
	}

	public function test_is_valid_control_id_matrix(): void {
		$this->assertTrue( ControlRegistry::is_valid_control_id( 'fluid_spacing_presets' ) );
		$this->assertTrue( ControlRegistry::is_valid_control_id( 'fluid_typography_presets' ) );
		$this->assertTrue( ControlRegistry::is_valid_control_id( 'fluid_custom_foo_presets' ) );
		$this->assertTrue( ControlRegistry::is_valid_control_id( 'fluid_legacy_presets' ) );

		$this->assertFalse( ControlRegistry::is_valid_control_id( '' ) );
		$this->assertFalse( ControlRegistry::is_valid_control_id( 'fluid_x_preset' ) );
		$this->assertFalse( ControlRegistry::is_valid_control_id( 'not_a_fluid_control' ) );
	}

	/** With no custom groups stored (get_option shim returns default), builtin metadata still resolves. */
	public function test_builtin_control_mappings_expose_both_builtins(): void {
		$mappings = ControlRegistry::get_builtin_control_mappings();

		$this->assertArrayHasKey( 'fluid_spacing_presets', $mappings );
		$this->assertArrayHasKey( 'fluid_typography_presets', $mappings );
		$this->assertSame( 'Spacing Presets', $mappings['fluid_spacing_presets']['name'] );
		$this->assertSame( 'Typography Presets', $mappings['fluid_typography_presets']['name'] );
	}
}
