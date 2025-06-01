<?php
/**
 * Plugin Name: Fluid Design System for Elementor
 * Description: Provides comprehensive fluid spacing and typography system for Elementor for smoother and consistent responsive design
 * Version: 1.0.5
 * Author: Artem Semkin
 * Author URI: https://artemsemkin.com
 * License: GPLv3
 * License URI: https://www.gnu.org/licenses/gpl-3.0
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * Tested up to: 6.8
 * Plugin URI: https://artemsemkin.com/
 * Text Domain: fluid-design-system-for-elementor
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

require_once __DIR__ . '/vendor/autoload.php';

use \Arts\Utilities\Utilities;
use \Arts\FluidDesignSystem\Plugin;

$plugin_file    = __FILE__;
$plugin_version = Utilities::get_plugin_version( $plugin_file );

define( 'ARTS_FLUID_DS_PLUGIN_VERSION', $plugin_version );
define( 'ARTS_FLUID_DS_PLUGIN_FILE', $plugin_file );
define( 'ARTS_FLUID_DS_PLUGIN_PATH', untrailingslashit( plugin_dir_path( $plugin_file ) ) );
define( 'ARTS_FLUID_DS_PLUGIN_URL', untrailingslashit( plugin_dir_url( $plugin_file ) ) );

Plugin::instance();
