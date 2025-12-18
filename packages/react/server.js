import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5174;
const base = process.env.BASE || (prod ? "/front_7th_chapter4-1/react/" : "/");

// 라우팅 상수
const STATIC_EXTENSIONS = /\.(js|css|map|png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|json)(\?.*)?$/;
const BASE_PATH_PATTERN = "/front_7th_chapter4-1/react";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 헬스체크 엔드포인트
app.get("/health", (req, res) => {
  res.json({ status: "OK", mode: prod ? "production" : "development", timestamp: new Date().toISOString() });
});

function applyTemplate(template, out) {
  // render가 string만 반환하면 appHtml로 취급
  const head = typeof out === "string" ? "" : (out.head ?? "");
  const appHtml = typeof out === "string" ? out : (out.appHtml ?? "");
  const appBody = typeof out === "string" ? "" : (out.appBody ?? "");

  return template
    .replace("<!--app-head-->", head)
    .replace("<!--app-html-->", appHtml)
    .replace("<!--app-body-->", appBody);
}

if (!prod) {
  // DEV: Vite를 Express 미들웨어로 붙임
  const { createServer: createViteServer } = await import("vite");

  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "custom",
    base,
  });

  app.use(vite.middlewares);
  const ssrEntry = path.resolve(__dirname, "src/main-server.tsx");
  const { render } = await vite.ssrLoadModule(ssrEntry);

  // DEV 템플릿 치환: 원본 index.html을 읽고, Vite transform 후 치환
  app.use(async (req, res, next) => {
    try {
      const url = req.originalUrl;

      // 정적 자산 요청은 스킵 (Vite가 처리함)
      if (STATIC_EXTENSIONS.test(url)) {
        return next();
      }

      // 원본 index.html (프로젝트 루트)
      let template = await fs.readFile(path.join(__dirname, "index.html"), "utf-8");

      // Vite가 dev용으로 HTML 변환
      template = await vite.transformIndexHtml(url, template);

      // SSR render 결과로 치환
      const out = await render(url, req.query);
      const html = applyTemplate(template, out);

      res.status(200).set("Content-Type", "text/html").send(html);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
} else {
  // PROD: dist 서빙
  const { render } = await import("./dist/react-ssr/main-server.js");

  // SSR은 ./dist/react, SSG는 ../../dist/react 사용
  const distPath = base === "/" ? path.join(__dirname, "./dist/react") : path.join(__dirname, "../../dist/react");

  // SSR 핸들러를 먼저 등록 (정적 파일보다 우선)
  app.use((req, res, next) => {
    // 정적 파일 요청은 다음 미들웨어로
    if (STATIC_EXTENSIONS.test(req.path)) {
      return next();
    }

    // base path로 시작하지 않으면 다음으로
    if (!req.path.startsWith(BASE_PATH_PATTERN)) {
      return next();
    }

    // HTML 페이지 요청 처리
    (async () => {
      try {
        const template = await fs.readFile(path.join(distPath, "index.template.html"), "utf-8");
        const out = await render(req.originalUrl, req.query);
        const html = applyTemplate(template, out);

        res.status(200).set("Content-Type", "text/html").send(html);
      } catch (e) {
        console.error("SSR Error:", e);
        res.status(500).send("Server Error");
      }
    })();
  });

  // 정적 파일 서빙 (SSR 이후)
  app.use(base, express.static(distPath));
}

app.listen(port, () => {
  console.log(`React SSR Server started at http://localhost:${port}${base}`);
});
