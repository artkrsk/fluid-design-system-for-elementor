import type { KnipConfig } from 'knip'

/**
 * TS rather than JSON so the docs theme's .vue files can be scanned: knip has
 * no built-in Vue parser, and without one an import that only exists in a
 * .vue file is invisible. That blind spot is not hypothetical — `medium-zoom`
 * is imported by theme/Layout.vue and was never declared, resolving only
 * through npm's flat node_modules until the move to pnpm.
 */
const config: KnipConfig = {
  entry: [
    'src/ts/index.ts',
    'project.config.js',
    'docs/.vitepress/config.mts',
    'docs/.vitepress/theme/index.ts',
    'tests/**/*.test.ts',
    'tests/e2e/**/*.spec.ts'
  ],
  project: ['src/ts/**/*.ts', 'tests/**/*.ts', 'docs/.vitepress/**/*.{ts,mts,vue}'],
  ignoreExportsUsedInFile: true,
  // `vue` is imported by the docs theme components but deliberately not
  // declared — VitePress owns it, and a second copy at the project root is how
  // you get two Vue instances.
  ignoreDependencies: ['fallow', '@wordpress/env', 'vue'],
  compilers: {
    // Enough to expose the imports; knip only needs the script block. Vue SFCs
    // are lowercase and well-formed in practice, but the tag match is written
    // to tolerate case and stray whitespace anyway — a half-matching tag filter
    // is a real (if here harmless) footgun, and CodeQL is right to flag it.
    vue: (text: string) =>
      [...text.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)]
        .map((m) => m[1])
        .join('\n')
  }
}

export default config
