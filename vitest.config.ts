import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/ts/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/ts/**/*.ts'],
      // Declared coverage boundary, not forgotten debt: everything listed here
      // is Elementor-integration code (Backbone views, $e hooks, jQuery utils)
      // that jsdom cannot exercise meaningfully. The repeater hooks and views
      // are covered end-to-end by the Playwright suite instead.
      exclude: [
        'src/ts/**/*.d.ts',
        'src/ts/**/index.ts',
        'src/ts/interfaces/**',
        'src/ts/types/**',
        'src/ts/constants/**',
        'src/ts/views/**',
        // Repeater hooks: exercised by the e2e repeater-lifecycle spec
        'src/ts/hooks/HookOnRepeaterAdd.ts',
        'src/ts/hooks/HookOnRepeaterRemove.ts',
        'src/ts/hooks/HookOnRepeaterReorder.ts',
        'src/ts/components/**',
        'src/ts/managers/CSSManager.ts',
        'src/ts/managers/PresetDialogManager.ts',
        'src/ts/managers/index.ts',
        'src/ts/services/**',
        // DOM/jQuery dependent utils (require integration tests)
        'src/ts/utils/backbone.ts',
        'src/ts/utils/dialogBuilder.ts',
        'src/ts/utils/editIconHandler.ts',
        'src/ts/utils/elementorAjax.ts',
        'src/ts/utils/inheritanceAttributes.ts',
        'src/ts/utils/inlineInputs.ts',
        'src/ts/utils/preset.ts',
        'src/ts/utils/presetDropdown.ts',
        'src/ts/utils/select2.ts',
        'src/ts/utils/spinner.ts',
        'src/ts/utils/templates.ts'
      ],
      // Floors from the measured baseline (2026-07: lines 93.85, stmts 93.92,
      // funcs 95.78, branches 90.71) with a small margin; raise as coverage
      // grows, never lower without discussion.
      thresholds: {
        lines: 91,
        functions: 94,
        statements: 91,
        branches: 89
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/ts')
    }
  }
})
