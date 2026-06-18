import { defineConfig } from "astro/config";

// Static site generation only. The canonical site URL is read from the
// PUBLIC_SITE_URL environment variable (see .env.example); never hardcoded.
export default defineConfig({
  output: "static",
  site: process.env.PUBLIC_SITE_URL,
  trailingSlash: "ignore",
  build: {
    format: "directory",
  },
});
