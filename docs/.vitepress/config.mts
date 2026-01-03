import { defineConfig } from 'vitepress'
import { generateSidebar } from 'vitepress-sidebar'
import lightbox from 'vitepress-plugin-lightbox'
import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Read package.json from project root
const pkgPath = path.resolve(__dirname, '../../package.json')
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))

export default defineConfig({
  // Site metadata from package.json
  title: 'Fluid Design System',
  description: 'Create fluid typography & spacing presets natively in Elementor',

  // Base path configuration (flexible for different deployments)
  base: process.env.DOCS_BASE_PATH || '/',

  // Output directory (avoid conflict with plugin build)
  outDir: './.vitepress/dist',

  // Clean URLs (remove .html extensions)
  cleanUrls: true,

  // Ignore dead links during build (can enable later)
  ignoreDeadLinks: false,

  // Theme configuration
  themeConfig: {
    // Logo and branding
    siteTitle: 'Fluid Design System',

    // Navigation
    nav: [
      { text: 'Guide', link: '/guide' },
      { text: 'Developers', link: '/developers' },
      {
        text: `v${pkg.version}`,
        items: [
          { text: 'WordPress.org', link: 'https://wordpress.org/plugins/fluid-design-system-for-elementor/' },
          { text: 'GitHub', link: 'https://github.com/artkrsk/fluid-design-system-for-elementor' }
        ]
      }
    ],

    // Social links
    socialLinks: [
      { icon: 'github', link: 'https://github.com/artkrsk/fluid-design-system-for-elementor' }
    ],

    // Footer
    footer: {
      message: 'Released under GPL-3.0 License',
      copyright: `Copyright © 2024-${new Date().getFullYear()} ${pkg.author}`
    },

    // Local search
    search: {
      provider: 'local',
      options: {
        detailedView: true
      }
    },

    // Edit link
    editLink: {
      pattern: 'https://github.com/artkrsk/fluid-design-system-for-elementor/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    }
  },

  // Markdown configuration
  markdown: {
    lineNumbers: true,
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    },
    config: (md) => {
      md.use(lightbox, {})
    }
  },

  // Head meta tags
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['meta', { name: 'theme-color', content: '#646cff' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'Fluid Design System for Elementor' }],
    ['meta', { property: 'og:description', content: 'Create fluid typography & spacing presets natively in Elementor' }]
  ]
})
