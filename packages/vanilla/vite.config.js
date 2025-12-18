import { defineConfig } from "vite";
import { copyFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const base = process.env.NODE_ENV === "production" ? "/front_7th_chapter4-1/vanilla/" : "/";

export default defineConfig({
  base,
  plugins: [
    {
      name: "copy-mocks",
      closeBundle() {
        // SSR 빌드 시 mocks 폴더 복사
        const isSsrBuild = process.argv.includes("--ssr");
        if (isSsrBuild) {
          const srcMocks = resolve(__dirname, "src/mocks");
          const destMocks = resolve(__dirname, "dist/vanilla-ssr/mocks");

          try {
            mkdirSync(destMocks, { recursive: true });
            copyFileSync(resolve(srcMocks, "items.json"), resolve(destMocks, "items.json"));
            console.log("✅ Copied mocks/items.json to dist/vanilla-ssr/mocks/");
          } catch (error) {
            console.error("❌ Failed to copy mocks:", error);
          }
        }
      },
    },
  ],
});
