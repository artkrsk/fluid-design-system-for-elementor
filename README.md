# Fluid Design System for Elementor

[![Tests](https://img.shields.io/github/actions/workflow/status/artkrsk/fluid-design-system-for-elementor/test.yml?style=flat-square&logo=githubactions&logoColor=white&label=tests)](https://github.com/artkrsk/fluid-design-system-for-elementor/actions/workflows/test.yml)
[![Coverage](https://img.shields.io/codecov/c/github/artkrsk/fluid-design-system-for-elementor?style=flat-square&logo=codecov&logoColor=white)](https://codecov.io/gh/artkrsk/fluid-design-system-for-elementor)
[![WordPress](https://img.shields.io/badge/WordPress-6.0+-21759b?style=flat-square&logo=wordpress&logoColor=white)](https://wordpress.org)
[![PHP](https://img.shields.io/badge/PHP-8.0+-777BB4?style=flat-square&logo=php&logoColor=white)](https://php.net)
[![Elementor](https://img.shields.io/badge/Elementor-compatible-92003B?style=flat-square&logo=elementor&logoColor=white)](https://elementor.com)

Fluid typography and spacing presets for Elementor using CSS `clamp()` — smooth responsive scaling without breakpoints.

## Quick Links

| Users                                                                                          | Developers                                                                                          |
| ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| [Install from WordPress.org](https://wordpress.org/plugins/fluid-design-system-for-elementor/) | [Developer Hooks Reference](https://artkrsk.github.io/fluid-design-system-for-elementor/developers) |
| [Video Tutorials & Guide](https://artkrsk.github.io/fluid-design-system-for-elementor/guide)   | [GitHub Releases](https://github.com/artkrsk/fluid-design-system-for-elementor/releases)            |

## Development

```bash
git clone https://github.com/artkrsk/fluid-design-system-for-elementor.git
cd fluid-design-system-for-elementor
npm install
```

Edit `project.development.js` to set your WordPress plugin path:

```javascript
config.wordpressPlugin.target = '/path/to/your/wordpress/plugins/fluid-design-system-for-elementor'
```

### Commands

| Command         | Description                                 |
| --------------- | ------------------------------------------- |
| `npm run dev`   | Development mode with live reload           |
| `npm run build` | Production build (creates distribution ZIP) |

---

Made by [Artem Semkin](https://artemsemkin.com)
