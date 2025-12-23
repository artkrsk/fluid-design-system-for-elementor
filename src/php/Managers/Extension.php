<?php
/**
 * Extension configuration manager for Fluid Design System.
 *
 * @package Arts\FluidDesignSystem
 * @since 1.0.0
 */

namespace Arts\FluidDesignSystem\Managers;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

use Arts\FluidDesignSystem\Base\Manager as BaseManager;

/**
 * Extension Class
 *
 * Manages Elementor configuration settings and strings for
 * the Fluid Design System extension.
 *
 * @since 1.0.0
 */
class Extension extends BaseManager {
	/**
	 * Filter plugin configuration for the Elementor extension.
	 *
	 * Defines required Elementor and PHP versions for the extension.
	 * Used as a WordPress filter callback.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @param array<string, mixed> $config The config for the Elementor extension.
	 * @return array<string, mixed> Modified configuration array.
	 */
	public function filter_plugin_config( array $config ): array {
		$config['required_elementor_version'] = '3.27.0';
		$config['required_php_version']       = '7.4';

		return $config;
	}

	/**
	 * Get the strings for the Elementor extension.
	 *
	 * Sets the extension name that appears in the Elementor UI.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @param array<string, mixed> $config The config for the Elementor extension.
	 * @return array<string, mixed> Modified strings array.
	 */
	public function get_strings( array $config ): array {
		/* This shouldn't be translated */
		$config['extension_name'] = 'Fluid Design System for Elementor';

		return $config;
	}
}
