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

## AI Agents (MCP)

The plugin registers a dedicated [MCP](https://modelcontextprotocol.io/) server that lets AI agents manage presets and preset groups programmatically.

### Requirements

- WordPress 6.9+ (ships with the Abilities API)
- [MCP Adapter](https://github.com/WordPress/mcp-adapter) plugin installed and active

### Available Tools

| Tool                         | Description                                          |
| ---------------------------- | ---------------------------------------------------- |
| `fluid/list-preset-groups`   | Lists all groups with metadata                       |
| `fluid/get-preset-group`     | Returns a group and its presets                      |
| `fluid/create-preset-group`  | Creates a custom group                               |
| `fluid/rename-preset-group`  | Renames a custom group                               |
| `fluid/delete-preset-group`  | Deletes a custom group and its presets               |
| `fluid/list-presets`         | Lists presets across all or a specific group         |
| `fluid/get-preset`           | Returns a single preset by ID                        |
| `fluid/create-preset`        | Creates a preset (plugin computes the clamp formula) |
| `fluid/update-preset`        | Renames a preset or moves it to another group        |
| `fluid/delete-preset`        | Removes a preset                                     |
| `fluid/move-preset-to-group` | Moves a preset between groups atomically             |

Read tools require `edit_posts`, write tools require `manage_options`.

### Connecting via WP-CLI

```bash
# List available MCP servers
wp mcp-adapter list

# Start STDIO session
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | \
  wp mcp-adapter serve --user=admin --server=fluid-design-system
```

### Connecting Claude Code

Create a `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "fluid-design-system": {
      "command": "wp",
      "args": [
        "--path=/path/to/wordpress",
        "mcp-adapter",
        "serve",
        "--server=fluid-design-system",
        "--user=admin"
      ]
    }
  }
}
```

Adjust `--path` and `--user` for your environment. If using Local by Flywheel, you'll need the full PHP binary path and a `-d mysqli.default_socket=...` argument.

### Logging

Every tool execution fires the `arts/fluid_design_system/ability_executed` action:

```php
add_action('arts/fluid_design_system/ability_executed', function($log_entry) {
    // $log_entry contains: ability, user_id, timestamp, input, success
    error_log('Fluid DS: ' . $log_entry['ability'] . ' by user ' . $log_entry['user_id']);
});
```

When `WP_DEBUG_LOG` is enabled, executions are also written to the WordPress debug log automatically.

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

## Need Help?

- 📖 [User Guide](/guide)
- 💬 [WordPress.org Support](https://wordpress.org/support/plugin/fluid-design-system-for-elementor/)
- 🐛 [GitHub Issues](https://github.com/artkrsk/fluid-design-system-for-elementor/issues)
