<?php
/**
 * Bootstrap for the pure-unit PHP test suite.
 *
 * No WordPress is loaded. ABSPATH must be defined BEFORE the autoloader runs
 * because every plugin and vendor-prefixed file exits early without it.
 * The three shims below cover the only WordPress functions the tested
 * classes call outside of Elementor/WP integration paths.
 *
 * @package Arts\FluidDesignSystem\Tests
 */

define( 'ABSPATH', sys_get_temp_dir() . '/' );

if ( ! function_exists( 'apply_filters' ) ) {
	/**
	 * @param string $hook_name Ignored.
	 * @param mixed  $value     Returned unchanged.
	 * @param mixed  ...$args   Ignored.
	 * @return mixed
	 */
	function apply_filters( $hook_name, $value, ...$args ) {
		return $value;
	}
}

if ( ! function_exists( 'esc_html__' ) ) {
	/**
	 * @param string $text   Returned unchanged.
	 * @param string $domain Ignored.
	 * @return string
	 */
	function esc_html__( $text, $domain = 'default' ) {
		return $text;
	}
}

if ( ! function_exists( 'get_option' ) ) {
	/**
	 * @param string $option        Ignored.
	 * @param mixed  $default_value Returned unchanged.
	 * @return mixed
	 */
	function get_option( $option, $default_value = false ) {
		return $default_value;
	}
}

require_once dirname( __DIR__, 3 ) . '/vendor/autoload.php';
