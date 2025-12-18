import { createObserver } from "./createObserver";
import type { AnyFunction, StringRecord } from "./types";

interface Route<Handler extends AnyFunction> {
  regex: RegExp;
  paramNames: string[];
  handler: Handler;
  params?: StringRecord;
}

type QueryPayload = Record<string, string | number | undefined>;

export type RouterInstance<T extends AnyFunction> = InstanceType<typeof Router<T>>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class Router<Handler extends (...args: any[]) => any> {
  readonly #routes: Map<string, Route<Handler>>;
  readonly #observer = createObserver();
  readonly #baseUrl;

  #route: null | (Route<Handler> & { params: StringRecord; path: string });
  #serverQuery: StringRecord | null = null;

  constructor(baseUrl = "") {
    this.#routes = new Map();
    this.#route = null;
    this.#baseUrl = baseUrl.replace(/\/$/, "");

    // 클라이언트 환경에서만 이벤트 리스너 등록
    if (typeof window !== "undefined") {
      window.addEventListener("popstate", () => {
        this.#route = this.#findRoute();
        this.#observer.notify();
      });
    }

    if (typeof document !== "undefined") {
      document.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        if (!target?.closest("[data-link]")) {
          return;
        }
        e.preventDefault();
        const url = target.getAttribute("href") ?? target.closest("[data-link]")?.getAttribute("href");
        if (url) {
          this.push(url);
        }
      });
    }
  }

  get query(): StringRecord {
    // 서버 환경에서는 설정된 쿼리 사용
    if (this.#serverQuery !== null) {
      return this.#serverQuery;
    }
    return Router.parseQuery(typeof window !== "undefined" ? window.location.search : "");
  }

  set query(newQuery: QueryPayload) {
    const newUrl = Router.getUrl(newQuery, this.#baseUrl);
    this.push(newUrl);
  }

  get params() {
    return this.#route?.params ?? {};
  }

  get route() {
    return this.#route;
  }

  get target() {
    return this.#route?.handler;
  }

  readonly subscribe = this.#observer.subscribe;

  addRoute(path: string, handler: Handler) {
    // 경로 패턴을 정규식으로 변환
    const paramNames: string[] = [];
    const regexPath = path
      .replace(/:\w+/g, (match) => {
        paramNames.push(match.slice(1)); // ':id' -> 'id'
        return "([^/]+)";
      })
      .replace(/\//g, "\\/");

    const regex = new RegExp(`^${this.#baseUrl}${regexPath}$`);

    this.#routes.set(path, {
      regex,
      paramNames,
      handler,
    });
  }

  #findRoute(url = typeof window !== "undefined" ? window.location.pathname : "/") {
    let pathname: string;

    if (typeof window !== "undefined") {
      const urlObj = new URL(url, window.location.origin);
      pathname = urlObj.pathname;
    } else {
      // 서버 환경에서는 URL을 직접 파싱
      pathname = url.split("?")[0];
    }

    for (const [routePath, route] of this.#routes) {
      const match = pathname.match(route.regex);
      if (match) {
        // 매치된 파라미터들을 객체로 변환
        const params: StringRecord = {};
        route.paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });

        return {
          ...route,
          params,
          path: routePath,
        };
      }
    }
    return null;
  }

  push(url: string) {
    if (typeof window === "undefined") {
      // 서버 환경에서는 히스토리 조작 없이 라우트만 설정
      this.#route = this.#findRoute(url);
      this.#observer.notify();
      return;
    }

    try {
      // baseUrl이 없으면 자동으로 붙여줌
      const fullUrl = url.startsWith(this.#baseUrl) ? url : this.#baseUrl + (url.startsWith("/") ? url : "/" + url);

      const prevFullUrl = `${window.location.pathname}${window.location.search}`;

      // 히스토리 업데이트
      if (prevFullUrl !== fullUrl) {
        window.history.pushState(null, "", fullUrl);
      }

      this.#route = this.#findRoute(fullUrl);
      this.#observer.notify();
    } catch (error) {
      console.error("라우터 네비게이션 오류:", error);
    }
  }

  start() {
    this.#route = this.#findRoute();
    this.#observer.notify();
  }

  // 서버 사이드에서 현재 경로를 설정하는 메서드
  setCurrentPath(path: string) {
    // 서버 환경에서는 window가 없으므로 직접 route를 설정
    this.#route = this.#findRouteForPath(path);
    this.#observer.notify();
  }

  // 서버 사이드에서 쿼리 파라미터를 설정하는 메서드
  setServerQuery(query: StringRecord) {
    this.#serverQuery = query;
    this.#observer.notify();
  }

  // 서버 사이드에서 경로를 찾는 헬퍼 메서드
  #findRouteForPath(path: string): (Route<Handler> & { params: StringRecord; path: string }) | null {
    for (const [routePath, route] of this.#routes) {
      const match = path.match(route.regex);
      if (match) {
        const params: StringRecord = {};
        route.paramNames.forEach((name, i) => {
          params[name] = match[i + 1];
        });

        return {
          ...route,
          params,
          path: routePath,
        };
      }
    }
    return null;
  }

  static parseQuery = (search = typeof window !== "undefined" ? window.location.search : "") => {
    const params = new URLSearchParams(search);
    const query: StringRecord = {};
    for (const [key, value] of params) {
      query[key] = value;
    }
    return query;
  };

  static stringifyQuery = (query: QueryPayload) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined && value !== "") {
        params.set(key, String(value));
      }
    }
    return params.toString();
  };

  static getUrl = (newQuery: QueryPayload, baseUrl = "") => {
    const currentQuery = Router.parseQuery();
    const updatedQuery = { ...currentQuery, ...newQuery };

    // 빈 값들 제거
    Object.keys(updatedQuery).forEach((key) => {
      if (updatedQuery[key] === null || updatedQuery[key] === undefined || updatedQuery[key] === "") {
        delete updatedQuery[key];
      }
    });

    const queryString = Router.stringifyQuery(updatedQuery);

    if (typeof window !== "undefined") {
      return `${baseUrl}${window.location.pathname.replace(baseUrl, "")}${queryString ? `?${queryString}` : ""}`;
    } else {
      // 서버 환경에서는 기본 URL 반환
      return `${baseUrl}/${queryString ? `?${queryString}` : ""}`;
    }
  };
}
