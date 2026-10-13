<?php
/**
 * Empties every preset repeater in the active Kit, keeping the breakpoints,
 * so specs can exercise a Kit with no presets at all.
 *
 * Usage: wp eval-file tests/e2e/fixtures/empty-presets.php
 *
 * Restore the seeded baseline afterwards with reset-state.php.
 *
 * @package Arts\FluidDesignSystem\Tests
 */

// phpcs:disable WordPress.Security.EscapeOutput.OutputNotEscaped

if ( ! defined( 'ABSPATH' ) ) {
	echo "Error: WordPress not loaded. Run via WP-CLI.\n";
	exit( 1 );
}

$kit_id = (int) get_option( 'elementor_active_kit' );
if ( ! $kit_id ) {
	echo "Error: No active Elementor Kit found.\n";
	exit( 1 );
}

$settings = get_post_meta( $kit_id, '_elementor_page_settings', true );
if ( ! is_array( $settings ) ) {
	$settings = array();
}

foreach ( array_keys( $settings ) as $settings_key ) {
	if ( preg_match( '/^fluid_(spacing|typography|custom_.+)_presets$/', $settings_key ) ) {
		$settings[ $settings_key ] = array();
		echo "Emptied {$settings_key}\n";
	}
}

update_post_meta( $kit_id, '_elementor_page_settings', $settings );

// Drop the cached Kit CSS so the next request regenerates it without presets
\Elementor\Core\Files\CSS\Post::create( $kit_id )->delete();
echo "Cleared Kit CSS\n";
