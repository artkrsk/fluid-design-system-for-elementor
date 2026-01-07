<?php
/**
 * Elementor extension configuration.
 *
 * @package Arts\FluidDesignSystem
 * @since 1.0.0
 */

namespace Arts\FluidDesignSystem\Managers;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use Arts\FluidDesignSystem\Base\Manager as BaseManager;

/**
 * Version requirements and extension strings for Elementor.
 *
 * @since 1.0.0
 */
class Extension extends BaseManager {
	/**
	 * @param array<string, mixed> $config ArtsElementorExtension config.
	 * @return array<string, mixed>
	 */
	public function filter_plugin_config( array $config ): array {
		$config['required_elementor_version'] = '3.27.0';
		$config['required_php_version']       = '8.0';

		return $config;
	}

	/**
	 * @param array<string, mixed> $config ArtsElementorExtension strings.
	 * @return array<string, mixed>
	 */
	public function get_strings( array $config ): array {
		$config['extension_name'] = 'Fluid Design System for Elementor'; // Not translated intentionally

		return $config;
	}
}
