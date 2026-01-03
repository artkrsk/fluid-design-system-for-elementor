# Developer Guide

Welcome to the developer documentation for Fluid Design System for Elementor. This section covers filters, hooks, and architectural details for extending the plugin.

## Quick Links

- **[Filters & Hooks Reference](/developers/filters-hooks)** - Complete API reference
- **[Custom Presets](/developers/custom-presets)** - Add programmatic presets
- **[Architecture](/developers/architecture)** - Plugin structure and patterns

## Overview

Fluid Design System for Elementor is built with extensibility in mind. The plugin provides:

- **Filters** to customize behavior and output
- **Actions** to hook into plugin lifecycle events
- **Programmatic preset registration** for theme integration
- **Manager-based architecture** for clean separation of concerns

## Common Use Cases

### Theme Integration

Add design system presets directly from your theme:

```php
add_filter('arts/fluid_design_system/custom_presets', function($groups) {
    $groups[] = [
        'name' => 'My Theme Design Tokens',
        'value' => [
            ['id' => 'theme-space-xs', 'title' => 'XS Space', 'value' => 'var(--theme-space-xs)'],
            ['id' => 'theme-space-s', 'title' => 'S Space', 'value' => 'var(--theme-space-s)'],
            ['id' => 'theme-space-m', 'title' => 'M Space', 'value' => 'var(--theme-space-m)'],
        ]
    ];
    return $groups;
});
```

### Custom Widget Support

Make custom Elementor widgets support fluid units:

```php
add_filter('arts/fluid_design_system/controls/is_eligible_for_fluid_unit', function($eligible, $control) {
    if ($control['type'] === 'my_custom_slider') {
        return true;
    }
    return $eligible;
}, 10, 2);
```

### Modify CSS Output

Customize the generated CSS:

```php
add_filter('arts/fluid_design_system/css/clamp_formula', function($formula, $parts) {
    // Use custom viewport calculation
    return "clamp({$parts['min_size']}, 5vw, {$parts['max_size']})";
}, 10, 2);
```

## Plugin Structure

```
src/php/
├── Base/                   # Base classes
│   ├── Plugin.php         # Main plugin class
│   ├── Manager.php        # Base manager (singleton pattern)
│   └── Container.php      # DI container
├── Elementor/             # Elementor integration
│   ├── Tabs/              # Site Settings tabs
│   └── Units/             # Fluid unit implementation
├── Managers/              # Feature managers
│   ├── Data.php           # Preset data management
│   ├── Groups.php         # Group management
│   ├── Units.php          # Unit registration
│   └── CSS.php            # CSS generation
└── admin/                 # Admin UI
```

## Getting Help

- 📖 Read the complete [Filters & Hooks Reference](/developers/filters-hooks)
- 💬 Ask questions in [GitHub Discussions](https://github.com/artkrsk/fluid-design-system-for-elementor/discussions)
- 🐛 Report bugs on [GitHub Issues](https://github.com/artkrsk/fluid-design-system-for-elementor/issues)
