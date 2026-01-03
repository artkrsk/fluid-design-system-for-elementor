# Inline Fluid Values

Since version 2.0, you can set fluid values directly in Elementor controls without creating presets in Site Settings. This is perfect for quick adjustments and one-off values.

## Inline Syntax

Use the tilde (`~`) character to separate minimum and maximum values:

```
20px ~ 100px
```

That's it! The plugin automatically creates a fluid value that scales from 20px to 100px.

## How to Use

### Step 1: Select Fluid Unit

1. Select any element in Elementor
2. Find a control that supports custom units (padding, margin, font size, gap, etc.)
3. Click the **unit dropdown**
4. Select **fluid**

### Step 2: Enter Inline Value

In the input field, type your inline value:

```
20px ~ 100px
```

The element will immediately start scaling fluidly between these values.

### Examples

**Font Size**:
```
16px ~ 24px
```

**Section Padding**:
```
40px ~ 120px
```

**Element Gap**:
```
16px ~ 48px
```

**Margin**:
```
24px ~ 64px
```

## Save as Preset

If you find yourself reusing the same inline value, you can save it as a preset with one click:

1. Enter your inline value (e.g., `24px ~ 64px`)
2. Click the **Save as Preset** button next to the input
3. Enter a name for your preset (e.g., "Space Medium")
4. Click **Save**

The preset is instantly available in the dropdown for all controls!

## Linked Dimensions

Inline values work perfectly with linked dimensions and gaps:

### Linked Padding (All Sides)

1. Enable the **link icon** ⛓️
2. Enter inline value in one field: `40px ~ 120px`
3. All four sides (top, right, bottom, left) use the same fluid value

### Unlinked Dimensions

You can also set different inline values for each side:

- **Top**: `40px ~ 120px`
- **Right**: `20px ~ 40px`
- **Bottom**: `40px ~ 120px`
- **Left**: `20px ~ 40px`

### Column/Row Gaps

Works the same way:

```
24px ~ 64px
```

Both column and row gaps will scale fluidly.

## Mixed Approaches

You can mix inline values and presets in the same project:

- Use **presets** for common values (typography scale, standard spacing)
- Use **inline values** for unique, one-off adjustments

This gives you the best of both worlds: consistency AND flexibility.

## Technical Details

### Generated CSS

When you enter `20px ~ 100px`, the plugin generates:

```css
clamp(20px, calc(20px + (100 - 20) * ((100vw - 360px) / (1920 - 360))), 100px)
```

This formula:
- Ensures value never goes below 20px
- Scales linearly between 360px and 1920px viewport widths
- Caps at 100px maximum

### Custom Breakpoints

Inline values use global breakpoints by default (360px to 1920px). If you need custom breakpoints for a specific inline value, create a preset instead.

## Syntax Validation

The plugin validates your inline syntax:

✅ **Valid**:
- `20px ~ 100px`
- `16px~24px` (spaces optional)
- `1rem ~ 3rem`
- `0.5em ~ 2em`

❌ **Invalid**:
- `20px` (missing max value)
- `~ 100px` (missing min value)
- `20 ~ 100` (missing units)
- `20px - 100px` (wrong separator)

If syntax is invalid, the control shows an error and falls back to the previous value.

## Performance

Inline values have zero performance impact:
- CSS is generated once during save
- No JavaScript calculations at runtime
- Same performance as preset-based values

## Best Practices

### When to Use Inline Values

✅ **Good Use Cases**:
- One-off adjustments unique to a single element
- Quick prototyping and experimentation
- Values you won't reuse across the site

### When to Use Presets

✅ **Better as Presets**:
- Values used in multiple places
- Design system tokens
- Standard spacing/typography scales

### Conversion Strategy

1. Start with inline values while designing
2. Identify commonly used values
3. Convert frequently used inline values to presets
4. Build a consistent design system over time

## Keyboard Shortcuts

Speed up your workflow:

- Type `20~100` (plugin auto-adds units if missing `px`)
- Use **Tab** to move to next field
- Use **↑↓ arrows** to adjust values

## Next Steps

- **[Creating Presets](/guides/creating-presets)** - Convert inline values to presets
- **[Custom Groups](/guides/custom-groups)** - Organize your presets
- **[Examples](/examples/fluid-spacing)** - See inline values in real designs
