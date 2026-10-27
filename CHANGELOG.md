# Changelog

## 2.6.1 – October 27, 2026

* fixed: unlinking the Tablet or Mobile padding, margin or gap values with a fluid unit no longer resets the inherited values to 0.

## 2.6.0 – October 13, 2026

* added: themes and plugins can register preset groups in code (`arts/fluid_design_system/registered_groups` filter); these groups survive an Elementor Kit import and can't be renamed or deleted by mistake
* fixed: inline fluid values like "20px ~ 100px" didn't scale when the site had no presets in any group
* fixed: "Save as Preset" in the editor showed an error although the preset was saved, and the MCP create-preset tool returned an unreadable reply, when Elementor's CSS Print Method was set to Internal Embedding
* fixed: after undo or redo, a fluid control kept showing the old preset until the panel was reopened
* fixed: fluid controls and the "Save as Preset" dialog jumped in size while presets and groups were loading

## 2.5.5 – September 21, 2026

* fixed: the number field stayed visible next to the preset dropdown when a control used the fluid unit

## 2.5.4 – September 20, 2026

* improved: smaller plugin package and more reliable installation and update process
* improved: updated internal build tools and dependencies for improved stability and security

## 2.5.3 – August 13, 2026

* improved: full compatibility with WordPress 7.1

## 2.5.2 – July 16, 2026

* fixed: the preset dialog could be closed with the Escape key while saving, hiding save errors
* fixed: the Save button in the "Edit Preset" dialog could stay disabled on slow connections
* fixed: preset groups created outside the editor now appear in the save dialog without reloading
* fixed: retrying after a failed save could create duplicate presets
* improved: preset names display consistently after saving

## 2.5.1 – July 4, 2026

* fixed: presets created or edited directly in the editor could disappear after saving Site Settings
* fixed: fatal error when Elementor is deactivated while the plugin is active (WordPress 6.9+)
* improved: overall stability and reliability

## 2.5.0 – June 25, 2026

* added: preview the smallest and largest screen sizes of a fluid value while editing, without switching device mode

## 2.4.1 – May 21, 2026

* improved: full compatibility with WordPress 7.0

## 2.4.0 – April 7, 2026

* fixed: fluid presets now display correctly in the "Show global settings" styleguide preview
* fixed: plugin styles and scripts not loading on some hosting providers with symlinked directories (e.g. Hostinger)
* improved: updated internal dependencies with latest security patches

## 2.3.0 – March 22, 2026

* added: AI agent integration via WordPress Abilities API and MCP server
* added: MCP tools for programmatic preset and group management (list, create, update, delete, move)
* fixed: background position and similar styles could render incorrectly when using fluid presets

## 2.2.2 – March 19, 2026

* fixed: prevent double widget initialization in Elementor editor when used alongside themes bundling arts/elementor-extension

## 2.2.1 – January 21, 2026

* fixed: prevent duplicate widget handler scripts when multiple plugins bundle arts/elementor-extension

## 2.2.0 – January 13, 2026

* fixed: resolved conflicts with themes and plugins using older shared libraries
* improved: enhanced security with better input validation
* improved: overall code quality and reliability

## 2.1.0 – January 4, 2026

* added: faster workflow - adjust preset values without leaving Elementor editor
* improved: see how changes affect your design as you type

## 2.0.1 – January 3, 2026

* fixed: custom fluid values now sync correctly when dimensions are linked

## 2.0.0 – December 29, 2025

* added: set fluid values directly in controls ("20px ~ 100px") without visiting Site Settings
* added: save inline values as reusable presets with one click
* improved: full support for linked dimensions and gaps

## 1.2.1 – December 28, 2025

* fixed: preset min/max values are now preserved when switching between different units
* improved: better validation for preset data to prevent display issues

## 1.2.0 – December 23, 2025

* improved: enhanced code quality and reliability for better performance
* improved: updated to modern PHP standards for improved security
* updated: minimum PHP requirement is now 8.0 (WordPress and Elementor fully support PHP 8.0+)

## 1.1.2 – November 18, 2025

* improved: preset search now shows all presets when group name matches

## 1.1.1 – September 9, 2025

* improved: security fixes

## 1.1.0 – September 9, 2025

* added: Admin interface for managing preset groups (Elementor > Fluid Design System)
* added: Cross-group preset management with drag and drop functionality
* added: Custom preset groups creation, editing, and deletion
* added: Developer-friendly filter-based groups with code examples
* improved: optimize CSS generation for formulas with equal min/max values
* improved: improve fluid preset display for equal min/max values
* improved: add display_value support for custom presets added via hooks

## 1.0.6 – July 17, 2025

* added: 'em' unit support to size options in Fluid Typography and Spacing controls
* added: full support for negative values
* improved: proper scale when min value is larger than max value

## 1.0.5 – June 1, 2025

* fixed: improve performance in Elementor editor when working with "fluid" unit

## 1.0.4 – May 30, 2025

* fixed: "custom" units stopped to render correct values in Elementor editor when the plugin is active

## 1.0.3 – May 6, 2025

* fixed: PHP Warning "Undefined array key" when saving presets

## 1.0.2 – May 4, 2025

* fixed: plugin error when Elementor is not active

## 1.0.1 – April 29, 2025

* added: plugin action links to WordPress admin plugins page

## 1.0.0 – April 29, 2025

* Initial release
