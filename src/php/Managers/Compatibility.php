<?php
/**
 * Compatibility manager for Arts Fluid Design System.
 *
 * @package Arts\FluidDesignSystem
 * @since 1.0.0
 */

namespace Arts\FluidDesignSystem\Managers;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

use \Arts\ElementorExtension\Plugins\BaseManager;

/**
 * Compatibility Class
 *
 * Manages compatibility with Elementor editor by handling script
 * and style enqueuing, as well as providing localized strings.
 *
 * @since 1.0.0
 */
class Compatibility extends BaseManager {
	/**
	 * Script and style handle.
	 *
	 * @since 1.0.0
	 * @access private
	 * @var string
	 */
	private $handle = 'arts-fluid-design-system-editor';

	/**
	 * Enqueue the editor scripts.
	 *
	 * Registers and enqueues the necessary JavaScript files for the editor.
	 *
	 * @since 1.0.0
	 * @access public
	 * @return void
	 */
	public function elementor_enqueue_editor_scripts() {
		wp_enqueue_script(
			$this->handle,
			esc_url( untrailingslashit( $this->plugin_dir_url ) . '/libraries/arts-fluid-design-system/index.umd.js' ),
			array(),
			defined( 'ARTS_FLUID_DS_PLUGIN_VERSION' ) ? ARTS_FLUID_DS_PLUGIN_VERSION : false,
			true
		);

		// Localize script with translation strings
		wp_localize_script(
			$this->handle,
			'ArtsFluidDSStrings',
			$this->get_localized_strings()
		);
	}

	/**
	 * Enqueue the editor styles.
	 *
	 * Registers and enqueues the necessary CSS files for the editor.
	 *
	 * @since 1.0.0
	 * @access public
	 * @return void
	 */
	public function elementor_enqueue_editor_styles() {
		wp_enqueue_style(
			$this->handle,
			esc_url( untrailingslashit( $this->plugin_dir_url ) . '/libraries/arts-fluid-design-system/index.css' ),
			array(),
			defined( 'ARTS_FLUID_DS_PLUGIN_VERSION' ) ? ARTS_FLUID_DS_PLUGIN_VERSION : false
		);
	}

	/**
	 * Get all translatable strings for localization.
	 *
	 * Provides an array of strings that need to be available for translation
	 * in the JavaScript code.
	 *
	 * @since 1.0.0
	 * @access private
	 * @return array Array of translatable strings.
	 */
	private function get_localized_strings() {
		return array(
			// Repeater / Global Style strings
			'deleteFluidPreset'   => esc_html__( 'Delete Fluid Preset', 'fluid-design-system-for-elementor' ),
			'deletePresetMessage' => esc_html__( "You're about to delete a Fluid Preset. Note that if it's being used anywhere on your site, it will inherit default values.", 'fluid-design-system-for-elementor' ),
			'delete'              => esc_html__( 'Delete', 'fluid-design-system-for-elementor' ),
			'cancel'              => esc_html__( 'Cancel', 'fluid-design-system-for-elementor' ),
			'addPreset'           => esc_html__( 'Add Preset', 'fluid-design-system-for-elementor' ),
			'newPreset'           => esc_html__( 'New Preset', 'fluid-design-system-for-elementor' ),

			// StateManager strings
			'saveChanges'         => esc_html__( 'Save Changes', 'fluid-design-system-for-elementor' ),
			'saveChangesMessage'  => esc_html__( "Would you like to save the changes you've made?", 'fluid-design-system-for-elementor' ),
			'save'                => esc_html__( 'Save', 'fluid-design-system-for-elementor' ),
			'discard'             => esc_html__( 'Discard', 'fluid-design-system-for-elementor' ),

			// Select2 strings
			'inherit'             => esc_html__( 'Inherit', 'fluid-design-system-for-elementor' ),
		);
	}
}
