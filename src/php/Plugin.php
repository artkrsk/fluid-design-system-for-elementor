<?php
/**
 * Plugin initialization and hook registration.
 *
 * @package Arts\FluidDesignSystem
 */

namespace Arts\FluidDesignSystem;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use Arts\FluidDesignSystem\Base\Plugin as BasePlugin;

/**
 * Main plugin class - managers, actions, and filters.
 */
class Plugin extends BasePlugin {
	/** @return array<string, mixed> */
	protected function get_default_config(): array {
		return array();
	}

	/** @return array<string, string> */
	protected function get_default_strings(): array {
		return array();
	}

	protected function get_default_run_action(): string {
		return 'init';
	}

	/**
	 * Keys become $this->managers->key accessors.
	 *
	 * @return array<string, class-string>
	 */
	protected function get_managers_classes(): array {
		return array(
			'extension'                  => Managers\Extension::class,
			'compatibility'              => Managers\Compatibility::class,
			'options'                    => Managers\Options::class,
			'units'                      => Managers\Units::class,
			'notices'                    => Managers\Notices::class,
			'admin_frontend'             => Managers\Admin\Frontend::class,
			'admin_page'                 => Managers\Admin\Page::class,
			'admin_tabs'                 => Managers\Admin\Tabs\Tabs::class,
			'admin_tabs_groups_ajax'     => Managers\Admin\Tabs\Groups\AJAX::class,
			'admin_tabs_groups_handlers' => Managers\Admin\Tabs\Groups\Handlers::class,
			'admin_tabs_groups_view'     => Managers\Admin\Tabs\Groups\View::class,
			'data'                       => Managers\Data::class,
			'groups_data'                => Managers\GroupsData::class,
			'css_variables'              => Managers\CSSVariables::class,
			'control_registry'           => Managers\ControlRegistry::class,
		);
	}

	/** Registers filters for ArtsElementorExtension integration. */
	protected function do_after_init_managers(): void {
		add_filter( 'arts/elementor_extension/tabs/tabs', array( $this->managers->options, 'get_elementor_site_settings_tabs' ) );
		add_filter( 'arts/elementor_extension/plugin/config', array( $this->managers->extension, 'filter_plugin_config' ) );
		add_filter( 'arts/elementor_extension/plugin/strings', array( $this->managers->extension, 'get_strings' ) );
	}

	protected function add_actions(): void {
		add_action( 'elementor/element/after_section_end', array( $this->managers->units, 'modify_control_settings' ), 10, 3 );
		add_action( 'elementor/ajax/register_actions', array( $this->managers->units, 'register_ajax_handlers' ) );
		add_action( 'elementor/editor/before_enqueue_scripts', array( $this->managers->compatibility, 'elementor_enqueue_editor_scripts' ) );
		add_action( 'elementor/editor/after_enqueue_styles', array( $this->managers->compatibility, 'elementor_enqueue_editor_styles' ) );
		add_action( 'elementor/css-file/post/parse', array( $this->managers->units, 'optimize_fluid_css_post_parse' ) );
		add_action( 'admin_menu', array( $this->managers->admin_page, 'add_admin_menu' ), 80 );
		add_action( 'admin_enqueue_scripts', array( $this->managers->admin_frontend, 'enqueue_assets' ) );
		add_action( 'wp_ajax_fluid_design_system_admin_action', array( $this->managers->admin_tabs_groups_ajax, 'handle_ajax_requests' ) );
	}

	protected function add_filters(): void {
		add_filter( 'elementor/files/css/selectors', array( $this->managers->units, 'modify_selectors' ), 10, 3 );

		// Plugin action links only when used as standalone WP plugin
		if ( defined( 'ARTS_FLUID_DS_PLUGIN_FILE' ) ) {
			/** @var string $plugin_file */
			$plugin_file = constant( 'ARTS_FLUID_DS_PLUGIN_FILE' );
			add_filter( 'plugin_action_links_' . plugin_basename( $plugin_file ), array( $this->managers->options, 'add_plugin_action_links' ) );
		}
	}
}
