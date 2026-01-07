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
 * Direct Kit meta manipulation for preset updates.
 */
class KitRepeaterService {

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
		$meta_key          = \Elementor\Core\Settings\Page\Manager::META_KEY;
		$document_settings = $kit->get_meta( $meta_key );

		if ( ! is_array( $document_settings ) ) {
			throw new \Exception( esc_html__( 'Invalid Kit settings.', 'fluid-design-system-for-elementor' ) );
		}

		/** @var array<string, mixed> $document_settings */

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

		$page_settings_manager = \Elementor\Core\Settings\Manager::get_settings_managers( 'page' );

		if ( $page_settings_manager instanceof \Elementor\Core\Settings\Base\Manager ) {
			/** @var array<string, mixed> $document_settings */
			$kit_id = $kit->get_id();
			if ( is_int( $kit_id ) ) {
				$page_settings_manager->save_settings( $document_settings, $kit_id );
			}
		}

		self::process_autosave( $kit, 'update_item', $control_id, $item_id, $updated_fields );

		return true;
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
