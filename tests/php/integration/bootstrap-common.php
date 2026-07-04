<?php
/**
 * Shared bootstrap for the wp-env integration suites.
 *
 * Runs INSIDE the wp-env tests container: WP_TESTS_DIR points at the WordPress
 * core PHPUnit test library the image ships. That library requires PHPUnit <= 9.6
 * (the container's global phpunit is 10.x and incompatible), so the suites run
 * with the plugin's own dev vendor exposed at tests/php/dev-vendor via the
 * .wp-env.json mapping — that provides both vendor/bin/phpunit 9.6 and the
 * Yoast polyfills the WP library needs.
 *
 * @package Arts\FluidDesignSystem\Tests
 */

$_tests_dir = getenv( 'WP_TESTS_DIR' );
if ( ! $_tests_dir ) {
	$_tests_dir = '/wordpress-phpunit';
}

if ( ! file_exists( $_tests_dir . '/includes/functions.php' ) ) {
	echo 'WordPress test library not found at ' . $_tests_dir . '. Run inside the wp-env tests container.' . PHP_EOL;
	exit( 1 );
}

$_polyfills_dir = dirname( __DIR__ ) . '/dev-vendor/yoast/phpunit-polyfills';
if ( ! defined( 'WP_TESTS_PHPUNIT_POLYFILLS_PATH' ) && file_exists( $_polyfills_dir . '/phpunitpolyfills-autoload.php' ) ) {
	define( 'WP_TESTS_PHPUNIT_POLYFILLS_PATH', $_polyfills_dir );
}

require_once $_tests_dir . '/includes/functions.php';
