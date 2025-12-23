<?php

namespace Arts\FluidDesignSystem\Base;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

use Arts\Base\Containers\ManagersContainer as BaseManagersContainer;

/**
 * Container for manager instances in the Fluid Design System plugin.
 *
 * @property \Arts\FluidDesignSystem\Managers\Extension $extension
 * @property \Arts\FluidDesignSystem\Managers\Compatibility $compatibility
 * @property \Arts\FluidDesignSystem\Managers\Options $options
 * @property \Arts\FluidDesignSystem\Managers\Units $units
 * @property \Arts\FluidDesignSystem\Managers\Notices $notices
 * @property \Arts\FluidDesignSystem\Managers\Admin\Frontend $admin_frontend
 * @property \Arts\FluidDesignSystem\Managers\Admin\Page $admin_page
 * @property \Arts\FluidDesignSystem\Managers\Admin\Tabs\Tabs $admin_tabs
 * @property \Arts\FluidDesignSystem\Managers\Admin\Tabs\Groups\AJAX $admin_tabs_groups_ajax
 * @property \Arts\FluidDesignSystem\Managers\Admin\Tabs\Groups\Handlers $admin_tabs_groups_handlers
 * @property \Arts\FluidDesignSystem\Managers\Admin\Tabs\Groups\View $admin_tabs_groups_view
 * @property \Arts\FluidDesignSystem\Managers\Data $data
 * @property \Arts\FluidDesignSystem\Managers\GroupsData $groups_data
 * @property \Arts\FluidDesignSystem\Managers\CSSVariables $css_variables
 * @property \Arts\FluidDesignSystem\Managers\ControlRegistry $control_registry
 */
class ManagersContainer extends BaseManagersContainer {}
