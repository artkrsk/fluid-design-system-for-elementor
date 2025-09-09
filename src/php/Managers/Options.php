<?php
/**
 * Options manager for Fluid Design System.
 *
 * @package Arts\FluidDesignSystem
 * @since 1.0.0
 */

namespace Arts\FluidDesignSystem\Managers;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

use \Arts\Utilities\Utilities;
use \Arts\FluidDesignSystem\Base\Manager as BaseManager;
use \Arts\FluidDesignSystem\Elementor\Tabs\FluidTypographySpacing;

/**
 * Options Class
 *
 * Manages Elementor site settings tabs and options
 * for the Fluid Design System.
 *
 * @since 1.0.0
 */
class Options extends BaseManager {
	/**
	 * Register the `Fluid Typography & Spacing` tab in Elementor site settings.
	 *
	 * Adds a custom tab to Elementor site settings for managing
	 * typography and spacing options.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @param array $tabs Array of Elementor site settings tabs.
	 * @return array Array of Elementor site settings tabs with our custom tab added.
	 */
	public function get_elementor_site_settings_tabs( $tabs ) {
		$tabs[] = array(
			'class' => FluidTypographySpacing::class,
		);

		return $tabs;
	}

	/**
	 * Add plugin action links.
	 *
	 * Adds "Customize Presets" and "Manage Groups" links to the plugin's action links in the WordPress admin plugins page.
	 *
	 * @since 1.0.1
	 * @access public
	 *
	 * @param array $links Array of plugin action links.
	 * @return array Modified array of plugin action links.
	 */
	public function add_plugin_action_links( $links ) {
		// Check if Elementor is active
		if ( ! Utilities::is_elementor_plugin_active() ) {
			return $links;
		}

		$new_links = array();

		// Add "Customize Presets" link (opens in new tab)
		$settings_url = Utilities::get_elementor_editor_site_settings_url( FluidTypographySpacing::TAB_ID );
		if ( $settings_url ) {
			$new_links[] = sprintf(
				'<a href="%s" target="_blank" rel="noopener noreferrer">%s</a>',
				esc_url( $settings_url ),
				esc_html__( 'Edit with Elementor', 'fluid-design-system-for-elementor' )
			);
		}

		// Add "Manage Groups" link
		$admin_url   = admin_url( 'admin.php?page=fluid-design-system' );
		$new_links[] = sprintf(
			'<a href="%s">%s</a>',
			esc_url( $admin_url ),
			esc_html__( 'Manage', 'fluid-design-system-for-elementor' )
		);

		// Prepend our links to the existing ones
		return array_merge( $new_links, $links );
	}
}
