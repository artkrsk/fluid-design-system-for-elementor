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

// Step 1: Reset custom groups to EXACTLY the seed state. Mutating specs create
// extra groups; an authoritative replace (not merge) is what makes re-running
// this script a full reset. The saved main-group ordering is dropped too.
update_option( 'arts_fluid_design_system_custom_groups', $test_custom_groups );
delete_option( 'arts_fluid_design_system_main_group_order' );
echo "Reset custom groups to seed state\n";

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

// Step 4: Replace the seeded preset arrays WHOLESALE. Presets created by
// mutating specs (dialog/ability flows) carry no e2e_ prefix, so a
// filter-and-append would let them accrete across runs.
foreach ( $test_presets as $control_id => $presets ) {
	$settings[ $control_id ] = $presets;
	echo "Reset {$control_id} to " . count( $presets ) . " seeded presets\n";
}

// Drop preset arrays for custom groups that are not part of the seed
// (created by group-CRUD specs), so the Site Settings tab matches the seed.
foreach ( array_keys( $settings ) as $settings_key ) {
	if ( preg_match( '/^fluid_custom_.+_presets$/', $settings_key ) && ! isset( $test_presets[ $settings_key ] ) ) {
		unset( $settings[ $settings_key ] );
		echo "Dropped stray control {$settings_key}\n";
	}
}

// Step 5: Pin global breakpoints to the values the specs assume
$settings['min_screen_width'] = 360;
$settings['max_screen_width'] = 1920;

// Step 6: Save Kit settings
update_post_meta( $kit_id, '_elementor_page_settings', $settings );
echo "Kit settings updated\n";

// Step 7: Delete Kit autosave revisions. The editor reads settings through
// get_doc_or_auto_save, so a stale autosave from a previous editing session
// would keep showing pre-reset data even though the Kit meta is clean.
$kit_autosaves = get_posts(
	array(
		'post_parent' => $kit_id,
		'post_type'   => 'revision',
		'post_status' => 'any',
		'name__like'  => '',
		'numberposts' => -1,
	)
);
foreach ( $kit_autosaves as $kit_revision ) {
	if ( strpos( $kit_revision->post_name, "{$kit_id}-autosave" ) === 0 ) {
		wp_delete_post_revision( $kit_revision->ID );
		echo "Deleted Kit autosave revision {$kit_revision->ID}\n";
	}
}

// Step 8: Clear Elementor CSS cache
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
