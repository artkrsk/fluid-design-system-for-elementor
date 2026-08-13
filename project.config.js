import process from 'node:process'

export default {
  slug: 'fluid-design-system-for-elementor',
  versionConstant: 'ARTS_FLUID_DS_PLUGIN_VERSION',
  defineKey: '__ARTS_FLUID_DS_VERSION__',
  esbuildTarget: 'es2022',
  entry: { ts: './src/ts/index.ts', sass: './src/styles/index.scss' },
  bundles: [],
  bannerLines: [],
  zip: { budgetMb: 1.0 },
  paths: { php: './src/php', plugin: './src/wordpress-plugin', dist: './dist' },
  // Machine-specific: the Local site's plugin dir, from the gitignored .env (DEV_TARGET)
  devTarget: process.env.DEV_TARGET ?? null,
  // null = derived from the slug
  vendor: { autoloaderOnly: true, autoloaderSuffix: null },
  // No wp.org Live Preview blueprint for this plugin
  blueprint: null
}
