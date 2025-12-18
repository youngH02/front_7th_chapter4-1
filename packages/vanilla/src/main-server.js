import { ServerRouter } from "./lib/ServerRouter.js";
import { getProductsFromFile, getProductByIdFromFile, getCategoriesFromFile } from "./api/serverApi.js";
import { productStore, initialProductState } from "./stores/productStore.js";
import { PRODUCT_ACTIONS } from "./stores/actionTypes.js";
import { HomePage, NotFoundPage, ProductDetailPage } from "./pages/index.js";
import { router } from "./router/router.js";

// 서버 라우터 설정
const serverRouter = new ServerRouter("/");

// 라우트 등록
serverRouter.addRoute("/", "HomePage");
serverRouter.addRoute("/product/:id/", "ProductDetailPage");

/**
 * URL에서 base path를 제거하는 함수
 */
function cleanBasePathFromUrl(url) {
  let cleanUrl = url.split("?")[0]; // 쿼리 스트링 제거
  const basePaths = ["/front_7th_chapter4-1/vanilla", "/front_7th_chapter4-1/vanilla/"];

  for (const base of basePaths) {
    if (cleanUrl.startsWith(base)) {
      cleanUrl = cleanUrl.substring(base.length);
      if (!cleanUrl.startsWith("/")) {
        cleanUrl = "/" + cleanUrl;
      }
      break;
    }
  }

  // 빈 문자열이면 홈페이지
  return cleanUrl || "/";
}

/**
 * 쿼리 파라미터를 디코딩하는 함수
 */
function decodeQueryParams(queryParams, passedQuery) {
  const mergedQuery = { ...queryParams, ...passedQuery };
  const decodedQuery = {};

  for (const [key, value] of Object.entries(mergedQuery)) {
    try {
      decodedQuery[key] = decodeURIComponent(value);
    } catch {
      decodedQuery[key] = value; // 디코딩 실패 시 원본 사용
    }
  }

  return decodedQuery;
}

/**
 * SSR 렌더링 함수
 */
export const render = async (url, query) => {
  try {
    // 1. Base path 제거
    const cleanUrl = cleanBasePathFromUrl(url);

    // 2. URL 매칭
    const matched = serverRouter.match(cleanUrl);

    if (!matched) {
      return {
        head: "<title>404 Not Found</title>",
        appHtml: NotFoundPage(),
      };
    }

    // 2. Store 완전 초기화
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: {
        ...initialProductState,
        loading: false,
      },
    });

    // 3. 쿼리 파라미터 병합 및 디코딩
    const queryParams = ServerRouter.parseQuery(url.split("?")[1] || "");
    const decodedQuery = decodeQueryParams(queryParams, query);

    // 서버 환경에서 router.query 설정
    router.setQuery(decodedQuery);

    // 4. 라우트별 데이터 프리페칭
    if (matched.path === "/") {
      // 홈페이지

      const queryForAPI = {
        ...decodedQuery,
        limit: parseInt(decodedQuery.limit) || 20,
        page: parseInt(decodedQuery.page || decodedQuery.current) || 1,
      };

      const [productsData, categories] = await Promise.all([getProductsFromFile(queryForAPI), getCategoriesFromFile()]);

      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: {
          products: productsData.products,
          totalCount: productsData.pagination.total,
          categories: categories,
          currentProduct: null,
          relatedProducts: [],
          loading: false,
          error: null,
          status: "done",
        },
      });
    } else if (matched.path === "/product/:id/") {
      // 상품 상세
      const productId = matched.params.id;

      const product = await getProductByIdFromFile(productId);

      if (!product) {
        return {
          head: "<title>상품을 찾을 수 없습니다 - 쇼핑몰</title>",
          appHtml: NotFoundPage(),
        };
      }

      // 관련 상품
      let relatedProducts = [];
      if (product.category2) {
        const relatedData = await getProductsFromFile({
          category2: product.category2,
          limit: 20,
        });
        relatedProducts = relatedData.products.filter((p) => p.productId !== productId);
      }

      const payload = {
        products: [],
        totalCount: 0,
        categories: {},
        currentProduct: product,
        relatedProducts: relatedProducts,
        loading: false,
        error: null,
        status: "done",
      };

      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload,
      });
    }

    // 5. HTML 생성 - 기존 컴포넌트 재사용
    const state = productStore.getState();
    let htmlContent = "";

    if (matched.path === "/") {
      // HomePage 컴포넌트 사용 - router.query 설정
      router.setQuery(decodedQuery);
      htmlContent = HomePage();
    } else if (matched.path === "/product/:id/") {
      // ProductDetailPage 컴포넌트 사용
      // 서버 환경에서 router.params 설정
      router.params = matched.params;
      htmlContent = ProductDetailPage();
    } else {
      // 알 수 없는 경로
      return {
        head: "<title>404 Not Found</title>",
        appHtml: NotFoundPage(),
      };
    }

    // 6. 초기 데이터 주입
    // 테스트가 기대하는 순서로 데이터 구성
    const initialData = {
      products: state.products || [],
      totalCount: state.totalCount || 0,
      currentProduct: state.currentProduct || null,
      relatedProducts: state.relatedProducts || [],
      loading: state.loading || false,
      error: state.error || null,
      status: state.status || "done",
      categories: state.categories || {},
    };

    return {
      head: `
        <title>${matched.path === "/" ? "쇼핑몰 - 홈" : state.currentProduct?.title ? `${state.currentProduct.title} - 쇼핑몰` : "상품 상세"}</title>
        <meta name="description" content="SSR로 렌더링된 쇼핑몰">
        <!-- DEBUG: ${JSON.stringify({ decodedQuery, hasSearch: !!decodedQuery.search })} -->
      `,
      appHtml: htmlContent,
      appBody: `
        <script>
          window.__INITIAL_DATA__ = ${JSON.stringify(initialData)};
          window.__DEBUG_QUERY__ = ${JSON.stringify(decodedQuery)};
        </script>
      `,
    };
  } catch (error) {
    return {
      head: "<title>Error</title>",
      appHtml: `<h1>Server Error</h1><pre>${error.message}</pre>`,
    };
  }
};
