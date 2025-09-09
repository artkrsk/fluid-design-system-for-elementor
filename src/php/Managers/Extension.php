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

use \Arts\FluidDesignSystem\Base\Manager as BaseManager;

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
	 * Get the config for the Elementor extension.
	 *
	 * Defines required Elementor and PHP versions for the extension.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @param array $config The config for the Elementor extension.
	 * @return array Modified configuration array.
	 */
	public function get_config( $config ) {
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
	 * @param array $config The config for the Elementor extension.
	 * @return array Modified strings array.
	 */
	public function get_strings( $config ) {
		/* This shouldn't be translated */
		$config['extension_name'] = 'Fluid Design System for Elementor';

		return $config;
	}
}
