<?php
/**
 * Plugin Name: AAAA Arts Utilities Conflict Test
 * Plugin URI: https://artemsemkin.com
 * Description: Simulates an old ArtsUtilities version (pre-1.1.11) for e2e testing of namespace conflicts. This plugin intentionally loads BEFORE Fluid Design System to test isolation.
 * Version: 1.0.0
 * Author: Artem Semkin
 * Author URI: https://artemsemkin.com
 * License: GPL-3.0-or-later
 * Requires PHP: 8.0
 *
 * WARNING: This plugin is for TESTING ONLY. It deliberately breaks compatibility
 * by providing an incomplete Arts\Utilities\Utilities class.
 */

/**
 * Register a custom autoloader that loads our OLD stub version of Arts\Utilities\Utilities.
 *
 * Using prepend=true ensures this autoloader runs BEFORE Composer's autoloader,
 * simulating the scenario where an outdated theme loads ArtsUtilities first.
 */
spl_autoload_register(
	function ( $class ) {
		// Only intercept the specific class we want to stub
		if ( $class === 'Arts\\Utilities\\Utilities' ) {
			require_once __DIR__ . '/includes/class-utilities-stub.php';
			return true;
		}
		return false;
	},
	true,  // throw exceptions on failure
	true   // prepend to autoloader stack (critical for loading FIRST)
);

// Force the class to be loaded immediately when this plugin initializes
// This ensures our stub is registered before any other plugin tries to use it
if ( ! class_exists( 'Arts\\Utilities\\Utilities', false ) ) {
	class_exists( 'Arts\\Utilities\\Utilities' );
}

// Add admin notice to indicate the conflict test is active
add_action(
	'admin_notices',
	function () {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		?>
		<div class="notice notice-warning">
			<p>
				<strong>Arts Utilities Conflict Test Active:</strong>
				This plugin is simulating an old ArtsUtilities version for e2e testing.
				The <code>get_string_value()</code> method is intentionally missing.
			</p>
		</div>
		<?php
	}
);
