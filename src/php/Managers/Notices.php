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

use \Arts\FluidDesignSystem\Base\Manager as BaseManager;

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
	 * @var array
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
	public function add_notice( $message, $type = 'info', $dismissible = true ) {
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
	public function add_persistent_notice( $message, $type = 'info', $context = 'admin', $dismissible = true ) {
		$persistent_notices = get_transient( $this->transient_key );
		if ( ! is_array( $persistent_notices ) ) {
			$persistent_notices = array();
		}

		if ( ! isset( $persistent_notices[ $context ] ) ) {
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
	public function display_notices( $context = 'admin' ) {
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
	 * @return array Array of notice data.
	 */
	public function get_notices_for_ajax( $context = 'admin' ) {
		$ajax_notices = array();

		// Add current request notices
		foreach ( $this->notices as $notice ) {
			$ajax_notices[] = $notice;
		}

		// Add persistent notices
		$persistent_notices = get_transient( $this->transient_key );
		if ( is_array( $persistent_notices ) && isset( $persistent_notices[ $context ] ) ) {
			foreach ( $persistent_notices[ $context ] as $notice ) {
				$ajax_notices[] = $notice;
			}
		}

		// Clear persistent notices after getting them
		$this->clear_persistent_notices( $context );

		return $ajax_notices;
	}

	/**
	 * Check if there are any notices.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @param string $type    Optional. Check for specific notice type.
	 * @param string $context Context to check for persistent notices.
	 * @return bool True if notices exist, false otherwise.
	 */
	public function has_notices( $type = null, $context = 'admin' ) {
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
		if ( is_array( $persistent_notices ) && isset( $persistent_notices[ $context ] ) ) {
			if ( $type === null ) {
				return ! empty( $persistent_notices[ $context ] );
			}
			foreach ( $persistent_notices[ $context ] as $notice ) {
				if ( $notice['type'] === $type ) {
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
	public function clear_notices( $context = 'admin' ) {
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
	private function display_and_clear_persistent_notices( $context ) {
		$persistent_notices = get_transient( $this->transient_key );
		if ( ! is_array( $persistent_notices ) || ! isset( $persistent_notices[ $context ] ) ) {
			return;
		}

		foreach ( $persistent_notices[ $context ] as $notice ) {
			$this->render_notice( $notice );
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
	private function clear_persistent_notices( $context ) {
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
	 * @param array $notice Notice data.
	 * @return void
	 */
	private function render_notice( $notice ) {
		$dismissible_class = $notice['dismissible'] ? ' is-dismissible' : '';

		printf(
			'<div class="notice notice-%s%s"><p>%s</p></div>',
			esc_attr( $notice['type'] ),
			esc_attr( $dismissible_class ),
			esc_html( $notice['message'] )
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
	private function sanitize_notice_type( $type ) {
		$valid_types = array( 'success', 'error', 'warning', 'info' );
		return in_array( $type, $valid_types, true ) ? $type : 'info';
	}
}
