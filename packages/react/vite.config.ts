import react from "@vitejs/plugin-react";
import { createViteConfig } from "../../createViteConfig";

const base: string = process.env.NODE_ENV === "production" ? "/front_7th_chapter4-1/react/" : "";

export default createViteConfig({
  base,
  plugins: [react()],
  define: {
    // 서버 빌드에서 테스트 코드 제외
    "import.meta.env.MODE": '"production"',
  },
  build: {
    rollupOptions: {
      external: (id) => {
        // 서버 빌드에서 DOM 관련 모듈 제외
        if (id.includes("jsdom") || id.includes("vitest")) {
          return true;
        }
        return false;
      },
    },
  },
});
