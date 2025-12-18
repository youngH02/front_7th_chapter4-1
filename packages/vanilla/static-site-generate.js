import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// dist에서 compiled render 함수 import
const { render: ssrRender } = await import("./dist/vanilla-ssr/main-server.js");

async function generateStaticSite() {
  try {
    // HTML 템플릿 읽기 (SSR용 템플릿 사용)
    const templatePath = path.join(__dirname, "../../dist/vanilla/index.template.html");
    const outputPath = path.join(__dirname, "../../dist/vanilla/index.html");
    const template = fs.readFileSync(templatePath, "utf-8");

    // SSR로 홈페이지 렌더링
    const out = await ssrRender("/");
    const head = typeof out === "string" ? "" : (out.head ?? "");
    const appHtml = typeof out === "string" ? out : (out.appHtml ?? "");
    const appBody = typeof out === "string" ? "" : (out.appBody ?? "");

    console.log("🔍 SSG Debug:", {
      typeOfOut: typeof out,
      hasHead: !!head,
      hasAppHtml: !!appHtml,
      hasAppBody: !!appBody,
      appHtmlLength: typeof appHtml === "string" ? appHtml.length : 0,
      appHtmlPreview: typeof appHtml === "string" ? appHtml.substring(0, 100) : "NOT STRING",
    });

    // 결과 HTML 생성하기
    const result = template
      .replace("<!--app-head-->", head)
      .replace("<!--app-html-->", appHtml)
      .replace("<!--app-body-->", appBody);

    fs.writeFileSync(outputPath, result);
    console.log("✅ Static site generated successfully");
  } catch (error) {
    console.error("❌ Error generating static site:", error);
    process.exit(1);
  }
}

// 실행
generateStaticSite();
