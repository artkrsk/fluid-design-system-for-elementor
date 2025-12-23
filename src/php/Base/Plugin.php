<?php

namespace Arts\FluidDesignSystem\Base;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

use Arts\ElementorExtension\Plugins\BasePlugin;

/**
 * Abstract base class for Fluid Design System plugin.
 *
 * @extends BasePlugin<ManagersContainer>
 */
abstract class Plugin extends BasePlugin {
	/**
	 * Container for manager instances.
	 *
	 * @var ManagersContainer
	 */
	protected $managers;
}
