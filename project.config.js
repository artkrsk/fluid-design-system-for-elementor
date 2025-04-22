/**
 * Project Configuration for `@arts/fluid-design-system`
 * Fluid spacing and typography units for Elementor
 */
export default {
  // Basic project information
  name: 'Fluid Design System for Elementor',
  entry: './src/js/index.js',
  author: 'Artem Semkin',
  license: 'GPL-3.0',
  description: 'Fluid spacing and typography units for Elementor',
  homepage: 'https://artemsemkin.com',
  repository: 'https://github.com/artkrsk/fluid-design-system-for-elementor',
  donateUrl: 'https://buymeacoffee.com/artemsemkin',

  // Path configuration
  paths: {
    root: './',
    src: './src',
    dist: './dist',
    php: './src/php',
    styles: './src/styles',
    js: './src/js',
    wordpress: {
      plugin: './src/wordpress-plugin',
      languages: './src/wordpress-plugin/languages'
    },
    library: {
      base: 'libraries',
      name: 'arts-fluid-design-system',
      assets: 'src/php/libraries/arts-fluid-design-system'
    },
    aliases: {
      '@': './src/js',
      '@core': './src/js/core',
      '@controls': './src/js/controls',
      '@hooks': './src/js/hooks',
      '@services': './src/js/services'
    }
  },

  // Development configuration
  dev: {
    root: './src/js/www',
    server: {
      port: 8080,
      host: 'localhost'
    }
  },

  // Live reloading server configuration
  liveReload: {
    enabled: true,
    port: 3000,
    host: 'localhost',
    https: {
      key: '/Users/art/.localhost-ssl/fluid-ds.local+4-key.pem',
      cert: '/Users/art/.localhost-ssl/fluid-ds.local+4.pem'
    },
    injectChanges: true,
    reloadDebounce: 500,
    reloadThrottle: 1000,
    notify: {
      styles: {
        top: 'auto',
        bottom: '0',
        right: '0',
        left: 'auto',
        padding: '5px',
        borderRadius: '5px 0 0 0',
        fontSize: '12px'
      }
    },
    ghostMode: {
      clicks: false,
      forms: false,
      scroll: false
    },
    open: false,
    snippet: false
  },

  // WordPress sync configuration
  wordpress: {
    enabled: true,
    source: './src/php',
    extensions: ['.js', '.css', '.php', '.jsx', '.ts', '.tsx'],
    targets: [], // Targets will be added by the build system based on environment
    debug: false
  },

  // WordPress plugin development configuration
  wordpressPlugin: {
    enabled: true,
    source: './src/wordpress-plugin',
    extensions: ['.php', '.js', '.css', '.jsx', '.ts', '.tsx', '.json', '.txt', '.md'],
    target: null, // Set in the environment-specific config
    debug: false,
    vendor: {
      source: './vendor',
      target: 'vendor',
      extensions: ['.php', '.js', '.css', '.json', '.txt', '.md'],
      delete: true,
      watch: true
    },
    packageName: 'fluid-design-system-for-elementor',
    zipOutputName: 'fluid-design-system-for-elementor.zip',
    packageExclude: [
      'node_modules',
      '.git',
      '.DS_Store',
      '**/.DS_Store',
      '.*',
      '**/.*',
      '*.log',
      '*.map',
      '*.zip',
      'package.json',
      'package-lock.json',
      'pnpm-lock.yaml',
      'yarn.lock',
      'README.md',
      'LICENSE',
      '.gitignore',
      '.editorconfig',
      '.eslintrc',
      '.prettierrc',
      'tsconfig.json',
      'vite.config.js',
      'vitest.config.js',
      'cypress.config.js',
      '__tests__',
      '__e2e__',
      'coverage',
      'dist'
    ],
    sourceFiles: {
      php: './src/php',
      vendor: './vendor',
      dist: {
        files: ['index.umd.js', 'index.css']
      },
      composer: ['composer.json', 'composer.lock']
    }
  },

  // Build configuration
  build: {
    formats: ['cjs', 'iife'],
    target: 'es2018',
    sourcemap: false,
    externals: {
      jquery: 'jQuery',
      elementor: 'elementor',
      backbone: 'Backbone'
    },
    globals: {
      jquery: 'jQuery',
      elementor: 'elementor',
      backbone: 'Backbone'
    },
    cleanOutputDir: true,
    umd: {
      name: 'ArtsFluidDesignSystem',
      exports: 'named',
      globals: {
        jquery: 'jQuery',
        elementor: 'elementor',
        backbone: 'Backbone'
      }
    },
    // Output filenames by format
    output: {
      cjs: 'index.cjs',
      iife: 'index.iife.js'
    }
  },

  // Sass configuration
  sass: {
    enabled: true,
    entry: './src/styles/index.sass',
    output: './dist/index.css',
    options: {
      sourceMap: false,
      outputStyle: 'compressed',
      includePaths: ['node_modules']
    }
  },

  // Watch options
  watch: {
    ignored: ['**/node_modules/**', '**/dist/**', '**/.*', '**/.*/**']
  },

  // Internationalization options
  i18n: {
    enabled: true,
    src: 'src/php/**/*.php',
    dest: 'src/wordpress-plugin/languages/fluid-design-system-for-elementor.pot',
    domain: 'fluid-design-system-for-elementor',
    package: 'Fluid Design System for Elementor',
    bugReport: 'https://artemsemkin.com',
    lastTranslator: 'Artem Semkin',
    team: 'Artem Semkin',
    relativeTo: './'
  }
}
