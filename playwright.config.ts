import { defineConfig, devices } from '@playwright/test'
import process from 'node:process'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1',
    url: 'http://127.0.0.1:5173',
    env: {
      VITE_SUPABASE_URL: 'https://lumie-e2e.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_e2e_test_key',
      VITE_API_BASE_URL: 'http://localhost:3001',
    },
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
