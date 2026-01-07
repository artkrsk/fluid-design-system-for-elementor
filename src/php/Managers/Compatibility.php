<?php
/**
 * Editor script/style enqueuing and localization.
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
 * Elementor editor assets and localization.
 *
 * @since 1.0.0
 */
class Compatibility extends BaseManager {
	/** @var string */
	private $handle = 'arts-fluid-design-system-editor';

	/** Hooked to elementor/editor/after_enqueue_scripts. */
	public function elementor_enqueue_editor_scripts(): void {
		/** @var string|false $version */
		$version = defined( 'ARTS_FLUID_DS_PLUGIN_VERSION' ) && is_string( constant( 'ARTS_FLUID_DS_PLUGIN_VERSION' ) )
			? constant( 'ARTS_FLUID_DS_PLUGIN_VERSION' )
			: false;

		wp_enqueue_script(
			$this->handle,
			esc_url( untrailingslashit( $this->plugin_dir_url ) . '/libraries/arts-fluid-design-system/index.umd.js' ),
			array(),
			$version,
			true
		);

		wp_localize_script(
			$this->handle,
			'ArtsFluidDSStrings',
			$this->get_localized_strings()
		);
	}

	/** Hooked to elementor/editor/after_enqueue_styles. */
	public function elementor_enqueue_editor_styles(): void {
		/** @var string|false $version */
		$version = defined( 'ARTS_FLUID_DS_PLUGIN_VERSION' ) && is_string( constant( 'ARTS_FLUID_DS_PLUGIN_VERSION' ) )
			? constant( 'ARTS_FLUID_DS_PLUGIN_VERSION' )
			: false;

		wp_enqueue_style(
			$this->handle,
			esc_url( untrailingslashit( $this->plugin_dir_url ) . '/libraries/arts-fluid-design-system/index.css' ),
			array(),
			$version
		);
	}

	/**
	 * Keys must match constants in JS: interfaces/IArtsFluidDSStrings.ts
	 *
	 * @return array<string, string>
	 */
	private function get_localized_strings(): array {
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
			'discard'             => esc_html__( 'Discard', 'fluid-design-system-for-elementor' ),

			// Select2 strings
			'inherit'             => esc_html__( 'Inherit', 'fluid-design-system-for-elementor' ),

			// Preset dialog strings
			'saveAsPreset'        => esc_html__( 'Save as Preset', 'fluid-design-system-for-elementor' ),
			'createNewPreset'     => esc_html__( 'Preset will be available across your entire site', 'fluid-design-system-for-elementor' ),
			'editPreset'          => esc_html__( 'Edit Preset', 'fluid-design-system-for-elementor' ),
			'editPresetMessage'   => esc_html__( 'Changes will apply to all elements using this preset', 'fluid-design-system-for-elementor' ),
			'create'              => esc_html__( 'Create', 'fluid-design-system-for-elementor' ),
			'save'                => esc_html__( 'Save', 'fluid-design-system-for-elementor' ),
			'presetName'          => esc_html__( 'Preset Name...', 'fluid-design-system-for-elementor' ),
			'customValue'         => esc_html__( 'Custom value...', 'fluid-design-system-for-elementor' ),
			'spacingPresets'      => esc_html__( 'Spacing Presets', 'fluid-design-system-for-elementor' ),
			'typographyPresets'   => esc_html__( 'Typography Presets', 'fluid-design-system-for-elementor' ),
			'error'               => esc_html__( 'Error', 'fluid-design-system-for-elementor' ),
			'failedToSave'        => esc_html__( 'Failed to save preset', 'fluid-design-system-for-elementor' ),
		);
	}
}
