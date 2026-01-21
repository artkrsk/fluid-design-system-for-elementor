# Changelog

## 2.2.1

- fixed: prevent duplicate widget handler scripts when multiple plugins bundle arts/elementor-extension

## 2.2.0

- fixed: resolved conflicts with themes and plugins using older shared libraries
- improved: enhanced security with better input validation
- improved: overall code quality and reliability

## 2.1.0

- added: faster workflow - adjust preset values without leaving Elementor editor
- improved: see how changes affect your design as you type

## 2.0.1

- fixed: custom fluid values now sync correctly when dimensions are linked

## 2.0.0

- added: set fluid values directly in controls ("20px ~ 100px") without visiting Site Settings
- added: save inline values as reusable presets with one click
- improved: full support for linked dimensions and gaps

## 1.2.1

- fixed: preset min/max values are now preserved when switching between different units
- improved: better validation for preset data to prevent display issues

## 1.2.0

- improved: enhanced code quality and reliability for better performance
- improved: updated to modern PHP standards for improved security
- updated: minimum PHP requirement is now 8.0 (WordPress and Elementor fully support PHP 8.0+)

## 1.1.2

- improved: preset search now shows all presets when group name matches

## 1.1.1

- improved: security fixes

## 1.1.0

- added: Admin interface for managing preset groups (Elementor > Fluid Design System)
- added: Cross-group preset management with drag and drop functionality
- added: Custom preset groups creation, editing, and deletion
- added: Developer-friendly filter-based groups with code examples
- improved: optimize CSS generation for formulas with equal min/max values
- improved: improve fluid preset display for equal min/max values
- improved: add display_value support for custom presets added via hooks

## 1.0.6

- added: 'em' unit support to size options in Fluid Typography and Spacing controls
- added: full support for negative values
- improved: proper scale when min value is larger than max value

## 1.0.5

- fixed: improve performance in Elementor editor when working with "fluid" unit

## 1.0.4

- fixed: "custom" units stopped to render correct values in Elementor editor when the plugin is active

## 1.0.3

- fixed: PHP Warning "Undefined array key" when saving presets

## 1.0.2

- fixed: plugin error when Elementor is not active

## 1.0.1

- added: plugin action links to WordPress admin plugins page

## 1.0.0

- Initial release
