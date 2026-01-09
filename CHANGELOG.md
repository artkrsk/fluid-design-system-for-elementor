# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [2.1.0]

### Added

- faster workflow - adjust preset values without leaving Elementor editor

### Changed

- see how changes affect your design as you type


## [2.0.1]

### Fixed

- custom fluid values now sync correctly when dimensions are linked


## [2.0.0]

### Added

- set fluid values directly in controls ("20px ~ 100px") without visiting Site Settings
- save inline values as reusable presets with one click

### Changed

- full support for linked dimensions and gaps


## [1.2.1]

### Changed

- better validation for preset data to prevent display issues

### Fixed

- preset min/max values are now preserved when switching between different units


## [1.2.0]

### Changed

- enhanced code quality and reliability for better performance
- updated to modern PHP standards for improved security
- minimum PHP requirement is now 8.0 (WordPress and Elementor fully support PHP 8.0+)


## [1.1.2]

### Changed

- preset search now shows all presets when group name matches


## [1.1.1]

### Changed

- security fixes


## [1.1.0]

### Added

- Admin interface for managing preset groups (Elementor > Fluid Design System)
- Cross-group preset management with drag and drop functionality
- Custom preset groups creation, editing, and deletion
- Developer-friendly filter-based groups with code examples

### Changed

- optimize CSS generation for formulas with equal min/max values
- improve fluid preset display for equal min/max values
- add display_value support for custom presets added via hooks


## [1.0.6]

### Added

- 'em' unit support to size options in Fluid Typography and Spacing controls
- full support for negative values

### Changed

- proper scale when min value is larger than max value


## [1.0.5]

### Fixed

- improve performance in Elementor editor when working with "fluid" unit


## [1.0.4]

### Fixed

- "custom" units stopped to render correct values in Elementor editor when the plugin is active


## [1.0.3]

### Fixed

- PHP Warning "Undefined array key" when saving presets


## [1.0.2]

### Fixed

- plugin error when Elementor is not active


## [1.0.1]

### Added

- plugin action links to WordPress admin plugins page


## [1.0.0]

### Changed

- Initial release
