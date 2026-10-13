<?php
/**
 * Base test case for suites that need Elementor with a real active Kit.
 *
 * The plugin activation hook never fires under the test bootstrap (the plugin
 * is required on muplugins_loaded, not activated), so the default Kit must be
 * created explicitly — same pattern Elementor's own kit tests use.
 *
 * @package Arts\FluidDesignSystem\Tests
 */

namespace Arts\FluidDesignSystem\Tests\Integration;

use WP_UnitTestCase;

abstract class ElementorKitTestCase extends WP_UnitTestCase {

	/** @var \Elementor\Core\Kits\Documents\Kit */
	protected $kit;

	public function set_up(): void {
		parent::set_up();

		$admin_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin_id );

		// Idempotent: no-ops when the elementor_active_kit option is already set.
		\Elementor\Core\Kits\Manager::create_default_kit();

		$kit = \Elementor\Plugin::$instance->kits_manager->get_active_kit();
		$this->assertGreaterThan( 0, $kit->get_id(), 'Active Kit was not created' );

		$this->kit = $kit;
	}

	/**
	 * Under Internal Embedding, Kit::add_repeater_row() prints the Kit <style> outside a page
	 * render (elementor/elementor#37468). Elementor prints each handle once per process, so its
	 * guard is reset to keep the print from depending on which test enqueued the Kit CSS first.
	 */
	protected function use_internal_css_embedding(): void {
		update_option( 'elementor_css_print_method', 'internal' );

		if ( property_exists( \Elementor\Core\Files\CSS\Base::class, 'printed' ) ) {
			$printed = new \ReflectionProperty( \Elementor\Core\Files\CSS\Base::class, 'printed' );
			if ( PHP_VERSION_ID < 80100 ) {
				$printed->setAccessible( true );
			}
			$printed->setValue( null, array() );
		}
	}
}
