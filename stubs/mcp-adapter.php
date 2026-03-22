<?php
/**
 * WordPress MCP Adapter stubs for PHPStan.
 *
 * Generated from WordPress/mcp-adapter v0.4.1 source.
 *
 * @package Arts\FluidDesignSystem
 */

namespace WP\MCP\Core;

class McpAdapter {

	/**
	 * @param string        $server_id
	 * @param string        $server_route_namespace
	 * @param string        $server_route
	 * @param string        $server_name
	 * @param string        $server_description
	 * @param string        $server_version
	 * @param array<string> $mcp_transports            Transport class names.
	 * @param string|null   $error_handler             Error handler class name.
	 * @param string|null   $observability_handler     Observability handler class name.
	 * @param array<string> $tools                     Ability names to expose as tools.
	 * @param array<string> $resources                 Ability names to expose as resources.
	 * @param array<string> $prompts                   Ability names to expose as prompts.
	 * @param callable|null $transport_permission_callback Custom auth callback.
	 * @return self|\WP_Error
	 */
	public function create_server(
		string $server_id,
		string $server_route_namespace,
		string $server_route,
		string $server_name,
		string $server_description,
		string $server_version,
		array $mcp_transports,
		?string $error_handler,
		?string $observability_handler = null,
		array $tools = array(),
		array $resources = array(),
		array $prompts = array(),
		?callable $transport_permission_callback = null
	): self|\WP_Error {}

	/** @return void */
	public function init(): void {}
}

namespace WP\MCP\Transport;

class HttpTransport {

	/** @param \WP\MCP\Transport\McpTransportContext $transport_context */
	public function __construct( $transport_context ) {}

	/** @return void */
	public function register_routes(): void {}

	/**
	 * @param \WP_REST_Request $request
	 * @return bool|\WP_Error
	 */
	public function check_permission( \WP_REST_Request $request ) {}

	/**
	 * @param \WP_REST_Request $request
	 * @return \WP_REST_Response
	 */
	public function handle_request( \WP_REST_Request $request ): \WP_REST_Response {}
}

class McpTransportContext {
}

namespace WP\MCP\Infrastructure\ErrorHandling;

class ErrorLogMcpErrorHandler {

	/**
	 * @param string               $message
	 * @param array<string, mixed> $context
	 * @param string               $type
	 * @return void
	 */
	public function log( string $message, array $context = array(), string $type = 'error' ): void {}
}

namespace WP\MCP\Infrastructure\ErrorHandling\Contracts;

interface McpErrorHandlerInterface {

	/**
	 * @param string               $message
	 * @param array<string, mixed> $context
	 * @param string               $type
	 * @return void
	 */
	public function log( string $message, array $context = array(), string $type = 'error' ): void;
}

namespace WP\MCP\Transport\Contracts;

interface McpTransportInterface {
}

interface McpRestTransportInterface extends McpTransportInterface {
}
