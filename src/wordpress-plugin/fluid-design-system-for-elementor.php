<?php
/**
 * Plugin Name: Fluid Design System for Elementor
 * Description: Provides comprehensive fluid spacing and typography system for Elementor for smoother and consistent responsive design
 * Version: 2.0.0
 * Author: Artem Semkin
 * Author URI: https://artemsemkin.com
 * License: GPLv3
 * License URI: https://www.gnu.org/licenses/gpl-3.0
 * Requires at least: 6.0
 * Requires PHP: 8.0
 * Tested up to: 6.9
 * Plugin URI: https://artemsemkin.com/
 * Text Domain: fluid-design-system-for-elementor
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

require_once __DIR__ . '/vendor/autoload.php';

use Arts\Utilities\Utilities;
use Arts\FluidDesignSystem\Plugin;

define( 'ARTS_FLUID_DS_PLUGIN_FILE', __FILE__ );
define( 'ARTS_FLUID_DS_PLUGIN_VERSION', Utilities::get_plugin_version( ARTS_FLUID_DS_PLUGIN_FILE ) );
define( 'ARTS_FLUID_DS_PLUGIN_PATH', untrailingslashit( plugin_dir_path( ARTS_FLUID_DS_PLUGIN_FILE ) ) );
define( 'ARTS_FLUID_DS_PLUGIN_URL', untrailingslashit( plugin_dir_url( ARTS_FLUID_DS_PLUGIN_FILE ) ) );

Plugin::instance();
