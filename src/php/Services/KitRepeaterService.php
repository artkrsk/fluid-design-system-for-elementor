<?php
/**
 * Kit repeater item CRUD with autosave synchronization.
 *
 * @package Arts\FluidDesignSystem
 */

namespace Arts\FluidDesignSystem\Services;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Direct Kit meta manipulation for preset operations.
 */
class KitRepeaterService {

	/**
	 * Finds a repeater item by _id and returns its data.
	 *
	 * @param \Elementor\Core\Kits\Documents\Kit $kit
	 * @param string                              $control_id
	 * @param string                              $item_id    Item _id to find.
	 * @return array<string, mixed> The item data.
	 * @throws \Exception If Kit settings invalid, group not found, or preset not found.
	 */
	public static function get_item( $kit, $control_id, $item_id ): array {
		$document_settings = self::get_document_settings( $kit );

		if ( ! isset( $document_settings[ $control_id ] ) || ! is_array( $document_settings[ $control_id ] ) ) {
			throw new \Exception( esc_html__( 'Preset group not found.', 'fluid-design-system-for-elementor' ) );
		}

		/** @var array<int, array<string, mixed>> $presets */
		$presets = $document_settings[ $control_id ];

		foreach ( $presets as $existing_item ) {
			if ( ! is_array( $existing_item ) ) {
				continue;
			}

			if ( isset( $existing_item['_id'] ) && $existing_item['_id'] === $item_id ) {
				return $existing_item;
			}
		}

		throw new \Exception( esc_html__( 'Preset not found.', 'fluid-design-system-for-elementor' ) );
	}

	/**
	 * Updates a repeater item by _id, preserving existing fields via array_merge.
	 *
	 * @param \Elementor\Core\Kits\Documents\Kit $kit
	 * @param string                              $control_id
	 * @param string                              $item_id       Item _id to update.
	 * @param array<string, mixed>                $updated_fields Fields to merge.
	 * @throws \Exception If preset not found.
	 */
	public static function update_item( $kit, $control_id, $item_id, $updated_fields ): bool {
		$document_settings = self::get_document_settings( $kit );

		if ( ! isset( $document_settings[ $control_id ] ) || ! is_array( $document_settings[ $control_id ] ) ) {
			throw new \Exception( esc_html__( 'Preset group not found.', 'fluid-design-system-for-elementor' ) );
		}

		/** @var array<int, array<string, mixed>> $presets */
		$presets = $document_settings[ $control_id ];

		$found = false;
		foreach ( $presets as $index => $existing_item ) {
			if ( ! is_array( $existing_item ) ) {
				continue;
			}

			if ( isset( $existing_item['_id'] ) && $existing_item['_id'] === $item_id ) {
				// array_merge preserves custom_screen_width and other metadata
				$document_settings[ $control_id ][ $index ] = array_merge( $existing_item, $updated_fields );
				$found                                      = true;
				break;
			}
		}

		if ( ! $found ) {
			throw new \Exception( esc_html__( 'Preset not found.', 'fluid-design-system-for-elementor' ) );
		}

		self::save_document_settings( $kit, $document_settings );
		self::process_autosave( $kit, 'update_item', $control_id, $item_id, $updated_fields );

		return true;
	}

	/**
	 * Removes a repeater item by _id.
	 *
	 * @param \Elementor\Core\Kits\Documents\Kit $kit
	 * @param string                              $control_id
	 * @param string                              $item_id    Item _id to remove.
	 * @throws \Exception If preset not found.
	 */
	public static function delete_item( $kit, $control_id, $item_id ): bool {
		$document_settings = self::get_document_settings( $kit );

		if ( ! isset( $document_settings[ $control_id ] ) || ! is_array( $document_settings[ $control_id ] ) ) {
			throw new \Exception( esc_html__( 'Preset group not found.', 'fluid-design-system-for-elementor' ) );
		}

		/** @var array<int, array<string, mixed>> $presets */
		$presets     = $document_settings[ $control_id ];
		$new_presets = array();
		$found       = false;

		foreach ( $presets as $existing_item ) {
			if ( ! is_array( $existing_item ) ) {
				continue;
			}

			if ( isset( $existing_item['_id'] ) && $existing_item['_id'] === $item_id ) {
				$found = true;
				continue;
			}

			$new_presets[] = $existing_item;
		}

		if ( ! $found ) {
			throw new \Exception( esc_html__( 'Preset not found.', 'fluid-design-system-for-elementor' ) );
		}

		$document_settings[ $control_id ] = $new_presets;

		self::save_document_settings( $kit, $document_settings );
		self::process_autosave( $kit, 'delete_item', $control_id, $item_id );

		return true;
	}

	/**
	 * Atomically moves a repeater item from one control to another in a single save.
	 *
	 * @param \Elementor\Core\Kits\Documents\Kit $kit
	 * @param string                              $from_control_id Source group control ID.
	 * @param string                              $to_control_id   Target group control ID.
	 * @param string                              $item_id         Item _id to move.
	 * @throws \Exception If preset not found in source group.
	 */
	public static function move_item( $kit, $from_control_id, $to_control_id, $item_id ): bool {
		$document_settings = self::get_document_settings( $kit );

		if ( ! isset( $document_settings[ $from_control_id ] ) || ! is_array( $document_settings[ $from_control_id ] ) ) {
			throw new \Exception( esc_html__( 'Source preset group not found.', 'fluid-design-system-for-elementor' ) );
		}

		// Find and remove from source
		/** @var array<int, array<string, mixed>> $source_presets */
		$source_presets = $document_settings[ $from_control_id ];
		$moved_item     = null;
		$new_source     = array();

		foreach ( $source_presets as $existing_item ) {
			if ( ! is_array( $existing_item ) ) {
				continue;
			}

			if ( isset( $existing_item['_id'] ) && $existing_item['_id'] === $item_id ) {
				$moved_item = $existing_item;
				continue;
			}

			$new_source[] = $existing_item;
		}

		if ( $moved_item === null ) {
			throw new \Exception( esc_html__( 'Preset not found in source group.', 'fluid-design-system-for-elementor' ) );
		}

		$document_settings[ $from_control_id ] = $new_source;

		// Add to target (initialize array if control doesn't exist yet)
		if ( ! isset( $document_settings[ $to_control_id ] ) || ! is_array( $document_settings[ $to_control_id ] ) ) {
			$document_settings[ $to_control_id ] = array();
		}

		$document_settings[ $to_control_id ][] = $moved_item;

		self::save_document_settings( $kit, $document_settings );
		self::process_autosave( $kit, 'move_item', $from_control_id, $to_control_id, $item_id );

		return true;
	}

	/**
	 * @param \Elementor\Core\Kits\Documents\Kit $kit
	 * @return array<string, mixed>
	 * @throws \Exception If Kit settings are invalid.
	 */
	private static function get_document_settings( $kit ): array {
		$meta_key          = \Elementor\Core\Settings\Page\Manager::META_KEY;
		$document_settings = $kit->get_meta( $meta_key );

		if ( ! is_array( $document_settings ) ) {
			throw new \Exception( esc_html__( 'Invalid Kit settings.', 'fluid-design-system-for-elementor' ) );
		}

		/** @var array<string, mixed> $document_settings */
		return $document_settings;
	}

	/**
	 * @param \Elementor\Core\Kits\Documents\Kit $kit
	 * @param array<string, mixed>               $document_settings
	 */
	private static function save_document_settings( $kit, array $document_settings ): void {
		$page_settings_manager = \Elementor\Core\Settings\Manager::get_settings_managers( 'page' );

		if ( $page_settings_manager instanceof \Elementor\Core\Settings\Base\Manager ) {
			$kit_id = $kit->get_id();
			if ( is_int( $kit_id ) ) {
				$page_settings_manager->save_settings( $document_settings, $kit_id );
			}
		}
	}

	/**
	 * Recursively applies operation to autosave document.
	 *
	 * @param \Elementor\Core\Kits\Documents\Kit $kit
	 * @param string                              $method
	 * @param mixed                               ...$args
	 */
	private static function process_autosave( $kit, $method, ...$args ): void {
		$autosave = $kit->get_autosave();
		if ( $autosave instanceof \Elementor\Core\Kits\Documents\Kit ) {
			self::$method( $autosave, ...$args );
		}
	}
}
