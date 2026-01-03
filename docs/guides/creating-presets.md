# Creating Presets

Presets are reusable fluid values that you can apply across your entire website. This guide covers everything you need to know about creating and managing presets.

## Typography Presets

Typography presets control fluid font sizes that scale smoothly across different screen sizes.

### Basic Typography Preset

1. Open Elementor editor
2. Go to **Site Settings > Fluid Typography & Spacing**
3. In **Typography Presets** section, click **Add Item**
4. Configure your preset:
   - **Label**: `Heading Large` (descriptive name)
   - **Min Size**: `24px` (mobile size)
   - **Max Size**: `72px` (desktop size)
   - **Unit**: `px`, `em`, or `rem`
5. Click **Update**

### Common Typography Scale

Here's a recommended set of typography presets:

| Preset Name | Min Size | Max Size | Use Case |
|------------|----------|----------|----------|
| Display | 36px | 96px | Hero headings |
| H1 | 28px | 64px | Page titles |
| H2 | 24px | 48px | Section headings |
| H3 | 20px | 36px | Subsection headings |
| H4 | 18px | 28px | Card titles |
| Body Large | 18px | 22px | Lead paragraphs |
| Body | 16px | 18px | Body text |
| Small | 14px | 16px | Captions, footnotes |

## Spacing Presets

Spacing presets control fluid padding, margins, and gaps.

### Basic Spacing Preset

1. In **Spacing Presets** section, click **Add Item**
2. Configure your preset:
   - **Label**: `Section Padding Large`
   - **Min Size**: `40px`
   - **Max Size**: `160px`
3. Click **Update**

### Spacing Scale Example

| Preset Name | Min Size | Max Size | Use Case |
|------------|----------|----------|----------|
| Space XL | 80px | 200px | Major sections |
| Space L | 40px | 120px | Section padding |
| Space M | 24px | 64px | Element spacing |
| Space S | 16px | 32px | Small gaps |
| Space XS | 8px | 16px | Micro spacing |

## Custom Breakpoints

By default, presets scale between the global breakpoints (360px to 1920px). You can override this for individual presets.

### Using Custom Breakpoints

1. Create or edit a preset
2. Toggle **Custom Breakpoints** switch
3. Set **Min Screen** (e.g., 768px for tablet)
4. Set **Max Screen** (e.g., 1440px for laptop)
5. Click **Update**

**Use Cases**:
- Tablet-only scaling
- Desktop-specific adjustments
- Ultra-wide screen limits

## Mixing Units

You can mix different units in a single preset:

- **Min**: `3em`, **Max**: `160px`
- **Min**: `1.5rem`, **Max**: `4rem`
- **Min**: `20px`, **Max**: `5vw`

The plugin automatically generates the correct CSS `clamp()` formula.

## Best Practices

### Naming Conventions

Use descriptive names that indicate:
- **Purpose**: "Heading Large" not "Preset 1"
- **Context**: "Hero Title" not "Big Text"
- **Scale**: "Space XL" not "Padding 5"

### Consistent Scales

Use a mathematical scale (e.g., 1.25x, 1.5x, 2x) for harmony:

```
16px → 20px (1.25x)
20px → 25px (1.25x)
25px → 31px (1.24x)
```

Or use the classic type scale:
```
12, 14, 16, 18, 21, 24, 28, 32, 48, 64, 72
```

### Start Small

Begin with 5-8 essential presets:
- 3 typography presets (H1, H2, Body)
- 3-5 spacing presets (XL, L, M, S)

Add more as needed based on your design system.

### Test Responsively

After creating presets:
1. Apply them to elements
2. Preview at different viewport sizes
3. Adjust min/max values if needed
4. Use Chrome DevTools to test intermediate sizes

## Next Steps

- **[Inline Values](/guides/inline-values)** - Set values directly in controls
- **[Custom Groups](/guides/custom-groups)** - Organize presets into groups
- **[Examples](/examples/fluid-typography)** - See presets in action
