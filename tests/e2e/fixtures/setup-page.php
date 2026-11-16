<?php
/**
 * Creates E2E test page with widgets using fluid presets.
 *
 * Usage: wp eval-file tests/e2e/fixtures/setup-page.php
 *
 * Creates a page at /e2e-fluid-test/ with:
 * - Heading using e2e_heading_xl preset (typography font-size)
 * - Heading using e2e_inverted preset (edge case)
 * - Spacer using e2e_gap_standard preset
 * - Spacer using an inline (custom) fluid value, no preset
 * - Unit-aware cases: mixed-unit and em presets, a rem custom-breakpoint preset,
 *   an inline rem value, and one saved in the formula shape shipped before that
 * - Container with gap using e2e_gap_large preset
 * - Button with padding (dimensions control)
 * - Element using custom breakpoint preset
 *
 * Each element has a unique _element_id for easy Playwright selection.
 *
 * @package Arts\FluidDesignSystem\Tests
 */

// phpcs:disable WordPress.Security.EscapeOutput.OutputNotEscaped

if ( ! defined( 'ABSPATH' ) ) {
	echo "Error: WordPress not loaded. Run via WP-CLI.\n";
	exit( 1 );
}

$test_page_slug = 'e2e-fluid-test';

// Element IDs matching test-data.ts TEST_ELEMENT_IDS
$element_ids = array(
	'headingXl'            => 'e2e-heading-xl',
	'headingInverted'      => 'e2e-heading-inverted',
	'containerNegative'    => 'e2e-container-negative', // Separate container for negative margin (not in flex)
	'spacerStandard'       => 'e2e-spacer-standard',
	'spacerInline'         => 'e2e-spacer-inline',
	'containerGap'         => 'e2e-container-gap',
	'buttonDimensions'     => 'e2e-button-dimensions',
	'customBreakpoint'     => 'e2e-custom-breakpoint',
	'bgPosition'           => 'e2e-bg-position',
	'headingUnits'         => 'e2e-heading-units',
	'headingMixedInverted' => 'e2e-heading-mixed-inverted',
	'customBreakpointRem'  => 'e2e-custom-breakpoint-rem',
	'spacerInlineRem'      => 'e2e-spacer-inline-rem',
	'spacerInlineLegacy'   => 'e2e-spacer-inline-legacy',
);

/**
 * Generate random hex ID like Elementor does.
 */
function e2e_generate_id() {
	return dechex( wp_rand( 0x100000, 0xFFFFFF ) );
}

/**
 * Get CSS variable reference for a preset ID.
 *
 * @param string $preset_id The preset ID.
 * @return string CSS var() reference.
 */
function e2e_get_preset_var( string $preset_id ): string {
	return 'var(--arts-fluid-preset--' . $preset_id . ')';
}

/**
 * Inline (custom) fluid value as the editor stores it: the plugin's clamp() template with
 * Elementor's placeholders filled in. tests/fixtures/clamp-formulas.json pins that template
 * to generateClampFormula(), which is what the editor actually calls.
 *
 * @param string $min_size Min size.
 * @param string $min_unit Min unit.
 * @param string $max_size Max size.
 * @param string $max_unit Max unit.
 * @return string clamp() formula.
 */
function e2e_inline_fluid_value( string $min_size, string $min_unit, string $max_size, string $max_unit ): string {
	return str_replace(
		array( '{{min.size}}', '{{min.unit}}', '{{max.size}}', '{{max.unit}}' ),
		array( $min_size, $min_unit, $max_size, $max_unit ),
		\Arts\FluidDesignSystem\Managers\CSSVariables::get_clamp_formula( 'min', 'max' )
	);
}

// Build Elementor elements structure
$main_container_id      = e2e_generate_id();
$heading_xl_id          = e2e_generate_id();
$heading_inverted_id    = e2e_generate_id();
$negative_container_id  = e2e_generate_id(); // Separate top-level container for negative margin
$negative_inner_text_id = e2e_generate_id();
$spacer_id              = e2e_generate_id();
$spacer_inline_id       = e2e_generate_id();
$gap_container_id       = e2e_generate_id();
$gap_child1_id          = e2e_generate_id();
$gap_child2_id          = e2e_generate_id();
$button_id              = e2e_generate_id();
$custom_breakpoint_id   = e2e_generate_id();
$inner_text1_id         = e2e_generate_id();
$inner_text2_id         = e2e_generate_id();
$custom_bp_heading_id   = e2e_generate_id();
$bg_position_id         = e2e_generate_id();
$bg_position_text_id    = e2e_generate_id();
$heading_units_id       = e2e_generate_id();
$heading_mixed_inv_id   = e2e_generate_id();
$custom_bp_rem_id       = e2e_generate_id();
$spacer_inline_rem_id   = e2e_generate_id();
$spacer_inline_old_id   = e2e_generate_id();

$elements = array(
	// Main container
	array(
		'id'       => $main_container_id,
		'elType'   => 'container',
		'settings' => array(
			'content_width' => 'full',
			'padding'       => array(
				'unit'   => 'px',
				'top'    => '40',
				'right'  => '40',
				'bottom' => '40',
				'left'   => '40',
			),
		),
		'elements' => array(
			// Heading with e2e_heading_xl preset
			array(
				'id'         => $heading_xl_id,
				'elType'     => 'widget',
				'widgetType' => 'heading',
				'settings'   => array(
					'title'                 => 'Fluid Heading XL',
					'_element_id'           => $element_ids['headingXl'],
					'header_size'           => 'h1',
					'typography_typography' => 'custom',
					'typography_font_size'  => array(
						'unit' => 'fluid',
						'size' => e2e_get_preset_var( 'e2e_heading_xl' ),
					),
				),
			),
			// Heading with inverted preset (min > max)
			array(
				'id'         => $heading_inverted_id,
				'elType'     => 'widget',
				'widgetType' => 'heading',
				'settings'   => array(
					'title'                 => 'Inverted Preset (shrinks on desktop)',
					'_element_id'           => $element_ids['headingInverted'],
					'header_size'           => 'h2',
					'typography_typography' => 'custom',
					'typography_font_size'  => array(
						'unit' => 'fluid',
						'size' => e2e_get_preset_var( 'e2e_inverted' ),
					),
				),
			),
			// Spacer with fluid height
			array(
				'id'         => $spacer_id,
				'elType'     => 'widget',
				'widgetType' => 'spacer',
				'settings'   => array(
					'_element_id' => $element_ids['spacerStandard'],
					'space'       => array(
						'unit' => 'fluid',
						'size' => e2e_get_preset_var( 'e2e_gap_standard' ),
					),
				),
			),
			// Spacer with an inline 40px ~ 180px value
			array(
				'id'         => $spacer_inline_id,
				'elType'     => 'widget',
				'widgetType' => 'spacer',
				'settings'   => array(
					'_element_id' => $element_ids['spacerInline'],
					'space'       => array(
						'unit' => 'fluid',
						'size' => e2e_inline_fluid_value( '40', 'px', '180', 'px' ),
					),
				),
			),
			// Container with fluid gap between children
			array(
				'id'       => $gap_container_id,
				'elType'   => 'container',
				'settings' => array(
					'_element_id'      => $element_ids['containerGap'],
					'flex_direction'   => 'row',
					'flex_gap'         => array(
						'unit'     => 'fluid',
						'size'     => e2e_get_preset_var( 'e2e_gap_large' ),
						'column'   => e2e_get_preset_var( 'e2e_gap_large' ),
						'row'      => e2e_get_preset_var( 'e2e_gap_large' ),
						'isLinked' => true,
					),
					'background_color' => '#f0f0f0',
					'padding'          => array(
						'unit'   => 'px',
						'top'    => '20',
						'right'  => '20',
						'bottom' => '20',
						'left'   => '20',
					),
				),
				'elements' => array(
					array(
						'id'         => $inner_text1_id,
						'elType'     => 'widget',
						'widgetType' => 'text-editor',
						'settings'   => array(
							'editor' => '<p>Gap Child 1</p>',
						),
					),
					array(
						'id'         => $inner_text2_id,
						'elType'     => 'widget',
						'widgetType' => 'text-editor',
						'settings'   => array(
							'editor' => '<p>Gap Child 2</p>',
						),
					),
				),
			),
			// Button with fluid padding (dimensions control)
			array(
				'id'         => $button_id,
				'elType'     => 'widget',
				'widgetType' => 'button',
				'settings'   => array(
					'_element_id'         => $element_ids['buttonDimensions'],
					'text'                => 'Fluid Padding Button',
					'button_text_padding' => array(
						'unit'     => 'fluid',
						'top'      => e2e_get_preset_var( 'e2e_gap_standard' ),
						'right'    => e2e_get_preset_var( 'e2e_gap_large' ),
						'bottom'   => e2e_get_preset_var( 'e2e_gap_standard' ),
						'left'     => e2e_get_preset_var( 'e2e_gap_large' ),
						'isLinked' => false,
					),
				),
			),
			// Element with custom breakpoint preset
			array(
				'id'         => $custom_bp_heading_id,
				'elType'     => 'widget',
				'widgetType' => 'heading',
				'settings'   => array(
					'title'                 => 'Custom Breakpoints (400-1600)',
					'_element_id'           => $element_ids['customBreakpoint'],
					'header_size'           => 'h2',
					'typography_typography' => 'custom',
					'typography_font_size'  => array(
						'unit' => 'fluid',
						'size' => e2e_get_preset_var( 'e2e_custom_breakpoints' ),
					),
				),
			),
			// Mixed-unit font size (16px ~ 3rem) with an em line height (1em ~ 0.9em)
			array(
				'id'         => $heading_units_id,
				'elType'     => 'widget',
				'widgetType' => 'heading',
				'settings'   => array(
					'title'                  => 'Mixed Units (px to rem, em line height)',
					'_element_id'            => $element_ids['headingUnits'],
					'header_size'            => 'h2',
					'typography_typography'  => 'custom',
					'typography_font_size'   => array(
						'unit' => 'fluid',
						'size' => e2e_get_preset_var( 'e2e_mixed_units' ),
					),
					'typography_line_height' => array(
						'unit' => 'fluid',
						'size' => e2e_get_preset_var( 'e2e_em_line_height' ),
					),
				),
			),
			// Mixed-unit inverted font size (3rem ~ 16px)
			array(
				'id'         => $heading_mixed_inv_id,
				'elType'     => 'widget',
				'widgetType' => 'heading',
				'settings'   => array(
					'title'                 => 'Mixed Inverted (rem to px)',
					'_element_id'           => $element_ids['headingMixedInverted'],
					'header_size'           => 'h2',
					'typography_typography' => 'custom',
					'typography_font_size'  => array(
						'unit' => 'fluid',
						'size' => e2e_get_preset_var( 'e2e_mixed_inverted' ),
					),
				),
			),
			// rem preset with custom breakpoints (400-1600)
			array(
				'id'         => $custom_bp_rem_id,
				'elType'     => 'widget',
				'widgetType' => 'heading',
				'settings'   => array(
					'title'                 => 'Custom Breakpoints REM (400-1600)',
					'_element_id'           => $element_ids['customBreakpointRem'],
					'header_size'           => 'h2',
					'typography_typography' => 'custom',
					'typography_font_size'  => array(
						'unit' => 'fluid',
						'size' => e2e_get_preset_var( 'e2e_custom_breakpoints_rem' ),
					),
				),
			),
			// Spacer with an inline 2rem ~ 10rem value
			array(
				'id'         => $spacer_inline_rem_id,
				'elType'     => 'widget',
				'widgetType' => 'spacer',
				'settings'   => array(
					'_element_id' => $element_ids['spacerInlineRem'],
					'space'       => array(
						'unit' => 'fluid',
						'size' => e2e_inline_fluid_value( '2', 'rem', '10', 'rem' ),
					),
				),
			),
			// The same inline value saved by a version before the unit-aware formula:
			// it must keep rendering exactly as it did (the px-only result)
			array(
				'id'         => $spacer_inline_old_id,
				'elType'     => 'widget',
				'widgetType' => 'spacer',
				'settings'   => array(
					'_element_id' => $element_ids['spacerInlineLegacy'],
					'space'       => array(
						'unit' => 'fluid',
						'size' => 'clamp(min(2rem, 10rem), calc((2rem) + (((10 - 2) * ((100vw - var(--arts-fluid-min-screen)) / var(--arts-fluid-screen-diff))))), max(2rem, 10rem))',
					),
				),
			),
		),
	),
	// Container with fluid background-position (Issue #23: cross-control unit leak)
	array(
		'id'       => $bg_position_id,
		'elType'   => 'container',
		'settings' => array(
			'_element_id'           => $element_ids['bgPosition'],
			'content_width'         => 'full',
			'min_height'            => array(
				'unit' => 'px',
				'size' => 100,
			),
			'background_background' => 'classic',
			'background_image'      => array(
				'url' => 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
				'id'  => '',
			),
			'background_position'   => 'initial',
			'background_xpos'       => array(
				'unit' => 'fluid',
				'size' => e2e_get_preset_var( 'e2e_gap_standard' ),
			),
			'background_ypos'       => array(
				'unit' => '%',
				'size' => 100,
			),
		),
		'elements' => array(
			array(
				'id'         => $bg_position_text_id,
				'elType'     => 'widget',
				'widgetType' => 'text-editor',
				'settings'   => array(
					'editor' => '<p>Container with fluid background-position X</p>',
				),
			),
		),
	),
	// Separate container for negative margin test (NOT inside flex parent)
	// This tests that fluid dimensions controls generate proper CSS
	array(
		'id'       => $negative_container_id,
		'elType'   => 'container',
		'settings' => array(
			'_element_id'      => $element_ids['containerNegative'],
			'content_width'    => 'full',
			'background_color' => '#ffe0e0',
			'padding'          => array(
				'unit'   => 'px',
				'top'    => '20',
				'right'  => '20',
				'bottom' => '20',
				'left'   => '20',
			),
			'margin'           => array(
				'unit'     => 'fluid',
				'top'      => e2e_get_preset_var( 'e2e_negative_margin' ),
				'right'    => '',
				'bottom'   => '',
				'left'     => '',
				'isLinked' => false,
			),
		),
		'elements' => array(
			array(
				'id'         => $negative_inner_text_id,
				'elType'     => 'widget',
				'widgetType' => 'text-editor',
				'settings'   => array(
					'editor' => '<p>Container with negative fluid margin-top</p>',
				),
			),
		),
	),
);

// Delete existing test page if it exists
$existing = get_page_by_path( $test_page_slug );
if ( $existing ) {
	wp_delete_post( $existing->ID, true );
	echo "Deleted existing test page (ID: {$existing->ID})\n";
}

// Get Elementor version for metadata
$elementor_version = defined( 'ELEMENTOR_VERSION' ) ? ELEMENTOR_VERSION : '3.27.0';

// Create new test page
$post_id = wp_insert_post(
	array(
		'post_title'   => 'E2E Fluid Test Page',
		'post_name'    => $test_page_slug,
		'post_type'    => 'page',
		'post_status'  => 'publish',
		'post_content' => '', // Elementor handles content
		'meta_input'   => array(
			'_elementor_edit_mode'     => 'builder',
			'_elementor_template_type' => 'wp-page',
			'_elementor_version'       => $elementor_version,
			'_elementor_data'          => wp_slash( wp_json_encode( $elements ) ),
		),
	)
);

if ( is_wp_error( $post_id ) ) {
	echo "Error creating page: {$post_id->get_error_message()}\n";
	exit( 1 );
}

// Clear Elementor cache for the new page
delete_post_meta( $post_id, '_elementor_css' );
delete_post_meta( $post_id, '_elementor_element_cache' );

echo "\nE2E test page created successfully!\n";
echo "Page ID: {$post_id}\n";
echo "URL: /{$test_page_slug}/\n";
echo "\nElements created:\n";
foreach ( $element_ids as $name => $id ) {
	echo "  - {$name}: [data-id=\"{$id}\"]\n";
}
echo "\nPresets used:\n";
echo "  - e2e_heading_xl (typography font-size)\n";
echo "  - e2e_inverted (inverted min/max)\n";
echo "  - e2e_negative_margin (negative values)\n";
echo "  - e2e_gap_standard (spacer height)\n";
echo "  - e2e_gap_large (container gap)\n";
echo "  - e2e_custom_breakpoints (custom screen width)\n";
echo "  - e2e_mixed_units, e2e_em_line_height, e2e_mixed_inverted, e2e_custom_breakpoints_rem (unit-aware)\n";
