<?php
/**
 * Plugin Name: Fluid DS E2E Filter Group
 * Description: Registers a developer preset group via the public filter so e2e can assert filter-group rendering (mounted as an mu-plugin by .wp-env.json).
 *
 * Mirrors the code sample the plugin's admin page documents for the
 * arts/fluid_design_system/custom_presets filter.
 *
 * @package Arts\FluidDesignSystem\Tests
 */

add_filter(
	'arts/fluid_design_system/custom_presets',
	function ( $groups ) {
		$groups[] = array(
			'name'        => 'E2E Filter Group',
			'description' => 'Injected by the e2e mu-plugin fixture',
			'value'       => array(
				array(
					'id'    => 'e2e_filter_preset',
					'title' => 'E2E Filter Preset',
					'value' => 'var(--e2e-filter-token)',
				),
				array(
					'id'            => 'e2e_filter_static',
					'title'         => 'E2E Filter Static',
					'value'         => '12px',
					'display_value' => '12px fixed',
				),
			),
		);

		return $groups;
	}
);
