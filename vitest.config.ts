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
      exclude: [
        'src/ts/**/*.d.ts',
        'src/ts/**/index.ts',
        'src/ts/interfaces/**',
        'src/ts/types/**',
        'src/ts/constants/**',
        'src/ts/views/**',
        'src/ts/hooks/**',
        'src/ts/components/**',
        'src/ts/managers/CSSManager.ts',
        'src/ts/managers/DataManager.ts',
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
        'src/ts/utils/presetActions.ts',
        'src/ts/utils/presetDropdown.ts',
        'src/ts/utils/presetLookup.ts',
        'src/ts/utils/presetOptions.ts',
        'src/ts/utils/select2.ts',
        'src/ts/utils/spinner.ts',
        'src/ts/utils/templates.ts'
      ]
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/ts')
    }
  }
})
