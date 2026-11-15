import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bewusst ohne Cache Components: Alle Seiten sind sitzungsabhängig und damit ohnehin dynamisch.
  cacheComponents: false,
  serverExternalPackages: ["playwright", "better-sqlite3", "@prisma/adapter-better-sqlite3"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
