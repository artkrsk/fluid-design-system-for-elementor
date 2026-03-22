<?php
/**
 * WordPress Abilities API + MCP Adapter integration.
 *
 * Registers fluid design system abilities for AI agent access
 * and exposes them via a dedicated MCP server.
 *
 * @package Arts\FluidDesignSystem
 */

namespace Arts\FluidDesignSystem\Managers;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use Arts\FluidDesignSystem\Base\Manager as BaseManager;
use Arts\FluidDesignSystem\Services\KitRepeaterService;
use ArtsFluidDS\Arts\Utilities\Utilities;
use WP_Error;

/**
 * Registers abilities and MCP servers for the Fluid Design System.
 */
class Abilities extends BaseManager {

	const CATEGORY = 'fluid-design-system';

	/** Registers the fluid-design-system ability category. */
	public function register_category(): void {
		if ( ! function_exists( 'wp_register_ability_category' ) ) {
			return;
		}

		wp_register_ability_category(
			self::CATEGORY,
			array(
				'label'       => __( 'Fluid Design System', 'fluid-design-system-for-elementor' ),
				'description' => __( 'Manage fluid typography and spacing presets.', 'fluid-design-system-for-elementor' ),
			)
		);
	}

	/** Registers all 11 abilities with schemas, callbacks, and MCP meta. */
	public function register_abilities(): void {
		if ( ! function_exists( 'wp_register_ability' ) ) {
			return;
		}

		$this->register_list_preset_groups();
		$this->register_get_preset_group();
		$this->register_create_preset_group();
		$this->register_rename_preset_group();
		$this->register_delete_preset_group();

		$this->register_list_presets();
		$this->register_get_preset();
		$this->register_create_preset();
		$this->register_update_preset();
		$this->register_delete_preset();
		$this->register_move_preset_to_group();
	}

	/**
	 * Creates the MCP server exposing all abilities as tools.
	 *
	 * @param \WP\MCP\Core\McpAdapter $adapter McpAdapter instance.
	 */
	public function register_mcp_servers( $adapter ): void {
		$tools = array(
			'fluid/list-preset-groups',
			'fluid/get-preset-group',
			'fluid/create-preset-group',
			'fluid/rename-preset-group',
			'fluid/delete-preset-group',
			'fluid/list-presets',
			'fluid/get-preset',
			'fluid/create-preset',
			'fluid/update-preset',
			'fluid/delete-preset',
			'fluid/move-preset-to-group',
		);

		$transport     = '\\WP\\MCP\\Transport\\HttpTransport';
		$error_handler = '\\WP\\MCP\\Infrastructure\\ErrorHandling\\ErrorLogMcpErrorHandler';

		if ( ! class_exists( $transport ) || ! class_exists( $error_handler ) ) {
			return;
		}

		/** @var string $version */
		$version = defined( 'ARTS_FLUID_DS_PLUGIN_VERSION' ) ? ARTS_FLUID_DS_PLUGIN_VERSION : '1.0.0';

		$adapter->create_server(
			'fluid-design-system',
			'fluid-design-system',
			'mcp',
			__( 'Fluid Design System', 'fluid-design-system-for-elementor' ),
			__( 'Manage fluid typography and spacing presets — create, organize, and inspect design tokens.', 'fluid-design-system-for-elementor' ),
			$version,
			array( $transport ),
			$error_handler,
			null,
			$tools,
			array(),
			array()
		);
	}

	/**
	 * Logs ability executions scoped to the fluid/ namespace.
	 *
	 * @param string $ability_name Ability that was executed.
	 * @param mixed  $input        Input passed to the ability.
	 * @param mixed  $result       Return value or WP_Error.
	 */
	public function log_execution( string $ability_name, $input, $result ): void {
		if ( strpos( $ability_name, 'fluid/' ) !== 0 ) {
			return;
		}

		$log_entry = array(
			'ability'   => $ability_name,
			'user_id'   => get_current_user_id(),
			'timestamp' => current_time( 'mysql' ),
			'input'     => $input,
			'success'   => ! is_wp_error( $result ),
		);

		/**
		 * Fires after a fluid design system ability is executed.
		 *
		 * @since 2.3.0
		 * @param array<string, mixed> $log_entry Structured log data.
		 */
		do_action( 'arts/fluid_design_system/ability_executed', $log_entry );

		if ( defined( 'WP_DEBUG_LOG' ) && WP_DEBUG_LOG ) {
			error_log( 'Fluid DS Ability: ' . wp_json_encode( $log_entry ) ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		}
	}

	// =========================================================================
	// Preset Group Abilities
	// =========================================================================

	private function register_list_preset_groups(): void {
		wp_register_ability(
			'fluid/list-preset-groups',
			array(
				'label'               => __( 'List Preset Groups', 'fluid-design-system-for-elementor' ),
				'description'         => __( 'Lists all preset groups with metadata. Does not include presets — use get-preset-group for that.', 'fluid-design-system-for-elementor' ),
				'category'            => self::CATEGORY,
				'permission_callback' => array( $this, 'can_read' ),
				'execute_callback'    => array( $this, 'execute_list_preset_groups' ),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'groups' => array(
							'type'  => 'array',
							'items' => self::group_schema(),
						),
					),
				),
				'meta'                => self::meta( true, false, true ),
			)
		);
	}

	/** @return array<string, mixed>|WP_Error */
	public function execute_list_preset_groups() {
		$raw_groups = GroupsData::get_all_groups();
		$groups     = array();

		foreach ( $raw_groups as $group ) {
			$groups[] = self::normalize_group( $group );
		}

		return array( 'groups' => $groups );
	}

	private function register_get_preset_group(): void {
		wp_register_ability(
			'fluid/get-preset-group',
			array(
				'label'               => __( 'Get Preset Group', 'fluid-design-system-for-elementor' ),
				'description'         => __( 'Returns a single group and its presets. Use group_id or control_id from list-preset-groups.', 'fluid-design-system-for-elementor' ),
				'category'            => self::CATEGORY,
				'permission_callback' => array( $this, 'can_read' ),
				'execute_callback'    => array( $this, 'execute_get_preset_group' ),
				'input_schema'        => array(
					'type'                 => 'object',
					'properties'           => array(
						'group_id' => array(
							'type'        => 'string',
							'description' => __( 'Group identifier — either the group_id (e.g. "spacing") or control_id (e.g. "fluid_spacing_presets").', 'fluid-design-system-for-elementor' ),
						),
					),
					'required'             => array( 'group_id' ),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'group'   => self::group_schema(),
						'presets' => array(
							'type'  => 'array',
							'items' => self::preset_schema(),
						),
					),
				),
				'meta'                => self::meta( true, false, true ),
			)
		);
	}

	/**
	 * @param array<string, mixed> $input
	 * @return array<string, mixed>|WP_Error
	 */
	public function execute_get_preset_group( array $input ) {
		/** @var string $group_id */
		$group_id   = $input['group_id'];
		$all_groups = GroupsData::get_all_groups();

		foreach ( $all_groups as $group ) {
			if ( self::group_matches_id( $group, $group_id ) ) {
				$control_id = self::resolve_control_id_from_group( $group );
				$presets    = $this->load_presets_for_control( $control_id );

				return array(
					'group'   => self::normalize_group( $group ),
					'presets' => $presets,
				);
			}
		}

		return new WP_Error(
			'group_not_found',
			/* translators: %s: Group ID that was not found */
			sprintf( __( 'Group "%s" not found. Call list-preset-groups to see available groups.', 'fluid-design-system-for-elementor' ), $group_id ),
			array( 'status' => 404 )
		);
	}

	private function register_create_preset_group(): void {
		wp_register_ability(
			'fluid/create-preset-group',
			array(
				'label'               => __( 'Create Preset Group', 'fluid-design-system-for-elementor' ),
				'description'         => __( 'Creates a custom preset group. Names must be unique. Use create-preset to populate it.', 'fluid-design-system-for-elementor' ),
				'category'            => self::CATEGORY,
				'permission_callback' => array( $this, 'can_manage' ),
				'execute_callback'    => array( $this, 'execute_create_preset_group' ),
				'input_schema'        => array(
					'type'                 => 'object',
					'properties'           => array(
						'name'        => array(
							'type'        => 'string',
							'minLength'   => 1,
							'description' => __( 'Display name for the group. Must be unique.', 'fluid-design-system-for-elementor' ),
						),
						'description' => array(
							'type'        => 'string',
							'description' => __( 'Optional description of the group\'s purpose.', 'fluid-design-system-for-elementor' ),
						),
					),
					'required'             => array( 'name' ),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'group' => self::group_schema(),
					),
				),
				'meta'                => self::meta( false, false, false ),
			)
		);
	}

	/**
	 * @param array<string, mixed> $input
	 * @return array<string, mixed>|WP_Error
	 */
	public function execute_create_preset_group( array $input ) {
		/** @var string $name */
		$name = $input['name'];
		/** @var string $description */
		$description = $input['description'] ?? '';

		if ( GroupsData::is_group_name_taken( $name ) ) {
			return new WP_Error(
				'name_taken',
				/* translators: %s: Duplicate group name */
				sprintf( __( 'A group named "%s" already exists. Call list-preset-groups to see current names.', 'fluid-design-system-for-elementor' ), $name ),
				array( 'status' => 409 )
			);
		}

		$data_manager = $this->data_manager();
		$group_id     = $data_manager->create_group( $name, $description );

		if ( $group_id === false ) {
			return new WP_Error(
				'create_failed',
				__( 'Failed to create preset group.', 'fluid-design-system-for-elementor' ),
				array( 'status' => 500 )
			);
		}

		$group = $data_manager->get_group( $group_id );

		return array(
			'group' => array(
				'id'          => $group_id,
				'name'        => $group['name'] ?? $name,
				'description' => $group['description'] ?? $description,
				'type'        => 'custom',
				'control_id'  => ControlRegistry::get_custom_group_control_id( $group_id ),
			),
		);
	}

	private function register_rename_preset_group(): void {
		wp_register_ability(
			'fluid/rename-preset-group',
			array(
				'label'               => __( 'Rename Preset Group', 'fluid-design-system-for-elementor' ),
				'description'         => __( 'Renames a custom group. Built-in groups (Spacing, Typography) cannot be renamed.', 'fluid-design-system-for-elementor' ),
				'category'            => self::CATEGORY,
				'permission_callback' => array( $this, 'can_manage' ),
				'execute_callback'    => array( $this, 'execute_rename_preset_group' ),
				'input_schema'        => array(
					'type'                 => 'object',
					'properties'           => array(
						'group_id' => array(
							'type'        => 'string',
							'description' => __( 'ID of the custom group to rename.', 'fluid-design-system-for-elementor' ),
						),
						'name'     => array(
							'type'        => 'string',
							'minLength'   => 1,
							'description' => __( 'New display name. Must be unique.', 'fluid-design-system-for-elementor' ),
						),
					),
					'required'             => array( 'group_id', 'name' ),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'group' => self::group_schema(),
					),
				),
				'meta'                => self::meta( false, false, true ),
			)
		);
	}

	/**
	 * @param array<string, mixed> $input
	 * @return array<string, mixed>|WP_Error
	 */
	public function execute_rename_preset_group( array $input ) {
		/** @var string $group_id */
		$group_id = $input['group_id'];
		/** @var string $new_name */
		$new_name = $input['name'];

		$data_manager = $this->data_manager();

		if ( ! $data_manager->group_exists( $group_id ) ) {
			return new WP_Error(
				'group_not_found',
				/* translators: %s: Group ID that was not found */
				sprintf( __( 'Group "%s" not found. Call list-preset-groups to see available groups.', 'fluid-design-system-for-elementor' ), $group_id ),
				array( 'status' => 404 )
			);
		}

		if ( GroupsData::is_group_name_taken( $new_name, $group_id ) ) {
			return new WP_Error(
				'name_taken',
				/* translators: %s: Duplicate group name */
				sprintf( __( 'A group named "%s" already exists. Call list-preset-groups to see current names.', 'fluid-design-system-for-elementor' ), $new_name ),
				array( 'status' => 409 )
			);
		}

		$groups = Data::get_custom_groups();

		$groups[ $group_id ]['name'] = sanitize_text_field( $new_name );

		if ( ! $data_manager->save_custom_groups( $groups ) ) {
			return new WP_Error(
				'save_failed',
				__( 'Failed to save group changes.', 'fluid-design-system-for-elementor' ),
				array( 'status' => 500 )
			);
		}

		return array(
			'group' => array(
				'id'          => $group_id,
				'name'        => $groups[ $group_id ]['name'],
				'description' => $groups[ $group_id ]['description'] ?? '',
				'type'        => 'custom',
				'control_id'  => ControlRegistry::get_custom_group_control_id( $group_id ),
			),
		);
	}

	private function register_delete_preset_group(): void {
		wp_register_ability(
			'fluid/delete-preset-group',
			array(
				'label'               => __( 'Delete Preset Group', 'fluid-design-system-for-elementor' ),
				'description'         => __( 'Deletes a custom group and its presets. Built-in groups cannot be deleted.', 'fluid-design-system-for-elementor' ),
				'category'            => self::CATEGORY,
				'permission_callback' => array( $this, 'can_manage' ),
				'execute_callback'    => array( $this, 'execute_delete_preset_group' ),
				'input_schema'        => array(
					'type'                 => 'object',
					'properties'           => array(
						'group_id' => array(
							'type'        => 'string',
							'description' => __( 'ID of the custom group to delete.', 'fluid-design-system-for-elementor' ),
						),
					),
					'required'             => array( 'group_id' ),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'deleted' => array( 'type' => 'boolean' ),
					),
				),
				'meta'                => self::meta( false, true, true ),
			)
		);
	}

	/**
	 * @param array<string, mixed> $input
	 * @return array<string, mixed>|WP_Error
	 */
	public function execute_delete_preset_group( array $input ) {
		/** @var string $group_id */
		$group_id     = $input['group_id'];
		$data_manager = $this->data_manager();

		if ( ! $data_manager->group_exists( $group_id ) ) {
			return new WP_Error(
				'group_not_found',
				/* translators: %s: Group ID that was not found */
				sprintf( __( 'Group "%s" not found. Call list-preset-groups to see available groups.', 'fluid-design-system-for-elementor' ), $group_id ),
				array( 'status' => 404 )
			);
		}

		if ( ! $data_manager->delete_group( $group_id ) ) {
			return new WP_Error(
				'delete_failed',
				__( 'Failed to delete preset group.', 'fluid-design-system-for-elementor' ),
				array( 'status' => 500 )
			);
		}

		return array( 'deleted' => true );
	}

	// =========================================================================
	// Preset Abilities
	// =========================================================================

	private function register_list_presets(): void {
		wp_register_ability(
			'fluid/list-presets',
			array(
				'label'               => __( 'List Presets', 'fluid-design-system-for-elementor' ),
				'description'         => __( 'Lists presets across all groups or filtered by group_id. Returns name, min/max values, units, and CSS variable per preset.', 'fluid-design-system-for-elementor' ),
				'category'            => self::CATEGORY,
				'permission_callback' => array( $this, 'can_read' ),
				'execute_callback'    => array( $this, 'execute_list_presets' ),
				'input_schema'        => array(
					'type'                 => 'object',
					'properties'           => array(
						'group_id' => array(
							'type'        => 'string',
							'description' => __( 'Optional. Filter presets to a specific group by group_id or control_id.', 'fluid-design-system-for-elementor' ),
						),
					),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'groups' => array(
							'type'  => 'array',
							'items' => array(
								'type'       => 'object',
								'properties' => array(
									'group_id'   => array( 'type' => 'string' ),
									'group_name' => array( 'type' => 'string' ),
									'control_id' => array( 'type' => 'string' ),
									'presets'    => array(
										'type'  => 'array',
										'items' => self::preset_schema(),
									),
								),
							),
						),
					),
				),
				'meta'                => self::meta( true, false, true ),
			)
		);
	}

	/**
	 * @param array<string, mixed> $input
	 * @return array<string, mixed>|WP_Error
	 */
	public function execute_list_presets( array $input = array() ) {
		/** @var string|null $filter_group_id */
		$filter_group_id = $input['group_id'] ?? null;
		$all_groups      = GroupsData::get_all_groups();
		$result          = array();

		foreach ( $all_groups as $group ) {
			if ( $filter_group_id !== null && ! self::group_matches_id( $group, $filter_group_id ) ) {
				continue;
			}

			$control_id = self::resolve_control_id_from_group( $group );
			$presets    = $this->load_presets_for_control( $control_id );

			$result[] = array(
				'group_id'   => $group['id'] ?? '',
				'group_name' => $group['name'] ?? '',
				'control_id' => $control_id,
				'presets'    => $presets,
			);
		}

		return array( 'groups' => $result );
	}

	private function register_get_preset(): void {
		wp_register_ability(
			'fluid/get-preset',
			array(
				'label'               => __( 'Get Preset', 'fluid-design-system-for-elementor' ),
				'description'         => __( 'Returns a single preset by ID. Requires preset_id and group_id from list-presets.', 'fluid-design-system-for-elementor' ),
				'category'            => self::CATEGORY,
				'permission_callback' => array( $this, 'can_read' ),
				'execute_callback'    => array( $this, 'execute_get_preset' ),
				'input_schema'        => array(
					'type'                 => 'object',
					'properties'           => array(
						'preset_id' => array(
							'type'        => 'string',
							'description' => __( 'The preset _id (e.g. "fluid-abc123").', 'fluid-design-system-for-elementor' ),
						),
						'group_id'  => array(
							'type'        => 'string',
							'description' => __( 'The group containing this preset (group_id or control_id).', 'fluid-design-system-for-elementor' ),
						),
					),
					'required'             => array( 'preset_id', 'group_id' ),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'preset' => self::preset_schema(),
					),
				),
				'meta'                => self::meta( true, false, true ),
			)
		);
	}

	/**
	 * @param array<string, mixed> $input
	 * @return array<string, mixed>|WP_Error
	 */
	public function execute_get_preset( array $input ) {
		/** @var string $group_id_raw */
		$group_id_raw = $input['group_id'];
		$control_id   = $this->resolve_control_id( $group_id_raw );
		if ( is_wp_error( $control_id ) ) {
			return $control_id;
		}

		$kit = $this->get_active_kit();
		if ( is_wp_error( $kit ) ) {
			return $kit;
		}

		try {
			/** @var string $preset_id */
			$preset_id = $input['preset_id'];
			$item      = KitRepeaterService::get_item( $kit, $control_id, $preset_id );
			$preset    = self::normalize_preset( $item );
			return array( 'preset' => $preset );
		} catch ( \Exception $e ) {
			return new WP_Error( 'preset_not_found', $e->getMessage(), array( 'status' => 404 ) );
		}
	}

	private function register_create_preset(): void {
		wp_register_ability(
			'fluid/create-preset',
			array(
				'label'               => __( 'Create Preset', 'fluid-design-system-for-elementor' ),
				'description'         => __( 'Creates a fluid preset. Provide min/max values and units — the plugin computes the CSS clamp() formula.', 'fluid-design-system-for-elementor' ),
				'category'            => self::CATEGORY,
				'permission_callback' => array( $this, 'can_manage' ),
				'execute_callback'    => array( $this, 'execute_create_preset' ),
				'input_schema'        => array(
					'type'                 => 'object',
					'properties'           => array(
						'title'    => array(
							'type'        => 'string',
							'minLength'   => 1,
							'description' => __( 'Display name for the preset.', 'fluid-design-system-for-elementor' ),
						),
						'min_size' => array(
							'type'        => 'number',
							'description' => __( 'Minimum size value (at the smallest breakpoint).', 'fluid-design-system-for-elementor' ),
						),
						'min_unit' => array(
							'type'        => 'string',
							'enum'        => array( 'px', 'rem', 'em', '%', 'vw', 'vh' ),
							'description' => __( 'Unit for min_size.', 'fluid-design-system-for-elementor' ),
						),
						'max_size' => array(
							'type'        => 'number',
							'description' => __( 'Maximum size value (at the largest breakpoint).', 'fluid-design-system-for-elementor' ),
						),
						'max_unit' => array(
							'type'        => 'string',
							'enum'        => array( 'px', 'rem', 'em', '%', 'vw', 'vh' ),
							'description' => __( 'Unit for max_size.', 'fluid-design-system-for-elementor' ),
						),
						'group_id' => array(
							'type'        => 'string',
							'description' => __( 'Target group (group_id or control_id). Defaults to spacing.', 'fluid-design-system-for-elementor' ),
						),
					),
					'required'             => array( 'title', 'min_size', 'min_unit', 'max_size', 'max_unit' ),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'preset' => self::preset_schema(),
					),
				),
				'meta'                => self::meta( false, false, false ),
			)
		);
	}

	/**
	 * @param array<string, mixed> $input
	 * @return array<string, mixed>|WP_Error
	 */
	public function execute_create_preset( array $input ) {
		/** @var string $group_id_raw */
		$group_id_raw = $input['group_id'] ?? 'fluid_spacing_presets';
		$control_id   = $this->resolve_control_id( $group_id_raw );
		if ( is_wp_error( $control_id ) ) {
			return $control_id;
		}

		$kit = $this->get_active_kit();
		if ( is_wp_error( $kit ) ) {
			return $kit;
		}

		$preset_id = 'fluid-' . wp_generate_uuid4();

		/** @var string $title */
		$title = $input['title'];
		/** @var string $min_unit */
		$min_unit = $input['min_unit'];
		/** @var string $max_unit */
		$max_unit = $input['max_unit'];

		/** @var int|float|string $min_size_raw */
		$min_size_raw = $input['min_size'];
		/** @var int|float|string $max_size_raw */
		$max_size_raw = $input['max_size'];

		$preset_item = array(
			'_id'   => $preset_id,
			'title' => sanitize_text_field( $title ),
			'min'   => array(
				'size' => floatval( $min_size_raw ),
				'unit' => sanitize_text_field( $min_unit ),
			),
			'max'   => array(
				'size' => floatval( $max_size_raw ),
				'unit' => sanitize_text_field( $max_unit ),
			),
		);

		$kit->add_repeater_row( $control_id, $preset_item );

		return array( 'preset' => self::normalize_preset( $preset_item ) );
	}

	private function register_update_preset(): void {
		wp_register_ability(
			'fluid/update-preset',
			array(
				'label'               => __( 'Update Preset', 'fluid-design-system-for-elementor' ),
				'description'         => __( 'Renames a preset or moves it to another group. Fluid values (min/max) can only be set at creation time via this API.', 'fluid-design-system-for-elementor' ),
				'category'            => self::CATEGORY,
				'permission_callback' => array( $this, 'can_manage' ),
				'execute_callback'    => array( $this, 'execute_update_preset' ),
				'input_schema'        => array(
					'type'                 => 'object',
					'properties'           => array(
						'preset_id'    => array(
							'type'        => 'string',
							'description' => __( 'The preset _id to update.', 'fluid-design-system-for-elementor' ),
						),
						'group_id'     => array(
							'type'        => 'string',
							'description' => __( 'Current group of the preset (group_id or control_id).', 'fluid-design-system-for-elementor' ),
						),
						'title'        => array(
							'type'        => 'string',
							'minLength'   => 1,
							'description' => __( 'New display name for the preset.', 'fluid-design-system-for-elementor' ),
						),
						'new_group_id' => array(
							'type'        => 'string',
							'description' => __( 'Move preset to this group (group_id or control_id).', 'fluid-design-system-for-elementor' ),
						),
					),
					'required'             => array( 'preset_id', 'group_id' ),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'preset' => self::preset_schema(),
					),
				),
				'meta'                => self::meta( false, false, true ),
			)
		);
	}

	/**
	 * @param array<string, mixed> $input
	 * @return array<string, mixed>|WP_Error
	 */
	public function execute_update_preset( array $input ) {
		/** @var string $group_id_raw */
		$group_id_raw = $input['group_id'];
		$control_id   = $this->resolve_control_id( $group_id_raw );
		if ( is_wp_error( $control_id ) ) {
			return $control_id;
		}

		$kit = $this->get_active_kit();
		if ( is_wp_error( $kit ) ) {
			return $kit;
		}

		/** @var string $preset_id */
		$preset_id = $input['preset_id'];
		/** @var string|null $new_title */
		$new_title = $input['title'] ?? null;
		/** @var string|null $new_group_id */
		$new_group_id = $input['new_group_id'] ?? null;

		try {
			// Rename if title provided
			if ( $new_title !== null ) {
				KitRepeaterService::update_item(
					$kit,
					$control_id,
					$preset_id,
					array( 'title' => sanitize_text_field( $new_title ) )
				);
			}

			// Move if new group provided
			if ( $new_group_id !== null ) {
				$new_control_id = $this->resolve_control_id( $new_group_id );
				if ( is_wp_error( $new_control_id ) ) {
					return $new_control_id;
				}

				if ( $new_control_id !== $control_id ) {
					KitRepeaterService::move_item( $kit, $control_id, $new_control_id, $preset_id );
					$control_id = $new_control_id;
				}
			}

			$item = KitRepeaterService::get_item( $kit, $control_id, $preset_id );
			return array( 'preset' => self::normalize_preset( $item ) );
		} catch ( \Exception $e ) {
			return new WP_Error( 'update_failed', $e->getMessage(), array( 'status' => 400 ) );
		}
	}

	private function register_delete_preset(): void {
		wp_register_ability(
			'fluid/delete-preset',
			array(
				'label'               => __( 'Delete Preset', 'fluid-design-system-for-elementor' ),
				'description'         => __( 'Removes a preset by ID. Requires preset_id and group_id from list-presets. Elements using it will fall back to non-fluid values.', 'fluid-design-system-for-elementor' ),
				'category'            => self::CATEGORY,
				'permission_callback' => array( $this, 'can_manage' ),
				'execute_callback'    => array( $this, 'execute_delete_preset' ),
				'input_schema'        => array(
					'type'                 => 'object',
					'properties'           => array(
						'preset_id' => array(
							'type'        => 'string',
							'description' => __( 'The preset _id to delete.', 'fluid-design-system-for-elementor' ),
						),
						'group_id'  => array(
							'type'        => 'string',
							'description' => __( 'The group containing this preset (group_id or control_id).', 'fluid-design-system-for-elementor' ),
						),
					),
					'required'             => array( 'preset_id', 'group_id' ),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'deleted' => array( 'type' => 'boolean' ),
					),
				),
				'meta'                => self::meta( false, true, true ),
			)
		);
	}

	/**
	 * @param array<string, mixed> $input
	 * @return array<string, mixed>|WP_Error
	 */
	public function execute_delete_preset( array $input ) {
		/** @var string $group_id_raw */
		$group_id_raw = $input['group_id'];
		$control_id   = $this->resolve_control_id( $group_id_raw );
		if ( is_wp_error( $control_id ) ) {
			return $control_id;
		}

		$kit = $this->get_active_kit();
		if ( is_wp_error( $kit ) ) {
			return $kit;
		}

		try {
			/** @var string $preset_id */
			$preset_id = $input['preset_id'];
			KitRepeaterService::delete_item( $kit, $control_id, $preset_id );
			return array( 'deleted' => true );
		} catch ( \Exception $e ) {
			return new WP_Error( 'delete_failed', $e->getMessage(), array( 'status' => 400 ) );
		}
	}

	private function register_move_preset_to_group(): void {
		wp_register_ability(
			'fluid/move-preset-to-group',
			array(
				'label'               => __( 'Move Preset to Group', 'fluid-design-system-for-elementor' ),
				'description'         => __( 'Moves a preset between groups atomically. Values are preserved. Use for bulk reorganization; for rename+move use update-preset instead.', 'fluid-design-system-for-elementor' ),
				'category'            => self::CATEGORY,
				'permission_callback' => array( $this, 'can_manage' ),
				'execute_callback'    => array( $this, 'execute_move_preset_to_group' ),
				'input_schema'        => array(
					'type'                 => 'object',
					'properties'           => array(
						'preset_id'     => array(
							'type'        => 'string',
							'description' => __( 'The preset _id to move.', 'fluid-design-system-for-elementor' ),
						),
						'from_group_id' => array(
							'type'        => 'string',
							'description' => __( 'Current group (group_id or control_id).', 'fluid-design-system-for-elementor' ),
						),
						'to_group_id'   => array(
							'type'        => 'string',
							'description' => __( 'Target group (group_id or control_id).', 'fluid-design-system-for-elementor' ),
						),
					),
					'required'             => array( 'preset_id', 'from_group_id', 'to_group_id' ),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'moved' => array( 'type' => 'boolean' ),
					),
				),
				'meta'                => self::meta( false, false, true ),
			)
		);
	}

	/**
	 * @param array<string, mixed> $input
	 * @return array<string, mixed>|WP_Error
	 */
	public function execute_move_preset_to_group( array $input ) {
		/** @var string $from_group_raw */
		$from_group_raw  = $input['from_group_id'];
		$from_control_id = $this->resolve_control_id( $from_group_raw );
		if ( is_wp_error( $from_control_id ) ) {
			return $from_control_id;
		}

		/** @var string $to_group_raw */
		$to_group_raw  = $input['to_group_id'];
		$to_control_id = $this->resolve_control_id( $to_group_raw );
		if ( is_wp_error( $to_control_id ) ) {
			return $to_control_id;
		}

		if ( $from_control_id === $to_control_id ) {
			return new WP_Error(
				'same_group',
				/* translators: %s: The group identifier */
				sprintf( __( 'Source and target are the same group ("%s"). No move needed.', 'fluid-design-system-for-elementor' ), $from_control_id ),
				array( 'status' => 400 )
			);
		}

		$kit = $this->get_active_kit();
		if ( is_wp_error( $kit ) ) {
			return $kit;
		}

		try {
			/** @var string $preset_id */
			$preset_id = $input['preset_id'];
			KitRepeaterService::move_item( $kit, $from_control_id, $to_control_id, $preset_id );
			return array( 'moved' => true );
		} catch ( \Exception $e ) {
			return new WP_Error( 'move_failed', $e->getMessage(), array( 'status' => 400 ) );
		}
	}

	// =========================================================================
	// Permission Callbacks
	// =========================================================================

	/** Read access: matches existing AJAX handler pattern. */
	public function can_read(): bool {
		return current_user_can( 'edit_posts' );
	}

	/** Write/delete access: site administrators only. */
	public function can_manage(): bool {
		return current_user_can( 'manage_options' );
	}

	// =========================================================================
	// Helpers
	// =========================================================================

	private function data_manager(): Data {
		/** @var \Arts\FluidDesignSystem\Base\ManagersContainer $managers */
		$managers = $this->managers;

		return $managers->data;
	}

	/**
	 * Resolves a group_id or control_id to a Kit control_id.
	 *
	 * @return string|WP_Error
	 */
	private function resolve_control_id( string $group_id ) {
		// Already a valid control_id?
		if ( ControlRegistry::is_valid_control_id( $group_id ) ) {
			return $group_id;
		}

		// Try as a group_id via ControlRegistry
		$control_id = ControlRegistry::get_kit_control_id( $group_id );
		if ( $control_id !== false ) {
			return $control_id;
		}

		// Try generating from group_id
		$generated = ControlRegistry::generate_control_id( $group_id );
		if ( ControlRegistry::is_valid_control_id( $generated ) ) {
			return $generated;
		}

		return new WP_Error(
			'invalid_group',
			/* translators: %s: Invalid group identifier */
			sprintf( __( 'Could not resolve "%s" to a group. Call list-preset-groups to see valid group IDs.', 'fluid-design-system-for-elementor' ), $group_id ),
			array( 'status' => 400 )
		);
	}

	/** @return \Elementor\Core\Kits\Documents\Kit|WP_Error */
	private function get_active_kit() {
		if ( ! Utilities::is_elementor_plugin_active() ) {
			return new WP_Error(
				'elementor_inactive',
				__( 'Elementor is not active.', 'fluid-design-system-for-elementor' ),
				array( 'status' => 424 )
			);
		}

		$kit = \Elementor\Plugin::$instance->kits_manager->get_active_kit();
		if ( ! $kit instanceof \Elementor\Core\Kits\Documents\Kit ) {
			return new WP_Error(
				'invalid_kit',
				__( 'Could not load active Elementor Kit.', 'fluid-design-system-for-elementor' ),
				array( 'status' => 500 )
			);
		}

		return $kit;
	}

	/**
	 * Loads raw presets from Kit for a control_id, normalizing each.
	 *
	 * @return array<int, array<string, mixed>>
	 */
	private function load_presets_for_control( string $control_id ): array {
		$raw_presets = Utilities::get_kit_settings( $control_id, array(), false );

		if ( ! is_array( $raw_presets ) ) {
			return array();
		}

		$presets = array();
		foreach ( $raw_presets as $item ) {
			if ( is_array( $item ) && ! empty( $item['_id'] ) ) {
				/** @var array<string, mixed> $item */
				$presets[] = self::normalize_preset( $item );
			}
		}

		return $presets;
	}

	/**
	 * Normalizes raw Kit preset data to a clean output structure.
	 *
	 * @param array<string, mixed> $item Raw preset from Kit.
	 * @return array<string, mixed>
	 */
	private static function normalize_preset( array $item ): array {
		/** @var string $id */
		$id = $item['_id'] ?? '';

		/** @var array<string, mixed> $min */
		$min = is_array( $item['min'] ?? null ) ? $item['min'] : array();
		/** @var array<string, mixed> $max */
		$max = is_array( $item['max'] ?? null ) ? $item['max'] : array();

		/** @var int|float|string $min_size */
		$min_size = $min['size'] ?? 0;
		/** @var int|float|string $max_size */
		$max_size = $max['size'] ?? 0;

		$preset = array(
			'id'       => $id,
			'title'    => $item['title'] ?? '',
			'min_size' => floatval( $min_size ),
			'min_unit' => isset( $min['unit'] ) && is_string( $min['unit'] ) ? $min['unit'] : 'px',
			'max_size' => floatval( $max_size ),
			'max_unit' => isset( $max['unit'] ) && is_string( $max['unit'] ) ? $max['unit'] : 'px',
			'css_var'  => CSSVariables::get_css_var_preset( $id ),
		);

		if ( ! empty( $item['override_screen_width_enabled'] ) ) {
			/** @var int|string $min_screen */
			$min_screen = $item['overriden_min_screen_width'] ?? 0;
			/** @var int|string $max_screen */
			$max_screen                        = $item['overriden_max_screen_width'] ?? 0;
			$preset['custom_min_screen_width'] = isset( $item['overriden_min_screen_width'] ) ? intval( $min_screen ) : null;
			$preset['custom_max_screen_width'] = isset( $item['overriden_max_screen_width'] ) ? intval( $max_screen ) : null;
		}

		return $preset;
	}

	/**
	 * @param array<string, mixed> $group Raw group from GroupsData.
	 * @return array<string, mixed>
	 */
	private static function normalize_group( array $group ): array {
		$id   = $group['id'] ?? '';
		$type = $group['type'] ?? 'custom';

		return array(
			'id'          => $id,
			'name'        => $group['name'] ?? '',
			'description' => $group['description'] ?? '',
			'type'        => $type,
			'control_id'  => self::resolve_control_id_from_group( $group ),
		);
	}

	/**
	 * @param array<string, mixed> $group
	 */
	private static function group_matches_id( array $group, string $id ): bool {
		/** @var string $group_id */
		$group_id   = $group['id'] ?? '';
		$control_id = self::resolve_control_id_from_group( $group );

		return $group_id === $id || $control_id === $id;
	}

	/**
	 * Derives the Kit control_id from a group's data.
	 *
	 * @param array<string, mixed> $group
	 */
	private static function resolve_control_id_from_group( array $group ): string {
		/** @var string $group_id */
		$group_id = $group['id'] ?? '';
		/** @var string $type */
		$type = $group['type'] ?? 'custom';

		if ( $type === 'builtin' ) {
			return $group_id;
		}

		return ControlRegistry::get_custom_group_control_id( $group_id );
	}

	/**
	 * Builds the MCP meta array for an ability registration.
	 *
	 * @return array<string, array<string, mixed>>
	 */
	private static function meta( bool $readonly, bool $destructive, bool $idempotent ): array {
		return array(
			'mcp'         => array(
				'public' => true,
				'type'   => 'tool',
			),
			'annotations' => array(
				'readonly'      => $readonly,
				'destructive'   => $destructive,
				'idempotent'    => $idempotent,
				'openWorldHint' => false,
			),
		);
	}

	/** @return array<string, mixed> */
	private static function group_schema(): array {
		return array(
			'type'       => 'object',
			'properties' => array(
				'id'          => array( 'type' => 'string' ),
				'name'        => array( 'type' => 'string' ),
				'description' => array( 'type' => 'string' ),
				'type'        => array(
					'type' => 'string',
					'enum' => array( 'builtin', 'custom', 'filter' ),
				),
				'control_id'  => array( 'type' => 'string' ),
			),
		);
	}

	/** @return array<string, mixed> */
	private static function preset_schema(): array {
		return array(
			'type'       => 'object',
			'properties' => array(
				'id'       => array( 'type' => 'string' ),
				'title'    => array( 'type' => 'string' ),
				'min_size' => array( 'type' => 'number' ),
				'min_unit' => array( 'type' => 'string' ),
				'max_size' => array( 'type' => 'number' ),
				'max_unit' => array( 'type' => 'string' ),
				'css_var'  => array( 'type' => 'string' ),
			),
		);
	}
}
