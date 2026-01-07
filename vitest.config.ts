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
      exclude: ['src/ts/**/*.d.ts']
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/ts')
    }
  }
})
