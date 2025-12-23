<?php

namespace Arts\FluidDesignSystem\Managers\Admin\Tabs\Groups;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

use Arts\FluidDesignSystem\Base\Manager as BaseManager;
use Arts\FluidDesignSystem\Managers\GroupsData;
use Arts\Utilities\Utilities;

class View extends BaseManager {
	/**
	 * Render the Groups tab content.
	 *
	 * @since 1.0.0
	 *
	 * @param array<string, mixed> $tab_data Tab data.
	 * @return void
	 */
	public function render( $tab_data ) {
		// Check managers availability
		if ( $this->managers === null || $this->managers->notices === null ) {
			return;
		}

		?>
		<?php if ( isset( $tab_data['title'] ) && is_string( $tab_data['title'] ) && ! empty( $tab_data['title'] ) ) : ?>
		<h2><?php echo esc_html( $tab_data['title'] ); ?></h2>
		<?php endif; ?>
		<?php if ( isset( $tab_data['description'] ) && is_string( $tab_data['description'] ) && ! empty( $tab_data['description'] ) ) : ?>
		<p><?php echo esc_html( $tab_data['description'] ); ?></p>
		<?php endif; ?>

		<?php
		// Add prominent link to Elementor settings for creating presets - right after title
		$settings_url = Utilities::get_elementor_editor_site_settings_url( 'arts-fluid-design-system-tab-fluid-typography-spacing' );
		if ( $settings_url ) :
			?>
			<div class="notice notice-info inline" style="margin: 20px 0; padding: 20px; border-left-color: #9b51e0;">
				<div style="display: flex; align-items: center; gap: 20px;">
					<div style="flex: 1;">
						<h3 style="margin: 0 0 8px 0; color: #1d2327;"><?php esc_html_e( 'Ready to Edit Your Fluid Presets?', 'fluid-design-system-for-elementor' ); ?></h3>
						<p style="margin: 0; color: #50575e;">
							<?php
							printf(
								/* translators: %s: Link to Elementor Site Settings */
								esc_html__( 'This panel only organizes your preset groups. To actually create and edit the fluid presets in live, visit %s.', 'fluid-design-system-for-elementor' ),
								sprintf(
									'<a href="%s" target="_blank" rel="noopener noreferrer">%s</a>',
									esc_url( $settings_url ),
									esc_html__( 'Elementor Site Settings', 'fluid-design-system-for-elementor' )
								)
							);
							?>
						</p>
					</div>
					<div>
						<a href="<?php echo esc_url( $settings_url ); ?>" class="button button-primary button-hero" style="padding: 12px 24px; height: auto; line-height: 1.2; white-space: nowrap;" target="_blank" rel="noopener noreferrer">
							<i class="eicon-elementor-square" aria-hidden="true" style="margin-right: 8px;"></i>
							<?php esc_html_e( 'Edit with Elementor', 'fluid-design-system-for-elementor' ); ?>
						</a>
					</div>
				</div>
			</div>
			<?php
		endif;
		?>

		<?php $this->managers->notices->display_notices(); ?>
		
		<!-- Main Table: Built-in + Custom Groups (Sortable) -->
		<div id="fluid-main-groups-table">
			<h3><?php esc_html_e( 'User Groups', 'fluid-design-system-for-elementor' ); ?></h3>
			<p class="description">
				<?php echo esc_html__( 'Create and organize custom preset groups for your design system.', 'fluid-design-system-for-elementor' ); ?>
			</p>
			<?php $this->render_main_groups_table(); ?>
		</div>
			<!-- Developer Table: Filter-based Groups (Read-only) -->
			<div id="fluid-developer-groups-table">
				<h3><?php esc_html_e( 'Developer Groups', 'fluid-design-system-for-elementor' ); ?></h3>
				<p class="description">
					<?php esc_html_e( 'These groups are added programmatically by themes or plugins and cannot be modified.', 'fluid-design-system-for-elementor' ); ?>
					<details style="margin-top: 10px; padding: 10px; background: #f0f0f1; border-radius: 4px;">
						<summary style="cursor: pointer; font-weight: 600; color: #2271b1;">
							<?php esc_html_e( 'Why use Developer Groups?', 'fluid-design-system-for-elementor' ); ?>
						</summary>
						<p style="margin: 15px 0 0 0; padding: 10px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 2px;">
							<?php
							echo sprintf(
								'%1$s<br>%2$s',
								esc_html__( 'Developer groups appear alongside built-in and custom groups in the fluid unit selector, giving users access to your existing design system tokens.', 'fluid-design-system-for-elementor' ),
								esc_html__( 'These are not editable by users and don\'t appear in Elementor Site Settings.', 'fluid-design-system-for-elementor' )
							);
							?>
						</p>
						<div style="margin-top: 15px; padding: 0 20px;">
							<p style="margin: 10px 0;">
								<strong><?php esc_html_e( 'Benefits of Developer Groups:', 'fluid-design-system-for-elementor' ); ?></strong>
							</p>
							<ul style="list-style: disc; margin: 10px 0 15px 20px;">
								<li><?php esc_html_e( 'Ship reusable preset collections with your theme or plugin.', 'fluid-design-system-for-elementor' ); ?></li>
								<li><?php esc_html_e( 'Maximum flexibility - define your own CSS rules for presets.', 'fluid-design-system-for-elementor' ); ?></li>
								<li><?php esc_html_e( 'Prevent accidental modifications by users.', 'fluid-design-system-for-elementor' ); ?></li>
							</ul>
							
							<p style="margin: 15px 0 10px 0;">
								<strong><?php esc_html_e( 'Example Implementation:', 'fluid-design-system-for-elementor' ); ?></strong>
							</p>
							<pre style="background: #282c34; color: #abb2bf; padding: 15px; border-radius: 4px; overflow-x: auto; font-size: 13px; line-height: 1.5;"><code><span style="color: #c678dd;">add_filter</span>( <span style="color: #98c379;">'arts/fluid_design_system/custom_presets'</span>, <span style="color: #c678dd;">function</span>( <span style="color: #e06c75;">$groups</span> ) {
	<span style="color: #5c6370;">// Add a custom group for your theme</span>
	<span style="color: #e06c75;">$groups</span>[] = <span style="color: #c678dd;">array</span>(
		<span style="color: #98c379;">'name'</span>        => <span style="color: #98c379;">'My Theme Design Tokens'</span>,
		<span style="color: #98c379;">'description'</span> => <span style="color: #98c379;">'Consistent design values for My Theme'</span>,
		<span style="color: #98c379;">'value'</span>       => <span style="color: #c678dd;">array</span>(
			<span style="color: #c678dd;">array</span>(
				<span style="color: #98c379;">'id'</span>    => <span style="color: #98c379;">'theme-space-xs'</span>,
				<span style="color: #98c379;">'title'</span> => <span style="color: #98c379;">'Extra Small Space'</span>,
				<span style="color: #98c379;">'value'</span> => <span style="color: #98c379;">'var(--theme-space-xs)'</span>,  <span style="color: #5c6370;">// CSS variable</span>
			),
			<span style="color: #c678dd;">array</span>(
				<span style="color: #98c379;">'id'</span>    => <span style="color: #98c379;">'theme-border-radius'</span>,
				<span style="color: #98c379;">'title'</span> => <span style="color: #98c379;">'Theme Border Radius'</span>,
				<span style="color: #98c379;">'value'</span> => <span style="color: #98c379;">'8px'</span>,  <span style="color: #5c6370;">// Border radius value</span>
			),
			<span style="color: #c678dd;">array</span>(
				<span style="color: #98c379;">'id'</span>           => <span style="color: #98c379;">'theme-gap-large'</span>,
				<span style="color: #98c379;">'title'</span>        => <span style="color: #98c379;">'Large Gap'</span>,
				<span style="color: #98c379;">'value'</span>        => <span style="color: #98c379;">'var(--theme-gap-large)'</span>,
				<span style="color: #98c379;">'display_value'</span> => <span style="color: #98c379;">'2rem'</span>,  <span style="color: #5c6370;">// Show custom text in UI</span>
			),
			<span style="color: #c678dd;">array</span>(
				<span style="color: #98c379;">'id'</span>    => <span style="color: #98c379;">'header-height'</span>,
				<span style="color: #98c379;">'title'</span> => <span style="color: #98c379;">'Header Height'</span>,
				<span style="color: #98c379;">'value'</span> => <span style="color: #98c379;">'var(--header-height)'</span>,  <span style="color: #5c6370;">// Dynamically set from JS</span>
			),
		),
	);

	<span style="color: #c678dd;">return</span> <span style="color: #e06c75;">$groups</span>;
});</code></pre>

							<p style="margin: 15px 0 10px 0;">
								<strong><?php esc_html_e( 'Important Notes:', 'fluid-design-system-for-elementor' ); ?></strong>
							</p>
							<ul style="list-style: disc; margin: 10px 0 15px 20px;">
								<li><?php esc_html_e( 'Values must be valid CSS - CSS variables, pixels, rems, percentages, etc.', 'fluid-design-system-for-elementor' ); ?></li>
								<li><?php esc_html_e( 'CSS variables require separate CSS generation - this filter only provides the values', 'fluid-design-system-for-elementor' ); ?></li>
								<li><?php esc_html_e( 'Groups appear in fluid unit dropdowns - not in Elementor Site Settings', 'fluid-design-system-for-elementor' ); ?></li>
								<li><?php esc_html_e( 'Use display_value to show user-friendly text instead of CSS variable names', 'fluid-design-system-for-elementor' ); ?></li>
							</ul>
							
							<p style="margin: 15px 0 10px 0;">
								<strong><?php esc_html_e( 'Where to add this code:', 'fluid-design-system-for-elementor' ); ?></strong>
							</p>
							<ul style="list-style: disc; margin: 10px 0 15px 20px;">
								<li><?php esc_html_e( 'In your theme\'s functions.php file', 'fluid-design-system-for-elementor' ); ?></li>
								<li><?php esc_html_e( 'In a custom plugin for your design system', 'fluid-design-system-for-elementor' ); ?></li>
								<li><?php esc_html_e( 'In a must-use plugin for network-wide consistency', 'fluid-design-system-for-elementor' ); ?></li>
							</ul>
						</div>
					</details>
				</p>
				<?php $this->render_developer_groups_table(); ?>
			</div>
		<?php
	}

	/**
	 * Get rendered HTML for main groups table body.
	 *
	 * @since 1.0.0
	 *
	 * @return string HTML for table body.
	 */
	public function get_main_groups_table_body_html() {
		ob_start();
		$this->render_main_groups_table_body();
		$output = ob_get_clean();
		return is_string( $output ) ? $output : '';
	}

	/**
	 * Get rendered HTML for developer groups table body.
	 *
	 * @since 1.0.0
	 *
	 * @return string HTML for table body.
	 */
	public function get_developer_groups_table_body_html() {
		ob_start();
		$this->render_developer_groups_table_body();
		$output = ob_get_clean();
		return is_string( $output ) ? $output : '';
	}

	/**
	 * Get complete main groups table HTML for AJAX responses.
	 *
	 * @since 1.0.0
	 *
	 * @return string Complete HTML table.
	 */
	public function get_main_groups_table_html() {
		ob_start();
		?>
		<table class="wp-list-table widefat fixed" id="fluid-groups-sortable">
			<?php $this->render_table_header(); ?>
			<tbody id="fluid-groups-tbody">
				<?php $this->render_main_groups_table_body(); ?>
			</tbody>
		</table>
		<?php
		$output = ob_get_clean();
		return is_string( $output ) ? $output : '';
	}

	/**
	 * Get complete developer groups table HTML for AJAX responses.
	 *
	 * @since 1.0.0
	 *
	 * @return string Complete HTML table.
	 */
	public function get_developer_groups_table_html() {
		ob_start();
		?>
		<table class="wp-list-table widefat fixed" id="fluid-developer-groups-table-list">
			<?php $this->render_table_header(); ?>
			<tbody>
				<?php $this->render_developer_groups_table_body(); ?>
			</tbody>
		</table>
		<?php
		$output = ob_get_clean();
		return is_string( $output ) ? $output : '';
	}

	/**
	 * Render the main groups table (built-in + custom, sortable).
	 *
	 * @since 1.0.0
	 * @access private
	 *
	 * @return void
	 */
	private function render_main_groups_table() {
		?>
		<form method="post" id="fluid-groups-form">
			<?php wp_nonce_field( 'fluid_groups_action', 'fluid_groups_nonce' ); ?>
			<input type="hidden" name="fluid_groups_action" value="save_all_changes">

			<table class="wp-list-table widefat fixed" id="fluid-groups-sortable">
				<?php $this->render_table_header(); ?>
				<tbody id="fluid-groups-tbody">
					<?php $this->render_main_groups_table_body(); ?>
				</tbody>
			</table>

			<div class="fluid-save-changes-row">
				<?php submit_button( esc_html__( 'Save Changes', 'fluid-design-system-for-elementor' ), 'primary', 'save_changes', false ); ?>
				<div class="fluid-status-area hidden"></div>
			</div>
		</form>		
		<?php
		// Separate delete form to avoid nesting
		?>
		<form method="post" id="fluid-delete-form" style="display: none;">
			<?php wp_nonce_field( 'fluid_groups_action', 'fluid_delete_nonce' ); ?>
			<input type="hidden" name="fluid_groups_action" value="delete_group">
			<input type="hidden" name="group_id" id="delete_group_id" value="">
		</form>
		<?php
	}

	/**
	 * Render the developer groups table (filter-based, read-only).
	 *
	 * @since 1.0.0
	 * @access private
	 *
	 * @return void
	 */
	private function render_developer_groups_table() {
		?>
		<table class="wp-list-table widefat fixed" id="fluid-developer-groups-table-list">
			<?php $this->render_table_header(); ?>
			<tbody>
				<?php $this->render_developer_groups_table_body(); ?>
			</tbody>
		</table>
		<?php
	}

	/**
	 * Render table header (shared between main and developer tables).
	 *
	 * @since 1.0.0
	 * @access private
	 *
	 * @return void
	 */
	private function render_table_header() {
		?>
		<thead>
			<tr>
				<th scope="col" class="manage-column column-order" style="width: 40px;">
					<?php esc_html_e( '#', 'fluid-design-system-for-elementor' ); ?>
				</th>
				<th scope="col" class="manage-column column-name">
					<?php esc_html_e( 'Name', 'fluid-design-system-for-elementor' ); ?>
				</th>
				<th scope="col" class="manage-column column-description">
					<?php esc_html_e( 'Description', 'fluid-design-system-for-elementor' ); ?>
				</th>
				<th scope="col" class="manage-column column-type" style="width: 120px;">
					<?php esc_html_e( 'Type', 'fluid-design-system-for-elementor' ); ?>
				</th>
				<th scope="col" class="manage-column column-presets" style="width: 100px;">
					<?php esc_html_e( 'Presets', 'fluid-design-system-for-elementor' ); ?>
				</th>
				<th scope="col" class="manage-column column-actions" style="width: 100px;">
					<?php esc_html_e( 'Actions', 'fluid-design-system-for-elementor' ); ?>
				</th>
			</tr>
		</thead>
		<?php
	}

	/**
	 * Render main groups table body content.
	 *
	 * @since 1.0.0
	 * @access private
	 *
	 * @return void
	 */
	private function render_main_groups_table_body() {
		$groups = GroupsData::get_main_groups();

		if ( ! empty( $groups ) ) {
			foreach ( $groups as $index => $group ) {
				$this->render_main_group_row( $group, $index + 1 );
			}
		} else {
			?>
			<tr class="no-groups-message">
				<td colspan="6" style="text-align: center; padding: 40px 20px; color: #646970;">
					<?php esc_html_e( 'No groups found. Create your first group below.', 'fluid-design-system-for-elementor' ); ?>
				</td>
			</tr>
			<?php
		}

		// Always include the inline add row at the end
		$this->render_inline_add_row();
	}

	/**
	 * Render developer groups table body content.
	 *
	 * @since 1.0.0
	 * @access private
	 *
	 * @return void
	 */
	private function render_developer_groups_table_body() {
		$groups = GroupsData::get_filter_groups();

		if ( ! empty( $groups ) ) {
			foreach ( $groups as $index => $group ) {
				$this->render_developer_group_row( $group, $index + 1 );
			}
		} else {
			?>
			<tr class="no-groups-message">
				<td colspan="6" style="text-align: center; padding: 40px 20px; color: #646970;">
					<?php esc_html_e( 'No developer groups found.', 'fluid-design-system-for-elementor' ); ?>
				</td>
			</tr>
			<?php
		}
	}

	/**
	 * Render a single group row for developer table (filter-based, read-only).
	 *
	 * @since 1.0.0
	 * @access private
	 *
	 * @param array<string, mixed> $group Group data.
	 * @param int                  $display_order Display order number.
	 * @return void
	 */
	private function render_developer_group_row( $group, $display_order = 1 ) {
		$group_name_raw    = isset( $group['name'] ) ? $group['name'] : ( isset( $group['title'] ) ? $group['title'] : esc_html__( 'Untitled Group', 'fluid-design-system-for-elementor' ) );
		$group_name        = is_string( $group_name_raw ) ? esc_html( $group_name_raw ) : esc_html__( 'Untitled Group', 'fluid-design-system-for-elementor' );
		$group_description = isset( $group['description'] ) && is_string( $group['description'] ) ? esc_html( $group['description'] ) : '';
		$preset_count      = isset( $group['value'] ) && is_array( $group['value'] ) ? count( $group['value'] ) : 0;

		// IMPORTANT: Generate a proper group ID for developer groups to prevent empty data-group-id
		if ( isset( $group['id'] ) && is_string( $group['id'] ) && ! empty( $group['id'] ) ) {
			$group_id = $group['id'];
		} else {
			$fallback_key = is_string( $group_name_raw ) ? sanitize_key( $group_name_raw ) : 'group';
			$group_id     = 'developer_' . $fallback_key . '_' . (string) $display_order;
		}

		// Developer groups are read-only, so no interactive elements
		$type_badge = '<span class="group-type-badge group-type-filter">' . esc_html__( 'Developer', 'fluid-design-system-for-elementor' ) . '</span>';

		?>
		<tr class="group-row group-filter" data-group-id="<?php echo esc_attr( $group_id ); ?>" data-order="<?php echo esc_attr( (string) $display_order ); ?>">
			<td class="column-order">
				<span class="order-number"><?php echo esc_html( (string) $display_order ); ?></span>
			</td>
			<td class="column-name">
				<div class="group-name-container">
					<span class="group-chevron dashicons dashicons-arrow-right-alt2" data-group-id="<?php echo esc_attr( $group_id ); ?>"></span>
					<strong><?php echo $group_name; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></strong>
				</div>
			</td>
			<td class="column-description">
				<?php echo ! empty( $group_description ) ? $group_description : '—'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
			</td>
			<td class="column-type">
				<?php echo $type_badge; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
			</td>
			<td class="column-presets">
				<?php echo esc_html( (string) $preset_count ); ?>
			</td>
			<td class="column-actions">
				—
			</td>
		</tr>
		<tr class="group-presets-row" data-group-id="<?php echo esc_attr( $group_id ); ?>">
			<td colspan="6" class="group-presets-content">
				<?php $this->render_group_presets( $group, true ); ?>
			</td>
		</tr>
		<?php
	}


	/**
	 * Render preset list for accordion content.
	 *
	 * @since 1.0.0
	 * @access private
	 *
	 * @param array<string, mixed> $group Group data.
	 * @param bool                 $is_developer_group Whether this is for a developer group (read-only).
	 * @return void
	 */
	private function render_group_presets( $group, $is_developer_group = false ) {
		$presets = isset( $group['value'] ) && is_array( $group['value'] ) ? $group['value'] : array();

		// Add wrapper div for smooth animations
		echo '<div class="group-presets-wrapper">';

		// Only add sortable class for non-developer groups
		$container_class = 'preset-list' . ( $is_developer_group ? '' : ' preset-sortable-list' );
		echo '<div class="' . esc_attr( $container_class ) . '">';

		// Always render real presets first
		if ( ! empty( $presets ) ) {
			foreach ( $presets as $preset ) {
				// Ensure preset is an array with string keys
				if ( is_array( $preset ) ) {
					/** @var array<string, mixed> $validated_preset */
					$validated_preset = $preset;
					$this->render_preset_item( $validated_preset, $group );
				}
			}
		}

		// Always render placeholder - JavaScript will handle visibility
		echo '<div class="preset-item preset-placeholder">';
		echo '<span class="preset-title">';
		echo esc_html__( 'No presets found.', 'fluid-design-system-for-elementor' );
		if ( ! $is_developer_group ) {
			echo ' ' . esc_html__( 'Drag presets here from other groups', 'fluid-design-system-for-elementor' );
		}
		echo '</span>';
		echo '</div>';

		echo '</div>';
		echo '</div>'; // Close wrapper
	}

	/**
	 * Render individual preset item - ENSURE PRESET IDs ARE ALWAYS SET.
	 *
	 * @since 1.0.0
	 * @access private
	 *
	 * @param array<string, mixed> $preset Preset data.
	 * @param array<string, mixed> $group Group data.
	 * @return void
	 */
	private function render_preset_item( $preset, $group ) {
		// Generate a fallback ID if missing to prevent empty data-preset-id
		$preset_id = isset( $preset['_id'] ) && is_string( $preset['_id'] ) && ! empty( $preset['_id'] )
		? esc_attr( $preset['_id'] )
		: 'preset_' . wp_generate_uuid4();

		$preset_title_raw = isset( $preset['title'] ) ? $preset['title'] : esc_html__( 'Untitled Preset', 'fluid-design-system-for-elementor' );
		$preset_title     = is_string( $preset_title_raw ) ? esc_html( $preset_title_raw ) : esc_html__( 'Untitled Preset', 'fluid-design-system-for-elementor' );

		?>
		<div class="preset-item" data-preset-id="<?php echo esc_attr( $preset_id ); ?>">
			<span class="preset-title"><?php echo $preset_title; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></span>
		</div>
		<?php
	}

	/**
	 * Render a single group row for main table (built-in + custom, all sortable).
	 *
	 * @since 1.0.0
	 * @access private
	 *
	 * @param array<string, mixed> $group Group data.
	 * @param int                  $display_order Display order number.
	 * @return void
	 */
	private function render_main_group_row( $group, $display_order = 1 ) {
		$group_type        = isset( $group['type'] ) && is_string( $group['type'] ) ? $group['type'] : 'unknown';
		$group_name_raw    = isset( $group['name'] ) ? $group['name'] : ( isset( $group['title'] ) ? $group['title'] : esc_html__( 'Untitled Group', 'fluid-design-system-for-elementor' ) );
		$group_name        = is_string( $group_name_raw ) ? esc_html( $group_name_raw ) : esc_html__( 'Untitled Group', 'fluid-design-system-for-elementor' );
		$group_description = isset( $group['description'] ) && is_string( $group['description'] ) ? esc_html( $group['description'] ) : '';
		$preset_count      = isset( $group['value'] ) && is_array( $group['value'] ) ? count( $group['value'] ) : 0;

		// Determine row classes and icons based on type
		$row_class     = '';
		$type_badge    = '';
		$order_display = '';
		$actions       = '';

		// All main groups are sortable now (built-in + custom)
		$editable       = ( $group_type === 'custom' ) ? 'true' : 'false';
		$editable_class = ( $group_type === 'custom' ) ? 'editable-title' : '';

		switch ( $group_type ) {
			case 'builtin':
				$row_class     = 'group-builtin sortable-row'; // Built-in groups are now sortable!
				$type_badge    = '<span class="group-type-badge group-type-builtin">' . esc_html__( 'Built-in', 'fluid-design-system-for-elementor' ) . '</span>';
				$order_display = '<span class="order-number order-draggable" data-order="' . esc_attr( (string) $display_order ) . '">' . esc_html( (string) $display_order ) . '</span>';
				$actions       = '—';
				break;

			case 'custom':
			default:
				$row_class     = 'group-custom sortable-row';
				$type_badge    = '<span class="group-type-badge group-type-custom">' . esc_html__( 'Custom', 'fluid-design-system-for-elementor' ) . '</span>';
				$order_display = '<span class="order-number order-draggable" data-order="' . esc_attr( (string) $display_order ) . '">' . esc_html( (string) $display_order ) . '</span>';
				$actions       = $this->render_custom_group_actions( $group );
				break;
		}

		$group_id = isset( $group['id'] ) && is_string( $group['id'] ) ? $group['id'] : '';
		?>
		<tr class="group-row <?php echo esc_attr( $row_class ); ?>" data-group-id="<?php echo esc_attr( $group_id ); ?>" data-group-type="<?php echo esc_attr( $group_type ); ?>">
			<td class="column-order">
				<?php echo $order_display; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				<?php if ( ! empty( $group_id ) ) : ?>
					<input type="hidden" name="group_order[]" value="<?php echo esc_attr( $group_id ); ?>" />
				<?php endif; ?>
			</td>
			<td class="column-name">
				<div class="group-name-container">
					<span class="group-chevron dashicons dashicons-arrow-right-alt2" data-group-id="<?php echo esc_attr( $group_id ); ?>"></span>
					<div class="<?php echo esc_attr( $editable_class ); ?>" data-editable="<?php echo esc_attr( $editable ); ?>" data-original-title="<?php echo esc_attr( $group_name ); ?>">
						<span class="title-text"><?php echo $group_name; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></span>
						<input type="text" class="title-input" value="<?php echo esc_attr( $group_name ); ?>" style="display: none;" />
					</div>
				</div>
				<?php if ( $group_type === 'custom' && ! empty( $group_id ) ) : ?>
					<input type="hidden" name="group_titles[<?php echo esc_attr( $group_id ); ?>]" value="<?php echo esc_attr( $group_name ); ?>" />
				<?php endif; ?>
			</td>
			<td class="column-description">
				<?php if ( $group_type === 'custom' ) : ?>
					<div class="editable-description" data-editable="true" data-original-description="<?php echo esc_attr( $group_description ); ?>">
						<span class="description-text"><?php echo ! empty( $group_description ) ? $group_description : ''; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></span>
						<input type="text" class="description-input" value="<?php echo esc_attr( $group_description ); ?>" style="display: none;" />
					</div>
					<?php if ( ! empty( $group_id ) ) : ?>
						<input type="hidden" name="group_descriptions[<?php echo esc_attr( $group_id ); ?>]" value="<?php echo esc_attr( $group_description ); ?>" />
					<?php endif; ?>
				<?php else : ?>
					<?php echo ! empty( $group_description ) ? $group_description : '—'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				<?php endif; ?>
			</td>
			<td class="column-type">
				<?php echo $type_badge; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
			</td>
			<td class="column-presets">
				<?php echo esc_html( (string) $preset_count ); ?>
			</td>
			<td class="column-actions">
				<?php echo $actions; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
			</td>
		</tr>
		<tr class="group-presets-row" data-group-id="<?php echo esc_attr( $group_id ); ?>">
			<td colspan="6" class="group-presets-content">
				<?php $this->render_group_presets( $group ); ?>
			</td>
		</tr>
		<?php
	}

	/**
	 * Render actions for custom groups (delete button).
	 *
	 * @since 1.0.0
	 * @access private
	 *
	 * @param array<string, mixed> $group Group data.
	 * @return string HTML for group actions.
	 */
	private function render_custom_group_actions( $group ) {
		if ( ! isset( $group['id'] ) || ! is_string( $group['id'] ) ) {
			return '';
		}

		return sprintf(
			'<button type="button" class="button-link fluid-delete-group" data-group-id="%s" title="%s">
				<span class="dashicons dashicons-trash"></span>
			</button>',
			esc_attr( $group['id'] ),
			esc_attr__( 'Delete Group', 'fluid-design-system-for-elementor' )
		);
	}

	/**
	 * Render inline add group row.
	 *
	 * @since 1.0.0
	 * @access private
	 *
	 * @return void
	 */
	private function render_inline_add_row() {
		?>
		<tr class="inline-add-row" id="inline-add-row">
			<td class="column-order">
				<span class="dashicons dashicons-plus-alt2" title="<?php esc_attr_e( 'Add New Group', 'fluid-design-system-for-elementor' ); ?>"></span>
			</td>
			<td class="column-name">
				<div class="editable-add-title">
					<span class="add-title-text"><?php esc_html_e( 'Add New Group...', 'fluid-design-system-for-elementor' ); ?></span>
					<input type="text" class="add-title-input" placeholder="<?php esc_attr_e( 'Enter group name...', 'fluid-design-system-for-elementor' ); ?>">
				</div>
			</td>
			<td class="column-description">
				<div class="editable-add-description">
					<span class="add-description-text" style="display: none;"></span>
					<input type="text" class="add-description-input" placeholder="<?php esc_attr_e( 'Enter description (optional)...', 'fluid-design-system-for-elementor' ); ?>">
				</div>
			</td>
			<td class="column-type">
				<!-- Empty in normal state -->
			</td>
			<td class="column-presets">
				<!-- Empty in normal state -->
			</td>
			<td class="column-actions">
				<div class="add-actions">
					<button type="button" class="add-group-save" title="<?php esc_attr_e( 'Save Group', 'fluid-design-system-for-elementor' ); ?>">
						<span class="dashicons dashicons-yes-alt"></span>
					</button>
					<button type="button" class="add-group-cancel" title="<?php esc_attr_e( 'Cancel', 'fluid-design-system-for-elementor' ); ?>">
						<span class="dashicons dashicons-undo"></span>
					</button>
				</div>
			</td>
		</tr>
		<?php
	}
}
