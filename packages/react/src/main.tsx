import { App } from "./App";
import { router } from "./router";
import { BASE_URL } from "./constants.ts";
import { createRoot, hydrateRoot } from "react-dom/client";
import { productStore, PRODUCT_ACTIONS } from "./entities";

const enableMocking = () =>
  import("./mocks/browser").then(({ worker }) =>
    worker.start({
      serviceWorker: {
        url: `${BASE_URL}mockServiceWorker.js`,
      },
      onUnhandledRequest: "bypass",
    }),
  );

function main() {
  // 🔑 Hydration: 서버에서 받은 초기 데이터 복원
  const initialData = (window as unknown as { __INITIAL_DATA__?: unknown }).__INITIAL_DATA__;
  const rootElement = document.getElementById("root")!;

  if (initialData) {
    // SSR에서 받은 데이터로 상태 복원
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: initialData,
    });

    // 메모리 정리
    delete (window as unknown as { __INITIAL_DATA__?: unknown }).__INITIAL_DATA__;

    // Hydration - 서버 렌더링된 HTML을 클라이언트 React와 연결
    router.start();
    hydrateRoot(rootElement, <App />);
    console.log("🔄 React Hydration completed with initial data");
  } else {
    // CSR 모드 - 순수 클라이언트 렌더링
    router.start();
    createRoot(rootElement).render(<App />);
    console.log("🚀 React CSR mode started");
  }
}

// 애플리케이션 시작
if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
