import { useEffect } from "react";
import { loadNextProducts, loadProductsAndCategories, ProductList, SearchBar, useProductStore } from "../entities";
import { PageWrapper } from "./PageWrapper";

const headerLeft = (
  <h1 className="text-xl font-bold text-gray-900">
    <a href="/" data-link="/">
      쇼핑몰
    </a>
  </h1>
);

// 무한 스크롤 이벤트 등록
let scrollHandlerRegistered = false;

const registerScrollHandler = () => {
  if (scrollHandlerRegistered) return;

  window.addEventListener("scroll", loadNextProducts);
  scrollHandlerRegistered = true;
};

const unregisterScrollHandler = () => {
  if (!scrollHandlerRegistered) return;
  window.removeEventListener("scroll", loadNextProducts);
  scrollHandlerRegistered = false;
};

export const HomePage = () => {
  const { products, status } = useProductStore();

  useEffect(() => {
    registerScrollHandler();

    // Hydration 체크: 이미 데이터가 있으면 스킵 (SSR로 로드된 데이터)
    if (products.length > 0 && status === "done") {
      return;
    }

    // 데이터 없으면 로드 (CSR)
    loadProductsAndCategories();

    return unregisterScrollHandler;
  }, [products.length, status]);

  return (
    <PageWrapper headerLeft={headerLeft}>
      {/* 검색 및 필터 */}
      <SearchBar />

      {/* 상품 목록 */}
      <div className="mb-6">
        <ProductList />
      </div>
    </PageWrapper>
  );
};
