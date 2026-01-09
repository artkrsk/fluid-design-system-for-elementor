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
	'headingXl'             => 'e2e-heading-xl',
	'headingInverted'       => 'e2e-heading-inverted',
	'containerNegative'     => 'e2e-container-negative', // Separate container for negative margin (not in flex)
	'spacerStandard'        => 'e2e-spacer-standard',
	'containerGap'          => 'e2e-container-gap',
	'buttonDimensions'      => 'e2e-button-dimensions',
	'customBreakpoint'      => 'e2e-custom-breakpoint',
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

// Build Elementor elements structure
$main_container_id       = e2e_generate_id();
$heading_xl_id           = e2e_generate_id();
$heading_inverted_id     = e2e_generate_id();
$negative_container_id   = e2e_generate_id(); // Separate top-level container for negative margin
$negative_inner_text_id  = e2e_generate_id();
$spacer_id               = e2e_generate_id();
$gap_container_id        = e2e_generate_id();
$gap_child1_id           = e2e_generate_id();
$gap_child2_id           = e2e_generate_id();
$button_id               = e2e_generate_id();
$custom_breakpoint_id    = e2e_generate_id();
$inner_text1_id          = e2e_generate_id();
$inner_text2_id          = e2e_generate_id();
$custom_bp_heading_id    = e2e_generate_id();

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
					'title'                   => 'Fluid Heading XL',
					'_element_id'             => $element_ids['headingXl'],
					'header_size'             => 'h1',
					'typography_typography'   => 'custom',
					'typography_font_size'    => array(
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
					'title'                   => 'Inverted Preset (shrinks on desktop)',
					'_element_id'             => $element_ids['headingInverted'],
					'header_size'             => 'h2',
					'typography_typography'   => 'custom',
					'typography_font_size'    => array(
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
			// Container with fluid gap between children
			array(
				'id'       => $gap_container_id,
				'elType'   => 'container',
				'settings' => array(
					'_element_id'     => $element_ids['containerGap'],
					'flex_direction'  => 'row',
					'flex_gap'        => array(
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
					'_element_id'      => $element_ids['buttonDimensions'],
					'text'             => 'Fluid Padding Button',
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
					'title'                   => 'Custom Breakpoints (400-1600)',
					'_element_id'             => $element_ids['customBreakpoint'],
					'header_size'             => 'h2',
					'typography_typography'   => 'custom',
					'typography_font_size'    => array(
						'unit' => 'fluid',
						'size' => e2e_get_preset_var( 'e2e_custom_breakpoints' ),
					),
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
			'_element_id'     => $element_ids['containerNegative'],
			'content_width'   => 'full',
			'background_color' => '#ffe0e0',
			'padding'         => array(
				'unit'   => 'px',
				'top'    => '20',
				'right'  => '20',
				'bottom' => '20',
				'left'   => '20',
			),
			'margin'          => array(
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
