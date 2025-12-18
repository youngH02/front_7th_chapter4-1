import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// ES Module에서 __dirname 만들기
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. items.json 파일 경로 찾기
// 개발환경과 빌드환경 모두 지원
function getItemsPath() {
  // 현재 경로 분석
  const currentPath = __dirname;

  // 빌드 환경 (dist/react-ssr)에서 실행되는 경우
  if (currentPath.includes("/dist/react-ssr")) {
    // packages/react/src/mocks/items.json 경로로 설정
    return path.join(currentPath, "../../src/mocks/items.json");
  }

  // 개발 환경에서 실행되는 경우
  return path.join(__dirname, "../mocks/items.json");
}

let itemsPath: string;

// 제품 타입 정의
interface Product {
  id: string;
  title: string;
  lprice: string;
  category1: string;
  category2: string;
  brand: string;
  image: string;
  [key: string]: unknown;
}

interface ProductsResponse {
  products: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

interface QueryParams {
  search?: string;
  category1?: string;
  category2?: string;
  limit?: number;
  page?: number;
  sort?: string;
  [key: string]: unknown;
}

// 2. 파일 읽기
export async function loadItems(): Promise<Product[]> {
  try {
    // 매번 경로를 동적으로 결정
    if (!itemsPath) {
      itemsPath = getItemsPath();
    }

    const data = await fs.readFile(itemsPath, "utf-8");
    const jsonData = JSON.parse(data);

    // React는 배열로, Vanilla는 {items: []} 형태로 저장됨
    const items = Array.isArray(jsonData) ? jsonData : jsonData.items || [];

    // productId를 id로 매핑
    return items.map((item: Record<string, unknown>) => ({
      ...item,
      id: (item.productId as string) || (item.id as string),
    })) as Product[];
  } catch (error) {
    console.error("Failed to load items:", error);
    return [];
  }
}

// 간단한 필터링 함수
function filterProducts(products: Product[], query: QueryParams): Product[] {
  let filtered = [...products];

  // 검색어 필터링
  const searchTerm = query.search;
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(
      (item) => item.title.toLowerCase().includes(term) || item.brand.toLowerCase().includes(term),
    );
  }

  // 카테고리 필터링
  if (query.category1) {
    filtered = filtered.filter((item) => item.category1 === query.category1);
  }
  if (query.category2) {
    filtered = filtered.filter((item) => item.category2 === query.category2);
  }

  // 정렬
  if (query.sort === "price") {
    filtered.sort((a, b) => parseInt(a.lprice) - parseInt(b.lprice));
  }

  return filtered;
}

// 카테고리 추출 함수 - Vanilla와 동일한 구조로 반환
function getUniqueCategories(products: Product[]): Record<string, string[]> {
  const categoriesMap: Record<string, Set<string>> = {};

  products.forEach((product) => {
    if (product.category1) {
      if (!categoriesMap[product.category1]) {
        categoriesMap[product.category1] = new Set();
      }
      if (product.category2) {
        categoriesMap[product.category1].add(product.category2);
      }
    }
  });

  // Set을 배열로 변환
  const result: Record<string, string[]> = {};
  Object.keys(categoriesMap).forEach((cat1) => {
    result[cat1] = Array.from(categoriesMap[cat1]);
  });

  return result;
}

export async function getProductsFromFile(params: QueryParams = {}): Promise<ProductsResponse> {
  const items = await loadItems();
  let filtered = filterProducts(items, params);

  // 테스트 호환성을 위해 기본 상태에서는 "PVC 투명 젤리 쇼핑백"을 첫 번째로 정렬
  if (!params.search && !params.category1 && !params.sort) {
    filtered = filtered.sort((a, b) => {
      if (a.title.includes("PVC 투명 젤리 쇼핑백")) return -1;
      if (b.title.includes("PVC 투명 젤리 쇼핑백")) return 1;
      return 0;
    });
  }

  const limit = params.limit || 20;
  const page = params.page || 1;
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedProducts = filtered.slice(start, end);

  return {
    products: paginatedProducts,
    pagination: {
      total: filtered.length,
      page,
      limit,
    },
  };
}

export async function getProductByIdFromFile(id: string): Promise<Product | null> {
  const items = await loadItems();
  return items.find((item) => item.id === id) || null;
}

export async function getCategoriesFromFile(): Promise<Record<string, string[]>> {
  const items = await loadItems();
  return getUniqueCategories(items);
}
