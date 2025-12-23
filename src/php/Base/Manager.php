<?php

namespace Arts\FluidDesignSystem\Base;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

use Arts\ElementorExtension\Plugins\BaseManager;

/**
 * Abstract base class for Fluid Design System managers.
 */
abstract class Manager extends BaseManager {
	/**
	 * Container for manager instances.
	 *
	 * @var ManagersContainer|null
	 */
	protected $managers;
}
