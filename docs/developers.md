# Developer Reference

Filters and hooks for extending Fluid Design System for Elementor.

## Custom Presets

Add preset groups programmatically.

### `arts/fluid_design_system/custom_presets`

```php
add_filter('arts/fluid_design_system/custom_presets', function($groups) {
    $groups[] = [
        'name' => 'My Theme Tokens',
        'description' => 'Design tokens for My Theme',
        'value' => [
            [
                'id' => 'theme-space-xs',
                'title' => 'XS Space',
                'value' => 'var(--theme-space-xs)',
            ],
            [
                'id' => 'theme-space-s',
                'title' => 'S Space',
                'value' => 'var(--theme-space-s)',
                'display_value' => '1rem', // Optional: show instead of CSS var
            ],
        ],
    ];
    return $groups;
});
```

## Control Eligibility

### `arts/fluid_design_system/controls/is_eligible_for_fluid_unit`

Determine if a control should support fluid units.

```php
add_filter('arts/fluid_design_system/controls/is_eligible_for_fluid_unit', function($eligible, $control) {
    if ($control['type'] === 'my_custom_slider') {
        return true;
    }
    return $eligible;
}, 10, 2);
```

### `arts/fluid_design_system/controls/eligible_for_fluid_unit`

Filter the complete list of eligible controls.

```php
add_filter('arts/fluid_design_system/controls/eligible_for_fluid_unit', function($eligible_controls, $controls) {
    if (isset($controls['my_custom_control'])) {
        $eligible_controls['my_custom_control'] = $controls['my_custom_control'];
    }
    return $eligible_controls;
}, 10, 2);
```

### `arts/fluid_design_system/controls/eligible_types_for_selector_modification`

Add control types for selector modification.

```php
add_filter('arts/fluid_design_system/controls/eligible_types_for_selector_modification', function($types) {
    $types[] = 'my_custom_slider';
    return $types;
});
```

## CSS Customization

### `arts/fluid_design_system/controls/modified_css_property`

Modify CSS property output.

```php
add_filter('arts/fluid_design_system/controls/modified_css_property', function($css, $property, $selector, $control, $value) {
    if ($control['name'] === 'my_special_control') {
        $css .= '; transform: scale(var(--scale-factor))';
    }
    return $css;
}, 10, 5);
```

### `arts/fluid_design_system/css/var_preset`

Customize CSS variable names.

```php
add_filter('arts/fluid_design_system/css/var_preset', function($var_name, $id) {
    if (strpos($id, 'special-') === 0) {
        return '--custom-' . $id;
    }
    return $var_name;
}, 10, 2);
```

### `arts/fluid_design_system/css/clamp_formula`

Customize the clamp formula.

```php
add_filter('arts/fluid_design_system/css/clamp_formula', function($formula, $parts) {
    // Use custom viewport calculation
    return "clamp({$parts['min_size']}, 5vw, {$parts['max_size']})";
}, 10, 2);
```

## Actions

### `arts/fluid_design_system/controls/after_add_fluid_unit`

Fired after fluid unit is added to controls.

```php
add_action('arts/fluid_design_system/controls/after_add_fluid_unit', function($element, $section_id, $args, $units) {
    if ($element->get_name() === 'my-widget' && $section_id === 'style_section') {
        $element->update_control('custom_padding', [
            'size_units' => ['px', '%', 'em', 'rem', 'fluid'],
        ]);
    }
}, 10, 4);
```

## Complete Example

Add fluid support to a custom widget:

```php
function my_theme_add_fluid_support() {
    // 1. Make dimension controls eligible
    add_filter('arts/fluid_design_system/controls/is_eligible_for_fluid_unit', function($eligible, $control) {
        if ($control['parent'] === 'my_widget' && $control['type'] === 'dimensions') {
            return true;
        }
        return $eligible;
    }, 10, 2);

    // 2. Modify CSS output
    add_filter('arts/fluid_design_system/controls/modified_css_property', function($css, $property, $selector, $control, $value) {
        if (strpos($selector, '.my-widget') !== false) {
            return $css . '; transition: all 0.3s ease';
        }
        return $css;
    }, 10, 5);

    // 3. Manually add fluid unit to controls
    add_action('arts/fluid_design_system/controls/after_add_fluid_unit', function($element, $section_id, $args, $units) {
        if ($element->get_name() === 'my_widget') {
            $element->update_control('custom_padding', [
                'size_units' => ['px', '%', 'em', 'rem', 'fluid'],
            ]);
        }
    }, 10, 4);
}
add_action('init', 'my_theme_add_fluid_support');
```

## Resources

- [GitHub Repository](https://github.com/artkrsk/fluid-design-system-for-elementor)
- [WordPress.org Plugin](https://wordpress.org/plugins/fluid-design-system-for-elementor/)
- [Report Issues](https://github.com/artkrsk/fluid-design-system-for-elementor/issues)
