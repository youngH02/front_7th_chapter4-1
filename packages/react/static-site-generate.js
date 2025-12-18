import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * HTML 템플릿에 SSR 결과를 적용하는 함수
 */
function applyTemplate(template, out) {
  const head = typeof out === "string" ? "" : (out.head ?? "");
  const appHtml = typeof out === "string" ? out : (out.appHtml ?? "");
  const appBody = typeof out === "string" ? "" : (out.appBody ?? "");

  return template
    .replace("<!--app-head-->", head)
    .replace("<!--app-html-->", appHtml)
    .replace("<!--app-body-->", appBody);
}

/**
 * 상품 데이터에서 모든 상품 ID 추출
 */
async function getAllProductIds() {
  try {
    // mocks/items.json에서 상품 목록 로드
    const itemsPath = path.join(__dirname, "src/mocks/items.json");
    console.log(`📁 Looking for items.json at: ${itemsPath}`);

    const data = await fs.readFile(itemsPath, "utf-8");
    const jsonData = JSON.parse(data);

    // React는 배열로, Vanilla는 {items: []} 형태로 저장됨
    const items = Array.isArray(jsonData) ? jsonData : jsonData.items || [];

    console.log(`📦 Found ${items.length} products`);
    return items.map((item) => item.productId || item.id);
  } catch (error) {
    console.error("Failed to load product data:", error);
    console.log("📁 Trying alternative path...");

    // 대체 경로 시도
    try {
      const altPath = path.join(__dirname, "../vanilla/src/mocks/items.json");
      console.log(`📁 Trying alternative path: ${altPath}`);

      const data = await fs.readFile(altPath, "utf-8");
      const jsonData = JSON.parse(data);
      const items = Array.isArray(jsonData) ? jsonData : jsonData.items || [];

      console.log(`📦 Found ${items.length} products via alternative path`);
      return items.map((item) => item.productId || item.id);
    } catch (altError) {
      console.error("Alternative path also failed:", altError);
      return [];
    }
  }
}

/**
 * React Static Site Generation
 */
async function generateStaticSite() {
  console.log("🏗️ Starting React SSG...");

  try {
    // 1. 빌드된 SSR 모듈과 템플릿 로드
    const ssrModule = await import("./dist/react-ssr/main-server.js");
    const { render } = ssrModule;

    const templatePath = path.join(__dirname, "../../dist/react/index.template.html");
    const template = await fs.readFile(templatePath, "utf-8");

    // 2. 동적으로 상품 페이지 목록 생성
    const productIds = await getAllProductIds();
    const limitedProductIds = productIds.slice(0, 50); // 빌드 시간 고려하여 처음 50개만

    const routes = [
      { path: "/", fileName: "index.html" },
      // 동적으로 상품 상세 페이지들 생성
      ...limitedProductIds.map((id) => ({
        path: `/product/${id}/`,
        fileName: `product-${id}.html`,
      })),
    ];

    const outputDir = path.join(__dirname, "../../dist/react");

    // 출력 디렉토리 확인
    await fs.mkdir(outputDir, { recursive: true });

    console.log(`📊 Total pages to generate: ${routes.length}`);
    console.log(`📦 Product pages: ${limitedProductIds.length}`);

    // 3. 각 라우트별로 HTML 생성
    const generatedFiles = [];
    const errors = [];

    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];
      try {
        console.log(`📄 Generating [${i + 1}/${routes.length}]: ${route.path}`);

        // SSR 렌더링
        const url = `/front_7th_chapter4-1/react${route.path}`;
        const out = await render(url, {});

        // 템플릿에 적용
        const html = applyTemplate(template, out);

        // 파일 저장
        const filePath = path.join(outputDir, route.fileName);
        await fs.writeFile(filePath, html, "utf-8");

        generatedFiles.push(route.fileName);

        // 진행률 표시
        if ((i + 1) % 10 === 0 || i === routes.length - 1) {
          console.log(`✅ Progress: ${i + 1}/${routes.length} pages generated`);
        }
      } catch (error) {
        console.error(`❌ Failed to generate ${route.path}:`, error.message);
        errors.push({ path: route.path, error: error.message });
      }
    }

    // 4. 404 페이지 생성
    try {
      console.log("📄 Generating 404 page...");
      const url = "/front_7th_chapter4-1/react/non-existent-page";
      const out = await render(url, {});
      const html = applyTemplate(template, out);
      await fs.writeFile(path.join(outputDir, "404.html"), html, "utf-8");
      generatedFiles.push("404.html");
    } catch (error) {
      console.error("❌ Failed to generate 404 page:", error);
    }

    // 5. 라우팅을 위한 _redirects 파일 생성 (Netlify 등에서 SPA 라우팅 지원)
    const redirectsContent = `/*    /index.html   200`;
    await fs.writeFile(path.join(outputDir, "_redirects"), redirectsContent);

    // 6. 결과 요약
    console.log("\n🎉 React SSG Complete!");
    console.log(`✅ Successfully generated: ${generatedFiles.length} files`);
    console.log(`❌ Errors: ${errors.length}`);

    if (errors.length > 0) {
      console.log("\nErrors:");
      errors.forEach(({ path, error }) => {
        console.log(`  - ${path}: ${error}`);
      });
    }

    console.log(`📂 Output directory: ${outputDir}`);
  } catch (error) {
    console.error("❌ SSG failed:", error);
    process.exit(1);
  }
}

// 실행
generateStaticSite();
