<?php
/**
 * Admin notices with transient-based persistence for redirects.
 *
 * @package Arts\FluidDesignSystem
 */

namespace Arts\FluidDesignSystem\Managers;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use Arts\FluidDesignSystem\Base\Manager as BaseManager;

/**
 * Request and persistent notices for admin feedback.
 */
class Notices extends BaseManager {

	/** @var array<int, array<string, mixed>> */
	private $notices = array();

	/** @var string */
	private $transient_key = 'arts_fluid_ds_notices';

	public function add_notice( string $message, string $type = 'info', bool $dismissible = true ): void {
		$this->notices[] = array(
			'message'     => $message,
			'type'        => $this->sanitize_notice_type( $type ),
			'dismissible' => (bool) $dismissible,
		);
	}

	/** Persistent notices survive redirects via transient (5 min TTL). */
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

		set_transient( $this->transient_key, $persistent_notices, 5 * MINUTE_IN_SECONDS );
	}

	public function display_notices( string $context = 'admin' ): void {
		foreach ( $this->notices as $notice ) {
			$this->render_notice( $notice );
		}
		$this->display_and_clear_persistent_notices( $context );
	}

	/**
	 * Combines request and persistent notices, clears persistent after retrieval.
	 *
	 * @return list<array<string, mixed>>
	 */
	public function get_notices_for_ajax( string $context = 'admin' ): array {
		/** @var list<array<string, mixed>> $ajax_notices */
		$ajax_notices = array();

		foreach ( $this->notices as $notice ) {
			/** @var array<string, mixed> $typed_notice */
			$typed_notice   = $notice;
			$ajax_notices[] = $typed_notice;
		}

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

		$this->clear_persistent_notices( $context );

		/** @var list<array<string, mixed>> $result */
		$result = $ajax_notices;
		return $result;
	}

	public function has_notices( ?string $type = null, string $context = 'admin' ): bool {
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

	public function clear_notices( string $context = 'admin' ): void {
		$this->notices = array();
		$this->clear_persistent_notices( $context );
	}

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

		$this->clear_persistent_notices( $context );
	}

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

	/** @param array<string, mixed> $notice */
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

	/** Falls back to 'info' for invalid types. */
	private function sanitize_notice_type( string $type ): string {
		$valid_types = array( 'success', 'error', 'warning', 'info' );
		return in_array( $type, $valid_types, true ) ? $type : 'info';
	}
}
