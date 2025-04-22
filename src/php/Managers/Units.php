<?php
/**
 * Units manager for Fluid Design System.
 *
 * @package Arts\FluidDesignSystem
 * @since 1.0.0
 */

namespace Arts\FluidDesignSystem\Managers;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

use \Elementor\Core\Common\Modules\Ajax\Module as Ajax;
use \Arts\ElementorExtension\Plugins\BaseManager;
use \Arts\FluidDesignSystem\Elementor\Units\Fluid\Module as FluidUnitModule;
use \Elementor\Controls_Manager;
use \Elementor\Core\Kits\Controls\Repeater as Global_Style_Repeater;

/**
 * Units Class
 *
 * Manages Elementor units for Fluid Design System,
 * handling the addition of fluid units to various controls.
 *
 * @since 1.0.0
 */
class Units extends BaseManager {
	/**
	 * Register AJAX handlers for fluid units.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @param Ajax $ajax_manager The Elementor AJAX manager.
	 * @return void
	 */
	public function register_ajax_handlers( $ajax_manager ) {
		FluidUnitModule::instance()->register_ajax_actions( $ajax_manager );
	}

	/**
	 * Modify control settings to add fluid unit.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @param \Elementor\Controls_Stack $element    The element instance.
	 * @param string                    $section_id The section ID.
	 * @param array                     $args       The section arguments.
	 * @return void
	 */
	public function modify_control_settings( $element, $section_id, $args ) {
		$controls          = $element->get_controls();
		$eligible_controls = $this->get_eligible_controls_for_fluid_unit( $controls );

		// Update eligible standard controls
		foreach ( $eligible_controls as $control_name => $control ) {
			if ( ! in_array( 'fluid', $control['size_units'] ) ) {
				$control['size_units'][] = 'fluid';
				$element->update_control( $control_name, $control );
			}
		}

		// Handle repeater controls separately since they need special processing for nested fields
		foreach ( $controls as $control_name => $control ) {
			if ( isset( $control['type'] ) && ( Controls_Manager::REPEATER === $control['type'] || Global_Style_Repeater::CONTROL_TYPE === $control['type'] ) && isset( $control['fields'] ) ) {
				$fields_updated = false;

				foreach ( $control['fields'] as $field_name => $field ) {
					if ( $this->is_control_eligible_for_fluid_unit( $field ) ) {
						if ( ! in_array( 'fluid', $field['size_units'] ) ) {
							$field['size_units'][]            = 'fluid';
							$control['fields'][ $field_name ] = $field;
								$fields_updated               = true;
						}
					}
				}

				// Only update the control if any of its fields were modified
				if ( $fields_updated ) {
					$element->update_control( $control_name, $control );
				}
			}
		}

		/**
		 * Fires after fluid units have been added to default controls.
		 *
		 * Allows 3rd-party developers to modify or add controls
		 * that should receive the fluid unit.
		 *
		 * @since 1.0.0
		 *
		 * @param \Elementor\Controls_Stack $element    The element instance.
		 * @param string                    $section_id The section ID.
		 * @param array                     $args       The section arguments.
		 * @param Units                     $this       The Units instance.
		 */
		do_action( 'arts/fluid_design_system/controls/after_add_fluid_unit', $element, $section_id, $args, $this );
	}

	/**
	 * Check if a control is eligible for adding the fluid unit.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @param array $control The control configuration.
	 * @return bool Whether the control is eligible.
	 */
	public function is_control_eligible_for_fluid_unit( $control ) {
		$default_eligible = isset( $control['size_units'] ) && is_array( $control['size_units'] ) && in_array( 'custom', $control['size_units'] );

		/**
		 * Filter whether a control is eligible for the fluid unit.
		 *
		 * @since 1.0.0
		 *
		 * @param bool  $default_eligible Default eligibility status.
		 * @param array $control          The control configuration.
		 */
		return apply_filters( 'arts/fluid_design_system/controls/is_eligible_for_fluid_unit', $default_eligible, $control );
	}

	/**
	 * Get eligible controls for fluid unit.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @param array $controls The controls array.
	 * @return array Filtered array of eligible controls.
	 */
	public function get_eligible_controls_for_fluid_unit( $controls ) {
		$eligible_controls = array();

		foreach ( $controls as $control_name => $control ) {
			if ( $this->is_control_eligible_for_fluid_unit( $control ) ) {
				$eligible_controls[ $control_name ] = $control;
			}
		}

		/**
		 * Filter the eligible controls for fluid unit.
		 *
		 * @since 1.0.0
		 *
		 * @param array $eligible_controls The eligible controls.
		 * @param array $controls          All controls.
		 */
		return apply_filters( 'arts/fluid_design_system/controls/eligible_for_fluid_unit', $eligible_controls, $controls );
	}

	/**
	 * Modify selectors for fluid units.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @param array                                 $control  The control configuration.
	 * @param array|string                          $value    The control value.
	 * @param \Elementor\Core\Files\CSS\Base|string $css_file The CSS file.
	 * @return array Modified control configuration.
	 */
	public function modify_selectors( $control, $value, $css_file ) {
		$eligible_control_types = array( 'slider', 'dimensions', 'gaps' );

		/**
		 * Filter the eligible control types for selector modification.
		 *
		 * @since 1.0.0
		 *
		 * @param array $eligible_control_types The eligible control types.
		 */
		$eligible_control_types = apply_filters( 'arts/fluid_design_system/controls/eligible_types_for_selector_modification', $eligible_control_types );

		if ( in_array( $control['type'], $eligible_control_types ) ) {
			if ( isset( $value['unit'] ) && $value['unit'] === 'fluid' ) {
				foreach ( $control['selectors'] as $selector => $css_property ) {
					$modified_css_property = str_replace( '{{UNIT}}', '', $css_property );

					/**
					 * Filter the modified CSS property for fluid units.
					 *
					 * @since 1.0.0
					 *
					 * @param string $modified_css_property The modified CSS property.
					 * @param string $css_property          The original CSS property.
					 * @param string $selector              The CSS selector.
					 * @param array  $control               The control configuration.
					 * @param array  $value                 The control value.
					 */
					$control['selectors'][ $selector ] = apply_filters(
						'arts/fluid_design_system/controls/modified_css_property',
						$modified_css_property,
						$css_property,
						$selector,
						$control,
						$value
					);
				}
			}
		}

		return $control;
	}
}
