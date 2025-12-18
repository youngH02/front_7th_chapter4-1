/**
 * 서버 사이드 라우터
 * - window, document 없이 동작
 * - URL 문자열을 받아서 매칭된 라우트 반환
 */

export class ServerRouter {
  #routes;
  #baseUrl;

  constructor(baseUrl = "") {
    this.#routes = new Map();
    this.#baseUrl = baseUrl.replace(/\/$/, "");
  }

  /**
   * 라우트 등록
   * @param {string} path - 경로 패턴 (예: "/product/:id/")
   * @param {Function} handler - 라우트 핸들러 (페이지 컴포넌트)
   */
  addRoute(path, handler) {
    // 클라이언트 Router.js의 addRoute 로직 복사
    // 1. :id 같은 파라미터를 정규식으로 변환
    // 2. paramNames 배열에 파라미터 이름 저장
    // 3. regex와 handler를 Map에 저장

    const paramNames = [];
    const regexPath = path
      .replace(/:\w+/g, (match) => {
        // ':id' -> 'id'
        paramNames.push(match.slice(1));
        // 정규식 패턴으로 변환: 슬래시가 아닌 문자들 매칭
        return "([^/]+)";
      })
      .replace(/\//g, "\\/"); // 슬래시 이스케이프

    const regex = new RegExp(`^${this.#baseUrl}${regexPath}$`);

    this.#routes.set(path, {
      regex,
      paramNames,
      handler,
    });
  }

  /**
   * URL 매칭
   * @param {string} url - 매칭할 URL (예: "/product/123/")
   * @returns {Object|null} 매칭된 라우트 또는 null
   */
  match(url) {
    // 클라이언트 Router.js의 #findRoute 로직 복사
    // 차이점: window.location 대신 매개변수로 받은 url 사용

    // URL에서 pathname 추출 (쿼리 스트링 제거)
    const pathname = url.split("?")[0];

    // 등록된 모든 라우트를 순회하며 매칭
    for (const [routePath, route] of this.#routes) {
      const match = pathname.match(route.regex);

      if (match) {
        // 매칭된 파라미터들을 객체로 변환
        const params = {};
        route.paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });

        return {
          handler: route.handler,
          params,
          path: routePath,
        };
      }
    }

    return null; // 매칭되는 라우트 없음
  }

  /**
   * 쿼리 파라미터를 객체로 파싱
   * @param {string} search - 쿼리 스트링 (예: "?search=맥북&limit=20")
   * @returns {Object} 파싱된 쿼리 객체
   */
  static parseQuery(search) {
    // 클라이언트 Router.js의 parseQuery 로직 복사
    // 차이점: window.location.search 대신 매개변수 사용

    if (!search || search === "") {
      return {};
    }

    const params = new URLSearchParams(search);
    const query = {};

    for (const [key, value] of params) {
      query[key] = value;
    }

    return query;
  }
}
