import express from "express";
import path from "path";
import { fileURLToPath } from "url";
const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
const base = process.env.BASE || (prod ? "/front_7th_chapter4-1/vanilla/" : "/");
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

async function start() {
  if (!prod) {
    // DEV: Vite를 Express 미들웨어로 붙임
    const { createServer: createViteServer } = await import("vite");

    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      base,
    });

    app.use(vite.middlewares);

    // dev에서는 Vite가 index.html 처리
    app.listen(port, () => {
      console.log(`Dev server: http://localhost:${port}${base}`);
    });
    return;
  }

  // ✅ PROD: dist 서빙
  const distPath = path.join(__dirname, "dist/vanilla");

  app.use(base, express.static(distPath));

  // base로 접속 시 index.html
  app.get(base, (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });

  // SPA fallback (정적파일 확장자 요청은 제외)
  app.get(
    new RegExp(`^${base.replace(/\//g, "\\/")}(?!.*\\.(js|css|map|png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf)$).*`),
    (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    },
  );

  app.listen(port, () => {
    console.log(`Prod server: http://localhost:${port}${base}`);
    console.log({ base, distPath });
  });
}

start();
