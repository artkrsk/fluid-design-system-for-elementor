# Fluid Design System for Elementor

![License](https://img.shields.io/badge/license-GPL--3.0-blue)
![WordPress](https://img.shields.io/badge/wordpress-6.0%2B-green)
![PHP](https://img.shields.io/badge/php-8.0%2B-purple)
![Elementor](https://img.shields.io/badge/elementor-compatible-red)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=flat&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/artemsemkin)

Build visually consistent Elementor websites with fluid typography and spacing that scale smoothly from mobile to desktop. No more manual breakpoints!

## 🎯 About The Plugin

Fluid Design System for Elementor is a small yet powerful add-on that brings fluid typography and spacing presets directly into Elementor's interface — helping you create fully responsive designs that scale naturally across every screen size, from tiny phones to ultra-wide desktops.

Think of it like color presets — but for padding, font sizes, and layout gaps.

## ✨ Key Features

### Core Functionality

- Create unlimited fluid typography and spacing presets with custom minimum and maximum values
- Define global breakpoints or set custom breakpoints for individual presets
- Real-time preview of changes in the Elementor editor
- Works with all Elementor widgets and elements
- Compatible with any WordPress theme including Elementor's Hello theme
- Full support for Elementor's responsive controls and additional breakpoints
- Mix different units (px, em, rem) in your presets for ultimate flexibility

### Preset Groups Management (since v1.1)

- **Admin Interface**: Comprehensive management panel accessible via Elementor > Fluid Design System
- **Custom Groups**: Create, edit, and organize your design tokens into custom groups
- **Cross-Group Management**: Drag and drop presets between groups with real-time synchronization
- **Developer Integration**: Filter-based groups for theme developers

## 📋 Requirements

- WordPress 6.0+
- PHP 8.0+
- Elementor (latest version recommended)

## 🚀 Getting Started

### For Users

Find the latest release on the [WordPress Plugin Directory](https://wordpress.org/plugins/fluid-design-system-for-elementor/) or our [Releases page](https://github.com/artkrsk/fluid-design-system-for-elementor/releases).

### For Developers

#### Setup Development Environment

1. Clone the repository

```bash
git clone https://github.com/artkrsk/fluid-design-system-for-elementor.git
cd fluid-design-system
```

2. Install dependencies

```bash
npm install
```

3. Configure your development environment
   Edit the `project.development.js` file to set your WordPress plugin target path:

```javascript
config.wordpressPlugin.target = '/path/to/your/wordpress/plugins/fluid-design-system-for-elementor'
```

## 🛠️ Build System

The project uses a custom build system to compile JavaScript and Sass, manage WordPress plugin assets, and handle production builds.

### Build Commands

- **Development mode** (with live reload)

```bash
npm run dev
```

- **Production build**

```bash
npm run build
```

### Build System Structure

The build system is located in the `__build__` directory and includes:

- JavaScript compilation with esbuild
- Sass compilation
- WordPress plugin file synchronization
- Live reload for development
- Production minification and optimization
- Banner generation for production files
- ZIP archive creation for distribution

## 📁 Project Structure

```
fluid-design-system/
├── __build__/             # Build system files
├── dist/                  # Build output
├── src/
│   ├── js/                # JavaScript source files
│   ├── php/               # PHP source files
│   ├── styles/            # Sass source files
│   └── wordpress-plugin/  # WordPress plugin files
├── project.config.js      # Base configuration
├── project.development.js # Development environment configuration
└── project.production.js  # Production environment configuration
```

## 🔌 Filters and Actions

The plugin provides several filters and actions that allow developers to customize its behavior.

### Filters

#### Control Eligibility and Modification

```php
// Customize which controls are eligible for fluid units
add_filter( 'arts/fluid_design_system/controls/is_eligible_for_fluid_unit', function( $default_eligible, $control ) {
    // Make all controls with a specific class eligible
    if ( isset( $control['classes'] ) && strpos( $control['classes'], 'my-fluid-control' ) !== false ) {
        return true;
    }
    return $default_eligible;
}, 10, 2 );

// Filter the list of eligible controls
add_filter( 'arts/fluid_design_system/controls/eligible_for_fluid_unit', function( $eligible_controls, $controls ) {
    // Add a specific control to the eligible list
    if ( isset( $controls['my_custom_control'] ) ) {
        $eligible_controls['my_custom_control'] = $controls['my_custom_control'];
    }
    return $eligible_controls;
}, 10, 2 );

// Add additional control types for selector modification
add_filter( 'arts/fluid_design_system/controls/eligible_types_for_selector_modification', function( $eligible_control_types ) {
    // Add support for a custom control type
    $eligible_control_types[] = 'my_custom_slider';
    return $eligible_control_types;
} );

// Customize the CSS property output for fluid units
add_filter( 'arts/fluid_design_system/controls/modified_css_property', function( $modified_css_property, $css_property, $selector, $control, $value ) {
    // Add additional CSS properties for specific controls
    if ( $control['name'] === 'my_special_control' ) {
        $modified_css_property .= '; transform: scale(var(--scale-factor))';
    }
    return $modified_css_property;
}, 10, 5 );
```

#### CSS Variable Names

```php
// Customize the CSS variable name for a preset
add_filter( 'arts/fluid_design_system/css/var_preset', function( $var_name, $id ) {
    // Use a different naming convention for specific presets
    if ( strpos( $id, 'special-' ) === 0 ) {
        return '--my-custom-prefix-' . $id;
    }
    return $var_name;
}, 10, 2 );

// Customize the CSS clamp formula
add_filter( 'arts/fluid_design_system/css/clamp_formula', function( $formula, $formula_parts ) {
    // Use a custom formula for specific cases
    if ( $formula_parts['min_size'] === '0px' ) {
        // Create a formula that starts at 0 and grows more aggressively
        return "min(calc({$formula_parts['value_diff']} * {$formula_parts['viewport_calc']} / ({$formula_parts['max_screen']} * 0.8)), {$formula_parts['max_size']})";
    }
    return $formula;
}, 10, 2 );
```

### Actions

```php
// Add support for fluid units to custom controls
add_action( 'arts/fluid_design_system/controls/after_add_fluid_unit', function( $element, $section_id, $args, $units_instance ) {
    // Only target a specific element or section
    if ( $element->get_name() === 'my-custom-element' && $section_id === 'style_section' ) {
        $controls = $element->get_controls();

        // Add fluid unit to a specific control
        if ( isset( $controls['my_custom_spacing'] ) ) {
            $control = $controls['my_custom_spacing'];
            $control['size_units'][] = 'fluid';
            $element->update_control( 'my_custom_spacing', $control );
        }
    }
}, 10, 4 );
```

### Comprehensive Example: Adding Support for a Custom Widget

```php
/**
 * Add fluid unit support to a custom Elementor widget.
 */
function my_theme_add_fluid_support_to_custom_widget() {
    // 1. Define which controls should use fluid units
    add_filter( 'arts/fluid_design_system/controls/is_eligible_for_fluid_unit', function( $default_eligible, $control ) {
        // Make all dimension controls in our widget eligible
        if ( isset( $control['parent'] ) && $control['parent'] === 'my_custom_widget' && $control['type'] === 'dimensions' ) {
            return true;
        }
        return $default_eligible;
    }, 10, 2 );

    // 2. Modify the CSS output for our custom widget
    add_filter( 'arts/fluid_design_system/controls/modified_css_property', function( $modified_css_property, $css_property, $selector, $control, $value ) {
        if ( strpos( $selector, '.my-custom-widget' ) !== false ) {
            // Add additional CSS for our widget when using fluid units
            return $modified_css_property . '; transition: all 0.3s ease-in-out;';
        }
        return $modified_css_property;
    }, 10, 5 );

    // 3. Use an action to manually add fluid units to controls
    add_action( 'arts/fluid_design_system/controls/after_add_fluid_unit', function( $element, $section_id, $args, $units_instance ) {
        if ( $element->get_name() === 'my_custom_widget' && $section_id === 'section_style' ) {
            // Manually update a specific control
            $element->update_control( 'custom_padding', [
                'size_units' => ['px', '%', 'em', 'rem', 'fluid'],
            ]);
        }
    }, 10, 4 );
}
add_action( 'init', 'my_theme_add_fluid_support_to_custom_widget' );
```

### Add Custom Preset Groups

You can add your own preset groups programmatically using the `arts/fluid_design_system/custom_presets` filter. This is useful for themes or plugins that want to provide design tokens, spacing, or typography presets globally.

**Example:**

```php
add_filter( 'arts/fluid_design_system/custom_presets', function( $groups ) {
    // Add a custom group for your theme
    $groups[] = array(
        'name'        => 'My Theme Design Tokens',
        'description' => 'Consistent design values for My Theme',
        'value'       => array(
            array(
                'id'    => 'theme-space-xs',
                'title' => 'Extra Small Space',
                'value' => 'var(--theme-space-xs)',  // CSS variable
            ),
            array(
                'id'    => 'theme-border-radius',
                'title' => 'Theme Border Radius',
                'value' => '8px',  // Border radius value
            ),
            array(
                'id'           => 'theme-gap-large',
                'title'        => 'Large Gap',
                'value'        => 'var(--theme-gap-large)',
                'display_value' => '2rem',  // Show custom text in UI
            ),
            array(
                'id'    => 'header-height',
                'title' => 'Header Height',
                'value' => 'var(--header-height)',  // Dynamically set from JS
            ),
        ),
    );

    return $groups;
});
```

**Important Notes:**

- Values must be valid CSS - CSS variables, pixels, rems, percentages, etc.
- CSS variables require separate CSS generation - this filter only provides the values
- Groups appear in fluid unit dropdowns - not in Elementor Site Settings
- Use `display_value` to show user-friendly text instead of CSS variable names

**Where to add this code:**

- In your theme's functions.php file
- In a custom plugin for your design system
- In a must-use plugin for network-wide consistency

## 📜 License

This project is licensed under the GPL-3.0 License - see the [LICENSE](LICENSE) file for details.

## 💖 Support

If you find this plugin useful, consider buying me a coffee:

<a href="https://buymeacoffee.com/artemsemkin" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

---

Made with ❤️ by [Artem Semkin](https://artemsemkin.com)
