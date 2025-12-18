import { useRouterParams } from "../../../../router";
import { useEffect } from "react";
import { loadProductDetailForPage } from "../../productUseCase";
import { useProductStore } from "../../hooks/useProductStore";

export const useLoadProductDetail = () => {
  const productId = useRouterParams((params) => params.id);
  const { currentProduct, status } = useProductStore();

  useEffect(() => {
    // Hydration 체크: 이미 현재 상품 데이터가 있고 완료 상태라면 스킵
    if (currentProduct && currentProduct.id === productId && status === "done") {
      return;
    }

    // 데이터 없거나 다른 상품이면 로드
    if (productId) {
      loadProductDetailForPage(productId);
    }
  }, [productId, currentProduct, status]);
};
