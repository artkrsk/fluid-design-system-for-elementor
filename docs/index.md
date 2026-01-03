---
layout: home

hero:
  name: Fluid Design System
  text: For Elementor
  tagline: Create fluid typography & spacing presets natively in Elementor — no CSS clamp formulas, no breakpoints, just seamless responsive design.
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started
    - theme: alt
      text: View on WordPress.org
      link: https://wordpress.org/plugins/fluid-design-system-for-elementor/

features:
  - icon: 📐
    title: Fluid Typography
    details: Scale text smoothly from mobile to desktop without breakpoints. One preset handles all screen sizes.
  - icon: 📦
    title: Fluid Spacing
    details: Perfect padding and margins that adapt to any screen size with smooth, proportional scaling.
  - icon: ⚡
    title: Inline Values
    details: Set fluid values directly in controls ("20px ~ 100px") without visiting Site Settings. Save as presets with one click.
  - icon: 🎨
    title: Custom Groups
    details: Organize presets into custom groups for better management. Drag-and-drop between groups with real-time sync.
  - icon: 🔧
    title: Developer Friendly
    details: Powerful filters and hooks to add programmatic presets, customize behavior, and integrate with themes.
  - icon: ⚙️
    title: Admin Panel
    details: Comprehensive management interface accessible via Elementor > Fluid Design System for organizing your design tokens.
---

## Why Fluid Design?

Traditional responsive design in Elementor requires setting separate values for each breakpoint — desktop, tablet, and mobile. This approach has two major downsides:

- **It's rigid**: Styles only match specific screen widths, leaving awkward gaps in between
- **It's time-consuming**: Updating designs across multiple breakpoints becomes repetitive manual work

**Fluid Design System solves this.** Instead of fixed values per breakpoint, you define just two—a minimum and maximum—and the plugin automatically generates smooth scaling behavior using CSS `clamp()`. This means:

✅ One preset handles all screen sizes
✅ Consistent design and spacing across your entire site
✅ Significant time savings and reduced manual effort
✅ Organized presets in custom groups

## Quick Example

### Old Way (Breakpoint-based)
- Font size mobile: 24px
- Font size tablet: 36px
- Font size desktop: 72px

### Fluid Way
- One preset: **min: 24px, max: 72px**
- Result: Text scales smoothly and proportionally on all devices

---

## Ready to Get Started?

<div style="text-align: center; margin: 3rem 0;">
  <a href="/getting-started" style="display: inline-block; padding: 1rem 2rem; background: var(--vp-c-brand-1); color: white; text-decoration: none; border-radius: 8px; font-weight: 500;">Get Started →</a>
</div>
