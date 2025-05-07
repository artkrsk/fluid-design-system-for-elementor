<?php
/**
 * Main plugin class for Fluid Design System.
 *
 * @package Arts\FluidDesignSystem
 * @since 1.0.0
 */

namespace Arts\FluidDesignSystem;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

use \Arts\ElementorExtension\Plugins\BasePlugin;

/**
 * Plugin Class
 *
 * Main class that initializes the Fluid Design System plugin,
 * manages dependencies, and sets up hooks.
 *
 * @since 1.0.0
 */
class Plugin extends BasePlugin {
	/**
	 * Get default configuration for the plugin.
	 *
	 * @since 1.0.0
	 * @access protected
	 *
	 * @return array Empty array as default configuration.
	 */
	protected function get_default_config() {
		return array();
	}

	/**
	 * Get default strings for the plugin.
	 *
	 * @since 1.0.0
	 * @access protected
	 *
	 * @return array Empty array as default strings.
	 */
	protected function get_default_strings() {
		return array();
	}

	/**
	 * Get default WordPress action to run the plugin.
	 *
	 * @since 1.0.0
	 * @access protected
	 *
	 * @return string WordPress action name.
	 */
	protected function get_default_run_action() {
		return 'init';
	}

	/**
	 * Get manager classes for the plugin.
	 *
	 * Defines which manager classes should be instantiated
	 * and made available through the $this->managers object.
	 *
	 * @since 1.0.0
	 * @access protected
	 *
	 * @return array Associative array of manager keys and their corresponding class names.
	 */
	protected function get_managers_classes() {
		return array(
			'extension'     => Managers\Extension::class,
			'compatibility' => Managers\Compatibility::class,
			'options'       => Managers\Options::class,
			'units'         => Managers\Units::class,
		);
	}

	/**
	 * Actions to perform after initializing managers.
	 *
	 * Registers filters for Elementor extensions, configuration, and strings.
	 *
	 * @since 1.0.0
	 * @access protected
	 *
	 * @return Plugin Current plugin instance.
	 */
	protected function do_after_init_managers() {
		// Register tabs for Elementor site settings
		add_filter( 'arts/elementor_extension/tabs/tabs', array( $this->managers->options, 'get_elementor_site_settings_tabs' ) );

		// Set up extension configuration
		add_filter( 'arts/elementor_extension/plugin/config', array( $this->managers->extension, 'get_config' ) );

		// Set up extension strings
		add_filter( 'arts/elementor_extension/plugin/strings', array( $this->managers->extension, 'get_strings' ) );

		return $this;
	}

	/**
	 * Register WordPress actions for the plugin.
	 *
	 * @since 1.0.0
	 * @access protected
	 *
	 * @return Plugin Current plugin instance.
	 */
	protected function add_actions() {
		// Add fluid unit to Elementor controls
		add_action( 'elementor/element/after_section_end', array( $this->managers->units, 'modify_control_settings' ), 10, 3 );

		// Register fluid unit AJAX handlers for UI interactions
		add_action( 'elementor/ajax/register_actions', array( $this->managers->units, 'register_ajax_handlers' ) );

		// Add necessary scripts to Elementor editor
		add_action( 'elementor/editor/before_enqueue_scripts', array( $this->managers->compatibility, 'elementor_enqueue_editor_scripts' ) );

		// Add custom styles to Elementor editor
		add_action( 'elementor/editor/after_enqueue_styles', array( $this->managers->compatibility, 'elementor_enqueue_editor_styles' ) );

		return $this;
	}

	/**
	 * Register WordPress filters for the plugin.
	 *
	 * @since 1.0.0
	 * @access protected
	 *
	 * @return Plugin Current plugin instance.
	 */
	protected function add_filters() {
		add_filter( 'elementor/files/css/selectors', array( $this->managers->units, 'modify_selectors' ), 10, 3 );

		// Only add plugin action links if the plugin is being used as a WordPress plugin
		if ( defined( 'ARTS_FLUID_DS_PLUGIN_FILE' ) ) {
			add_filter( 'plugin_action_links_' . plugin_basename( ARTS_FLUID_DS_PLUGIN_FILE ), array( $this->managers->options, 'add_plugin_action_links' ) );
		}

		return $this;
	}
}
