import { defineConfig } from "vite";

export default defineConfig(({ command }) => {
  //dev
  if (command === "serve") {
    return {
      root: "example",
      server: {
        port: 3000,
      },
    };
  }

  return {
    build: {
      lib: {
        entry: "src/index.js",
        name: "Filebase Realtime Sharing",
        fileName: "filebase-realtime-sharing",
        formats: ["es", "cjs", "umd"],
      },
      rollupOptions: {
        external: [],
      },
    },
    plugins: [],
  };
});
