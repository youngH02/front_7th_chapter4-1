import { registerGlobalEvents } from "./utils";
import { initRender } from "./render";
import { registerAllEvents } from "./events";
import { loadCartFromStorage } from "./services";
import { router } from "./router";
import { BASE_URL } from "./constants.js";
import { productStore } from "./stores/productStore.js";
import { PRODUCT_ACTIONS } from "./stores/actionTypes.js";

const enableMocking = () =>
  import("./mocks/browser.js").then(({ worker }) =>
    worker.start({
      serviceWorker: {
        url: `${BASE_URL}mockServiceWorker.js`,
      },
      onUnhandledRequest: "bypass",
    }),
  );

async function main() {
  // 🔑 Hydration: 서버에서 받은 초기 데이터 복원
  const initialData = window.__INITIAL_DATA__;

  if (initialData) {
    // productStore에 서버 데이터 복원
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: initialData,
    });

    // 메모리 정리
    delete window.__INITIAL_DATA__;
  }

  registerAllEvents();
  registerGlobalEvents();
  loadCartFromStorage();
  initRender();
  router.start();
}

if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
