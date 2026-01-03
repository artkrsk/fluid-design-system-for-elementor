# Getting Started

Welcome to Fluid Design System for Elementor! This guide will help you install the plugin and create your first fluid preset.

## Requirements

- **WordPress**: 6.0 or higher
- **PHP**: 8.0 or higher
- **Elementor**: Latest version recommended

## Installation

### Method 1: WordPress Admin (Recommended)

1. Log in to your WordPress admin dashboard
2. Navigate to **Plugins > Add New**
3. Search for "Fluid Design System for Elementor"
4. Click **Install Now**
5. Click **Activate** after installation completes

### Method 2: Manual Upload

1. Download the plugin ZIP file from [WordPress.org](https://wordpress.org/plugins/fluid-design-system-for-elementor/)
2. Navigate to **Plugins > Add New** in your WordPress admin
3. Click **Upload Plugin** button at the top
4. Choose the ZIP file and click **Install Now**
5. Click **Activate** after installation completes

### Method 3: FTP Upload

1. Download and extract the plugin ZIP file
2. Upload the `fluid-design-system-for-elementor` folder to `/wp-content/plugins/`
3. Navigate to **Plugins** in WordPress admin
4. Find **Fluid Design System for Elementor** and click **Activate**

## Creating Your First Preset

Once the plugin is installed and activated, you can create your first fluid preset:

### Step 1: Access Site Settings

1. Open the Elementor editor (edit any page)
2. Click the **hamburger menu** (☰) in the top left corner
3. Select **Site Settings** from the menu
4. Navigate to **Fluid Typography & Spacing** tab

### Step 2: Configure Breakpoints (Optional)

The default breakpoints work great for most sites:
- **Minimum screen**: 360px (mobile)
- **Maximum screen**: 1920px (desktop)

You can customize these if needed, or use custom breakpoints for individual presets.

### Step 3: Create a Typography Preset

1. In the **Typography Presets** section, click **Add Item**
2. Give your preset a descriptive name (e.g., "Heading Large")
3. Set the minimum value (e.g., "24px" for mobile)
4. Set the maximum value (e.g., "72px" for desktop)
5. Click **Update** to save your changes

### Step 4: Use Your Preset

1. Select any element in the Elementor editor
2. Go to the **Style** or **Content** tab
3. Find a typography or spacing control
4. Click the **unit dropdown** next to the size input
5. Select **fluid** from the list
6. Choose your newly created preset from the dropdown

That's it! Your element will now scale smoothly from 24px on mobile to 72px on desktop, with perfect proportional scaling in between.

## Next Steps

Now that you have the basics down, explore these features:

- **[Creating Presets](/guides/creating-presets)** - Learn advanced preset creation techniques
- **[Inline Values](/guides/inline-values)** - Set fluid values directly in controls without presets
- **[Custom Groups](/guides/custom-groups)** - Organize presets into custom groups
- **[Examples](/examples/fluid-typography)** - See real-world use cases

## Need Help?

- 📖 Browse the [complete documentation](/guides/creating-presets)
- 💬 Get support on [WordPress.org forums](https://wordpress.org/support/plugin/fluid-design-system-for-elementor/)
- 🐛 Report bugs on [GitHub](https://github.com/artkrsk/fluid-design-system-for-elementor/issues)
- ⭐ Rate the plugin on [WordPress.org](https://wordpress.org/plugins/fluid-design-system-for-elementor/)
