import { createObserver } from "./createObserver.ts";

export const createStorage = <T>(key: string, storage?: Storage) => {
  // 서버 환경에서는 localStorage가 없으므로 fallback 제공
  const storageProvider = storage || (typeof window !== "undefined" ? window.localStorage : null);

  let data: T | null = null;

  // 스토리지가 사용 가능할 때만 초기 데이터 로드
  if (storageProvider) {
    try {
      data = JSON.parse(storageProvider.getItem(key) ?? "null");
    } catch (error) {
      console.error(`Error parsing storage item for key "${key}":`, error);
      data = null;
    }
  }

  const { subscribe, notify } = createObserver();

  const get = () => data;

  const set = (value: T) => {
    try {
      data = value;
      if (storageProvider) {
        storageProvider.setItem(key, JSON.stringify(data));
      }
      notify();
    } catch (error) {
      console.error(`Error setting storage item for key "${key}":`, error);
    }
  };

  const reset = () => {
    try {
      data = null;
      if (storageProvider) {
        storageProvider.removeItem(key);
      }
      notify();
    } catch (error) {
      console.error(`Error removing storage item for key "${key}":`, error);
    }
  };

  return { get, set, reset, subscribe };
};
