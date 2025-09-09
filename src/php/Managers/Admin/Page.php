<?php

namespace Arts\FluidDesignSystem\Managers\Admin;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

use \Arts\FluidDesignSystem\Base\Manager as BaseManager;
use \Arts\Utilities\Utilities;

class Page extends BaseManager {
	/**
	 * Add admin menu page.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @return void
	 */
	public function add_admin_menu() {
		// Only add menu if Elementor is active
		if ( ! Utilities::is_elementor_plugin_active() ) {
			return;
		}

		add_submenu_page(
			'elementor',
			esc_html__( 'Fluid Design System', 'fluid-design-system-for-elementor' ),
			esc_html__( 'Fluid Design System', 'fluid-design-system-for-elementor' ),
			'manage_options',
			'fluid-design-system',
			array( $this, 'render_admin_page' ),
			15
		);
	}

	/**
	 * Render the admin page.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @return void
	 */
	public function render_admin_page() {
		// Check user capabilities
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You do not have sufficient permissions to access this page.', 'fluid-design-system-for-elementor' ) );
		}

		// Check if Elementor is active
		if ( ! Utilities::is_elementor_plugin_active() ) {
			wp_die( esc_html__( 'Elementor plugin is required for this functionality.', 'fluid-design-system-for-elementor' ) );
		}

		do_action( 'arts/fluid_design_system/admin/page/before_render' );

		// Handle POST actions first
		$this->managers->admin_tabs_groups_handlers->handle_group_actions();

		// Get current tab (GET parameter for navigation - no nonce needed)
		$current_tab = isset( $_GET['tab'] ) ? sanitize_key( $_GET['tab'] ) : 'groups'; // phpcs:ignore WordPress.Security.NonceVerification.Recommended

		?>
		<div class="wrap">
			<h1 class="wp-heading-inline"><?php echo esc_html( get_admin_page_title() ); ?></h1>
			<div id="fluid-design-system-tabs-wrapper" class="nav-tab-wrapper">
				<?php $this->managers->admin_tabs->render_tabs( $current_tab ); ?>
			</div>
			<?php $this->managers->admin_tabs->render_tab_content( $current_tab ); ?>
		</div>
		<?php
		do_action( 'arts/fluid_design_system/admin/page/after_render' );
	}
}
