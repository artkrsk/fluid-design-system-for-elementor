<?php

namespace Arts\FluidDesignSystem\Base;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

use \Arts\ElementorExtension\Plugins\BaseManager;

abstract class Manager extends BaseManager {
	/**
	 * @var \Arts\FluidDesignSystem\Base\ManagersContainer
	 */
	protected $managers;
}
