# Architecture

Fluid Design System for Elementor uses a manager-based architecture with clean separation of concerns.

## Plugin Structure

```
src/php/
├── Base/                   # Base classes
│   ├── Plugin.php         # Main plugin singleton
│   ├── Manager.php        # Base manager pattern
│   └── Container.php      # Dependency injection
├── Elementor/             # Elementor integration
│   ├── Tabs/              # Site Settings tabs
│   └── Units/             # Fluid unit implementation
├── Managers/              # Feature managers
│   ├── Data.php           # Preset data
│   ├── Groups.php         # Group management
│   ├── Units.php          # Unit registration
│   └── CSS.php            # CSS generation
└── admin/                 # Admin UI
```

## Key Patterns

- **Singleton managers** for centralized state
- **View extensions** for Elementor controls
- **Hook-based integration** for non-invasive extension
- **PSR-4 autoloading** for clean namespacing

See the [source code on GitHub](https://github.com/artkrsk/fluid-design-system-for-elementor) for implementation details.
