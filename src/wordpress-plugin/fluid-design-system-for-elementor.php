<?php
/**
 * Plugin Name: Fluid Design System for Elementor
 * Description: Provides comprehensive fluid spacing and typography system for Elementor for smoother and consistent responsive design
 * Version: 1.2.0
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

use \Arts\Utilities\Utilities;
use \Arts\FluidDesignSystem\Plugin;

$arts_fluid_design_system_plugin_file    = __FILE__;
$arts_fluid_design_system_plugin_version = Utilities::get_plugin_version( $arts_fluid_design_system_plugin_file );

define( 'ARTS_FLUID_DS_PLUGIN_VERSION', $arts_fluid_design_system_plugin_version );
define( 'ARTS_FLUID_DS_PLUGIN_FILE', $arts_fluid_design_system_plugin_file );
define( 'ARTS_FLUID_DS_PLUGIN_PATH', untrailingslashit( plugin_dir_path( $arts_fluid_design_system_plugin_file ) ) );
define( 'ARTS_FLUID_DS_PLUGIN_URL', untrailingslashit( plugin_dir_url( $arts_fluid_design_system_plugin_file ) ) );

Plugin::instance();
