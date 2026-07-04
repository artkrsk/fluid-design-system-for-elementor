<?php
/**
 * Bootstrap for the Elementor integration suite (real Kit available).
 *
 * Elementor is required before the plugin, mirroring normal load order. The
 * activation hook never fires under the test bootstrap, so no default Kit
 * exists — ElementorKitTestCase::set_up() creates it per test.
 *
 * @package Arts\FluidDesignSystem\Tests
 */

require __DIR__ . '/bootstrap-common.php';

tests_add_filter(
	'muplugins_loaded',
	function () {
		$plugins_dir = dirname( __DIR__, 4 );

		// wp-env installs the zip under elementor.latest-stable; plain elementor is the fallback.
		foreach ( array( 'elementor.latest-stable', 'elementor' ) as $dir ) {
			if ( file_exists( $plugins_dir . '/' . $dir . '/elementor.php' ) ) {
				require $plugins_dir . '/' . $dir . '/elementor.php';
				break;
			}
		}

		require dirname( __DIR__, 3 ) . '/fluid-design-system-for-elementor.php';
	}
);

$_tests_dir = getenv( 'WP_TESTS_DIR' );
if ( ! $_tests_dir ) {
	$_tests_dir = '/wordpress-phpunit';
}
require $_tests_dir . '/includes/bootstrap.php';

// Shared test-case classes are not test files, so PHPUnit's directory scan
// never includes them; the dev-vendor autoloader maps host paths that don't
// exist in the container. Require them directly, like Elementor's bootstrap does.
require_once __DIR__ . '/ElementorKitTestCase.php';
