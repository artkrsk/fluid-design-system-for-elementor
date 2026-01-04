<?php
/**
 * Kit Repeater Service
 *
 * @package Arts\FluidDesignSystem
 * @since 2.1.0
 */

namespace Arts\FluidDesignSystem\Services;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Service for Kit repeater item operations
 *
 * Handles CRUD operations on Elementor Kit repeater controls
 * with autosave support and proper error handling.
 *
 * @since 2.1.0
 */
class KitRepeaterService {

	/**
	 * Updates a repeater item in Kit by ID.
	 *
	 * Preserves existing fields not included in $updated_fields via array_merge.
	 * Handles autosaves recursively to maintain consistency.
	 *
	 * @since 2.1.0
	 * @access public
	 * @static
	 *
	 * @param \Elementor\Core\Kits\Documents\Kit $kit           Kit document instance.
	 * @param string                              $control_id    Repeater control ID.
	 * @param string                              $item_id       Item _id to update.
	 * @param array<string, mixed>                $updated_fields Fields to update.
	 * @return bool Success status.
	 * @throws \Exception If preset not found or update fails.
	 */
	public static function update_item( $kit, $control_id, $item_id, $updated_fields ): bool {
		// Get current kit settings
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

		// Find and update the item (preserving other fields)
		$found = false;
		foreach ( $presets as $index => $existing_item ) {
			if ( ! is_array( $existing_item ) ) {
				continue;
			}

			if ( isset( $existing_item['_id'] ) && $existing_item['_id'] === $item_id ) {
				// Use array_merge to preserve fields not in $updated_fields
				// This maintains custom_screen_width and other metadata
				$document_settings[ $control_id ][ $index ] = array_merge( $existing_item, $updated_fields );
				$found                                      = true;
				break;
			}
		}

		if ( ! $found ) {
			throw new \Exception( esc_html__( 'Preset not found.', 'fluid-design-system-for-elementor' ) );
		}

		// Save settings using Page Settings Manager
		$page_settings_manager = \Elementor\Core\Settings\Manager::get_settings_managers( 'page' );

		if ( $page_settings_manager instanceof \Elementor\Core\Settings\Base\Manager ) {
			/** @var array<string, mixed> $document_settings */
			$kit_id = $kit->get_id();
			if ( is_int( $kit_id ) ) {
				$page_settings_manager->save_settings( $document_settings, $kit_id );
			}
		}

		// Handle autosave recursively
		self::process_autosave( $kit, 'update_item', $control_id, $item_id, $updated_fields );

		return true;
	}

	/**
	 * Handles autosave recursively for Kit operations.
	 *
	 * Ensures autosave stays in sync with main Kit document.
	 *
	 * @since 2.1.0
	 * @access private
	 * @static
	 *
	 * @param \Elementor\Core\Kits\Documents\Kit $kit    Kit document instance.
	 * @param string                              $method Method name to call recursively.
	 * @param mixed                               ...$args Arguments to pass to method.
	 * @return void
	 */
	private static function process_autosave( $kit, $method, ...$args ) {
		$autosave = $kit->get_autosave();
		if ( $autosave instanceof \Elementor\Core\Kits\Documents\Kit ) {
			self::$method( $autosave, ...$args );
		}
	}
}
