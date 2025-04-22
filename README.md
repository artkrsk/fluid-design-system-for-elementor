# Fluid Design System for Elementor

![License](https://img.shields.io/badge/license-GPL--3.0-blue)
![WordPress](https://img.shields.io/badge/wordpress-6.0%2B-green)
![PHP](https://img.shields.io/badge/php-7.4%2B-purple)
![Elementor](https://img.shields.io/badge/elementor-compatible-red)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=flat&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/artemsemkin)

Build visually consistent Elementor websites with fluid typography and spacing that scale smoothly from mobile to desktop. No more manual breakpoints!

## 🎯 About The Plugin

Fluid Design System for Elementor is a small yet powerful add-on that brings fluid typography and spacing presets directly into Elementor's interface — helping you create fully responsive designs that scale naturally across every screen size, from tiny phones to ultra-wide desktops.

Think of it like color presets — but for padding, font sizes, and layout gaps.

## ✨ Key Features

- Create unlimited fluid typography and spacing presets with custom minimum and maximum values
- Define global breakpoints or set custom breakpoints for individual presets
- Real-time preview of changes in the Elementor editor
- Works with all Elementor widgets and elements
- Compatible with any WordPress theme including Elementor's Hello theme
- Full support for Elementor's responsive controls and additional breakpoints
- Mix different units (px, em, rem) in your presets for ultimate flexibility

## 📋 Requirements

- WordPress 6.0+
- PHP 7.4+
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

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the GPL-3.0 License - see the [LICENSE](LICENSE) file for details.

## 📣 Acknowledgements

- [Elementor](https://elementor.com) - The website builder platform this plugin extends

## 💖 Support

If you find this plugin useful, consider buying me a coffee:

<a href="https://buymeacoffee.com/artemsemkin" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

---

Made with ❤️ by [Artem Semkin](https://artemsemkin.com)
