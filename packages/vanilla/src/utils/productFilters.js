/**
 * 상품 필터링 및 정렬 유틸리티
 * MSW 핸들러와 서버 API에서 공통으로 사용
 */

/**
 * 카테고리 추출
 * @param {Array} items - 상품 목록
 * @returns {Object} 카테고리 객체
 */
export function getUniqueCategories(items) {
  const categories = {};

  items.forEach((item) => {
    const cat1 = item.category1;
    const cat2 = item.category2;

    if (!categories[cat1]) categories[cat1] = {};
    if (cat2 && !categories[cat1][cat2]) categories[cat1][cat2] = {};
  });

  return categories;
}

/**
 * 상품 검색 및 필터링
 * @param {Array} products - 상품 목록
 * @param {Object} query - 쿼리 파라미터
 * @returns {Array} 필터링된 상품 목록
 */
export function filterProducts(products, query) {
  let filtered = [...products];

  // 검색어 필터링 (search 또는 query 파라미터 지원)
  const searchTerm = query.search || query.query;
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

  // 정렬 (기본값은 price_asc)
  const sortType = query.sort || "price_asc";
  switch (sortType) {
    case "price_asc":
      filtered.sort((a, b) => parseInt(a.lprice) - parseInt(b.lprice));
      break;
    case "price_desc":
      filtered.sort((a, b) => parseInt(b.lprice) - parseInt(a.lprice));
      break;
    case "name_asc":
      filtered.sort((a, b) => a.title.localeCompare(b.title, "ko"));
      break;
    case "name_desc":
      filtered.sort((a, b) => b.title.localeCompare(a.title, "ko"));
      break;
    default:
      // 기본은 가격 낮은 순
      filtered.sort((a, b) => parseInt(a.lprice) - parseInt(b.lprice));
  }

  return filtered;
}
