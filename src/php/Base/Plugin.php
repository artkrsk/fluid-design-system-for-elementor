<?php

namespace Arts\FluidDesignSystem\Base;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

use ArtsFluidDS\Arts\ElementorExtension\Plugins\BasePlugin;

/**
 * Abstract base class for Fluid Design System plugin.
 */
abstract class Plugin extends BasePlugin {
	/**
	 * Container for manager instances.
	 *
	 * @var \Arts\FluidDesignSystem\Base\ManagersContainer
	 */
	protected $managers;
}
