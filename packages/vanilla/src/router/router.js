// 글로벌 라우터 인스턴스
import { Router } from "../lib";
import { BASE_URL } from "../constants.js";

// 서버 환경에서는 mock router 사용
const isServer = typeof window === "undefined";

// SSR용 mock router는 query를 설정할 수 있어야 함
const mockRouter = {
  query: {},
  params: {},
  setQuery: function (newQuery) {
    this.query = newQuery;
  },
  push: () => {},
  replace: () => {},
  back: () => {},
  forward: () => {},
  subscribe: () => {},
  start: () => {},
};

export const router = isServer ? mockRouter : new Router(BASE_URL);
