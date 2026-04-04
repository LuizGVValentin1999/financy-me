import { defineConfig } from "cypress";

export default defineConfig({
  video: false,
  screenshotOnRunFailure: true,
  viewportWidth: 1366,
  viewportHeight: 768,
  pageLoadTimeout: 180000,
  retries: {
    runMode: 1,
    openMode: 0,
  },

  e2e: {
    baseUrl: "http://127.0.0.1:8000",
    supportFile: "cypress/support/e2e.ts",
    specPattern: "cypress/e2e/**/*.cy.{ts,tsx}",
  },

  component: {
    devServer: {
      framework: "react",
      bundler: "webpack",
    },
  },
});
