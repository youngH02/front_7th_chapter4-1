import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { filterProducts, getUniqueCategories } from "../utils/productFilters.js";

// ES Module에서 __dirname 만들기
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. items.json 파일 경로 찾기
// src 환경과 dist 환경 모두 지원
let itemsPath = path.join(__dirname, "../mocks/items.json");

// dist 환경일 경우 경로 조정 (mocks가 같은 레벨에 있음)
if (__dirname.includes("/dist/")) {
  const altPath = path.join(__dirname, "./mocks/items.json");
  itemsPath = altPath;
}
// 2. 파일 읽기
export async function loadItems() {
  const data = await fs.readFile(itemsPath, "utf-8");
  return JSON.parse(data);
}

export async function getCategoriesFromFile() {
  const items = await loadItems();
  return getUniqueCategories(items);
}

export async function getProductByIdFromFile(productId) {
  const items = await loadItems();
  return items.find((item) => item.productId === productId);
}

export async function getProductsFromFile(params = {}) {
  const items = await loadItems();
  const { limit = 20, page = 1, current } = params;
  const actualPage = current ?? page;

  // 1. 필터링 및 정렬
  const filtered = filterProducts(items, params);

  // 2. 페이지네이션
  const startIndex = (actualPage - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedProducts = filtered.slice(startIndex, endIndex);

  // 3. 응답 데이터
  return {
    products: paginatedProducts,
    pagination: {
      page: actualPage,
      limit,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / limit),
      hasNext: endIndex < filtered.length,
      hasPrev: actualPage > 1,
    },
  };
}
