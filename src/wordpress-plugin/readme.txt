=== Fluid Design System for Elementor ===
Contributors: artemsemkin
Tags: typography, spacing, responsive, fluid, elementor
Requires at least: 6.0
Tested up to: 6.9
Requires PHP: 8.0
Stable tag: 2.0.0
license: GPLv3
License URI: https://www.gnu.org/licenses/gpl-3.0
Text Domain: fluid-design-system-for-elementor
Donate link: https://buymeacoffee.com/artemsemkin
GitHub Plugin URI: https://github.com/artkrsk/fluid-design-system-for-elementor

Create fluid typography & spacing presets natively in Elementor — no CSS clamp formulas, no breakpoints, just seamless responsive design.

== Description ==

**Design once. Scale everywhere.**

Fluid Design System for Elementor is a small yet powerful add-on that brings fluid typography and spacing presets directly into Elementor's interface — helping you create fully responsive designs that scale naturally across every screen size, from tiny phones to ultra-wide desktops.

🎯 *Think of it like color presets — but for padding, font sizes, and layout gaps.*

With just a few clicks, you can:
- Define minimum and maximum values for typography or spacing.
- Apply those values using a new "fluid" unit inside any Elementor control.
- Watch your design scale smoothly—no coding or media queries required.
- Organize your presets into custom groups (e.g. "Border Radius", "Thumbnail Sizes") for better management.

Say goodbye to manually tweaking every breakpoint. Say hello to automatic, intelligent design scaling with organized preset management.

== How It Works ==

❓ **What Does "Fluid" Mean?**

Traditionally in Elementor, you need to set separate values for each breakpoint — for example, one font size for desktop, another for tablet, and another for mobile.

While this gives some control, it has two major downsides:
- 🧩 **It's rigid**: You only define styles for specific screen widths, leaving awkward gaps in between where the design may not scale smoothly.
- ⏱️ **It's time-consuming**: Updating styles across multiple breakpoints for every section and element becomes a repetitive, manual process.

💡 **Fluid Design System solves this.**
Instead of setting fixed values for each breakpoint, you define just two—a minimum and a maximum — and the plugin automatically generates a smooth scaling behavior in between. This means:
- One preset handles all screen sizes.
- You get consistent design and spacing across the entire site.
- You save time and reduce manual effort.
- You can organize presets into groups for different projects or design systems.

This plugin introduces **Fluid Units**, powered by CSS `clamp()` and custom presets, allowing your design to scale automatically across all screen sizes.

Here's how it works in real scenarios:

### ✍️ Fluid Typography Example
- Old way: 24px (mobile), 36px (tablet), 72px (desktop)
- Fluid way: One preset: min = 24px, max = 72px
- Result: Text scales smoothly and proportionally on all devices.

### 📦 Fluid Spacing Example
- Old way: 40px (mobile), 80px (tablet), 160px (desktop)
- Fluid way: One preset: min = 40px, max = 160px
- Result: Section padding adjusts naturally without breakpoints.

### 🔗 Fluid Gaps Example
- Gap between elements: 20px (mobile) to 60px (desktop)
- Result: Even spacing between containers and widgets on any screen.

❓ **Why not Just Use `vw` or `vh` Units?**

While viewport units like `vw` can scale elements based on screen width, they often lack control — your text might become unreadably small or overly large. The Fluid Design System solves this by generating `clamp()` values behind the scenes, so your designs stay within defined min/max boundaries. This gives you the flexibility of responsive scaling, combined with the precision of design tokens.

👉 Behind the scenes, the plugin creates CSS variables like: `clamp(24px, 5vw, 72px)` which Elementor then uses across typography, spacing, padding, margin, and more.

== Installation ==

1. Install and activate the plugin from the Plugins screen in WordPress.
2. Make sure Elementor plugin is installed and activated
3. Go to Elementor Editor > Site Settings > Fluid Typography & Spacing to create your presets
4. Select "fluid" unit in Elementor controls to use your presets
5. Once applied, your designs will fluidly scale across all screen sizes!

== How to Use ==

Follow these steps to set up and use the Fluid Design System in your Elementor projects.

= 📐 Step 1: Configure Fluid Breakpoints =

1. Go to Elementor > Site Settings
2. Navigate to the "Fluid Typography & Spacing" tab
3. In the "Breakpoints" panel, set your:
   - Minimum Screen Width (e.g., 360px for mobile)
   - Maximum Screen Width (e.g., 1920px for desktop)

= 🧰 Step 2: Create Your Presets =

1. In the same "Fluid Typography & Spacing" tab:
   - Go to "Typography Presets" to create fluid font size presets
   - Go to "Spacing Presets" to create fluid spacing presets
2. For each preset:
   - Give it a descriptive name
   - Set minimum and maximum values
   - Optionally set custom breakpoints for this preset

= 🎨 Step 3: Apply Your Presets =

1. Edit any page with Elementor
2. In any control that supports custom units (typography, spacing, etc.):
   - Select "fluid" as the unit
   - Choose your preset from the dropdown
3. Watch your design smoothly adapt to different screen sizes

= 🔧 Step 4: Fine-tune Your Design =

1. Use the live preview to see how your presets work
2. Adjust preset values if needed
3. Create additional presets for different design needs

= Why Use Fluid Design System? =

* **Perfect Responsiveness**: Create websites that look flawless on every device, from mobile phones to large desktop screens including all intermediate sizes
* **Design Consistency**: Maintain perfect spacing and typography harmony across your entire website
* **Time-Saving**: Eliminate manual breakpoint adjustments with intelligent fluid scaling
* **Future-Proof**: Seamlessly integrates with Elementor's latest features and updates
* **User-Friendly**: Manage everything through Elementor's familiar interface - **no coding or CSS knowledge required**

= Key Features =

* **Inline fluid values** - Set values directly in controls ("20px ~ 100px") without visiting Site Settings
* **Save as Preset** - Convert inline values into reusable presets with one click
* Create unlimited fluid typography and spacing presets with custom minimum and maximum values
* Define global breakpoints or set custom breakpoints for individual presets
* Real-time preview of changes in the Elementor editor
* Works with all Elementor widgets and elements
* Compatible with any WordPress theme including Elementor's Hello theme
* Full support for Elementor's responsive controls and additional breakpoints
* Mix different units (px, em, rem) in your presets for ultimate flexibility

= Common Use Cases =

* **Fluid Typography**: Create responsive headings and text that maintain perfect proportions across all devices
* **Consistent Spacing**: Design section padding and margins that adapt smoothly to any screen size
* **Responsive Grids**: Build fluid grid layouts with perfect spacing between elements
* **Typography Scale**: Set up a complete typography system that works flawlessly everywhere
* **Container Spacing**: Create fluid containers that maintain perfect proportions on all devices
* **Element Gaps**: Design consistent gaps between elements that scale naturally

== Frequently Asked Questions ==

= Do I need to know CSS to use this plugin? =

No coding or CSS knowledge required. Everything is managed through Elementor's familiar interface.

= Will this work with my Elementor widgets? =

Yes! The fluid units are available in any Elementor control that supports "custom" units, including typography, spacing, paddings, margins, gaps and more.

= Will this work with my current theme? =

Yes! The plugin works with any WordPress theme, including the default Hello theme by Elementor.

= Will this slow down my website? =

No! The plugin uses Elementor's native CSS generation system, ensuring optimal performance. The fluid calculations are done once during CSS generation, not during page load.

= How is this different from using viewport units like `vw` or `vh`? =

Viewport units (like `vw`) scale based on the entire screen width, but they have no upper or lower limit — which can lead to text or spacing being too small on mobile or too large on desktops. Fluid units in this plugin use CSS `clamp()` behind the scenes, which means you define a minimum and maximum value. The result scales smoothly between those values — giving you precise, predictable, and accessible designs across all screen sizes.

= Can I use different units (px, em, rem) in my presets? =

Yes! You can mix different units in your presets, like using "3em" as a minimum value and "160px" as a maximum value.

= Can I use custom breakpoints for different presets? =

Yes! You can set global breakpoints or define custom breakpoints for each individual preset. The default values (360px to 1920px) are just suggestions - you can set any values that work best for your design.

= What browsers are supported? =

The plugin uses the CSS `clamp()` function, which is supported by all modern browsers, including:
- Chrome 79+
- Firefox 75+
- Safari 13.4+
- Edge 79+
- Opera 66+
- iOS Safari 13.4+
- Android Chrome 79+

== Screenshots ==

1. Fluid Typography & Spacing settings panel in Elementor Site Settings
2. Creating a new "small" fluid spacing preset with min/max values
3. Applying fluid unit for "padding" control
4. Applying fluid unit for "typography" control
5. Applying fluid unit for "gaps" control

== Changelog ==

= 2.0.0 =
* added: set fluid values directly in controls ("20px ~ 100px") without visiting Site Settings
* added: save inline values as reusable presets with one click
* improved: full support for linked dimensions and gaps

= 1.2.1 =
* fixed: preset min/max values are now preserved when switching between different units
* improved: better validation for preset data to prevent display issues

= 1.2.0 =
* improved: enhanced code quality and reliability for better performance
* improved: updated to modern PHP standards for improved security
* updated: minimum PHP requirement is now 8.0 (WordPress and Elementor fully support PHP 8.0+)

= 1.1.2 =
* improved: preset search now shows all presets when group name matches

= 1.1.1 =
* improved: security fixes

= 1.1.0 =
* added: Admin interface for managing preset groups (Elementor > Fluid Design System)
* added: Cross-group preset management with drag and drop functionality
* added: Custom preset groups creation, editing, and deletion
* added: Developer-friendly filter-based groups with code examples
* improved: optimize CSS generation for formulas with equal min/max values
* improved: improve fluid preset display for equal min/max values
* improved: add display_value support for custom presets added via hooks

= 1.0.6 =
* added: 'em' unit support to size options in Fluid Typography and Spacing controls
* added: full support for negative values
* improved: proper scale when min value is larger than max value

= 1.0.5 =
* fixed: improve performance in Elementor editor when working with "fluid" unit

= 1.0.4 =
* fixed: "custom" units stopped to render correct values in Elementor editor when the plugin is active

= 1.0.3 =
* fixed: PHP Warning "Undefined array key" when saving presets

= 1.0.2 =
* fixed: plugin error when Elementor is not active

= 1.0.1 =
* added: plugin action links to WordPress admin plugins page

= 1.0.0 =
* Initial release

== Upgrade Notice ==

= 1.0.0 =
Initial release of Fluid Design System for Elementor
