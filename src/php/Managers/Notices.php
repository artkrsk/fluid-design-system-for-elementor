<?php
/**
 * Notices manager for Fluid Design System.
 *
 * @package Arts\FluidDesignSystem
 * @since 1.0.0
 */

namespace Arts\FluidDesignSystem\Managers;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

use Arts\FluidDesignSystem\Base\Manager as BaseManager;

/**
 * Notices Class
 *
 * Manages admin notices and user feedback messages
 * across the Fluid Design System plugin.
 *
 * @since 1.0.0
 */
class Notices extends BaseManager {

	/**
	 * Current request notices.
	 *
	 * @since 1.0.0
	 * @access private
	 * @var array<int, array<string, mixed>>
	 */
	private $notices = array();

	/**
	 * WordPress transient key for persistent notices.
	 *
	 * @since 1.0.0
	 * @access private
	 * @var string
	 */
	private $transient_key = 'arts_fluid_ds_notices';

	/**
	 * Add a notice for the current request.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @param string $message    Notice message.
	 * @param string $type       Notice type (success, error, warning, info).
	 * @param bool   $dismissible Whether the notice is dismissible.
	 * @return void
	 */
	public function add_notice( string $message, string $type = 'info', bool $dismissible = true ): void {
		$this->notices[] = array(
			'message'     => $message,
			'type'        => $this->sanitize_notice_type( $type ),
			'dismissible' => (bool) $dismissible,
		);
	}

	/**
	 * Add a persistent notice that survives redirects.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @param string $message    Notice message.
	 * @param string $type       Notice type (success, error, warning, info).
	 * @param string $context    Context for the notice (admin, frontend, ajax).
	 * @param bool   $dismissible Whether the notice is dismissible.
	 * @return void
	 */
	public function add_persistent_notice( string $message, string $type = 'info', string $context = 'admin', bool $dismissible = true ): void {
		$persistent_notices = get_transient( $this->transient_key );
		if ( ! is_array( $persistent_notices ) ) {
			$persistent_notices = array();
		}

		if ( ! isset( $persistent_notices[ $context ] ) || ! is_array( $persistent_notices[ $context ] ) ) {
			$persistent_notices[ $context ] = array();
		}

		$persistent_notices[ $context ][] = array(
			'message'     => $message,
			'type'        => $this->sanitize_notice_type( $type ),
			'dismissible' => (bool) $dismissible,
			'timestamp'   => time(),
		);

		// Store for 5 minutes (should be enough for most redirect scenarios)
		set_transient( $this->transient_key, $persistent_notices, 5 * MINUTE_IN_SECONDS );
	}

	/**
	 * Display notices for a specific context.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @param string $context Context to display notices for (admin, frontend).
	 * @return void
	 */
	public function display_notices( string $context = 'admin' ): void {
		// Display current request notices
		foreach ( $this->notices as $notice ) {
			$this->render_notice( $notice );
		}

		// Display and clear persistent notices
		$this->display_and_clear_persistent_notices( $context );
	}

	/**
	 * Get notices as array (useful for AJAX responses).
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @param string $context Context to get notices for.
	 * @return list<array<string, mixed>> Array of notice data.
	 */
	public function get_notices_for_ajax( string $context = 'admin' ): array {
		/** @var list<array<string, mixed>> $ajax_notices */
		$ajax_notices = array();

		// Add current request notices
		foreach ( $this->notices as $notice ) {
			/** @var array<string, mixed> $typed_notice */
			$typed_notice   = $notice;
			$ajax_notices[] = $typed_notice;
		}

		// Add persistent notices
		$persistent_notices = get_transient( $this->transient_key );
		if ( is_array( $persistent_notices ) && isset( $persistent_notices[ $context ] ) && is_array( $persistent_notices[ $context ] ) ) {
			foreach ( $persistent_notices[ $context ] as $notice ) {
				if ( is_array( $notice ) ) {
					/** @var array<string, mixed> $typed_notice */
					$typed_notice   = $notice;
					$ajax_notices[] = $typed_notice;
				}
			}
		}

		// Clear persistent notices after getting them
		$this->clear_persistent_notices( $context );

		/** @var list<array<string, mixed>> $result */
		$result = $ajax_notices;
		return $result;
	}

	/**
	 * Check if there are any notices.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @param string|null $type    Optional. Check for specific notice type.
	 * @param string $context Context to check for persistent notices.
	 * @return bool True if notices exist, false otherwise.
	 */
	public function has_notices( ?string $type = null, string $context = 'admin' ): bool {
		// Check current request notices
		if ( ! empty( $this->notices ) ) {
			if ( $type === null ) {
				return true;
			}
			foreach ( $this->notices as $notice ) {
				if ( $notice['type'] === $type ) {
					return true;
				}
			}
		}

		// Check persistent notices
		$persistent_notices = get_transient( $this->transient_key );
		if ( is_array( $persistent_notices ) && isset( $persistent_notices[ $context ] ) && is_array( $persistent_notices[ $context ] ) ) {
			if ( $type === null ) {
				return ! empty( $persistent_notices[ $context ] );
			}
			foreach ( $persistent_notices[ $context ] as $notice ) {
				if ( is_array( $notice ) && isset( $notice['type'] ) && $notice['type'] === $type ) {
					return true;
				}
			}
		}

		return false;
	}

	/**
	 * Clear all notices for a context.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @param string $context Context to clear notices for.
	 * @return void
	 */
	public function clear_notices( string $context = 'admin' ): void {
		// Clear current request notices
		$this->notices = array();

		// Clear persistent notices
		$this->clear_persistent_notices( $context );
	}

	/**
	 * Display and clear persistent notices for a context.
	 *
	 * @since 1.0.0
	 * @access private
	 *
	 * @param string $context Context to display notices for.
	 * @return void
	 */
	private function display_and_clear_persistent_notices( string $context ): void {
		$persistent_notices = get_transient( $this->transient_key );
		if ( ! is_array( $persistent_notices ) || ! isset( $persistent_notices[ $context ] ) || ! is_array( $persistent_notices[ $context ] ) ) {
			return;
		}

		foreach ( $persistent_notices[ $context ] as $notice ) {
			if ( is_array( $notice ) ) {
				/** @var array<string, mixed> $typed_notice */
				$typed_notice = $notice;
				$this->render_notice( $typed_notice );
			}
		}

		// Clear the displayed notices
		$this->clear_persistent_notices( $context );
	}

	/**
	 * Clear persistent notices for a specific context.
	 *
	 * @since 1.0.0
	 * @access private
	 *
	 * @param string $context Context to clear notices for.
	 * @return void
	 */
	private function clear_persistent_notices( string $context ): void {
		$persistent_notices = get_transient( $this->transient_key );
		if ( ! is_array( $persistent_notices ) ) {
			return;
		}

		unset( $persistent_notices[ $context ] );

		if ( empty( $persistent_notices ) ) {
			delete_transient( $this->transient_key );
		} else {
			set_transient( $this->transient_key, $persistent_notices, 5 * MINUTE_IN_SECONDS );
		}
	}

	/**
	 * Render a single notice.
	 *
	 * @since 1.0.0
	 * @access private
	 *
	 * @param array<string, mixed> $notice Notice data.
	 * @return void
	 */
	private function render_notice( array $notice ): void {
		$type        = isset( $notice['type'] ) && is_string( $notice['type'] ) ? $notice['type'] : 'info';
		$message     = isset( $notice['message'] ) && is_string( $notice['message'] ) ? $notice['message'] : '';
		$dismissible = ! empty( $notice['dismissible'] );

		$dismissible_class = $dismissible ? ' is-dismissible' : '';

		printf(
			'<div class="notice notice-%s%s"><p>%s</p></div>',
			esc_attr( $type ),
			esc_attr( $dismissible_class ),
			esc_html( $message )
		);
	}

	/**
	 * Sanitize notice type to ensure it's valid.
	 *
	 * @since 1.0.0
	 * @access private
	 *
	 * @param string $type Notice type to sanitize.
	 * @return string Sanitized notice type.
	 */
	private function sanitize_notice_type( string $type ): string {
		$valid_types = array( 'success', 'error', 'warning', 'info' );
		return in_array( $type, $valid_types, true ) ? $type : 'info';
	}
}
