<?php
/**
 * Adds 'fluid' unit to eligible Elementor controls and optimizes clamp() output.
 *
 * @package Arts\FluidDesignSystem
 */

namespace Arts\FluidDesignSystem\Managers;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use Elementor\Core\Common\Modules\Ajax\Module as Ajax;
use Arts\FluidDesignSystem\Base\Manager as BaseManager;
use Arts\FluidDesignSystem\Elementor\Units\Fluid\Module as FluidUnitModule;
use Elementor\Controls_Manager;
use Elementor\Core\Kits\Controls\Repeater as Global_Style_Repeater;
use Arts\FluidDesignSystem\Managers\CSSVariables;

/**
 * Fluid unit injection into Elementor controls.
 */
class Units extends BaseManager {
	public function register_ajax_handlers( Ajax $ajax_manager ): void {
		FluidUnitModule::instance()->register_ajax_actions( $ajax_manager );
	}

	/**
	 * Hooked to elementor/element/after_section_end. Injects 'fluid' into size_units.
	 *
	 * @param \Elementor\Controls_Stack $element
	 * @param string                    $section_id
	 * @param array<string, mixed>      $args
	 */
	public function modify_control_settings( \Elementor\Controls_Stack $element, string $section_id, array $args ): void {
		$controls_raw = $element->get_controls();
		if ( ! is_array( $controls_raw ) ) {
			return;
		}
		/** @var array<string, array<string, mixed>> $controls */
		$controls          = $controls_raw;
		$eligible_controls = $this->get_eligible_controls_for_fluid_unit( $controls );

		// Update eligible standard controls
		foreach ( $eligible_controls as $control_name => $control ) {
			if ( ! is_array( $control ) || ! isset( $control['size_units'] ) || ! is_array( $control['size_units'] ) || in_array( 'fluid', $control['size_units'], true ) ) {
				continue;
			}
			$control['size_units'][] = 'fluid';
			$element->update_control( $control_name, $control );
		}

		// Handle repeater controls separately since they need special processing for nested fields
		foreach ( $controls as $control_name => $control ) {
			if ( ! is_array( $control ) || ! isset( $control['type'] ) || ! isset( $control['fields'] ) || ! is_array( $control['fields'] ) ) {
				continue;
			}

			if ( Controls_Manager::REPEATER === $control['type'] || Global_Style_Repeater::CONTROL_TYPE === $control['type'] ) {
				$fields_updated = false;

				foreach ( $control['fields'] as $field_name => $field ) {
					if ( ! is_array( $field ) ) {
						continue;
					}
					/** @var array<string, mixed> $typed_field */
					$typed_field = $field;
					if ( $this->is_control_eligible_for_fluid_unit( $typed_field ) ) {
						if ( ! isset( $typed_field['size_units'] ) || ! is_array( $typed_field['size_units'] ) || in_array( 'fluid', $typed_field['size_units'], true ) ) {
							continue;
						}
						$typed_field['size_units'][]      = 'fluid';
						$control['fields'][ $field_name ] = $typed_field;
						$fields_updated                   = true;
					}
				}

				// Only update the control if any of its fields were modified
				if ( $fields_updated ) {
					$element->update_control( $control_name, $control );
				}
			}
		}

		/** Allows 3rd-party to modify controls after fluid unit injection. */
		do_action( 'arts/fluid_design_system/controls/after_add_fluid_unit', $element, $section_id, $args, $this );
	}

	/**
	 * Eligible controls have 'custom' in size_units (filterable).
	 *
	 * @param array<string, mixed> $control
	 */
	public function is_control_eligible_for_fluid_unit( array $control ): bool {
		$default_eligible = isset( $control['size_units'] ) && is_array( $control['size_units'] ) && in_array( 'custom', $control['size_units'], true );

		$filtered = apply_filters( 'arts/fluid_design_system/controls/is_eligible_for_fluid_unit', $default_eligible, $control );
		return is_bool( $filtered ) ? $filtered : $default_eligible;
	}

	/**
	 * @param array<string, array<string, mixed>> $controls
	 * @return array<string, array<string, mixed>>
	 */
	public function get_eligible_controls_for_fluid_unit( array $controls ): array {
		/** @var array<string, array<string, mixed>> $eligible_controls */
		$eligible_controls = array();

		foreach ( $controls as $control_name => $control ) {
			if ( is_array( $control ) && $this->is_control_eligible_for_fluid_unit( $control ) ) {
				$eligible_controls[ $control_name ] = $control;
			}
		}

		$filtered = apply_filters( 'arts/fluid_design_system/controls/eligible_for_fluid_unit', $eligible_controls, $controls );
		/** @var array<string, array<string, mixed>> $filtered */
		return $filtered;
	}

	/**
	 * Hooked to elementor/element/parse_css. Strips {{UNIT}} for fluid values.
	 *
	 * @param array<string, mixed>                  $control
	 * @param array<string, mixed>|string           $value
	 * @param \Elementor\Core\Files\CSS\Base|string $css_file
	 * @return array<string, mixed>
	 */
	public function modify_selectors( array $control, $value, $css_file ): array {
		$eligible_control_types = array( 'slider', 'dimensions', 'gaps' );

		$filtered_types = apply_filters( 'arts/fluid_design_system/controls/eligible_types_for_selector_modification', $eligible_control_types );
		/** @var array<int, string> $eligible_control_types */
		$eligible_control_types = is_array( $filtered_types ) ? $filtered_types : $eligible_control_types;

		if ( ! isset( $control['type'] ) || ! in_array( $control['type'], $eligible_control_types, true ) ) {
			return $control;
		}

		if ( ! is_array( $value ) || ! isset( $value['unit'] ) || $value['unit'] !== 'fluid' ) {
			return $control;
		}

		if ( ! isset( $control['selectors'] ) || ! is_array( $control['selectors'] ) ) {
			return $control;
		}

		foreach ( $control['selectors'] as $selector => $css_property ) {
			if ( ! is_string( $selector ) || ! is_string( $css_property ) ) {
				continue;
			}

			$modified_css_property = str_replace( '{{UNIT}}', '', $css_property );

			$filtered_property                 = apply_filters(
				'arts/fluid_design_system/controls/modified_css_property',
				$modified_css_property,
				$css_property,
				$selector,
				$control,
				$value
			);
			$control['selectors'][ $selector ] = is_string( $filtered_property ) ? $filtered_property : $modified_css_property;
		}

		return $control;
	}

	/**
	 * Hooked to elementor/css-file/post-parse. Simplifies clamp() when min=max.
	 */
	public function optimize_fluid_css_post_parse( \Elementor\Core\Files\CSS\Base $css_file ): void {
		$stylesheet = $css_file->get_stylesheet();
		$all_rules  = $stylesheet->get_rules();

		if ( ! is_array( $all_rules ) || empty( $all_rules ) ) {
			return;
		}

		$preset_prefix = CSSVariables::CSS_VAR_PRESET_PREFIX;

		foreach ( $all_rules as $device => $selectors ) {
			if ( ! is_array( $selectors ) || empty( $selectors ) ) {
				continue;
			}

			foreach ( $selectors as $selector => $properties ) {
				if ( ! is_array( $properties ) || empty( $properties ) || ! is_string( $selector ) || $selector !== ':root' ) {
					continue;
				}

				$optimized_properties = array();
				$needs_update         = false;

				foreach ( $properties as $property => $value ) {
					if ( ! is_string( $property ) || ! is_string( $value ) ) {
						$optimized_properties[ $property ] = $value;
						continue;
					}

					if ( strpos( $property, $preset_prefix ) === 0 && strpos( $value, 'clamp(' ) === 0 ) {
						$simplified_value = $this->simplify_clamp_formula( $value );

						if ( $simplified_value !== $value ) {
							$optimized_properties[ $property ] = $simplified_value;
							$needs_update                      = true;
						} else {
							$optimized_properties[ $property ] = $value;
						}
					} else {
						$optimized_properties[ $property ] = $value;
					}
				}

				if ( $needs_update ) {
					$query = ( $device !== 'all' ) ? array() : null;
					$stylesheet->add_rules( $selector, $optimized_properties, $query );
				}
			}
		}
	}

	/** Extracts clamp() bounds and returns static value if identical. */
	private function simplify_clamp_formula( string $css_value ): string {
		if ( preg_match( '/^clamp\s*\(\s*min\s*\(\s*([^,]+?)\s*,\s*([^,]+?)\s*\)/', $css_value, $matches ) ) {
			$min_value = trim( $matches[1] );
			$max_value = trim( $matches[2] );

			if ( $min_value === $max_value ) {
				if ( strpos( $css_value, ' - ' . preg_quote( str_replace( 'px', '', $min_value ) ) . ')' ) !== false ) {
					return $min_value;
				}
			}
		}

		return $css_value;
	}
}
