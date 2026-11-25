import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Vitest reads this Vite config too. Keep the test-only option structurally
  // typed here without importing a second Vite type tree from vitest/config.
  test: {
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
  },
} as Parameters<typeof defineConfig>[0] & { test: { exclude: string[] } })
