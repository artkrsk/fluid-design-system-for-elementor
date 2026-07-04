<?php
/**
 * Bootstrap for the WordPress-only integration suite (no Elementor loaded).
 *
 * Loading only the plugin keeps GroupsData's no-Elementor fallback reachable —
 * that degradation path is part of what this suite asserts.
 *
 * @package Arts\FluidDesignSystem\Tests
 */

require __DIR__ . '/bootstrap-common.php';

tests_add_filter(
	'muplugins_loaded',
	function () {
		// tests/php/integration -> plugin root (the mapped tests dir lives inside the dist-mounted plugin).
		require dirname( __DIR__, 3 ) . '/fluid-design-system-for-elementor.php';
	}
);

$_tests_dir = getenv( 'WP_TESTS_DIR' );
if ( ! $_tests_dir ) {
	$_tests_dir = '/wordpress-phpunit';
}
require $_tests_dir . '/includes/bootstrap.php';
