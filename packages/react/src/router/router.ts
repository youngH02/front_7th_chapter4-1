// 글로벌 라우터 인스턴스
import { Router } from "@hanghae-plus/lib";
import type { FunctionComponent } from "react";
import { BASE_URL } from "../constants";

// 서버 환경 체크
const isServer = typeof window === "undefined";

// SSR용 mock router는 query를 설정할 수 있어야 함
const mockRouter = {
  query: {} as Record<string, string>,
  params: {} as Record<string, string>,
  route: null,
  target: null,
  setQuery: function (newQuery: Record<string, string>) {
    this.query = newQuery;
  },
  push: () => {},
  subscribe: () => () => {},
  start: () => {},
  addRoute: () => {},
  setCurrentPath: () => {},
  setServerQuery: function (newQuery: Record<string, string>) {
    this.query = newQuery;
  },
};

export const router = isServer
  ? (mockRouter as unknown as Router<FunctionComponent>)
  : new Router<FunctionComponent>(BASE_URL);
