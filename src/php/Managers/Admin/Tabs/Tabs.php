<?php

namespace Arts\FluidDesignSystem\Managers\Admin\Tabs;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

use Arts\FluidDesignSystem\Base\Manager as BaseManager;

class Tabs extends BaseManager {
	/**
	 * Render navigation tabs.
	 *
	 * @since 1.0.0
	 * @access private
	 *
	 * @param string $current_tab Current active tab.
	 * @return void
	 */
	public function render_tabs( string $current_tab ): void {
		$tabs = $this->get_tabs();

		foreach ( $tabs as $tab_id => $tab_data ) {
			$active_class = ( $current_tab === $tab_id ) ? ' nav-tab-active' : '';
			$tab_url      = add_query_arg( 'tab', $tab_id, admin_url( 'admin.php?page=fluid-design-system' ) );

			printf(
				'<a id="fluid-design-system-tab-%1$s" class="nav-tab%2$s" href="%3$s">%4$s</a>',
				esc_attr( $tab_id ),
				esc_attr( $active_class ),
				esc_url( $tab_url ),
				esc_html( $tab_data['title'] )
			);
		}
	}

	/**
	 * Render tab content.
	 *
	 * @since 1.0.0
	 * @access private
	 *
	 * @param string $current_tab Current active tab.
	 * @return void
	 */
	public function render_tab_content( string $current_tab ): void {
		if ( $this->managers === null ) {
			return;
		}

		$tabs = $this->get_tabs();

		if ( ! isset( $tabs[ $current_tab ] ) ) {
			$current_tab = 'groups';
		}

		$tab_data  = $tabs[ $current_tab ];
		$tab_class = 'fluid-design-system-form-page' . ( 'groups' === $current_tab ? ' fluid-design-system-active' : '' );

		?>
		<div id="tab-<?php echo esc_attr( $current_tab ); ?>" class="<?php echo esc_attr( $tab_class ); ?>">
			<?php
			switch ( $current_tab ) {
				case 'groups':
					$this->managers->admin_tabs_groups_view->render( $tab_data );
					break;
			}
			?>
		</div>
		<?php
	}

	/**
	 * Get available tabs.
	 *
	 * @since 1.0.0
	 * @access private
	 *
	 * @return array<string, array<string, string>> Array of tabs data.
	 */
	public function get_tabs(): array {
		return array(
			'groups' => array(
				'title'       => esc_html__( 'Groups', 'fluid-design-system-for-elementor' ),
				'description' => '',
			),
			// Future tabs can be added here
		);
	}
}
