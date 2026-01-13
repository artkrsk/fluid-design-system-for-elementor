<?php
/**
 * Stub for Arts\Utilities\Utilities class - OLD VERSION (pre-1.1.11)
 *
 * This stub intentionally OMITS the TypeGuards trait methods (get_string_value, get_int_value, etc.)
 * to simulate the scenario where an outdated theme/plugin loads an old ArtsUtilities version.
 *
 * Methods included: Only those that existed before TypeGuards was added.
 * Methods MISSING: get_string_value(), get_int_value(), get_float_value(), get_bool_value(),
 *                  get_array_value(), get_object_value(), parse_template_args()
 *
 * @package Arts\Utilities
 * @since 1.0.0 (simulated old version)
 */

namespace Arts\Utilities;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * OLD VERSION of Utilities class - missing TypeGuards trait.
 *
 * When Fluid Design System tries to call Utilities::get_string_value(),
 * it will trigger a fatal error because this method doesn't exist.
 */
class Utilities {

	/**
	 * Check if Elementor plugin is active.
	 *
	 * @return bool
	 */
	public static function is_elementor_plugin_active(): bool {
		return defined( 'ELEMENTOR_VERSION' );
	}

	/**
	 * Get plugin version from file header.
	 *
	 * @param string $plugin_file Plugin file path.
	 * @return string
	 */
	public static function get_plugin_version( string $plugin_file ): string {
		if ( ! function_exists( 'get_plugin_data' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}
		$plugin_data = get_plugin_data( $plugin_file );
		return $plugin_data['Version'] ?? '1.0.0';
	}

	/**
	 * Get Elementor editor URL for site settings.
	 *
	 * @param string $tab_id Tab ID.
	 * @return string
	 */
	public static function get_elementor_editor_site_settings_url( string $tab_id ): string {
		if ( ! self::is_elementor_plugin_active() ) {
			return '';
		}

		$kit_id = \Elementor\Plugin::$instance->kits_manager->get_active_id();
		if ( ! $kit_id ) {
			return '';
		}

		return add_query_arg(
			array(
				'post'   => $kit_id,
				'action' => 'elementor',
				'active' => $tab_id,
			),
			admin_url( 'post.php' )
		);
	}

	/**
	 * Get kit settings from Elementor.
	 *
	 * @param string|null $option_name    Option name.
	 * @param mixed       $fallback_value Fallback value.
	 * @param bool        $return_size    Whether to return size value.
	 * @return mixed
	 */
	public static function get_kit_settings( $option_name = null, $fallback_value = null, $return_size = true ) {
		if ( ! self::is_elementor_plugin_active() || ! \Elementor\Plugin::$instance || ! \Elementor\Plugin::$instance->kits_manager ) {
			return $fallback_value;
		}

		$value = \Elementor\Plugin::$instance->kits_manager->get_current_settings( $option_name );

		if ( isset( $value ) ) {
			return $value;
		}

		return $fallback_value;
	}

	// =========================================================================
	// INTENTIONALLY MISSING METHODS (TypeGuards trait - added in v1.1.11)
	// =========================================================================
	//
	// The following methods are NOT implemented in this stub:
	//
	// - get_string_value()     <- Fluid Design System needs this!
	// - get_int_value()        <- Fluid Design System needs this!
	// - get_float_value()
	// - get_bool_value()
	// - get_array_value()      <- Fluid Design System needs this!
	// - get_object_value()
	// - parse_template_args()
	// - get_post_id()
	//
	// This simulates what happens when an old theme bundles ArtsUtilities < 1.1.11
	// =========================================================================
}
