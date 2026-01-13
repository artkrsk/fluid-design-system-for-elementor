<?php
/**
 * Elementor Site Settings tab and plugin action links.
 *
 * @package Arts\FluidDesignSystem
 */

namespace Arts\FluidDesignSystem\Managers;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use ArtsFluidDS\Arts\Utilities\Utilities;
use Arts\FluidDesignSystem\Base\Manager as BaseManager;
use Arts\FluidDesignSystem\Elementor\Tabs\FluidTypographySpacing;

/**
 * Site Settings tab registration and plugin links.
 */
class Options extends BaseManager {
	/**
	 * Hooked to elementor/kit/additional_settings_tabs.
	 *
	 * @param array<int|string, mixed> $tabs
	 * @return array<int|string, mixed>
	 */
	public function get_elementor_site_settings_tabs( array $tabs ): array {
		$tabs[] = array(
			'class' => FluidTypographySpacing::class,
		);

		return $tabs;
	}

	/**
	 * Hooked to plugin_action_links_{plugin_basename}.
	 *
	 * @param array<int, string> $links
	 * @return array<int, string>
	 */
	public function add_plugin_action_links( array $links ): array {
		if ( ! Utilities::is_elementor_plugin_active() ) {
			return $links;
		}

		$new_links = array();

		$settings_url = Utilities::get_elementor_editor_site_settings_url( FluidTypographySpacing::TAB_ID );
		if ( $settings_url ) {
			$new_links[] = sprintf(
				'<a href="%s" target="_blank" rel="noopener noreferrer">%s</a>',
				esc_url( $settings_url ),
				esc_html__( 'Edit with Elementor', 'fluid-design-system-for-elementor' )
			);
		}

		$admin_url   = admin_url( 'admin.php?page=fluid-design-system' );
		$new_links[] = sprintf(
			'<a href="%s">%s</a>',
			esc_url( $admin_url ),
			esc_html__( 'Manage', 'fluid-design-system-for-elementor' )
		);

		return array_merge( $new_links, $links );
	}
}
