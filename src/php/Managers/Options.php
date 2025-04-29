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

use \Arts\ElementorExtension\Plugins\BaseManager;
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
	 * Adds a "Settings" link to the plugin's action links in the WordPress admin plugins page.
	 *
	 * @since 1.0.1
	 * @access public
	 *
	 * @param array $links Array of plugin action links.
	 * @return array Modified array of plugin action links.
	 */
	public function add_plugin_action_links( $links ) {
		$recent_edited_post = \Elementor\Utils::get_recently_edited_posts_query(
			array(
				'posts_per_page' => 1,
			)
		);

		if ( $recent_edited_post->post_count ) {
			$posts   = $recent_edited_post->get_posts();
			$post_id = reset( $posts )->ID;
			$kit_id  = \Elementor\Plugin::$instance->kits_manager->get_active_id();

			$settings_link = sprintf(
				'<a href="%s">%s</a>',
				esc_url( admin_url( 'post.php?post=' . $post_id . '&action=elementor&active-document=' . $kit_id . '&active-tab=' . FluidTypographySpacing::TAB_ID ) ),
				esc_html__( 'Settings', 'fluid-design-system-for-elementor' )
			);

			array_unshift( $links, $settings_link );
		}

		return $links;
	}
}
