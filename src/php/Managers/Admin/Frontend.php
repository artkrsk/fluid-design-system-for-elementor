<?php

namespace Arts\FluidDesignSystem\Managers\Admin;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

use \Arts\FluidDesignSystem\Base\Manager as BaseManager;

class Frontend extends BaseManager {

	/**
	 * Enqueue admin assets.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @param string $hook_suffix The current admin page hook suffix.
	 * @return void
	 */
	public function enqueue_assets( $hook_suffix ) {
		// Only enqueue on our admin pages
		if ( strpos( $hook_suffix, 'fluid-design-system' ) === false ) {
			return;
		}

		// Enqueue jQuery UI Sortable for drag & drop functionality
		wp_enqueue_script( 'jquery-ui-sortable' );

		// Enqueue Elementor icons for the hero button
		if ( defined( 'ELEMENTOR_ASSETS_URL' ) ) {
			wp_enqueue_style(
				'elementor-icons',
				ELEMENTOR_ASSETS_URL . 'lib/eicons/css/elementor-icons.min.css',
				array(),
				defined( 'ELEMENTOR_VERSION' ) ? ELEMENTOR_VERSION : '1.0.0'
			);
		}

		$version = defined( 'ARTS_FLUID_DS_PLUGIN_VERSION' ) ? ARTS_FLUID_DS_PLUGIN_VERSION : false;

		// Enqueue modular CSS files
		wp_enqueue_style(
			'fluid-design-system-admin-base',
			$this->plugin_dir_url . 'admin/css/base.css',
			array( 'common', 'forms' ),
			$version
		);

		wp_enqueue_style(
			'fluid-design-system-admin-table',
			$this->plugin_dir_url . 'admin/css/table.css',
			array( 'fluid-design-system-admin-base' ),
			$version
		);

		wp_enqueue_style(
			'fluid-design-system-admin-inline-editing',
			$this->plugin_dir_url . 'admin/css/inline-editing.css',
			array( 'fluid-design-system-admin-base' ),
			$version
		);

		wp_enqueue_style(
			'fluid-design-system-admin-responsive',
			$this->plugin_dir_url . 'admin/css/responsive.css',
			array( 'fluid-design-system-admin-base', 'fluid-design-system-admin-table' ),
			$version
		);

		// Enqueue status notices CSS (before AJAX CSS)
		wp_enqueue_style(
			'fluid-design-system-admin-status-notices',
			$this->plugin_dir_url . 'admin/css/status-notices.css',
			array( 'fluid-design-system-admin-base' ),
			$version
		);

		// Enqueue AJAX CSS (now simplified, depends on status notices)
		wp_enqueue_style(
			'fluid-design-system-admin-ajax',
			$this->plugin_dir_url . 'admin/css/ajax.css',
			array( 'fluid-design-system-admin-base', 'fluid-design-system-admin-status-notices' ),
			$version
		);

		// Enqueue AJAX CSS (now simplified, depends on status notices)
		wp_enqueue_style(
			'fluid-design-system-admin-accordion',
			$this->plugin_dir_url . 'admin/css/accordion.css',
			array( 'fluid-design-system-admin-base', 'fluid-design-system-admin-status-notices' ),
			$version
		);

		wp_enqueue_script(
			'dompurify',
			$this->plugin_dir_url . 'admin/js/purify.min.js',
			array(),
			'3.0.6',
			true
		);

		// Enqueue modular JavaScript files
		wp_enqueue_script(
			'fluid-design-system-admin-base',
			$this->plugin_dir_url . 'admin/js/base.js',
			array( 'jquery' ),
			$version,
			true
		);

		// Enqueue status notices JS (before other modules that depend on it)
		wp_enqueue_script(
			'fluid-design-system-admin-status-notices',
			$this->plugin_dir_url . 'admin/js/status-notices.js',
			array( 'jquery', 'fluid-design-system-admin-base' ),
			$version,
			true
		);

		wp_enqueue_script(
			'fluid-design-system-admin-sortable',
			$this->plugin_dir_url . 'admin/js/sortable.js',
			array( 'jquery', 'jquery-ui-sortable', 'fluid-design-system-admin-base', 'fluid-design-system-admin-status-notices' ),
			$version,
			true
		);

		wp_enqueue_script(
			'fluid-design-system-admin-inline-editing',
			$this->plugin_dir_url . 'admin/js/inline-editing.js',
			array( 'jquery', 'fluid-design-system-admin-base', 'fluid-design-system-admin-status-notices' ),
			$version,
			true
		);

		// Enqueue AJAX manager (now depends on status notices)
		wp_enqueue_script(
			'fluid-design-system-admin-ajax-manager',
			$this->plugin_dir_url . 'admin/js/ajax-manager.js',
			array( 'jquery', 'dompurify', 'fluid-design-system-admin-base', 'fluid-design-system-admin-status-notices' ),
			$version,
			true
		);

		// Enqueue accordion functionality for cross-group preset management
		wp_enqueue_script(
			'fluid-design-system-admin-accordion',
			$this->plugin_dir_url . 'admin/js/accordion.js',
			array( 'jquery', 'fluid-design-system-admin-base', 'fluid-design-system-admin-sortable' ),
			$version,
			true
		);

		// Localize script for AJAX
		wp_localize_script(
			'fluid-design-system-admin-ajax-manager',
			'fluidDesignSystemAdmin',
			array(
				'ajaxUrl'         => admin_url( 'admin-ajax.php' ),
				'ajaxNonce'       => wp_create_nonce( 'fluid_design_system_ajax_nonce' ),
				'controlRegistry' => $this->get_control_registry_data(),
				'strings'         => array(
					// AJAX operation messages
					'ajaxError'                    => esc_html__( 'An error occurred while processing your request.', 'fluid-design-system-for-elementor' ),
					'savingChanges'                => esc_html__( 'Saving changes...', 'fluid-design-system-for-elementor' ),
					'changesSaved'                 => esc_html__( 'Changes saved successfully.', 'fluid-design-system-for-elementor' ),
					'operationSuccess'             => esc_html__( 'Changes saved successfully.', 'fluid-design-system-for-elementor' ),
					'operationError'               => esc_html__( 'An error occurred. Please try again.', 'fluid-design-system-for-elementor' ),
					'savingAllChanges'             => esc_html__( 'Saving all changes...', 'fluid-design-system-for-elementor' ),
					'allChangesSaved'              => esc_html__( 'Changes saved successfully.', 'fluid-design-system-for-elementor' ),

					// Validation messages
					'emptyTitle'                   => esc_html__( 'Group name cannot be empty. Please enter a name.', 'fluid-design-system-for-elementor' ),
					'invalidCharacters'            => esc_html__( 'Invalid characters detected. Only letters, numbers, spaces, and basic punctuation are allowed.', 'fluid-design-system-for-elementor' ),
					'invalidCharactersTitle'       => esc_html__( 'Group name contains invalid characters. Only letters, numbers, spaces, and basic punctuation are allowed.', 'fluid-design-system-for-elementor' ),
					'invalidCharactersDescription' => esc_html__( 'Description contains invalid characters. Only letters, numbers, spaces, and basic punctuation are allowed.', 'fluid-design-system-for-elementor' ),
					/* translators: %s: Group name that already exists */
					'duplicateTitle'               => esc_html__( 'Group name "%s" already exists. Please choose a different name.', 'fluid-design-system-for-elementor' ),
					/* translators: %1$d: Current character count, %2$d: Maximum allowed character count */
					'tooLong'                      => esc_html__( 'Group name is too long (%1$d characters). Please keep it under %2$d characters.', 'fluid-design-system-for-elementor' ),
					'tooShort'                     => esc_html__( 'Group name is too short. Please enter at least 2 characters.', 'fluid-design-system-for-elementor' ),
					'validationError'              => esc_html__( 'Validation error occurred.', 'fluid-design-system-for-elementor' ),

					// Success messages
					/* translators: %s: Name of the group that was created */
					'addingSuccess'                => esc_html__( 'Successfully created "%s" group.', 'fluid-design-system-for-elementor' ),
					/* translators: %s: Name of the item that was updated */
					'updatingSuccess'              => esc_html__( 'Successfully updated "%s".', 'fluid-design-system-for-elementor' ),

					// Status messages
					'unsavedChanges'               => esc_html__( 'You have unsaved changes', 'fluid-design-system-for-elementor' ),

					// Console messages (for debugging)
					'statusModuleNotLoaded'        => esc_html__( 'Status notices module not loaded', 'fluid-design-system-for-elementor' ),
					'statusAreaNotFound'           => esc_html__( 'Status area not found - falling back to dynamic creation', 'fluid-design-system-for-elementor' ),
					'networkError'                 => esc_html__( 'Network error occurred', 'fluid-design-system-for-elementor' ),
					'changesSavedSuccess'          => esc_html__( 'Changes saved successfully', 'fluid-design-system-for-elementor' ),

					// UI element attributes
					'undoDeletion'                 => esc_html__( 'Undo deletion', 'fluid-design-system-for-elementor' ),

					// Confirmation messages
					/* translators: %1$s: Group name, %2$d: Number of presets, %3$s: Plural suffix for presets (empty string or "s") */
					'deleteGroupConfirm'           => esc_html__( 'Are you sure you want to delete "%1$s"?\n\nThis group contains %2$d preset%3$s that will be permanently removed.', 'fluid-design-system-for-elementor' ),

					// Backend operation messages
					'operationFailed'              => esc_html__( 'Operation failed', 'fluid-design-system-for-elementor' ),
					'noChangesMade'                => esc_html__( 'No changes made', 'fluid-design-system-for-elementor' ),

					// Temporary group messages
					'tempGroupUpdateSuccess'       => esc_html__( 'Changes will be saved when you click "Save Changes"', 'fluid-design-system-for-elementor' ),
					'tempGroupOrderSuccess'        => esc_html__( 'Group order will be saved when you click "Save Changes"', 'fluid-design-system-for-elementor' ),

					// Table refresh messages
					'developerGroupsTitle'         => esc_html__( 'Developer Groups', 'fluid-design-system-for-elementor' ),
					'developerGroupsDescription'   => esc_html__( 'These groups are added programmatically by themes or plugins and cannot be modified.', 'fluid-design-system-for-elementor' ),
					'noGroupsMessage'              => esc_html__( 'No groups found. Create your first group below.', 'fluid-design-system-for-elementor' ),
					'saveError'                    => esc_html__( 'Failed to save changes. Please try again.', 'fluid-design-system-for-elementor' ),
				),
			)
		);
	}

	/**
	 * Get control registry data for JavaScript.
	 *
	 * @since 1.0.0
	 * @access private
	 *
	 * @return array Control registry mapping data.
	 */
	private function get_control_registry_data() {
		$registry_data = array();

		// Add built-in control mappings (group_id => control_id)
		$registry_data['fluid_spacing_presets']    = array(
			'control_id' => 'fluid_spacing_presets',
			'type'       => 'builtin',
		);
		$registry_data['fluid_typography_presets'] = array(
			'control_id' => 'fluid_typography_presets',
			'type'       => 'builtin',
		);

		// Add custom group control IDs
		$custom_groups = \Arts\FluidDesignSystem\Managers\Data::get_custom_groups();
		foreach ( $custom_groups as $group_id => $group_data ) {
			$group_key                   = 'custom_' . $group_id;
			$control_id                  = \Arts\FluidDesignSystem\Managers\ControlRegistry::get_custom_group_control_id( $group_id );
			$registry_data[ $group_key ] = array(
				'control_id'  => $control_id,
				'type'        => 'custom',
				'name'        => $group_data['name'] ?? '',
				'description' => $group_data['description'] ?? '',
			);
		}

		return $registry_data;
	}
}
