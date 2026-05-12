import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
    tailwindcss(),
  ],

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],

          mantine: [
            "@mantine/core",
            "@mantine/hooks",
            "@mantine/dates",
            "@mantine/form",
            "@mantine/notifications",
            "@mantine/modals",
            "@mantine/charts"
          ],

          charts: ["recharts"],

          icons: [
            "lucide-react",
            "react-icons",
            "@tabler/icons-react"
          ],

          vendor: [
            "axios",
            "dayjs",
            "react-router-dom",
          ]
        },
      },
    },
  },
});
 