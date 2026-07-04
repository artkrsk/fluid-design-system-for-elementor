<?php
/**
 * Resets the wp-env site to the seeded E2E baseline in one WP-CLI call:
 * presets/groups/breakpoints (authoritative replace) + the test page.
 *
 * Usage: wp eval-file tests/e2e/fixtures/reset-state.php
 *
 * @package Arts\FluidDesignSystem\Tests
 */

if ( ! defined( 'ABSPATH' ) ) {
	echo "Error: WordPress not loaded. Run via WP-CLI.\n";
	exit( 1 );
}

require __DIR__ . '/setup-presets.php';
require __DIR__ . '/setup-page.php';
