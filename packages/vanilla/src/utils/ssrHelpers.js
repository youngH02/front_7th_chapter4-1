/**
 * SSR HTML 생성 헬퍼 함수들
 * 완전한 HTML 구조 생성
 */

/**
 * 홈페이지 HTML 생성
 */
export function renderHomePage(state, query = {}) {
  const { products = [], totalCount = 0, categories = {} } = state;
  const categoryKeys = Object.keys(categories || {});

  // 현재 쿼리 파라미터 값들
  const searchQuery = query.search || query.q || "";
  const limit = query.limit || "20";
  const sort = query.sort || "price_asc";
  const selectedCategory = query.category1 || "";

  return `
    <div id="root">
      <header class="bg-white shadow sticky top-0 z-50">
        <div class="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 class="text-xl font-bold text-gray-900">
            <a href="/" data-link>쇼핑몰</a>
          </h1>
          <button id="cart-icon-btn" class="relative p-2 text-gray-700 hover:text-gray-900">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            <span class="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">0</span>
          </button>
        </div>
      </header>

      <main class="container mx-auto px-4 py-6">
        <!-- 검색 및 필터 -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <div class="mb-4">
            <div class="relative">
              <input type="text" 
                     id="search-input"
                     placeholder="상품명을 검색해보세요..." 
                     value="${searchQuery}"
                     class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg 
                            focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
            </div>
          </div>

          <div class="space-y-3">
            <div class="flex flex-wrap gap-2">
              ${
                categoryKeys.length > 0
                  ? categoryKeys
                      .map(
                        (cat) => `
                <button 
                  data-category1="${cat}"
                  class="category1-filter-btn text-left px-3 py-2 text-sm rounded-md border transition-colors
                         ${selectedCategory === cat ? "bg-blue-500 border-blue-500 text-white" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"}"
                >
                  ${cat}
                </button>
              `,
                      )
                      .join("")
                  : `<div class="text-sm text-gray-500">카테고리 로딩 중...</div>`
              }
            </div>

            <div class="flex gap-4">
              <div>
                <label class="text-sm text-gray-600 mr-2">페이지당 상품:</label>
                <select id="limit-select" class="border border-gray-300 rounded px-2 py-1 text-sm">
                  <option value="10" ${limit === "10" ? "selected" : ""}>10개</option>
                  <option value="20" ${limit === "20" ? "selected" : ""}>20개</option>
                  <option value="50" ${limit === "50" ? "selected" : ""}>50개</option>
                  <option value="100" ${limit === "100" ? "selected" : ""}>100개</option>
                </select>
              </div>
              <div>
                <label class="text-sm text-gray-600 mr-2">정렬:</label>
                <select id="sort-select" class="border border-gray-300 rounded px-2 py-1 text-sm">
                  <option value="price_asc" ${sort === "price_asc" ? "selected" : ""}>가격 낮은순</option>
                  <option value="price_desc" ${sort === "price_desc" ? "selected" : ""}>가격 높은순</option>
                  <option value="name_asc" ${sort === "name_asc" ? "selected" : ""}>이름 순</option>
                  <option value="name_desc" ${sort === "name_desc" ? "selected" : ""}>이름 역순</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- 상품 목록 -->
        <div class="mb-6">
          <p class="text-gray-700 mb-4">총 <strong>${totalCount}</strong>개의 상품</p>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4" id="products-grid">
            ${products
              .map(
                (product) => `
              <div class="border p-4 rounded-lg hover:shadow-lg transition product-card">
                <img src="${product.image}" alt="${product.title}" class="w-full h-48 object-cover mb-2 rounded">
                <h3 class="font-semibold text-sm mb-1 line-clamp-2">${product.title}</h3>
                <p class="text-blue-600 font-bold">${parseInt(product.lprice).toLocaleString()}원</p>
                <button class="add-to-cart-btn mt-2 w-full bg-blue-500 text-white py-1 text-sm rounded hover:bg-blue-600">장바구니</button>
                <a href="/product/${product.productId}/" class="text-sm text-blue-500 hover:underline mt-2 inline-block" data-link>상세보기</a>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>
      </main>

      <footer class="bg-gray-100 mt-12 py-6">
        <div class="container mx-auto px-4 text-center text-sm text-gray-600">
          <p>© 2025 항해플러스 프론트엔드 쇼핑몰</p>
        </div>
      </footer>
    </div>
  `;
}

/**
 * 상품 상세 페이지 HTML 생성
 */
export function renderProductDetailPage(state) {
  const { currentProduct: product, relatedProducts = [] } = state;

  if (!product) {
    return `
    <div id="root">
        <header class="bg-white shadow">
          <div class="container mx-auto px-4 py-4">
            <h1 class="text-xl font-bold text-gray-900">
              <a href="/" data-link>쇼핑몰</a>
            </h1>
          </div>
        </header>
        <main class="container mx-auto px-4 py-6">
          <h1>상품을 찾을 수 없습니다</h1>
        </main>
    </div>
    `;
  }

  return `
    <div id="root">
      <header class="bg-white shadow sticky top-0 z-50">
        <div class="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 class="text-xl font-bold text-gray-900">
            <a href="/" data-link>쇼핑몰</a>
          </h1>
          <button id="cart-icon-btn" class="relative p-2 text-gray-700 hover:text-gray-900">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            <span class="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">0</span>
          </button>
        </div>
      </header>

      <main class="container mx-auto px-4 py-6">
        <a href="/" class="text-blue-500 hover:underline mb-6 inline-block" data-link>← 목록으로</a>
        
        <div class="mb-4 text-sm text-gray-500">상품 상세</div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div>
            <img src="${product.image}" alt="${product.title}" class="w-full rounded-lg shadow-sm">
          </div>
          
          <div>
            <h1 class="text-3xl font-bold mb-4">${product.title}</h1>
            <p class="text-sm text-gray-600 mb-4">${product.brand || ""}</p>
            <p class="text-4xl font-bold text-blue-600 mb-6">${parseInt(product.lprice).toLocaleString()}원</p>
            <p class="text-gray-700 mb-6">카테고리: ${product.category1}${product.category2 ? ` > ${product.category2}` : ""}</p>
            
            <div class="flex items-center gap-4 mb-6">
              <label for="quantity-input" class="text-sm font-medium">수량:</label>
              <div class="flex items-center border rounded-lg">
                <button id="quantity-decrease" class="px-3 py-2 hover:bg-gray-100">-</button>
                <input id="quantity-input" type="number" value="1" min="1" class="w-16 text-center border-0 focus:ring-0">
                <button id="quantity-increase" class="px-3 py-2 hover:bg-gray-100">+</button>
              </div>
            </div>
            
            <button id="add-to-cart-btn" class="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold">
              장바구니 추가
            </button>
          </div>
        </div>
        
        ${
          relatedProducts.length > 0
            ? `
          <div>
            <h2 class="text-2xl font-bold mb-6">관련 상품</h2>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              ${relatedProducts
                .slice(0, 8)
                .map(
                  (p) => `
                <div class="border p-4 rounded-lg hover:shadow-lg transition related-product-card">
                  <img src="${p.image}" alt="${p.title}" class="w-full h-40 object-cover mb-2 rounded">
                  <h3 class="font-semibold text-sm mb-1 line-clamp-2">${p.title}</h3>
                  <p class="text-blue-600 font-bold text-sm">${parseInt(p.lprice).toLocaleString()}원</p>
                  <a href="/product/${p.productId}/" class="text-xs text-blue-500 hover:underline mt-2 inline-block" data-link>보기</a>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>
        `
            : ""
        }
      </main>

      <footer class="bg-gray-100 mt-12 py-6">
        <div class="container mx-auto px-4 text-center text-sm text-gray-600">
          <p>© 2025 항해플러스 프론트엔드 쇼핑몰</p>
        </div>
      </footer>
    </div>
  `;
}
