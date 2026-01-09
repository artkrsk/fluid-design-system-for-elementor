<?php
/**
 * Seeds E2E test presets into the active Elementor Kit.
 *
 * Usage: wp eval-file tests/e2e/fixtures/setup-presets.php
 *
 * This script:
 * 1. Creates/updates the custom test group in wp_options
 * 2. Seeds test presets into Kit settings (typography, spacing, custom group)
 * 3. Clears Elementor CSS cache to regenerate styles
 *
 * Preset IDs are prefixed with 'e2e_' to avoid conflicts with user presets.
 * Existing e2e_ presets are replaced on each run for idempotency.
 *
 * @package Arts\FluidDesignSystem\Tests
 */

// phpcs:disable WordPress.Security.EscapeOutput.OutputNotEscaped

if ( ! defined( 'ABSPATH' ) ) {
	echo "Error: WordPress not loaded. Run via WP-CLI.\n";
	exit( 1 );
}

/**
 * Test presets matching test-data.ts definitions.
 * KEEP IN SYNC with tests/e2e/fixtures/test-data.ts
 */
$test_presets = array(
	'fluid_typography_presets'            => array(
		array(
			'_id'   => 'e2e_heading_xl',
			'title' => 'E2E Heading XL',
			'min'   => array(
				'size' => 24,
				'unit' => 'px',
			),
			'max'   => array(
				'size' => 64,
				'unit' => 'px',
			),
		),
		array(
			'_id'   => 'e2e_body_text',
			'title' => 'E2E Body Text',
			'min'   => array(
				'size' => 14,
				'unit' => 'px',
			),
			'max'   => array(
				'size' => 18,
				'unit' => 'px',
			),
		),
		array(
			'_id'   => 'e2e_negative_margin',
			'title' => 'E2E Negative Margin',
			'min'   => array(
				'size' => -20,
				'unit' => 'px',
			),
			'max'   => array(
				'size' => -80,
				'unit' => 'px',
			),
		),
		array(
			'_id'   => 'e2e_inverted',
			'title' => 'E2E Inverted (min > max)',
			'min'   => array(
				'size' => 80,
				'unit' => 'px',
			),
			'max'   => array(
				'size' => 20,
				'unit' => 'px',
			),
		),
		array(
			'_id'   => 'e2e_rem_units',
			'title' => 'E2E REM Units',
			'min'   => array(
				'size' => 1,
				'unit' => 'rem',
			),
			'max'   => array(
				'size' => 3,
				'unit' => 'rem',
			),
		),
		array(
			'_id'   => 'e2e_static_value',
			'title' => 'E2E Static (min = max)',
			'min'   => array(
				'size' => 20,
				'unit' => 'px',
			),
			'max'   => array(
				'size' => 20,
				'unit' => 'px',
			),
		),
	),
	'fluid_spacing_presets'               => array(
		array(
			'_id'   => 'e2e_gap_standard',
			'title' => 'E2E Gap Standard',
			'min'   => array(
				'size' => 16,
				'unit' => 'px',
			),
			'max'   => array(
				'size' => 48,
				'unit' => 'px',
			),
		),
		array(
			'_id'   => 'e2e_gap_large',
			'title' => 'E2E Gap Large',
			'min'   => array(
				'size' => 32,
				'unit' => 'px',
			),
			'max'   => array(
				'size' => 120,
				'unit' => 'px',
			),
		),
	),
	'fluid_custom_e2e_test_group_presets' => array(
		array(
			'_id'                           => 'e2e_custom_breakpoints',
			'title'                         => 'E2E Custom Breakpoints',
			'min'                           => array(
				'size' => 10,
				'unit' => 'px',
			),
			'max'                           => array(
				'size' => 100,
				'unit' => 'px',
			),
			'override_screen_width_enabled' => 'yes',
			'overriden_min_screen_width'    => 400,
			'overriden_max_screen_width'    => 1600,
		),
	),
);

/**
 * Custom group definition for wp_options.
 */
$test_custom_groups = array(
	'e2e_test_group' => array(
		'name'        => 'E2E Test Group',
		'description' => 'Custom group for E2E testing',
		'order'       => 100,
	),
);

// Step 1: Create/update custom group in wp_options
$existing_groups = get_option( 'arts_fluid_design_system_custom_groups', array() );
if ( ! is_array( $existing_groups ) ) {
	$existing_groups = array();
}

$existing_groups = array_merge( $existing_groups, $test_custom_groups );
update_option( 'arts_fluid_design_system_custom_groups', $existing_groups );
echo "Created custom group: e2e_test_group\n";

// Step 2: Get active Kit
$kit_id = get_option( 'elementor_active_kit' );
if ( ! $kit_id ) {
	echo "Error: No active Elementor Kit found.\n";
	exit( 1 );
}

echo "Active Kit ID: {$kit_id}\n";

// Step 3: Get current Kit settings
$settings = get_post_meta( $kit_id, '_elementor_page_settings', true );
if ( ! is_array( $settings ) ) {
	$settings = array();
}

// Step 4: Merge test presets (replace existing e2e_ prefixed ones)
foreach ( $test_presets as $control_id => $presets ) {
	$existing = isset( $settings[ $control_id ] ) && is_array( $settings[ $control_id ] )
		? $settings[ $control_id ]
		: array();

	// Remove old e2e_ presets to ensure clean state
	$existing = array_filter(
		$existing,
		function ( $preset ) {
			return ! isset( $preset['_id'] ) || strpos( $preset['_id'], 'e2e_' ) !== 0;
		}
	);

	// Re-index array
	$existing = array_values( $existing );

	// Add test presets
	$settings[ $control_id ] = array_merge( $existing, $presets );

	echo "Added " . count( $presets ) . " presets to {$control_id}\n";
}

// Step 5: Ensure default breakpoints are set
if ( ! isset( $settings['min_screen_width'] ) ) {
	$settings['min_screen_width'] = 360;
}
if ( ! isset( $settings['max_screen_width'] ) ) {
	$settings['max_screen_width'] = 1920;
}

// Step 6: Save Kit settings
update_post_meta( $kit_id, '_elementor_page_settings', $settings );
echo "Kit settings updated\n";

// Step 7: Clear Elementor CSS cache
delete_post_meta( $kit_id, '_elementor_css' );

// Clear CSS files if they exist
$upload_dir    = wp_upload_dir();
$elementor_css = $upload_dir['basedir'] . '/elementor/css/';
if ( is_dir( $elementor_css ) ) {
	$kit_css_file = $elementor_css . "post-{$kit_id}.css";
	if ( file_exists( $kit_css_file ) ) {
		unlink( $kit_css_file );
		echo "Cleared Kit CSS file\n";
	}
}

echo "\nE2E test presets seeded successfully!\n";
echo "Presets available:\n";
foreach ( $test_presets as $control_id => $presets ) {
	foreach ( $presets as $preset ) {
		$min = $preset['min']['size'] . $preset['min']['unit'];
		$max = $preset['max']['size'] . $preset['max']['unit'];
		echo "  - {$preset['_id']}: {$min} -> {$max}\n";
	}
}
