import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@engine": path.resolve(__dirname, "src/engine"),
      "@state": path.resolve(__dirname, "src/state"),
      "@render": path.resolve(__dirname, "src/render"),
      "@data": path.resolve(__dirname, "src/data"),
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
});
