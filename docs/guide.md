# User Guide

Complete guide for using Fluid Design System for Elementor.

## Installation

Install from [WordPress.org Plugin Directory](https://wordpress.org/plugins/fluid-design-system-for-elementor/):

1. In WordPress admin, go to **Plugins > Add New**
2. Search for "Fluid Design System for Elementor"
3. Click **Install Now** and **Activate**

## What is Fluid Design?

Traditional Elementor design requires setting separate values for each breakpoint (mobile, tablet, desktop). This is:
- **Rigid**: Only specific screen widths are styled
- **Time-consuming**: Manual updates across multiple breakpoints

**Fluid design** uses just two values (min and max) that scale smoothly across ALL screen sizes using CSS `clamp()`.

## Quick Start

### 1. Access Site Settings

1. Open Elementor editor (any page)
2. Click **☰ menu** (top left)
3. Select **Site Settings**
4. Go to **Fluid Typography & Spacing** tab

### 2. Create Your First Preset

**Typography Preset**:
- **Label**: "Heading Large"
- **Min**: 24px (mobile)
- **Max**: 72px (desktop)
- Click **Update**

**Spacing Preset**:
- **Label**: "Section Padding"
- **Min**: 40px
- **Max**: 120px
- Click **Update**

### 3. Use in Elementor

1. Select any element
2. Find a typography or spacing control
3. Click the **unit dropdown**
4. Select **fluid**
5. Choose your preset

The element now scales smoothly from mobile to desktop!

## Inline Fluid Values

Set fluid values directly in controls without creating presets.

### How to Use

1. Select **fluid** unit in any control
2. Enter **minimum value** in the first field (e.g., `20px`)
3. Enter **maximum value** in the second field (e.g., `100px`)
4. The value scales immediately

The tilde (`~`) between fields is a visual separator showing the relationship between min and max values.

### Save as Preset

Convert inline values to reusable presets:
1. Enter inline value (e.g., `24px ~ 64px`)
2. Click **Save as Preset** button
3. Enter preset name
4. Click **Save**

The preset is instantly available everywhere!

### Linked Dimensions

Works with linked padding/margins:
- Enable link icon ⛓️
- Enter `40px ~ 120px` in one field
- All sides use the same fluid value

## Custom Groups (Admin Panel)

Organize presets into custom groups for better management.

### Access Admin Panel

Navigate to **Elementor > Fluid Design System** in WordPress admin.

### Features

- Create custom groups (e.g., "Border Radius", "Gaps")
- Drag-and-drop presets between groups
- Search for specific presets
- Delete or rename groups

## Common Use Cases

### Typography Scale

| Preset | Min | Max | Use |
|--------|-----|-----|-----|
| Display | 36px | 96px | Hero headings |
| H1 | 28px | 64px | Page titles |
| Body | 16px | 18px | Body text |

### Spacing Scale

| Preset | Min | Max | Use |
|--------|-----|-----|-----|
| XL | 80px | 200px | Major sections |
| L | 40px | 120px | Section padding |
| M | 24px | 64px | Element spacing |

## Tips

- **Start small**: 5-8 essential presets
- **Use consistent scales**: 1.25x, 1.5x, 2x ratios
- **Test responsively**: Check at different viewport sizes
- **Mix units**: Can use `1.5rem ~ 4rem` or `3em ~ 160px`

## Need Help?

- 📖 [Developer Reference](/developers) for hooks and filters
- 💬 [WordPress.org Support](https://wordpress.org/support/plugin/fluid-design-system-for-elementor/)
- 🐛 [GitHub Issues](https://github.com/artkrsk/fluid-design-system-for-elementor/issues)
