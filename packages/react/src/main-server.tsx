import { renderToString } from "react-dom/server";
import { App } from "./App";
import { router } from "./router";
import { productStore, PRODUCT_ACTIONS, initialProductState } from "./entities";
import { getProductsFromFile, getProductByIdFromFile, getCategoriesFromFile } from "./api/serverApi";

/**
 * Universal Router 설정 - 서버에서 현재 경로 설정
 */
function setupServerRouter(url: string) {
  // URL에서 base path 제거
  let cleanUrl = url.split("?")[0];
  const basePaths = ["/front_7th_chapter4-1/react", "/front_7th_chapter4-1/react/"];

  for (const base of basePaths) {
    if (cleanUrl.startsWith(base)) {
      cleanUrl = cleanUrl.substring(base.length);
      if (!cleanUrl.startsWith("/")) {
        cleanUrl = "/" + cleanUrl;
      }
      break;
    }
  }

  if (!cleanUrl || cleanUrl === "") {
    cleanUrl = "/";
  }

  // 서버에서 router 현재 경로 설정
  router.setCurrentPath(cleanUrl);

  return cleanUrl;
}

/**
 * 쿼리 파라미터 디코딩
 */
function decodeQueryParams(queryParams: Record<string, string>, passedQuery: Record<string, string>) {
  const mergedQuery = { ...queryParams, ...passedQuery };
  const decodedQuery: Record<string, string> = {};

  for (const [key, value] of Object.entries(mergedQuery)) {
    try {
      decodedQuery[key] = decodeURIComponent(value);
    } catch {
      decodedQuery[key] = value;
    }
  }

  return decodedQuery;
}

/**
 * 서버 사이드 데이터 프리페칭
 */
async function prefetchData(path: string, query: Record<string, string>) {
  try {
    // 매 요청마다 Store 완전 초기화 (동시 요청 격리)
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: {
        ...initialProductState,
        loading: false,
      },
    });

    if (path === "/") {
      // 홈페이지 - 상품 목록과 카테고리 로드
      const queryForAPI = {
        ...query,
        limit: parseInt(query.limit) || 20,
        page: parseInt(query.page || query.current) || 1,
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
    } else if (path.match(/^\/product\/(.+)\/$/)) {
      // 상품 상세 페이지
      const productId = path.match(/^\/product\/(.+)\/$/)?.[1];

      if (productId) {
        const product = await getProductByIdFromFile(productId);

        if (product) {
          let relatedProducts: unknown[] = [];
          if (product.category2) {
            const relatedData = await getProductsFromFile({
              category2: product.category2,
              limit: 20,
            });
            relatedProducts = relatedData.products.filter((p) => p.id !== product.id);
          }

          productStore.dispatch({
            type: PRODUCT_ACTIONS.SETUP,
            payload: {
              products: [],
              totalCount: 0,
              categories: [],
              currentProduct: product,
              relatedProducts: relatedProducts,
              loading: false,
              error: null,
              status: "done",
            },
          });
        } else {
          // 상품을 찾지 못한 경우 404 상태로 설정
          productStore.dispatch({
            type: PRODUCT_ACTIONS.SETUP,
            payload: {
              ...initialProductState,
              error: "Product not found",
              loading: false,
              status: "error",
            },
          });
        }
      }
    }
  } catch (error) {
    console.error("Server data prefetch error:", error);
    // 에러 발생 시 기본 상태로 초기화
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: {
        ...initialProductState,
        error: "Failed to load data",
        loading: false,
        status: "error",
      },
    });
  }
}

/**
 * 쿼리 파라미터 파싱
 */
function parseQuery(queryString: string): Record<string, string> {
  const query: Record<string, string> = {};
  if (!queryString) return query;

  const pairs = queryString.split("&");
  for (const pair of pairs) {
    const [key, value] = pair.split("=");
    if (key && value !== undefined) {
      query[key] = value;
    }
  }
  return query;
}

export const render = async (url: string, query: Record<string, string> = {}) => {
  try {
    // 1. Router 설정
    const cleanPath = setupServerRouter(url);

    // 2. 쿼리 파라미터 처리
    const queryParams = parseQuery(url.split("?")[1] || "");
    const decodedQuery = decodeQueryParams(queryParams, query);
    // mockRouter의 query를 직접 설정
    router.query = decodedQuery;

    // 3. 서버 데이터 프리페칭
    await prefetchData(cleanPath, decodedQuery);

    // 4. React 컴포넌트 렌더링
    const appHtml = renderToString(<App />);

    // 5. 초기 데이터 직렬화
    const initialData = productStore.getState();
    const initialDataScript = `
      <script>
        window.__INITIAL_DATA__ = ${JSON.stringify(initialData)};
      </script>
    `;

    // 6. 메타 태그 설정
    let title = "쇼핑몰";
    let description = "최고의 상품을 만나보세요";

    if (cleanPath === "/") {
      title = "쇼핑몰 - 홈";
      if (decodedQuery.search) {
        title = `검색: ${decodedQuery.search} - 쇼핑몰`;
      }
    } else if (cleanPath.match(/^\/product\/(.+)\/$/)) {
      const state = productStore.getState();
      if (state.currentProduct) {
        title = `${state.currentProduct.title} - 쇼핑몰`;
        description = state.currentProduct.title;
      }
    }

    const head = `
      <title>${title}</title>
      <meta name="description" content="${description}" />
      <meta property="og:title" content="${title}" />
      <meta property="og:description" content="${description}" />
    `;

    return {
      head,
      appHtml,
      appBody: initialDataScript,
    };
  } catch (error) {
    console.error("SSR render error:", error);

    // 에러 발생 시 기본 응답
    return {
      head: "<title>Error - 쇼핑몰</title>",
      appHtml: "<div>서버 오류가 발생했습니다.</div>",
      appBody: "<script>window.__INITIAL_DATA__ = null;</script>",
    };
  }
};
