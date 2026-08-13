import { createVitestConfig } from '@arts/wp-plugin-tooling/vitest'
import { defineConfig } from 'vitest/config'

const shared = createVitestConfig({
  defineKey: '__ARTS_FLUID_DS_VERSION__',
  setupFiles: []
})

export default defineConfig({
  ...shared,
  test: {
    ...shared.test,
    // These suites drive real DOM/jQuery control views, not just pure helpers.
    environment: 'jsdom',
    globals: true,
    include: ['tests/ts/**/*.test.ts'],
    coverage: {
      ...shared.test.coverage,
      include: ['src/ts/**/*.ts'],
      // Elementor-integration code is covered by the Playwright suite instead —
      // jsdom can't meaningfully exercise it.
      exclude: [
        'src/ts/**/*.d.ts',
        'src/ts/**/index.ts',
        'src/ts/interfaces/**',
        'src/ts/types/**',
        'src/ts/constants/**',
        'src/ts/views/**',
        'src/ts/components/**',
        'src/ts/services/**',
        'src/ts/hooks/HookOnRepeaterAdd.ts',
        'src/ts/hooks/HookOnRepeaterRemove.ts',
        'src/ts/hooks/HookOnRepeaterReorder.ts',
        'src/ts/managers/CSSManager.ts',
        'src/ts/managers/PresetDialogManager.ts',
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
      // Set just under the measured baseline. Raise as coverage grows; never
      // lower without discussion.
      thresholds: { lines: 91, functions: 94, statements: 91, branches: 89 }
    }
  }
})
