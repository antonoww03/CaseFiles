import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://127.0.0.1:5173',
    ...devices['Desktop Chrome'],
    trace: 'retain-on-failure'
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: [
    {
      command: 'npm run dev -w apps/api',
      cwd: '../..',
      url: 'http://127.0.0.1:3001/api/health',
      timeout: 60000,
      reuseExistingServer: !process.env.CI,
      env: { WEB_ORIGIN: 'http://127.0.0.1:5173', OPENAI_API_KEY: '', DATABASE_URL: '', CASEFILES_E2E: 'true' }
    },
    {
      command: 'npm run dev -w apps/web',
      cwd: '../..',
      url: 'http://127.0.0.1:5173',
      timeout: 60000,
      reuseExistingServer: !process.env.CI,
      env: { VITE_API_URL: 'http://127.0.0.1:3001', VITE_DEFAULT_LANGUAGE: 'bg' }
    }
  ]
});
