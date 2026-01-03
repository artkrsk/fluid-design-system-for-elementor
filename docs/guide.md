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

Watch this quick walkthrough of creating fluid presets in Elementor:

<CaptionedVideo src="fds-site-settings.mp4" caption="Creating typography and spacing presets in Site Settings" />

### Creating Presets

1. **Open Site Settings**: Click the **☰ menu** (top left) → **Site Settings** → **Fluid Typography & Spacing** tab

2. **Create a Typography Preset**:
   - Click **Add Item** under Typography Presets
   - Label: "Heading Large"
   - Min: 24px (mobile), Max: 72px (desktop)
   - Click `Save Changes`

3. **Create a Spacing Preset**:
   - Click **Add Item** under Spacing Presets
   - Label: "Section Padding"
   - Min: 60px (mobile), Max: 200px (desktop)
   - Click `Save Changes`

### Using Your Presets

Now let's apply the presets we just created:

<CaptionedVideo src="fds-using-presets.mp4" caption="Applying fluid presets to heading typography and section padding" />

As shown in the video:

1. Select any element (e.g., a heading or section)
2. Go to the typography or spacing control
3. Click the **unit dropdown** → Select **fluid**
4. Choose your preset (e.g., "Heading Large" or "Section Padding")

Your element now scales smoothly across all screen sizes!

## Inline Fluid Values

**Why use inline values?** Going back-and-forth to Site Settings is tedious when you just want to experiment with values and see how they look on your design. Inline values let you test fluid values instantly — and if you like the result, save it as a preset immediately.

<CaptionedVideo src="fds-inline-values.mp4" caption="Using inline fluid values (16px ~ 108px) without creating presets" />

As shown in the video:

1. Select **fluid** unit in any control
2. Enter **minimum value** in the first field (e.g., `16px`)
3. Enter **maximum value** in the second field (e.g., `108px`)
4. The value scales immediately

The tilde (`~`) between fields is a visual separator showing the relationship between min and max values.

::: tip Save as Preset
Want to reuse this value? Click the **+** button, enter a name, and click Save. Your inline value becomes a preset instantly available everywhere in Elementor.
:::

## Custom Groups (Admin Panel)

**Why use custom groups?** As your design system grows, you'll have many presets for different purposes. The default "Typography Presets" and "Spacing Presets" groups become cluttered quickly. Custom groups let you organize presets by purpose — "Section Space", "Grid Gaps", "Border Radius", "Thumbnail Sizes" — keeping everything organized instead of throwing random presets into the default groups.

<CaptionedVideo src="fds-creating-groups-admin-panel.mp4" caption="Creating custom groups and reordering them in the admin panel" />

As shown in the video:

1. Navigate to **Elementor > Fluid Design System** in WordPress admin
2. Click **Add New Group** to create custom groups
3. Drag-and-drop to **reorder groups** (e.g., "Section Space", "Border Radius")
4. Drag-and-drop to **move presets between groups**
5. Use search to find specific presets quickly

<CaptionedImage src="custom-groups-site-settings.png" caption="Custom groups integrated into Site Settings panel"/>

## Need Help?

- 📖 [Developer Reference](/developers) for hooks and filters
- 💬 [WordPress.org Support](https://wordpress.org/support/plugin/fluid-design-system-for-elementor/)
- 🐛 [GitHub Issues](https://github.com/artkrsk/fluid-design-system-for-elementor/issues)
