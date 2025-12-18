import { http, HttpResponse } from "msw";
import items from "./items.json";
import { filterProducts, getUniqueCategories } from "../utils/productFilters.js";

const delay = async () => await new Promise((resolve) => setTimeout(resolve, 200));

export const handlers = [
  // 상품 목록 API
  http.get("/api/products", async ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") ?? url.searchParams.get("current")) || 1;
    const limit = parseInt(url.searchParams.get("limit")) || 20;
    const search = url.searchParams.get("search") || "";
    const category1 = url.searchParams.get("category1") || "";
    const category2 = url.searchParams.get("category2") || "";
    const sort = url.searchParams.get("sort") || "price_asc";

    // 필터링된 상품들
    const filteredProducts = filterProducts(items, {
      search,
      category1,
      category2,
      sort,
    });

    // 페이지네이션
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    // 응답 데이터
    const response = {
      products: paginatedProducts,
      pagination: {
        page,
        limit,
        total: filteredProducts.length,
        totalPages: Math.ceil(filteredProducts.length / limit),
        hasNext: endIndex < filteredProducts.length,
        hasPrev: page > 1,
      },
      filters: {
        search,
        category1,
        category2,
        sort,
      },
    };

    await delay();

    return HttpResponse.json(response);
  }),

  // 상품 상세 API
  http.get("/api/products/:id", ({ params }) => {
    const { id } = params;
    const product = items.find((item) => item.productId === id);

    if (!product) {
      return HttpResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // 상세 정보에 추가 데이터 포함
    const detailProduct = {
      ...product,
      description: `${product.title}에 대한 상세 설명입니다. ${product.brand} 브랜드의 우수한 품질을 자랑하는 상품으로, 고객 만족도가 높은 제품입니다.`,
      rating: Math.floor(Math.random() * 2) + 4, // 4~5점 랜덤
      reviewCount: Math.floor(Math.random() * 1000) + 50, // 50~1050개 랜덤
      stock: Math.floor(Math.random() * 100) + 10, // 10~110개 랜덤
      images: [product.image, product.image.replace(".jpg", "_2.jpg"), product.image.replace(".jpg", "_3.jpg")],
    };

    return HttpResponse.json(detailProduct);
  }),

  // 카테고리 목록 API
  http.get("/api/categories", async () => {
    const categories = getUniqueCategories(items);
    await delay();
    return HttpResponse.json(categories);
  }),
];
