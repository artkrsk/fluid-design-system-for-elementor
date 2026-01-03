# Filters & Hooks Reference

Complete reference of all filters and hooks available in Fluid Design System for Elementor.

## Filters

### Control Eligibility

#### `arts/fluid_design_system/controls/is_eligible_for_fluid_unit`

Determine if a specific control should support fluid units.

**Parameters**:
- `$default_eligible` (bool) - Default eligibility
- `$control` (array) - Elementor control data

**Returns**: `bool`

**Example**:
```php
add_filter('arts/fluid_design_system/controls/is_eligible_for_fluid_unit', function($default_eligible, $control) {
    // Make all controls with a specific class eligible
    if (isset($control['classes']) && strpos($control['classes'], 'my-fluid-control') !== false) {
        return true;
    }
    return $default_eligible;
}, 10, 2);
```

---

#### `arts/fluid_design_system/controls/eligible_for_fluid_unit`

Filter the complete list of eligible controls.

**Parameters**:
- `$eligible_controls` (array) - Eligible controls
- `$controls` (array) - All controls

**Returns**: `array`

**Example**:
```php
add_filter('arts/fluid_design_system/controls/eligible_for_fluid_unit', function($eligible_controls, $controls) {
    // Add a specific control to the eligible list
    if (isset($controls['my_custom_control'])) {
        $eligible_controls['my_custom_control'] = $controls['my_custom_control'];
    }
    return $eligible_controls;
}, 10, 2);
```

---

#### `arts/fluid_design_system/controls/eligible_types_for_selector_modification`

Add control types that should have their selectors modified for fluid units.

**Parameters**:
- `$eligible_control_types` (array) - Control types

**Returns**: `array`

**Example**:
```php
add_filter('arts/fluid_design_system/controls/eligible_types_for_selector_modification', function($eligible_control_types) {
    // Add support for a custom control type
    $eligible_control_types[] = 'my_custom_slider';
    return $eligible_control_types;
});
```

---

### CSS Output Customization

#### `arts/fluid_design_system/controls/modified_css_property`

Customize the CSS property output for fluid units.

**Parameters**:
- `$modified_css_property` (string) - Modified CSS property
- `$css_property` (string) - Original CSS property
- `$selector` (string) - CSS selector
- `$control` (array) - Control data
- `$value` (mixed) - Control value

**Returns**: `string`

**Example**:
```php
add_filter('arts/fluid_design_system/controls/modified_css_property', function($modified_css_property, $css_property, $selector, $control, $value) {
    // Add additional CSS properties for specific controls
    if ($control['name'] === 'my_special_control') {
        $modified_css_property .= '; transform: scale(var(--scale-factor))';
    }
    return $modified_css_property;
}, 10, 5);
```

---

#### `arts/fluid_design_system/css/var_preset`

Customize the CSS variable name for a preset.

**Parameters**:
- `$var_name` (string) - CSS variable name
- `$id` (string) - Preset ID

**Returns**: `string`

**Example**:
```php
add_filter('arts/fluid_design_system/css/var_preset', function($var_name, $id) {
    // Use a different naming convention for specific presets
    if (strpos($id, 'special-') === 0) {
        return '--my-custom-prefix-' . $id;
    }
    return $var_name;
}, 10, 2);
```

---

#### `arts/fluid_design_system/css/clamp_formula`

Customize the CSS clamp formula.

**Parameters**:
- `$formula` (string) - Generated clamp formula
- `$formula_parts` (array) - Formula components
  - `min_size` - Minimum size value
  - `max_size` - Maximum size value
  - `value_diff` - Difference between max and min
  - `viewport_calc` - Viewport calculation
  - `min_screen` - Minimum screen width
  - `max_screen` - Maximum screen width

**Returns**: `string`

**Example**:
```php
add_filter('arts/fluid_design_system/css/clamp_formula', function($formula, $formula_parts) {
    // Use a custom formula for specific cases
    if ($formula_parts['min_size'] === '0px') {
        // Create a formula that starts at 0 and grows more aggressively
        return "min(calc({$formula_parts['value_diff']} * {$formula_parts['viewport_calc']} / ({$formula_parts['max_screen']} * 0.8)), {$formula_parts['max_size']})";
    }
    return $formula;
}, 10, 2);
```

---

### Custom Presets

#### `arts/fluid_design_system/custom_presets`

Add custom preset groups programmatically.

**Parameters**:
- `$groups` (array) - Preset groups

**Returns**: `array`

**Example**:
```php
add_filter('arts/fluid_design_system/custom_presets', function($groups) {
    // Add a custom group for your theme
    $groups[] = [
        'name' => 'My Theme Design Tokens',
        'description' => 'Consistent design values for My Theme',
        'value' => [
            [
                'id' => 'theme-space-xs',
                'title' => 'Extra Small Space',
                'value' => 'var(--theme-space-xs)',
            ],
            [
                'id' => 'theme-border-radius',
                'title' => 'Theme Border Radius',
                'value' => '8px',
            ],
            [
                'id' => 'theme-gap-large',
                'title' => 'Large Gap',
                'value' => 'var(--theme-gap-large)',
                'display_value' => '2rem', // Show custom text in UI
            ],
        ],
    ];
    return $groups;
});
```

**Important Notes**:
- Values must be valid CSS (CSS variables, pixels, rems, etc.)
- CSS variables require separate CSS generation
- Groups appear in fluid unit dropdowns (not in Site Settings)
- Use `display_value` for user-friendly labels

---

## Actions

### Control Modification

#### `arts/fluid_design_system/controls/after_add_fluid_unit`

Fired after fluid unit has been added to an element's controls.

**Parameters**:
- `$element` (object) - Elementor element instance
- `$section_id` (string) - Section ID
- `$args` (array) - Section arguments
- `$units_instance` (object) - Fluid units manager instance

**Example**:
```php
add_action('arts/fluid_design_system/controls/after_add_fluid_unit', function($element, $section_id, $args, $units_instance) {
    // Only target a specific element or section
    if ($element->get_name() === 'my-custom-element' && $section_id === 'style_section') {
        $controls = $element->get_controls();

        // Add fluid unit to a specific control
        if (isset($controls['my_custom_spacing'])) {
            $control = $controls['my_custom_spacing'];
            $control['size_units'][] = 'fluid';
            $element->update_control('my_custom_spacing', $control);
        }
    }
}, 10, 4);
```

---

## Complete Example: Custom Widget Support

Here's a comprehensive example showing how to add fluid unit support to a custom Elementor widget:

```php
/**
 * Add fluid unit support to a custom Elementor widget.
 */
function my_theme_add_fluid_support_to_custom_widget() {
    // 1. Define which controls should use fluid units
    add_filter('arts/fluid_design_system/controls/is_eligible_for_fluid_unit', function($default_eligible, $control) {
        // Make all dimension controls in our widget eligible
        if (isset($control['parent']) && $control['parent'] === 'my_custom_widget' && $control['type'] === 'dimensions') {
            return true;
        }
        return $default_eligible;
    }, 10, 2);

    // 2. Modify the CSS output for our custom widget
    add_filter('arts/fluid_design_system/controls/modified_css_property', function($modified_css_property, $css_property, $selector, $control, $value) {
        if (strpos($selector, '.my-custom-widget') !== false) {
            // Add additional CSS for our widget when using fluid units
            return $modified_css_property . '; transition: all 0.3s ease-in-out;';
        }
        return $modified_css_property;
    }, 10, 5);

    // 3. Use an action to manually add fluid units to controls
    add_action('arts/fluid_design_system/controls/after_add_fluid_unit', function($element, $section_id, $args, $units_instance) {
        if ($element->get_name() === 'my_custom_widget' && $section_id === 'section_style') {
            // Manually update a specific control
            $element->update_control('custom_padding', [
                'size_units' => ['px', '%', 'em', 'rem', 'fluid'],
            ]);
        }
    }, 10, 4);
}
add_action('init', 'my_theme_add_fluid_support_to_custom_widget');
```

---

## Best Practices

### Filter Priority

Use appropriate priorities to ensure your filters run at the right time:

```php
// Run early (before plugin's defaults)
add_filter('...', 'callback', 5);

// Run at default priority
add_filter('...', 'callback', 10);

// Run late (after plugin's processing)
add_filter('...', 'callback', 20);
```

### Validation

Always validate data in your filters:

```php
add_filter('arts/fluid_design_system/custom_presets', function($groups) {
    $new_group = [
        'name' => 'My Presets',
        'value' => []
    ];

    // Validate before adding
    if (is_array($groups)) {
        $groups[] = $new_group;
    }

    return $groups;
});
```

### Performance

Keep filter callbacks lightweight:

```php
// ❌ Bad - expensive operation on every call
add_filter('...', function($value) {
    $data = get_option('expensive_query'); // Avoid
    return $value;
});

// ✅ Good - cache expensive operations
add_filter('...', function($value) {
    static $cached = null;
    if ($cached === null) {
        $cached = get_option('expensive_query');
    }
    return $value;
});
```

---

## Next Steps

- **[Custom Presets Guide](/developers/custom-presets)** - Detailed preset implementation
- **[Architecture](/developers/architecture)** - Plugin structure and patterns
- **[GitHub Repository](https://github.com/artkrsk/fluid-design-system-for-elementor)** - Source code and examples
