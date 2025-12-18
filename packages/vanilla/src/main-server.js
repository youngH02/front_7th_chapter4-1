import { ServerRouter } from "./lib/ServerRouter.js";
import { getProductsFromFile, getProductByIdFromFile, getCategoriesFromFile } from "./api/serverApi.js";
import { productStore, initialProductState } from "./stores/productStore.js";
import { PRODUCT_ACTIONS } from "./stores/actionTypes.js";
import { BASE_URL } from "./constants.js";

// 서버 라우터 설정
const serverRouter = new ServerRouter(BASE_URL);

// 라우트 등록은 동적으로 (페이지 컴포넌트 import 문제 회피)
const routes = {
  "/": "HomePage",
  "/product/:id/": "ProductDetailPage",
};

Object.entries(routes).forEach(([path, name]) => {
  serverRouter.addRoute(path, name);
});

/**
 * SSR 렌더링 함수
 * @param {string} url - 요청 URL
 * @param {Object} query - 쿼리 파라미터
 * @returns {Promise<{head: string, appHtml: string}>}
 */
export const render = async (url, query) => {
  console.log("🔍 SSR Rendering:", { url, query });

  try {
    // 1. URL 매칭
    const matched = serverRouter.match(url);

    if (!matched) {
      console.log("❌ No route matched");
      return {
        head: "<title>404 Not Found</title>",
        appHtml: "<h1>404 - Page Not Found</h1>",
      };
    }

    console.log("✅ Route matched:", matched.path, matched.params);

    // 2. Store 초기화 (매 요청마다 리셋)
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: initialProductState,
    });

    // 3. 라우트별 데이터 프리페칭
    if (matched.path === "/") {
      // 홈페이지: 상품 목록 + 카테고리
      const queryParams = ServerRouter.parseQuery(url.split("?")[1] || "");
      const mergedQuery = { ...queryParams, ...query };

      console.log("📦 Loading products with query:", mergedQuery);

      const [productsData, categories] = await Promise.all([
        getProductsFromFile({
          ...mergedQuery,
          limit: parseInt(mergedQuery.limit) || 20,
          page: parseInt(mergedQuery.page || mergedQuery.current) || 1,
        }),
        getCategoriesFromFile(),
      ]);

      // Store에 데이터 저장
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: {
          products: productsData.products,
          totalCount: productsData.pagination.total,
          categories: categories,
          loading: false,
          error: null,
          status: "done",
        },
      });

      console.log("✅ Loaded", productsData.products.length, "products");
    } else if (matched.path === "/product/:id/") {
      // 상품 상세: 특정 상품 + 관련 상품
      const productId = matched.params.id;
      console.log("📦 Loading product:", productId);

      const product = await getProductByIdFromFile(productId);

      if (!product) {
        console.log("❌ Product not found:", productId);
        return {
          head: "<title>상품을 찾을 수 없습니다</title>",
          appHtml: "<h1>상품을 찾을 수 없습니다</h1>",
        };
      }

      // 관련 상품 (같은 category2)
      let relatedProducts = [];
      if (product.category2) {
        const relatedData = await getProductsFromFile({
          category2: product.category2,
          limit: 20,
        });
        relatedProducts = relatedData.products.filter((p) => p.productId !== productId);
      }

      // Store에 데이터 저장
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: {
          currentProduct: product,
          relatedProducts: relatedProducts,
          loading: false,
          error: null,
          status: "done",
        },
      });

      console.log("✅ Loaded product:", product.title);
    }

    // 4. HTML 생성 (임시 - Phase 4에서 실제 컴포넌트 사용)
    const state = productStore.getState();
    const htmlContent = generateHTML(matched.path, state, matched.params);

    // 5. 초기 데이터 주입
    const initialData = productStore.getState();

    return {
      head: `
        <title>${matched.path === "/" ? "쇼핑몰 - 상품 목록" : state.currentProduct?.title || "상품 상세"}</title>
        <meta name="description" content="SSR로 렌더링된 쇼핑몰">
      `,
      appHtml: `
        ${htmlContent}
        <script>
          window.__INITIAL_DATA__ = ${JSON.stringify(initialData)};
          console.log('✅ Initial data injected:', window.__INITIAL_DATA__);
        </script>
      `,
    };
  } catch (error) {
    console.error("❌ SSR Error:", error);
    return {
      head: "<title>Error</title>",
      appHtml: `<h1>Server Error</h1><pre>${error.message}</pre>`,
    };
  }
};

/**
 * 임시 HTML 생성 함수 (Phase 4에서 실제 컴포넌트로 교체)
 */
function generateHTML(path, state) {
  if (path === "/") {
    // 홈페이지
    return `
      <div id="root">
        <div class="container mx-auto p-4">
          <h1 class="text-2xl font-bold mb-4">쇼핑몰 - SSR 테스트</h1>
          <p class="mb-4">총 ${state.totalCount}개의 상품</p>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            ${state.products
              .map(
                (product) => `
              <div class="border p-4 rounded">
                <img src="${product.image}" alt="${product.title}" class="w-full h-48 object-cover mb-2">
                <h3 class="font-semibold text-sm mb-1">${product.title.substring(0, 30)}...</h3>
                <p class="text-blue-600 font-bold">${parseInt(product.lprice).toLocaleString()}원</p>
                <a href="/product/${product.productId}/" class="text-sm text-blue-500 hover:underline">상세보기</a>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>
      </div>
    `;
  } else if (path === "/product/:id/") {
    // 상품 상세
    const product = state.currentProduct;
    return `
      <div id="root">
        <div class="container mx-auto p-4">
          <a href="/" class="text-blue-500 hover:underline mb-4 inline-block">← 목록으로</a>
          <div class="bg-white rounded-lg shadow p-6">
            <img src="${product.image}" alt="${product.title}" class="w-full h-96 object-cover mb-4">
            <h1 class="text-2xl font-bold mb-2">${product.title}</h1>
            <p class="text-sm text-gray-600 mb-2">${product.brand}</p>
            <p class="text-3xl text-blue-600 font-bold mb-4">${parseInt(product.lprice).toLocaleString()}원</p>
            <p class="text-gray-700">카테고리: ${product.category1} > ${product.category2}</p>
          </div>
          
          ${
            state.relatedProducts.length > 0
              ? `
            <div class="mt-8">
              <h2 class="text-xl font-bold mb-4">관련 상품 (${state.relatedProducts.length}개)</h2>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                ${state.relatedProducts
                  .slice(0, 8)
                  .map(
                    (p) => `
                  <div class="border p-4 rounded">
                    <img src="${p.image}" alt="${p.title}" class="w-full h-32 object-cover mb-2">
                    <h3 class="text-sm font-semibold">${p.title.substring(0, 20)}...</h3>
                    <p class="text-blue-600">${parseInt(p.lprice).toLocaleString()}원</p>
                  </div>
                `,
                  )
                  .join("")}
              </div>
            </div>
          `
              : ""
          }
        </div>
      </div>
    `;
  }

  return "<div>Unknown route</div>";
}
