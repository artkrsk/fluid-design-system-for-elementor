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
}
