import { defineConfig, devices } from '@playwright/test';

// Overridable so several checkouts (or several agents) can run their suites side by
// side without silently attaching to each other's dev server - `reuseExistingServer`
// below will happily reuse ANY server already listening on this port, including one
// serving a completely different project.
const port = Number(process.env.EX_E2E_PORT ?? 4173);

export default defineConfig({
  testDir: './test/e2e',
  fullyParallel: true,
  workers: 2,
  timeout: 60_000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${port}`,
    screenshot: 'off',
    trace: 'off'
  },
  webServer: {
    command: `npx vite example --port ${port} --strictPort`,
    port,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Rendering-consistency args copied verbatim from Excalibur core's snapshot
        // harness - these are why the baselines reproduce across machines/OSes.
        launchOptions: {
          ignoreDefaultArgs: ['--disable-render-backgrounding', '--disable-remote-fonts', '--font-render-hinting'],
          args: [
            '--no-default-browser-check',
            '--no-first-run',
            '--disable-default-apps',
            '--disable-popup-blocking',
            '--disable-translate',
            '--disable-background-timer-throttling',
            '--disable-dev-shm-usage',
            '--disable-renderer-backgrounding',
            '--disable-device-discovery-notifications',
            '--autoplay-policy=no-user-gesture-required',
            '--mute-audio',
            '--force-device-scale-factor=1',
            '--use-gl=swiftshader'
          ]
        }
      }
    }
  ]
});
