# Custom Presets

Add custom preset groups programmatically using the `arts/fluid_design_system/custom_presets` filter.

## Basic Example

```php
add_filter('arts/fluid_design_system/custom_presets', function($groups) {
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
                'id' => 'theme-space-s',
                'title' => 'Small Space',
                'value' => 'var(--theme-space-s)',
            ],
        ],
    ];
    return $groups;
});
```

See the [complete filters reference](/developers/filters-hooks) for more details.
