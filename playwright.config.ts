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
      VITE_OIDC_AUTHORITY: 'http://localhost:8080/realms/lumie',
      VITE_OIDC_CLIENT_ID: 'lumie-local',
      VITE_API_BASE_URL: 'http://localhost:3001',
    },
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
