<?php

namespace Arts\FluidDesignSystem\Base;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

use \Arts\ElementorExtension\Plugins\BasePlugin;

abstract class Plugin extends BasePlugin {
	/**
	 * @var \Arts\FluidDesignSystem\Base\ManagersContainer
	 */
	protected $managers;
}
